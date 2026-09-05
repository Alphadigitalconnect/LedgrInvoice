import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import LedgrLogo from '../common/LedgrLogo';

export default function AdminLogin({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Please enter the admin password');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (password === '1234') {
        localStorage.setItem('invoicify_admin_auth', 'authenticated');
        onLoginSuccess();
      } else {
        setError('Invalid password. Default password is: 1234');
        setIsLoading(false);
      }
    }, 250);
  };

  const handleQuickFill = () => {
    setPassword('1234');
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 relative font-sans select-none">
      {/* Login Card */}
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-8 relative z-10 space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-900 shadow-xs">
            <LedgrLogo size={36} className="rounded-lg text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              LEDGR Portal
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-Entity Invoicing & Management
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-900">
              Admin Authentication
            </div>
            <p className="text-[11px] text-slate-500">Enter your security PIN to access the workspace</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1 text-left">
            <label className="block text-xs font-medium text-slate-700">
              Admin Password / PIN
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound size={15} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password (1234)"
                autoFocus
                className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
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

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition disabled:opacity-70 cursor-pointer shadow-2xs"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Assist */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>PIN: <strong className="font-mono text-slate-900">1234</strong></span>
          <button
            type="button"
            onClick={handleQuickFill}
            className="text-slate-700 hover:text-slate-900 font-medium underline cursor-pointer text-xs"
          >
            Auto-fill
          </button>
        </div>

      </div>

      {/* Footer info */}
      <div className="mt-6 text-center text-xs text-slate-400">
        LEDGR Accounting & Multi-Entity Portal
      </div>
    </div>
  );
}
