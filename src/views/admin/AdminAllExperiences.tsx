import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ExperienceWithMeta, ExperienceStatus, FacultyProfile } from '../../types';
import {
  Plus,
  Search,
  Building2,
  Calendar,
  MapPin,
  Users,
  X,
  CheckCircle2,
  Sparkles,
  Download,
  UserCheck,
  Copy,
  FileText,
} from 'lucide-react';

import { CreateEditExperienceModal } from '../../components/faculty/CreateEditExperienceModal';
import { PostTripReportsManager } from '../../components/common/PostTripReportsManager';
import { ExperienceTemplate } from '../../types';

interface AdminAllExperiencesProps {
  onManageRegistration?: (experienceId: string) => void;
  selectedBlueprint?: ExperienceTemplate | null;
  clearSelectedBlueprint?: () => void;
}

export const AdminAllExperiences: React.FC<AdminAllExperiencesProps> = ({ onManageRegistration, selectedBlueprint, clearSelectedBlueprint }) => {
  const [experiences, setExperiences] = useState<ExperienceWithMeta[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);


  const closeModal = () => {
    setShowCreateModal(false);
    if (clearSelectedBlueprint) clearSelectedBlueprint();
  };

  // Assign Faculty Modal
  const [assignModalExp, setAssignModalExp] = useState<ExperienceWithMeta | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedAdditionalFaculty, setSelectedAdditionalFaculty] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [viewReportExp, setViewReportExp] = useState<ExperienceWithMeta | null>(null);

  // Form State for creating new experience
  const [formTitle, setFormTitle] = useState('');
  const [formOrg, setFormOrg] = useState('');
  const [formOrgDesc] = useState('Pioneer engineering & technology innovation center');
  const [formOrgIndustry, setFormOrgIndustry] = useState('Enterprise Software & Technology');
  const [formOrgWebsite] = useState('https://vit.edu.in');
  const [formType] = useState('Industrial Visits');
  const [formDate, setFormDate] = useState('2026-10-15');
  const [formAddress, setFormAddress] = useState('Tech Park, Mumbai');
  const [formCapacity, setFormCapacity] = useState(40);
  const [formContribution, setFormContribution] = useState(0);
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDetailedDesc, setFormDetailedDesc] = useState('');
  const [formDeadline, setFormDeadline] = useState('2026-10-10T23:59:59Z');
  const [formFacultyId, setFormFacultyId] = useState('');
  const [formLearnPoints, setFormLearnPoints] = useState('Advanced Cloud Systems\nDevOps at Scale\nHigh Availability Architecture');
  const [formObjPoints, setFormObjPoints] = useState('Understand corporate engineering standards\nExpose students to industrial telemetry');
  const [formReqs, setFormReqs] = useState('Carry valid physical VIT ID card\nStrict business formal attire\nBring notebook and pen');
  const [formRules, setFormRules] = useState('No mobile phones in server halls\nStrict safety gear mandatory in labs\nFollow coordinator instructions at all times');
  const [formReportingTime, setFormReportingTime] = useState('07:30 AM');
  const [formReportingLoc, setFormReportingLoc] = useState('Bus Bay #3, VIT Main Campus');
  const [formDeptTime, setFormDeptTime] = useState('08:00 AM');
  const [formTransport, setFormTransport] = useState('University Air-Conditioned Coach #7');
  const [formCampusArrival, setFormCampusArrival] = useState('05:30 PM');

  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);


  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBlueprint) {
      setShowCreateModal(true);
    }
  }, [selectedBlueprint]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, facRes] = await Promise.all([
        api.getExperiences(),
        api.getAdminFacultyList()
      ]);
      setExperiences(expRes);
      setFacultyList(facRes);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (experienceId: string, newStatus: ExperienceStatus) => {
    try {
      await api.updateExperience(experienceId, { status: newStatus });
      await loadData();
    } catch (err) {
      console.error('Error changing status', err);
    }
  };

  const handleApprove = async (experienceId: string) => {
    try {
      await api.approveExperience(experienceId);
      setActionSuccess('Trip approved and published successfully.');
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to approve trip');
    }
  };

  const handleReject = async (experienceId: string) => {
    const reason = window.prompt('Please provide a reason for rejecting this trip:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    
    try {
      await api.rejectExperience(experienceId, reason);
      setActionSuccess('Trip rejected successfully.');
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to reject trip');
    }
  };

  const handleAssignFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalExp || !selectedFacultyId) return;
    setAssigning(true);
    try {
      await api.updateExperience(assignModalExp.id, {
        primaryFacultyId: selectedFacultyId,
        additionalFacultyIds: selectedAdditionalFaculty
      });
      setActionSuccess('Faculty coordinator assigned successfully.');
      setAssignModalExp(null);
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error assigning faculty', err);
      alert('Failed to assign faculty.');
    } finally {
      setAssigning(false);
    }
  };

  const handleDuplicate = async (exp: ExperienceWithMeta) => {
    try {
      const clonePayload = { ...exp };
      delete (clonePayload as any).id;
      delete (clonePayload as any).registeredCount;
      delete (clonePayload as any).waitlistCount;
      delete (clonePayload as any).userRegistration;
      delete (clonePayload as any).userWaitlist;
      delete (clonePayload as any).userBoardingPass;

      await api.createExperience({
        ...clonePayload,
        title: `${exp.title} (Cohort 2)`,
        status: 'DRAFT' as ExperienceStatus,
      } as any);
      setActionSuccess('Experience cloned as DRAFT blueprint.');
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to clone experience');
    }
  };

  const exportCSV = () => {
    const headers = ['Experience ID', 'Title', 'Host Organization', 'Industry', 'Date', 'Location', 'Capacity', 'Registered', 'Waitlisted', 'Status', 'Faculty Lead'];
    const rows = filtered.map((e) => [
      e.id,
      `"${e.title}"`,
      `"${e.organization}"`,
      `"${e.organizationIndustry || 'Technology'}"`,
      e.date,
      `"${e.location}"`,
      e.capacity,
      e.registeredCount,
      e.waitlistCount,
      e.status,
      `"${e.primaryFaculty?.name || 'Unassigned'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vit_industrial_visits_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = experiences.filter((exp) => {
    const matchesSearch =
      !search.trim() ||
      exp.title.toLowerCase().includes(search.toLowerCase()) ||
      exp.organization.toLowerCase().includes(search.toLowerCase()) ||
      exp.location.toLowerCase().includes(search.toLowerCase()) ||
      (exp.primaryFaculty?.name?.toLowerCase() || '').includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || exp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-50 border border-blue-200 text-[#0B2545] px-2.5 py-0.5 text-[10px] font-bold">
              MASTER VISIT REGISTRY
            </span>
            <span className="text-xs text-slate-500 font-medium">{experiences.length} Total Visits</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Industrial Visit Catalog & Experience Lifecycle
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Central deployment, capacity governance, faculty lead appointments, and catalog publication across all campus programs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Catalog (CSV)</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="h-4 w-4 text-amber-400" />
            <span>New Experience</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, tour name, location, or faculty coordinator..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Lifecycle States</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="PUBLISHED">Published & Active</option>
            <option value="DRAFT">Draft Mode</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Experiences List */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading master catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No matching industrial experiences found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => (
            <div
              key={exp.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#0B2545] transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0B2545]">
                    {exp.experienceType}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      exp.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : exp.status === 'PENDING_APPROVAL'
                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                        : exp.status === 'COMPLETED'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : exp.status === 'DRAFT'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {exp.status}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{exp.id}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{exp.title}</h3>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                    {exp.organization}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {exp.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {exp.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-bold text-slate-800">{exp.registeredCount} / {exp.capacity}</span> Seats
                    {exp.waitlistCount > 0 && ` (${exp.waitlistCount} waitlisted)`}
                  </span>
                </div>

                <div className="pt-1 flex flex-col gap-1 text-xs border-t border-slate-100 mt-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-slate-500">
                      Primary Lead:{' '}
                      <span className="font-semibold text-slate-800">
                        {exp.primaryFaculty?.name || 'Not assigned'}
                      </span>
                    </span>
                  </div>
                  {exp.additionalFaculty && exp.additionalFaculty.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5"></span>
                      <span className="text-slate-500">
                        Additional Coordinators:{' '}
                        <span className="font-medium text-slate-700">
                          {exp.additionalFaculty.map(f => f.name).join(', ')}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setAssignModalExp(exp);
                    const defId = exp.primaryFacultyId || (facultyList[0]?.userId ?? facultyList[0]?.facultyId ?? '');
                    setSelectedFacultyId(defId);
                    setSelectedAdditionalFaculty(exp.additionalFacultyIds || []);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  <UserCheck className="h-3.5 w-3.5 text-[#0B2545]" />
                  <span>Assign Lead</span>
                </button>

                {exp.status === 'PENDING_APPROVAL' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(exp.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 cursor-pointer shadow-2xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(exp.id)}
                      className="px-3 py-1.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-200 cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <select
                    value={exp.status}
                    onChange={(e) => handleStatusChange(exp.id, e.target.value as ExperienceStatus)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                )}

                {exp.status === 'COMPLETED' && (
                  <button
                    onClick={() => setViewReportExp(exp)}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-[#0B2545] hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
                    title="View post-trip reports & photos"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Reports</span>
                  </button>
                )}

                <button
                  onClick={() => handleDuplicate(exp)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Clone as Blueprint"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      
      {/* Assign Faculty Lead Modal */}
      {assignModalExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#0B2545]" />
                <h3 className="text-base font-bold text-slate-900">Faculty Assignment</h3>
              </div>
              <button onClick={() => setAssignModalExp(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1">
              <div className="font-bold text-slate-800">{assignModalExp.title}</div>
              <div className="text-slate-500">{assignModalExp.organization} • {assignModalExp.date}</div>
            </div>

            <form onSubmit={handleAssignFaculty} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Primary Faculty Lead</label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>Select Primary Faculty</option>
                  {facultyList.map((fac) => {
                    const id = fac.userId || fac.facultyId || (fac as any).id;
                    return (
                      <option key={id} value={id}>
                        {fac.name} ({fac.department})
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 block">Additional Faculty Coordinators</label>
                {selectedAdditionalFaculty.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedAdditionalFaculty.map(id => {
                      const fac = facultyList.find(f => (f.userId || f.facultyId || (f as any).id) === id);
                      if (!fac) return null;
                      return (
                        <div key={id} className="flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-1">
                          <span className="font-medium text-[#0B2545]">{fac.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedAdditionalFaculty(prev => prev.filter(f => f !== id))}
                            className="text-blue-400 hover:text-blue-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !selectedAdditionalFaculty.includes(e.target.value)) {
                      setSelectedAdditionalFaculty([...selectedAdditionalFaculty, e.target.value]);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
                >
                  <option value="">+ Add Faculty...</option>
                  {facultyList.map((fac) => {
                    const id = fac.userId || fac.facultyId || (fac as any).id;
                    if (id === selectedFacultyId || selectedAdditionalFaculty.includes(id)) return null;
                    return (
                      <option key={id} value={id}>
                        {fac.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalExp(null)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="rounded-lg bg-[#0B2545] px-4 py-2 font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {assigning ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Create / Edit Modal */}
      {showCreateModal && (
        <CreateEditExperienceModal
          isOpen={showCreateModal}
          onClose={closeModal}
          onSuccess={(newExp) => {
            loadData();
            closeModal();
          }}
          experienceToEdit={null}
        />
      )}

      {/* Admin Post-Trip Reports Modal */}
      {viewReportExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-6xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col my-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0B2545] flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Post-Trip Reports & Photos: {viewReportExp.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {viewReportExp.organization} • {viewReportExp.date} • {viewReportExp.location}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewReportExp(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <PostTripReportsManager role="ADMIN" initialExperienceId={viewReportExp.id} />
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setViewReportExp(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
