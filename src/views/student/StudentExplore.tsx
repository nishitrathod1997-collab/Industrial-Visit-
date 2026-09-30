import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ExperienceWithMeta, ExperienceType } from '../../types';
import { CompanyImage } from '../../components/common/CompanyImage';
import { BoardingPassModal } from '../../components/common/BoardingPassModal';
import { ReviewRegistrationModal } from '../../components/common/ReviewRegistrationModal';
import { formatISTDateTime, isRegistrationDeadlinePassed } from '../../utils/dateUtils';
import confetti from 'canvas-confetti';
import {
  Search,
  Building2,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  Compass,
  IndianRupee,
  RotateCcw,
  ShieldCheck,
  QrCode,
} from 'lucide-react';

interface StudentExploreProps {
  onSelectExperience: (experienceId: string) => void;
}

const CATEGORY_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Industrial Visits', value: 'Industrial Visits' },
  { label: 'Technical Tours', value: 'Technical Tours' },
  { label: 'Field Research', value: 'Field Research' },
];

export const StudentExplore: React.FC<StudentExploreProps> = ({ onSelectExperience }) => {
  const { student, user, refreshAuth } = useAuth();
  const [experiences, setExperiences] = useState<ExperienceWithMeta[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, { matchScore: number; suitabilityExplanation: string }>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal States
  const [selectedExpForTicket, setSelectedExpForTicket] = useState<ExperienceWithMeta | null>(null);
  const [selectedExpForRegister, setSelectedExpForRegister] = useState<ExperienceWithMeta | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters State: Category (All | Industrial Visits | Technical Tours | Field Research)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Eligibility Quick Filter: 'ALL' | 'ELIGIBLE_ONLY'
  const [eligibilityFilter, setEligibilityFilter] = useState<'ALL' | 'ELIGIBLE_ONLY'>('ALL');

  // Filter 1: Year (All | 1 | 2 | 3 | 4)
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  // Filter 2: Branch (All | MY_BRANCH | specific engineering branch)
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');

  // Filter 3: Dates (All | THIS_MONTH | NEXT_30_DAYS | NEXT_60_DAYS | UPCOMING)
  const [selectedDate, setSelectedDate] = useState<string>('ALL');

  // Filter 4: Location (All | specific city/region)
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');

  // Filter 5: Availability (All | AVAILABLE | WAITLIST)
  const [selectedAvailability, setSelectedAvailability] = useState<string>('ALL');

  // Search Query
  const [search, setSearch] = useState<string>('');

  // Sorting Option: RECOMMENDED | DATE_ASC | SEATS_DESC | TITLE_ASC
  const [sortBy, setSortBy] = useState<'RECOMMENDED' | 'DATE_ASC' | 'SEATS_DESC' | 'TITLE_ASC'>('RECOMMENDED');

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    setLoading(true);
    try {
      const data = await api.getExperiences({ status: 'PUBLISHED' });
      setExperiences(data);

      // Fetch student AI recommendations
      try {
        const recs = await api.getAIRecommendations();
        const recMap: Record<string, { matchScore: number; suitabilityExplanation: string }> = {};
        for (const r of recs) {
          recMap[r.experienceId] = {
            matchScore: r.matchScore,
            suitabilityExplanation: r.suitabilityExplanation,
          };
        }
        setRecommendations(recMap);
      } catch (e) {
        console.warn('Could not load AI recommendations:', e);
      }
    } catch (err) {
      console.error('Failed to load experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  const studentBranch = student?.branch || 'Computer Science & Engineering';

  // Extract unique Branches dynamically from data + standard VIT departments
  const branches = useMemo(() => {
    const set = new Set<string>([
      'Computer Science & Engineering',
      'Information Technology',
      'Electronics & Communication Engineering',
      'Mechanical Engineering',
      'Electrical & Electronics Engineering',
      'Civil Engineering',
      'Biotechnology',
      'Biomedical Engineering',
    ]);
    experiences.forEach((e) => {
      e.eligibility?.allowedBranches?.forEach((b) => set.add(b));
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [experiences]);

  // Extract unique Locations (cities) dynamically from data
  const locations = useMemo(() => {
    const set = new Set<string>();
    experiences.forEach((e) => {
      if (e.location) {
        const parts = e.location.split(',');
        const cityCandidate = parts[parts.length - 1]?.trim() || parts[0]?.trim();
        if (cityCandidate) set.add(cityCandidate);
      }
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [experiences]);

  // Count eligible trips for current student
  const eligibleTripsCount = useMemo(() => {
    return experiences.filter((e) => e.isEligible).length;
  }, [experiences]);

  // Count active filters for reset badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'ALL') count++;
    if (eligibilityFilter !== 'ALL') count++;
    if (selectedYear !== 'ALL') count++;
    if (selectedBranch !== 'ALL') count++;
    if (selectedDate !== 'ALL') count++;
    if (selectedLocation !== 'ALL') count++;
    if (selectedAvailability !== 'ALL') count++;
    if (search.trim()) count++;
    return count;
  }, [selectedCategory, eligibilityFilter, selectedYear, selectedBranch, selectedDate, selectedLocation, selectedAvailability, search]);

  const clearAllFilters = () => {
    setSelectedCategory('ALL');
    setEligibilityFilter('ALL');
    setSelectedYear('ALL');
    setSelectedBranch('ALL');
    setSelectedDate('ALL');
    setSelectedLocation('ALL');
    setSelectedAvailability('ALL');
    setSearch('');
  };

  // Helper to normalize any legacy experience type to one of the 3 permitted categories
  const normalizeCategory = (typeStr: string): string => {
    if (!typeStr) return 'Industrial Visits';
    const s = typeStr.trim().toLowerCase();
    if (s.includes('industrial') || s.includes('industry')) return 'Industrial Visits';
    if (s.includes('technical') || s.includes('tour') || s.includes('corporate') || s.includes('immersion')) return 'Technical Tours';
    if (s.includes('field') || s.includes('research') || s.includes('r&d') || s.includes('site') || s.includes('workshop')) return 'Field Research';
    return typeStr;
  };

  // Progressive multi-condition filtering (AND logic)
  // 1. Base filtered experiences applying all active filters except the category tab
  const baseFilteredExperiences = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return experiences.filter((exp) => {
      // 1. Eligibility Filter (Eligible for student)
      if (eligibilityFilter === 'ELIGIBLE_ONLY') {
        if (!exp.isEligible) return false;
      }

      // 2. Year Filter
      if (selectedYear !== 'ALL') {
        const targetYearNum = parseInt(selectedYear, 10);
        const allowedYears = exp.eligibility?.allowedYears;
        if (allowedYears && allowedYears.length > 0) {
          if (!allowedYears.includes(targetYearNum)) return false;
        }
      }

      // 3. Branch Filter
      if (selectedBranch === 'MY_BRANCH') {
        const allowedBranches = exp.eligibility?.allowedBranches || [];
        if (allowedBranches.length > 0 && !allowedBranches.includes(studentBranch)) {
          return false;
        }
      } else if (selectedBranch !== 'ALL') {
        const allowedBranches = exp.eligibility?.allowedBranches || (exp.eligibility as any)?.branches;
        if (allowedBranches && allowedBranches.length > 0) {
          if (!allowedBranches.includes(selectedBranch)) return false;
        }
      }

      // 4. Dates Filter
      if (selectedDate !== 'ALL') {
        const expDate = new Date(exp.date);
        expDate.setHours(0, 0, 0, 0);

        if (selectedDate === 'UPCOMING') {
          if (expDate < today) return false;
        } else if (selectedDate === 'THIS_MONTH') {
          if (
            expDate.getFullYear() !== today.getFullYear() ||
            expDate.getMonth() !== today.getMonth()
          ) {
            return false;
          }
        } else if (selectedDate === 'NEXT_30_DAYS') {
          const limit30 = new Date(today);
          limit30.setDate(limit30.getDate() + 30);
          if (expDate < today || expDate > limit30) return false;
        } else if (selectedDate === 'NEXT_60_DAYS') {
          const limit60 = new Date(today);
          limit60.setDate(limit60.getDate() + 60);
          if (expDate < today || expDate > limit60) return false;
        } else if (selectedDate === 'PAST') {
          if (expDate >= today) return false;
        }
      }

      // 5. Location Filter
      if (selectedLocation !== 'ALL') {
        const locLower = (exp.location || '').toLowerCase();
        const targetLower = selectedLocation.toLowerCase();
        if (!locLower.includes(targetLower)) return false;
      }

      // 6. Availability Filter
      if (selectedAvailability === 'AVAILABLE') {
        if (exp.seatsRemaining <= 0) return false;
      } else if (selectedAvailability === 'WAITLIST') {
        if (exp.seatsRemaining > 0 || !exp.waitlistEnabled || exp.waitlistCount >= exp.waitlistCapacity) {
          return false;
        }
      }

      // 7. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = exp.title.toLowerCase().includes(q);
        const matchesOrg = exp.organization.toLowerCase().includes(q);
        const matchesLoc = exp.location.toLowerCase().includes(q);
        const matchesIndustry = (exp.organizationIndustry || '').toLowerCase().includes(q);
        const matchesType = normalizeCategory(exp.experienceType).toLowerCase().includes(q);
        const matchesBranches =
          exp.eligibility?.allowedBranches?.some((b) => b.toLowerCase().includes(q)) ?? false;
        const matchesDesc = (exp.shortDescription || '').toLowerCase().includes(q);

        if (
          !matchesTitle &&
          !matchesOrg &&
          !matchesLoc &&
          !matchesIndustry &&
          !matchesType &&
          !matchesBranches &&
          !matchesDesc
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    experiences,
    eligibilityFilter,
    selectedYear,
    selectedBranch,
    selectedDate,
    selectedLocation,
    selectedAvailability,
    search,
    studentBranch,
  ]);

  // 2. Dynamic count map for each category tab based on the active filters
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: baseFilteredExperiences.length,
      'Industrial Visits': 0,
      'Technical Tours': 0,
      'Field Research': 0,
    };
    baseFilteredExperiences.forEach((exp) => {
      const cat = normalizeCategory(exp.experienceType);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [baseFilteredExperiences]);

  // 3. Final filtered and sorted list based on selectedCategory tab and sortBy
  const filtered = useMemo(() => {
    let list =
      selectedCategory === 'ALL'
        ? [...baseFilteredExperiences]
        : baseFilteredExperiences.filter(
            (exp) => normalizeCategory(exp.experienceType) === selectedCategory
          );

    return list.sort((a, b) => {
      if (sortBy === 'RECOMMENDED') {
        const scoreA = recommendations[a.id]?.matchScore ?? a.matchScore ?? 0;
        const scoreB = recommendations[b.id]?.matchScore ?? b.matchScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'DATE_ASC') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'SEATS_DESC') {
        return b.seatsRemaining - a.seatsRemaining;
      } else if (sortBy === 'TITLE_ASC') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [baseFilteredExperiences, selectedCategory, sortBy, recommendations]);

  const handleOpenTicket = async (exp: ExperienceWithMeta) => {
    if (exp.userBoardingPass) {
      setSelectedExpForTicket(exp);
    } else {
      try {
        const res = await api.getBoardingPass(exp.id);
        if (res?.boardingPass) {
          setSelectedExpForTicket({
            ...exp,
            userBoardingPass: res.boardingPass,
          });
        } else {
          onSelectExperience(exp.id);
        }
      } catch (err) {
        console.error('Could not fetch boarding pass:', err);
        onSelectExperience(exp.id);
      }
    }
  };

  const handleStartRegistration = (exp: ExperienceWithMeta) => {
    setSelectedExpForRegister(exp);
  };

  const handleConfirmRegistration = async (consentDocumentUrl?: string) => {
    if (!selectedExpForRegister) return;
    setActionLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await api.registerForExperience(selectedExpForRegister.id, consentDocumentUrl);
      const targetExp = selectedExpForRegister;
      setSelectedExpForRegister(null);

      // Refresh data from database source of truth
      await loadExperiences();
      refreshAuth();

      if (res.status === 'REGISTERED') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setFeedbackMessage({
          type: 'success',
          text: `Registration confirmed for ${targetExp.title}! Your official Boarding Pass is ready.`,
        });
        if (res.boardingPass) {
          setSelectedExpForTicket({
            ...targetExp,
            userBoardingPass: res.boardingPass,
          });
        }
      } else if (res.status === 'REJECTED' || res.consentStatus === 'REJECTED') {
        setFeedbackMessage({
          type: 'error',
          text:
            res.consentValidationResult?.reason ||
            (res as any).rejectionReason ||
            res.message ||
            'Consent form validation failed. Please upload a valid signed Parent/Guardian Consent Form.',
        });
      } else if (res.status === 'WAITLISTED') {
        setFeedbackMessage({
          type: 'success',
          text: `Added to waiting queue at position #${res.waitlistEntry?.position || res.waitlistPosition || 1} for ${targetExp.title}.`,
        });
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.message || 'Registration could not be completed.',
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to complete registration.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (exp: ExperienceWithMeta) => {
    const isRegistered =
      exp.userRegistration?.status === 'REGISTERED' || exp.userRegistration?.status === 'COMPLETED';
    const isWaitlisted =
      (exp.userWaitlistEntry?.status === 'ACTIVE' && !isRegistered) ||
      exp.userRegistration?.status === 'WAITLISTED';

    if (isRegistered) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 shadow-2xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          CONFIRMED
        </span>
      );
    }
    if (isWaitlisted) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-300 shadow-2xs">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          WAITING LIST #{exp.userWaitlistEntry?.position || 1}
        </span>
      );
    }
    if (!exp.isEligible) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 border border-slate-200">
          <AlertCircle className="h-3.5 w-3.5" />
          Not Eligible
        </span>
      );
    }
    if (exp.registrationDeadlinePassed || exp.isRegistrationClosed || isRegistrationDeadlinePassed(exp.registrationDeadline)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200 shadow-2xs">
          <Clock className="h-3.5 w-3.5 text-rose-600" />
          REGISTRATION CLOSED
        </span>
      );
    }
    if (exp.seatsRemaining > 0) {
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
          {exp.seatsRemaining} Seats Open
        </span>
      );
    }
    if (exp.waitlistEnabled && exp.waitlistCount < exp.waitlistCapacity) {
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-200 shadow-2xs">
          Waitlist ({exp.waitlistCount}/{exp.waitlistCapacity})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
        Capacity Reached
      </span>
    );
  };

  const formatDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    return formatISTDateTime(deadlineStr);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Compass className="h-6 w-6 text-[#0B2545]" />
            Industrial Visits & Technical Exposures
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Discover verified industrial tours, technical visits, and field research expeditions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="h-3 w-3" />
              Clear Filters ({activeFiltersCount})
            </button>
          )}
          <div className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Showing <strong className="text-slate-900">{filtered.length}</strong> of {experiences.length} Visits
          </div>
        </div>
      </div>

      {/* Top Bar: Category Tabs + Quick Eligibility Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs: All | Industrial Visits | Technical Tours | Field Research */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedCategory(tab.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {categoryCounts[tab.value] ?? (tab.value === 'ALL' ? baseFilteredExperiences.length : 0)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Filter: Eligible Trips Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setEligibilityFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              eligibilityFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Trips
          </button>
          <button
            onClick={() => setEligibilityFilter('ELIGIBLE_ONLY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              eligibilityFilter === 'ELIGIBLE_ONLY'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-800 hover:bg-emerald-100/60'
            }`}
            title={`Show visits eligible for ${studentBranch}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Eligible for Me</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                eligibilityFilter === 'ELIGIBLE_ONLY' ? 'bg-white/25 text-white' : 'bg-emerald-200/80 text-emerald-900'
              }`}
            >
              {eligibleTripsCount}
            </span>
          </button>
        </div>
      </div>

      {/* Explore Page Filter Section: ONLY Year, Branch, Dates, Location, Availability + Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
        {/* Search Bar & Sort Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visits by company name, technology, city, branch, or keywords..."
              className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-9 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
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

          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">
              Sort:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#0B2545] focus:outline-none cursor-pointer"
            >
              <option value="RECOMMENDED">⚡ Recommended (Best Match)</option>
              <option value="DATE_ASC">📅 Date (Soonest First)</option>
              <option value="SEATS_DESC">🪑 Seats (Most Available)</option>
              <option value="TITLE_ASC">🔤 Title (A to Z)</option>
            </select>
          </div>
        </div>

        {/* 5 Filters Row: Year | Branch | Dates | Location | Availability */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          {/* 1. Year Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold focus:border-[#0B2545] focus:outline-none cursor-pointer truncate ${
                selectedYear !== 'ALL'
                  ? 'border-[#0B2545] bg-blue-50/50 text-[#0B2545]'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <option value="ALL">All Years</option>
              <option value="1">1st Year (FE)</option>
              <option value="2">2nd Year (SE)</option>
              <option value="3">3rd Year (TE)</option>
              <option value="4">4th Year (BE)</option>
            </select>
          </div>

          {/* 2. Branch Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold focus:border-[#0B2545] focus:outline-none cursor-pointer truncate ${
                selectedBranch !== 'ALL'
                  ? 'border-[#0B2545] bg-blue-50/50 text-[#0B2545]'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <option value="ALL">All Branches</option>
              <option value="MY_BRANCH">⭐ My Branch ({studentBranch.split(' ')[0]})</option>
              <option disabled>──────────</option>
              {branches
                .filter((b) => b !== 'ALL')
                .map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
            </select>
          </div>

          {/* 3. Dates Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Dates
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold focus:border-[#0B2545] focus:outline-none cursor-pointer truncate ${
                selectedDate !== 'ALL'
                  ? 'border-[#0B2545] bg-blue-50/50 text-[#0B2545]'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <option value="ALL">All Dates</option>
              <option value="UPCOMING">Upcoming Visits</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="NEXT_30_DAYS">Next 30 Days</option>
              <option value="NEXT_60_DAYS">Next 60 Days</option>
              <option value="PAST">Past Visits</option>
            </select>
          </div>

          {/* 4. Location Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold focus:border-[#0B2545] focus:outline-none cursor-pointer truncate ${
                selectedLocation !== 'ALL'
                  ? 'border-[#0B2545] bg-blue-50/50 text-[#0B2545]'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <option value="ALL">All Locations</option>
              {locations
                .filter((l) => l !== 'ALL')
                .map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
            </select>
          </div>

          {/* 5. Availability Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Availability
            </label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold focus:border-[#0B2545] focus:outline-none cursor-pointer truncate ${
                selectedAvailability !== 'ALL'
                  ? 'border-[#0B2545] bg-blue-50/50 text-[#0B2545]'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <option value="ALL">All Availability</option>
              <option value="AVAILABLE">Seats Open</option>
              <option value="WAITLIST">Waitlist Open</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`rounded-xl p-4 text-xs font-medium border flex items-center justify-between shadow-xs ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs underline font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Visits Cards Grid */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading verified industrial tours...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-sm font-bold text-slate-800 mt-2">No matching visits found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {eligibilityFilter === 'ELIGIBLE_ONLY'
              ? `No visits currently match your filter criteria that are eligible for ${studentBranch}. Try switching to "All Trips" or clearing some filters.`
              : 'No visits matched all selected filter criteria. Try clearing filters to view all available visits.'}
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#07192f] rounded-lg px-4 py-2 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((exp) => {
            const match = recommendations[exp.id];
            const deadline = formatDeadline(exp.registrationDeadline);
            const fee = (exp.contribution || 0) === 0 ? 'Free' : `₹${exp.contribution}`;
            const normalizedCategory = normalizeCategory(exp.experienceType);

            const isRegistered =
              exp.userRegistration?.status === 'REGISTERED' || exp.userRegistration?.status === 'COMPLETED';
            const isWaitlisted =
              (exp.userWaitlistEntry?.status === 'ACTIVE' && !isRegistered) ||
              exp.userRegistration?.status === 'WAITLISTED';
            const seatsOpen = exp.seatsRemaining > 0;
            const canWaitlist = !seatsOpen && exp.waitlistEnabled && exp.waitlistCount < exp.waitlistCapacity;

            return (
              <div
                key={exp.id}
                onClick={() => onSelectExperience(exp.id)}
                className={`rounded-xl border bg-white shadow-xs transition-all flex flex-col justify-between cursor-pointer group overflow-hidden ${
                  isRegistered
                    ? 'border-emerald-300 ring-1 ring-emerald-200/60 shadow-sm'
                    : isWaitlisted
                    ? 'border-amber-300 ring-1 ring-amber-200/60'
                    : 'border-slate-200 hover:border-[#0B2545] hover:shadow-md'
                }`}
              >
                {/* Card Banner Image */}
                <CompanyImage
                  src={exp.image}
                  alt={exp.title}
                  companyName={exp.organization}
                  logoSrc={exp.organizationLogo}
                  aspectRatio="video"
                />

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2.5">
                    {/* Top Badges: Category & Status */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-[#0B2545]">
                          {normalizedCategory}
                        </span>
                        {(match?.matchScore !== undefined || exp.matchScore !== undefined) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                            <Sparkles className="h-3 w-3 text-amber-600" />
                            {match?.matchScore ?? exp.matchScore}% Match
                          </span>
                        )}
                      </div>
                      {getStatusBadge(exp)}
                    </div>

                    {/* Title & Organization */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0B2545] transition-colors line-clamp-1">
                        {exp.title}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-[#0B2545] flex-shrink-0" />
                        <span className="font-semibold text-slate-900">{exp.organization}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 truncate">
                          {exp.organizationIndustry || (exp as any).industry || 'Engineering'}
                        </span>
                      </p>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {exp.shortDescription || exp.detailedDescription || (exp as any).description || 'Industrial exposure tour.'}
                    </p>

                    {/* 4-Item Meta Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800">{exp.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{exp.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800">
                          {exp.registeredCount} / {exp.capacity} Filled
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-bold text-slate-900">{fee}</span>
                        {deadline && (
                          <span className="text-[10px] text-slate-500 ml-auto">
                            Reg by {deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Registration Status Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                    {/* Left: Eligibility / Status Label */}
                    <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                      {isRegistered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                          <span>Pass Ready</span>
                        </span>
                      ) : isWaitlisted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900">
                          <Clock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                          <span>Waitlist Active</span>
                        </span>
                      ) : exp.isEligible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 truncate">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">Open for {exp.eligibility?.allowedBranches?.join(', ') || 'All Branches'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 truncate">
                          <AlertCircle className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{exp.eligibility?.allowedBranches?.join(', ') || 'Restricted'}</span>
                        </span>
                      )}
                    </div>

                    {/* Right: Dynamic Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isRegistered ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTicket(exp);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2545] hover:bg-[#133E87] px-3 py-1.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                          >
                            <QrCode className="h-3.5 w-3.5 text-amber-300" />
                            <span>SHOW TICKET</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectExperience(exp.id);
                            }}
                            className="text-xs font-bold text-[#0B2545] hover:text-[#133E87] flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <span>Details</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : isWaitlisted ? (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 text-xs font-bold shadow-2xs">
                            <Clock className="h-3 w-3 text-amber-700" />
                            <span>WAITING LIST #{exp.userWaitlistEntry?.position || 1}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectExperience(exp.id);
                            }}
                            className="text-xs font-bold text-[#0B2545] hover:text-[#133E87] flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <span>Details</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : exp.isEligible ? (
                        (exp.registrationDeadlinePassed || exp.isRegistrationClosed || isRegistrationDeadlinePassed(exp.registrationDeadline)) ? (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 text-xs font-bold shadow-2xs">
                              <Clock className="h-3 w-3 text-slate-500" />
                              <span>CLOSED</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectExperience(exp.id);
                              }}
                              className="text-xs font-bold text-[#0B2545] hover:text-[#133E87] flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <span>Details</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : seatsOpen ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRegistration(exp);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#0B2545] hover:bg-[#133E87] px-3 py-1.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                            >
                              <span>REGISTER FOR VISIT</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectExperience(exp.id);
                              }}
                              className="text-xs font-bold text-slate-600 hover:text-[#0B2545] flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <span>Details</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : canWaitlist ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRegistration(exp);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                            >
                              <Clock className="h-3 w-3 mr-0.5" />
                              <span>JOIN WAITING LIST</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectExperience(exp.id);
                              }}
                              className="text-xs font-bold text-slate-600 hover:text-[#0B2545] flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <span>Details</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectExperience(exp.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <span>Capacity Full</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectExperience(exp.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <span>View Details</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Registration Modal */}
      {selectedExpForRegister && student && (
        <ReviewRegistrationModal
          isOpen={!!selectedExpForRegister}
          onClose={() => setSelectedExpForRegister(null)}
          experience={selectedExpForRegister}
          student={student}
          onConfirm={handleConfirmRegistration}
          loading={actionLoading}
        />
      )}

      {/* Boarding Pass / Ticket Modal */}
      {selectedExpForTicket && selectedExpForTicket.userBoardingPass && student && (
        <BoardingPassModal
          isOpen={!!selectedExpForTicket}
          onClose={() => setSelectedExpForTicket(null)}
          boardingPass={selectedExpForTicket.userBoardingPass}
          experience={selectedExpForTicket}
          student={student}
        />
      )}
    </div>
  );
};
