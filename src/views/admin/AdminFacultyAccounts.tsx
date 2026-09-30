import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Mail,
  Phone,
  Search,
  Plus,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
  UserCheck,
} from 'lucide-react';

export const AdminFacultyAccounts: React.FC = () => {
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Computer Engineering',
    designation: 'Associate Professor & Tour Lead',
    employeeId: '',
    phone: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [facRes, expRes] = await Promise.all([
        api.getAdminFaculty(),
        api.getExperiences(),
      ]);
      setFacultyList(facRes);
      setExperiences(expRes);
    } catch (err) {
      console.error('Error loading faculty list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAdminUser({
        name: formData.name,
        email: formData.email,
        role: 'FACULTY',
        department: formData.department,
        employeeCode: formData.employeeId,
        password: formData.password || 'vitfaculty2026',
      });
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        department: 'Computer Engineering',
        designation: 'Associate Professor & Tour Lead',
        employeeId: '',
        phone: '',
        password: '',
      });
      setActionSuccess('Faculty coordinator account provisioned and credentials dispatched.');
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create faculty coordinator');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = facultyList.filter((fac) => {
    const matchesSearch =
      !search.trim() ||
      fac.name.toLowerCase().includes(search.toLowerCase()) ||
      fac.email.toLowerCase().includes(search.toLowerCase()) ||
      fac.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
      fac.department?.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || fac.department?.toLowerCase().includes(selectedDept.toLowerCase());

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-50 border border-blue-200 text-[#0B2545] px-2.5 py-0.5 text-[10px] font-bold">
              FACULTY GOVERNANCE
            </span>
            <span className="text-xs text-slate-500 font-medium">{facultyList.length} Active Coordinators</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Faculty Coordinators & Tour Leadership Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic coordinators with designated tour oversight, student evaluation authority, and attendance verification privileges.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="h-4 w-4 text-amber-400" />
          <span>Provision Faculty Coordinator</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coordinators by name, email, employee code, or department..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer">Computer Science & Eng</option>
            <option value="Information">Information Technology</option>
            <option value="Electronics">Electronics & Telecom (EXTC)</option>
            <option value="Biomedical">Biomedical Engineering</option>
          </select>
        </div>
      </div>

      {/* Faculty Cards */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading coordinator profiles...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No faculty coordinators matched the filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((fac, idx) => {
            const assignedVisits = experiences.filter((e) => e.primaryFacultyId === fac.facultyId || e.primaryFacultyId === fac.userId);
            return (
              <div
                key={fac.userId || fac.facultyId || idx}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#0B2545] transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Coordinator Active
                    </span>
                    <span className="font-mono text-xs text-[#0B2545] font-semibold">{fac.employeeCode}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{fac.name}</h3>
                  <p className="text-xs font-semibold text-slate-700">{fac.designation}</p>
                  <p className="text-xs text-slate-500">{fac.department}</p>

                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-[#0B2545] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 inline-flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {assignedVisits.length} Assigned Industrial {assignedVisits.length === 1 ? 'Tour' : 'Tours'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <Mail className="h-3.5 w-3.5 text-[#0B2545]" />
                    <span>{fac.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{fac.phone || '+91 98200 12345'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Faculty Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#0B2545]" />
                <h3 className="text-base font-bold text-slate-900">Provision Faculty Coordinator</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Faculty Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Prof. Sameer Deshmukh"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. sameer.d@vit.edu"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
                  >
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Telecom">Electronics & Telecom</option>
                    <option value="Biomedical Engineering">Biomedical Engineering</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="e.g. VIT-FAC-03"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Academic Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Assistant Professor"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>
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
                  {submitting ? 'Creating...' : 'Provision Coordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
