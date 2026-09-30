import React, { useState } from 'react';
import { X, CheckCircle2, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface ChangePhoneModalProps {
  onClose: () => void;
  onSuccess: (newPhone: string) => void;
}

export const ChangePhoneModal: React.FC<ChangePhoneModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<'ENTER_PHONE' | 'VERIFY_OTP'>('ENTER_PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      await api.sendPhoneOtp(phone);
      setStep('VERIFY_OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError(null);
    try {
      await api.verifyPhoneOtp(phone, otp);
      onSuccess(phone);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2 text-[#0B2545]">
            <Phone className="h-5 w-5" />
            <h3 className="font-bold text-slate-900">Change Phone Number</h3>
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

          {step === 'ENTER_PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5 text-sm">
                <label className="font-semibold text-slate-700 block">New Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full rounded-lg bg-[#0B2545] py-2.5 text-sm font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5 text-sm">
                <label className="font-semibold text-slate-700 block">Enter Verification Code</label>
                <p className="text-[11px] text-slate-500 mb-2">Code sent to {phone}</p>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 text-center text-lg tracking-widest focus:border-[#0B2545] focus:outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !otp}
                className="w-full rounded-lg bg-[#0B2545] py-2.5 text-sm font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify OTP & Update'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('ENTER_PHONE'); setOtp(''); setError(null); }}
                className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 text-center"
              >
                Request a new code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
