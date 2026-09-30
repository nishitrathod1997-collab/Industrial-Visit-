import React, { useState } from 'react';
import { Save, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

export const AdminSystemSettings: React.FC = () => {
  const [minAttendance, setMinAttendance] = useState(85);
  const [defaultWaitlistCapacity, setDefaultWaitlistCapacity] = useState(20);
  const [autoPromotion, setAutoPromotion] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System & Institutional Policies</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure university-wide rules for eligibility evaluation, waitlist queue dispatch, and attendance thresholds
        </p>
      </div>

      {saved && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>System configuration parameters saved and applied across all modules.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 text-xs">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0B2545]" />
            <span>Academic Standing Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimum Mandatory Attendance Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={minAttendance}
                onChange={(e) => setMinAttendance(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Default university standard is 85% for eligibility.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Waitlist Capacity per Experience
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={defaultWaitlistCapacity}
                onChange={(e) => setDefaultWaitlistCapacity(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Maximum queued waitlist spots per visit.
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span>Automated Queue Execution</span>
          </h3>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 text-xs">Automatic Instant Waitlist Promotion</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Automatically allocate confirmed seat to #1 waitlist student immediately upon any registration cancellation.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoPromotion}
              onChange={(e) => setAutoPromotion(e.target.checked)}
              className="h-5 w-5 rounded accent-[#0B2545] cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer"
          >
            <Save className="h-4 w-4 text-amber-400" />
            <span>Save Policies</span>
          </button>
        </div>
      </form>
    </div>
  );
};
