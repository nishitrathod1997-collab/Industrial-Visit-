import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Shield, Key, Sliders, CheckCircle2 } from 'lucide-react';

export const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your preferences and security options.</p>
      </div>

      {saved && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                <span className="text-sm text-slate-700 font-medium">Email Notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={pushNotifs} onChange={(e) => setPushNotifs(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                <span className="text-sm text-slate-700 font-medium">Push Notifications</span>
              </label>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">Change Password</p>
                  <p className="text-xs text-slate-500">Update your account password</p>
                </div>
                <button type="button" className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                  Update
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">Add an extra layer of security</p>
                </div>
                <button type="button" disabled className="px-3 py-1.5 text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed">
                  Institution Managed
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="rounded-lg bg-[#0B2545] px-5 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer">
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
