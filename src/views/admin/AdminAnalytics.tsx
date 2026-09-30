import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AnalyticsDashboard } from '../../components/AnalyticsDashboard';
import { Sparkles, RefreshCw, CheckCircle2, TrendingUp, Award } from 'lucide-react';

interface AdminAnalyticsProps {
  onSelectVisit?: (visitId: string) => void;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ onSelectVisit }) => {
  const [insights, setInsights] = useState<{
    summary: string;
    highlights: string[];
    recommendations: string[];
  } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const data = await api.getAdminAIInsights();
      setInsights(data);
    } catch (err) {
      console.warn('Failed to load AI insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gemini AI Executive Briefing */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/40 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Gemini Institutional Intelligence & Telemetry Briefing
                </h3>
                <p className="text-[11px] text-slate-500">
                  Real-time data-grounded synthesis of registration integrity, departmental distribution, and coordinator workload
                </p>
              </div>
            </div>

            <button
              onClick={loadInsights}
              disabled={loadingInsights}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-50 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${loadingInsights ? 'animate-spin' : ''}`} />
              <span>{loadingInsights ? 'Analyzing Live Data...' : 'Refresh Insights'}</span>
            </button>
          </div>

          {insights ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-2 text-slate-700 leading-relaxed whitespace-pre-line">
                {insights.summary}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                    <TrendingUp className="h-4 w-4 text-emerald-700" />
                    <span>Key Telemetry Highlights</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 text-[11px]">
                    {insights.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                    <Award className="h-4 w-4 text-blue-700" />
                    <span>Strategic Scaling Recommendations</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 text-[11px]">
                    {insights.recommendations.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[9px] font-bold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              <p className="text-xs text-slate-500 mt-1">Generating institutional intelligence briefing...</p>
            </div>
          )}
        </div>
      </div>

      {/* Shared Central Analytics Dashboard */}
      <AnalyticsDashboard mode="ADMIN" onSelectVisit={onSelectVisit} />
    </div>
  );
};
