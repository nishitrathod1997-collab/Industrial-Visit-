import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { api } from '../../services/api';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2 text-[#0B2545]">
            <Lock className="h-5 w-5" />
            <h3 className="font-bold text-slate-900">Change Password</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-sm">
              <label className="font-semibold text-slate-700 block">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-[#0B2545] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 text-sm">
              <label className="font-semibold text-slate-700 block">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-[#0B2545] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5 text-sm">
              <label className="font-semibold text-slate-700 block">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-[#0B2545] focus:outline-none"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              className="w-full rounded-lg bg-[#0B2545] py-2.5 text-sm font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
