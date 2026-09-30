import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChangePhoneModal } from '../../components/common/ChangePhoneModal';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { CheckCircle2, User, Mail, Shield, Phone } from 'lucide-react';

export const AdminProfile: React.FC<{ isEditing?: boolean }> = ({ isEditing: defaultEditing = false }) => {
  const { user, updateProfile } = useAuth();
  
  const adminName = user?.name || 'Administrator';
  const adminEmail = user?.email || 'admin@vit.edu.in';
  const adminRole = user?.role || 'ADMIN';
  
  const [isEditing, setIsEditing] = useState(defaultEditing);
  const [formName, setFormName] = useState(adminName);
  const [formPhone, setFormPhone] = useState('+91 9876543210');
  const [formDept, setFormDept] = useState('Central Administration');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    setIsEditing(defaultEditing);
  }, [defaultEditing]);

  useEffect(() => {
    if (user) {
      setFormName(user.name);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: formName, department: formDept, phone: formPhone });
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError('Unable to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <p className="text-sm font-medium">Unable to load profile</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-xs font-bold text-blue-600 hover:underline">Try Again</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage your personal account settings and preferences.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer"
          >
            Edit Profile
          </button>
        )}
      </div>

      {saved && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2 shadow-2xs">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs text-center flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-[#0B2545] text-white flex items-center justify-center text-3xl font-bold border-4 border-blue-50 shadow-sm mb-4">
              {getInitials(user.name)}
            </div>
            <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              <Shield className="h-3.5 w-3.5" />
              <span>{adminRole === 'ADMIN' ? 'Administrator' : adminRole}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              <span>{adminEmail}</span>
            </div>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account Status</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Active</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Last Login</span>
                <span className="font-medium text-slate-900">Today, 08:30 AM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            {isEditing ? (
              <div className="space-y-5">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Account Security</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h5 className="font-bold text-slate-900 mb-1">Phone Number</h5>
                      <p className="text-xs text-slate-500 mb-3">Update your registered phone number via OTP verification.</p>
                      <button onClick={() => setShowPhoneModal(true)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors">
                        Change Phone Number
                      </button>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <h5 className="font-bold text-slate-900 mb-1">Password</h5>
                      <p className="text-xs text-slate-500 mb-3">Update your account password. Requires current password.</p>
                      <button onClick={() => setShowPasswordModal(true)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer transition-colors">
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex items-center justify-end border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#133E87] rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">{adminEmail}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department / Unit</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">{formDept}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">{formPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPhoneModal && (
        <ChangePhoneModal 
          onClose={() => setShowPhoneModal(false)} 
          onSuccess={(newPhone) => {
            setFormPhone(newPhone);
            setShowPhoneModal(false);
            if (user) {
              updateProfile({ phone: newPhone });
            }
          }} 
        />
      )}
      {showPasswordModal && (
        <ChangePasswordModal 
          onClose={() => setShowPasswordModal(false)} 
          onSuccess={() => setShowPasswordModal(false)} 
        />
      )}
    </div>
  );
};