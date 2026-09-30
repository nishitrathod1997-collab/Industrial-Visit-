import React from 'react';
import { Experience, ExperienceWithMeta } from '../../types';
import { CompanyImage } from '../common/CompanyImage';
import {
  X,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Award,
  IndianRupee,
  Eye,
  Check,
  CheckSquare,
  XCircle,
} from 'lucide-react';

interface ExperiencePreviewModalProps {
  experience: Experience | ExperienceWithMeta | null;
  onClose: () => void;
  onPublish?: (exp: Experience | ExperienceWithMeta) => void;
}

export const ExperiencePreviewModal: React.FC<ExperiencePreviewModalProps> = ({
  experience,
  onClose,
  onPublish,
}) => {
  if (!experience) return null;

  const fee = (experience.contribution || 0) === 0 ? 'Free Visit' : `₹${experience.contribution}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Preview Banner Bar */}
        <div className="bg-amber-500 text-slate-950 px-5 py-2.5 flex items-center justify-between font-bold text-xs flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-slate-950" />
            <span>Faculty Preview Mode: This is how students will view this industrial visit.</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-950 hover:bg-amber-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Preview Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Hero Banner Graphic */}
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <CompanyImage
              src={experience.image}
              alt={experience.title}
              companyName={experience.organization}
              logoSrc={experience.organizationLogo}
              aspectRatio="wide"
              className="max-h-64"
            />
            <div className="p-5 bg-white space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-[#0B2545]">
                  {experience.experienceType}
                </span>
                <span className="rounded bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {experience.organizationIndustry || 'Industrial Technology'}
                </span>
                <span
                  className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                    experience.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {experience.status}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {experience.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Building2 className="h-4 w-4 text-[#0B2545]" />
                  <span>{experience.organization}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{experience.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{experience.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{experience.time || experience.travelInfo?.reportingTime || '08:00 AM'} ({experience.duration || 'Full Day'})</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <IndianRupee className="h-4 w-4 text-slate-400" />
                  <span>{fee}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Faculty Assignment */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Users className="h-4 w-4 text-[#0B2545]" />
              Faculty Coordinators
            </h2>
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-medium flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0B2545]"></span>
                  Primary Lead
                </span>
                <span className="font-bold text-slate-900">{experience.primaryFaculty?.name || 'Not assigned'}</span>
              </div>
              
              {experience.additionalFaculty && experience.additionalFaculty.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-600 font-medium flex items-center gap-2 mb-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    Additional Coordinators
                  </div>
                  <div className="pl-4 font-semibold text-slate-800">
                    {experience.additionalFaculty.map(f => f.name).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 1. What You'll Experience */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                What You'll Experience
              </h2>
              <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-900">
                {experience.experienceType}
              </span>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
                {experience.experienceType}
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {experience.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {experience.shortDescription || experience.detailedDescription || 'Comprehensive engineering industrial site visit.'}
              </p>
            </div>

            {/* Numbered Highlights */}
            {((experience.experienceHighlights && experience.experienceHighlights.length > 0) ||
              (experience.whatYouWillLearn && experience.whatYouWillLearn.length > 0)) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {(experience.experienceHighlights && experience.experienceHighlights.length > 0
                  ? experience.experienceHighlights
                  : experience.whatYouWillLearn.map((item) => ({ title: item, description: '' }))
                ).map((highlight: any, idx: number) => {
                  const titleText = typeof highlight === 'string' ? highlight : highlight.title || highlight.description || '';
                  const descText = typeof highlight === 'object' && highlight.description && highlight.description !== highlight.title ? highlight.description : '';
                  return (
                    <div
                      key={idx}
                      className="rounded-lg bg-white border border-slate-200 p-3 flex items-start gap-2.5 shadow-2xs"
                    >
                      <div className="h-5 w-5 rounded-md bg-[#0B2545] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 block leading-snug">{titleText}</span>
                        {descText && <p className="text-[10px] text-slate-500">{descText}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Academic and technical highlights will be shared with registered students.</p>
            )}
          </div>

          {/* 2. Why This Visit Is Worth Attending */}
          {((experience.whyWorthAttending && experience.whyWorthAttending.length > 0) ||
            (experience.whyAttend && experience.whyAttend.length > 0)) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600" />
                Why This Visit Is Worth Attending
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(experience.whyWorthAttending && experience.whyWorthAttending.length > 0
                  ? experience.whyWorthAttending
                  : experience.whyAttend || []
                ).map((reason: any, idx: number) => {
                  const text = typeof reason === 'string' ? reason : reason.title || reason.text || JSON.stringify(reason);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg bg-emerald-50/40 border border-emerald-100 p-2.5 flex items-start gap-2 text-xs text-slate-800"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Key Academic Competencies & Outcomes */}
          {((experience.academicCompetencies && experience.academicCompetencies.length > 0) ||
            (experience.learningObjectives && experience.learningObjectives.length > 0)) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-[#0B2545]" />
                Key Academic Competencies & Outcomes
              </h2>
              <div className="space-y-2">
                {(experience.academicCompetencies && experience.academicCompetencies.length > 0
                  ? experience.academicCompetencies
                  : experience.learningObjectives || []
                ).map((obj: any, i: number) => {
                  const text = typeof obj === 'string' ? obj : obj.title || obj.description || String(obj);
                  return (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 flex items-start gap-2 text-xs text-slate-800"
                    >
                      <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Student Requirements & Eligibility & 5. Plant Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-[#0B2545]" />
                Student Requirements & Eligibility
              </h2>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Target Academic Years:</span>
                  <span className="font-semibold">
                    {experience.eligibility?.allowedYears && experience.eligibility.allowedYears.length > 0
                      ? experience.eligibility.allowedYears.map(y => `Year ${y}`).join(', ')
                      : 'All Academic Years'}
                  </span>
                </div>
                <div className="border-b border-slate-100 pb-1.5 space-y-1">
                  <span className="text-slate-500 block">Eligible Departments:</span>
                  <div className="flex flex-wrap gap-1">
                    {experience.eligibility?.allowedBranches && experience.eligibility.allowedBranches.length > 0 ? (
                      experience.eligibility.allowedBranches.map((b, bi) => (
                        <span key={bi} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {b}
                        </span>
                      ))
                    ) : (
                      <span className="font-semibold text-slate-800">All Streams</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Minimum CGPA:</span>
                  <span className="font-semibold text-emerald-700">
                    {experience.eligibility?.minCgpa ? `${experience.eligibility.minCgpa} / 10.0` : 'None required'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Plant Rules & Safety Directives */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                Plant Rules & Safety Directives
              </h2>
              <div className="space-y-1.5 text-xs text-slate-700">
                {((experience.safetyDirectives && experience.safetyDirectives.length > 0) ||
                  (experience.rules && experience.rules.length > 0) ||
                  (experience.requirements && experience.requirements.length > 0)) ? (
                  (experience.safetyDirectives && experience.safetyDirectives.length > 0
                    ? experience.safetyDirectives
                    : experience.rules && experience.rules.length > 0
                    ? experience.rules
                    : experience.requirements || []
                  ).map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Standard industry safety protocols apply.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close Preview
          </button>

          {experience.status === 'DRAFT' && onPublish && (
            <button
              onClick={() => onPublish(experience)}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Publish This Experience Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
