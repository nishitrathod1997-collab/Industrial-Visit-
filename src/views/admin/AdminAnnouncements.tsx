import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle2,
  Radio,
  Calendar,
  Building2,
  Users,
  X,
} from 'lucide-react';

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [experienceId, setExperienceId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annRes, expRes] = await Promise.all([
        api.getAdminAnnouncements(),
        api.getExperiences(),
      ]);
      setAnnouncements(annRes);
      setExperiences(expRes);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAdminAnnouncement({
        title,
        message,
        experienceId: experienceId || undefined,
        targetAudience: experienceId ? 'VISIT_STUDENTS' : 'ALL_STUDENTS',
      });
      setShowModal(false);
      setTitle('');
      setMessage('');
      setExperienceId('');
      setActionSuccess('Announcement broadcasted to student notification streams successfully.');
      await loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to broadcast announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.deleteAdminAnnouncement(id);
      setActionSuccess('Announcement deleted.');
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-50 border border-blue-200 text-[#0B2545] px-2.5 py-0.5 text-[10px] font-bold">
              COMMUNICATIONS & BROADCAST
            </span>
            <span className="text-xs text-slate-500 font-medium">{announcements.length} Active Notices</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Campus-Wide Announcements & Visit Directives
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish institutional advisories, itinerary adjustments, and logistics bulletins to student notification streams.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="h-4 w-4 text-amber-400" />
          <span>New Broadcast Notice</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No active broadcast announcements.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-[#0B2545] transition-all"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2.5 py-0.5 text-[10px] font-bold border ${
                      ann.experienceId
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-blue-50 text-[#0B2545] border-blue-200'
                    }`}
                  >
                    {ann.experienceId ? `Visit: ${ann.experienceTitle}` : 'Campus-Wide Broadcast'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(ann.createdAt).toLocaleDateString()} at {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{ann.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.message}</p>

                <div className="text-[11px] text-slate-400 pt-1">
                  Author: <span className="font-semibold text-slate-700">{ann.authorName}</span> ({ann.authorRole})
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete Announcement"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[#0B2545]" />
                <h3 className="text-base font-bold text-slate-900">Broadcast Campus Announcement</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Target Audience</label>
                <select
                  value={experienceId}
                  onChange={(e) => setExperienceId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
                >
                  <option value="">All Students (University-Wide Broadcast)</option>
                  {experiences.map((e) => (
                    <option key={e.id} value={e.id}>
                      Specific Visit: {e.title} ({e.organization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Announcement Headline</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bus Bay Logistics Adjustment for Siemens Tour"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Detailed Directive Message</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter clear instructions, timing updates, or PPE requirements..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#0B2545] px-4 py-2 font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {submitting ? 'Broadcasting...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
