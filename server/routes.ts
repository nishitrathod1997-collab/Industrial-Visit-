import { Router, Request, Response } from 'express';
import { db } from './db';
import {
  handleAssistantChat,
  handleStudentRecommendations,
  handleFacultyHelper,
  handleAdminInsights,
  handleGenerateVisitContent,
} from './ai';
import {
  searchVerifiedOrganizations,
  VERIFIED_ORGANIZATIONS,
  VerifiedOrganization,
} from './organizationData';
import {
  createAuthToken,
  getUserIdFromToken,
  invalidateToken,
  createResetToken,
  verifyResetToken,
  consumeResetToken,
} from './auth';
import {
  getAnalyticsUserScope,
  enforceAnalyticsFilterScope,
  RawAnalyticsFilters,
} from './analyticsAuth';
import { calculateAnalytics } from './analyticsService';
import { generateOfficialPdfReport } from './pdfReportGenerator';
import { generateOfficialExcelReport } from './excelReportGenerator';
import { validateConsentDocument } from './consentValidation';
import { getSchedulerStatus, runPreTrip3DayScheduler } from './scheduler';
import { getEmailWorkerStatus, processPendingEmailQueue } from './emailWorker';
import { calculateDaysUntilTrip, notificationService } from './notificationService';
import { emailService } from './emailService';

export const apiRouter = Router();

function sanitizeUser(user: any) {
  if (!user) return user;
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

// Helper to extract authenticated user from authorization header or query/header
async function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-user-id']) {
    token = req.headers['x-user-id'] as string;
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    return { user: null, student: null, faculty: null, userId: null };
  }

  const user = db.getUserById(userId);
  if (!user) {
    return { user: null, student: null, faculty: null, userId: null };
  }

  const student = user.role === 'STUDENT' ? db.getStudentProfileByUserId(userId) : null;
  const faculty = user.role === 'FACULTY' ? db.getFacultyProfileByUserId(userId) : null;

  return { user: sanitizeUser(user), student, faculty, userId };
}

