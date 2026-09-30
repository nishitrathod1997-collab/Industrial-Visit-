import React from 'react';
import { X, FileText, Download, ExternalLink, Paperclip } from 'lucide-react';
import { SupportingDocument } from '../../types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: SupportingDocument | null;
  title?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
  title = 'Supporting Document',
}) => {
  if (!isOpen || !document) return null;

  const isImage =
    document.type?.startsWith('image/') ||
    document.name.match(/\.(png|jpg|jpeg|gif|webp)$/i);

  const handleDownload = () => {
    if (!document.dataUrl) return;
    const link = window.document.createElement('a');
    link.href = document.dataUrl;
    link.download = document.name || 'leave_supporting_document';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#0B2545]">
              <Paperclip className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-md">
                {document.name} {document.size ? `(${formatFileSize(document.size)})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-auto p-5 bg-slate-100/60 flex items-center justify-center min-h-[260px]">
          {isImage && document.dataUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-2 shadow-xs max-h-[60vh]">
              <img
                src={document.dataUrl}
                alt={document.name}
                referrerPolicy="no-referrer"
                className="max-h-[55vh] max-w-full object-contain rounded-lg mx-auto"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-sm shadow-xs space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0B2545]">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 truncate">{document.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {document.type || 'Document File'} • {formatFileSize(document.size) || 'Verified Attachment'}
                </p>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                This document was uploaded as formal verification for the leave exemption petition.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-3 bg-white flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {document.uploadedAt
              ? `Uploaded on ${new Date(document.uploadedAt).toLocaleDateString()}`
              : 'Institutional Leave Attachment'}
          </span>
          <div className="flex items-center gap-2">
            {document.dataUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-colors shadow-xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Attachment</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
