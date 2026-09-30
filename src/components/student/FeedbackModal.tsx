import React, { useState } from 'react';
import { ExperienceWithMeta, ExperienceFeedback } from '../../types';
import { api } from '../../services/api';
import { X, Star, CheckCircle, ThumbsUp, ThumbsDown, Building, Calendar, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: ExperienceWithMeta;
  onFeedbackSubmitted: (feedback: ExperienceFeedback) => void;
}

interface RatingInputProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (val: number) => void;
  required?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const RatingInput: React.FC<RatingInputProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  required = true,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const activeValue = hoverValue !== null ? hoverValue : value;

  return (
    <div id={`rating-group-${id}`} className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            {label}
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          {description && <p className="text-[11px] text-slate-500">{description}</p>}
        </div>
        <span className="text-xs font-semibold text-amber-700 min-w-[70px] text-left sm:text-right">
          {activeValue > 0 ? `${activeValue} ★ (${RATING_LABELS[activeValue]})` : 'Select rating'}
        </span>
      </div>

      {/* Star Selector */}
      <div className="flex items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeValue;
          return (
            <button
              key={star}
              type="button"
              id={`star-btn-${id}-${star}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              className="p-1 rounded hover:bg-amber-100 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label={`Rate ${star} out of 5 for ${label}`}
            >
              <Star
                className={`h-6 w-6 sm:h-7 sm:w-7 transition-all ${
                  isFilled
                    ? 'text-amber-500 fill-amber-400 scale-105'
                    : 'text-slate-300 hover:text-amber-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  experience,
  onFeedbackSubmitted,
}) => {
  // Required 5 Criteria Ratings
  const [overallRating, setOverallRating] = useState<number>(5);
  const [technicalRating, setTechnicalRating] = useState<number>(5);
  const [coordinationRating, setCoordinationRating] = useState<number>(5);
  const [organizationRating, setOrganizationRating] = useState<number>(5);
  const [learningRating, setLearningRating] = useState<number>(5);

  // Optional fields
  const [recommend, setRecommend] = useState<boolean | null>(true);
  const [positiveComment, setPositiveComment] = useState<string>('');
  const [improvementComment, setImprovementComment] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validation
    if (!overallRating || overallRating < 1 || overallRating > 5) {
      setError('Please select an Overall Experience rating.');
      return;
    }
    if (!technicalRating || technicalRating < 1 || technicalRating > 5) {
      setError('Please select a Technical / Learning Exposure rating.');
      return;
    }
    if (!coordinationRating || coordinationRating < 1 || coordinationRating > 5) {
      setError('Please select a Faculty Coordination rating.');
      return;
    }
    if (!organizationRating || organizationRating < 1 || organizationRating > 5) {
      setError('Please select an Organization & Management rating.');
      return;
    }
    if (!learningRating || learningRating < 1 || learningRating > 5) {
      setError('Please select a Learning Value rating.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.submitFeedback(experience.id, {
        rating: overallRating,
        overallRating,
        technicalExposureRating: technicalRating,
        facultyCoordinationRating: coordinationRating,
        organizationRating,
        learningValueRating: learningRating,
        recommend: recommend === true ? 'YES' : recommend === false ? 'NO' : undefined,
        positiveComment: positiveComment.trim() || undefined,
        improvementComment: improvementComment.trim() || undefined,
        comments: positiveComment.trim() || undefined,
      });

      onFeedbackSubmitted(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="feedback-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="feedback-modal-container"
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0B2545] px-6 py-4 text-white">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 items-center rounded bg-amber-500/20 px-2 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                <Sparkles className="mr-1 h-3 w-3 text-amber-300" />
                STUDENT FEEDBACK
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Share Your Experience</h2>
            <p className="text-xs text-blue-200">
              Your feedback helps improve future industrial exposure programs.
            </p>
          </div>
          <button
            id="close-feedback-modal-btn"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Visit Context Banner */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-slate-500" />
            <span className="font-bold text-slate-900">{experience.organization}</span>
            <span className="text-slate-400">•</span>
            <span className="truncate max-w-xs font-medium text-slate-700">{experience.title}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>Completed: {new Date(experience.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div id="feedback-error-banner" className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Required Ratings */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Evaluation Criteria (1 - 5 Stars)
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">* Required</span>
            </div>

            <div className="space-y-3">
              {/* 1. Overall Experience */}
              <RatingInput
                id="overall"
                label="1. Overall Experience"
                description="General satisfaction with this industrial visit"
                value={overallRating}
                onChange={setOverallRating}
              />

              {/* 2. Technical / Learning Exposure */}
              <RatingInput
                id="technical"
                label="2. Technical / Learning Exposure"
                description="Relevance and depth of industrial technology, processes, and demos seen"
                value={technicalRating}
                onChange={setTechnicalRating}
              />

              {/* 3. Faculty Coordination */}
              <RatingInput
                id="coordination"
                label="3. Faculty Coordination"
                description="Faculty guidance, briefing, attendance management, and support"
                value={coordinationRating}
                onChange={setCoordinationRating}
              />

              {/* 4. Organization & Management */}
              <RatingInput
                id="organization"
                label="4. Organization & Logistics Management"
                description="Transportation, schedule adherence, punctuality, and venue arrangements"
                value={organizationRating}
                onChange={setOrganizationRating}
              />

              {/* 5. Learning Value */}
              <RatingInput
                id="learning"
                label="5. Curricular Learning Value"
                description="How significantly this visit enriched your academic and engineering understanding"
                value={learningRating}
                onChange={setLearningRating}
              />
            </div>
          </div>

          {/* Section: Recommendation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-900 block">
              Would you recommend this industrial visit to other students?
            </label>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                id="recommend-yes-btn"
                onClick={() => setRecommend(true)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold border transition-colors cursor-pointer ${
                  recommend === true
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>Yes, Strongly Recommend</span>
              </button>
              <button
                type="button"
                id="recommend-no-btn"
                onClick={() => setRecommend(false)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-bold border transition-colors cursor-pointer ${
                  recommend === false
                    ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                <span>No, Needs Improvement</span>
              </button>
            </div>
          </div>

          {/* Section: Written Feedback */}
          <div className="space-y-4">
            <div>
              <label htmlFor="positive-feedback-input" className="text-xs sm:text-sm font-bold text-slate-900 block mb-1">
                What did you find most valuable about this visit? <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="positive-feedback-input"
                rows={3}
                value={positiveComment}
                onChange={(e) => setPositiveComment(e.target.value)}
                placeholder="Key technical learnings, highlights, impressive facility aspects..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="improvement-feedback-input" className="text-xs sm:text-sm font-bold text-slate-900 block mb-1">
                What could be improved? <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="improvement-feedback-input"
                rows={2}
                value={improvementComment}
                onChange={(e) => setImprovementComment(e.target.value)}
                placeholder="Suggestions for timing, Q&A sessions, logistics, or facility tours..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              id="cancel-feedback-btn"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-feedback-btn"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-[#0B2545] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-950 transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting Feedback...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