// --- AUTH ROUTES ---
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { identifier, email, password, role } = req.body;
  const loginInput = identifier || email;
  const requestedRole = (role || 'STUDENT').toUpperCase() as 'STUDENT' | 'FACULTY' | 'ADMIN';

  if (!loginInput || !loginInput.trim()) {
    return res.status(400).json({ error: 'Please enter your email or roll number.' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const inputStr = loginInput.trim();

  // Domain validation for student email
  if (requestedRole === 'STUDENT' && inputStr.includes('@')) {
    const domain = inputStr.split('@')[1]?.toLowerCase();
    if (domain !== 'vit.edu.in' && domain !== 'vit.ac.in') {
      return res.status(400).json({ error: 'Student email must use the @vit.edu.in domain.' });
    }
  }

  // Domain validation for faculty/admin email
  if ((requestedRole === 'FACULTY' || requestedRole === 'ADMIN') && inputStr.includes('@')) {
    const domain = inputStr.split('@')[1]?.toLowerCase();
    if (domain !== 'vit.edu.in' && domain !== 'vit.ac.in') {
      return res.status(400).json({ error: 'Please use your official @vit.edu.in college email address.' });
    }
  }

  const { prisma } = require('./db');
  const { verifyPassword } = require('./auth');

  try {
    let user = null;
    if (inputStr.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: inputStr.toLowerCase() },
        include: { studentProfile: true, facultyProfile: true }
      });
    } else {
      if (requestedRole === 'STUDENT') {
        const profile = await prisma.studentProfile.findUnique({
          where: { studentId: inputStr.toUpperCase() },
          include: { user: { include: { studentProfile: true } } }
        });
        if (profile) user = profile.user;
      } else if (requestedRole === 'FACULTY') {
        const profile = await prisma.facultyProfile.findUnique({
          where: { facultyId: inputStr.toUpperCase() },
          include: { user: { include: { facultyProfile: true } } }
        });
        if (profile) user = profile.user;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'No account found with these credentials.' });
    }

    if (user.role !== requestedRole) {
      return res.status(401).json({ error: `Account exists but not as a ${requestedRole.toLowerCase()}.` });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    if (!user.passwordHash || !user.salt) {
      return res.status(401).json({ error: 'Password not set for this account.' });
    }

    if (!verifyPassword(password, user.passwordHash, user.salt)) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = createAuthToken(user.id);

    return res.json({
      token,
      user: sanitizeUser(user),
      student: user.studentProfile || null,
      faculty: user.facultyProfile || null,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

apiRouter.post('/auth/me/phone/otp', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required.' });
  // Simulate sending OTP
  console.log('Sending OTP to', phone);
  res.json({ message: 'OTP sent successfully' });
});

apiRouter.post('/auth/me/phone/verify', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP are required.' });
  if (otp !== '123456') return res.status(400).json({ message: 'Invalid OTP. Please use 123456 for testing.' });
  
  try {
    const updatedUser = db.updateMyProfile(userId, { phone });
    res.json({ message: 'Phone updated successfully', user: updatedUser });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

apiRouter.put('/auth/me/password', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const { currentPassword, newPassword } = req.body;
  
  try {
    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!db.verifyUserPassword(userId, currentPassword)) return res.status(401).json({ message: 'Incorrect current password' });
    
    db.updateUserPassword(userId, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

apiRouter.put('/auth/me/profile', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const updatedUser = db.updateMyProfile(userId, req.body);
    res.json({ user: updatedUser });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  const { user, student, faculty } = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const unreadNotifs = db.getNotificationsForUser(user.id).filter((n) => !n.read).length;

  res.json({
    user,
    student,
    faculty,
    unreadNotificationCount: unreadNotifs,
  });
});

apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-user-id']) {
    token = req.headers['x-user-id'] as string;
  }

  if (token) {
    invalidateToken(token);
  }

  res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { identifier, email, role } = req.body;
  const loginInput = identifier || email;
  const requestedRole = (role || 'STUDENT').toUpperCase() as 'STUDENT' | 'FACULTY' | 'ADMIN';

  if (!loginInput || !loginInput.trim()) {
    return res.status(400).json({ error: 'Please enter your email or roll number.' });
  }

  const { user } = db.findUserForAuth(loginInput.trim(), requestedRole);
  if (!user) {
    return res.status(404).json({ error: 'No account found with these credentials.' });
  }

  const resetToken = createResetToken(user.id, user.email);

  return res.json({
    message: 'Password reset code generated.',
    resetToken,
    userEmail: user.email,
  });
});

apiRouter.post('/auth/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const resetData = verifyResetToken(token);
  if (!resetData) {
    return res.status(400).json({ error: 'Invalid or expired password reset code.' });
  }

  const success = db.updateUserPassword(resetData.userId, newPassword);
  if (!success) {
    return res.status(500).json({ error: 'Failed to update password.' });
  }

  consumeResetToken(token);

  return res.json({ message: 'Password successfully reset. You can now sign in with your new password.' });
});

apiRouter.post('/auth/switch-user', async (req: Request, res: Response) => {
  const { userId } = req.body;
  const currentAuth = await getAuthUser(req);

  // Authorize user switching: only Admin can switch freely, or user can switch if authorized
  if (currentAuth.user && currentAuth.user.role !== 'ADMIN' && currentAuth.user.id !== userId) {
    return res.status(403).json({ error: 'You do not have permission to switch to another user account.' });
  }

  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const student = user.role === 'STUDENT' ? db.getStudentProfileByUserId(user.id) : null;
  const faculty = user.role === 'FACULTY' ? db.getFacultyProfileByUserId(user.id) : null;

  const token = createAuthToken(user.id);

  res.json({ token, user: sanitizeUser(user), student, faculty });
});

// --- EXPERIENCES ROUTES ---
apiRouter.get('/experiences', async (req: Request, res: Response) => {
  const { user, student } = await getAuthUser(req);
  const { status, type, search } = req.query as { status?: string; type?: string; search?: string };

  const experiences = db.getExperiences({
    userRole: user?.role,
    userId: user?.id,
    studentId: student?.studentId,
    status,
    type,
    search,
  });

  res.json(experiences);
});

apiRouter.get('/experiences/:id', async (req: Request, res: Response) => {
  const { user, student } = await getAuthUser(req);
  const exp = db.getExperienceById(req.params.id, student?.studentId);
  if (!exp) return res.status(404).json({ error: 'Experience not found' });
  
  if (user?.role === 'STUDENT') {
    if (exp.status === 'DRAFT' || exp.status === 'PENDING_APPROVAL' || exp.status === 'REJECTED') {
      return res.status(403).json({ error: 'Experience not visible' });
    }
  }
  
  res.json(exp);
});

function sanitizeExperiencePayload(body: any, userId: string) {
  const payload = { ...body };
  payload.primaryFacultyId = payload.primaryFacultyId || userId;

  if (payload.eligibility) {
    const rawYears = payload.eligibility.allowedYears;
    let allowedYears: number[] = [1, 2, 3, 4];
    if (Array.isArray(rawYears) && rawYears.length > 0) {
      allowedYears = Array.from(
        new Set(rawYears.map((y: any) => Number(y)).filter((y: number) => !isNaN(y) && y >= 1 && y <= 4))
      ).sort((a: number, b: number) => a - b);
      if (allowedYears.length === 0) {
        allowedYears = [1, 2, 3, 4];
      }
    }

    const rawBranches = payload.eligibility.allowedBranches;
    let allowedBranches: string[] = [];
    if (Array.isArray(rawBranches)) {
      allowedBranches = Array.from(
        new Set(rawBranches.map((b: any) => String(b).trim()).filter(Boolean))
      );
    }

    const rawSemesters = payload.eligibility.allowedSemesters;
    let allowedSemesters: number[] = [];
    if (Array.isArray(rawSemesters) && rawSemesters.length > 0) {
      allowedSemesters = Array.from(
        new Set(rawSemesters.map((s: any) => Number(s)).filter((s: number) => !isNaN(s) && s >= 1 && s <= 8))
      ).sort((a: number, b: number) => a - b);
    }

    const rawDivisions = payload.eligibility.allowedDivisions;
    let allowedDivisions: string[] = [];
    if (Array.isArray(rawDivisions)) {
      allowedDivisions = Array.from(
        new Set(rawDivisions.map((d: any) => String(d).trim().toUpperCase()).filter(Boolean))
      );
    }

    let minCgpa = payload.eligibility.minCgpa !== undefined && payload.eligibility.minCgpa !== ''
      ? Number(payload.eligibility.minCgpa)
      : undefined;
    if (minCgpa !== undefined && (isNaN(minCgpa) || minCgpa <= 0)) minCgpa = undefined;

    let maxCgpa = payload.eligibility.maxCgpa !== undefined && payload.eligibility.maxCgpa !== ''
      ? Number(payload.eligibility.maxCgpa)
      : undefined;
    if (maxCgpa !== undefined && (isNaN(maxCgpa) || maxCgpa <= 0 || maxCgpa > 10)) maxCgpa = undefined;

    const backlogRule = payload.eligibility.backlogRule || 'NO_RESTRICTION';
    let maxBacklogs = payload.eligibility.maxBacklogs !== undefined && payload.eligibility.maxBacklogs !== ''
      ? Number(payload.eligibility.maxBacklogs)
      : undefined;
    if (maxBacklogs !== undefined && (isNaN(maxBacklogs) || maxBacklogs < 0)) maxBacklogs = undefined;

    let minAttendance = payload.eligibility.minAttendance !== undefined && payload.eligibility.minAttendance !== ''
      ? Number(payload.eligibility.minAttendance)
      : undefined;
    if (minAttendance !== undefined && (isNaN(minAttendance) || minAttendance <= 0)) minAttendance = undefined;

    payload.eligibility = {
      allowedBranches,
      allowedYears,
      allowedSemesters,
      allowedDivisions,
      minCgpa,
      maxCgpa,
      backlogRule,
      maxBacklogs,
      minAttendance,
      additionalRules: payload.eligibility.additionalRules ? String(payload.eligibility.additionalRules).trim() : undefined,
    };
  }

  // Sanitize Organization & Location details
  if (payload.organization) {
    payload.organization = String(payload.organization).trim();
  }
  if (payload.organizationWebsite) {
    payload.organizationWebsite = String(payload.organizationWebsite).trim();
  }
  if (payload.location) {
    payload.location = String(payload.location).trim();
  }
  if (payload.address) {
    payload.address = String(payload.address).trim();
  }
  if (payload.city) {
    payload.city = String(payload.city).trim();
  }
  if (payload.state) {
    payload.state = String(payload.state).trim();
  }
  if (payload.country) {
    payload.country = String(payload.country).trim();
  }

  // Ensure valid latitude & longitude numbers if provided
  if (payload.latitude !== undefined && payload.latitude !== '') {
    const latNum = Number(payload.latitude);
    payload.latitude = !isNaN(latNum) ? latNum : undefined;
  }
  if (payload.longitude !== undefined && payload.longitude !== '') {
    const lngNum = Number(payload.longitude);
    payload.longitude = !isNaN(lngNum) ? lngNum : undefined;
  }

  // Ensure Google Maps URL is well-formed
  if (payload.googleMapsUrl) {
    payload.googleMapsUrl = String(payload.googleMapsUrl).trim();
  } else if (payload.organization || payload.location || payload.address) {
    const queryParts = [
      payload.organization,
      payload.address || payload.location,
      payload.city,
      payload.state,
      payload.country || 'India',
    ].filter(Boolean);
    payload.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts.join(', '))}`;
  }

  // Synchronize companyInfo
  if (!payload.companyInfo && (payload.organizationWebsite || payload.organizationDescription)) {
    payload.companyInfo = {
      website: payload.organizationWebsite || '',
      about: payload.organizationDescription || '',
      headquarters: payload.city ? `${payload.city}, ${payload.state || 'India'}` : 'India',
    };
  } else if (payload.companyInfo) {
    if (payload.organizationWebsite && !payload.companyInfo.website) {
      payload.companyInfo.website = payload.organizationWebsite;
    }
  }

  return payload;
}

// --- ORGANIZATION LOOKUP & DIRECTORY ROUTES ---
apiRouter.get('/organizations/lookup', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q || req.query.query || req.query.name || '') as string;
    const result = searchVerifiedOrganizations(query);
    res.json({
      query,
      matches: result.matches,
      exactMatch: result.exactMatch,
      count: result.matches.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to search organizations' });
  }
});

apiRouter.get('/organizations/presets', async (_req: Request, res: Response) => {
  try {
    // Return curated list of popular verified organizations across top engineering domains
    const popularIds = [
      'org_iit_bombay',
      'org_siemens_india',
      'org_tata_motors_pune',
      'org_lt_heavy_eng',
      'org_isro_istrac',
      'org_barc_mumbai',
      'org_infosys_mysore',
      'org_tcs_innovation_pune',
      'org_godrej_aerospace',
      'org_mahindra_rd_chennai',
      'org_drdo_rande_pune',
      'org_iit_delhi',
      'org_iit_madras',
      'org_google_india_blr',
      'org_microsoft_india_hyd',
    ];
    const presets = VERIFIED_ORGANIZATIONS.filter((org) => popularIds.includes(org.id));
    res.json(presets);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch organization presets' });
  }
});

apiRouter.get('/organizations/all', async (_req: Request, res: Response) => {
  try {
    res.json(VERIFIED_ORGANIZATIONS);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch organizations' });
  }
});

apiRouter.post('/experiences/preview-eligibility', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only Faculty and Admin can preview eligibility metrics' });
  }

  try {
    const rawEligibility = req.body?.eligibility;
    const sanitized = sanitizeExperiencePayload({ eligibility: rawEligibility }, user.id);
    const result = db.previewEligibleStudents(sanitized.eligibility);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/academic-options', async (_req: Request, res: Response) => {
  try {
    const options = db.getDistinctAcademicOptions();
    res.json(options);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/experiences', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only Faculty and Admin can create experiences' });
  }

  try {
    const expData = sanitizeExperiencePayload(req.body, user.id);
    const newExp = db.createExperience(expData, user.id, user.role);
    db.addAuditLog({
      action: 'VISIT_CREATED',
      performedBy: user.id,
      performedByName: user.name,
      userRole: user.role,
      details: `Created new experience '${newExp.title}' (${newExp.organization}).`,
      entityId: newExp.id,
      entityType: 'EXPERIENCE',
    });
    res.status(201).json(newExp);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/faculty/experiences', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only Faculty and Admin can create experiences' });
  }

  try {
    const expData = sanitizeExperiencePayload(req.body, user.id);
    const newExp = db.createExperience(expData, user.id, user.role);
    db.addAuditLog({
      action: 'VISIT_CREATED',
      performedBy: user.id,
      performedByName: user.name,
      userRole: user.role,
      details: `Created new experience '${newExp.title}' (${newExp.organization}).`,
      entityId: newExp.id,
      entityType: 'EXPERIENCE',
    });
    res.status(201).json(newExp);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/experiences/:id', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to edit experience' });
  }

  try {
    const expData = sanitizeExperiencePayload(req.body, user.id);
    const updated = db.updateExperience(req.params.id, expData, user.id, user.role);
    if (!updated) return res.status(404).json({ error: 'Experience not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/faculty/experiences/:id', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to edit experience' });
  }

  try {
    const expData = sanitizeExperiencePayload(req.body, user.id);
    const updated = db.updateExperience(req.params.id, expData, user.id, user.role);
    if (!updated) return res.status(404).json({ error: 'Experience not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/experiences/:id', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to delete experience' });
  }

  try {
    const success = db.deleteExperience(req.params.id, user.id, user.role);
    if (!success) return res.status(404).json({ error: 'Experience not found' });
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/faculty/experiences/:id', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to delete experience' });
  }

  try {
    const success = db.deleteExperience(req.params.id, user.id, user.role);
    if (!success) return res.status(404).json({ error: 'Experience not found' });
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/experiences/:id/verify-pass', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  const userId = user?.id || (req.headers['x-user-id'] as string) || 'FACULTY_SCANNER';
  const experienceId = req.params.id;
  const { passNumber, studentId, registrationId, qrPayload } = req.body;

  const rawPayload = qrPayload || passNumber;
  if (!rawPayload && !studentId && !registrationId) {
    return res.status(400).json({
      status: 'INVALID_QR',
      success: false,
      title: 'Invalid QR Code',
      message: 'QR code payload or boarding pass number is required',
    });
  }

  try {
    const result = db.verifyAttendanceQR(
      experienceId,
      {
        qrPayload: rawPayload,
        passNumber,
        studentId,
        registrationId,
      },
      userId
    );

    res.json(result);
  } catch (err: any) {
    console.error('[QR Verification Route Error]:', err);
    res.status(500).json({
      status: 'INVALID_QR',
      success: false,
      title: 'Verification Error',
      message: err.message || 'An unexpected error occurred during attendance verification.',
    });
  }
});

apiRouter.post('/experiences/:id/cancel', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to cancel experience' });
  }

  try {
    const cancelled = db.cancelExperience(req.params.id, req.body.reason, user.id, user.role);
    res.json(cancelled);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- REGISTRATION & WAITLIST ---
apiRouter.post('/experiences/:id/validate-consent', async (req: Request, res: Response) => {
  const { user, student } = await getAuthUser(req);
  if (user?.role !== 'STUDENT' || !student) {
    return res.status(403).json({ error: 'Only enrolled students can validate consent documents.' });
  }

  const { consentDocumentUrl } = req.body;
  if (!consentDocumentUrl) {
    return res.status(400).json({ error: 'Consent document payload is required.' });
  }

  const exp = db.getExperienceById(req.params.id, student.studentId);
  if (!exp) {
    return res.status(404).json({ error: 'Experience not found.' });
  }

  try {
    const validation = await validateConsentDocument({
      consentDocumentUrl,
      student,
      experience: exp,
    });
    res.json(validation);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Consent validation failed.' });
  }
});

apiRouter.post('/experiences/:id/register', async (req: Request, res: Response) => {
  const { user, student } = await getAuthUser(req);
  if (user?.role !== 'STUDENT' || !student) {
    return res.status(403).json({ error: 'Only enrolled students can register for industrial visits.' });
  }

  try {
    const result = await db.registerStudentForExperience(req.params.id, student.studentId, req.body.consentDocumentUrl);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/experiences/:id/consent', async (req: Request, res: Response) => {
  const { user, student } = await getAuthUser(req);
  if (user?.role !== 'STUDENT' || !student) {
    return res.status(403).json({ error: 'Only enrolled students can upload consent documents.' });
  }

  const { consentDocumentUrl } = req.body;
  if (!consentDocumentUrl) {
    return res.status(400).json({ error: 'Consent document payload is required.' });
  }

  try {
    const result = await db.uploadConsentForm(req.params.id, student.studentId, consentDocumentUrl);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const handleStudentCancelRegistration = async (req: Request, res: Response) => {
  const { user, student } = await getAuthUser(req);
  if (user?.role !== 'STUDENT' || !student) {
    return res.status(403).json({ error: 'Unauthorized: Student account required to cancel registration' });
  }

  try {
    const result = db.cancelRegistration(req.params.id, student.studentId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

apiRouter.post('/experiences/:id/cancel-registration', handleStudentCancelRegistration);
apiRouter.delete('/experiences/:id/cancel-registration', handleStudentCancelRegistration);
apiRouter.post('/experiences/:id/registration/cancel', handleStudentCancelRegistration);

// --- STUDENT SPECIFIC ROUTES ---
apiRouter.get('/student/experiences', async (req: Request, res: Response) => {
  const { student } = await getAuthUser(req);
  if (!student) return res.status(400).json({ error: 'Student profile not found' });

  const categorized = db.getStudentExperiences(student.studentId);
  res.json(categorized);
});

apiRouter.get('/student/boarding-pass/:experienceId', async (req: Request, res: Response) => {
  const { student } = await getAuthUser(req);
  if (!student) return res.status(400).json({ error: 'Student profile not found' });

  const exp = db.getExperienceById(req.params.experienceId, student.studentId);
  if (!exp) return res.status(404).json({ error: 'Experience not found' });
  if (!exp.userRegistration || (exp.userRegistration.status !== 'REGISTERED' && exp.userRegistration.status !== 'COMPLETED')) {
    return res.status(403).json({ error: 'Registration is not approved for attendance' });
  }
  if (exp.userRegistration.consentStatus === 'PENDING_VERIFICATION' || exp.userRegistration.consentStatus === 'REJECTED') {
    return res.status(403).json({ error: 'Consent verification must be approved before boarding pass is issued' });
  }
  if (!exp.userBoardingPass) return res.status(404).json({ error: 'No active verified boarding pass found' });

  res.json({
    boardingPass: exp.userBoardingPass,
    experience: exp,
    student,
  });
});

apiRouter.post('/student/leave-request', async (req: Request, res: Response) => {
  const { student } = await getAuthUser(req);
  if (!student) return res.status(400).json({ error: 'Student profile not found' });

  const { experienceId, reason, category, supportingDocument } = req.body;
  if (!experienceId || !reason) {
    return res.status(400).json({ error: 'experienceId and reason are required' });
  }

  try {
    const leave = db.submitLeaveRequest(student.studentId, experienceId, reason, category, supportingDocument);
    res.status(201).json(leave);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/student/leave-requests', async (req: Request, res: Response) => {
  const { student } = await getAuthUser(req);
  if (!student) return res.status(400).json({ error: 'Student profile not found' });

  const leaves = db.getLeaveRequests({ studentId: student.studentId });
  res.json(leaves);
});

apiRouter.get('/student/notifications', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const notifs = db.getNotificationsForUser(user.id);
  res.json(notifs);
});

apiRouter.post('/student/notifications/:id/read', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const notif = db.markNotificationAsRead(req.params.id);
  res.json({ success: !!notif });
});

apiRouter.post('/student/notifications/read-all', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const count = db.markAllNotificationsAsRead(user.id);
  res.json({ success: true, count });
});

// --- MULTI-CHANNEL NOTIFICATION & EMAIL LOG ROUTES ---
apiRouter.get('/notifications/emails', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized: Admin or Faculty access required' });
  }

  const { tripId, studentId, status, eventType } = req.query;
  const logs = db.getEmailLogs({
    tripId: tripId as string,
    studentId: studentId as string,
    status: status as string,
    eventType: eventType as string,
  });
  res.json(logs);
});

apiRouter.get('/notifications/emails/stats', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized: Admin or Faculty access required' });
  }

  const tripId = req.query.tripId as string;
  const stats = db.getEmailDeliveryStats(tripId);
  res.json(stats);
});

apiRouter.post('/notifications/emails/:id/retry', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized: Admin or Faculty access required' });
  }

  try {
    const result = await db.retryFailedEmail(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/notifications/emails/retry-all', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized: Admin or Faculty access required' });
  }

  try {
    const tripId = req.body?.tripId || (req.query.tripId as string);
    const result = await db.retryAllFailedEmails(tripId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/notifications/emails/worker-status', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized: Admin or Faculty access required' });
  }
  res.json(getEmailWorkerStatus());
});

apiRouter.post('/notifications/emails/process-queue', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized: Admin or Faculty access required' });
  }
  try {
    const result = await processPendingEmailQueue(db);
    res.json({ success: true, ...result, message: `Processed ${result.processed} pending email(s): ${result.succeeded} sent, ${result.failed} failed.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/notifications/smtp-verify', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized: Admin or Faculty access required' });
  }

  try {
    const status = await emailService.verifyConnection();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/notifications/test-email', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized: Admin or Faculty access required' });
  }

  try {
    const recipientEmail = req.body?.recipientEmail || 'nishitrathod010@gmail.com';
    const result = await db.sendTestNotificationEmail(recipientEmail);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/experiences/:id/send-reminders', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized: Admin or Faculty access required' });
  }

  if (!isFacultyAuthorizedForExperience(user, req.params.id)) {
    return res.status(403).json({ error: 'You are not authorized to send reminders for this visit' });
  }

  try {
    const result = await db.sendTripReminders(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- FACULTY SPECIFIC ROUTES ---
function isFacultyAuthorizedForExperience(user: any, experienceId: string): boolean {
  if (user?.role === 'ADMIN') return true;
  if (!user || user.role !== 'FACULTY') return false;
  const exp = db.getExperiences().find((e) => e.id === experienceId);
  if (!exp) return false;
  if (user.isHod && user.departmentScope) {
    if ((exp.eligibility?.allowedBranches || []).includes(user.departmentScope)) {
      return true;
    }
  }
  const faculty =
    db.getFacultyProfileByUserId(user.id) ||
    (db as any).data.faculty.find((f: any) => f.facultyId === user.id);
  return (
    exp.primaryFacultyId === user.id ||
    (Boolean(faculty) && exp.primaryFacultyId === faculty?.facultyId) ||
    (Boolean(faculty) && exp.primaryFacultyId === faculty?.userId) ||
    exp.createdBy === user.id ||
    (Boolean(faculty) && exp.createdBy === faculty?.userId) ||
    (exp.additionalFacultyIds && (
      exp.additionalFacultyIds.includes(user.id) ||
      (Boolean(faculty) && exp.additionalFacultyIds.includes(faculty!.facultyId)) ||
      (Boolean(faculty) && exp.additionalFacultyIds.includes(faculty!.userId))
    ))
  );
}

apiRouter.get('/faculty/dashboard', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Faculty access required' });
  }

  const stats = db.getFacultyDashboardStats(user.id);
  res.json(stats);
});

