import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  User,
  GraduationCap,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Sparkles,
} from 'lucide-react';
import { ExperienceWithMeta, TripReport, TripReportPhoto, StudentProfile } from '../../types';
import { api } from '../../services/api';

interface PostTripReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: ExperienceWithMeta;
  student?: StudentProfile | null;
  onReportSubmitted?: () => void;
  initialViewMode?: boolean;
}

interface PhotoUploadItem {
  id: string;
  file?: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  caption?: string;
}

export const PostTripReportModal: React.FC<PostTripReportModalProps> = ({
  isOpen,
  onClose,
  experience,
  student,
  onReportSubmitted,
  initialViewMode = false,
}) => {
  const [isViewMode, setIsViewMode] = useState<boolean>(initialViewMode);
  const [existingReport, setExistingReport] = useState<TripReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [whatILearned, setWhatILearned] = useState('');
  const [activities, setActivities] = useState('');
  const [skillsGained, setSkillsGained] = useState('');
  const [experienceText, setExperienceText] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [photos, setPhotos] = useState<PhotoUploadItem[]>([]);

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && experience) {
      loadReportData();
    }
  }, [isOpen, experience?.id]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const report = await api.getStudentTripReport(experience.id);
      if (report) {
        setExistingReport(report);
        setWhatILearned(report.whatILearned || '');
        setActivities(report.activities || '');
        setSkillsGained(report.skillsGained || '');
        setExperienceText(report.experience || '');
        setSuggestions(report.suggestions || '');
        if (report.photos && report.photos.length > 0) {
          setPhotos(
            report.photos.map((p) => ({
              id: p.id,
              fileName: p.fileName,
              fileSize: p.fileSize || 0,
              fileType: p.fileType,
              fileUrl: p.fileUrl,
              caption: p.caption,
            }))
          );
        }
        setIsViewMode(true);
      } else {
        setIsViewMode(false);
        setExistingReport(null);
      }
    } catch (err: any) {
      console.error('Failed to load trip report:', err);
      // If error or not found, fall back to submit form
      setIsViewMode(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - photos.length;
    if (remainingSlots <= 0) {
      setError('Maximum 10 photos allowed per post-trip report.');
      return;
    }

    const filesToProcess: File[] = Array.from(files).slice(0, remainingSlots) as File[];
    setError(null);

    filesToProcess.forEach((file: File) => {
      // Validate type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        setError(`"${file.name}" is not a supported format. Please upload JPG, PNG, or WEBP.`);
        return;
      }

      // Validate size: 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 5MB size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPhotos((prev) => {
          if (prev.length >= 10) return prev;
          return [
            ...prev,
            {
              id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              file,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileUrl: dataUrl,
            },
          ];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, caption } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict validations
    if (whatILearned.trim().length < 10) {
      setError('Please provide what you learned during the visit (minimum 10 characters).');
      return;
    }
    if (activities.trim().length < 10) {
      setError('Please describe the key activities and observations (minimum 10 characters).');
      return;
    }
    if (skillsGained.trim().length < 10) {
      setError('Please describe the skills and knowledge gained (minimum 10 characters).');
      return;
    }
    if (experienceText.trim().length < 10) {
      setError('Please share your overall experience of the industrial visit (minimum 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        whatILearned: whatILearned.trim(),
        activities: activities.trim(),
        skillsGained: skillsGained.trim(),
        experience: experienceText.trim(),
        suggestions: suggestions.trim() || undefined,
        photos: photos.map((p) => ({
          fileName: p.fileName,
          fileSize: p.fileSize,
          fileType: p.fileType,
          fileUrl: p.fileUrl,
          caption: p.caption,
        })),
      };

      const result = await api.submitTripReport(experience.id, payload);
      setExistingReport(result);
      setSuccessMessage('Post-trip report submitted successfully! Thank you for your detailed feedback.');
      setIsViewMode(true);
      if (onReportSubmitted) {
        onReportSubmitted();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit post-trip report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const activeLightboxPhoto =
    lightboxIndex !== null && photos[lightboxIndex] ? photos[lightboxIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div
        id="post-trip-report-modal"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-[#0B2545] to-[#134074] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Post-Trip Report & Photos</h2>
                {existingReport && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="h-3 w-3" /> Submitted
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {experience.title} &bull; {experience.organization}
              </p>
            </div>
          </div>
          <button
            id="close-post-trip-report-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Read-Only Auto-Populated Student & Visit Context Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" /> Student Name
              </span>
              <p className="font-semibold text-slate-800 truncate">
                {student?.name || existingReport?.studentName || 'Student'}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> Roll / Student ID
              </span>
              <p className="font-mono font-bold text-slate-800">
                {student?.enrollmentNumber || student?.studentId || existingReport?.studentEnrollment || '21BCE10482'}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" /> Department / Branch
              </span>
              <p className="font-semibold text-slate-800 truncate">
                {student?.department || student?.branch || existingReport?.studentDepartment || 'Computer Science & Engineering'}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Visit Date
              </span>
              <p className="font-semibold text-slate-800">
                {experience.date || existingReport?.visitDate || 'Completed Visit'}
              </p>
            </div>
          </div>

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <div className="h-6 w-6 border-2 border-slate-300 border-t-[#0B2545] rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading report details...</p>
            </div>
          ) : isViewMode && existingReport ? (
            /* VIEW SUBMITTED REPORT MODE */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>
                    Submitted on:{' '}
                    <strong className="text-slate-700">
                      {new Date(existingReport.submittedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </span>
                </div>
                <button
                  id="edit-post-trip-report-btn"
                  onClick={() => setIsViewMode(false)}
                  className="text-xs font-semibold text-[#0B2545] hover:text-[#134074] hover:underline cursor-pointer"
                >
                  Edit / Update Submission
                </button>
              </div>

              {/* Report Answers */}
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> 1. What I Learned
                  </h4>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {existingReport.whatILearned}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" /> 2. Key Activities & Observations
                  </h4>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {existingReport.activities}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> 3. Skills & Knowledge Gained
                  </h4>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {existingReport.skillsGained}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" /> 4. Overall Experience
                  </h4>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {existingReport.experience}
                  </p>
                </div>

                {existingReport.suggestions && (
                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      5. Suggestions & Feedback
                    </h4>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {existingReport.suggestions}
                    </p>
                  </div>
                )}
              </div>

              {/* Photos Gallery */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-[#0B2545]" /> Visit Photos (
                    {photos.length} uploaded)
                  </h4>
                </div>

                {photos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                    No photos were attached to this report.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs cursor-pointer"
                        onClick={() => setLightboxIndex(idx)}
                      >
                        <img
                          src={photo.fileUrl}
                          alt={photo.caption || photo.fileName}
                          className="h-36 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="p-1.5 bg-white/90 rounded-full text-slate-800 hover:bg-white">
                            <ZoomIn className="h-4 w-4" />
                          </span>
                        </div>
                        {photo.caption && (
                          <div className="absolute bottom-0 inset-x-0 bg-slate-950/75 p-1.5 text-[10px] text-white truncate">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* SUBMIT / EDIT FORM MODE */
            <form id="post-trip-report-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                <p className="font-semibold">
                  📌 Notice for Industrial Visit Documentation
                </p>
                <p className="text-slate-600 mt-0.5">
                  Your report will be reviewed by faculty coordinators and archived as institutional training records. Please provide comprehensive technical and observational details.
                </p>
              </div>

              {/* Question 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    1. What I Learned <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {whatILearned.length} / 2000 chars
                  </span>
                </div>
                <textarea
                  id="report-what-i-learned"
                  required
                  rows={4}
                  maxLength={2000}
                  value={whatILearned}
                  onChange={(e) => setWhatILearned(e.target.value)}
                  placeholder="Detail the technical workflows, machinery, software, processes, or scientific operations you observed..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none"
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    2. Key Activities & Observations <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {activities.length} / 2000 chars
                  </span>
                </div>
                <textarea
                  id="report-activities"
                  required
                  rows={3}
                  maxLength={2000}
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  placeholder="Highlight key sessions, demonstrations, cleanrooms, assembly lines, or laboratory areas visited..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none"
                />
              </div>

              {/* Question 3 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    3. Skills & Knowledge Gained <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {skillsGained.length} / 2000 chars
                  </span>
                </div>
                <textarea
                  id="report-skills-gained"
                  required
                  rows={3}
                  maxLength={2000}
                  value={skillsGained}
                  onChange={(e) => setSkillsGained(e.target.value)}
                  placeholder="Mention specific engineering principles, industrial standards (ISO, ESD), tools, and real-world methodologies learned..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none"
                />
              </div>

              {/* Question 4 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    4. Overall Experience <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {experienceText.length} / 2000 chars
                  </span>
                </div>
                <textarea
                  id="report-experience-text"
                  required
                  rows={3}
                  maxLength={2000}
                  value={experienceText}
                  onChange={(e) => setExperienceText(e.target.value)}
                  placeholder="Summarize your overall impression of the industrial visit and organization..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none"
                />
              </div>

              {/* Optional Question 5 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    5. Suggestions / Improvements <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {suggestions.length} / 1000 chars
                  </span>
                </div>
                <textarea
                  id="report-suggestions"
                  rows={2}
                  maxLength={1000}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Suggestions for future cohorts (e.g. session timing, pre-visit preparation, specific areas to explore)..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545] outline-none"
                />
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-[#0B2545]" /> Upload Visit Photos
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Upload up to 10 photos (JPG, PNG, WEBP &bull; Max 5MB per file)
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {photos.length} / 10 photos
                  </span>
                </div>

                {photos.length < 10 && (
                  <label
                    htmlFor="photo-file-input"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-[#0B2545] rounded-xl bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Upload className="h-6 w-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      Click to choose photos or drag and drop
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Select multiple images to attach to your report
                    </span>
                    <input
                      id="photo-file-input"
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Uploaded Photos List */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl relative group"
                      >
                        <img
                          src={photo.fileUrl}
                          alt={photo.fileName}
                          className="h-16 w-16 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-800 truncate" title={photo.fileName}>
                              {photo.fileName}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(photo.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                              title="Remove photo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {formatBytes(photo.fileSize)}
                          </p>
                          <input
                            type="text"
                            placeholder="Add brief caption (optional)..."
                            value={photo.caption || ''}
                            onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                            maxLength={100}
                            className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-[#0B2545] outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                {existingReport && (
                  <button
                    type="button"
                    onClick={() => setIsViewMode(true)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  id="submit-post-trip-report-btn"
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#134074] rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-amber-400" />
                      <span>{existingReport ? 'Update Report' : 'Submit Post-Trip Report'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Lightbox */}
      {activeLightboxPhoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-between p-4 backdrop-blur-md"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="w-full flex items-center justify-between text-white py-2 px-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300">
                Photo {lightboxIndex + 1} of {photos.length}
              </span>
              {activeLightboxPhoto.fileName && (
                <span className="text-xs text-slate-400">&bull; {activeLightboxPhoto.fileName}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <a
                href={activeLightboxPhoto.fileUrl}
                download={activeLightboxPhoto.fileName || 'visit_photo.jpg'}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
              >
                <Download className="h-4 w-4" /> Download
              </a>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 w-full flex items-center justify-center relative p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : photos.length - 1));
                }}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <img
              src={activeLightboxPhoto.fileUrl}
              alt={activeLightboxPhoto.caption || 'Visit Photo'}
              className="max-h-[78vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            />

            {photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev! < photos.length - 1 ? prev! + 1 : 0));
                }}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {activeLightboxPhoto.caption && (
            <div
              className="py-3 px-6 bg-white/10 backdrop-blur-md rounded-xl text-white text-xs max-w-xl text-center mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {activeLightboxPhoto.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
