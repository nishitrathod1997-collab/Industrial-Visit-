import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Experience, ExperienceWithMeta, ExperienceStatus, ExperienceType } from '../../types';
import { CompanyImage } from '../../components/common/CompanyImage';
import { CreateEditExperienceModal } from '../../components/faculty/CreateEditExperienceModal';
import { ExperiencePreviewModal } from '../../components/faculty/ExperiencePreviewModal';
import {
  CalendarDays,
  Building2,
  Calendar,
  Clock,
  Users,
  FileDown,
  FileText,
  Download,
  Megaphone,
  X,
  UserCheck,
  MapPin,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Check,
  Layers,
  ArrowRight,
  Send,
} from 'lucide-react';

interface FacultyExperiencesProps {
  onMarkAttendance: (experienceId: string) => void;
  onViewRoster: (experienceId: string) => void;
  onViewDetails?: (experienceId: string) => void;
  onViewReports?: (experienceId: string) => void;
  onViewDocuments?: (experienceId: string) => void;
  initialCreateOpen?: boolean;
}

export const FacultyExperiences: React.FC<FacultyExperiencesProps> = ({
  onMarkAttendance,
  onViewRoster,
  onViewDetails,
  onViewReports,
  onViewDocuments,
  initialCreateOpen = false,
}) => {
  const [experiences, setExperiences] = useState<ExperienceWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('PUBLISHED');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals state
  const [showCreateEditModal, setShowCreateEditModal] = useState(initialCreateOpen);
  const [selectedExperienceForEdit, setSelectedExperienceForEdit] = useState<Experience | null>(null);
  const [selectedExperienceForPreview, setSelectedExperienceForPreview] = useState<Experience | null>(null);
  const [experienceToDelete, setExperienceToDelete] = useState<ExperienceWithMeta | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Announcement Modal State
  const [announcementModalExp, setAnnouncementModalExp] = useState<ExperienceWithMeta | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annSending, setAnnSending] = useState(false);
  const [annSuccess, setAnnSuccess] = useState(false);

  // Toast / Feedback State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    setLoading(true);
    try {
      const data = await api.getFacultyExperiences();
      setExperiences(data);
    } catch (err) {
      console.error('Error loading faculty experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleOpenCreate = () => {
    setSelectedExperienceForEdit(null);
    setShowCreateEditModal(true);
  };

  const handleOpenEdit = (exp: ExperienceWithMeta) => {
    setSelectedExperienceForEdit(exp);
    setShowCreateEditModal(true);
  };

  const handleOpenPreview = (exp: ExperienceWithMeta) => {
    setSelectedExperienceForPreview(exp);
  };

  const handleExperienceSaved = (savedExp: Experience) => {
    showToast(
      selectedExperienceForEdit
        ? `Experience '${savedExp.title}' updated successfully.`
        : `Experience '${savedExp.title}' created successfully.`
    );
    loadExperiences();
  };

  const handleTogglePublish = async (exp: ExperienceWithMeta) => {
    let newStatus: ExperienceStatus = 'PUBLISHED';
    let actionText = 'Published';
    
    if (exp.status === 'PUBLISHED') {
      newStatus = 'DRAFT';
      actionText = 'moved to Draft';
    } else if (exp.status === 'PENDING_APPROVAL') {
      newStatus = 'DRAFT';
      actionText = 'withdrawn to Draft';
    } else {
      newStatus = 'PUBLISHED'; // Will be mapped to PENDING_APPROVAL by the backend
    }

    try {
      const updatedExp = await api.updateExperience(exp.id, { status: newStatus });
      showToast(
        updatedExp.status === 'PUBLISHED'
          ? `'${exp.title}' is now Published and open for student registrations.`
          : updatedExp.status === 'PENDING_APPROVAL'
          ? `'${exp.title}' has been submitted for HOD approval.`
          : `'${exp.title}' has been ${actionText}.`
      );
      loadExperiences();
    } catch (err: any) {
      showToast(err.message || 'Failed to update experience status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!experienceToDelete) return;
    setDeleting(true);
    try {
      await api.deleteExperience(experienceToDelete.id);
      showToast(`Experience '${experienceToDelete.title}' has been permanently deleted.`);
      setExperienceToDelete(null);
      loadExperiences();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete experience', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportRoster = async (exp: ExperienceWithMeta) => {
    try {
      const students = await api.getFacultyExperienceStudents(exp.id);
      const csvRows = [
        ['Student ID', 'Name', 'Branch', 'Year', 'Division', 'Email', 'Phone', 'Attendance Status'],
        ...students.map((s) => [
          s.studentId,
          `"${s.name}"`,
          s.branch,
          s.year,
          s.division,
          s.email,
          s.phone,
          s.attendanceStatus || 'PENDING',
        ]),
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${exp.organization}_Roster_${exp.date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Roster downloaded for ${exp.organization}.`);
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export roster', 'error');
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementModalExp || !annTitle.trim() || !annMessage.trim()) return;
    setAnnSending(true);
    try {
      await api.createAnnouncement(announcementModalExp.id, annTitle.trim(), annMessage.trim());
      setAnnSuccess(true);
      setTimeout(() => {
        setAnnouncementModalExp(null);
        setAnnTitle('');
        setAnnMessage('');
        setAnnSuccess(false);
        showToast('Announcement broadcasted to all registered cohort members.');
      }, 1200);
    } catch (err) {
      console.error('Error broadcasting announcement:', err);
      showToast('Failed to broadcast announcement', 'error');
    } finally {
      setAnnSending(false);
    }
  };

  // Filtered List & Counts
  const counts = useMemo(() => {
    const total = experiences.length;
    const drafts = experiences.filter((e) => e.status === 'DRAFT').length;
    const pending = experiences.filter((e) => e.status === 'PENDING_APPROVAL').length;
    const rejected = experiences.filter((e) => e.status === 'REJECTED').length;
    const published = experiences.filter((e) => e.status === 'PUBLISHED').length;
    const archived = experiences.filter((e) => e.status === 'CANCELLED' || e.status === 'COMPLETED' || (e.status as any) === 'ARCHIVED').length;
    return { total, drafts, pending, rejected, published, archived };
  }, [experiences]);

  const filteredExperiences = useMemo(() => {
    return experiences.filter((exp) => {
      // Status Filter
      if (statusFilter === 'DRAFT' && exp.status !== 'DRAFT') return false;
      if (statusFilter === 'PENDING_APPROVAL' && exp.status !== 'PENDING_APPROVAL') return false;
      if (statusFilter === 'REJECTED' && exp.status !== 'REJECTED') return false;
      if (statusFilter === 'PUBLISHED' && exp.status !== 'PUBLISHED') return false;
      if (
        statusFilter === 'ARCHIVED' &&
        exp.status !== 'CANCELLED' &&
        exp.status !== 'COMPLETED' &&
        (exp.status as any) !== 'ARCHIVED'
      )
        return false;

      // Category Filter
      if (categoryFilter !== 'ALL') {
        const normExpType =
          exp.experienceType === 'Industrial Visit'
            ? 'Industrial Visits'
            : exp.experienceType === 'Technical Tour'
            ? 'Technical Tours'
            : exp.experienceType;
        if (normExpType !== categoryFilter) return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = exp.title.toLowerCase().includes(q);
        const matchesOrg = exp.organization.toLowerCase().includes(q);
        const matchesLoc = exp.location.toLowerCase().includes(q);
        const matchesType = exp.experienceType.toLowerCase().includes(q);
        if (!matchesTitle && !matchesOrg && !matchesLoc && !matchesType) return false;
      }

      return true;
    });
  }, [experiences, statusFilter, categoryFilter, search]);

  const getStatusBadge = (status: ExperienceStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Published
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Draft (Hidden)
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-bold text-purple-800">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse"></span>
            Pending Approval
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-800">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-800">
            Completed
          </span>
        );
      case 'CANCELLED':
      case 'ARCHIVED':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Alert */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl p-4 shadow-xl border flex items-center gap-3 transition-all max-w-md ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-white/60 hover:text-white ml-auto cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-100 text-[#0B2545] px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
              Faculty Management Console
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{experiences.length} Total Visits Created/Assigned</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#0B2545]" />
            Industrial Experiences & Tours
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Create, publish, edit, and coordinate industrial site visits, technical immersions, and academic field trips for student cohorts.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            id="faculty-create-experience-btn"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-[#0B2545] px-4.5 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] transition-all shadow-sm hover:shadow-md cursor-pointer group"
          >
            <Plus className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Create Experience</span>
          </button>
        </div>
      </div>

      {/* Filter and Tab Navigation Bar */}
      <div className="space-y-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        {/* Status Tabs Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('PUBLISHED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'PUBLISHED'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Active & Published</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'PUBLISHED' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
                {counts.published}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('ARCHIVED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'ARCHIVED'
                  ? 'bg-[#0B2545] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Completed / Past Visits</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'ARCHIVED' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {counts.archived}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'DRAFT'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Drafts</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'DRAFT' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
                {counts.drafts}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('PENDING_APPROVAL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'PENDING_APPROVAL'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Pending Approval</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'PENDING_APPROVAL' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-900'}`}>
                {counts.pending}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Rejected</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-900'}`}>
                {counts.rejected}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>All Visits</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {counts.total}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{filteredExperiences.length}</strong> of {experiences.length} Experiences
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, host organization, city, or domain..."
              className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#0B2545] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Industrial Visits">Industrial Visits</option>
              <option value="Technical Tours">Technical Tours</option>
              <option value="Field Research">Field Research</option>
            </select>

            {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
                title="Reset filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Experience List / Cards */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading coordinator experiences...</p>
        </div>
      ) : filteredExperiences.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No matching industrial visits found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {experiences.length === 0
                ? "You haven't created any industrial visits yet. Click 'Create Experience' above to launch your first industrial site tour."
                : 'No visits match the current status, category, or search filters.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-all cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Experience</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExperiences.map((exp) => (
            <div
              key={exp.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row"
            >
              {/* Left Thumbnail Banner */}
              <div className="w-full md:w-56 h-40 md:h-auto flex-shrink-0 relative overflow-hidden bg-slate-900">
                <CompanyImage
                  src={exp.image}
                  alt={exp.title}
                  companyName={exp.organization}
                  logoSrc={exp.organizationLogo}
                  aspectRatio="square"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5">
                  {getStatusBadge(exp.status)}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {exp.status === 'REJECTED' && exp.rejectionReason && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-md">
                    <p className="text-sm font-medium text-rose-800">
                      <span className="font-bold">Trip Rejected:</span> {exp.rejectionReason}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0B2545]">
                      {exp.experienceType}
                    </span>
                    <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {exp.organizationIndustry || 'Industrial Technology'}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs font-semibold text-slate-600">
                      <strong className="text-emerald-700">{exp.registeredCount || 0}</strong> / {exp.capacity} Seats Filled ({Math.max(0, exp.capacity - (exp.registeredCount || 0))} Available)
                    </span>
                    {exp.waitlistCount > 0 && (
                      <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                        {exp.waitlistCount} on Waitlist
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onViewDetails && onViewDetails(exp.id)}
                    className={`text-base sm:text-lg font-bold text-slate-900 leading-snug ${
                      onViewDetails ? 'cursor-pointer hover:text-[#0B2545] transition-colors' : ''
                    }`}
                  >
                    {exp.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {exp.shortDescription || exp.detailedDescription || 'Comprehensive engineering industrial site visit.'}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                      {exp.organization}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {exp.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {exp.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {exp.time || exp.travelInfo?.reportingTime || '08:00 AM'} ({exp.duration || 'Full Day'})
                    </span>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  {/* Left Management Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(exp)}
                      className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                      title="Edit Experience Information"
                    >
                      <Edit className="h-3.5 w-3.5 text-slate-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleOpenPreview(exp)}
                      className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                      title="Preview Student View"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span>Preview</span>
                    </button>

                    {/* Publish / Unpublish Toggle */}
                    <button
                      onClick={() => handleTogglePublish(exp)}
                      className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
                        exp.status === 'PUBLISHED'
                          ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                          : exp.status === 'PENDING_APPROVAL'
                          ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                      }`}
                      title={exp.status === 'PUBLISHED' ? 'Hide from students (Set to Draft)' : exp.status === 'PENDING_APPROVAL' ? 'Withdraw Submission' : 'Submit for HOD Approval'}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{exp.status === 'PUBLISHED' ? 'Unpublish' : exp.status === 'PENDING_APPROVAL' ? 'Withdraw' : 'Submit for Approval'}</span>
                    </button>

                    <button
                      onClick={() => setExperienceToDelete(exp)}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer shadow-2xs"
                      title="Delete Experience"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>

                  {/* Right Cohort & Event Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(exp.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#133E87] transition-all shadow-2xs cursor-pointer"
                        title="Open Full Visit Management"
                      >
                        <span>VIEW DETAILS</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {exp.status === 'COMPLETED' && (
                      <>
                        <button
                          id={`faculty-card-reports-${exp.id}`}
                          onClick={() => {
                            if (onViewReports) {
                              onViewReports(exp.id);
                            } else if (onViewDetails) {
                              onViewDetails(exp.id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-[#0B2545] hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
                          title="View student post-trip reports & photo gallery"
                        >
                          <FileText className="h-3.5 w-3.5 text-amber-500" />
                          <span>Reports</span>
                        </button>

                        <button
                          id={`faculty-card-documents-${exp.id}`}
                          onClick={() => {
                            if (onViewDocuments) {
                              onViewDocuments(exp.id);
                            } else if (onViewDetails) {
                              onViewDetails(exp.id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                          title="View trip documents & files"
                        >
                          <Download className="h-3.5 w-3.5 text-slate-500" />
                          <span>Documents</span>
                        </button>

                        <button
                          id={`faculty-card-export-${exp.id}`}
                          onClick={() => handleExportRoster(exp)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                          title="Export Roster CSV"
                        >
                          <FileDown className="h-3.5 w-3.5 text-slate-500" />
                          <span>Export</span>
                        </button>
                      </>
                    )}

                    {exp.status === 'PUBLISHED' && (
                      <>
                        <button
                          onClick={() => onMarkAttendance(exp.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          <UserCheck className="h-3.5 w-3.5 text-amber-500" />
                          <span>Mark Attendance</span>
                        </button>

                        <button
                          onClick={() => onViewRoster(exp.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Users className="h-3.5 w-3.5 text-slate-500" />
                          <span>Roster</span>
                        </button>

                        <button
                          onClick={() => setAnnouncementModalExp(exp)}
                          className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Broadcast official alert to registered cohort"
                        >
                          <Megaphone className="h-3.5 w-3.5 text-amber-700" />
                          <span>Notice</span>
                        </button>

                        <button
                          onClick={() => handleExportRoster(exp)}
                          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Export Roster as CSV"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Create / Edit Modal */}
      {showCreateEditModal && (
        <CreateEditExperienceModal
          isOpen={showCreateEditModal}
          onClose={() => {
            setShowCreateEditModal(false);
            setSelectedExperienceForEdit(null);
          }}
          onSuccess={handleExperienceSaved}
          experienceToEdit={selectedExperienceForEdit}
        />
      )}

      {/* 2. Interactive Preview Modal */}
      {selectedExperienceForPreview && (
        <ExperiencePreviewModal
          experience={selectedExperienceForPreview}
          onClose={() => setSelectedExperienceForPreview(null)}
          onPublish={async (exp) => {
            await handleTogglePublish(exp as ExperienceWithMeta);
            setSelectedExperienceForPreview(null);
          }}
        />
      )}

      {/* 3. Delete Confirmation Dialog */}
      {experienceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Industrial Visit</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              Are you sure you want to permanently delete <strong>'{experienceToDelete.title}'</strong> ({experienceToDelete.organization})? All student registration and waitlist associations for this visit will be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExperienceToDelete(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {deleting ? 'Deleting...' : 'Delete Experience'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Announcement Broadcasting Modal */}
      {announcementModalExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Broadcast Coordinator Announcement
                </h3>
                <p className="text-xs text-slate-500">
                  Target: Registered cohort for {announcementModalExp.organization}
                </p>
              </div>
              <button
                onClick={() => setAnnouncementModalExp(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {annSuccess ? (
              <div className="rounded-xl bg-emerald-50 p-6 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <h4 className="text-sm font-bold text-emerald-900">Announcement Broadcasted</h4>
                <p className="text-xs text-emerald-700">All registered students have received this priority notification.</p>
              </div>
            ) : (
              <form onSubmit={handleSendAnnouncement} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Notice Title</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Bus Bay #3 Allocated / Safety Shoes Mandatory"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Announcement Content</label>
                  <textarea
                    required
                    rows={4}
                    value={annMessage}
                    onChange={(e) => setAnnMessage(e.target.value)}
                    placeholder="Type the official instruction, reporting instruction, or dress code alert..."
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAnnouncementModalExp(null)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={annSending}
                    className="rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] disabled:opacity-50 cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{annSending ? 'Broadcasting...' : 'Broadcast Notice'}</span>
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