apiRouter.get('/faculty/experiences', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Faculty access required' });
  }

  const faculty = db.getFacultyProfileByUserId(user.id);
    let exps = db.getExperiences().filter(
    (e) =>
      user.role === 'ADMIN' ||
      e.primaryFacultyId === user.id ||
      (faculty && e.primaryFacultyId === faculty.facultyId) ||
      e.createdBy === user.id ||
      (e.additionalFacultyIds && e.additionalFacultyIds.includes(user.id)) ||
      (faculty && e.additionalFacultyIds && e.additionalFacultyIds.includes(faculty.facultyId))
  );

  if (req.query.status) {
    exps = exps.filter((e) => e.status === req.query.status);
  }

  res.json(exps);
});

apiRouter.get('/faculty/experiences/:id/roster', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!isFacultyAuthorizedForExperience(user, req.params.id)) {
    return res.status(403).json({ error: 'You are not authorized to view this visit roster' });
  }

  const roster = db.getExperienceRoster(req.params.id);
  if (!roster) return res.status(404).json({ error: 'Experience not found' });
  res.json(roster);
});

apiRouter.post('/faculty/experiences/:id/attendance', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!isFacultyAuthorizedForExperience(user, req.params.id)) {
    return res.status(403).json({ error: 'You are not authorized to mark attendance for this visit' });
  }

  const { records } = req.body; // Array of { studentId, status, notes }
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'Records must be an array' });
  }

  const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
  for (const rec of records) {
    if (!rec.studentId || !validStatuses.includes(rec.status)) {
      return res.status(400).json({
        error: `Invalid record status "${rec.status}" for student ${rec.studentId}. Status must be one of: ${validStatuses.join(', ')}`,
      });
    }
  }

  try {
    const result = db.markAttendance(req.params.id, records, user.id);
    res.json({ success: true, count: result.updated, updated: result.updated, records: result.records });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/faculty/experiences/:id/attendance-faculty', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!isFacultyAuthorizedForExperience(user, req.params.id)) {
    return res.status(403).json({ error: 'You are not authorized to mark attendance for this visit' });
  }

  const { records } = req.body; // Array of { facultyId, status, notes }
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'Records must be an array' });
  }

  const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
  for (const rec of records) {
    if (!rec.facultyId || !validStatuses.includes(rec.status)) {
      return res.status(400).json({
        error: `Invalid record status "${rec.status}" for faculty ${rec.facultyId}. Status must be one of: ${validStatuses.join(', ')}`,
      });
    }
  }

  try {
    const result = db.markFacultyAttendance(req.params.id, records, user.id);
    db.addAuditLog({
      action: 'ATTENDANCE_MARKED',
      performedBy: user.id,
      details: `Marked faculty attendance for ${result.updated} faculty in visit ${req.params.id}`,
    });
    res.json({ success: true, count: result.updated, updated: result.updated, records: result.records });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});


