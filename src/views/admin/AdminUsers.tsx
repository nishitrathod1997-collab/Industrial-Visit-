import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Search,
  Plus,
  Shield,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Mail,
  X,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'FACULTY',
    department: 'Computer Engineering',
    studentId: '',
    employeeCode: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAdminUser(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        role: 'FACULTY',
        department: 'Computer Engineering',
        studentId: '',
        employeeCode: '',
        password: '',
      });
      setActionSuccess('New user account provisioned successfully.');
      await loadUsers();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    try {
      await api.updateAdminUser(editingUser.id, {
        name: editingUser.name,
        department: editingUser.department,
        role: editingUser.role,
        isActive: editingUser.isActive,
      });
      setEditingUser(null);
      setActionSuccess('User credentials and role updated.');
      await loadUsers();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await api.updateAdminUser(user.id, {
        isActive: !user.isActive,
      });
      setActionSuccess(`User account ${!user.isActive ? 'activated' : 'deactivated'}.`);
      await loadUsers();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search.trim() ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(search.toLowerCase())) ||
      (u.employeeCode && u.employeeCode.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-50 border border-blue-200 text-[#0B2545] px-2.5 py-0.5 text-[10px] font-bold">
              ROLE & ACCESS CONTROL (RBAC)
            </span>
            <span className="text-xs text-slate-500 font-medium">{users.length} Total Registered Accounts</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Global User Accounts & Role Permissions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision faculty coordinators, administrators, and student accounts with secure role-based boundary enforcement.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="h-4 w-4 text-amber-400" />
          <span>Provision User Account</span>
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
            placeholder="Search accounts by name, email, roll number, or employee code..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Roles (Student, Faculty, Admin)</option>
            <option value="STUDENT">Students</option>
            <option value="FACULTY">Faculty Coordinators</option>
            <option value="ADMIN">System Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading account credentials...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No user accounts matched the filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">User Identity</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Institutional ID</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[10px] font-bold border ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : u.role === 'FACULTY'
                            ? 'bg-blue-50 text-[#0B2545] border-blue-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {u.role === 'ADMIN' ? (
                          <Shield className="h-3 w-3 text-purple-700" />
                        ) : u.role === 'FACULTY' ? (
                          <Briefcase className="h-3 w-3 text-[#0B2545]" />
                        ) : (
                          <GraduationCap className="h-3 w-3 text-slate-600" />
                        )}
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{u.department || 'General Campus'}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-[#0B2545] font-semibold">
                      {u.studentId || u.employeeCode || u.id.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          u.isActive !== false
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {u.isActive !== false ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{u.isActive !== false ? 'Active' : 'Suspended'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setEditingUser({ ...u })}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#0B2545]" />
                <h3 className="text-base font-bold text-slate-900">Provision User Account</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Kulkarni"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rajesh@vit.edu"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-not-allowed"
                    disabled
                  >
                    <option value="FACULTY">Faculty Coordinator</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    {formData.role === 'STUDENT' ? 'Student ID / Roll No' : 'Employee Code'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role === 'STUDENT' ? formData.studentId : formData.employeeCode}
                    onChange={(e) =>
                      formData.role === 'STUDENT'
                        ? setFormData({ ...formData, studentId: e.target.value })
                        : setFormData({ ...formData, employeeCode: e.target.value })
                    }
                    placeholder={formData.role === 'STUDENT' ? 'e.g. 21102045' : 'e.g. FAC-COMP-09'}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none font-mono"
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
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#0B2545] px-4 py-2 font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {submitting ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#0B2545]" />
                <h3 className="text-base font-bold text-slate-900">Edit User Account</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Department</label>
                <input
                  type="text"
                  required
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-900 focus:border-[#0B2545] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">System Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 p-2.5 text-slate-500 focus:outline-none cursor-not-allowed"
                  disabled
                >
                  <option value="FACULTY">Faculty Coordinator</option>
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#0B2545] px-4 py-2 font-bold text-white hover:bg-[#133E87] disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {submitting ? 'Saving...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
