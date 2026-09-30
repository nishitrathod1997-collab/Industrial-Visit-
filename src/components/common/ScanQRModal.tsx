import React, { useState, useRef, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { api } from '../../services/api';
import {
  X,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  User,
  Building2,
  Calendar,
  Sparkles,
  RefreshCw,
  Keyboard,
  Camera,
  ArrowRight,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

interface ScanQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceId: string;
  onScanSuccess: (studentId: string, message: string) => void;
  onScanError: (message: string) => void;
}

type ScanStatus =
  | 'idle'
  | 'processing'
  | 'success'
  | 'already_marked'
  | 'wrong_visit'
  | 'not_approved'
  | 'pass_cancelled'
  | 'error'
  | 'camera_error';

interface ScanVerificationResult {
  status:
    | 'SUCCESS'
    | 'ALREADY_MARKED'
    | 'INVALID_QR'
    | 'REGISTRATION_NOT_FOUND'
    | 'STUDENT_NOT_FOUND'
    | 'VISIT_NOT_FOUND'
    | 'WRONG_VISIT'
    | 'NOT_REGISTERED'
    | 'NOT_APPROVED'
    | 'PASS_CANCELLED';
  success: boolean;
  message: string;
  title: string;
  student?: {
    studentId: string;
    name: string;
    branch?: string;
    year?: number;
    division?: string;
    email?: string;
    department?: string;
  } | null;
  visit?: {
    id: string;
    title: string;
    organization: string;
    date?: string;
  } | null;
  registrationId?: string;
  passNumber?: string;
  timestamp?: string;
  previousTimestamp?: string;
}

interface DiagnosticInfo {
  rawDecoded: string;
  contentType: string;
  parserResult: 'SUCCESS' | 'FAILED' | 'PENDING';
  validationResult: string;
  parsedFields: Record<string, any>;
  timestamp: string;
}

export const ScanQRModal: React.FC<ScanQRModalProps> = ({
  isOpen,
  onClose,
  experienceId,
  onScanSuccess,
  onScanError,
}) => {
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [resultData, setResultData] = useState<ScanVerificationResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [autoResumeCountdown, setAutoResumeCountdown] = useState<number | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);

  const isProcessingRef = useRef(false);
  const countdownTimerRef = useRef<any>(null);

  // Play audio feedback safely
  const playFeedbackSound = (type: 'success' | 'warning' | 'error') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio playback restrictions bypassed safely
    }
  };

  // Reset scanner state to resume scanning
  const resumeScanning = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoResumeCountdown(null);
    setScanStatus('idle');
    setResultData(null);
    isProcessingRef.current = false;
  };

  // Schedule auto-resume after specified seconds
  const scheduleAutoResume = (seconds: number = 3) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setAutoResumeCountdown(seconds);
    countdownTimerRef.current = setInterval(() => {
      setAutoResumeCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          resumeScanning();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // Classify and parse raw payload for safe client diagnostics
  const inspectPayload = (raw: string): { contentType: string; parserResult: 'SUCCESS' | 'FAILED'; parsedFields: Record<string, any> } => {
    const trimmed = raw.trim();
    if (trimmed.startsWith('IV_ATTENDANCE:')) {
      const parts = trimmed.split(':');
      return {
        contentType: 'STRUCTURED_ATTENDANCE (IV_ATTENDANCE)',
        parserResult: parts.length >= 4 ? 'SUCCESS' : 'FAILED',
        parsedFields: {
          passNumber: parts[1] || 'N/A',
          studentId: parts[2] || 'N/A',
          experienceId: parts[3] || 'N/A',
        },
      };
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const obj = JSON.parse(trimmed);
        return {
          contentType: 'JSON_PAYLOAD',
          parserResult: 'SUCCESS',
          parsedFields: obj,
        };
      } catch {
        return {
          contentType: 'MALFORMED_JSON',
          parserResult: 'FAILED',
          parsedFields: {},
        };
      }
    }
    if (trimmed.startsWith('VIT-BP-') || trimmed.startsWith('pass_')) {
      return {
        contentType: 'BOARDING_PASS_NUMBER',
        parserResult: 'SUCCESS',
        parsedFields: { passNumber: trimmed },
      };
    }
    if (/^[0-9]{2}[A-Za-z]{2,4}[0-9]{3,6}$/i.test(trimmed)) {
      return {
        contentType: 'STUDENT_ROLL_NUMBER',
        parserResult: 'SUCCESS',
        parsedFields: { studentId: trimmed.toUpperCase() },
      };
    }
    return {
      contentType: 'GENERIC_STRING',
      parserResult: 'SUCCESS',
      parsedFields: { raw: trimmed },
    };
  };

  // Process any scanned or manually entered payload
  const processPayload = async (rawPayload: string) => {
    if (!rawPayload || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScanStatus('processing');

    const diagParsed = inspectPayload(rawPayload);
    const initialDiag: DiagnosticInfo = {
      rawDecoded: rawPayload,
      contentType: diagParsed.contentType,
      parserResult: diagParsed.parserResult,
      validationResult: 'PENDING_SERVER_VERIFICATION',
      parsedFields: diagParsed.parsedFields,
      timestamp: new Date().toLocaleTimeString(),
    };
    setDiagnosticInfo(initialDiag);

    try {
      console.log('[QR Scanner] Processing payload:', rawPayload);

      // Call backend validation API
      const result: ScanVerificationResult = await api.verifyBoardingPass(
        experienceId,
        rawPayload,
        undefined,
        rawPayload
      );

      console.log('[QR Scanner] Verification result:', result);
      setResultData(result);

      // Update diagnostic with server result
      setDiagnosticInfo((prev) =>
        prev
          ? {
              ...prev,
              validationResult: `${result.status} (${result.success ? 'PASS' : 'FAIL'})`,
            }
          : null
      );

      if (result.status === 'SUCCESS') {
        setScanStatus('success');
        playFeedbackSound('success');
        onScanSuccess(
          result.student?.studentId || '',
          result.message || 'Attendance marked successfully'
        );
        scheduleAutoResume(3);
      } else if (result.status === 'ALREADY_MARKED') {
        setScanStatus('already_marked');
        playFeedbackSound('warning');
        onScanSuccess(
          result.student?.studentId || '',
          result.message || 'Attendance has already been marked'
        );
        scheduleAutoResume(4);
      } else if (result.status === 'WRONG_VISIT') {
        setScanStatus('wrong_visit');
        playFeedbackSound('error');
        onScanError(result.message);
        scheduleAutoResume(4);
      } else if (result.status === 'NOT_APPROVED') {
        setScanStatus('not_approved');
        playFeedbackSound('error');
        onScanError(result.message);
        scheduleAutoResume(4);
      } else if (result.status === 'PASS_CANCELLED') {
        setScanStatus('pass_cancelled');
        playFeedbackSound('error');
        onScanError(result.message);
        scheduleAutoResume(4);
      } else {
        setScanStatus('error');
        playFeedbackSound('error');
        onScanError(result.message || 'Invalid Boarding Pass');
        scheduleAutoResume(4);
      }
    } catch (err: any) {
      console.error('[QR Scanner] Network or verification error:', err);
      const errorResult: ScanVerificationResult = {
        status: 'INVALID_QR',
        success: false,
        title: 'Verification Failed',
        message: err.message || 'Failed to verify QR code with the server.',
      };
      setResultData(errorResult);
      setScanStatus('error');
      playFeedbackSound('error');
      onScanError(errorResult.message);
      setDiagnosticInfo((prev) =>
        prev
          ? {
              ...prev,
              validationResult: `ERROR: ${err.message || 'Request failed'}`,
            }
          : null
      );
      scheduleAutoResume(4);
    }
  };

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes.length === 0 || isProcessingRef.current || scanStatus !== 'idle') return;

    const code = detectedCodes[0];
    const dataString = code?.rawValue || code?.value || String(code || '');
    if (!dataString) return;

    processPayload(dataString);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setManualSubmitting(true);
    await processPayload(manualCode.trim());
    setManualSubmitting(false);
    setManualCode('');
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return (
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ', ' +
        date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      );
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id="scan-qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="scan-qr-modal-container"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B2545] text-white shadow-2xs">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Scan Boarding Pass
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Automatic Industrial Visit Attendance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mode Switch Button */}
            <button
              id="toggle-manual-scan-mode-btn"
              type="button"
              onClick={() => {
                setIsManualMode(!isManualMode);
                resumeScanning();
              }}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
            >
              {isManualMode ? (
                <>
                  <Camera className="h-3.5 w-3.5 text-[#0B2545]" />
                  <span>Camera</span>
                </>
              ) : (
                <>
                  <Keyboard className="h-3.5 w-3.5 text-slate-600" />
                  <span>Manual</span>
                </>
              )}
            </button>

            <button
              id="close-scan-modal-btn"
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isManualMode ? (
          <div className="p-6 bg-slate-50 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Manual Attendance Entry
              </h4>
              <p className="text-xs text-slate-600 mb-4">
                Enter the student&apos;s Boarding Pass Number (e.g.,{' '}
                <span className="font-mono font-semibold text-[#0B2545]">VIT-BP-2026-XXXXX</span>) or
                Student Roll Number (e.g., <span className="font-mono font-semibold text-[#0B2545]">21BCE10482</span>).
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <input
                    id="manual-pass-code-input"
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. VIT-BP-2026-98124 or 21BCE10482"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:bg-white focus:outline-none"
                    autoFocus
                  />
                </div>

                <button
                  id="submit-manual-pass-btn"
                  type="submit"
                  disabled={!manualCode.trim() || manualSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#0B2545] py-2 text-xs font-bold text-white hover:bg-[#133A6B] disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {manualSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify &amp; Mark Attendance</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Camera Scanner Container */
          <div className="relative bg-slate-950 flex-1 min-h-[280px] aspect-square md:aspect-auto md:h-72 overflow-hidden">
            {scanStatus !== 'camera_error' ? (
              <Scanner
                onScan={handleScan}
                onError={(err) => {
                  console.error('[Scanner Error]:', err);
                  setScanStatus('camera_error');
                  let msg = 'Unable to access camera.';
                  if (
                    err &&
                    (err.message?.toLowerCase().includes('permission') ||
                      err.name === 'NotAllowedError')
                  ) {
                    msg =
                      'Camera permission was denied. Please allow camera access in browser settings or use Manual Entry.';
                  } else if (err && err.name === 'NotFoundError') {
                    msg = 'No camera device found on this system.';
                  }
                  setResultData({
                    status: 'INVALID_QR',
                    success: false,
                    title: 'Camera Access Error',
                    message: msg,
                  });
                }}
                formats={['qr_code']}
                styles={{
                  container: { width: '100%', height: '100%', objectFit: 'cover' },
                  video: { width: '100%', height: '100%', objectFit: 'cover' },
                }}
                components={{
                  audio: false,
                  onOff: true,
                  torch: true,
                  zoom: true,
                  finder: false,
                }}
              />
            ) : null}

            {/* Target Reticle Overlay */}
            {scanStatus === 'idle' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="relative w-52 h-52 border border-white/30 rounded-2xl">
                  {/* Glowing corners */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-xl shadow-sm" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-xl shadow-sm" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-xl shadow-sm" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-xl shadow-sm" />

                  {/* Scanning laser line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse opacity-80" />
                </div>
              </div>
            )}

            {/* Processing Spinner Overlay */}
            {scanStatus === 'processing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-xs text-white p-6 z-10">
                <RefreshCw className="h-10 w-10 text-emerald-400 animate-spin mb-3" />
                <p className="text-sm font-bold text-slate-100">QR Code Detected</p>
                <p className="text-xs text-emerald-400 mt-1 font-medium">
                  Validating Boarding Pass in Database...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Verification Result Card Overlay */}
        {scanStatus !== 'idle' && scanStatus !== 'processing' && (
          <div
            id="scan-result-card-overlay"
            className="p-5 border-t border-slate-200 bg-white space-y-3.5 animate-in slide-in-from-bottom-2 duration-200 overflow-y-auto max-h-64"
          >
            {/* 1. SUCCESS: ATTENDANCE MARKED */}
            {scanStatus === 'success' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-2xs">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        <Sparkles className="h-3 w-3" />
                        Verified Present
                      </span>
                      {autoResumeCountdown !== null && (
                        <span className="text-[11px] font-medium text-slate-500">
                          Next in {autoResumeCountdown}s
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      Attendance Marked Successfully
                    </h4>
                  </div>
                </div>

                {/* Student Details Card */}
                {resultData?.student && (
                  <div className="rounded-lg border border-emerald-100 bg-white p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {resultData.student.name}
                          </p>
                          <p className="font-mono text-xs font-semibold text-[#0B2545]">
                            {resultData.student.studentId}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                        {resultData.student.branch || 'Engg'} • Yr {resultData.student.year || 3}{' '}
                        {resultData.student.division ? `(Div ${resultData.student.division})` : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Pass Number
                        </span>
                        <span className="font-mono font-medium text-slate-800">
                          {resultData.passNumber || 'Valid'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Marked Time
                        </span>
                        <span className="font-medium text-slate-800">
                          {formatTimestamp(resultData.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. ALREADY MARKED PRESENT */}
            {scanStatus === 'already_marked' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-2xs">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Already Recorded
                      </span>
                      {autoResumeCountdown !== null && (
                        <span className="text-[11px] font-medium text-slate-500">
                          Next in {autoResumeCountdown}s
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      Student Already Present
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {resultData?.message || 'Attendance is already recorded for this student.'}
                    </p>
                  </div>
                </div>

                {resultData?.student && (
                  <div className="rounded-lg border border-amber-100 bg-white p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{resultData.student.name}</p>
                        <p className="font-mono text-xs font-semibold text-[#0B2545]">
                          {resultData.student.studentId}
                        </p>
                      </div>
                      <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                        PRESENT
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Recorded Time:</span>
                      <span className="font-medium text-slate-800">
                        {formatTimestamp(resultData.previousTimestamp || resultData.timestamp)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. WRONG INDUSTRIAL VISIT */}
            {scanStatus === 'wrong_visit' && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-2xs">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center rounded-full bg-amber-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Wrong Visit
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      Boarding Pass For Another Visit
                    </h4>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      {resultData?.message}
                    </p>
                  </div>
                </div>

                {resultData?.student && (
                  <div className="rounded-lg border border-amber-200 bg-white p-3 text-xs space-y-1">
                    <p className="font-bold text-slate-900">{resultData.student.name}</p>
                    <p className="font-mono text-xs text-slate-600">{resultData.student.studentId}</p>
                  </div>
                )}
              </div>
            )}

            {/* 4. NOT APPROVED / WAITLISTED / CANCELLED */}
            {(scanStatus === 'not_approved' || scanStatus === 'pass_cancelled') && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-2xs">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {resultData?.title || 'Not Eligible'}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">
                      Attendance Cannot Be Marked
                    </h4>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      {resultData?.message}
                    </p>
                  </div>
                </div>

                {resultData?.student && (
                  <div className="rounded-lg border border-rose-100 bg-white p-3 text-xs space-y-1">
                    <p className="font-bold text-slate-900">{resultData.student.name}</p>
                    <p className="font-mono text-xs text-slate-600">{resultData.student.studentId}</p>
                  </div>
                )}
              </div>
            )}

            {/* 5. GENERIC ERROR / INVALID QR */}
            {(scanStatus === 'error' || scanStatus === 'camera_error') && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-2xs">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {resultData?.title || 'Scan Error'}
                    </span>
                    <p className="text-xs font-semibold text-rose-800 mt-1 leading-relaxed">
                      {resultData?.message || 'Invalid QR code or boarding pass verification failed.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar: Scan Next Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="scan-next-student-btn"
                type="button"
                onClick={resumeScanning}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#0B2545] py-2.5 text-xs font-bold text-white hover:bg-[#133A6B] transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Scan Next Student</span>
                {autoResumeCountdown !== null && (
                  <span className="ml-1 opacity-75">({autoResumeCountdown}s)</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Diagnostic Inspector Panel (Collapsible) */}
        {diagnosticInfo && (
          <div className="border-t border-slate-200 bg-slate-900 text-slate-200 p-3 text-[11px]">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full flex items-center justify-between font-mono text-[10px] text-slate-400 hover:text-white cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3 w-3 text-emerald-400" />
                <span>Diagnostic Inspector</span>
                <span className="rounded bg-slate-800 px-1 py-0.2 text-[9px] text-emerald-400">
                  {diagnosticInfo.parserResult}
                </span>
              </span>
              {showDiagnostics ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showDiagnostics && (
              <div className="mt-2.5 space-y-1.5 font-mono text-[10px] bg-slate-950 rounded-lg p-2.5 border border-slate-800 overflow-x-auto max-h-36">
                <div>
                  <span className="text-slate-500">Decoded Payload: </span>
                  <span className="text-emerald-300 break-all">{diagnosticInfo.rawDecoded}</span>
                </div>
                <div>
                  <span className="text-slate-500">Content Type: </span>
                  <span className="text-blue-300">{diagnosticInfo.contentType}</span>
                </div>
                <div>
                  <span className="text-slate-500">Parser Result: </span>
                  <span className={diagnosticInfo.parserResult === 'SUCCESS' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {diagnosticInfo.parserResult}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Validation Status: </span>
                  <span className="text-amber-300 font-bold">{diagnosticInfo.validationResult}</span>
                </div>
                {diagnosticInfo.parsedFields && Object.keys(diagnosticInfo.parsedFields).length > 0 && (
                  <div className="pt-1 border-t border-slate-800 text-[9px] text-slate-400">
                    <span>Parsed Fields: {JSON.stringify(diagnosticInfo.parsedFields)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Bottom Guidance Footer */}
        {scanStatus === 'idle' && (
          <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-slate-700">Scanner Ready</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Align boarding pass QR inside frame
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