apiRouter.get('/faculty/experiences/:id/announcements', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!isFacultyAuthorizedForExperience(user, req.params.id)) {
    return res.status(403).json({ error: 'You are not authorized to view announcements for this visit' });
  }

  const anns = db.getAnnouncementsByExperience(req.params.id);
  res.json(anns);
});

apiRouter.get('/faculty/leaves', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const leaves = db.getLeaveRequests({ facultyUserId: user.role === 'ADMIN' ? undefined : user.id });
  res.json(leaves);
});

apiRouter.post('/faculty/leaves/:id/review', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { status, reviewNotes } = req.body;
  if (status !== 'APPROVED' && status !== 'REJECTED') {
    return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
  }

  try {
    const updated = db.reviewLeaveRequest(req.params.id, status, reviewNotes || '', user.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/faculty/announcements', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { experienceId, title, message, audience } = req.body;
  if (!experienceId || !title || !message) {
    return res.status(400).json({ error: 'experienceId, title, and message are required' });
  }

  if (!isFacultyAuthorizedForExperience(user, experienceId)) {
    return res.status(403).json({ error: 'You are not authorized to broadcast announcements for this visit' });
  }

  try {
    const ann = await db.createAnnouncement(experienceId, title, message, user.id, audience || 'ALL');
    res.status(201).json(ann);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/faculty/student-directory', async (req: Request, res: Response) => {
  const { user, student, faculty } = await getAuthUser(req);
  const scope = getAnalyticsUserScope(user, student, faculty);

  if (!scope.isAuthorized) {
    return res.status(scope.statusCode || 403).json({ error: scope.errorMessage || 'Access denied.' });
  }

  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access restricted to authorized Faculty and Administrators.' });
  }

  const allStudents = db.getAllStudents();
  const allVisits = db.getExperiences();
  const allRegs = db.getAllRegistrations();
  const allAtt = db.getAllAttendance();
  const allCerts = db.getAllCertificates();
  const allPasses = db.getAllBoardingPasses();

  // Determine authorized students based on faculty scope
  let authorizedStudents = allStudents;
  if (scope.scopeType === 'DEPARTMENT' && scope.departmentScope) {
    const deptScope = scope.departmentScope;
    const authVisitIds = scope.authorizedVisitIds || [];
    authorizedStudents = allStudents.filter((s) => {
      if (s.department === deptScope) return true;
      if (authVisitIds.length > 0 && allRegs.some((r) => r.studentId === s.studentId && authVisitIds.includes(r.experienceId))) {
        return true;
      }
      return false;
    });
  } else if (scope.scopeType === 'FACULTY_ASSIGNED') {
    const authVisitIds = scope.authorizedVisitIds || [];
    const authStudentIdSet = new Set(
      allRegs.filter((r) => authVisitIds.includes(r.experienceId)).map((r) => r.studentId)
    );
    // Also include waitlisted students in these visits
    db.getAllWaitlist()
      .filter((w) => authVisitIds.includes(w.experienceId))
      .forEach((w) => authStudentIdSet.add(w.studentId));

    authorizedStudents = allStudents.filter((s) => authStudentIdSet.has(s.studentId));
  }

  // Aggregate enriched student records
  const enrichedStudents = authorizedStudents.map((s) => {
    // Registrations in authorized visits (or all if institution/admin)
    const studentRegs = allRegs.filter((r) => {
      if (r.studentId !== s.studentId) return false;
      if (scope.authorizedVisitIds === null) return true;
      return scope.authorizedVisitIds.includes(r.experienceId);
    });

    const studentVisitInfos = studentRegs.map((r) => {
      const visit = allVisits.find((v) => v.id === r.experienceId);
      const att = allAtt.find((a) => a.experienceId === r.experienceId && a.studentId === s.studentId);
      const bp = allPasses.find((p) => p.experienceId === r.experienceId && p.studentId === s.studentId);
      const cert = allCerts.find((c) => c.experienceId === r.experienceId && c.studentId === s.studentId);

      return {
        experienceId: r.experienceId,
        title: visit?.title || 'Industrial Visit',
        organization: visit?.organization || 'Industrial Facility',
        location: visit?.location || 'Industrial Area',
        date: visit?.date || '',
        status: (visit?.status || 'PUBLISHED') as any,
        registrationStatus: r.status,
        registeredAt: r.registeredAt,
        consentStatus: r.consentStatus || (r.status === 'REGISTERED' || r.status === 'COMPLETED' ? 'VERIFIED' : 'PENDING_VERIFICATION'),
        consentDocumentUrl: r.consentDocumentUrl,
        consentValidationResult: r.consentValidationResult,
        consentRejectionReason: r.consentRejectionReason,
        consentUploadedAt: r.consentUploadedAt,
        consentVerifiedAt: r.consentVerifiedAt,
        attendanceStatus: (att ? att.status : 'NOT_MARKED') as any,
        attendanceNotes: att?.notes,
        boardingPassNumber: bp?.passNumber,
        certificateId: cert?.certificateId,
        certificateStatus: cert ? (cert.status === 'ISSUED' ? 'ISSUED' : 'REVOKED') : 'NONE',
        certificateIssuedAt: cert?.issuedAt,
      };
    });

    // Attendance summary: only consider visits where attendance has actually been marked/recorded
    const presentCount = studentVisitInfos.filter((v) => v.attendanceStatus === 'PRESENT').length;
    const lateCount = studentVisitInfos.filter((v) => v.attendanceStatus === 'LATE').length;
    const excusedCount = studentVisitInfos.filter((v) => v.attendanceStatus === 'EXCUSED').length;
    const absentCount = studentVisitInfos.filter((v) => v.attendanceStatus === 'ABSENT').length;
    const attendedCount = presentCount + lateCount;
    const totalMarked = presentCount + lateCount + excusedCount + absentCount;
    const attendanceRate = totalMarked > 0 ? Math.round((attendedCount / totalMarked) * 100) : 0;

    // Certificate summary
    const studentCerts = allCerts.filter((c) => {
      if (c.studentId !== s.studentId) return false;
      if (scope.authorizedVisitIds === null) return true;
      return scope.authorizedVisitIds.includes(c.experienceId);
    });

    const mappedCerts = studentCerts.map((c) => {
      const v = allVisits.find((exp) => exp.id === c.experienceId);
      return {
        id: c.id,
        certificateId: c.certificateId,
        experienceId: c.experienceId,
        experienceTitle: v?.title || 'Industrial Exposure',
        issuedAt: c.issuedAt,
      };
    });

    return {
      ...s,
      registeredVisits: studentVisitInfos,
      registeredVisitsCount: studentVisitInfos.length,
      completedVisitsCount: studentVisitInfos.filter((v) => v.status === 'COMPLETED').length,
      attendanceSummary: {
        totalAssigned: totalMarked,
        presentCount,
        lateCount,
        excusedCount,
        absentCount,
        attendedCount,
        attendanceRate,
      },
      certificateSummary: {
        totalIssued: mappedCerts.length,
        certificates: mappedCerts,
      },
    };
  });

  const availableBranches = Array.from(
    new Set(enrichedStudents.map((s) => s.branch).filter(Boolean))
  ).sort();

  res.json({
    scopeSummary: {
      scopeType: scope.scopeType,
      isHod: scope.isHod,
      departmentScope: scope.departmentScope,
      authorizedVisitCount: scope.authorizedVisitIds === null ? 'UNRESTRICTED' : scope.authorizedVisitIds.length,
      totalAuthorizedStudents: enrichedStudents.length,
    },
    students: enrichedStudents,
    availableBranches,
  });
});


// --- ANALYTICS AUTHORIZATION ROUTES ---

apiRouter.get('/analytics/scope', async (req: Request, res: Response) => {
  const { user, student, faculty } = await getAuthUser(req);
  const scope = getAnalyticsUserScope(user, student, faculty);

  if (!scope.isAuthorized) {
    return res.status(scope.statusCode || 403).json({
      error: scope.errorMessage || 'Access denied. Analytics restricted to Faculty and Admin.',
      scopeType: 'FORBIDDEN',
    });
  }

  res.json({
    scopeType: scope.scopeType,
    isHod: scope.isHod,
    departmentScope: scope.departmentScope,
    authorizedVisitCount: scope.authorizedVisitIds ? scope.authorizedVisitIds.length : 'UNRESTRICTED',
    userRole: user?.role,
  });
});

apiRouter.get('/analytics/departmental-reports', async (req: Request, res: Response) => {
  const { user, student, faculty } = await getAuthUser(req);
  const scope = getAnalyticsUserScope(user, student, faculty);

  if (!scope.isAuthorized) {
    return res.status(scope.statusCode || 403).json({
      error: scope.errorMessage || 'Access denied. Analytics restricted to Faculty and Admin.',
    });
  }

  const rawFilters: RawAnalyticsFilters = {
    department: req.query.department as string,
    branch: req.query.branch as string,
    visitId: req.query.visitId as string,
    academicYear: req.query.academicYear as string,
    status: req.query.status as string,
    year: req.query.year as string,
    semester: req.query.semester as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    dateRange: req.query.dateRange as string,
    visitType: req.query.visitType as string,
    location: req.query.location as string,
  };

  const effectiveFilters = enforceAnalyticsFilterScope(scope, rawFilters);

  if (effectiveFilters.isAccessDenied) {
    return res.status(403).json({
      error: effectiveFilters.denialReason || 'Access denied for requested filters.',
    });
  }

  const analytics = calculateAnalytics(scope, effectiveFilters);
  res.json(analytics);
});

apiRouter.get('/analytics/institutional-overview', async (req: Request, res: Response) => {
  const { user, student, faculty } = await getAuthUser(req);
  const scope = getAnalyticsUserScope(user, student, faculty);

  if (!scope.isAuthorized || scope.scopeType !== 'INSTITUTION') {
    return res.status(403).json({
      error: 'Access denied. Institutional analytics are restricted to Admin users.',
    });
  }

  const rawFilters: RawAnalyticsFilters = {
    department: req.query.department as string,
    branch: req.query.branch as string,
    visitId: req.query.visitId as string,
    academicYear: req.query.academicYear as string,
    status: req.query.status as string,
    year: req.query.year as string,
    semester: req.query.semester as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    dateRange: req.query.dateRange as string,
    visitType: req.query.visitType as string,
    location: req.query.location as string,
  };

  const effectiveFilters = enforceAnalyticsFilterScope(scope, rawFilters);
  const analytics = calculateAnalytics(scope, effectiveFilters);
  res.json(analytics);
});

// PDF Report Export Route
apiRouter.all('/analytics/export-pdf', async (req: Request, res: Response) => {
  const { user, student, faculty } = await getAuthUser(req);
  const scope = getAnalyticsUserScope(user, student, faculty);

  if (!scope.isAuthorized) {
    return res.status(403).json({
      error: 'Access denied. You are not authorized to export analytics reports.',
    });
  }

  const queryOrBody = req.method === 'POST' ? req.body || {} : req.query || {};

  const rawFilters: RawAnalyticsFilters = {
    department: queryOrBody.department as string,
    branch: queryOrBody.branch as string,
    visitId: queryOrBody.visitId as string,
    academicYear: queryOrBody.academicYear as string,
    status: queryOrBody.status as string,
    year: queryOrBody.year as string,
    semester: queryOrBody.semester as string,
    startDate: queryOrBody.startDate as string,
    endDate: queryOrBody.endDate as string,
    dateRange: queryOrBody.dateRange as string,
    visitType: queryOrBody.visitType as string,
    location: queryOrBody.location as string,
  };

  const effectiveFilters = enforceAnalyticsFilterScope(scope, rawFilters);

  if (effectiveFilters.isAccessDenied) {
    return res.status(403).json({
      error: effectiveFilters.denialReason || 'Access denied for requested filters.',
    });
  }

  const analytics = calculateAnalytics(scope, effectiveFilters);

  const userInfo = {
    name: user?.name || 'Authorized User',
    email: user?.email || '',
    role: user?.role || 'FACULTY',
    identifier: faculty?.facultyId || student?.studentId || undefined,
  };

  try {
    const pdfBuffer = await generateOfficialPdfReport(analytics, effectiveFilters, userInfo);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="VIT_Industrial_Exposure_Report.pdf"'
    );
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate official PDF report.' });
  }
});

