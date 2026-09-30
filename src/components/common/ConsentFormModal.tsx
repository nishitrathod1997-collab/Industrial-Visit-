import React from 'react';
import { ExperienceWithMeta, StudentProfile } from '../../types';
import {
  X,
  Printer,
  Download,
  FileText,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Bus,
  ShieldCheck,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ConsentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: ExperienceWithMeta;
  student: StudentProfile;
}

export const ConsentFormModal: React.FC<ConsentFormModalProps> = ({
  isOpen,
  onClose,
  experience,
  student,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getYearSuffix = (yr: number) => {
    if (yr === 1) return '1st';
    if (yr === 2) return '2nd';
    if (yr === 3) return '3rd';
    return `${yr}th`;
  };

  const academicYearText = `${getYearSuffix(student.year || 2)} Year (Semester ${
    student.semester || (student.year ? student.year * 2 - 1 : 3)
  })`;

  const reportingTime = experience.travelInfo?.reportingTime || experience.time || '07:30 AM';
  const departureTime = experience.travelInfo?.departureTime || '08:00 AM';
  const returnTime = experience.travelInfo?.returnTime || '06:00 PM';
  const reportingLocation =
    experience.travelInfo?.reportingLocation ||
    experience.travelInfo?.pickupLocation ||
    'VIT Main Gate — Campus Bus Bay #3';
  const transportMode =
    experience.travelInfo?.transport ||
    experience.travelInfo?.mode ||
    experience.travelInfo?.busNumber ||
    'Institutional Air-Conditioned Coach';
  const facultyName = experience.primaryFaculty?.name || 'Dr. Arvind Swaminathan (Faculty In-Charge)';
  const facultyPhone = experience.primaryFaculty?.phone || '+91 98201 54321';

  const handleDownload = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Parent_Guardian_Consent_Form_${student.name.replace(/\s+/g, '_')}</title>
  <style>
    @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.4;
      font-size: 11pt;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0B2545;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .inst-name {
      font-size: 16pt;
      font-weight: 800;
      color: #0B2545;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .inst-sub {
      font-size: 9pt;
      color: #475569;
      margin: 3px 0 0 0;
    }
    .doc-title {
      display: inline-block;
      margin-top: 10px;
      padding: 4px 16px;
      background: #0B2545;
      color: #fff;
      font-size: 11pt;
      font-weight: 700;
      border-radius: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0B2545;
      background: #f1f5f9;
      padding: 4px 8px;
      border-left: 4px solid #0B2545;
      margin: 14px 0 8px 0;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 10pt;
    }
    th, td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f8fafc;
      color: #334155;
      font-weight: 600;
      width: 25%;
    }
    td {
      color: #0f172a;
    }
    .declaration-box {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 10px;
      background: #fafafa;
      font-size: 9.5pt;
      line-height: 1.5;
      text-align: justify;
      margin: 10px 0;
    }
    .declaration-box ol {
      margin: 6px 0 0 0;
      padding-left: 18px;
    }
    .declaration-box li {
      margin-bottom: 4px;
    }
    .signatures {
      margin-top: 35px;
      display: flex;
      justify-content: space-between;
    }
    .sig-block {
      width: 45%;
      border-top: 1.5px dashed #475569;
      padding-top: 6px;
      text-align: center;
      font-size: 9.5pt;
    }
    .sig-label {
      font-weight: 700;
      color: #0f172a;
    }
    .sig-sub {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 2px;
    }
    .footer-note {
      margin-top: 25px;
      font-size: 8pt;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="inst-name">VIDYALANKAR INSTITUTE OF TECHNOLOGY</h1>
    <p class="inst-sub">An Autonomous Engineering & Technology Institution | Affiliated to University of Mumbai</p>
    <p class="inst-sub">Department of Experiential Learning & Industrial Relations (ELIR)</p>
    <div class="doc-title">Parent / Guardian Consent & Undertaking Form</div>
  </div>

  <div class="section-title">1. Student / Participant Particulars</div>
  <table>
    <tr>
      <th>Student Full Name</th>
      <td><strong>${student.name}</strong></td>
      <th>Roll / Registration No.</th>
      <td><strong style="font-family: monospace;">${student.studentId || 'N/A'}</strong></td>
    </tr>
    <tr>
      <th>Branch & Department</th>
      <td>${student.branch}</td>
      <th>Academic Year & Sem</th>
      <td>${academicYearText}</td>
    </tr>
    <tr>
      <th>Division & Batch</th>
      <td>Division ${student.division || 'A'}</td>
      <th>PRN Number</th>
      <td><span style="font-family: monospace;">${student.prn || 'N/A'}</span></td>
    </tr>
    <tr>
      <th>Student Mobile</th>
      <td>${student.phone || '+91 98765 43210'}</td>
      <th>Institutional Email</th>
      <td>${student.email}</td>
    </tr>
  </table>

  <div class="section-title">2. Industrial Visit Particulars</div>
  <table>
    <tr>
      <th>Industrial Host / Plant</th>
      <td colspan="3"><strong>${experience.organization}</strong> — ${experience.title}</td>
    </tr>
    <tr>
      <th>Facility Location</th>
      <td colspan="3">${experience.location || 'Industrial Estate / Manufacturing Facility'}</td>
    </tr>
    <tr>
      <th>Date of Visit</th>
      <td><strong>${experience.date}</strong></td>
      <th>Reporting & Assembly</th>
      <td><strong>${reportingTime}</strong> (${reportingLocation})</td>
    </tr>
    <tr>
      <th>Departure & Return</th>
      <td>Departure: ${departureTime} | Est. Return: ${returnTime}</td>
      <th>Mode of Transit</th>
      <td>${transportMode}</td>
    </tr>
    <tr>
      <th>Faculty In-Charge</th>
      <td>${facultyName}</td>
      <th>Coordinator Phone</th>
      <td>${facultyPhone}</td>
    </tr>
  </table>

  <div class="section-title">3. Parent / Guardian Particulars & Emergency Contact</div>
  <table>
    <tr>
      <th>Parent / Guardian Name</th>
      <td>____________________________________________</td>
      <th>Relationship</th>
      <td>Father / Mother / Guardian</td>
    </tr>
    <tr>
      <th>Residential Address</th>
      <td colspan="3">__________________________________________________________________________________</td>
    </tr>
    <tr>
      <th>Primary Contact No.</th>
      <td>________________________</td>
      <th>Emergency Alternate No.</th>
      <td>________________________</td>
    </tr>
  </table>

  <div class="section-title">4. Parental Consent, Rules & Undertaking Declaration</div>
  <div class="declaration-box">
    I hereby grant permission for my son / daughter / ward (named above) to participate in the educational Industrial Visit organized by <strong>Vidyalankar Institute of Technology</strong> to <strong>${experience.organization}</strong> on <strong>${experience.date}</strong>.
    <ol>
      <li>I understand that the industrial visit is an official curricular / experiential learning activity intended to impart practical industrial exposure.</li>
      <li>I ensure that my ward is physically and medically fit to undertake the travel and attend the industrial plant briefing.</li>
      <li>My ward shall abide strictly by all safety protocols, industrial plant regulations, discipline norms, mandatory dress code (formal attire, college ID card, closed safety shoes), and instructions given by the escorting faculty coordinators.</li>
      <li>I acknowledge that the Institute and faculty in-charge will take all reasonable care and precautions for safety; however, the Institute shall not be held liable for any unforeseen event or unauthorized individual actions violating safety rules.</li>
    </ol>
  </div>

  <div class="signatures">
    <div class="sig-block">
      <br/><br/>
      <div class="sig-label">Signature of Student</div>
      <div class="sig-sub">Date: _____ / _____ / 2026</div>
    </div>

    <div class="sig-block">
      <br/><br/>
      <div class="sig-label">Signature of Parent / Guardian</div>
      <div class="sig-sub">Date: _____ / _____ / 2026</div>
    </div>
  </div>

  <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px;">
    <table style="border: 1px dashed #94a3b8; width: 100%;">
      <tr>
        <th style="width: 30%; background: #f8fafc; font-size: 9pt;">Faculty Coordinator Verification</th>
        <td style="font-size: 9pt;">Consent Form Verified & Approved for Bus Boarding Pass Issuance [ &nbsp; ]</td>
        <th style="width: 25%; font-size: 9pt;">Faculty Signature: __________________</th>
      </tr>
    </table>
  </div>

  <div class="footer-note">
    VIT Experiential Learning Cell &bull; Vidyalankar Educational Campus, Wadala (East), Mumbai 400037 &bull; This document is mandatory for campus entry and departure boarding.
  </div>
</body>
</html>
`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consent_Form_${student.name.replace(/\s+/g, '_')}_${experience.organization.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * { visibility: hidden; }
            .printable-consent-form, .printable-consent-form * { visibility: visible; }
            .printable-consent-form {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 10mm;
              background: #fff !important;
            }
            .no-print { display: none !important; }
          }
        `,
        }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
        <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
          {/* Header Action Bar */}
          <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 items-center rounded-lg bg-blue-100 px-2.5 text-xs font-bold text-[#0B2545] border border-blue-200">
                <FileText className="mr-1.5 h-4 w-4 text-[#0B2545]" />
                OFFICIAL CONSENT FORM
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Print, obtain parent signature, then upload signed copy
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5 text-slate-600" />
                <span>Print / Save as PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg bg-[#0B2545] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#133E87] transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                <span>Download Form</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Printable Form Container */}
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100">
            <div className="printable-consent-form bg-white rounded-xl border border-slate-300 p-6 sm:p-8 shadow-sm space-y-5 text-slate-900 text-xs">
              {/* Institution Header */}
              <div className="text-center border-b-2 border-[#0B2545] pb-4 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="rounded bg-amber-500 px-2 py-0.5 text-[11px] font-black text-slate-950">
                    VIT
                  </span>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-[#0B2545] uppercase">
                    Vidyalankar Institute of Technology
                  </h1>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  An Autonomous Engineering & Technology Institution &bull; Approved by AICTE &bull; Affiliated to University of Mumbai
                </p>
                <p className="text-[10px] text-slate-500">
                  Department of Experiential Learning & Industrial Relations (ELIR)
                </p>
                <div className="pt-2">
                  <span className="inline-block bg-[#0B2545] text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded">
                    Parent / Guardian Consent & Undertaking Form
                  </span>
                </div>
              </div>

              {/* Section 1: Student Particulars */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#0B2545] uppercase text-[11px] border-b border-slate-200 pb-1">
                  <User className="h-3.5 w-3.5" />
                  <span>1. Student / Participant Particulars</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Student Name</span>
                    <strong className="text-xs text-slate-900">{student.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Roll / Reg No.</span>
                    <strong className="text-xs font-mono text-[#0B2545]">{student.studentId}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Department / Branch</span>
                    <span className="text-xs text-slate-800">{student.branch}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Year & Sem</span>
                    <span className="text-xs text-slate-800">{academicYearText} (Div {student.division || 'A'})</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Industrial Visit Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#0B2545] uppercase text-[11px] border-b border-slate-200 pb-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>2. Industrial Visit Particulars</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Industrial Host Organization</span>
                    <strong className="text-xs text-slate-900">{experience.organization}</strong>
                    <span className="text-[11px] text-slate-600 block">{experience.title}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Facility Location</span>
                    <span className="text-xs text-slate-800">{experience.location || 'Industrial Manufacturing Zone'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Date & Assembly Time</span>
                    <strong className="text-xs text-slate-900">{experience.date}</strong> &bull; Reporting at <strong>{reportingTime}</strong> sharp
                    <span className="text-[10px] text-slate-500 block">{reportingLocation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Faculty In-Charge</span>
                    <span className="text-xs font-semibold text-[#0B2545]">{facultyName}</span>
                    <span className="text-[10px] text-slate-500 block">Contact: {facultyPhone}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Parent Particulars (Fillable / Printable) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#0B2545] uppercase text-[11px] border-b border-slate-200 pb-1">
                  <Phone className="h-3.5 w-3.5" />
                  <span>3. Parent / Guardian Details & Emergency Contact</span>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border-b border-slate-200 pb-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Parent / Guardian Full Name:</span>
                      <div className="h-5 text-slate-400 italic text-[11px] pt-0.5">________________________________________________</div>
                    </div>
                    <div className="border-b border-slate-200 pb-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Relationship to Student:</span>
                      <div className="h-5 text-slate-400 italic text-[11px] pt-0.5">Father / Mother / Guardian</div>
                    </div>
                  </div>
                  <div className="border-b border-slate-200 pb-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Residential Address:</span>
                    <div className="h-5 text-slate-400 italic text-[11px] pt-0.5">__________________________________________________________________________________________</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="border-b border-slate-200 pb-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Primary Contact No.:</span>
                      <div className="h-5 text-slate-400 italic text-[11px] pt-0.5">___________________________________</div>
                    </div>
                    <div className="border-b border-slate-200 pb-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Emergency Alternate No.:</span>
                      <div className="h-5 text-slate-400 italic text-[11px] pt-0.5">___________________________________</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Declaration & Terms */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#0B2545] uppercase text-[11px] border-b border-slate-200 pb-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>4. Parental Consent, Rules & Undertaking Declaration</span>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-700 leading-relaxed space-y-1.5">
                  <p>
                    I hereby grant permission for my son / daughter / ward <strong>{student.name}</strong> to participate in the educational Industrial Visit organized by <strong>Vidyalankar Institute of Technology</strong> to <strong>{experience.organization}</strong> on <strong>{experience.date}</strong>.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[10.5px] text-slate-600">
                    <li>I understand that this visit is an official academic learning activity and is part of the curriculum experiential learning requirement.</li>
                    <li>I confirm that my ward is medically and physically fit to travel and attend the industrial sessions.</li>
                    <li>My ward shall strictly adhere to the Institutional Code of Conduct, safety guidelines, dress code (College ID card, formal wear, closed safety shoes), and directives of the faculty coordinators throughout the trip.</li>
                    <li>I acknowledge that the Institute and faculty coordinators will take all reasonable precautions for safety and discipline during transit and plant tour.</li>
                  </ul>
                </div>
              </div>

              {/* Section 5: Signature Blocks */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center">
                <div className="border-t-2 border-dashed border-slate-400 pt-2 space-y-1">
                  <div className="h-8"></div>
                  <strong className="text-xs block text-slate-900">Signature of Student</strong>
                  <span className="text-[10px] text-slate-500 block">Date: _____ / _____ / 2026</span>
                </div>
                <div className="border-t-2 border-dashed border-slate-400 pt-2 space-y-1">
                  <div className="h-8"></div>
                  <strong className="text-xs block text-slate-900">Signature of Parent / Guardian</strong>
                  <span className="text-[10px] text-slate-500 block">Date: _____ / _____ / 2026</span>
                </div>
              </div>

              {/* Faculty Verification Stamp Block */}
              <div className="mt-4 rounded border border-dashed border-slate-300 p-2.5 bg-slate-50/70 flex items-center justify-between text-[10px] text-slate-600">
                <span>Verification: Signed Consent Form Received & Verified for Boarding Pass Issuance</span>
                <span className="font-semibold">Faculty In-Charge Signature: ____________________</span>
              </div>
            </div>
          </div>

          {/* Footer Guide */}
          <div className="no-print bg-white p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <AlertCircle className="h-4 w-4 text-[#0B2545]" />
              <span>Step: Print &bull; Sign &bull; Scan / Photo &bull; Upload in Registration window</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#0B2545] px-4 py-2 text-xs font-bold text-white hover:bg-[#133E87] transition-colors cursor-pointer"
            >
              Done / Return to Registration
            </button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};
