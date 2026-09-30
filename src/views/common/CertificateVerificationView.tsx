import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Certificate, Experience, StudentProfile } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Award,
  ArrowLeft,
  Download,
  Printer,
  QrCode,
  School,
  User,
  Clock,
} from 'lucide-react';
import { CertificateViewerModal } from '../../components/student/CertificateViewerModal';

interface CertificateVerificationViewProps {
  certificateId: string;
  onBack: () => void;
}

export const CertificateVerificationView: React.FC<CertificateVerificationViewProps> = ({
  certificateId,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certData, setCertData] = useState<{
    certificate: Certificate;
    experience: Experience;
    student: StudentProfile;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCertificate();
  }, [certificateId]);

  const loadCertificate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCertificateDetails(certificateId);
      if (data) {
        setCertData({
          certificate: data,
          experience: data.experience,
          student: data.student,
        });
      } else {
        setError('Certificate not found or invalid identifier.');
      }
    } catch (err: any) {
      console.error('Error verifying certificate:', err);
      setError('Certificate record not found or could not be verified in the institutional ledger.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Back navigation */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0B2545] transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Portal</span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[#0B2545] border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-700 mt-3">Verifying institutional certificate ledger...</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">Querying ID: {certificateId}</p>
        </div>
      ) : error || !certData ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center shadow-xs">
          <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
            <XCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-rose-900">Certificate Verification Failed</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto mt-1">{error}</p>
          <p className="text-[11px] text-slate-500 mt-4 font-mono">Searched Identifier: {certificateId}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Official Verification Banner */}
          <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-0.5 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>AUTHENTIC & VERIFIED CREDENTIAL</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
                    Official Vidyalankar Institute of Technology Certificate
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Issued by Center for Experiential Learning & Industrial Relations
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-[#0B2545] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#133E87] transition-all shadow-md cursor-pointer"
                >
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>View Full Certificate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Certificate Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Student & Academic Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-[#0B2545] flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Student Recipient Details</h3>
                  <p className="text-[11px] text-slate-500">Verified participant identity</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-900">{certData.student.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Roll No / Student ID:</span>
                  <span className="font-mono font-bold text-[#0B2545]">{certData.student.studentId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">PRN Number:</span>
                  <span className="font-mono text-slate-700">{certData.student.prn}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Branch & Department:</span>
                  <span className="font-semibold text-slate-900 text-right">{certData.student.branch}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Institutional School:</span>
                  <span className="text-slate-700 text-right">{certData.student.department}</span>
                </div>
              </div>
            </div>

            {/* Industrial Experience Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Industrial Experience Details</h3>
                  <p className="text-[11px] text-slate-500">Completed training program</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Host Organization:</span>
                  <span className="font-bold text-slate-900">{certData.experience.organization}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Program Title:</span>
                  <span className="font-semibold text-slate-900 text-right">{certData.experience.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Visit Type:</span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 font-bold text-[#0B2545]">
                    {certData.experience.experienceType}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Date Completed:</span>
                  <span className="font-semibold text-slate-900">{certData.experience.date}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-700 text-right">{certData.experience.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit & Security Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Institutional Ledger Metadata
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Certificate ID</span>
                <span className="font-mono font-bold text-[#0B2545]">{certData.certificate.certificateId}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Status</span>
                <span className="font-bold text-emerald-700 uppercase">{certData.certificate.status}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Issued Timestamp</span>
                <span className="font-mono text-slate-700 text-[11px]">
                  {certData.certificate.issuedAt ? new Date(certData.certificate.issuedAt).toLocaleDateString() : '2026-07-22'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Authorizing Authority</span>
                <span className="font-semibold text-slate-900">Dr. Arvind Swaminathan</span>
              </div>
            </div>
          </div>

          {/* Modal popup if clicked */}
          {showModal && (
            <CertificateViewerModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              certificate={certData.certificate}
              experience={certData.experience}
              student={certData.student}
            />
          )}
        </div>
      )}
    </div>
  );
};