// Excel Workbook Export Route
apiRouter.all('/analytics/export-excel', async (req: Request, res: Response) => {
  const { user, student, faculty } = await getAuthUser(req);
  const scope = getAnalyticsUserScope(user, student, faculty);

  if (!scope.isAuthorized) {
    return res.status(403).json({
      error: 'Access denied. You are not authorized to export analytics workbooks.',
    });
  }

  const queryOrBody = req.method === 'POST' ? req.body || {} : req.query || {};

  const rawFilters: RawAnalyticsFilters = {
    department: queryOrBody.department as string,
    branch: queryOrBody.branch as string,
    visitId: queryOrBody.visitId as string,
    academicYear: queryOrBody.academicYear as string,
    status: queryOrBody.status as string,
    year: queryOrBody.year as string,
    semester: queryOrBody.semester as string,
    startDate: queryOrBody.startDate as string,
    endDate: queryOrBody.endDate as string,
    dateRange: queryOrBody.dateRange as string,
    visitType: queryOrBody.visitType as string,
    location: queryOrBody.location as string,
  };

  const effectiveFilters = enforceAnalyticsFilterScope(scope, rawFilters);

  if (effectiveFilters.isAccessDenied) {
    return res.status(403).json({
      error: effectiveFilters.denialReason || 'Access denied for requested filters.',
    });
  }

  const analytics = calculateAnalytics(scope, effectiveFilters);

  const userInfo = {
    name: user?.name || 'Authorized User',
    email: user?.email || '',
    role: user?.role || 'FACULTY',
    identifier: faculty?.facultyId || student?.studentId || undefined,
  };

  try {
    const excelBuffer = generateOfficialExcelReport(analytics, scope, effectiveFilters, userInfo);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="VIT_Industrial_Exposure_Analytics.xlsx"'
    );
    res.send(excelBuffer);
  } catch (err: any) {
    console.error('Excel Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate official Excel workbook.' });
  }
});


// --- CERTIFICATES ROUTES ---
apiRouter.get("/student/certificates", async (req: Request, res: Response) => {
  const { student } = await getAuthUser(req);
  if (!student) return res.status(401).json({ error: "Student access required" });
  const certs = db.getCertificatesByStudent(student.studentId);
  // Expand with experience details
  const expandedCerts = certs.map(c => ({
    ...c,
    experience: db.getExperiences().find(e => e.id === c.experienceId)
  }));
  res.json(expandedCerts);
});

apiRouter.get("/certificates/:certificateId", (req: Request, res: Response) => {
  const cert = db.getCertificateById(req.params.certificateId);
  if (!cert) return res.status(404).json({ error: "Certificate not found" });
  const experience = db.getExperiences().find(e => e.id === cert.experienceId);
  const student = db.getStudentProfileByStudentId(cert.studentId);
  res.json({ ...cert, experience, student });
});

apiRouter.get("/faculty/experiences/:id/certificates", async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== "FACULTY" && user?.role !== "ADMIN") return res.status(403).json({ error: "Unauthorized" });
  if (!isFacultyAuthorizedForExperience(user, req.params.id)) return res.status(403).json({ error: "Unauthorized" });
  const certs = db.getCertificatesByExperience(req.params.id);
  res.json(certs);
});

apiRouter.post("/faculty/experiences/:id/certificates/issue", async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== "FACULTY" && user?.role !== "ADMIN") return res.status(403).json({ error: "Unauthorized" });
  if (!isFacultyAuthorizedForExperience(user, req.params.id)) return res.status(403).json({ error: "Unauthorized" });
  const issued = db.issueCertificatesForExperience(req.params.id, user.id);
  res.json({ success: true, count: issued.length, certificates: issued });
});

// --- FEEDBACK ROUTES ---
apiRouter.post('/experiences/:id/feedback', async (req: Request, res: Response) => {
  const { student, user } = await getAuthUser(req);
  if (!student) return res.status(401).json({ error: 'Student authentication required to submit feedback' });

  const experienceId = req.params.id;
  const exp = db.getExperienceById(experienceId);
  if (!exp) {
    return res.status(404).json({ error: 'Industrial visit not found' });
  }

  // 1. Visit must be completed
  if (exp.status !== 'COMPLETED') {
    return res.status(400).json({ error: 'Feedback can only be submitted for completed industrial visits.' });
  }

  // 2. Student must be registered
  const registrations = db.getRegistrationsByExperience(experienceId);
  const isRegistered = registrations.some((r) => r.studentId === student.studentId && (r.status === 'REGISTERED' || r.status === 'COMPLETED'));
  if (!isRegistered) {
    return res.status(403).json({ error: 'You are not registered for this industrial visit.' });
  }

  // 3. Student must have attended (PRESENT or LATE)
  const attendanceList = db.getAttendanceByExperience(experienceId);
  const studentAtt = attendanceList.find((a) => a.studentId === student.studentId);
  if (!studentAtt || (studentAtt.status !== 'PRESENT' && studentAtt.status !== 'LATE')) {
    return res.status(403).json({ error: 'Only students who attended and have a confirmed attendance record can submit feedback.' });
  }

  // 4. One feedback per student per visit
  const existingFeedbackList = db.getFeedbackByExperience(experienceId);
  const alreadySubmitted = existingFeedbackList.some((f) => f.studentId === student.studentId);
  if (alreadySubmitted) {
    return res.status(409).json({ error: 'Feedback has already been submitted for this visit. Only one submission is permitted per student.' });
  }

  const {
    rating,
    overallRating,
    technicalExposureRating,
    facultyCoordinationRating,
    organizationRating,
    learningValueRating,
    recommend,
    positiveComment,
    improvementComment,
    comments,
  } = req.body;

  const resolvedRating = overallRating !== undefined ? Number(overallRating) : Number(rating);
  if (!resolvedRating || resolvedRating < 1 || resolvedRating > 5) {
    return res.status(400).json({ error: 'A valid overall rating (1-5 stars) is required.' });
  }

  const feedback = db.submitExperienceFeedback({
    experienceId,
    studentId: student.studentId,
    rating: resolvedRating,
    overallRating: resolvedRating,
    technicalExposureRating: technicalExposureRating ? Number(technicalExposureRating) : undefined,
    facultyCoordinationRating: facultyCoordinationRating ? Number(facultyCoordinationRating) : undefined,
    organizationRating: organizationRating ? Number(organizationRating) : undefined,
    learningValueRating: learningValueRating ? Number(learningValueRating) : undefined,
    recommend,
    positiveComment,
    improvementComment,
    comments: comments || positiveComment || '',
  });

  res.status(201).json(feedback);
});

