import React, { useState } from 'react';
import { AnalyticsDashboard } from '../../components/AnalyticsDashboard';
import { PostTripReportsManager } from '../../components/common/PostTripReportsManager';
import { FileText, BarChart3, Image as ImageIcon } from 'lucide-react';

interface FacultyReportsProps {
  onSelectVisit?: (visitId: string) => void;
  initialExperienceId?: string;
}

export const FacultyReports: React.FC<FacultyReportsProps> = ({ onSelectVisit, initialExperienceId }) => {
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'ANALYTICS'>('REPORTS');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Faculty Reports & Outcomes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review student post-trip submissions, inspection photo galleries, and visit outcome analytics
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            id="faculty-tab-post-trip-reports"
            onClick={() => setActiveTab('REPORTS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'REPORTS'
                ? 'bg-white text-[#0B2545] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-amber-500" />
            <span>Post-Trip Reports & Photos</span>
          </button>

          <button
            id="faculty-tab-analytics"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'ANALYTICS'
                ? 'bg-white text-[#0B2545] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
            <span>Visit Analytics</span>
          </button>
        </div>
      </div>

      {activeTab === 'REPORTS' ? (
        <PostTripReportsManager role="FACULTY" initialExperienceId={initialExperienceId} />
      ) : (
        <AnalyticsDashboard mode="FACULTY" onSelectVisit={onSelectVisit} />
      )}
    </div>
  );
};

