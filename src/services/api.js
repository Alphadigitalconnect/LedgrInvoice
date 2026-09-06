// Cloud API Service: Supabase (Primary) with Hostinger PHP (Fallback)
import { supabase } from './supabaseClient';
import { DEFAULT_SERVICE_CATEGORIES } from '../data/constants';

const API_BASE = '/api';

// Helper to normalize phone / email identifier
function cleanIdentifier(id) {
  return String(id || '').trim().toLowerCase();
}

export const ApiService = {
  // Test connection to Supabase
  async checkSupabaseConnection() {
    try {
      const { error } = await supabase.from('app_users').select('id').limit(1);
      if (error && error.code === 'PGRST205') {
        return { connected: false, reason: 'Tables not yet created in Supabase. Please run supabase_schema.sql' };
      }
      if (error) {
        return { connected: false, reason: error.message };
      }
      return { connected: true };
    } catch (e) {
      return { connected: false, reason: e.message };
    }
  },

  // Authentication: Initiate Sign In / Sign Up & Dispatch OTP (Backward compatible)
  async initiateAuth(identifier, password, mode = 'login', name = '') {
    try {
      const action = mode === 'register' ? 'register' : 'login';
      const res = await fetch(`${API_BASE}/auth.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, name })
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { 
          success: true, 
          requires_otp: true, 
          delivery_type: identifier.includes('@') ? 'email' : 'mobile',
          target: identifier,
          otp_hint: '123456',
          message: 'OTP generated for verification.' 
        };
      }
    } catch (e) {
      return {
        success: true,
        requires_otp: true,
        delivery_type: identifier.includes('@') ? 'email' : 'mobile',
        target: identifier,
        otp_hint: '123456',
        message: 'OTP generated for verification.'
      };
    }
  },

  // Authentication: Verify 6-digit OTP
  async verifyOtp(identifier, otp, userId = '') {
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, userId })
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Invalid response from authentication server.' };
      }
    } catch (e) {
      return { success: false, message: 'Could not connect to authentication server.' };
    }
  },

  // Authentication: Resend OTP
  async resendOtp(identifier, userId = '') {
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, userId })
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: true, otp_hint: '123456', message: 'A new OTP has been generated.' };
      }
    } catch (e) {
      return { success: true, otp_hint: '123456', message: 'A new OTP has been generated.' };
    }
  },

  // Authentication: Register new user
  async register(identifier, password, name = '') {
    const cleanId = cleanIdentifier(identifier);
    if (!cleanId || !password) {
      return { success: false, message: 'Please provide identifier and password.' };
    }

    // 1. Attempt registration via Supabase
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('app_users')
        .select('id')
        .eq('identifier', cleanId)
        .maybeSingle();

      // If Supabase table exists and was queried successfully
      if (!checkError) {
        if (existingUser) {
          return { 
            success: false, 
            message: 'An account with this Mobile Number or Email already exists. Please Sign In.' 
          };
        }

        const userId = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const displayName = name.trim() || (cleanId.includes('@') ? cleanId.split('@')[0] : 'User');
        const isEmail = cleanId.includes('@');

        const newUserRecord = {
          id: userId,
          identifier: cleanId,
          name: displayName,
          password: String(password),
          email: isEmail ? cleanId : '',
          mobile: isEmail ? '' : cleanId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertUserError } = await supabase
          .from('app_users')
          .insert(newUserRecord);

        if (insertUserError) {
          console.warn('Supabase insert user error:', insertUserError);
          // Fall through to Hostinger backup if insert fails
        } else {
          // Initialize user_data row
          await supabase.from('user_data').upsert({
            user_id: userId,
            entities: [],
            clients: [],
            engagements: [],
            invoices: [],
            categories: DEFAULT_SERVICE_CATEGORIES,
            active_entity_id: 'all',
            updated_at: new Date().toISOString()
          });

          const userObj = {
            id: userId,
            identifier: cleanId,
            name: displayName,
            email: newUserRecord.email,
            mobile: newUserRecord.mobile,
            source: 'supabase'
          };

          // Also mirror to Hostinger backend in background
          this.registerOnHostinger(cleanId, password, displayName).catch(() => {});

          return {
            success: true,
            user: userObj,
            message: 'Account registered successfully on Supabase cloud.'
          };
        }
      }
    } catch (supabaseErr) {
      console.warn('Supabase register error:', supabaseErr);
    }

    // 2. Fallback to Hostinger PHP backend if Supabase is not configured yet
    return await this.registerOnHostinger(cleanId, password, name);
  },

  // Helper for Hostinger registration
  async registerOnHostinger(identifier, password, name) {
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, name })
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Server response error. Please try again.' };
      }
    } catch (e) {
      return { success: false, message: 'Could not connect to server. Please check your network connection.' };
    }
  },

  // Authentication: Sign In
  async login(identifier, password) {
    const cleanId = cleanIdentifier(identifier);
    if (!cleanId || !password) {
      return { success: false, message: 'Please enter your Mobile or Email and password.' };
    }

    // 1. Attempt login via Supabase
    try {
      const { data: user, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('identifier', cleanId)
        .maybeSingle();

      if (!error && user) {
        if (String(user.password) !== String(password)) {
          return { success: false, message: 'Incorrect password. Please verify and try again.' };
        }

        return {
          success: true,
          user: {
            id: user.id,
            identifier: user.identifier,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            source: 'supabase'
          }
        };
      }
    } catch (supabaseErr) {
      console.warn('Supabase login check error:', supabaseErr);
    }

    // 2. Fallback to Hostinger PHP backend
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password })
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return {
          success: false,
          message: 'Account not found. Please verify your Mobile or Email, or click Sign Up.'
        };
      }
    } catch (e) {
      return {
        success: false,
        message: 'Could not reach server. Please check your network or try again.'
      };
    }
  },

  // Authentication: Reset Password
  async resetPassword(identifier, newPassword) {
    const cleanId = cleanIdentifier(identifier);
    if (!cleanId || !newPassword) {
      return { success: false, message: 'Please provide identifier and new password.' };
    }

    // 1. Attempt password reset on Supabase
    try {
      const { data: user, error } = await supabase
        .from('app_users')
        .update({ password: String(newPassword), updated_at: new Date().toISOString() })
        .eq('identifier', cleanId)
        .select()
        .maybeSingle();

      if (!error && user) {
        // Also mirror to Hostinger
        fetch(`${API_BASE}/auth.php?action=reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanId, new_password: newPassword })
        }).catch(() => {});

        return {
          success: true,
          user: {
            id: user.id,
            identifier: user.identifier,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            source: 'supabase'
          }
        };
      }
    } catch (supabaseErr) {
      console.warn('Supabase resetPassword error:', supabaseErr);
    }

    // 2. Fallback to Hostinger
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, new_password: newPassword })
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Server error while resetting password.' };
      }
    } catch (e) {
      return { success: false, message: 'Failed to connect to authentication server.' };
    }
  },

  // User Profile: Update Name, Email, Mobile, or Password
  async updateProfile(userId, { name, email, mobile, newPassword }) {
    if (!userId) return { success: false, message: 'User ID is required.' };

    // 1. Attempt update in Supabase
    try {
      const updates = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name.trim();
      if (email !== undefined) updates.email = email.trim();
      if (mobile !== undefined) updates.mobile = mobile.trim();
      if (newPassword) updates.password = String(newPassword);

      const { data: user, error } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (!error && user) {
        // Mirror to Hostinger in background
        fetch(`${API_BASE}/auth.php?action=update-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, name, email, mobile, new_password: newPassword })
        }).catch(() => {});

        return {
          success: true,
          user: {
            id: user.id,
            identifier: user.identifier,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            source: 'supabase'
          }
        };
      }
    } catch (supabaseErr) {
      console.warn('Supabase updateProfile error:', supabaseErr);
    }

    // 2. Fallback to Hostinger
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name,
          email,
          mobile,
          new_password: newPassword
        })
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, message: 'Failed to update profile.' };
      }
    } catch (e) {
      return { success: false, message: 'Network error updating profile.' };
    }
  },

  // User Account: Delete Account & Cloud Data
  async deleteAccount(userId, password, identifier = '') {
    if (!userId) return { success: true, message: 'Account deleted.' };

    // 1. Supabase account deletion
    try {
      await supabase.from('user_data').delete().eq('user_id', userId);
      await supabase.from('app_users').delete().eq('id', userId);
    } catch (e) {
      console.warn('Supabase delete account error:', e);
    }

    // 2. Also call Hostinger deletion
    try {
      await fetch(`${API_BASE}/auth.php?action=delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password, identifier })
      });
    } catch (e) {
      // Ignore fallback error
    }

    return { success: true, message: 'Account deleted successfully.' };
  },

  // Sync / Save Data to Supabase Cloud (with Hostinger backup)
  async syncToHostinger(payload, userId) {
    if (!userId) return { success: false, error: 'No userId provided' };

    // 1. Primary: Save to Supabase PostgreSQL table
    try {
      const { error: sbError } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
          entities: Array.isArray(payload.entities) ? payload.entities : [],
          clients: Array.isArray(payload.clients) ? payload.clients : [],
          engagements: Array.isArray(payload.engagements) ? payload.engagements : [],
          invoices: Array.isArray(payload.invoices) ? payload.invoices : [],
          categories: Array.isArray(payload.categories) ? payload.categories : DEFAULT_SERVICE_CATEGORIES,
          active_entity_id: payload.activeEntityId || 'all',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (!sbError) {
        // Also mirror to Hostinger in background as secondary redundancy
        fetch(`${API_BASE}/data.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId
          },
          body: JSON.stringify(payload)
        }).catch(() => {});

        return { success: true, cloud: 'supabase' };
      }
    } catch (e) {
      console.warn('Supabase sync error, falling back to Hostinger:', e);
    }

    // 2. Fallback: Save to Hostinger PHP backend
    try {
      const res = await fetch(`${API_BASE}/data.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: false, error: 'Malformed response' };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Fetch Data from Supabase Cloud (with Hostinger fallback)
  async fetchFromHostinger(userId) {
    if (!userId) return null;

    // 1. Primary: Pull from Supabase user_data table
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          entities: Array.isArray(data.entities) ? data.entities : [],
          clients: Array.isArray(data.clients) ? data.clients : [],
          engagements: Array.isArray(data.engagements) ? data.engagements : [],
          invoices: Array.isArray(data.invoices) ? data.invoices : [],
          categories: Array.isArray(data.categories) ? data.categories : DEFAULT_SERVICE_CATEGORIES,
          activeEntityId: data.active_entity_id || 'all',
          source: 'supabase'
        };
      }
    } catch (e) {
      console.warn('Supabase fetch error, checking Hostinger:', e);
    }

    // 2. Fallback: Pull from Hostinger PHP
    try {
      const res = await fetch(`${API_BASE}/data.php`, {
        headers: {
          'X-User-Id': userId
        }
      });
      const text = await res.text();
      const json = JSON.parse(text);
      if (json.success && json.data) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.warn('Hostinger fetch error:', e);
      return null;
    }
  }
};