apiRouter.get('/experiences/:id/feedback', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const list = db.getFeedbackByExperience(req.params.id);
  const stats = db.getFeedbackStatsForExperience(req.params.id);
  res.json({ feedback: list, stats });
});

apiRouter.get('/student/feedback', async (req: Request, res: Response) => {
  const { student } = await getAuthUser(req);
  if (!student) return res.status(401).json({ error: 'Student access required' });

  const list = db.getFeedbackByStudent(student.studentId);
  res.json(list);
});

// --- POST-TRIP REPORT & PHOTO SUBMISSION ROUTES ---

// Check eligibility for a visit report
apiRouter.get('/experiences/:id/report/eligibility', async (req: Request, res: Response) => {
  const { student } = await getAuthUser(req);
  if (!student) {
    return res.status(401).json({ error: 'Student authentication required' });
  }

  const eligibility = db.checkTripReportEligibility(req.params.id, student.studentId);
  res.json(eligibility);
});

// Get student's report for an experience
apiRouter.get('/experiences/:id/report', async (req: Request, res: Response) => {
  const { user, student, faculty } = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const experienceId = req.params.id;

  if (user.role === 'STUDENT') {
    if (!student) return res.status(401).json({ error: 'Student profile not found' });
    const report = db.getStudentReportForExperience(experienceId, student.studentId);
    return res.json(report);
  }

  // If Faculty or Admin
  if (user.role === 'FACULTY' || user.role === 'ADMIN') {
    const studentIdQuery = req.query.studentId as string;
    if (studentIdQuery) {
      if (user.role === 'FACULTY' && !isFacultyAuthorizedForExperience(user, experienceId)) {
        return res.status(403).json({ error: 'Unauthorized to view reports for this visit' });
      }
      const report = db.getStudentReportForExperience(experienceId, studentIdQuery);
      return res.json(report);
    }

    // Return all reports for this experience
    if (user.role === 'FACULTY' && !isFacultyAuthorizedForExperience(user, experienceId)) {
      return res.status(403).json({ error: 'Unauthorized to view reports for this visit' });
    }
    const reports = db.getTripReports({ experienceId });
    return res.json(reports);
  }

  res.status(403).json({ error: 'Unauthorized' });
});

// Submit a student's post-trip report
apiRouter.post('/experiences/:id/report', async (req: Request, res: Response) => {
  const { student, user } = await getAuthUser(req);
  if (!student || !user) {
    return res.status(401).json({ error: 'Student authentication required to submit a post-trip report' });
  }

  const experienceId = req.params.id;
  const exp = db.getExperienceById(experienceId);
  if (!exp) {
    return res.status(404).json({ error: 'Industrial visit not found' });
  }

  // 1. Visit must be completed
  if (exp.status !== 'COMPLETED') {
    return res.status(400).json({ error: 'Post-trip reports can only be submitted for completed industrial visits.' });
  }

  // 2. Student must be registered
  const registrations = db.getRegistrationsByExperience(experienceId);
  const isRegistered = registrations.some(
    (r) => r.studentId === student.studentId && (r.status === 'REGISTERED' || r.status === 'COMPLETED')
  );
  if (!isRegistered) {
    return res.status(403).json({ error: 'You do not have an approved registration for this industrial visit.' });
  }

  // 3. Student must have attended (PRESENT or LATE)
  const attendanceList = db.getAttendanceByExperience(experienceId);
  const studentAtt = attendanceList.find((a) => a.studentId === student.studentId);
  if (!studentAtt) {
    return res.status(403).json({ error: 'Your attendance has not been finalized yet. Report will become available once attendance is finalized.' });
  }
  if (studentAtt.status === 'ABSENT') {
    return res.status(403).json({ error: 'You were marked absent for this industrial visit. Only students marked Present are eligible to submit a post-trip report.' });
  }
  if (studentAtt.status !== 'PRESENT' && studentAtt.status !== 'LATE') {
    return res.status(403).json({ error: 'Only students marked Present are eligible to submit a post-trip report.' });
  }

  const { whatILearned, activities, skillsGained, experience, suggestions, photos } = req.body;

  // Validation
  if (!whatILearned || whatILearned.trim().length < 10) {
    return res.status(400).json({ error: 'Please enter what you learned (minimum 10 characters).' });
  }
  if (!activities || activities.trim().length < 10) {
    return res.status(400).json({ error: 'Please enter key activities and observations (minimum 10 characters).' });
  }
  if (!skillsGained || skillsGained.trim().length < 10) {
    return res.status(400).json({ error: 'Please enter skills and knowledge gained (minimum 10 characters).' });
  }
  if (!experience || experience.trim().length < 10) {
    return res.status(400).json({ error: 'Please enter your overall experience (minimum 10 characters).' });
  }

  // Photo count limit (max 10)
  if (photos && Array.isArray(photos) && photos.length > 10) {
    return res.status(400).json({ error: 'You can upload a maximum of 10 photos per report.' });
  }

  // Validate photo objects
  if (photos && Array.isArray(photos)) {
    for (const [i, p] of photos.entries()) {
      if (!p.fileUrl) {
        return res.status(400).json({ error: `Photo #${i + 1} is missing image data.` });
      }
      if (p.fileSize && p.fileSize > 5 * 1024 * 1024) {
        return res.status(400).json({ error: `Photo "${p.fileName || i + 1}" exceeds the 5MB size limit.` });
      }
    }
  }

  try {
    const report = db.submitTripReport({
      experienceId,
      studentId: student.studentId,
      whatILearned,
      activities,
      skillsGained,
      experience,
      suggestions,
      photos,
    });

    res.status(201).json(report);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit post-trip report' });
  }
});

// Delete a photo from report
apiRouter.delete('/reports/photos/:photoId', async (req: Request, res: Response) => {
  const { student } = await getAuthUser(req);
  if (!student) return res.status(401).json({ error: 'Student authentication required' });

  const success = db.deleteReportPhoto(req.params.photoId, student.studentId);
  if (!success) {
    return res.status(404).json({ error: 'Photo not found or unauthorized' });
  }
  res.json({ success: true });
});

// Faculty Post-Trip Reports Dashboard Metrics & List
apiRouter.get('/faculty/reports', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const isHod = Boolean(user.isHod);
  const departmentScope = user.departmentScope || null;
  const metrics = db.getFacultyReportMetrics(user.id, isHod, departmentScope);
  res.json(metrics);
});

// Faculty get single report detail by report ID
apiRouter.get('/faculty/reports/:reportId', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const report = db.getReportById(req.params.reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (user.role === 'FACULTY' && !isFacultyAuthorizedForExperience(user, report.experienceId)) {
    return res.status(403).json({ error: 'Unauthorized to view this report' });
  }

  res.json(report);
});

// Admin Post-Trip Reports Dashboard Metrics & List
apiRouter.get('/admin/reports', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const metrics = db.getAdminReportMetrics();
  res.json(metrics);
});

// Admin get single report detail by report ID
apiRouter.get('/admin/reports/:reportId', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const report = db.getReportById(req.params.reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.json(report);
});

// --- ADMIN SPECIFIC ROUTES ---
apiRouter.get('/admin/overview', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const stats = db.getAdminOverviewStats();
  res.json(stats);
});

apiRouter.get('/admin/students', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const students = db.getAllStudentsEnriched();
  res.json(students);
});

apiRouter.get('/admin/students/:studentId', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const dossier = db.getStudentFullDossier(req.params.studentId);
  if (!dossier) return res.status(404).json({ error: 'Student not found' });
  res.json(dossier);
});

apiRouter.get('/admin/faculty', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Admin or Faculty access required' });
  }

  const facultyList = db.getAllFaculty();
  res.json(facultyList);
});

apiRouter.post('/admin/faculty', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const created = db.createFaculty(req.body);
    db.addAuditLog({
      action: 'USER_CREATED',
      performedBy: user.id,
      performedByName: user.name,
      userRole: 'ADMIN',
      details: `Created new faculty profile for ${created.profile.name} (${created.profile.facultyId}).`,
      entityId: created.profile.facultyId,
      entityType: 'FACULTY',
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/faculty/:userId/toggle-status', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const updated = db.toggleFacultyStatus(req.params.userId);
  if (!updated) return res.status(404).json({ error: 'Faculty not found' });
  res.json(updated);
});

apiRouter.get('/admin/registrations', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const regs = db.getAllRegistrationsDetailed();
  res.json(regs);
});

apiRouter.post('/admin/registrations/:id/promote', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const result = db.promoteWaitlistStudent(req.params.id, user.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/registrations/:id/cancel', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const ok = db.cancelRegistrationByAdmin(req.params.id, req.body.reason, user.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/admin/leaves', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const leaves = db.getLeaveRequests({});
  res.json(leaves);
});

apiRouter.post('/admin/leaves/:id/override', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { status, reviewNotes } = req.body;
  if (status !== 'APPROVED' && status !== 'REJECTED') {
    return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
  }

  try {
    const reviewed = db.reviewLeaveRequest(req.params.id, status, `[Admin Override] ${reviewNotes || 'Administrative determination'}`, user.id);
    db.addAuditLog({
      action: 'LEAVE_PETITION_OVERRIDE',
      performedBy: user.id,
      performedByName: user.name,
      userRole: 'ADMIN',
      details: `Admin performed override review (${status}) for leave request ID ${req.params.id}.`,
      entityId: req.params.id,
      entityType: 'LEAVE',
    });
    res.json(reviewed);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/admin/attendance', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const overview = db.getAdminAttendanceOverview();
  res.json(overview);
});

