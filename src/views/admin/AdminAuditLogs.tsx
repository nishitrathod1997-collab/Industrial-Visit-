import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLog, AuditModule, AuditStatus, UserRole } from '../../types';
import {
  ShieldAlert,
  Search,
  Download,
  Filter,
  Clock,
  User,
  Shield,
  FileText,
  Activity,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [page, setPage] = useState(1);
  const limit = 25;

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [page, moduleFilter, roleFilter, statusFilter, search]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const data = await api.getAuditLogs({
        limit,
        offset,
        search,
        module: moduleFilter === 'ALL' ? '' : moduleFilter,
        actorRole: roleFilter === 'ALL' ? '' : roleFilter,
        status: statusFilter === 'ALL' ? '' : statusFilter,
      });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      // Fetch all for export or just the current filtered set without limit
      const data = await api.getAuditLogs({
        limit: 10000,
        search,
        module: moduleFilter === 'ALL' ? '' : moduleFilter,
        actorRole: roleFilter === 'ALL' ? '' : roleFilter,
        status: statusFilter === 'ALL' ? '' : statusFilter,
      });
      
      const exportLogs = data.logs || [];
      const headers = ['Log ID', 'Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Module', 'Target Name', 'Target ID', 'Status', 'Description'];
      const rows = exportLogs.map((l) => [
        l.id,
        l.timestamp,
        `"${l.actorName || l.performedByName || 'System Worker'}"`,
        l.actorRole || l.userRole || 'SYSTEM',
        l.action,
        l.module || 'SYSTEM',
        `"${l.targetName || l.entityId || 'N/A'}"`,
        l.targetId || l.entityId || 'N/A',
        l.status || 'SUCCESS',
        `"${String(l.description || l.details || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `vit_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-rose-50 border border-rose-200 text-rose-900 px-2.5 py-0.5 text-[10px] font-bold">
              INSTITUTIONAL COMPLIANCE AUDIT
            </span>
            <span className="text-xs text-slate-500 font-medium">{total} Immutable Log Entries</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            System Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed timeline of all administrative overrides, roll call changes, and user modifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search logs..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Modules</option>
            <option value="AUTHENTICATION">Authentication</option>
            <option value="USERS">Users</option>
            <option value="VISITS">Visits</option>
            <option value="REGISTRATIONS">Registrations</option>
            <option value="WAITLIST">Waitlist</option>
            <option value="LEAVE_PETITIONS">Leave Petitions</option>
            <option value="ATTENDANCE">Attendance</option>
            <option value="CERTIFICATES">Certificates</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="FACULTY">Faculty</option>
            <option value="STUDENT">Student</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="WARNING">Warning</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading && logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading audit trail...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No audit events matched the filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Time</th>
                  <th className="px-4 py-3.5">Actor</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Module</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-4 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{log.actorName || log.performedByName || 'System Worker'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                        {log.actorRole || log.userRole || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#0B2545]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-600 font-medium">
                      {log.module || 'SYSTEM'}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-600 truncate max-w-[200px]">
                      {log.targetName || log.entityId || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] font-bold">
                      {(log.status || 'SUCCESS') === 'SUCCESS' ? (
                        <span className="text-emerald-600">SUCCESS</span>
                      ) : (log.status === 'FAILED' ? (
                        <span className="text-rose-600">FAILED</span>
                      ) : (
                        <span className="text-amber-600">{log.status}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-xs text-slate-500">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} events
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Audit Event Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action</p>
                  <p className="text-sm font-mono font-bold text-[#0B2545]">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Module</p>
                  <p className="text-sm font-medium text-slate-700">{selectedLog.module || 'SYSTEM'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <p className={`text-sm font-bold ${
                    (selectedLog.status || 'SUCCESS') === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {selectedLog.status || 'SUCCESS'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timestamp</p>
                  <p className="text-sm text-slate-700">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Performed By</p>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selectedLog.actorName || selectedLog.performedByName || 'System Worker'}</p>
                      {selectedLog.actorEmail && <p className="text-xs text-slate-500 mt-0.5">{selectedLog.actorEmail}</p>}
                    </div>
                    <span className="rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 self-start">
                      {selectedLog.actorRole || selectedLog.userRole || 'SYSTEM'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Target</p>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{selectedLog.targetName || selectedLog.entityId || 'N/A'}</p>
                  {selectedLog.targetId && (
                    <p className="text-xs font-mono text-slate-500 mt-1">ID: {selectedLog.targetId}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedLog.description || (typeof selectedLog.details === 'string' ? selectedLog.details : 'No description provided.')}
                </p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="border-t border-slate-100 pt-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Metadata</p>
                  <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
