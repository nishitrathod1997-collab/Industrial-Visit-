import React, { useState } from 'react';
import { X, FileText, AlertTriangle, Send, Paperclip, CheckCircle2, Trash2 } from 'lucide-react';
import { Experience, LeaveCategory, SupportingDocument } from '../../types';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: Experience;
  onSubmit: (reason: string, category: LeaveCategory, document: SupportingDocument | null) => Promise<void>;
}

const LEAVE_CATEGORIES: LeaveCategory[] = [
  'Medical Leave',
  'Family Event',
  'Academic',
  'Competition',
  'Personal Work',
];

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  experience,
  onSubmit,
}) => {
  const [category, setCategory] = useState<LeaveCategory>('Medical Leave');
  const [reason, setReason] = useState<string>('');
  const [supportingDoc, setSupportingDoc] = useState<SupportingDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSupportingDoc({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      });
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please specify a detailed reason for your leave petition.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmit(reason.trim(), category, supportingDoc);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#0B2545] font-bold">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Submit Leave & Exemption Petition</h3>
              <p className="text-[11px] text-slate-500">Official Industrial Visit Absence Request</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target Industrial Visit Display */}
          <div className="rounded-xl bg-blue-50/70 p-3.5 text-xs border border-blue-200/80 space-y-1">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
              Applying For Industrial Visit:
            </span>
            <div className="font-bold text-slate-900 text-sm">{experience.title}</div>
            <div className="text-slate-600 flex flex-wrap items-center gap-2 pt-0.5">
              <span>Host: <strong className="text-[#0B2545]">{experience.organization}</strong></span>
              <span>•</span>
              <span>Date: <strong>{experience.date}</strong></span>
              {experience.location && (
                <>
                  <span>•</span>
                  <span>Location: <strong>{experience.location}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Leave Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as LeaveCategory)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
              required
            >
              {LEAVE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Leave */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="State the clear circumstances for your exemption (e.g., scheduled university lab examination, medical illness, academic competition participation)..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
              required
            />
          </div>

          {/* Supporting Document (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Supporting Document <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            {supportingDoc ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 block truncate">{supportingDoc.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {supportingDoc.size ? `${(supportingDoc.size / 1024).toFixed(1)} KB` : 'Attached file'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSupportingDoc(null)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-2 cursor-pointer"
                  title="Remove document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-[#0B2545] rounded-xl bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-colors text-center">
                <Paperclip className="h-5 w-5 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-[#0B2545]">Upload medical certificate or academic proof</span>
                <span className="text-[10px] text-slate-500 mt-0.5">PDF, PNG, JPG up to 10MB</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Institutional Note */}
          <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Exemption requests are routed directly to your assigned Faculty Coordinator for verification and department dossier compliance.
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              {loading ? 'Submitting Petition...' : 'Submit Leave Petition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
