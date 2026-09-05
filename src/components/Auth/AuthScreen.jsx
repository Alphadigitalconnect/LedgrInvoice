import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  UserPlus
} from 'lucide-react';
import LedgrLogo from '../common/LedgrLogo';
import { ApiService } from '../../services/api';

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your Mobile Number or Email ID.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }

      setIsLoading(true);
      const res = await ApiService.register(cleanId, password, name.trim());
      setIsLoading(false);

      if (res && res.success && res.user) {
        localStorage.setItem('invoicify_auth_user', JSON.stringify(res.user));
        localStorage.setItem('invoicify_admin_auth', 'authenticated');
        onAuthSuccess(res.user);
      } else {
        // Fallback local registration if server unreachable
        const fallbackUser = {
          id: 'usr_' + Date.now(),
          name: name.trim() || 'Account Owner',
          identifier: cleanId,
          email: cleanId.includes('@') ? cleanId : '',
          mobile: !cleanId.includes('@') ? cleanId : '',
          token: 'token_' + Date.now()
        };
        localStorage.setItem('invoicify_auth_user', JSON.stringify(fallbackUser));
        localStorage.setItem('invoicify_admin_auth', 'authenticated');
        onAuthSuccess(fallbackUser);
      }
    } else if (mode === 'login') {
      setIsLoading(true);
      let res = await ApiService.login(cleanId, password);
      
      // If login returned account not found, seamlessly auto-create the account on the fly!
      if (!res || !res.success) {
        if (!res?.message?.toLowerCase().includes('incorrect password')) {
          res = await ApiService.register(cleanId, password, '');
        }
      }
      setIsLoading(false);

      if (res && res.success && res.user) {
        localStorage.setItem('invoicify_auth_user', JSON.stringify(res.user));
        localStorage.setItem('invoicify_admin_auth', 'authenticated');
        onAuthSuccess(res.user);
      } else {
        if (res?.message?.toLowerCase().includes('incorrect password')) {
          setError('Incorrect password for this mobile/email. Please check your password or click Forgot Password.');
        } else {
          // Fallback auto-provision local session
          const autoUser = {
            id: 'usr_' + Date.now(),
            name: cleanId.includes('@') ? cleanId.split('@')[0] : 'User ' + cleanId.slice(-4),
            identifier: cleanId,
            email: cleanId.includes('@') ? cleanId : '',
            mobile: !cleanId.includes('@') ? cleanId : '',
            token: 'token_' + Date.now()
          };
          localStorage.setItem('invoicify_auth_user', JSON.stringify(autoUser));
          localStorage.setItem('invoicify_admin_auth', 'authenticated');
          onAuthSuccess(autoUser);
        }
      }
    } else if (mode === 'forgot') {
      if (password.length < 4) {
        setError('New password must be at least 4 characters long.');
        return;
      }

      setIsLoading(true);
      const res = await ApiService.resetPassword(cleanId, password);
      setIsLoading(false);

      if (res && res.success && res.user) {
        setSuccessMsg('Password updated successfully! Logging you in...');
        setTimeout(() => {
          localStorage.setItem('invoicify_auth_user', JSON.stringify(res.user));
          localStorage.setItem('invoicify_admin_auth', 'authenticated');
          onAuthSuccess(res.user);
        }, 800);
      } else {
        setError(res?.message || 'Could not reset password. Please verify your Mobile or Email.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 relative font-sans select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 relative z-10 space-y-6 animate-fadeIn">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-slate-900 shadow-xs">
            <LedgrLogo size={36} className="rounded-lg text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              LEDGR Portal
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-Entity Invoicing & Business Management
            </p>
          </div>
        </div>

        {/* Tab Switcher - Sign In vs Sign Up */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Header Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
            {mode === 'register' ? <UserPlus size={16} /> : <ShieldCheck size={16} />}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-900">
              {mode === 'login' && 'Account Sign In'}
              {mode === 'register' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Password'}
            </div>
            <p className="text-[11px] text-slate-500">
              {mode === 'login' && 'Enter your registered Mobile Number or Email and Password'}
              {mode === 'register' && 'Sign up with your Mobile / Email to access your private workspace'}
              {mode === 'forgot' && 'Set a new password for your Mobile or Email'}
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div className="space-y-1 text-left">
              <label className="block text-xs font-medium text-slate-700">
                Full Name / Firm Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CA Sushanth / SC & Associates"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="block text-xs font-medium text-slate-700">
              Mobile Number or Email ID *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                {identifier.includes('@') ? <Mail size={15} /> : <Phone size={15} />}
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                placeholder="e.g. 9876543210 or admin@scandassociates.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700">
                {mode === 'forgot' ? 'New Password *' : 'Password *'}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-900 font-medium cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={15} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password (min 4 characters)"
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1 text-left">
              <label className="block text-xs font-medium text-slate-700">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium space-y-1 text-left">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
              {mode === 'login' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-800 font-bold hover:underline cursor-pointer"
                  >
                    <UserPlus size={12} />
                    <span>Don't have an account? Click here to Sign Up</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition disabled:opacity-70 cursor-pointer shadow-2xs mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Sign Up & Get Started'}
                  {mode === 'forgot' && 'Update Password'}
                </span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium pt-1 cursor-pointer"
            >
              ← Back to Sign In
            </button>
          )}
        </form>
      </div>

      {/* Footer info */}
      <div className="mt-6 text-center text-xs text-slate-400 flex items-center gap-1.5">
        <span>Hosted securely on Hostinger</span>
        <span>•</span>
        <span>LEDGR Multi-Entity Invoicing</span>
      </div>
    </div>
  );
}
