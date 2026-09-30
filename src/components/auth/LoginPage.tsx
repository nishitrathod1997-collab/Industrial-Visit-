import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  X,
} from 'lucide-react';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setIdentifier('');
    setPassword('');
  };

  const handleQuickFill = (demoRole: UserRole) => {
    setSelectedRole(demoRole);
    setErrorMessage(null);
    setPassword('Password@123');
    if (demoRole === 'STUDENT') {
      setIdentifier('nishit.rathod@vit.edu.in');
    } else if (demoRole === 'FACULTY') {
      setIdentifier('arvind.swaminathan@vit.edu.in');
    } else {
      setIdentifier('admin@vit.edu.in');
    }
  };

  const validateInputs = (): boolean => {
    setErrorMessage(null);
    const cleanId = identifier.trim();

    if (!cleanId) {
      if (selectedRole === 'STUDENT') {
        setErrorMessage('Please enter your email address or roll number.');
      } else {
        setErrorMessage('Please enter your official college email address.');
      }
      return false;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return false;
    }

    // Role-specific validation logic
    if (selectedRole === 'STUDENT') {
      if (cleanId.includes('@')) {
        const domain = cleanId.split('@')[1]?.toLowerCase();
        if (domain !== 'vit.edu.in' && domain !== 'vit.ac.in') {
          setErrorMessage('Please use your VIT college email address (@vit.edu.in).');
          return false;
        }
      }
    } else if (selectedRole === 'FACULTY') {
      if (!cleanId.includes('@')) {
        setErrorMessage('Faculty login requires a valid official email address.');
        return false;
      }
      const domain = cleanId.split('@')[1]?.toLowerCase();
      if (domain !== 'vit.edu.in' && domain !== 'vit.ac.in') {
        setErrorMessage('Please use your official @vit.edu.in college email address.');
        return false;
      }
    } else if (selectedRole === 'ADMIN') {
      if (!cleanId.includes('@')) {
        setErrorMessage('Admin login requires a valid institutional email address.');
        return false;
      }
      const domain = cleanId.split('@')[1]?.toLowerCase();
      if (domain !== 'vit.edu.in' && domain !== 'vit.ac.in') {
        setErrorMessage('Please use your official @vit.edu.in college email address.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      await login({
        identifier: identifier.trim(),
        password,
        role: selectedRole,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);

    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your email or roll number.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.forgotPassword({
        identifier: forgotIdentifier.trim(),
        role: selectedRole,
      });
      setResetToken(res.resetToken);
      setForgotMessage(`Password reset code generated for ${res.userEmail}. Enter your new password below.`);
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.message || 'Account not found. Please verify your email or roll number.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);

    if (!newPassword) {
      setForgotError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.resetPassword({
        token: resetToken,
        newPassword,
      });
      setForgotMessage(res.message);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setPassword(newPassword);
        setForgotMessage(null);
      }, 2000);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-blue-600/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Institutional Top Header */}
      <header className="relative z-10 w-full border-b border-blue-900/60 bg-[#0B2545]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black tracking-wider shadow-lg border border-amber-300/40">
            <span className="text-base font-black">VIT</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              VIT Industrial Exposure
            </h1>
            <p className="text-xs text-blue-200 font-medium">
              Vidyalankar Institute of Technology • Experiential Learning Cell
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-full border border-blue-800 bg-[#133E87]/40 px-3 py-1 text-xs text-blue-200 font-medium">
          <Building2 className="h-3.5 w-3.5 text-amber-400" />
          <span>Unified Access Portal</span>
        </div>
      </header>

      {/* Main Form Centered Card Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-6">
          
          {/* Main Card */}
          <div className="rounded-2xl border border-blue-800/80 bg-[#0B2545] p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-500" />

            {/* Portal Branding Heading */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-blue-900/50 border border-blue-700/60 text-amber-400 mb-1">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Sign In to Your Portal
              </h2>
              <p className="text-xs sm:text-sm text-blue-200/80 font-normal">
                Select your institutional role to continue
              </p>
            </div>

            {/* Role Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-xl bg-[#133E87]/60 border border-blue-800 mb-6">
              <button
                type="button"
                onClick={() => handleRoleChange('STUDENT')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'STUDENT'
                    ? 'bg-blue-600 text-white shadow-md border border-blue-400/30'
                    : 'text-blue-200 hover:text-white hover:bg-blue-800/50'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('FACULTY')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'FACULTY'
                    ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/30'
                    : 'text-blue-200 hover:text-white hover:bg-blue-800/50'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'ADMIN'
                    ? 'bg-amber-600 text-white shadow-md border border-amber-400/30'
                    : 'text-blue-200 hover:text-white hover:bg-blue-800/50'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin</span>
              </button>
            </div>

            {/* Form Validation Error Banner */}
            {errorMessage && (
              <div className="mb-5 rounded-xl border border-rose-500/50 bg-rose-950/50 p-3.5 text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Active Role Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Identifier (Email / Roll Number depending on role) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider">
                  {selectedRole === 'STUDENT'
                    ? 'Email or Roll Number'
                    : selectedRole === 'FACULTY'
                    ? 'Faculty College Email'
                    : 'Administrator Email'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={
                      selectedRole === 'STUDENT'
                        ? 'nishit.rathod@vit.edu.in or 23EC001'
                        : selectedRole === 'FACULTY'
                        ? 'faculty.name@vit.edu.in'
                        : 'admin@vit.edu.in'
                    }
                    className="w-full rounded-xl border border-blue-700 bg-[#133E87]/50 px-3.5 py-2.5 text-sm text-white placeholder-blue-300/50 focus:border-amber-400 focus:bg-[#133E87] focus:outline-none transition-all"
                    required
                  />
                </div>
                {selectedRole === 'STUDENT' && (
                  <p className="text-[11px] text-blue-300/70 font-medium">
                    Enter your college email <span className="text-amber-300 font-mono">@vit.edu.in</span> or Roll No (e.g. <span className="text-amber-300 font-mono">23EC001</span>).
                  </p>
                )}
                {selectedRole !== 'STUDENT' && (
                  <p className="text-[11px] text-blue-300/70 font-medium">
                    Must use official college domain <span className="text-amber-300 font-mono">@vit.edu.in</span>.
                  </p>
                )}
              </div>

              {/* Field 2: Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotIdentifier(identifier);
                      setForgotError(null);
                      setForgotMessage(null);
                    }}
                    className="text-xs text-amber-300 hover:text-amber-200 font-medium hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-blue-700 bg-[#133E87]/50 pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-blue-300/50 focus:border-amber-400 focus:bg-[#133E87] focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors cursor-pointer p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 focus:outline-none transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Assistant Box */}
            <div className="mt-6 border-t border-blue-900/80 pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Demo Accounts (Auto-Fill)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <button
                  type="button"
                  onClick={() => handleQuickFill('STUDENT')}
                  className="rounded-lg border border-blue-700/60 bg-[#133E87]/40 p-2 text-left hover:bg-blue-800/80 hover:border-amber-400/50 transition-all cursor-pointer"
                >
                  <p className="text-[11px] font-bold text-white">Student Demo</p>
                  <p className="text-[10px] text-blue-200/80 truncate">23EC001</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('FACULTY')}
                  className="rounded-lg border border-blue-700/60 bg-[#133E87]/40 p-2 text-left hover:bg-blue-800/80 hover:border-amber-400/50 transition-all cursor-pointer"
                >
                  <p className="text-[11px] font-bold text-white">Faculty Demo</p>
                  <p className="text-[10px] text-emerald-300/80 truncate">Dr. Arvind</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('ADMIN')}
                  className="rounded-lg border border-blue-700/60 bg-[#133E87]/40 p-2 text-left hover:bg-blue-800/80 hover:border-amber-400/50 transition-all cursor-pointer"
                >
                  <p className="text-[11px] font-bold text-white">Admin Demo</p>
                  <p className="text-[10px] text-amber-300/80 truncate">Dean Office</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 py-4 text-center text-xs text-blue-200/60 border-t border-blue-900/40 bg-[#0B2545]/40">
        © 2026 Vidyalankar Institute of Technology • All Rights Reserved
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-blue-800 bg-[#0B2545] p-6 shadow-2xl relative text-white">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotStep(1);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-blue-800/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Account Password Recovery</h3>
                <p className="text-xs text-blue-200/80">
                  {forgotStep === 1 ? 'Verify your identity to reset password' : 'Set your new password'}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 rounded-xl border border-rose-500/50 bg-rose-950/50 p-3 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotMessage && (
              <div className="mb-4 rounded-xl border border-emerald-500/50 bg-emerald-950/50 p-3 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>{forgotMessage}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider mb-1.5">
                    Email or Roll Number
                  </label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="Enter registered email or roll number"
                    className="w-full rounded-xl border border-blue-700 bg-[#133E87]/50 px-3.5 py-2.5 text-sm text-white placeholder-blue-300/50 focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-blue-700 text-xs font-bold text-blue-200 hover:bg-blue-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Searching...' : 'Continue'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-blue-700 bg-[#133E87]/50 pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-blue-300/50 focus:border-amber-400 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white p-1"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-100 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-blue-700 bg-[#133E87]/50 px-3.5 py-2.5 text-sm text-white placeholder-blue-300/50 focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-blue-700 text-xs font-bold text-blue-200 hover:bg-blue-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
