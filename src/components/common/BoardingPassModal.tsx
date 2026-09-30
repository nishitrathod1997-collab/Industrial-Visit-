import React from 'react';
import { BoardingPass, Experience, StudentProfile } from '../../types';
import { X, Printer, ShieldCheck, Bus, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface BoardingPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardingPass: BoardingPass;
  experience: Experience;
  student: StudentProfile;
}

export const BoardingPassModal: React.FC<BoardingPassModalProps> = ({
  isOpen,
  onClose,
  boardingPass,
  experience,
  student,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Standard structured payload format: IV_ATTENDANCE:<passNumber>:<studentId>:<experienceId>
  const qrData = `IV_ATTENDANCE:${boardingPass.passNumber}:${student.studentId}:${experience.id}`;

  return (
    
      
        
      
      <React.Fragment>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden; }
            .printable-ticket, .printable-ticket * { visibility: visible; }
            .printable-ticket { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        ` }} />
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header Controls */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 items-center rounded bg-emerald-100 px-2.5 text-xs font-semibold text-emerald-800 border border-emerald-300">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              OFFICIAL BOARDING PASS
            </span>
            <span className="text-xs text-slate-500 font-mono">Pass: {boardingPass.passNumber}</span>
          </div>
      

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Print Pass</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 bg-slate-100">
          <div className="printable-ticket overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {/* Top Navy Header */}
            <div className="bg-[#0B2545] border-b border-blue-900 px-6 py-4 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-black tracking-widest text-slate-950">
                      VIT
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">
                      Experiential Learning Cell
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-1">
                    {experience.title}
                  </h2>
                  <p className="text-xs text-blue-200">Host Organization: <span className="text-white font-medium">{experience.organization}</span></p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded bg-emerald-500 text-slate-950 px-2.5 py-1 text-xs font-bold tracking-wide">
                    CONFIRMED SEAT ✓
                  </span>
                  <p className="text-[11px] text-blue-200 mt-1 font-mono">Pass #{boardingPass.passNumber}</p>
                </div>
              </div>
            </div>

            {/* Ticket Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1 & 2: Student & Travel Details */}
                <div className="md:col-span-2 space-y-4">
                  {/* Student Info Block */}
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] font-bold tracking-wider uppercase">STUDENT NAME</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{student.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] font-bold tracking-wider uppercase">REGISTRATION NO.</span>
                        <p className="font-mono font-bold text-[#0B2545] text-sm mt-0.5">{student.studentId}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] font-bold tracking-wider uppercase">BRANCH & YEAR</span>
                        <p className="font-medium text-slate-800 mt-0.5">{student.branch} (Year {student.year})</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] font-bold tracking-wider uppercase">DIVISION & SEM</span>
                        <p className="font-medium text-slate-800 mt-0.5">Div {student.division} • Sem {student.semester}</p>
                      </div>
                    </div>
                  </div>

                  {/* Travel & Schedule Block */}
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-[#0B2545] flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Visit Date: </span>
                        <strong className="text-slate-900">{experience.date}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Reporting Time: </span>
                        <strong className="text-slate-900">{experience.travelInfo?.reportingTime || '07:30 AM'} sharp</strong> (Departure: {experience.travelInfo?.departureTime || '08:00 AM'})
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-[#0B2545] flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Reporting Bay: </span>
                        <strong className="text-slate-900">{experience.travelInfo?.reportingLocation || 'VIT Main Gate — Bus Bay #3'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Bus className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="text-slate-500">Transit Coach: </span>
                        <strong className="text-slate-900">{experience.travelInfo?.transport || (experience.travelInfo as any)?.busNumber || 'VIT Official Air-Conditioned Coach'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Verification QR & Faculty Details */}
                <div className="flex flex-col items-center justify-between border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-center">
                  <div className="space-y-2">
                    <div className="inline-flex p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <QRCodeSVG value={qrData} size={112} level="H" includeMargin={false} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      Scan at Bus Boarding
                    </p>
                  </div>

                  <div className="w-full mt-4 rounded-lg bg-blue-50/60 p-2.5 border border-blue-100 text-left text-[11px]">
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">FACULTY IN-CHARGE</span>
                    <strong className="text-[#0B2545] block">{experience.primaryFaculty?.name || 'Dr. Arvind Swaminathan'}</strong>
                    <span className="text-slate-500 text-[10px]">{experience.primaryFaculty?.phone || '+91 98201 54321'}</span>
                  </div>
                </div>
              </div>

              {/* Instructions Bar */}
              <div className="mt-6 rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Mandatory Institutional Guidelines:</p>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-800">
                    <li>Physical VIT Student Identity Card is mandatory for industrial entry.</li>
                    <li>Students must adhere strictly to formal attire and closed shoes.</li>
                    <li>Attendance will be marked at departure and verified at host premises.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
              
                  </div>
        </div>
      </div>
    </React.Fragment>
  );
};