apiRouter.get('/admin/documents', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const docs = db.getAllSystemDocuments();
  res.json(docs);
});

apiRouter.get('/admin/announcements', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const anns = db.getAllAnnouncementsAdmin();
  res.json(anns);
});

apiRouter.post('/admin/announcements', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { title, message, experienceId, targetAudience } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  try {
    const ann = db.createSystemAnnouncement({
      title,
      message,
      experienceId,
      targetAudience,
      creatorUserId: user.id,
    });
    res.status(201).json(ann);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/admin/announcements/:id', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const ok = db.deleteAnnouncementAdmin(req.params.id, user.id);
  res.json({ success: ok });
});

apiRouter.get('/admin/users', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const users = db.getAllUsersAdmin();
  res.json(users);
});

apiRouter.post('/admin/users', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const created = db.createUserAdmin(req.body, user.id);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/admin/users/:id', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const updated = db.updateUserAdmin(req.params.id, req.body, user.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/users/:id/toggle-status', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const updated = db.toggleUserStatusAdmin(req.params.id, user.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/experiences/:id/approve', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const updated = db.approveExperience(req.params.id, user.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/experiences/:id/reject', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  try {
    const updated = db.rejectExperience(req.params.id, reason, user.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/experiences/:id/duplicate', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const duplicated = db.duplicateExperience(req.params.id, user.id);
    res.status(201).json(duplicated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/experiences/:id/assign-faculty', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const updated = db.assignFacultyToExperience(req.params.id, req.body.facultyId, user.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/admin/settings', async (req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json(settings);
});

apiRouter.post('/admin/settings', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const updated = db.updateSettings(req.body, user.id);
  res.json(updated);
});

apiRouter.get('/admin/templates', async (req: Request, res: Response) => {
  res.json(db.getTemplates());
});

apiRouter.post('/admin/templates', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const tpl = db.createTemplate(req.body, user.id);
  res.status(201).json(tpl);
});

apiRouter.put('/admin/templates/:id', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN' && user?.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const tpl = db.updateTemplate(req.params.id, req.body, user.id);
  if (!tpl) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json(tpl);
});

apiRouter.post('/admin/templates/:id/record-usage', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (!user) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  db.recordTemplateUsage(req.params.id);
  res.json({ success: true });
});

apiRouter.delete('/admin/templates/:id', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const ok = db.deleteTemplate(req.params.id);
  res.json({ success: ok });
});

apiRouter.get('/admin/audit-logs', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    db.addSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      actorEmail: user?.email || 'unknown',
      actorId: user?.id,
      actorName: user?.name,
      actorRole: user?.role || 'UNKNOWN',
      resource: '/api/admin/audit-logs',
      actionAttempted: 'GET /api/admin/audit-logs',
      severity: 'HIGH',
      status: 'BLOCKED',
      reason: 'Role is unauthorized to query administrative audit registries.',
      description: 'Access Denied: Non-administrative role attempted access to Admin Audit Logs.',
    });
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { limit, offset, search, module, actorRole, action, status, startDate, endDate } = req.query;

  const result = db.getAuditLogs({
    limit: limit ? parseInt(limit as string, 10) : 100,
    offset: offset ? parseInt(offset as string, 10) : 0,
    search: search as string,
    module: module as string,
    actorRole: actorRole as string,
    action: action as string,
    status: status as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.json(result);
});

apiRouter.get('/admin/security-events', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    db.addSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      actorEmail: user?.email || 'unknown',
      actorId: user?.id,
      actorName: user?.name,
      actorRole: user?.role || 'UNKNOWN',
      resource: '/api/admin/security-events',
      actionAttempted: 'GET /api/admin/security-events',
      severity: 'HIGH',
      status: 'BLOCKED',
      reason: 'Role is unauthorized to query administrative security registries.',
      description: 'Access Denied: Non-administrative role attempted access to Admin Security Events.',
    });
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { limit, offset, search, eventType, severity, status, actorRole, startDate, endDate } = req.query;

  const result = db.getSecurityEvents({
    limit: limit ? parseInt(limit as string, 10) : 100,
    offset: offset ? parseInt(offset as string, 10) : 0,
    search: search as string,
    eventType: eventType as string,
    severity: severity as string,
    status: status as string,
    actorRole: actorRole as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.json(result);
});

apiRouter.get('/admin/security-stats', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const stats = db.getSecurityStats();
  res.json(stats);
});

// --- AI ASSISTANT CHAT ROUTE ---
apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { prompt, history, currentExperienceId } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const answer = await handleAssistantChat({
      prompt,
      role: user.role,
      userId: user.id,
      history,
      currentExperienceId,
    });
    res.json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: 'VIT Assistant is temporarily unavailable. Please try again shortly.' });
  }
});

apiRouter.get('/ai/recommendations', async (req: Request, res: Response) => {
  const { student, user } = await getAuthUser(req);
  const studentId = student?.studentId || (req.query.studentId as string) || '21BCE10482';

  try {
    const recs = await handleStudentRecommendations(studentId);
    res.json(recs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

apiRouter.post('/ai/faculty-helper', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Faculty or Admin access required' });
  }

  try {
    const result = await handleFacultyHelper(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Faculty AI helper failed' });
  }
});

apiRouter.get('/ai/admin-insights', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const insights = await handleAdminInsights();
    res.json(insights);
  } catch (err: any) {
    res.status(500).json({ error: 'Admin insights generation failed' });
  }
});

// AI Visit Content Generation Endpoint
const handleVisitContentGen = async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (!user || (user.role !== 'FACULTY' && user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Only Faculty and Admin are authorized to generate visit content.' });
  }

  const { organization } = req.body || {};
  if (!organization || typeof organization !== 'string' || !organization.trim()) {
    return res.status(400).json({ error: 'Host Organization / Company is required to generate visit content.' });
  }

  try {
    const content = await handleGenerateVisitContent(req.body);
    res.json(content);
  } catch (err: any) {
    console.error('[API] Error generating visit content:', err);
    res.status(500).json({ error: 'Unable to generate visit content right now.' });
  }
};

apiRouter.post('/faculty/generate-visit-content', handleVisitContentGen);
apiRouter.post('/visits/generate-content', handleVisitContentGen);
apiRouter.post('/ai/generate-visit-content', handleVisitContentGen);

// =========================================================================
// PHASE 2: SECURITY NOTIFICATION RECIPIENTS (Admin Controlled)
// =========================================================================

apiRouter.get('/admin/security-recipients', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin authorization required to view security recipient configuration' });
  }

  const recipients = db.getSecurityRecipients();
  res.json(recipients);
});

apiRouter.post('/admin/security-recipients', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin authorization required to manage security posts' });
  }

  const { name, email, phone, department, gateLocation, isActive, notes } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required for security recipient' });
  }

  try {
    const created = db.addSecurityRecipient({
      name,
      email,
      phone,
      department,
      gateLocation,
      isActive: isActive !== undefined ? isActive : true,
      notes,
    });

    db.addAuditLog({
      action: 'SETTINGS_UPDATE',
      performedBy: user.id,
      performedByName: user.name,
      userRole: 'ADMIN',
      details: `Added new campus security recipient "${name}" (${email}) for gate "${gateLocation || 'Main Gate'}".`,
      entityId: created.id,
      entityType: 'SECURITY_RECIPIENT',
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/admin/security-recipients/:id', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin authorization required to manage security posts' });
  }

  try {
    const updated = db.updateSecurityRecipient(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Security recipient not found' });
    }

    db.addAuditLog({
      action: 'SETTINGS_UPDATE',
      performedBy: user.id,
      performedByName: user.name,
      userRole: 'ADMIN',
      details: `Updated security recipient "${updated.name}" (${updated.email}).`,
      entityId: updated.id,
      entityType: 'SECURITY_RECIPIENT',
    });

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/admin/security-recipients/:id', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin authorization required to manage security posts' });
  }

  const ok = db.deleteSecurityRecipient(req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'Security recipient not found' });
  }

  db.addAuditLog({
    action: 'SETTINGS_UPDATE',
    performedBy: user.id,
    performedByName: user.name,
    userRole: 'ADMIN',
    details: `Deleted security recipient ${req.params.id}.`,
    entityId: req.params.id,
    entityType: 'SECURITY_RECIPIENT',
  });

  res.json({ success: true, id: req.params.id });
});

// =========================================================================
// PHASE 2: AUTOMATIC 3-DAY PRE-TRIP REMINDER & SCHEDULER CONTROLLER
// =========================================================================

/**
 * Validates whether incoming request is authorized to trigger the automated reminder scheduler.
 * Supports:
 * 1. CRON_SECRET / SCHEDULER_SECRET in Authorization Bearer or custom headers.
 * 2. Google Cloud Scheduler native headers (X-CloudScheduler, X-AppEngine-Cron) and OIDC token.
 * 3. Authenticated Admin / Faculty user sessions.
 */
