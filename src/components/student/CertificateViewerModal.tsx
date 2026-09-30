import React, { useEffect, useState, useRef } from 'react';
import { X, Download, Printer, ShieldCheck, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Experience, StudentProfile } from '../../types';

declare global {
  interface String {
    hashCode(): number;
  }
}

interface CertificateViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: any;
  experience: Experience;
  student: StudentProfile;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  isOpen,
  onClose,
  certificate,
  experience,
  student,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const certId = certificate?.certificateId || `CERT-6-2026-${student.studentId.substring(student.studentId.length-5)}`;
  
  // Try to find registration id or generate a deterministic one
  const regId = certificate?.registrationId || `VIT-IE-2026-${Math.abs(student.studentId.hashCode ? student.studentId.hashCode() : 70618)}`;

  useEffect(() => {
    // String hashCode for deterministic fallback
    String.prototype.hashCode = function() {
      var hash = 0, i, chr;
      if (this.length === 0) return hash;
      for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; 
      }
      return hash;
    };
  }, []);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank', 'height=800,width=1100');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Certificate - ${student.name}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
              <style>
                @page { size: A4 landscape; margin: 0; }
                body { 
                  -webkit-print-color-adjust: exact !important; 
                  print-color-adjust: exact !important; 
                  margin: 0; 
                  padding: 0; 
                  background: white; 
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 100vw;
                  height: 100vh;
                }
                .cert-container { 
                  width: 297mm;
                  height: 210mm;
                  box-sizing: border-box; 
                  transform-origin: center center;
                }
                /* Hide everything except printable cert */
                .no-print { display: none !important; }
              </style>
            </head>
            <body>
              <div class="cert-container">${printContents}</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      }
    }
  };

  const formattedDate = new Date(experience.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * { visibility: hidden; }
              .printable-cert, .printable-cert * { visibility: visible; }
              .printable-cert { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 297mm;
                height: 210mm;
                margin: 0;
                padding: 0;
                transform: none !important;
                box-shadow: none !important;
              }
              .no-print { display: none !important; }
            }
          ` }} />

          <div className="relative w-full max-w-[1100px] flex flex-col items-center">
            
            {/* Top Toolbar */}
            <div className="no-print w-full flex items-center justify-between bg-white rounded-t-xl px-6 py-4 shadow-lg border-b border-slate-200 z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Official Certificate</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-lg bg-[#0B2545] text-white px-4 py-2 text-sm font-semibold hover:bg-[#133863] transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download / Print</span>
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Certificate Canvas */}
            <motion.div
              ref={printRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="printable-cert relative w-full aspect-[1.414/1] bg-[#0B2545] shadow-2xl rounded-b-xl md:rounded-b-none overflow-hidden"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              {/* The Inner Beige Canvas */}
              <div className="absolute top-[6%] bottom-[8%] left-[1.5%] right-[1.5%] bg-[#FDFCF7]">
                
                {/* Left Gold Line */}
                <div className="absolute left-[3%] top-0 bottom-0 w-[1.5px] bg-[#C49B44] z-10"></div>
                {/* Right Gold Line */}
                <div className="absolute right-[3%] top-0 bottom-0 w-[1.5px] bg-[#C49B44] z-10"></div>

                {/* Main Content Area */}
                <div className="absolute inset-0 pt-[6%] pb-[8%] px-[8%] flex flex-col z-20">
                  
                  {/* Header: Logo and text */}
                  <div className="flex items-start gap-5 mb-6 pl-[2%]">
                    {/* Logo Box */}
                    <div className="relative w-[55px] h-[55px] md:w-[65px] md:h-[65px] flex-shrink-0">
                      <div className="absolute top-1 -left-1 w-full h-full border-[1.5px] border-[#C49B44] bg-[#C49B44]"></div>
                      <div className="absolute top-0 left-0 w-full h-full bg-[#0B2545] flex items-center justify-center">
                        <span className="text-white font-serif text-3xl md:text-4xl" style={{ fontFamily: "'Playfair Display', serif" }}>W</span>
                      </div>
                    </div>
                    
                    {/* Header Text */}
                    <div className="flex flex-col pt-2">
                      <h1 className="text-[#0B2545] font-bold text-lg md:text-2xl tracking-wide uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Vidyalankar Institute of Technology
                      </h1>
                      <h2 className="text-[#718096] text-[10px] md:text-xs tracking-[0.2em] font-medium mt-1">
                        INDUSTRIAL EXPOSURE CELL
                      </h2>
                    </div>
                  </div>

                  {/* Center Content */}
                  <div className="flex-1 flex flex-col items-center text-center px-8 mt-[2%]">
                    
                    {/* Certificate Of Completion */}
                    <div className="relative mb-10">
                      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#C49B44]"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#C49B44]"></div>
                      <h3 className="text-[#C49B44] font-bold tracking-[0.15em] text-[11px] md:text-sm uppercase py-2.5 px-8">
                        Certificate of Completion
                      </h3>
                    </div>

                    <p className="text-[#4A5568] text-sm md:text-base mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                      This is to certify that
                    </p>

                    <h2 className="text-[#0B2545] text-4xl md:text-[3.5rem] leading-none font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {student.name}
                    </h2>

                    <div className="w-[70%] max-w-xl h-[1.5px] bg-[#CBD5E0] mb-4"></div>

                    <p className="text-[#718096] text-[10px] md:text-xs tracking-[0.15em] uppercase mb-10">
                      ROLL NO. {student.studentId}
                    </p>

                    <p className="text-[#4A5568] text-sm md:text-base mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                      has successfully completed the
                    </p>

                    <h3 className="text-[#0B2545] text-2xl md:text-4xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {experience.title}
                    </h3>

                    <div className="text-[#C49B44] font-bold tracking-wider text-[10px] md:text-xs uppercase mb-4">
                      INDUSTRIAL VISIT
                    </div>

                    <p className="text-[#4A5568] text-sm md:text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                      hosted by {experience.organization}{experience.location ? ` at ${experience.location}` : ''}
                    </p>

                  </div>

                  {/* Footer Section */}
                  <div className="flex justify-between items-end mt-auto pt-6 px-[2%]">
                    {/* Date */}
                    <div className="flex flex-col">
                      <span className="text-[#C49B44] font-bold tracking-widest text-[9px] md:text-[10px] uppercase mb-2">
                        COMPLETION DATE
                      </span>
                      <span className="text-[#0B2545] font-bold text-base md:text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {formattedDate}
                      </span>
                    </div>

                    {/* Signature */}
                    <div className="flex flex-col items-center mr-8">
                      <div className="w-40 md:w-56 border-b-[1.5px] border-[#4A5568] mb-2"></div>
                      <span className="text-[#0B2545] font-bold text-sm md:text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {experience.primaryFaculty?.name || 'Prof. Arvind Iyer'}
                      </span>
                      <span className="text-[#718096] text-[8px] md:text-[9px] tracking-widest uppercase mt-1">
                        FACULTY COORDINATOR
                      </span>
                    </div>
                  </div>
                  
                </div>

                {/* Official Seal - absolutely positioned over bottom border of beige area */}
                <div className="absolute right-[5%] -bottom-[5%] transform w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full border-[1.5px] border-[#C49B44] bg-[#FDFCF7] flex items-center justify-center p-1.5 z-30">
                  <div className="w-full h-full rounded-full border-[1px] border-[#C49B44] flex flex-col items-center justify-center">
                     <span className="text-[#C49B44] font-bold text-[9px] md:text-[11px] tracking-[0.2em] mt-1">VIT</span>
                     <span className="text-[#C49B44] font-bold text-[6.5px] md:text-[8px] tracking-[0.2em]">VERIFIED</span>
                  </div>
                </div>

              </div>
              
              {/* Bottom Footer Text in the Blue Area */}
              <div className="absolute bottom-0 left-0 w-full h-[8%] flex items-center px-[3%] z-10">
                <span className="text-white/80 font-sans text-[8px] md:text-[10px] tracking-wide">
                  Certificate ID: {certId} • Registration ID: {regId || 'VIT-IE-2026-70618'}
                </span>
              </div>

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
