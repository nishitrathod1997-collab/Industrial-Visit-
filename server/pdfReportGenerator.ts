import PDFDocument from 'pdfkit';
import { AnalyticsOverviewResult } from './analyticsService';
import { EffectiveAnalyticsFilters } from './analyticsAuth';

export interface ReportUserInfo {
  name: string;
  email: string;
  role: string;
  identifier?: string; // Roll No or Faculty Code
}

/**
 * Generates an official, institutional PDF report for the VIT Industrial Exposure Program.
 * Uses the exact analytics dataset calculated by the backend.
 */
export function generateOfficialPdfReport(
  analytics: AnalyticsOverviewResult,
  filters: EffectiveAnalyticsFilters,
  userInfo: ReportUserInfo
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 36,
        size: 'A4',
        bufferPages: true,
        info: {
          Title: 'VIT Industrial Exposure Program - Departmental Reports & Analytics',
          Author: 'Vishwakarma Institute of Technology',
          Subject: 'Departmental Reports & Analytics',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const PRIMARY_COLOR = '#0B2545';
      const SECONDARY_COLOR = '#134074';
      const TEXT_DARK = '#0F172A';
      const TEXT_MUTED = '#475569';
      const BG_LIGHT = '#F8FAFC';
      const BORDER_COLOR = '#E2E8F0';

      const pageWidth = doc.page.width - 72; // 523 pt content width

      // Helper: Section Title
      const addSectionHeader = (title: string, number: string) => {
        // Check remaining space on page, add page break if near bottom
        if (doc.y > 690) {
          doc.addPage();
        } else {
          doc.moveDown(0.8);
        }

        const startY = doc.y;
        doc
          .rect(36, startY, pageWidth, 20)
          .fillAndStroke(PRIMARY_COLOR, PRIMARY_COLOR);

        doc
          .fillColor('#FFFFFF')
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .text(`${number}. ${title.toUpperCase()}`, 44, startY + 5, {
            width: pageWidth - 16,
          });

        doc.y = startY + 26;
        doc.fillColor(TEXT_DARK);
      };

      // Helper: Draw Metric Box
      const drawKpiCard = (
        x: number,
        y: number,
        width: number,
        height: number,
        label: string,
        value: string,
        subtext?: string
      ) => {
        doc
          .rect(x, y, width, height)
          .fillAndStroke(BG_LIGHT, BORDER_COLOR);

        doc
          .fillColor(PRIMARY_COLOR)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(value, x + 8, y + 6, { width: width - 16 });

        doc
          .fillColor(TEXT_MUTED)
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text(label.toUpperCase(), x + 8, y + 23, { width: width - 16 });

        if (subtext) {
          doc
            .fillColor(TEXT_MUTED)
            .fontSize(6.5)
            .font('Helvetica')
            .text(subtext, x + 8, y + 33, { width: width - 16 });
        }
      };

      // --- COVER & DOCUMENT HEADER ---
      // Brand Banner
      doc.rect(36, 36, pageWidth, 46).fill(PRIMARY_COLOR);

      doc
        .fillColor('#FFFFFF')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('VISHWAKARMA INSTITUTE OF TECHNOLOGY, PUNE', 48, 44, {
          width: pageWidth - 24,
        });

      doc
        .fillColor('#93C5FD')
        .fontSize(8.5)
        .font('Helvetica')
        .text('OFFICIAL FACULTY ANALYTICS & COMPLIANCE REPORT', 48, 61, {
          width: pageWidth - 24,
        });

      doc.y = 90;

      // Report Main Header
      doc
        .fillColor(PRIMARY_COLOR)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('VIT INDUSTRIAL EXPOSURE PROGRAM', 36, doc.y);

      doc
        .fillColor(SECONDARY_COLOR)
        .fontSize(11.5)
        .font('Helvetica-Bold')
        .text('Departmental Reports & Analytics', 36, doc.y + 20);

      doc.y += 36;

      // Metadata Block (Two columns with explicit fields)
      const metadataY = doc.y;
      doc
        .rect(36, metadataY, pageWidth, 94)
        .fillAndStroke('#F1F5F9', BORDER_COLOR);

      const generatedDateStr = new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
      });

      const scopeName =
        analytics.scopeSummary.scopeType === 'INSTITUTION'
          ? 'Institution-Wide (All Departments)'
          : `Authorized Scope: ${analytics.scopeSummary.departmentScope || 'Departmental'}`;

      const studentYearStr =
        filters.year !== null && filters.year !== undefined
          ? filters.year === 1
            ? 'First Year'
            : filters.year === 2
            ? 'Second Year'
            : filters.year === 3
            ? 'Third Year'
            : 'Fourth Year'
          : 'All Years';

      const dateRangeStr =
        filters.startDate && filters.endDate
          ? `${filters.startDate} to ${filters.endDate}`
          : filters.dateRange === 'THIS_MONTH' || filters.dateRange === '30d'
          ? 'This Month (Last 30 Days)'
          : filters.dateRange === 'THIS_SEMESTER' || filters.dateRange === '90d'
          ? 'This Semester (Last 90 Days)'
          : 'All Time';

      const visitTypeStr =
        filters.visitType && filters.visitType !== 'ALL'
          ? filters.visitType
          : 'All Experience';

      doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica');

      // Left Column Metadata
      const leftX = 44;
      const leftValX = 145;
      doc.font('Helvetica-Bold').text('Faculty Scope:', leftX, metadataY + 8);
      doc.font('Helvetica').text(scopeName, leftValX, metadataY + 8, { width: 140, ellipsis: true });

      doc.font('Helvetica-Bold').text('Faculty Name:', leftX, metadataY + 22);
      doc.font('Helvetica').text(userInfo.name || 'Authorized Faculty', leftValX, metadataY + 22, { width: 140, ellipsis: true });

      doc.font('Helvetica-Bold').text('Academic Year:', leftX, metadataY + 36);
      doc.font('Helvetica').text(filters.academicYear && filters.academicYear !== 'ALL' ? filters.academicYear : 'All Academic Years', leftValX, metadataY + 36);

      doc.font('Helvetica-Bold').text('Student Year:', leftX, metadataY + 50);
      doc.font('Helvetica').text(studentYearStr, leftValX, metadataY + 50);

      doc.font('Helvetica-Bold').text('Branch:', leftX, metadataY + 64);
      doc.font('Helvetica').text(filters.branch && filters.branch !== 'ALL' ? filters.branch : 'All Branches', leftValX, metadataY + 64, { width: 140, ellipsis: true });

      // Right Column Metadata
      const rightX = 300;
      const rightValX = 390;

      doc.font('Helvetica-Bold').text('Visit Type:', rightX, metadataY + 8);
      doc.font('Helvetica').text(visitTypeStr, rightValX, metadataY + 8);

      doc.font('Helvetica-Bold').text('Date Range:', rightX, metadataY + 22);
      doc.font('Helvetica').text(dateRangeStr, rightValX, metadataY + 22);

      doc.font('Helvetica-Bold').text('Location:', rightX, metadataY + 36);
      doc.font('Helvetica').text(filters.location && filters.location !== 'ALL' ? filters.location : 'All Locations', rightValX, metadataY + 36);

      doc.font('Helvetica-Bold').text('Generation Date:', rightX, metadataY + 50);
      doc.font('Helvetica').text(generatedDateStr, rightValX, metadataY + 50, { width: 160 });

      doc.font('Helvetica-Bold').text('User Email:', rightX, metadataY + 64);
      doc.font('Helvetica').text(userInfo.email || 'N/A', rightValX, metadataY + 64, { width: 160, ellipsis: true });

      doc.y = metadataY + 104;

      // --- 1. EXECUTIVE SUMMARY ---
      addSectionHeader('Executive Summary', '1');

      doc
        .fillColor(TEXT_DARK)
        .fontSize(8)
        .font('Helvetica')
        .text(
          'This official institutional analytics report presents a verified synthesis of student participation, attendance turnout, seat capacity utilization, certificate completion, and industry exposure outcomes across industrial visits conducted under the VIT Industrial Exposure Program. All data is dynamically filtered and scoped strictly to authorized faculty permissions.',
          36,
          doc.y,
          { width: pageWidth, align: 'justify' }
        );

      doc.moveDown(0.6);

      // KPI Grid (3x2)
      const kpiY = doc.y;
      const colW = (pageWidth - 16) / 3;
      const cardH = 44;

      drawKpiCard(
        36,
        kpiY,
        colW,
        cardH,
        'Students Participated',
        `${analytics.summaryKpis.uniqueStudentsParticipated}`,
        'Unique Verified Students'
      );
      drawKpiCard(
        36 + colW + 8,
        kpiY,
        colW,
        cardH,
        'Visits Conducted',
        `${analytics.summaryKpis.completedVisits} / ${analytics.summaryKpis.totalVisitsInScope}`,
        'Completed / Total In Scope'
      );
      drawKpiCard(
        36 + (colW + 8) * 2,
        kpiY,
        colW,
        cardH,
        'Average Attendance',
        `${analytics.summaryKpis.averageAttendance}%`,
        'Turnout Compliance Rate'
      );

      drawKpiCard(
        36,
        kpiY + cardH + 6,
        colW,
        cardH,
        'Learning Hours',
        `${analytics.summaryKpis.totalLearningHours} hrs`,
        'Curricular Credit Hours'
      );
      drawKpiCard(
        36 + colW + 8,
        kpiY + cardH + 6,
        colW,
        cardH,
        'Seat Utilization',
        `${analytics.seatUtilization.utilizationPercentage}%`,
        `${analytics.seatUtilization.totalRegistrations} / ${analytics.seatUtilization.totalCapacity} Seats`
      );
      drawKpiCard(
        36 + (colW + 8) * 2,
        kpiY + cardH + 6,
        colW,
        cardH,
        'Certificates Issued',
        `${analytics.summaryKpis.certificatesIssued}`,
        'Verified Student Badges'
      );

      doc.y = kpiY + (cardH + 6) * 2 + 8;

      // --- 2. PARTICIPATION ---
      addSectionHeader('Participation', '2');

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Across the active filters, ${analytics.summaryKpis.uniqueStudentsParticipated} unique students generated ${analytics.summaryKpis.totalRegistrations} total registrations. Total allocated seat capacity across in-scope visits is ${analytics.seatUtilization.totalCapacity} seats, with ${analytics.summaryKpis.waitlistedStudents} pending waitlist requests and an overall seat booking utilization rate of ${analytics.seatUtilization.utilizationPercentage}%.`,
          36,
          doc.y,
          { width: pageWidth, align: 'justify' }
        );

      doc.moveDown(0.5);

      const partY = doc.y;
      const partBoxW = (pageWidth - 24) / 4;
      drawKpiCard(36, partY, partBoxW, 40, 'Unique Students', `${analytics.summaryKpis.uniqueStudentsParticipated}`, 'Distinct Attendees');
      drawKpiCard(36 + partBoxW + 8, partY, partBoxW, 40, 'Registrations', `${analytics.summaryKpis.totalRegistrations}`, 'Total Confirmed');
      drawKpiCard(36 + (partBoxW + 8) * 2, partY, partBoxW, 40, 'Waitlisted', `${analytics.summaryKpis.waitlistedStudents}`, 'Pending Capacity');
      drawKpiCard(36 + (partBoxW + 8) * 3, partY, partBoxW, 40, 'Capacity Utilization', `${analytics.seatUtilization.utilizationPercentage}%`, `${analytics.seatUtilization.totalRegistrations}/${analytics.seatUtilization.totalCapacity}`);

      doc.y = partY + 48;

      // --- 3. BRANCH ANALYSIS ---
      addSectionHeader('Branch Analysis', '3');

      doc
        .fontSize(8)
        .font('Helvetica')
        .text('Detailed participation, turnout, and certificate distribution by academic branch:', 36, doc.y);

      doc.moveDown(0.4);

      const bStartY = doc.y;
      doc.rect(36, bStartY, pageWidth, 16).fill(SECONDARY_COLOR);
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Academic Branch', 44, bStartY + 4);
      doc.text('Registered', 220, bStartY + 4, { width: 70, align: 'center' });
      doc.text('Attended', 300, bStartY + 4, { width: 70, align: 'center' });
      doc.text('Attendance Rate', 380, bStartY + 4, { width: 80, align: 'center' });
      doc.text('Certificates Issued', 470, bStartY + 4, { width: 80, align: 'center' });

      let bY = bStartY + 16;
      analytics.branchAnalytics.forEach((b, idx) => {
        if (bY > 730) {
          doc.addPage();
          bY = 40;
        }
        const bg = idx % 2 === 0 ? BG_LIGHT : '#FFFFFF';
        doc.rect(36, bY, pageWidth, 15).fillAndStroke(bg, BORDER_COLOR);
        doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica');
        doc.text(b.branch, 44, bY + 4);
        doc.text(`${b.registered}`, 220, bY + 4, { width: 70, align: 'center' });
        doc.text(`${b.attended}`, 300, bY + 4, { width: 70, align: 'center' });
        doc.text(`${b.attendancePercentage}%`, 380, bY + 4, { width: 80, align: 'center' });
        doc.text(`${b.certificates}`, 470, bY + 4, { width: 80, align: 'center' });
        bY += 15;
      });

      doc.y = bY + 8;

      // --- 4. YEAR ANALYSIS ---
      addSectionHeader('Year Analysis', '4');

      const yStartY = doc.y;
      doc.rect(36, yStartY, pageWidth, 16).fill(SECONDARY_COLOR);
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Academic Cohort / Year', 44, yStartY + 4);
      doc.text('Registered Students', 250, yStartY + 4, { width: 100, align: 'center' });
      doc.text('Attended Students', 360, yStartY + 4, { width: 100, align: 'center' });
      doc.text('Turnout Rate', 470, yStartY + 4, { width: 80, align: 'center' });

      let yY = yStartY + 16;
      analytics.yearAnalytics.forEach((y, idx) => {
        if (yY > 730) {
          doc.addPage();
          yY = 40;
        }
        const bg = idx % 2 === 0 ? BG_LIGHT : '#FFFFFF';
        doc.rect(36, yY, pageWidth, 15).fillAndStroke(bg, BORDER_COLOR);
        doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica');
        doc.text(`${y.yearLabel} (Year ${y.year})`, 44, yY + 4);
        doc.text(`${y.registered}`, 250, yY + 4, { width: 100, align: 'center' });
        doc.text(`${y.attended}`, 360, yY + 4, { width: 100, align: 'center' });
        doc.text(`${y.attendancePercentage}%`, 470, yY + 4, { width: 80, align: 'center' });
        yY += 15;
      });

      doc.y = yY + 8;

      // --- 5. ATTENDANCE ---
      addSectionHeader('Attendance', '5');

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Verified attendance turnout rate across all completed visits is ${analytics.attendanceBreakdown.attendancePercentage}%. A total of ${analytics.attendanceBreakdown.totalMarked} individual student records have been officially verified by faculty coordinators.`,
          36,
          doc.y,
          { width: pageWidth }
        );

      doc.moveDown(0.5);

      const attY = doc.y;
      const attBoxW = (pageWidth - 24) / 4;
      drawKpiCard(36, attY, attBoxW, 40, 'Present', `${analytics.attendanceBreakdown.present}`, 'Verified Turnout');
      drawKpiCard(36 + attBoxW + 8, attY, attBoxW, 40, 'Absent', `${analytics.attendanceBreakdown.absent}`, 'Unexcused Absence');
      drawKpiCard(36 + (attBoxW + 8) * 2, attY, attBoxW, 40, 'Late', `${analytics.attendanceBreakdown.late}`, 'Delayed Arrival');
      drawKpiCard(36 + (attBoxW + 8) * 3, attY, attBoxW, 40, 'Excused', `${analytics.attendanceBreakdown.excused}`, 'Official Leave');

      doc.y = attY + 48;

      // --- 6. VISIT PERFORMANCE ---
      addSectionHeader('Visit Performance', '6');

      doc
        .fontSize(8)
        .font('Helvetica')
        .text('Detailed directory of in-scope industrial visits and individual performance benchmarks:', 36, doc.y);

      doc.moveDown(0.4);

      const vpStartY = doc.y;
      doc.rect(36, vpStartY, pageWidth, 16).fill(PRIMARY_COLOR);
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Visit Title & Organization', 44, vpStartY + 4);
      doc.text('Category', 240, vpStartY + 4, { width: 60, align: 'center' });
      doc.text('Date', 305, vpStartY + 4, { width: 55, align: 'center' });
      doc.text('Capacity', 365, vpStartY + 4, { width: 45, align: 'center' });
      doc.text('Booked', 415, vpStartY + 4, { width: 40, align: 'center' });
      doc.text('Attended %', 460, vpStartY + 4, { width: 45, align: 'center' });
      doc.text('Status', 510, vpStartY + 4, { width: 45, align: 'center' });

      let vpY = vpStartY + 16;
      analytics.visitPerformance.forEach((v, idx) => {
        if (vpY > 730) {
          doc.addPage();
          vpY = 40;
        }
        const bg = idx % 2 === 0 ? BG_LIGHT : '#FFFFFF';
        doc.rect(36, vpY, pageWidth, 17).fillAndStroke(bg, BORDER_COLOR);
        doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica-Bold');
        doc.text(v.title, 44, vpY + 3, { width: 190, ellipsis: true });
        doc.font('Helvetica').fontSize(6).fillColor(TEXT_MUTED).text(v.organization, 44, vpY + 9.5, { width: 190, ellipsis: true });

        doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica');
        doc.text(v.experienceType, 240, vpY + 4, { width: 60, align: 'center' });
        doc.text(v.date, 305, vpY + 4, { width: 55, align: 'center' });
        doc.text(`${v.capacity}`, 365, vpY + 4, { width: 45, align: 'center' });
        doc.text(`${v.registrations}`, 415, vpY + 4, { width: 40, align: 'center' });
        doc.text(`${v.attendancePercentage}%`, 460, vpY + 4, { width: 45, align: 'center' });
        doc.text(v.status, 510, vpY + 4, { width: 45, align: 'center' });
        vpY += 17;
      });

      doc.y = vpY + 8;

      // --- 7. LEARNING HOURS ---
      addSectionHeader('Learning Hours', '7');

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Students accumulated a total of ${analytics.summaryKpis.totalLearningHours} cumulative experiential learning credit hours through practical industrial plant exposures, research lab visits, and technical demonstrations in accordance with VIT curriculum standards.`,
          36,
          doc.y,
          { width: pageWidth }
        );

      doc.moveDown(0.4);

      const lhStartY = doc.y;
      doc.rect(36, lhStartY, pageWidth, 16).fill(SECONDARY_COLOR);
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Visit Type', 44, lhStartY + 4);
      doc.text('Visits Conducted', 220, lhStartY + 4, { width: 90, align: 'center' });
      doc.text('Attendees Reached', 330, lhStartY + 4, { width: 90, align: 'center' });
      doc.text('Learning Hours Delivered', 440, lhStartY + 4, { width: 110, align: 'center' });

      let lhY = lhStartY + 16;
      analytics.visitTypeAnalytics.forEach((vt, idx) => {
        if (lhY > 730) {
          doc.addPage();
          lhY = 40;
        }
        const bg = idx % 2 === 0 ? BG_LIGHT : '#FFFFFF';
        doc.rect(36, lhY, pageWidth, 15).fillAndStroke(bg, BORDER_COLOR);
        doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica');
        doc.text(vt.type, 44, lhY + 4);
        doc.text(`${vt.visits}`, 220, lhY + 4, { width: 90, align: 'center' });
        doc.text(`${vt.students}`, 330, lhY + 4, { width: 90, align: 'center' });
        doc.text(`${vt.learningHours} hrs`, 440, lhY + 4, { width: 110, align: 'center' });
        lhY += 15;
      });

      doc.y = lhY + 8;

      // --- 8. VISIT TYPE DISTRIBUTION ---
      addSectionHeader('Visit Type Distribution', '8');

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Distribution of visits, student reach, turnout compliance, and learning credit hours across experience types:`,
          36,
          doc.y,
          { width: pageWidth }
        );

      doc.moveDown(0.4);

      const catStartY = doc.y;
      doc.rect(36, catStartY, pageWidth, 16).fill(PRIMARY_COLOR);
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Program Type / Category', 44, catStartY + 4);
      doc.text('Visits', 240, catStartY + 4, { width: 50, align: 'center' });
      doc.text('Students', 300, catStartY + 4, { width: 70, align: 'center' });
      doc.text('Turnout %', 380, catStartY + 4, { width: 60, align: 'center' });
      doc.text('Learning Hours', 450, catStartY + 4, { width: 100, align: 'center' });

      let catY = catStartY + 16;
      analytics.visitTypeAnalytics.forEach((vt, idx) => {
        if (catY > 730) {
          doc.addPage();
          catY = 40;
        }
        const bg = idx % 2 === 0 ? BG_LIGHT : '#FFFFFF';
        doc.rect(36, catY, pageWidth, 15).fillAndStroke(bg, BORDER_COLOR);
        doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica');
        doc.text(vt.type, 44, catY + 4);
        doc.text(`${vt.visits}`, 240, catY + 4, { width: 50, align: 'center' });
        doc.text(`${vt.students}`, 300, catY + 4, { width: 70, align: 'center' });
        doc.text(`${vt.attendancePercentage}%`, 380, catY + 4, { width: 60, align: 'center' });
        doc.text(`${vt.learningHours} hrs`, 450, catY + 4, { width: 100, align: 'center' });
        catY += 15;
      });

      doc.y = catY + 8;

      // --- 9. CERTIFICATES ---
      addSectionHeader('Certificates', '9');

      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `A total of ${analytics.certificateAnalytics.totalCertificates} official verified completion certificates have been awarded to students who satisfied the requisite attendance and participation criteria. Certificates are digitally signed and verifiable in the portal.`,
          36,
          doc.y,
          { width: pageWidth }
        );

      doc.moveDown(0.6);

      // --- 10. STUDENT EXPERIENCE ---
      addSectionHeader('Student Experience & Feedback', '10');

      const fb = analytics.feedbackAnalytics;
      if (fb.totalFeedbackCount === 0) {
        doc
          .fontSize(8)
          .font('Helvetica-Oblique')
          .fillColor('#64748B')
          .text('No student feedback submissions recorded within the authorized scope.', 36, doc.y, { width: pageWidth });
        doc.fillColor('#0F172A');
        doc.moveDown(0.6);
      } else {
        const avgR = fb.averageRating !== null ? `${fb.averageRating.toFixed(1)} / 5.0` : 'N/A';
        const learnR = fb.learningValueAvg !== null ? `${fb.learningValueAvg.toFixed(1)} / 5.0` : 'N/A';
        const techR = fb.technicalExposureAvg !== null ? `${fb.technicalExposureAvg.toFixed(1)} / 5.0` : 'N/A';
        const coordR = fb.facultyCoordinationAvg !== null ? `${fb.facultyCoordinationAvg.toFixed(1)} / 5.0` : 'N/A';
        const orgR = fb.organizationAvg !== null ? `${fb.organizationAvg.toFixed(1)} / 5.0` : 'N/A';
        const recPct = fb.wouldRecommendPercentage !== null ? `${fb.wouldRecommendPercentage.toFixed(1)}%` : 'N/A';

        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            `Student feedback analysis across ${fb.totalFeedbackCount} submitted evaluation(s) yields an overall satisfaction score of ${avgR}, technical exposure at ${techR}, faculty coordination at ${coordR}, learning depth at ${learnR}, organization at ${orgR}, with a recommendation rate of ${recPct}.`,
            36,
            doc.y,
            { width: pageWidth }
          );

        doc.moveDown(0.5);

        const fbY = doc.y;
        const colW = (pageWidth - 24) / 4;
        drawKpiCard(36, fbY, colW, 40, 'Overall Score', avgR, 'Avg Student Rating');
        drawKpiCard(36 + colW + 8, fbY, colW, 40, 'Technical Exposure', techR, 'Industry Depth');
        drawKpiCard(36 + (colW + 8) * 2, fbY, colW, 40, 'Learning Value', learnR, 'Academic Merit');
        drawKpiCard(36 + (colW + 8) * 3, fbY, colW, 40, 'Recommend Rate', recPct, 'Student Approval');

        doc.y = fbY + 48;
      }

      // --- 11. TOP VISITS ---
      addSectionHeader('Top Visits', '11');

      doc
        .fontSize(8)
        .font('Helvetica')
        .text('Visits ranked by multi-component performance score (Attendance %, Capacity Utilization, Rating, Learning Hours):', 36, doc.y);

      doc.moveDown(0.4);

      const topStartY = doc.y;
      doc.rect(36, topStartY, pageWidth, 16).fill(PRIMARY_COLOR);
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Rank', 44, topStartY + 4, { width: 28, align: 'center' });
      doc.text('Visit Title & Organization', 76, topStartY + 4);
      doc.text('Turnout', 300, topStartY + 4, { width: 50, align: 'center' });
      doc.text('Rating', 355, topStartY + 4, { width: 45, align: 'center' });
      doc.text('Attended', 405, topStartY + 4, { width: 55, align: 'center' });
      doc.text('Score', 465, topStartY + 4, { width: 85, align: 'center' });

      let topY = topStartY + 16;
      analytics.topPerformingVisits.forEach((v) => {
        if (topY > 730) {
          doc.addPage();
          topY = 40;
        }
        const bg = v.rank % 2 === 1 ? BG_LIGHT : '#FFFFFF';
        doc.rect(36, topY, pageWidth, 17).fillAndStroke(bg, BORDER_COLOR);
        doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold');
        doc.text(`#${v.rank}`, 44, topY + 4, { width: 28, align: 'center' });
        doc.text(v.title, 76, topY + 3, { width: 220, ellipsis: true });
        doc.font('Helvetica').fontSize(6).fillColor(TEXT_MUTED).text(v.organization, 76, topY + 9.5, { width: 220, ellipsis: true });

        doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica');
        doc.text(`${v.attendancePercentage}%`, 300, topY + 4, { width: 50, align: 'center' });
        doc.text(v.rating ? `${v.rating} ★` : 'N/A', 355, topY + 4, { width: 45, align: 'center' });
        doc.text(`${v.attended}/${v.capacity}`, 405, topY + 4, { width: 55, align: 'center' });
        doc.font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text(`${v.performanceScore} / 100`, 465, topY + 4, { width: 85, align: 'center' });
        topY += 17;
      });

      doc.y = topY + 8;

      // --- 12. RECENT COMPLETED VISITS ---
      addSectionHeader('Recent Completed Visits', '12');

      const recStartY = doc.y;
      doc.rect(36, recStartY, pageWidth, 16).fill(SECONDARY_COLOR);
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Visit Title & Organization', 44, recStartY + 4);
      doc.text('Date', 300, recStartY + 4, { width: 70, align: 'center' });
      doc.text('Turnout %', 380, recStartY + 4, { width: 70, align: 'center' });
      doc.text('Rating', 460, recStartY + 4, { width: 60, align: 'center' });

      let recY = recStartY + 16;
      analytics.recentCompletedVisits.forEach((v, idx) => {
        if (recY > 730) {
          doc.addPage();
          recY = 40;
        }
        const bg = idx % 2 === 0 ? BG_LIGHT : '#FFFFFF';
        doc.rect(36, recY, pageWidth, 15).fillAndStroke(bg, BORDER_COLOR);
        doc.fillColor(TEXT_DARK).fontSize(7.5).font('Helvetica-Bold');
        doc.text(v.title, 44, recY + 3.5, { width: 250, ellipsis: true });
        doc.font('Helvetica').fontSize(7.5);
        doc.text(v.date, 300, recY + 3.5, { width: 70, align: 'center' });
        doc.text(`${v.attendancePercentage}%`, 380, recY + 3.5, { width: 70, align: 'center' });
        doc.text(v.rating ? `${v.rating} ★` : 'N/A', 460, recY + 3.5, { width: 60, align: 'center' });
        recY += 15;
      });

      doc.y = recY + 8;

      // --- FOOTERS WITH PAGE NUMBERS ---
      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);

        // Footer dividing line
        doc
          .strokeColor(BORDER_COLOR)
          .lineWidth(0.5)
          .moveTo(36, doc.page.height - 28)
          .lineTo(doc.page.width - 36, doc.page.height - 28)
          .stroke();

        doc
          .fillColor(TEXT_MUTED)
          .fontSize(7)
          .font('Helvetica')
          .text(
            'Vishwakarma Institute of Technology, Pune — Departmental Reports & Analytics',
            36,
            doc.page.height - 20
          );

        doc.text(
          `Page ${i + 1} of ${pageRange.count}`,
          doc.page.width - 120,
          doc.page.height - 20,
          { width: 84, align: 'right' }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