async function validateSchedulerAuth(req: Request): Promise<{
  authorized: boolean;
  triggerSource: string;
  user?: any;
  error?: string;
  statusCode?: number;
}> {
  const cronSecret = process.env.CRON_SECRET || process.env.SCHEDULER_SECRET;
  const authHeader = req.headers.authorization;
  const customSecretHeader = (req.headers['x-scheduler-secret'] || req.headers['x-cron-secret']) as string | undefined;
  const isGcpSchedulerHeader = req.headers['x-cloudscheduler'] === 'true' || req.headers['x-appengine-cron'] === 'true';
  const isGcpUserAgent = (req.headers['user-agent'] || '').includes('Google-Cloud-Scheduler');

  // 1. Verify CRON_SECRET if configured
  if (cronSecret) {
    if (customSecretHeader && customSecretHeader === cronSecret) {
      return { authorized: true, triggerSource: 'CLOUD_SCHEDULER_SECRET' };
    }
    if (authHeader && authHeader === `Bearer ${cronSecret}`) {
      return { authorized: true, triggerSource: 'CLOUD_SCHEDULER_BEARER' };
    }
  }

  // 2. Verify Google Cloud Scheduler native invocation / GCP OIDC
  if (isGcpSchedulerHeader || isGcpUserAgent) {
    return { authorized: true, triggerSource: 'GOOGLE_CLOUD_SCHEDULER' };
  }

  // 3. Verify Admin / Faculty logged-in session
  const auth = await getAuthUser(req);
  if (auth.user && (auth.user.role === 'ADMIN' || auth.user.role === 'FACULTY')) {
    return {
      authorized: true,
      triggerSource: auth.user.role === 'ADMIN' ? 'ADMIN_CONSOLE' : 'FACULTY_PORTAL',
      user: auth.user,
    };
  }

  // If CRON_SECRET is not configured in environment, allow local/internal server requests
  if (!cronSecret && (req.ip === '127.0.0.1' || req.ip === '::1' || req.hostname === 'localhost')) {
    return { authorized: true, triggerSource: 'LOCAL_INVOCATION' };
  }

  return {
    authorized: false,
    triggerSource: 'UNAUTHORIZED',
    statusCode: 401,
    error: 'Unauthorized: Valid Cloud Scheduler credentials or Admin/Faculty session required.',
  };
}

/**
 * Primary Google Cloud Scheduler trigger endpoint.
 * Called daily by Cloud Scheduler to wake the container and dispatch due 3-day reminders.
 */
apiRouter.all(['/scheduler/trigger-reminders', '/scheduler/pre-trip-reminders', '/cron/trigger-reminders'], async (req: Request, res: Response) => {
  const authCheck = await validateSchedulerAuth(req);
  if (!authCheck.authorized) {
    return res.status(authCheck.statusCode || 401).json({
      success: false,
      error: authCheck.error || 'Unauthorized scheduler request',
      status: 'UNAUTHORIZED',
    });
  }

  const { forceTripId } = req.body || req.query || {};

  try {
    const result = await runPreTrip3DayScheduler(db, {
      forceTripId: typeof forceTripId === 'string' ? forceTripId : undefined,
      triggerSource: authCheck.triggerSource,
    });

    if (authCheck.user) {
      db.addAuditLog({
        action: 'VISIT_STATUS_UPDATED',
        performedBy: authCheck.user.id,
        performedByName: authCheck.user.name,
        userRole: authCheck.user.role,
        details: `Triggered automated 3-day reminder check via scheduler API (${result.tripsDueFor3Day} trips due, ${result.results.length} processed).`,
        entityType: 'NOTIFICATION',
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      ...result,
    });
  } catch (err: any) {
    console.error('[API /scheduler/trigger-reminders] Fatal scheduler error:', err);
    res.status(500).json({
      success: false,
      statusCode: 500,
      error: `Scheduler execution failed: ${err.message}`,
    });
  }
});

apiRouter.get('/reminders/status', async (req: Request, res: Response) => {
  const status = getSchedulerStatus();
  const allExperiences = db.getAllExperiences();
  
  // Calculate trips coming up in exactly 3 days and upcoming trips overview
  const tripsDueIn3Days = allExperiences.filter((e) => {
    if (e.status === 'CANCELLED' || e.status === 'DRAFT' || e.status === 'COMPLETED') return false;
    return calculateDaysUntilTrip(e.date) === 3;
  });

  const upcomingActiveTrips = allExperiences
    .filter((e) => e.status === 'PUBLISHED')
    .map((e) => ({
      id: e.id,
      title: e.title,
      organization: e.organization,
      date: e.date,
      daysUntilTrip: calculateDaysUntilTrip(e.date),
      isDueFor3DayReminder: calculateDaysUntilTrip(e.date) === 3,
      confirmedCount: (db.getRegistrationsForExperience(e.id) || []).filter(
        (r) => r.status === 'REGISTERED' || r.status === 'COMPLETED'
      ).length,
    }))
    .sort((a, b) => a.daysUntilTrip - b.daysUntilTrip);

  res.json({
    ...status,
    tripsDueIn3DaysCount: tripsDueIn3Days.length,
    tripsDueIn3DaysList: tripsDueIn3Days.map((e) => ({
      id: e.id,
      title: e.title,
      organization: e.organization,
      date: e.date,
      daysUntilTrip: calculateDaysUntilTrip(e.date),
    })),
    upcomingActiveTrips,
  });
});

apiRouter.post('/reminders/run-now', async (req: Request, res: Response) => {
  const authCheck = await validateSchedulerAuth(req);
  if (!authCheck.authorized) {
    return res.status(authCheck.statusCode || 403).json({
      error: authCheck.error || 'Authorization required to trigger reminders',
    });
  }

  const { forceTripId } = req.body || {};

  try {
    const result = await runPreTrip3DayScheduler(db, {
      forceTripId,
      triggerSource: authCheck.triggerSource,
    });

    if (authCheck.user) {
      db.addAuditLog({
        action: 'VISIT_STATUS_UPDATED',
        performedBy: authCheck.user.id,
        performedByName: authCheck.user.name,
        userRole: authCheck.user.role,
        details: `Triggered 3-day pre-trip scheduler evaluation (${result.tripsDueFor3Day} trips due, ${result.results.length} processed).`,
        entityType: 'NOTIFICATION',
      });
    }
    res.json(result);
  } catch (err: any) {
    console.error('[API] Error running reminder scheduler:', err);
    res.status(500).json({ error: `Failed to execute reminder check: ${err.message}` });
  }
});

apiRouter.get('/reminders/history', async (req: Request, res: Response) => {
  const records = db.getTripReminders();
  res.json(records);
});

apiRouter.get('/experiences/:id/reminder-preview', async (req: Request, res: Response) => {
  const exp = db.getExperienceById(req.params.id);
  if (!exp) {
    return res.status(404).json({ error: 'Industrial visit not found' });
  }

  const daysUntilTrip = calculateDaysUntilTrip(exp.date);
  const registrations = (db.getRegistrationsForExperience(exp.id) || []).filter(
    (r) => r.status === 'REGISTERED' || r.status === 'COMPLETED'
  );
  const waitlist = (db.getWaitlistForExperience(exp.id) || []).filter(
    (w) => w.status === 'ACTIVE'
  );
  const securityRecipients = db.getSecurityRecipients().filter((s) => s.isActive);
  const adminUsers = (db.getAllUsers() || []).filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE');
  const faculty = (db.getAllFaculty() || []).filter(
    (f) => f.userId === exp.primaryFacultyId || f.facultyId === exp.primaryFacultyId || f.status === 'ACTIVE'
  ).slice(0, 2);

  const studentList = registrations.map((r) => {
    const profile = db.getStudentProfile(r.studentId);
    const boardingPass = db.getBoardingPassForStudentAndExperience(r.studentId, exp.id);
    return {
      studentId: r.studentId,
      name: profile?.name || r.studentId,
      email: profile?.email || 'N/A',
      rollNumber: profile?.prn || r.studentId,
      boardingPassNumber: boardingPass?.passNumber || 'PENDING',
    };
  });

  res.json({
    tripId: exp.id,
    tripTitle: exp.title,
    organization: exp.organization,
    tripDate: exp.date,
    daysUntilTrip,
    isDueFor3DayReminder: daysUntilTrip === 3,
    reportingTime: exp.travelInfo?.reportingTime || exp.time || '07:30 AM',
    reportingLocation: exp.travelInfo?.reportingLocation || 'VIT Campus Gate 2 Bus Bay',
    departureTime: exp.travelInfo?.departureTime || '08:00 AM',
    transportInfo: exp.travelInfo?.transport || 'University AC Transit Coach',
    counts: {
      confirmedStudents: registrations.length,
      waitlistedStudents: waitlist.length,
      facultyCoordinators: faculty.length,
      securityGates: securityRecipients.length,
      admins: adminUsers.length,
      totalExpectedRecipients: registrations.length + faculty.length + securityRecipients.length + adminUsers.length,
    },
    students: studentList,
    faculty: faculty.map((f) => ({ name: f.name, email: f.email, department: f.department })),
    security: securityRecipients.map((s) => ({ name: s.name, email: s.email, gateLocation: s.gateLocation })),
    admins: adminUsers.map((a) => ({ name: a.name, email: a.email })),
  });
});

apiRouter.post('/experiences/:id/send-3day-reminder', async (req: Request, res: Response) => {
  const { user } = await getAuthUser(req);
  if (user && user.role !== 'ADMIN' && user.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Admin or Faculty access required' });
  }

  const exp = db.getExperienceById(req.params.id);
  if (!exp) {
    return res.status(404).json({ error: 'Industrial visit not found' });
  }

  const { forceSend } = req.body || {};

  try {
    const result = await notificationService.dispatchPreTrip3DayRemindersForExperience(db, exp, {
      forceSend: forceSend !== undefined ? forceSend : true,
      triggerSource: 'MANUAL_TRIGGER',
    });

    if (user) {
      db.addAuditLog({
        action: 'VISIT_STATUS_UPDATED',
        performedBy: user.id,
        performedByName: user.name,
        userRole: user.role,
        details: `Dispatched 3-day pre-trip reminders for "${exp.title}" (${result.totalEmailsSent} delivered, ${result.totalEmailsFailed} failed).`,
        entityId: exp.id,
        entityType: 'EXPERIENCE',
      });
    }

    res.json(result);
  } catch (err: any) {
    console.error('[API] Error dispatching 3-day reminder for experience:', err);
    res.status(500).json({ error: `Failed to dispatch 3-day reminders: ${err.message}` });
  }
});


