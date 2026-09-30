import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SecurityEvent, SecurityStats, SecuritySeverity, SecurityEventStatus } from '../../types';
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
  ChevronRight,
  AlertTriangle,
  Lock,
  Unlock,
  AlertOctagon,
  Info
} from 'lucide-react';

export const SecurityEvents: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [page, setPage] = useState(1);
  const limit = 25;

  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  useEffect(() => {
    loadData();
  }, [page, severityFilter, roleFilter, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, statsData] = await Promise.all([
        api.getSecurityEvents({
          limit,
          offset: (page - 1) * limit,
          search,
          severity: severityFilter === 'ALL' ? '' : severityFilter,
          actorRole: roleFilter === 'ALL' ? '' : roleFilter,
        }),
        api.getSecurityStats()
      ]);
      setEvents(eventsData.events || []);
      setTotal(eventsData.total || 0);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading security events:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const data = await api.getSecurityEvents({
        limit: 10000,
        search,
        severity: severityFilter === 'ALL' ? '' : severityFilter,
        actorRole: roleFilter === 'ALL' ? '' : roleFilter,
      });
      
      const exportEvents = data.events || [];
      const headers = ['Event ID', 'Timestamp', 'Event Type', 'Severity', 'User Email', 'Role', 'Resource', 'Status', 'Description', 'Reason'];
      const rows = exportEvents.map((e) => [
        e.id,
        e.timestamp,
        e.eventType,
        e.severity,
        e.actorEmail,
        e.actorRole,
        e.resource,
        e.status,
        `"${String(e.description || '').replace(/"/g, '""')}"`,
        `"${String(e.reason || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `vit_security_events_${new Date().toISOString().split('T')[0]}.csv`);
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
              SECURITY TELEMETRY
            </span>
            <span className="text-xs text-slate-500 font-medium">{total} Events Monitored</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Security Events & Monitoring
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor failed logins, unauthorized access attempts, and potential security policy violations.
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

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <ShieldAlert className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Threat Level</p>
            </div>
            <p className={`text-xl font-bold ${
              stats.activeThreatLevel === 'CRITICAL' ? 'text-rose-600' :
              stats.activeThreatLevel === 'HIGH' ? 'text-orange-600' :
              stats.activeThreatLevel === 'ELEVATED' ? 'text-amber-500' : 'text-emerald-600'
            }`}>
              {stats.activeThreatLevel}
            </p>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Lock className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Failed Logins (24h)</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{stats.failedLogins24h}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Blocked Attempts</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{stats.blockedAttempts}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <AlertOctagon className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">High / Critical</p>
            </div>
            <p className="text-xl font-bold text-rose-600">
              {stats.highSeverityCount + stats.criticalIncidents}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs lg:col-span-1 col-span-2">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Activity className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Total Events</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{stats.totalEvents}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search events, users, resources..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
          />
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2545] focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
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
            <option value="UNKNOWN">Unknown</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      {loading && events.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading security telemetry...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No security events matched the filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Time</th>
                  <th className="px-4 py-3.5">Event</th>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Resource</th>
                  <th className="px-4 py-3.5">Severity</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <tr 
                    key={evt.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(evt)}
                  >
                    <td className="px-4 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-700">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 truncate max-w-[150px]" title={evt.actorEmail}>{evt.actorEmail}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                        {evt.actorRole}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-600 font-medium truncate max-w-[150px]" title={evt.resource}>
                      {evt.resource}
                    </td>
                    <td className="px-4 py-3.5 text-[10px] font-bold">
                      {evt.severity === 'CRITICAL' ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          <AlertOctagon className="w-3 h-3" /> CRITICAL
                        </span>
                      ) : evt.severity === 'HIGH' ? (
                        <span className="inline-flex items-center gap-1 text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                          <AlertTriangle className="w-3 h-3" /> HIGH
                        </span>
                      ) : evt.severity === 'MEDIUM' ? (
                        <span className="text-amber-600">MEDIUM</span>
                      ) : (
                        <span className="text-slate-500">LOW</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] font-bold">
                      {evt.status === 'BLOCKED' ? (
                        <span className="text-rose-600">Blocked</span>
                      ) : evt.status === 'ALLOWED' ? (
                        <span className="text-emerald-600">Allowed</span>
                      ) : evt.status === 'FLAGGED' ? (
                        <span className="text-orange-600">Flagged</span>
                      ) : (
                        <span className="text-slate-600">Logged</span>
                      )}
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
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                {selectedEvent.severity === 'CRITICAL' ? <AlertOctagon className="w-5 h-5 text-rose-600" /> :
                 selectedEvent.severity === 'HIGH' ? <AlertTriangle className="w-5 h-5 text-orange-600" /> :
                 <Info className="w-5 h-5 text-slate-400" />}
                <h3 className="text-lg font-bold text-slate-900">Security Event Details</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Event Type</p>
                  <p className="text-sm font-mono font-bold text-[#0B2545]">{selectedEvent.eventType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timestamp</p>
                  <p className="text-sm text-slate-700">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Severity</p>
                  <p className={`text-sm font-bold ${
                    selectedEvent.severity === 'CRITICAL' ? 'text-rose-600' :
                    selectedEvent.severity === 'HIGH' ? 'text-orange-600' :
                    selectedEvent.severity === 'MEDIUM' ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {selectedEvent.severity}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <p className={`text-sm font-bold ${
                    selectedEvent.status === 'BLOCKED' ? 'text-rose-600' :
                    selectedEvent.status === 'ALLOWED' ? 'text-emerald-600' :
                    selectedEvent.status === 'FLAGGED' ? 'text-orange-600' : 'text-slate-600'
                  }`}>
                    {selectedEvent.status}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">User & Connection</p>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selectedEvent.actorEmail}</p>
                      {selectedEvent.actorName && <p className="text-xs text-slate-500 mt-0.5">{selectedEvent.actorName}</p>}
                    </div>
                    <span className="rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 self-start">
                      Role: {selectedEvent.actorRole}
                    </span>
                  </div>
                  {selectedEvent.ipAddress && (
                    <p className="text-xs font-mono text-slate-500">IP: {selectedEvent.ipAddress}</p>
                  )}
                  {selectedEvent.userAgent && (
                    <p className="text-xs font-mono text-slate-500 break-words">Client: {selectedEvent.userAgent}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Action Details</p>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-500 mr-2">Resource:</span>
                    <span className="text-sm font-mono text-slate-800 break-all">{selectedEvent.resource}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 mr-2">Attempted:</span>
                    <span className="text-sm font-mono text-slate-800 break-all">{selectedEvent.actionAttempted}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {selectedEvent.reason && (
                <div className="border-t border-slate-100 pt-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">System Reason</p>
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 text-sm p-3 rounded-lg">
                    {selectedEvent.reason}
                  </div>
                </div>
              )}

              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <div className="border-t border-slate-100 pt-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Metadata</p>
                  <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
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
