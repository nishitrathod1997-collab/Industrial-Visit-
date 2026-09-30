import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ExperienceWithMeta, Announcement } from '../../types';
import {
  Compass,
  QrCode,
  CalendarCheck,
  Building2,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Sparkles,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface StudentHomeProps {
  onNavigate: (tab: string, experienceId?: string) => void;
  onOpenBoardingPass: (experience: ExperienceWithMeta) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ onNavigate, onOpenBoardingPass }) => {
  const { user, student } = useAuth();
  const [experiences, setExperiences] = useState<ExperienceWithMeta[]>([]);
  const [userExps, setUserExps] = useState<{
    upcoming: ExperienceWithMeta[];
    waitlisted: ExperienceWithMeta[];
    completed: ExperienceWithMeta[];
    cancelled: ExperienceWithMeta[];
  }>({ upcoming: [], waitlisted: [], completed: [], cancelled: [] });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allExp, userExpRes, annRes] = await Promise.all([
        api.getExperiences({ status: 'PUBLISHED' }),
        api.getStudentExperiences(),
        api.getNotifications(),
      ]);
      setExperiences(allExp || []);
      setUserExps({
        upcoming: userExpRes?.upcoming || [],
        waitlisted: userExpRes?.waitlisted || [],
        completed: userExpRes?.completed || [],
        cancelled: userExpRes?.cancelled || [],
      });

      // Official announcements from faculty coordinators
      const anns: Announcement[] = [
        {
          id: 'ann_1',
          experienceId: 'exp_siemens_01',
          createdBy: 'usr_faculty_1',
          authorName: 'Dr. Arvind Swaminathan (Coordinator)',
          title: 'Siemens Visit: Bus Bay #3 Allocated',
          message: 'All registered students must report at Bus Bay #3 by 07:30 AM with physical student ID and formal attire.',
          createdAt: '2026-08-12T10:00:00Z',
        },
        {
          id: 'ann_2',
          experienceId: 'exp_tcs_02',
          createdBy: 'usr_faculty_1',
          authorName: 'Dr. Arvind Swaminathan (Coordinator)',
          title: 'TCS Innovation Labs: Registration Closing Soon',
          message: 'Registration is rapidly filling up for the TCS Applied AI research tour. Deadline is 18 Sep 2026.',
          createdAt: '2026-08-14T09:00:00Z',
        },
      ];
      setAnnouncements(anns);
    } catch (err) {
      console.error('Error loading student home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = student?.name ? student.name.split(' ')[0] : 'Student';

  const recommended = experiences
    .filter((e) => e.isEligible && e.seatsRemaining > 0 && !e.userRegistration)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 3);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 1. Institutional Greeting & Welcome Banner */}
      <div className="rounded-2xl bg-[#0B2545] p-6 sm:p-7 text-white shadow-md border border-blue-900 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-xs font-semibold">
                {student?.branch} • Year {student?.year}
              </span>
              <span className="text-xs text-blue-200 font-mono">Roll: {student?.studentId}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2">
              {getGreeting()}, {firstName}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1.5 max-w-2xl leading-relaxed">
              Explore premier industrial immersion visits, manage your active boarding passes, and review hands-on technical tour registrations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => onNavigate('explore')}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-sm cursor-pointer"
            >
              <Compass className="h-4 w-4 text-slate-950" />
              <span className="tracking-wide uppercase text-[11px]">Explore All Visits</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Quick Access Portals
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            onClick={() => onNavigate('explore')}
            className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-[#0B2545] hover:shadow-sm transition-all group cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#0B2545] group-hover:bg-[#0B2545] group-hover:text-white transition-colors">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#0B2545] transition-colors">
                Available Tours
              </p>
              <p className="text-[11px] text-slate-500">Discover upcoming industrial tours</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('my-experiences')}
            className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-[#0B2545] hover:shadow-sm transition-all group cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-800 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#0B2545] transition-colors">
                My Bookings ({userExps.upcoming.length})
              </p>
              <p className="text-[11px] text-slate-500">View confirmed passes & status</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('notifications')}
            className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-[#0B2545] hover:shadow-sm transition-all group cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#0B2545] transition-colors">
                Notices & Alerts
              </p>
              <p className="text-[11px] text-slate-500">Faculty briefings & schedule notes</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Active Next Scheduled Experience Card */}
      {userExps.upcoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Next Scheduled Industrial Immersion
            </h3>
            <button
              onClick={() => onNavigate('my-experiences')}
              className="text-xs font-semibold text-[#0B2545] hover:underline cursor-pointer flex items-center gap-1"
            >
              View All ({userExps.upcoming.length}) <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {userExps.upcoming.slice(0, 1).map((exp) => (
            <div
              key={exp.id}
              className="rounded-2xl border border-blue-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    SEAT CONFIRMED ✓
                  </span>
                  <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-[#0B2545]">
                    {exp.experienceType}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Pass #{exp.userBoardingPass?.passNumber}</span>
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 hover:text-[#0B2545] cursor-pointer" onClick={() => onNavigate('experience-detail', exp.id)}>
                    {exp.title}
                  </h4>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                    Host: <strong className="text-slate-900">{exp.organization}</strong> • {exp.location}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="h-4 w-4 text-[#0B2545]" />
                    <span><strong>Date:</strong> {exp.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span><strong>Reporting:</strong> {exp.travelInfo?.reportingTime || '07:30 AM'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span><strong>Location:</strong> {exp.travelInfo?.reportingLocation || 'Main Campus'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => onOpenBoardingPass(exp)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#0B2545] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-sm cursor-pointer"
                >
                  <QrCode className="h-4 w-4 text-amber-400" />
                  <span>View Boarding Pass</span>
                </button>
                <button
                  onClick={() => onNavigate('experience-detail', exp.id)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>Tour Details</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Two-Column Layout: Recommended Experiences & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recommended Industrial Opportunities */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recommended For Your Academic Profile
              </h3>
              <p className="text-[11px] text-slate-500">Curated opportunities matching {student?.branch} curriculum</p>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="text-xs font-semibold text-[#0B2545] hover:underline cursor-pointer flex items-center gap-1"
            >
              Browse All ({experiences.length}) <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
              <p className="text-xs text-slate-500 mt-2">Loading eligible experiences...</p>
            </div>
          ) : recommended.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Compass className="mx-auto h-8 w-8 text-slate-400" />
              <p className="text-xs font-medium text-slate-600 mt-2">All matched experiences are currently registered or filled.</p>
              <button
                onClick={() => onNavigate('explore')}
                className="mt-3 text-xs font-semibold text-[#0B2545] underline cursor-pointer"
              >
                Browse all available tours
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {recommended.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => onNavigate('experience-detail', exp.id)}
                  className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs hover:border-[#0B2545] hover:shadow-sm transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0B2545]">
                        {exp.experienceType}
                      </span>
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {exp.seatsRemaining} Seats Open
                      </span>
                      {exp.matchScore !== undefined && (
                        <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-amber-700" />
                          {exp.matchScore}% Match
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0B2545] transition-colors">
                      {exp.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                        {exp.organization}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {exp.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {exp.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('experience-detail', exp.id);
                      }}
                      className="rounded-lg bg-[#0B2545] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#133E87] transition-colors shadow-2xs cursor-pointer"
                    >
                      View & Register
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Official Announcements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Department Notices
            </h3>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {ann.title}
                  </h4>
                  <Bell className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ann.message}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                  <span>{ann.authorName}</span>
                  <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            <div className="rounded-xl bg-blue-50/70 p-3.5 border border-blue-200/60 text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-[#0B2545]">Need Guidance?</p>
              <p className="text-[11px] text-slate-600">
                Ask the <strong>VIT Assistant</strong> for real-time clarification on reporting bays, dress codes, bus allocations, and leave policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
