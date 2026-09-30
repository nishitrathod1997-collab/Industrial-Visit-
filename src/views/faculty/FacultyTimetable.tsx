import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ExperienceWithMeta } from '../../types';
import { Clock, Building2, ArrowRight } from 'lucide-react';

interface FacultyTimetableProps {
  onSelectExperience: (id: string) => void;
}

export const FacultyTimetable: React.FC<FacultyTimetableProps> = ({ onSelectExperience }) => {
  const [experiences, setExperiences] = useState<ExperienceWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getFacultyExperiences();
      setExperiences(data);
    } catch (err) {
      console.error('Error loading faculty schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Faculty Visit Timetable</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological departure timeline, bus bay logistics, and on-site schedules for coordinated tours
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading timetable...</p>
        </div>
      ) : experiences.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Clock className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-xs font-medium text-slate-500 mt-2">No scheduled visits in your timetable.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Upcoming Visits Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Upcoming Departure Timetable ({experiences.filter((e) => e.status === 'PUBLISHED').length})
              </h3>
            </div>

            {experiences.filter((e) => e.status === 'PUBLISHED').length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                No active upcoming visit departures scheduled.
              </div>
            ) : (
              <div className="relative border-l-2 border-emerald-300 ml-4 pl-6 space-y-6">
                {experiences
                  .filter((e) => e.status === 'PUBLISHED')
                  .map((exp) => (
                    <div key={exp.id} className="relative group">
                      <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 ring-4 ring-emerald-100 group-hover:scale-110 transition-transform shadow-xs" />
                      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#0B2545] transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                              {exp.date}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 mt-1">{exp.title}</h3>
                            <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                              <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                              <span className="text-slate-900 font-semibold">{exp.organization}</span>
                              <span>•</span>
                              <span>{exp.location}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => onSelectExperience(exp.id)}
                            className="flex items-center gap-1 text-xs font-bold text-[#0B2545] hover:underline cursor-pointer"
                          >
                            <span>View Itinerary</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 text-xs">
                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                            <span className="text-slate-500 font-bold text-[10px] uppercase">Reporting</span>
                            <p className="font-bold text-slate-900 mt-0.5">{exp.travelInfo?.reportingTime || '07:30 AM'}</p>
                            <p className="text-[11px] text-slate-500">{exp.travelInfo?.reportingLocation || 'Bus Bay #3'}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                            <span className="text-slate-500 font-bold text-[10px] uppercase">Departure</span>
                            <p className="font-bold text-slate-900 mt-0.5">{exp.travelInfo?.departureTime || '08:00 AM'}</p>
                            <p className="text-[11px] text-slate-500">{exp.travelInfo?.transport}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                            <span className="text-slate-500 font-bold text-[10px] uppercase">Arrival at Venue</span>
                            <p className="font-bold text-slate-900 mt-0.5">{exp.travelInfo?.expectedArrival || '10:00 AM'}</p>
                            <p className="text-[11px] text-slate-500">Facility Security Entry</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                            <span className="text-slate-500 font-bold text-[10px] uppercase">Return to Campus</span>
                            <p className="font-bold text-slate-900 mt-0.5">{exp.travelInfo?.campusArrival || '05:30 PM'}</p>
                            <p className="text-[11px] text-slate-500">Main Campus Gate</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Past / Completed Visits Timetable */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                Completed & Historical Timetable Archive ({experiences.filter((e) => e.status === 'COMPLETED' || e.status === 'CANCELLED').length})
              </h3>
            </div>

            <div className="relative border-l-2 border-slate-300 ml-4 pl-6 space-y-6">
              {experiences
                .filter((e) => e.status === 'COMPLETED' || e.status === 'CANCELLED')
                .map((exp) => (
                  <div key={exp.id} className="relative group opacity-90 hover:opacity-100 transition-opacity">
                    <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 ring-4 ring-slate-200 shadow-xs" />
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 shadow-xs hover:border-slate-400 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                              {exp.date}
                            </span>
                            <span className="rounded bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#0B2545]">
                              COMPLETED
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">{exp.title}</h3>
                          <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="h-3.5 w-3.5 text-[#0B2545]" />
                            <span className="text-slate-900 font-semibold">{exp.organization}</span>
                            <span>•</span>
                            <span>{exp.location}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => onSelectExperience(exp.id)}
                          className="flex items-center gap-1 text-xs font-bold text-[#0B2545] hover:underline cursor-pointer"
                        >
                          <span>View Details</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 text-xs">
                        <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Reporting</span>
                          <p className="font-bold text-slate-800 mt-0.5">{exp.travelInfo?.reportingTime || '07:15 AM'}</p>
                          <p className="text-[11px] text-slate-500">{exp.travelInfo?.reportingLocation || 'Bus Bay #3'}</p>
                        </div>
                        <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Departure</span>
                          <p className="font-bold text-slate-800 mt-0.5">{exp.travelInfo?.departureTime || '07:30 AM'}</p>
                          <p className="text-[11px] text-slate-500">{exp.travelInfo?.transport}</p>
                        </div>
                        <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Arrival at Venue</span>
                          <p className="font-bold text-slate-800 mt-0.5">{exp.travelInfo?.expectedArrival || '09:00 AM'}</p>
                          <p className="text-[11px] text-slate-500">Security Gate Entry</p>
                        </div>
                        <div className="rounded-xl bg-white p-2.5 border border-slate-200">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Return to Campus</span>
                          <p className="font-bold text-slate-800 mt-0.5">{exp.travelInfo?.campusArrival || '06:15 PM'}</p>
                          <p className="text-[11px] text-slate-500">Main Gate Return</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
