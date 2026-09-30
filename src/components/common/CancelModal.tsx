import React, { useState } from 'react';
import { X, AlertCircle, Trash2, Clock } from 'lucide-react';
import { Experience } from '../../types';
import { formatISTDateTime } from '../../utils/dateUtils';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: Experience;
  isWaitlisted?: boolean;
  onConfirm: () => Promise<void>;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  experience,
  isWaitlisted = false,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Confirm Registration Cancellation</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5">
          <p className="text-xs text-slate-700 leading-relaxed">
            Are you sure you wish to relinquish your {isWaitlisted ? 'waitlist spot' : 'confirmed registration'} for{' '}
            <strong className="text-slate-900">{experience.title}</strong> ({experience.organization}) on <strong>{experience.date}</strong>?
          </p>

          {(experience as any).registrationDeadline && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <Clock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              <span>Registration / Cancellation Deadline: <strong>{formatISTDateTime((experience as any).registrationDeadline)}</strong></span>
            </div>
          )}

          {!isWaitlisted && (
            <div className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-900 border border-amber-200 leading-relaxed">
              <strong>Automated Waitlist Promotion:</strong> If you cancel before the deadline, the system will immediately promote the <strong>#1 Waitlisted Student</strong> to this slot and issue their boarding credentials. After the deadline, the waitlist freezes.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Retain Registration
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
};
