import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Trash2, 
  X, 
  Check, 
  AlertTriangle, 
  ShieldAlert,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { ApiService } from '../../services/api';

export default function ProfileModal({ isOpen, onClose, authUser, onProfileUpdated, onAccountDeleted }) {
  if (!isOpen || !authUser) return null;

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'danger'
  const [name, setName] = useState(authUser.name || '');
  const [email, setEmail] = useState(authUser.email || '');
  const [mobile, setMobile] = useState(authUser.mobile || '');
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Account deletion state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (activeTab === 'security' && newPassword) {
      if (newPassword.length < 4) {
        setError('New password must be at least 4 characters.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);
    const res = await ApiService.updateProfile(authUser.id, {
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      newPassword: activeTab === 'security' ? newPassword : ''
    });
    setIsLoading(false);

    if (res.success && res.user) {
      setSuccess('Profile updated successfully!');
      if (onProfileUpdated) onProfileUpdated(res.user);
      setTimeout(() => {
        setSuccess('');
        if (activeTab === 'security') {
          setNewPassword('');
          setConfirmNewPassword('');
        }
      }, 2000);
    } else {
      setError(res.message || 'Failed to update profile.');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (deleteConfirmText.toLowerCase() !== 'delete') {
      setError('Please type DELETE in capital letters to confirm account removal.');
      return;
    }

    if (!window.confirm('Are you absolutely sure? All your entities, invoices, clients, and cloud data will be permanently wiped.')) {
      return;
    }

    setIsLoading(true);
    const res = await ApiService.deleteAccount(authUser.id, deletePassword);
    setIsLoading(false);

    if (res.success) {
      alert('Your account and all associated cloud data have been deleted.');
      if (onAccountDeleted) onAccountDeleted();
    } else {
      setError(res.message || 'Could not delete account. Please verify your password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-white border border-slate-700">
              {authUser.name ? authUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Account & Profile Settings</h2>
              <p className="text-[11px] text-slate-400">Manage your credentials and workspace account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 border-slate-900 shadow-2xs'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Profile Info
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer ${
              activeTab === 'security'
                ? 'bg-white text-slate-900 border-slate-900 shadow-2xs'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Change Password
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('danger'); setError(''); setSuccess(''); }}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer ${
              activeTab === 'danger'
                ? 'bg-white text-rose-600 border-rose-600 shadow-2xs'
                : 'text-slate-500 border-transparent hover:text-rose-600'
            }`}
          >
            Delete Account
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <Check size={14} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: PROFILE INFO */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name / Firm Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email ID
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@firm.com"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Save size={13} />
                  <span>{isLoading ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full pl-8 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Save size={13} />
                  <span>{isLoading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DELETE ACCOUNT */}
          {activeTab === 'danger' && (
            <form onSubmit={handleDeleteAccount} className="space-y-3.5">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <ShieldAlert size={15} />
                  <span>Warning: Permanent Deletion</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Deleting your account will permanently wipe your user profile, all entities, invoices, clients, proposals, and remove your data from Hostinger cloud storage. This cannot be undone.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Type <strong className="text-rose-600 font-mono">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Enter Your Current Password:
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your account password"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || deleteConfirmText.toLowerCase() !== 'delete'}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  <Trash2 size={13} />
                  <span>{isLoading ? 'Deleting...' : 'Delete My Account Permanently'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
