import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  EmailNotification,
  EmailDeliveryStats,
  SecurityRecipient,
  TripReminderRecord,
  PreTripReminderDispatchResult,
} from '../../types';
import {
  Mail,
  MailCheck,
  MailX,
  RefreshCw,
  Search,
  Filter,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield,
  Eye,
  Info,
  Building2,
  Calendar,
  Sparkles,
  Bell,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Play,
  Check,
  X,
  MapPin,
  Users,
  FileText,
  Radio,
  Sliders,
  CheckCircle,
} from 'lucide-react';

export const AdminEmailDeliveryLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'REMINDERS' | 'SECURITY'>('LOGS');

  // =========================================================================
  // TAB 1: EMAIL TRANSMISSIONS & LOGS
  // =========================================================================
  const [logs, setLogs] = useState<EmailNotification[]>([]);
  const [stats, setStats] = useState<EmailDeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');

  // Test Email State
  const [testEmailAddress, setTestEmailAddress] = useState('nishitrathod010@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null);

  // Retrying State
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryingAll, setRetryingAll] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<EmailNotification | null>(null);

  // =========================================================================
  // TAB 2: AUTOMATED 3-DAY PRE-TRIP REMINDER SYSTEM
  // =========================================================================
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [reminderHistory, setReminderHistory] = useState<TripReminderRecord[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [runningScheduler, setRunningScheduler] = useState(false);
  const [schedulerRunResult, setSchedulerRunResult] = useState<any>(null);

  // Trip Preview Modal State
  const [previewModalTripId, setPreviewModalTripId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingTripReminderId, setSendingTripReminderId] = useState<string | null>(null);
  const [tripDispatchResult, setTripDispatchResult] = useState<PreTripReminderDispatchResult | null>(null);

  // =========================================================================
  // TAB 3: SECURITY GATE RECIPIENTS
  // =========================================================================
  const [securityRecipients, setSecurityRecipients] = useState<SecurityRecipient[]>([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<SecurityRecipient | null>(null);
  const [securityForm, setSecurityForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Campus Security & Gate Operations',
    gateLocation: 'Gate 2 - Transit & Bus Bay',
    notes: '',
    isActive: true,
  });
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    if (activeTab === 'LOGS') {
      loadLogsData();
    } else if (activeTab === 'REMINDERS') {
      loadReminderData();
    } else if (activeTab === 'SECURITY') {
      loadSecurityData();
    }
  }, [activeTab, statusFilter, eventTypeFilter]);

  // Load Email Logs
  const loadLogsData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.getEmailLogs({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          eventType: eventTypeFilter === 'ALL' ? undefined : eventTypeFilter,
        }),
        api.getEmailDeliveryStats(),
      ]);
      setLogs(logsRes || []);
      setStats(statsRes || null);
    } catch (err) {
      console.error('Error loading email delivery logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Reminders Data
  const loadReminderData = async () => {
    setLoadingReminders(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        api.getReminderSchedulerStatus(),
        api.getReminderHistory(),
      ]);
      setSchedulerStatus(statusRes);
      setReminderHistory(historyRes || []);
    } catch (err) {
      console.error('Error loading reminder data:', err);
    } finally {
      setLoadingReminders(false);
    }
  };

  // Load Security Recipients
  const loadSecurityData = async () => {
    setLoadingSecurity(true);
    try {
      const res = await api.getSecurityRecipients();
      setSecurityRecipients(res || []);
    } catch (err) {
      console.error('Error loading security recipients:', err);
    } finally {
      setLoadingSecurity(false);
    }
  };

  // Trigger Scheduler Evaluation
  const handleRunSchedulerNow = async (forceTripId?: string) => {
    setRunningScheduler(true);
    setSchedulerRunResult(null);
    try {
      const res = await api.runReminderScheduler(forceTripId);
      setSchedulerRunResult(res);
      await loadReminderData();
      setActionMessage(res.message);
    } catch (err: any) {
      setActionMessage(`Scheduler error: ${err.message}`);
    } finally {
      setRunningScheduler(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Open Preview Modal for Trip 3-Day Reminders
  const handleOpenPreview = async (tripId: string) => {
    setPreviewModalTripId(tripId);
    setLoadingPreview(true);
    setPreviewData(null);
    setTripDispatchResult(null);
    try {
      const data = await api.getExperienceReminderPreview(tripId);
      setPreviewData(data);
    } catch (err: any) {
      console.error('Error fetching preview data:', err);
      setActionMessage(`Error loading preview: ${err.message}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Send 3-Day Reminders for a specific trip
  const handleSendTripReminder = async (tripId: string) => {
    setSendingTripReminderId(tripId);
    try {
      const res = await api.sendExperience3DayReminder(tripId, true);
      setTripDispatchResult(res);
      await loadReminderData();
      if (activeTab === 'LOGS') await loadLogsData();
      setActionMessage(`Successfully dispatched 3-day pre-trip reminders to ${res.totalEmailsSent} recipients!`);
    } catch (err: any) {
      setActionMessage(`Dispatch error: ${err.message}`);
    } finally {
      setSendingTripReminderId(null);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Security Recipients CRUD
  const handleOpenAddSecurity = () => {
    setEditingRecipient(null);
    setSecurityForm({
      name: '',
      email: '',
      phone: '',
      department: 'Campus Security & Gate Operations',
      gateLocation: 'Gate 2 - Transit & Bus Bay',
      notes: '',
      isActive: true,
    });
    setShowSecurityModal(true);
  };

  const handleOpenEditSecurity = (recipient: SecurityRecipient) => {
    setEditingRecipient(recipient);
    setSecurityForm({
      name: recipient.name,
      email: recipient.email,
      phone: recipient.phone || '',
      department: recipient.department || 'Campus Security & Gate Operations',
      gateLocation: recipient.gateLocation || 'Gate 2 - Transit & Bus Bay',
      notes: recipient.notes || '',
      isActive: recipient.isActive,
    });
    setShowSecurityModal(true);
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSecurity(true);
    try {
      if (editingRecipient) {
        await api.updateSecurityRecipient(editingRecipient.id, securityForm);
        setActionMessage(`Updated security recipient "${securityForm.name}"`);
      } else {
        await api.createSecurityRecipient(securityForm);
        setActionMessage(`Added security recipient "${securityForm.name}"`);
      }
      setShowSecurityModal(false);
      await loadSecurityData();
    } catch (err: any) {
      setActionMessage(`Error saving recipient: ${err.message}`);
    } finally {
      setSavingSecurity(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleDeleteSecurity = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove security recipient "${name}"?`)) return;
    try {
      await api.deleteSecurityRecipient(id);
      setActionMessage(`Deleted security recipient "${name}"`);
      await loadSecurityData();
    } catch (err: any) {
      setActionMessage(`Error deleting recipient: ${err.message}`);
    } finally {
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleToggleSecurityActive = async (recipient: SecurityRecipient) => {
    try {
      await api.updateSecurityRecipient(recipient.id, { isActive: !recipient.isActive });
      await loadSecurityData();
    } catch (err: any) {
      setActionMessage(`Error toggling status: ${err.message}`);
    }
  };

  // Test Email handler
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await api.sendTestNotificationEmail(testEmailAddress);
      setTestResult(res);
      await loadLogsData();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to dispatch test verification email.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleRetrySingle = async (id: string) => {
    setRetryingId(id);
    setActionMessage(null);
    try {
      const res = await api.retryEmailLog(id);
      setActionMessage(res.message);
      await loadLogsData();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message || 'Failed to retry email'}`);
    } finally {
      setRetryingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleRetryAll = async () => {
    setRetryingAll(true);
    setActionMessage(null);
    try {
      const res = await api.retryAllFailedEmails();
      setActionMessage(res.message);
      await loadLogsData();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message || 'Failed to retry batch'}`);
    } finally {
      setRetryingAll(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.recipientEmail.toLowerCase().includes(q) ||
      (log.recipientName && log.recipientName.toLowerCase().includes(q)) ||
      (log.studentId && log.studentId.toLowerCase().includes(q)) ||
      log.subject.toLowerCase().includes(q) ||
      (log.tripTitle && log.tripTitle.toLowerCase().includes(q)) ||
      log.eventType.toLowerCase().includes(q)
    );
  });

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'PRE_TRIP_3_DAY_REMINDER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            ⏰ 3-Day Pre-Trip Reminder
          </span>
        );
      case 'SECURITY_NOTICE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            🛡️ Security Gate Clearance
          </span>
        );
      case 'ADMIN_SUMMARY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            📊 Admin Pre-Trip Summary
          </span>
        );
      case 'REGISTRATION_CONFIRMED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Registration Confirmed</span>;
      case 'WAITLIST_JOINED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Waitlist Joined</span>;
      case 'WAITLIST_PROMOTED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">Waitlist Promoted</span>;
      case 'REGISTRATION_CANCELLED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">Registration Cancelled</span>;
      case 'TRIP_CANCELLED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Trip Cancelled</span>;
      case 'SCHEDULE_UPDATED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Schedule Updated</span>;
      case 'VENUE_UPDATED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Venue Changed</span>;
      case 'ANNOUNCEMENT_BROADCAST':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Announcement</span>;
      case 'TRIP_REMINDER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">24h Trip Reminder</span>;
      case 'CONSENT_STATUS_UPDATE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">Consent Verification</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{eventType}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600 animate-spin" />
            <span>In Transit</span>
          </span>
        );
      default:
        return <span className="text-[10px] text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#0B2545] p-6 sm:p-7 text-white border border-blue-900 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Multi-Channel Notification Hub
              </span>
              <span className="text-xs text-blue-200">Phase 1 & Phase 2 Active</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">
              Trip Updates, Emails & 3-Day Automated Reminders
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-3xl">
              Monitor real-time email delivery logs, inspect automated background 3-day pre-trip reminders for Students, Faculty, Security checkpoints, and Admins, and manage gate security rosters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'LOGS' && (
              <>
                <button
                  onClick={loadLogsData}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Registry</span>
                </button>
                {stats && stats.failed > 0 && (
                  <button
                    onClick={handleRetryAll}
                    disabled={retryingAll}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 transition-colors shadow-2xs cursor-pointer"
                  >
                    <RefreshCw className={`h-4 w-4 ${retryingAll ? 'animate-spin' : ''}`} />
                    <span>{retryingAll ? 'Retrying...' : `Retry ${stats.failed} Failed`}</span>
                  </button>
                )}
              </>
            )}

            {activeTab === 'REMINDERS' && (
              <button
                onClick={() => handleRunSchedulerNow()}
                disabled={runningScheduler}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors shadow-2xs cursor-pointer"
              >
                <Play className={`h-3.5 w-3.5 ${runningScheduler ? 'animate-spin' : 'fill-slate-950'}`} />
                <span>{runningScheduler ? 'Evaluating Trips...' : 'Run Automated 3-Day Check Now'}</span>
              </button>
            )}

            {activeTab === 'SECURITY' && (
              <button
                onClick={handleOpenAddSecurity}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Security Gate Post</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-blue-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'LOGS'
                ? 'bg-white text-[#0B2545] shadow-xs'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Email Delivery Transmissions</span>
            {stats && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'LOGS' ? 'bg-blue-100 text-[#0B2545]' : 'bg-blue-900 text-blue-200'
              }`}>
                {stats.total}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('REMINDERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'REMINDERS'
                ? 'bg-white text-[#0B2545] shadow-xs'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>⏰ Automatic 3-Day Pre-Trip Reminders</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SECURITY'
                ? 'bg-white text-[#0B2545] shadow-xs'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>🛡️ Campus Security Checkpoints</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-900 text-blue-200">
              {securityRecipients.length}
            </span>
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs font-semibold text-[#0B2545] flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#0B2545] flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-700">
            &times;
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EMAIL TRANSMISSION LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'LOGS' && (
        <div className="space-y-6">
          {/* Delivery Metrics KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Dispatched</span>
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#0B2545] flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{stats?.total ?? 0}</p>
              <span className="text-[10px] text-slate-400">All automated event triggers</span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Delivered</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MailCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-900 mt-2">{stats?.sent ?? 0}</p>
              <span className="text-[10px] text-emerald-700">
                {stats && stats.total > 0 ? `${Math.round((stats.sent / stats.total) * 100)}% delivery success` : '100%'}
              </span>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Delivery Errors</span>
                <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <MailX className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-900 mt-2">{stats?.failed ?? 0}</p>
              <span className="text-[10px] text-rose-700">Auto-retryable failed transmissions</span>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">In Transit</span>
                <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-900 mt-2">{stats?.pending ?? 0}</p>
              <span className="text-[10px] text-amber-700">Queue processing</span>
            </div>
          </div>

          {/* Real SMTP Test Email Dispatcher Card */}
          <div className="rounded-2xl border border-blue-200 bg-linear-to-r from-blue-50/60 to-indigo-50/40 p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0B2545] text-amber-400">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Live Transactional Email Transmitter Test</h3>
                </div>
                <p className="text-xs text-slate-600 max-w-2xl">
                  Dispatch a live branded institutional email to verify SMTP gateway connectivity and HTML layout formatting.
                </p>
              </div>

              <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                <input
                  type="email"
                  required
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Recipient email address..."
                  className="w-full sm:w-80 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none shadow-2xs font-mono"
                />
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <Send className="h-3.5 w-3.5 text-amber-400" />
                  <span>{sendingTest ? 'Transmitting...' : 'Send Live Test Email'}</span>
                </button>
              </form>
            </div>

            {testResult && (
              <div className={`mt-3 rounded-xl border p-3 text-xs flex items-center gap-2 ${
                testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />}
                <span className="font-semibold">{testResult.message}</span>
                {testResult.messageId && (
                  <span className="font-mono text-[10px] opacity-75 ml-auto">ID: {testResult.messageId}</span>
                )}
              </div>
            )}
          </div>

          {/* Logs Filter Toolbar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by recipient email, student name, roll number, subject, or visit..."
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Delivery Statuses</option>
                  <option value="SENT">Delivered Successfully</option>
                  <option value="FAILED">Delivery Errors / Failed</option>
                  <option value="PENDING">Pending / In Transit</option>
                </select>
              </div>

              <div>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#0B2545] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Trigger Events</option>
                  <option value="PRE_TRIP_3_DAY_REMINDER">3-Day Pre-Trip Reminder</option>
                  <option value="SECURITY_NOTICE">Security Clearance Notice</option>
                  <option value="ADMIN_SUMMARY">Admin Pre-Trip Summary</option>
                  <option value="REGISTRATION_CONFIRMED">Registration Confirmed</option>
                  <option value="WAITLIST_JOINED">Waitlist Joined</option>
                  <option value="WAITLIST_PROMOTED">Waitlist Promoted</option>
                  <option value="REGISTRATION_CANCELLED">Registration Cancelled</option>
                  <option value="TRIP_CANCELLED">Trip Cancelled</option>
                  <option value="SCHEDULE_UPDATED">Schedule Shift</option>
                  <option value="VENUE_UPDATED">Venue Change</option>
                  <option value="ANNOUNCEMENT_BROADCAST">Faculty Announcement</option>
                  <option value="TRIP_REMINDER">24-Hour Reminder</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
                <p className="text-xs text-slate-400 mt-2">Loading email transmission records...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No email records found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {search || statusFilter !== 'ALL' || eventTypeFilter !== 'ALL'
                    ? 'Try adjusting your filters or search keywords.'
                    : 'All automated email triggers will be recorded here in real time.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Event Type</th>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Subject & Visit</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getEventBadge(log.eventType)}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <span>{log.recipientName || 'Recipient'}</span>
                              {log.studentId && (
                                <span className="font-mono text-[10px] text-slate-500 font-normal">
                                  ({log.studentId})
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500">
                              {log.recipientEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-md">
                            <div className="font-bold text-slate-900 truncate">{log.subject}</div>
                            {log.tripTitle && (
                              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3 text-slate-400" />
                                <span>{log.tripTitle}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {log.status === 'FAILED' && (
                              <button
                                onClick={() => handleRetrySingle(log.id)}
                                disabled={retryingId === log.id}
                                className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                                title="Retry sending this email"
                              >
                                <RefreshCw className={`h-3 w-3 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                                <span>Retry</span>
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Eye className="h-3 w-3 text-slate-500" />
                              <span>Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUTOMATIC 3-DAY PRE-TRIP REMINDER SYSTEM */}
      {/* ========================================================================= */}
      {activeTab === 'REMINDERS' && (
        <div className="space-y-6">
          {/* Daemon Status & Overview Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Daemon Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Scheduled
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-2">Hourly Cron Check</h3>
              <p className="text-xs text-slate-500 mt-1">
                Interval: Checks every 60m for trips where <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">Trip Date - Today = 3 days</code>
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Last execution:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {schedulerStatus?.lastRunAt ? new Date(schedulerStatus.lastRunAt).toLocaleTimeString() : 'Recent startup'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Due for 3-Day Reminder</span>
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-2xl font-black text-purple-950 mt-2">
                {schedulerStatus?.tripsDueIn3DaysCount ?? 0}
              </h3>
              <p className="text-xs text-purple-800 mt-1">
                {schedulerStatus?.tripsDueIn3DaysCount > 0
                  ? 'Trips currently at exactly T-minus 3 days.'
                  : 'No trips are exactly 3 days away right now.'}
              </p>
              <div className="mt-3 pt-3 border-t border-purple-200/60 flex items-center justify-between text-[11px] text-purple-900">
                <span>Multi-role dispatch:</span>
                <span className="font-bold">4 Roles Automated</span>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Manual Evaluation</span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold text-blue-950 mt-2">Test or Force Trigger</h3>
                <p className="text-xs text-blue-800 mt-1">
                  Run the scheduler evaluation right now across all active trips or preview role-specific emails.
                </p>
              </div>
              <button
                onClick={() => handleRunSchedulerNow()}
                disabled={runningScheduler}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B2545] hover:bg-[#133E87] px-3 py-2 text-xs font-bold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Play className={`h-3.5 w-3.5 ${runningScheduler ? 'animate-spin' : 'fill-white'}`} />
                <span>{runningScheduler ? 'Processing All Trips...' : 'Run Automated Check'}</span>
              </button>
            </div>
          </div>

          {/* 4-Role Notification Breakdown Info Banner */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#0B2545]" />
              Role-Specific 3-Day Dispatch Matrix
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>1. Confirmed Students</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Receives digital boarding pass link, reporting time & gate, strict dress code, bus number, and coordinator emergency contact.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>2. Faculty Coordinators</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Receives full student roster count, confirmed attendance checklist, bus coordinator details, and host contact person info.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span>3. Security Checkpoints</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Receives gate exit clearance list, verified bus vehicle number, driver contact, departure timestamp, and faculty lead ID.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <span>4. Institutional Admins</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Receives high-level institutional summary with total passenger count, faculty leads, emergency phone numbers, and transport log.
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Trips & 3-Day Countdown Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upcoming Trips & Countdown Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculates days remaining (<code className="font-mono text-[11px]">Trip Date - Today</code>) and identifies 3-day reminder triggers.
                </p>
              </div>
              <button
                onClick={loadReminderData}
                disabled={loadingReminders}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingReminders ? 'animate-spin' : ''}`} />
                <span>Refresh Trips</span>
              </button>
            </div>

            {loadingReminders ? (
              <div className="p-12 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
                <p className="text-xs text-slate-400 mt-2">Calculating trip timelines...</p>
              </div>
            ) : !schedulerStatus?.upcomingActiveTrips || schedulerStatus.upcomingActiveTrips.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No active upcoming trips found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                      <th className="px-5 py-3">Industrial Visit / Organization</th>
                      <th className="px-5 py-3">Trip Date</th>
                      <th className="px-5 py-3 text-center">Countdown</th>
                      <th className="px-5 py-3 text-center">3-Day Trigger Status</th>
                      <th className="px-5 py-3 text-center">Confirmed Students</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schedulerStatus.upcomingActiveTrips.map((trip: any) => {
                      const is3Days = trip.daysUntilTrip === 3;
                      return (
                        <tr
                          key={trip.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            is3Days ? 'bg-purple-50/30' : ''
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 text-xs">{trip.title}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              <span>{trip.organization}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            {new Date(trip.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                trip.daysUntilTrip === 3
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300 font-black ring-2 ring-purple-400/20'
                                  : trip.daysUntilTrip < 3
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {trip.daysUntilTrip === 0
                                ? 'Today!'
                                : trip.daysUntilTrip < 0
                                ? `${Math.abs(trip.daysUntilTrip)}d ago`
                                : `T - ${trip.daysUntilTrip} days`}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            {is3Days ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Target Window (3 Days)</span>
                              </span>
                            ) : trip.daysUntilTrip < 3 ? (
                              <span className="text-[10px] text-slate-400">Passed 3-Day Window</span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Scheduled in {trip.daysUntilTrip - 3}d</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-slate-900">
                            {trip.confirmedCount}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenPreview(trip.id)}
                                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Eye className="h-3 w-3 text-slate-500" />
                                <span>Preview Roster</span>
                              </button>

                              <button
                                onClick={() => handleSendTripReminder(trip.id)}
                                disabled={sendingTripReminderId === trip.id}
                                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                                  is3Days
                                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-2xs'
                                    : 'border border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100'
                                }`}
                              >
                                <Send className={`h-3 w-3 ${sendingTripReminderId === trip.id ? 'animate-spin' : ''}`} />
                                <span>{sendingTripReminderId === trip.id ? 'Dispatching...' : 'Send 3-Day Reminders'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reminder Execution Ledger Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900">3-Day Pre-Trip Reminder Ledger (Idempotency Audit)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every 3-day reminder dispatch is immutably recorded here to guarantee no duplicate reminder is ever sent.
              </p>
            </div>

            {reminderHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No 3-day reminder executions recorded yet. Triggers will log here automatically.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                      <th className="px-5 py-3">Dispatched At</th>
                      <th className="px-5 py-3">Trip Title</th>
                      <th className="px-5 py-3">Scheduled Trip Date</th>
                      <th className="px-5 py-3 text-center">Trigger Mode</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-right">Recipients Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reminderHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {new Date(item.dispatchedAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-900">
                          {item.tripTitle}
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {item.tripDate}
                        </td>
                        <td className="px-5 py-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.triggerSource}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            <span>{item.status}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-slate-800 font-bold">
                          {item.recipientCount} emails
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CAMPUS SECURITY RECIPIENTS & GATES */}
      {/* ========================================================================= */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Campus Security & Gate Checkpoint Recipients</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Configure the security staff and gate locations that automatically receive student bus passenger manifests, vehicle license numbers, and exit clearance notices 3 days before trip departures.
              </p>
            </div>
            <button
              onClick={handleOpenAddSecurity}
              className="flex items-center gap-1.5 rounded-xl bg-[#0B2545] hover:bg-[#133E87] px-4 py-2 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4 text-amber-400" />
              <span>Add Gate Post / Contact</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingSecurity ? (
              <div className="col-span-full p-12 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
                <p className="text-xs text-slate-400 mt-2">Loading security recipients...</p>
              </div>
            ) : securityRecipients.length === 0 ? (
              <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-white">
                <Shield className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No Security Recipients Configured</p>
                <p className="text-xs text-slate-400 mt-1">Click &quot;Add Gate Post / Contact&quot; to configure campus exit gates.</p>
              </div>
            ) : (
              securityRecipients.map((sec) => (
                <div
                  key={sec.id}
                  className={`rounded-2xl border bg-white p-5 shadow-xs transition-all flex flex-col justify-between ${
                    sec.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{sec.name}</h4>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {sec.gateLocation}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSecurityActive(sec)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer ${
                          sec.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {sec.isActive ? 'Active Post' : 'Inactive'}
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{sec.email}</span>
                      </div>
                      {sec.phone && (
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-slate-400 font-bold">📞</span>
                          <span>{sec.phone}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500">{sec.department}</div>
                      {sec.notes && (
                        <div className="rounded-lg bg-slate-50 p-2 text-[10px] text-slate-500 italic mt-2 border border-slate-100">
                          &quot;{sec.notes}&quot;
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditSecurity(sec)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSecurity(sec.id, sec.name)}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TRIP 3-DAY REMINDER PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewModalTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs">
                  3D
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    3-Day Pre-Trip Reminder Payload & Roster Preview
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {previewData?.tripTitle} ({previewData?.organization})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalTripId(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {loadingPreview ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                  <p className="text-xs text-slate-400 mt-2">Loading trip payload & manifest...</p>
                </div>
              ) : previewData ? (
                <>
                  {/* Trip Travel Metadata Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-purple-50/50 border border-purple-200/60 p-4">
                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Scheduled Date</span>
                      <span className="font-bold text-purple-950 text-xs">{previewData.tripDate}</span>
                      <span className="block text-[10px] text-purple-700 font-semibold mt-0.5">
                        {previewData.daysUntilTrip === 3 ? '🎯 Exactly 3 Days Away' : `T - ${previewData.daysUntilTrip} Days`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Reporting Time</span>
                      <span className="font-bold text-purple-950 text-xs">{previewData.reportingTime}</span>
                      <span className="block text-[10px] text-slate-500 truncate">{previewData.reportingLocation}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Departure Time</span>
                      <span className="font-bold text-purple-950 text-xs">{previewData.departureTime}</span>
                      <span className="block text-[10px] text-slate-500 truncate">{previewData.transportInfo}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Total Recipients</span>
                      <span className="font-black text-purple-950 text-base">{previewData.counts.totalExpectedRecipients}</span>
                      <span className="block text-[10px] text-slate-500">Across 4 roles</span>
                    </div>
                  </div>

                  {/* 4-Role Breakdown Tabs / Cards */}
                  <div className="space-y-4">
                    {/* Role 1: Students */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span>1. Confirmed Students ({previewData.students.length})</span>
                        </h4>
                        <span className="text-[10px] text-slate-500">Boarding Pass & QR Included</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 divide-y divide-slate-100">
                        {previewData.students.map((st: any) => (
                          <div key={st.studentId} className="px-3 py-1.5 flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-bold text-slate-800">{st.name}</span>
                              <span className="text-slate-500 ml-1.5 font-mono text-[10px]">({st.rollNumber})</span>
                            </div>
                            <span className="font-mono text-[10px] text-blue-600 font-semibold">{st.boardingPassNumber}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Role 2: Faculty */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                          <span>2. Faculty Coordinators ({previewData.faculty.length})</span>
                        </h4>
                        <span className="text-[10px] text-slate-500">Full Roster & Lead Pack</span>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 space-y-1">
                        {previewData.faculty.map((fc: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">{fc.name} ({fc.department})</span>
                            <span className="font-mono text-[10px] text-slate-500">{fc.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Role 3: Security */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Shield className="h-4 w-4 text-amber-600" />
                          <span>3. Campus Security Gate Checkpoints ({previewData.security.length})</span>
                        </h4>
                        <span className="text-[10px] text-slate-500">Gate Departure Manifest</span>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 space-y-1">
                        {previewData.security.map((sc: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">{sc.name} - {sc.gateLocation}</span>
                            <span className="font-mono text-[10px] text-slate-500">{sc.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Role 4: Admin */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-purple-600" />
                          <span>4. Institutional Admins ({previewData.admins.length})</span>
                        </h4>
                        <span className="text-[10px] text-slate-500">Safety & Logistic Summary</span>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 space-y-1">
                        {previewData.admins.map((ad: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">{ad.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{ad.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {tripDispatchResult && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Dispatched Successfully!</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Delivered {tripDispatchResult.totalEmailsSent} emails, {tripDispatchResult.totalWebsiteNotificationsSent} site notifications ({tripDispatchResult.totalEmailsFailed} failed).
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                onClick={() => setPreviewModalTripId(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Close Preview
              </button>

              <button
                onClick={() => handleSendTripReminder(previewModalTripId)}
                disabled={sendingTripReminderId === previewModalTripId}
                className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-bold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className={`h-3.5 w-3.5 ${sendingTripReminderId === previewModalTripId ? 'animate-spin' : ''}`} />
                <span>{sendingTripReminderId === previewModalTripId ? 'Dispatching...' : 'Dispatch 3-Day Reminders Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT SECURITY RECIPIENT MODAL */}
      {/* ========================================================================= */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B2545] text-amber-400">
                  <Shield className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingRecipient ? 'Edit Security Gate Contact' : 'Add Campus Security Gate Post'}
                </h3>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSecurity} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Contact / Officer Name *
                </label>
                <input
                  type="text"
                  required
                  value={securityForm.name}
                  onChange={(e) => setSecurityForm({ ...securityForm, name: e.target.value })}
                  placeholder="e.g. Chief Security Officer - Gate 2"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={securityForm.email}
                    onChange={(e) => setSecurityForm({ ...securityForm, email: e.target.value })}
                    placeholder="gate2.security@vit.edu.in"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Phone / Walkie Contact
                  </label>
                  <input
                    type="text"
                    value={securityForm.phone}
                    onChange={(e) => setSecurityForm({ ...securityForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gate Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={securityForm.gateLocation}
                    onChange={(e) => setSecurityForm({ ...securityForm, gateLocation: e.target.value })}
                    placeholder="e.g. Gate 2 - Bus Bay"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={securityForm.department}
                    onChange={(e) => setSecurityForm({ ...securityForm, department: e.target.value })}
                    placeholder="Campus Security & Gate Operations"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={securityForm.notes}
                  onChange={(e) => setSecurityForm({ ...securityForm, notes: e.target.value })}
                  placeholder="Primary vehicle exit gate for outbound industrial student tours."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveSec"
                  checked={securityForm.isActive}
                  onChange={(e) => setSecurityForm({ ...securityForm, isActive: e.target.checked })}
                  className="rounded text-[#0B2545] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isActiveSec" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Active gate checkpoint (receives automated 3-day notifications)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSecurity}
                  className="rounded-lg bg-[#0B2545] hover:bg-[#133E87] px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  {savingSecurity ? 'Saving...' : editingRecipient ? 'Save Changes' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EMAIL LOG RECEIPT DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B2545] text-amber-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Email Transmission Receipt</h3>
                  <p className="text-[11px] text-slate-500 font-mono">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recipient</span>
                  <span className="font-bold text-slate-900">{selectedLog.recipientName || 'Recipient'}</span>
                  <div className="font-mono text-slate-600 mt-0.5">{selectedLog.recipientEmail}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status & Attempts</span>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusBadge(selectedLog.status)}
                    <span className="text-slate-500 text-[11px]">Attempts: {selectedLog.attempts}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Event Trigger</span>
                  <div className="mt-1">{getEventBadge(selectedLog.eventType)}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Timestamp</span>
                  <div className="font-mono text-slate-700 mt-1">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Subject</span>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-900">
                  {selectedLog.subject}
                </div>
              </div>

              {selectedLog.lastError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Delivery Error</span>
                  </div>
                  <pre className="font-mono text-[11px] whitespace-pre-wrap">{selectedLog.lastError}</pre>
                </div>
              )}

              {selectedLog.bodyText && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Plaintext Message</span>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedLog.bodyText}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3">
              {selectedLog.status === 'FAILED' && (
                <button
                  onClick={() => {
                    handleRetrySingle(selectedLog.id);
                    setSelectedLog(null);
                  }}
                  className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors shadow-2xs cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Email Now</span>
                </button>
              )}
              <button
                onClick={() => setSelectedLog(null)}
                className="ml-auto rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
