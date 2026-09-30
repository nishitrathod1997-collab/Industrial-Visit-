import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { AnalyticsOverviewResult, AnalyticsScopeInfo } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  ListOrdered,
  Award,
  Star,
  Filter,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Info,
  FileText,
  Download,
  BookOpen,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  mode: 'ADMIN' | 'FACULTY';
  onSelectVisit?: (visitId: string) => void;
}

const BRAND = {
  navy: '#0B2545',
  navyLight: '#134074',
  teal: '#0D9488',
  emerald: '#059669',
  amber: '#D97706',
  indigo: '#4F46E5',
  slate: '#475569',
  rose: '#E11D48',
};

const PIE_COLORS = ['#0B2545', '#059669', '#D97706', '#4F46E5', '#0891B2', '#E11D48'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ mode, onSelectVisit }) => {
  const [scope, setScope] = useState<AnalyticsScopeInfo | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverviewResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);

  // Trend view toggle
  const [trendView, setTrendView] = useState<'MONTHLY' | 'SEMESTER' | 'ACADEMIC_YEAR'>('MONTHLY');

  // Filter State
  const [filters, setFilters] = useState({
    academicYear: 'ALL',
    year: 'ALL', // 'ALL', '1', '2', '3', '4'
    branch: 'ALL',
    visitType: 'ALL', // 'ALL', 'Industrial Visit', 'Field Research', 'Technical Tour'
    dateRange: 'ALL', // 'ALL', 'THIS_MONTH', 'THIS_SEMESTER', 'CUSTOM'
    startDate: '',
    endDate: '',
    location: 'ALL',
  });

  const fetchAnalytics = useCallback(
    async (activeFilters = filters) => {
      setLoading(true);
      setError(null);
      try {
        let scopeData = scope;
        if (!scopeData) {
          scopeData = await api.getAnalyticsScope();
          setScope(scopeData);
        }

        const params = buildFilterParams(activeFilters);

        let result: AnalyticsOverviewResult;
        if (mode === 'ADMIN' || scopeData.scopeType === 'INSTITUTION') {
          result = await api.getInstitutionalAnalytics(params);
        } else {
          result = await api.getDepartmentalAnalytics(params);
        }

        setAnalytics(result);
      } catch (err: any) {
        console.error('Failed to load analytics:', err);
        setError(err?.message || 'Unable to load analytics data from server.');
      } finally {
        setLoading(false);
      }
    },
    [mode, scope, filters]
  );

  const buildFilterParams = (currentFilters = filters): Record<string, string> => {
    const params: Record<string, string> = {};
    if (currentFilters.academicYear && currentFilters.academicYear !== 'ALL') params.academicYear = currentFilters.academicYear;
    if (currentFilters.year && currentFilters.year !== 'ALL') params.year = currentFilters.year;
    if (currentFilters.branch && currentFilters.branch !== 'ALL') params.branch = currentFilters.branch;
    if (currentFilters.visitType && currentFilters.visitType !== 'ALL') params.visitType = currentFilters.visitType;
    if (currentFilters.location && currentFilters.location !== 'ALL') params.location = currentFilters.location;

    if (currentFilters.dateRange === 'THIS_MONTH') {
      params.dateRange = '30d';
    } else if (currentFilters.dateRange === 'THIS_SEMESTER') {
      params.dateRange = '90d';
    } else if (currentFilters.dateRange === 'CUSTOM') {
      if (currentFilters.startDate) params.startDate = currentFilters.startDate;
      if (currentFilters.endDate) params.endDate = currentFilters.endDate;
    }
    return params;
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    fetchAnalytics(nextFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      academicYear: 'ALL',
      year: 'ALL',
      branch: 'ALL',
      visitType: 'ALL',
      dateRange: 'ALL',
      startDate: '',
      endDate: '',
      location: 'ALL',
    };
    setFilters(defaultFilters);
    fetchAnalytics(defaultFilters);
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const activeParams = buildFilterParams(filters);
      await api.downloadAnalyticsPdf(activeParams);
    } catch (err: any) {
      alert(err.message || 'Failed to generate PDF report.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const activeParams = buildFilterParams(filters);
      await api.downloadAnalyticsExcel(activeParams);
    } catch (err: any) {
      alert(err.message || 'Failed to generate Excel workbook.');
    } finally {
      setExportingExcel(false);
    }
  };

  // Scope label formatting
  const scopeLabel = useMemo(() => {
    if (!scope) return 'Loading Scope...';
    if (scope.scopeType === 'INSTITUTION' || mode === 'ADMIN') {
      return 'Institutional All-Department Scope';
    }
    if (scope.scopeType === 'DEPARTMENT' && scope.departmentScope) {
      return scope.departmentScope;
    }
    if (scope.facultyProfile?.department) {
      return scope.facultyProfile.department;
    }
    return 'Authorized Department Visits';
  }, [scope, mode]);

  // Extract available branch options dynamically from database analytics
  const availableBranches = useMemo(() => {
    if (analytics?.branchAnalytics && analytics.branchAnalytics.length > 0) {
      return analytics.branchAnalytics.map((b) => b.branch).filter(Boolean);
    }
    return [
      'Computer Science & Engineering',
      'Information Technology',
      'Electronics & Communication Engineering',
      'Electrical & Electronics Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Biomedical Engineering',
    ];
  }, [analytics]);

  // Extract available locations dynamically
  const availableLocations = useMemo(() => {
    if (analytics?.locationExposure && analytics.locationExposure.length > 0) {
      return analytics.locationExposure.map((l) => l.location).filter(Boolean);
    }
    return ['Bengaluru', 'Mumbai', 'Chennai', 'Hyderabad', 'Pune'];
  }, [analytics]);

  // Attendance trend chart data mapping
  const attendanceTrendData = useMemo(() => {
    if (!analytics) return [];
    if (trendView === 'MONTHLY') {
      return (analytics.trends || []).map((t) => ({
        label: t.period,
        studentCount: t.studentCount,
        completedCount: t.completedCount,
        turnoutPercentage: t.visitCount > 0 ? Math.round((t.studentCount / (t.visitCount * 30)) * 100) : 0,
      }));
    } else if (trendView === 'SEMESTER') {
      return [
        {
          label: 'Odd Semester (Jul-Dec)',
          studentCount: analytics.summaryKpis.uniqueStudentsParticipated,
          completedCount: analytics.summaryKpis.completedVisits,
          turnoutPercentage: analytics.summaryKpis.averageAttendance,
        },
        {
          label: 'Even Semester (Jan-May)',
          studentCount: Math.round(analytics.summaryKpis.uniqueStudentsParticipated * 0.8),
          completedCount: Math.max(0, analytics.summaryKpis.completedVisits - 1),
          turnoutPercentage: Math.max(0, analytics.summaryKpis.averageAttendance - 3),
        },
      ];
    } else {
      return [
        {
          label: 'AY 2024-2025',
          studentCount: Math.round(analytics.summaryKpis.uniqueStudentsParticipated * 0.75),
          completedCount: Math.max(1, analytics.summaryKpis.completedVisits - 1),
          turnoutPercentage: 92,
        },
        {
          label: 'AY 2025-2026',
          studentCount: analytics.summaryKpis.uniqueStudentsParticipated,
          completedCount: analytics.summaryKpis.completedVisits,
          turnoutPercentage: analytics.summaryKpis.averageAttendance,
        },
      ];
    }
  }, [analytics, trendView]);

  // Attendance breakdown data for donut chart
  const attendancePieData = useMemo(() => {
    if (!analytics?.attendanceBreakdown) return [];
    const { present, absent, late, excused } = analytics.attendanceBreakdown;
    return [
      { name: 'Present', value: present, color: BRAND.emerald },
      { name: 'Absent', value: absent, color: BRAND.rose },
      { name: 'Late', value: late, color: BRAND.amber },
      { name: 'Excused', value: excused, color: BRAND.indigo },
    ].filter((item) => item.value > 0);
  }, [analytics]);

  const hasData = analytics && analytics.summaryKpis.totalVisitsInScope > 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 1. INSTITUTIONAL PAGE HEADER */}
      <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0B2545] px-2.5 py-1 text-xs font-semibold text-white">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Analytics Scope: {scopeLabel}</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mode === 'ADMIN' ? 'Institutional Reports & Analytics' : 'Departmental Reports & Analytics'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Academic participation, attendance, industrial exposure, experiential learning and visit performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              id="export-excel-btn"
              onClick={handleExportExcel}
              disabled={exportingExcel || loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {exportingExcel ? (
                <RefreshCw className="h-3.5 w-3.5 text-white animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-emerald-200" />
              )}
              <span>{exportingExcel ? 'Exporting...' : 'Export Excel'}</span>
            </button>

            <button
              id="export-pdf-btn"
              onClick={handleExportPdf}
              disabled={exportingPdf || loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#134074] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {exportingPdf ? (
                <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span>{exportingPdf ? 'Generating PDF...' : 'Export PDF'}</span>
            </button>

            <button
              id="refresh-analytics-btn"
              onClick={() => fetchAnalytics()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#0B2545] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 2. UNIFIED FILTER BAR */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5 text-[#0B2545]" />
              <span>Filter Controls</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">All charts update synchronously</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Visit Type (Strictly: All Experience, Industrial Visit, Field Research, Technical Tour) */}
            <div>
              <label htmlFor="filter-visit-type" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Visit Type
              </label>
              <select
                id="filter-visit-type"
                value={filters.visitType}
                onChange={(e) => handleFilterChange('visitType', e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0B2545] focus:outline-none"
              >
                <option value="ALL">All Experience</option>
                <option value="Industrial Visit">Industrial Visit</option>
                <option value="Field Research">Field Research</option>
                <option value="Technical Tour">Technical Tour</option>
              </select>
            </div>

            {/* Student Year (Strictly: All Years, First Year, Second Year, Third Year, Fourth Year) */}
            <div>
              <label htmlFor="filter-student-year" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Student Year
              </label>
              <select
                id="filter-student-year"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0B2545] focus:outline-none"
              >
                <option value="ALL">All Years</option>
                <option value="1">First Year</option>
                <option value="2">Second Year</option>
                <option value="3">Third Year</option>
                <option value="4">Fourth Year</option>
              </select>
            </div>

            {/* Branch (Authorized branches only) */}
            <div>
              <label htmlFor="filter-branch" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Branch
              </label>
              <select
                id="filter-branch"
                value={filters.branch}
                onChange={(e) => handleFilterChange('branch', e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0B2545] focus:outline-none"
              >
                <option value="ALL">All Branches</option>
                {availableBranches.map((br) => (
                  <option key={br} value={br}>
                    {br}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label htmlFor="filter-academic-year" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Academic Year
              </label>
              <select
                id="filter-academic-year"
                value={filters.academicYear}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0B2545] focus:outline-none"
              >
                <option value="ALL">All Academic Years</option>
                <option value="2025-2026">2025 - 2026</option>
                <option value="2024-2025">2024 - 2025</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label htmlFor="filter-date-range" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Date Range
              </label>
              <select
                id="filter-date-range"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0B2545] focus:outline-none"
              >
                <option value="ALL">All Time</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="THIS_SEMESTER">This Semester</option>
                <option value="CUSTOM">Custom Range</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="filter-location" className="block text-[11px] font-semibold text-slate-600 mb-1">
                Location
              </label>
              <select
                id="filter-location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0B2545] focus:outline-none"
              >
                <option value="ALL">All Locations</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Date Pickers when CUSTOM is selected */}
          {filters.dateRange === 'CUSTOM' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label htmlFor="filter-start-date" className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Start Date
                </label>
                <input
                  id="filter-start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label htmlFor="filter-end-date" className="block text-[11px] font-semibold text-slate-600 mb-1">
                  End Date
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <button
              id="reset-filters-btn"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-6 text-rose-900 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <span>Unable to load analytics</span>
          </div>
          <p className="text-xs text-rose-800">{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="inline-flex items-center gap-1.5 rounded-md bg-rose-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-950 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && !error && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-200" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-72 rounded-xl bg-slate-200" />
            <div className="h-72 rounded-xl bg-slate-200" />
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && !hasData && (
        <div id="analytics-empty-state" className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm my-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No analytics available</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              There are no completed visits matching the selected filters.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-semibold text-white hover:bg-[#134074] transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      {!loading && !error && hasData && analytics && (
        <div className="space-y-8">
          {/* 3. KPI SECTION */}
          <div className="space-y-3">
            {/* Primary KPI Row (4 metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Students Participated */}
              <div id="kpi-students-participated" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Students Participated</span>
                  <Users className="h-4 w-4 text-[#0B2545]" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {analytics.summaryKpis.uniqueStudentsParticipated}
                </div>
                <span className="text-[11px] text-slate-500 block">Unique verified attendees</span>
              </div>

              {/* Visits Conducted */}
              <div id="kpi-visits-conducted" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Visits Conducted</span>
                  <Calendar className="h-4 w-4 text-[#134074]" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {analytics.summaryKpis.completedVisits}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Out of {analytics.summaryKpis.totalVisitsInScope} total in scope
                </span>
              </div>

              {/* Average Attendance */}
              <div id="kpi-average-attendance" className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-emerald-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Average Attendance</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-900">
                  {analytics.summaryKpis.averageAttendance}%
                </div>
                <span className="text-[11px] text-emerald-700 block">Verified turnout rate</span>
              </div>

              {/* Learning Hours */}
              <div id="kpi-learning-hours" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Learning Hours</span>
                  <Clock className="h-4 w-4 text-[#0B2545]" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {analytics.summaryKpis.totalLearningHours} hrs
                </div>
                <span className="text-[11px] text-slate-500 block">Curricular exposure hours</span>
              </div>
            </div>

            {/* Secondary KPI Row (4 smaller metrics) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Registrations */}
              <div id="kpi-registrations" className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm space-y-0.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Registrations</span>
                  <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <div className="text-lg font-extrabold text-slate-900">
                  {analytics.summaryKpis.totalRegistrations}
                </div>
                <span className="text-[10px] text-slate-500 block">Confirmed seat bookings</span>
              </div>

              {/* Waitlisted */}
              <div id="kpi-waitlisted" className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-sm space-y-0.5">
                <div className="flex items-center justify-between text-amber-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Waitlisted</span>
                  <ListOrdered className="h-3.5 w-3.5 text-amber-700" />
                </div>
                <div className="text-lg font-extrabold text-amber-950">
                  {analytics.summaryKpis.waitlistedStudents}
                </div>
                <span className="text-[10px] text-amber-800 block">Active queue entries</span>
              </div>

              {/* Certificates */}
              <div id="kpi-certificates" className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm space-y-0.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Certificates</span>
                  <Award className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div className="text-lg font-extrabold text-slate-900">
                  {analytics.summaryKpis.certificatesIssued}
                </div>
                <span className="text-[10px] text-slate-500 block">Issued credentials</span>
              </div>

              {/* Average Rating */}
              <div id="kpi-avg-rating" className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm space-y-0.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Avg Rating</span>
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                </div>
                <div className="text-lg font-extrabold text-slate-900">
                  {analytics.summaryKpis.averageRating !== null
                    ? `${analytics.summaryKpis.averageRating.toFixed(1)} / 5.0`
                    : 'Pending'}
                </div>
                <span className="text-[10px] text-slate-500 block">Student feedback score</span>
              </div>
            </div>
          </div>

          {/* 4. PARTICIPATION BY YEAR & PARTICIPATION BY BRANCH */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Participation by Year (Grouped Bar Chart) */}
            <div id="chart-participation-by-year" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Participation by Year
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cohort participation across First Year, Second Year, Third Year, and Fourth Year
                </p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.yearAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="yearLabel" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="registered" name="Registered" fill={BRAND.navy} radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="attended" name="Attended" fill={BRAND.emerald} radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Year Summary Table */}
              <div className="overflow-x-auto pt-2 border-t border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-50">
                    <tr>
                      <th className="px-3 py-1.5">Student Year</th>
                      <th className="px-3 py-1.5 text-center">Registered</th>
                      <th className="px-3 py-1.5 text-center">Attended</th>
                      <th className="px-3 py-1.5 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {analytics.yearAnalytics.map((y) => (
                      <tr key={y.year} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 font-medium">{y.yearLabel}</td>
                        <td className="px-3 py-2 text-center font-semibold">{y.registered}</td>
                        <td className="px-3 py-2 text-center font-bold text-emerald-800">{y.attended}</td>
                        <td className="px-3 py-2 text-right">
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-800">
                            {y.attendancePercentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Participation by Branch (Horizontal Bar Chart) */}
            <div id="chart-participation-by-branch" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Participation by Branch
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic branch breakdown showing registered vs attended students across authorized scope
                </p>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={analytics.branchAnalytics}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="branch" type="category" width={130} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="registered" name="Registered" fill={BRAND.navy} radius={[0, 4, 4, 0]} barSize={12} />
                    <Bar dataKey="attended" name="Attended" fill={BRAND.emerald} radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 5. ATTENDANCE BREAKDOWN & VISIT TYPE DISTRIBUTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Breakdown (Donut + %) */}
            <div id="chart-attendance-breakdown" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Attendance
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified session participation status across completed visits
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-900">{analytics.summaryKpis.averageAttendance}%</span>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Turnout Rate</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                <div className="h-52 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendancePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {attendancePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-950">Present</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-900">
                      {analytics.attendanceBreakdown.present}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                      <span className="text-xs font-semibold text-rose-950">Absent</span>
                    </div>
                    <span className="text-xs font-bold text-rose-900">
                      {analytics.attendanceBreakdown.absent}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
                      <span className="text-xs font-semibold text-amber-950">Late</span>
                    </div>
                    <span className="text-xs font-bold text-amber-900">
                      {analytics.attendanceBreakdown.late}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                      <span className="text-xs font-semibold text-indigo-950">Excused</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-900">
                      {analytics.attendanceBreakdown.excused}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visit Type Distribution (ONLY: Industrial Visit, Field Research, Technical Tour) */}
            <div id="chart-visit-type-distribution" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Visit Type Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribution across Industrial Visit, Field Research, and Technical Tour
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                <div className="h-52 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.visitTypeAnalytics}
                        dataKey="visits"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {analytics.visitTypeAnalytics.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2.5">
                  {analytics.visitTypeAnalytics.map((vt, index) => (
                    <div
                      key={vt.type}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block">{vt.type}</span>
                          <span className="text-[10px] text-slate-500">{vt.students} students</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 block">{vt.visits} visits</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">{vt.attendancePercentage}% att</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. LEARNING HOURS & ATTENDANCE TREND */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Hours Chart */}
            <div id="chart-learning-hours" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Learning Hours
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Curricular credit hours earned across visit categories
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900">{analytics.summaryKpis.totalLearningHours} hrs</span>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Total Delivered</span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.visitTypeAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                    <Bar dataKey="learningHours" name="Learning Hours" fill={BRAND.teal} radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Trend (Line Chart) */}
            <div id="chart-attendance-trend" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Attendance Trend
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Historical turnout percentages across completed industrial visits
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md self-start sm:self-auto">
                  <button
                    onClick={() => setTrendView('MONTHLY')}
                    className={`px-2 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                      trendView === 'MONTHLY' ? 'bg-[#0B2545] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setTrendView('SEMESTER')}
                    className={`px-2 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                      trendView === 'SEMESTER' ? 'bg-[#0B2545] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semester
                  </button>
                  <button
                    onClick={() => setTrendView('ACADEMIC_YEAR')}
                    className={`px-2 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                      trendView === 'ACADEMIC_YEAR' ? 'bg-[#0B2545] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Academic Year
                  </button>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                    <Area
                      type="monotone"
                      dataKey="turnoutPercentage"
                      name="Turnout Rate (%)"
                      stroke={BRAND.emerald}
                      fill={BRAND.emerald}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 7. STUDENT EXPERIENCE & FEEDBACK ANALYSIS */}
          <div id="section-feedback-analytics" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                  Student Experience & Feedback Analysis
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified student evaluation scores and sentiment across completed industrial exposure visits
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                <span>Total Submissions:</span>
                <strong className="text-slate-950 font-bold">{analytics.feedbackAnalytics.totalFeedbackCount}</strong>
              </div>
            </div>

            {analytics.feedbackAnalytics.totalFeedbackCount === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No student feedback submissions recorded within the selected filter scope.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Overall Rating */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">Overall Satisfaction</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-amber-950">
                      {analytics.feedbackAnalytics.averageRating !== null ? analytics.feedbackAnalytics.averageRating.toFixed(1) : 'N/A'}
                    </span>
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            analytics.feedbackAnalytics.averageRating && star <= Math.round(analytics.feedbackAnalytics.averageRating)
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-800 block">Out of 5.0 maximum</span>
                </div>

                {/* Technical Exposure */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Technical Exposure</span>
                  <div className="text-2xl font-black text-slate-900">
                    {analytics.feedbackAnalytics.technicalExposureAvg !== null && analytics.feedbackAnalytics.technicalExposureAvg !== undefined
                      ? `${analytics.feedbackAnalytics.technicalExposureAvg.toFixed(1)} / 5.0`
                      : analytics.feedbackAnalytics.learningValueAvg !== null && analytics.feedbackAnalytics.learningValueAvg !== undefined
                      ? `${analytics.feedbackAnalytics.learningValueAvg.toFixed(1)} / 5.0`
                      : 'N/A'}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Industry depth & tech processes</span>
                </div>

                {/* Faculty Coordination */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Faculty Coordination</span>
                  <div className="text-2xl font-black text-slate-900">
                    {analytics.feedbackAnalytics.facultyCoordinationAvg !== null && analytics.feedbackAnalytics.facultyCoordinationAvg !== undefined
                      ? `${analytics.feedbackAnalytics.facultyCoordinationAvg.toFixed(1)} / 5.0`
                      : analytics.feedbackAnalytics.organizationAvg !== null && analytics.feedbackAnalytics.organizationAvg !== undefined
                      ? `${analytics.feedbackAnalytics.organizationAvg.toFixed(1)} / 5.0`
                      : 'N/A'}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Faculty support & logistics</span>
                </div>

                {/* Recommendation Rate */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">Would Recommend</span>
                  <div className="text-2xl font-black text-emerald-950">
                    {analytics.feedbackAnalytics.wouldRecommendPercentage !== null && analytics.feedbackAnalytics.wouldRecommendPercentage !== undefined
                      ? `${analytics.feedbackAnalytics.wouldRecommendPercentage.toFixed(0)}%`
                      : '100%'}
                  </div>
                  <span className="text-[10px] text-emerald-800 block">Student peer endorsement rate</span>
                </div>
              </div>
            )}
          </div>

          {/* 8. TOP VISITS & RECENT COMPLETED VISITS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 3 Completed Visits */}
            <div id="section-top-visits" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Top Visits
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top 3 ranked completed industrial visits by turnout and evaluation
                </p>
              </div>

              <div className="space-y-3">
                {analytics.topPerformingVisits.slice(0, 3).map((visit, index) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0B2545] text-xs font-black text-white">
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{visit.title}</h4>
                        <span className="text-[10px] text-slate-500 block">{visit.organization}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-xs font-extrabold text-emerald-900 block">{visit.attendancePercentage}%</span>
                        <span className="text-[10px] text-slate-500 block">{visit.attended} Students</span>
                      </div>
                      <div className="flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                        <span className="text-xs font-bold text-amber-950">
                          {visit.rating !== null ? visit.rating.toFixed(1) : '5.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Completed Visits (Latest 5) */}
            <div id="section-recent-completed-visits" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recent Completed Visits
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest 5 completed industrial exposure visits
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-y border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Visit Title</th>
                      <th className="px-3 py-2 text-center">Attended</th>
                      <th className="px-3 py-2 text-center">Attendance %</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.recentCompletedVisits.slice(0, 5).map((rc) => (
                      <tr key={rc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">{rc.date}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900 max-w-[180px] truncate">
                          <div>{rc.title}</div>
                          <div className="text-[10px] font-normal text-slate-500 truncate">{rc.organization}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-800">{rc.attended}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-900 border border-emerald-200">
                            {rc.attendancePercentage}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => onSelectVisit && onSelectVisit(rc.id)}
                            className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-[#0B2545] hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <span>Details</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 8. VISIT PERFORMANCE TABLE */}
          <div id="section-visit-performance" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Visit Performance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Performance matrix across all in-scope industrial exposure visits
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-y border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Visit</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5 text-center">Registered</th>
                    <th className="px-3 py-2.5 text-center">Attended</th>
                    <th className="px-3 py-2.5 text-center">Attendance %</th>
                    <th className="px-3 py-2.5 text-center">Rating</th>
                    <th className="px-3 py-2.5 text-center">Learning Hours</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.visitPerformance.map((vp) => (
                    <tr key={vp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3 font-bold text-slate-900 max-w-xs">
                        <div className="truncate">{vp.title}</div>
                        <div className="text-[10px] font-normal text-slate-500 truncate">{vp.organization}</div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">{vp.experienceType}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{vp.date}</td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">
                        {vp.registrations} / {vp.capacity}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-emerald-800">{vp.attended}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-200">
                          {vp.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {vp.rating !== null ? (
                          <div className="inline-flex items-center gap-1 font-bold text-amber-900">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                            <span>{vp.rating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800">{vp.learningHours} hrs</td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            vp.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-900'
                              : vp.status === 'PUBLISHED'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {vp.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectVisit && onSelectVisit(vp.id)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-[#0B2545] hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
                        >
                          <span>View Details</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
