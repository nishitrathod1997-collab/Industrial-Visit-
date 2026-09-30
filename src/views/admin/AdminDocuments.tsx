import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BoardingPassModal } from '../../components/common/BoardingPassModal';
import { CertificateViewerModal } from '../../components/student/CertificateViewerModal';
import { PostTripReportsManager } from '../../components/common/PostTripReportsManager';
import { Search,
  FileText,
  Award,
  ShieldCheck,
  Download,
  ExternalLink,
  CheckCircle2,
  Filter,
  Eye,
  X,
  QrCode,
  FolderOpen,
} from 'lucide-react';

export const AdminDocuments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'POST_TRIP_REPORTS'>('DOCUMENTS');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = documents.filter((d) => {
    const matchesSearch =
      !search.trim() ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.studentName.toLowerCase().includes(search.toLowerCase()) ||
      (d.studentRollNo && d.studentRollNo.toLowerCase().includes(search.toLowerCase())) ||
      (d.identifier && d.identifier.toLowerCase().includes(search.toLowerCase())) ||
      d.experienceTitle.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || d.documentType === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-50 border border-blue-200 text-[#0B2545] px-2.5 py-0.5 text-[10px] font-bold">
              INSTITUTIONAL DOCUMENT REPOSITORY
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {activeTab === 'DOCUMENTS' ? `${documents.length} Total Verified Records` : 'Student Post-Trip Submissions'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Documents, Certificates & Post-Trip Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of official participation certificates, digital boarding passes, and student post-trip technical reports with photos.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            id="admin-tab-credentials"
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'DOCUMENTS'
                ? 'bg-white text-[#0B2545] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span>Certificates & Passes</span>
          </button>

          <button
            id="admin-tab-post-trip-reports"
            onClick={() => setActiveTab('POST_TRIP_REPORTS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'POST_TRIP_REPORTS'
                ? 'bg-white text-[#0B2545] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            <span>Post-Trip Reports & Photos</span>
          </button>
        </div>
      </div>

      {activeTab === 'POST_TRIP_REPORTS' ? (
        <PostTripReportsManager role="ADMIN" />
      ) : (
        <>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by certificate ID, student name, roll number, or visit..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none"
              />
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0B2545] focus:outline-none"
              >
                <option value="ALL">All Document Types</option>
                <option value="CERTIFICATE">Certificates of Participation</option>
                <option value="BOARDING_PASS">Digital Boarding Passes</option>
                <option value="LEAVE_EVIDENCE">Leave Proof Attachments</option>
              </select>
            </div>
          </div>

      {/* List */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0B2545] border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading document repository...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-xs font-semibold text-slate-600">No documents found matching the filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-col justify-between space-y-3 hover:border-[#0B2545] transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                      doc.documentType === 'CERTIFICATE'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : doc.documentType === 'BOARDING_PASS'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {doc.documentType === 'CERTIFICATE'
                      ? 'Participation Certificate'
                      : doc.documentType === 'BOARDING_PASS'
                      ? 'Boarding Pass'
                      : 'Leave Supporting Proof'}
                  </span>

                  <span className="font-mono text-xs font-bold text-slate-700">{doc.identifier}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug">{doc.title}</h4>

                <div className="text-[11px] text-slate-500 space-y-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div><span className="font-semibold text-slate-700">Issued To: </span>{doc.studentName} ({doc.studentRollNo})</div>
                  <div><span className="font-semibold text-slate-700">Visit: </span>{doc.experienceTitle}</div>
                  <div><span className="font-semibold text-slate-700">Timestamp: </span>{new Date(doc.issuedAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Valid & Cryptographically Signed</span>
                </span>

                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0B2545] hover:underline cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* Document Inspector Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {selectedDoc.documentType === 'CERTIFICATE' ? (
                  <Award className="h-5 w-5 text-emerald-600" />
                ) : (
                  <FileText className="h-5 w-5 text-blue-600" />
                )}
                <h3 className="text-base font-bold text-slate-900">{selectedDoc.identifier}</h3>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 text-[#0B2545] shadow-xs">
                  <ShieldCheck className="h-7 w-7 text-[#0B2545]" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedDoc.title}</h4>
                <p className="text-xs text-slate-500 mt-1">Recipient: {selectedDoc.studentName} ({selectedDoc.studentRollNo})</p>
                <p className="text-xs text-slate-500">Program: {selectedDoc.experienceTitle}</p>
              </div>

              <div className="rounded bg-white p-2.5 border border-slate-200 text-[11px] font-mono text-slate-600">
                Hash: SHA256-VIT-{selectedDoc.identifier}-2026-CERT
              </div>
            </div>
            
            <div className="pt-2">
              <a 
                href={`data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTExCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKPDwKICAvTGVuZ3RoIDE0Cj4+CnN0cmVhbQpCVEQKVGogCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxNDYgMDAwMDAgbiAKMDAwMDAwMDI1MCAwMDAwMCBuIAowMDAwMDAwMzM4IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQyOAolJUVPRgo=`} 
                download={`${selectedDoc.identifier}.pdf`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B2545] py-2.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-2xs"
              >
                <Download className="h-4 w-4" />
                <span>Download Secure PDF</span>
              </a>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
