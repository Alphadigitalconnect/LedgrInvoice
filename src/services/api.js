// Hostinger Cloud API Service for Auth and Data Sync

const API_BASE = '/api';

export const ApiService = {
  // Authentication: Register or Set Password
  async register(identifier, password, name) {
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, name })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('Backend API request failed, operating in offline mode:', e);
      // Local fallback
      return {
        success: true,
        offline: true,
        user: {
          id: 'local_user_' + Date.now(),
          name: name || 'Account Owner',
          email: identifier.includes('@') ? identifier : '',
          mobile: !identifier.includes('@') ? identifier : '',
          token: 'local_token_' + Date.now()
        }
      };
    }
  },

  // Authentication: Sign In
  async login(identifier, password) {
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('Backend API request failed, fallback to local check:', e);
      return {
        success: false,
        message: 'Could not connect to authentication server. Please check your network.'
      };
    }
  },

  // Authentication: Reset Password
  async resetPassword(identifier, newPassword) {
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, new_password: newPassword })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return {
        success: false,
        message: 'Failed to connect to server.'
      };
    }
  },

  // Sync / Save Data to Hostinger Cloud
  async syncToHostinger(payload, userId) {
    try {
      const res = await fetch(`${API_BASE}/data.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || 'default_user'
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.warn('Hostinger cloud sync error:', e);
      return { success: false, error: e.message };
    }
  },

  // Fetch Data from Hostinger Cloud
  async fetchFromHostinger(userId) {
    try {
      const res = await fetch(`${API_BASE}/data.php`, {
        headers: {
          'X-User-Id': userId || 'default_user'
        }
      });
      const json = await res.json();
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
