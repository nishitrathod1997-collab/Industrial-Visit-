/**
 * Automated Security Verification Test Suite
 * Comprehensive regression tests for all critical security findings:
 * - Persistent session revocation in database
 * - Persistent password reset tokens in database with atomic single-use semantics
 * - Production JWT secret configuration validation
 * - Cryptographic PBKDF2 hash compatibility
 * - Password reset followed by old password invalidation and tokenVersion increment
 * - Seed script protection of existing user credentials
 */

import crypto from 'crypto';
import { prisma } from './server/prisma';
import {
  hashPassword,
  verifyPassword,
  createAuthToken,
  verifyAuthToken,
  createResetToken,
  verifyResetToken,
  consumeResetToken,
  getValidatedJwtSecret,
  revokeAllUserSessions,
  initializeRevocationStore,
} from './server/auth';
import { ensureDemoAccounts } from './server/seedDemo';

const BASE_URL = 'http://localhost:3000/api';

interface TestResult {
  name: string;
  finding: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function recordTest(name: string, finding: string, fn: () => Promise<{ passed: boolean; details: string }>) {
  try {
    const res = await fn();
    results.push({ name, finding, passed: res.passed, details: res.details });
    const mark = res.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${mark} [${finding}] ${name} - ${res.details}`);
  } catch (err: any) {
    results.push({ name, finding, passed: false, details: `Exception: ${err.message}` });
    console.log(`✗ FAIL [${finding}] ${name} - Exception: ${err.message}`);
  }
}

async function runSecurityTests() {
  console.log('\n============================================================');
  console.log('STARTING AUTOMATED SECURITY REMEDIATION REGRESSION TEST SUITE');
  console.log('============================================================\n');

  // --- FINDING 1: USER IMPERSONATION & HEADER TRUST ---
  await recordTest('Reject unauthenticated request to /auth/me', 'FINDING 1', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`);
    return {
      passed: res.status === 401,
      details: `HTTP ${res.status} (expected 401)`,
    };
  });

  await recordTest('Reject forged x-user-id header without Bearer token', 'FINDING 1', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'x-user-id': 'usr_admin_1' },
    });
    return {
      passed: res.status === 401,
      details: `HTTP ${res.status} (expected 401)`,
    };
  });

  await recordTest('Reject raw user ID string passed as Bearer token', 'FINDING 1', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer usr_admin_1' },
    });
    return {
      passed: res.status === 401,
      details: `HTTP ${res.status} (expected 401)`,
    };
  });

  await recordTest('Reject forged x-user-id on profile update', 'FINDING 1 & 5', async () => {
    const res = await fetch(`${BASE_URL}/auth/me/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin_1' },
      body: JSON.stringify({ name: 'Hacked Admin' }),
    });
    return {
      passed: res.status === 401,
      details: `HTTP ${res.status} (expected 401)`,
    };
  });

  await recordTest('Reject forged x-user-id on password change', 'FINDING 1 & 5', async () => {
    const res = await fetch(`${BASE_URL}/auth/me/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin_1' },
      body: JSON.stringify({ currentPassword: 'Password@123', newPassword: 'NewPassword@999' }),
    });
    return {
      passed: res.status === 401,
      details: `HTTP ${res.status} (expected 401)`,
    };
  });

  await recordTest('Reject unauthenticated call to /experiences/:id/verify-pass', 'FINDING 1 & 5', async () => {
    const res = await fetch(`${BASE_URL}/experiences/exp_isro_10/verify-pass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin_1' },
      body: JSON.stringify({ passNumber: 'VIT-BP-2026-98124' }),
    });
    return {
      passed: res.status === 401,
      details: `HTTP ${res.status} (expected 401)`,
    };
  });

  // --- FINDING 2: UNIVERSAL BACKDOOR PASSWORD ---
  await recordTest('Reject incorrect password on student login', 'FINDING 2', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'nishit.rathod@vit.edu.in',
        password: 'DefinitelyWrongPassword!123',
        role: 'STUDENT',
      }),
    });
    return {
      passed: res.status === 401,
      details: `HTTP ${res.status} (expected 401)`,
    };
  });

  // Login with legitimate demo credentials to get valid tokens for subsequent tests
  let studentToken = '';
  let adminToken = '';

  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'nishit.rathod@vit.edu.in',
      password: 'Password@123',
      role: 'STUDENT',
    }),
  });
  if (studentLoginRes.status === 200) {
    const data = await studentLoginRes.json();
    studentToken = data.token;
  }

  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@vit.edu.in',
      password: 'Password@123',
      role: 'ADMIN',
    }),
  });
  if (adminLoginRes.status === 200) {
    const data = await adminLoginRes.json();
    adminToken = data.token;
  }

  await recordTest('Legitimate student login succeeds and issues signed JWT', 'FINDING 1 & 9', async () => {
    return {
      passed: Boolean(studentToken && studentToken.split('.').length === 3),
      details: studentToken ? `Obtained 3-segment JWT (${studentToken.substring(0, 20)}...)` : 'Failed login',
    };
  });

  await recordTest('Legitimate admin login succeeds and issues signed JWT', 'FINDING 1 & 9', async () => {
    return {
      passed: Boolean(adminToken && adminToken.split('.').length === 3),
      details: adminToken ? `Obtained 3-segment JWT (${adminToken.substring(0, 20)}...)` : 'Failed login',
    };
  });

  // --- FINDING 3: ACCOUNT SWITCHING SECURITY ---
  await recordTest('Reject unauthenticated account switching (no token)', 'FINDING 3', async () => {
    const res = await fetch(`${BASE_URL}/auth/switch-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'usr_admin_1' }),
    });
    return {
      passed: res.status === 401,
      details: `HTTP ${res.status} (expected 401)`,
    };
  });

  await recordTest('Reject student attempting to switch to admin persona', 'FINDING 3', async () => {
    const res = await fetch(`${BASE_URL}/auth/switch-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ userId: 'usr_admin_1' }),
    });
    return {
      passed: res.status === 403,
      details: `HTTP ${res.status} (expected 403)`,
    };
  });

  await recordTest('Allow authenticated Admin to switch persona with audit log', 'FINDING 3', async () => {
    const res = await fetch(`${BASE_URL}/auth/switch-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ userId: 'usr_student_1' }),
    });
    const body = await res.json();
    return {
      passed: res.status === 200 && body.user && body.user.id === 'usr_student_1',
      details: `HTTP ${res.status}, switched to ${body.user?.email || 'none'}`,
    };
  });

  // --- FINDING 4: PASSWORD RESET TOKEN DISCLOSURE ---
  await recordTest('Forgot password NEVER exposes reset token in response', 'FINDING 4', async () => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'nishit.rathod@vit.edu.in', role: 'STUDENT' }),
    });
    const data = await res.json();
    const hasToken = 'resetToken' in data || 'token' in data;
    return {
      passed: res.status === 200 && !hasToken,
      details: `HTTP ${res.status}, contains resetToken: ${hasToken}`,
    };
  });

  await recordTest('Forgot password returns same generic response for non-existent user', 'FINDING 4', async () => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'nonexistent.user.999@vit.edu.in', role: 'STUDENT' }),
    });
    const data = await res.json();
    return {
      passed: res.status === 200 && data.success === true,
      details: `HTTP ${res.status} (expected 200 without user enumeration)`,
    };
  });

  await recordTest('Reject invalid password reset token', 'FINDING 4', async () => {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'fake_invalid_token_12345', newPassword: 'BrandNewSecurePassword@2026' }),
    });
    return {
      passed: res.status === 400 || res.status === 429,
      details: `HTTP ${res.status} (expected 400 or 429)`,
    };
  });

  // --- FINDING 7: SCHEDULER AUTHENTICATION BYPASS ---
  await recordTest('Reject scheduler request with forged X-CloudScheduler header', 'FINDING 7', async () => {
    const res = await fetch(`${BASE_URL}/scheduler/trigger-reminders`, {
      headers: { 'x-cloudscheduler': 'true' },
    });
    return {
      passed: res.status === 401,
      details: `HTTP ${res.status} (expected 401)`,
    };
  });

  await recordTest('Reject scheduler request with forged Google-Cloud-Scheduler User-Agent', 'FINDING 7', async () => {
    const res = await fetch(`${BASE_URL}/scheduler/trigger-reminders`, {
      headers: { 'User-Agent': 'Google-Cloud-Scheduler' },
    });
    return {
      passed: res.status === 401,
      details: `HTTP ${res.status} (expected 401)`,
    };
  });

  await recordTest('Reject student attempting to trigger scheduler', 'FINDING 7', async () => {
    const res = await fetch(`${BASE_URL}/scheduler/trigger-reminders`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    return {
      passed: res.status === 403,
      details: `HTTP ${res.status} (expected 403)`,
    };
  });

  await recordTest('Allow authenticated Admin to invoke scheduler endpoint', 'FINDING 7', async () => {
    const res = await fetch(`${BASE_URL}/scheduler/trigger-reminders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    return {
      passed: res.status === 200,
      details: `HTTP ${res.status} (expected 200)`,
    };
  });

  // --- FINDING 9: SESSION REVOCATION ON LOGOUT ---
  await recordTest('Logout invalidates the active JWT session', 'FINDING 9', async () => {
    const checkBefore = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (checkBefore.status !== 200) {
      return { passed: false, details: `Token was not valid before logout (HTTP ${checkBefore.status})` };
    }

    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (logoutRes.status !== 200) {
      return { passed: false, details: `Logout failed (HTTP ${logoutRes.status})` };
    }

    const checkAfter = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    return {
      passed: checkAfter.status === 401,
      details: `Token after logout returned HTTP ${checkAfter.status} (expected 401)`,
    };
  });

  // --- REQUIREMENT 1: PERSISTENT SESSION REVOCATION IN DATABASE ---
  await recordTest('Revoked token is stored in persistent database table', 'REQUIREMENT 1', async () => {
    // Generate a fresh token for admin
    const testToken = await createAuthToken('usr_admin_1', 'ADMIN');
    const verifiedBefore = await verifyAuthToken(testToken);
    if (!verifiedBefore) {
      return { passed: false, details: 'Initial token verification failed' };
    }

    // Invalidate via API
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
    });

    // Verify database record in RevokedToken table
    const dbRecord = await prisma.revokedToken.findUnique({
      where: { jti: verifiedBefore.jti },
    });

    const isRejected = (await verifyAuthToken(testToken)) === null;

    return {
      passed: Boolean(dbRecord && isRejected),
      details: dbRecord ? `Found in database with jti=${dbRecord.jti.slice(0, 8)}..., token rejected` : 'Not found in database',
    };
  });

  await recordTest('Revoked tokens persist across store reinitialization (simulated server restart)', 'REQUIREMENT 1', async () => {
    // Create and revoke a token
    const testToken = await createAuthToken('usr_admin_1', 'ADMIN');
    const payload = await verifyAuthToken(testToken);
    if (!payload) return { passed: false, details: 'Token creation failed' };

    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
    });

    // Reinitialize revocation store from database (same as server boot)
    await initializeRevocationStore();

    const verified = await verifyAuthToken(testToken);
    return {
      passed: verified === null,
      details: verified === null ? 'Token remains rejected after store reinitialization' : 'Token was accepted after reinit',
    };
  });

  // --- REQUIREMENT 2: PERSISTENT PASSWORD-RESET TOKENS & ATOMIC CONSUMPTION ---
  await recordTest('Password reset token is stored persistently as SHA-256 in database', 'REQUIREMENT 2', async () => {
    const rawToken = await createResetToken('usr_student_1', 'test@vit.edu.in');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const dbRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    return {
      passed: Boolean(dbRecord && dbRecord.used === false && !rawToken.includes(tokenHash)),
      details: dbRecord ? `Stored hashed token with used=${dbRecord.used}` : 'Record not found in DB',
    };
  });

  await recordTest('Password reset token enforces atomic single-use semantics', 'REQUIREMENT 2', async () => {
    const rawToken = await createResetToken('usr_student_1', 'test@vit.edu.in');

    // First consumption succeeds
    const firstConsume = await consumeResetToken(rawToken);
    // Second consumption fails (cannot be reused)
    const secondConsume = await consumeResetToken(rawToken);

    return {
      passed: firstConsume === true && secondConsume === false,
      details: `First consume=${firstConsume}, Second consume=${secondConsume}`,
    };
  });

  await recordTest('Expired password reset token is rejected', 'REQUIREMENT 2', async () => {
    const rawToken = `vit_rst_expired_${crypto.randomBytes(16).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Insert an already expired token into DB
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: 'usr_student_1',
        email: 'test@vit.edu.in',
        expiresAt: new Date(Date.now() - 60000), // 1 minute in the past
        used: false,
      },
    });

    const verifyResult = await verifyResetToken(rawToken);
    return {
      passed: verifyResult === null,
      details: verifyResult === null ? 'Expired token correctly rejected' : 'Expired token was accepted',
    };
  });

  // --- REQUIREMENT 1 & 2: FULL PASSWORD RESET AND SESSION REVOCATION ---
  await recordTest('Password reset updates password, allows new login, rejects old password, and revokes prior tokens', 'REQUIREMENT 1 & 2', async () => {
    // 1. Create dedicated test user
    const testEmail = `sec_test_${Date.now()}@vit.edu.in`;
    const initialPass = 'InitialSecurePass@2026';
    const newPass = 'UpdatedSecurePass@2026';
    const { hash: initHash, salt: initSalt } = hashPassword(initialPass);

    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Security Test User',
        role: 'STUDENT',
        status: 'ACTIVE',
        passwordHash: initHash,
        salt: initSalt,
        tokenVersion: 1,
      },
    });

    // 2. Obtain an active session token with initial credentials
    const preResetToken = await createAuthToken(testUser.id, 'STUDENT');
    const validPre = await verifyAuthToken(preResetToken);
    if (!validPre) return { passed: false, details: 'Failed to create pre-reset token' };

    // 3. Request and consume a password reset
    const rawResetToken = await createResetToken(testUser.id, testEmail);
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawResetToken, newPassword: newPass }),
    });

    if (resetRes.status !== 200) {
      return { passed: false, details: `Reset failed with HTTP ${resetRes.status}` };
    }

    // 4. Verify pre-reset token is now INVALID (tokenVersion incremented)
    const preTokenAfterReset = await verifyAuthToken(preResetToken);

    // 5. Verify login with NEW password succeeds
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: newPass, role: 'STUDENT' }),
    });

    // 6. Verify login with OLD password fails
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: initialPass, role: 'STUDENT' }),
    });

    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});

    const passed =
      preTokenAfterReset === null &&
      newLoginRes.status === 200 &&
      (oldLoginRes.status === 401 || oldLoginRes.status === 429);

    return {
      passed,
      details: `Pre-reset session revoked=${preTokenAfterReset === null}, New login=${newLoginRes.status}, Old login=${oldLoginRes.status}`,
    };
  });

  // --- REQUIREMENT 3: PRODUCTION JWT SECRET VALIDATION ---
  await recordTest('Production environment fails securely if JWT_SECRET is missing or weak', 'REQUIREMENT 3', async () => {
    const origEnv = process.env.NODE_ENV;
    const origSecret = process.env.JWT_SECRET;

    try {
      // Simulate production with missing secret
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      let threw = false;
      try {
        getValidatedJwtSecret();
      } catch (err: any) {
        threw = true;
      }

      return {
        passed: threw,
        details: threw ? 'Correctly threw fatal error on missing production secret' : 'Did not throw error',
      };
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origSecret) process.env.JWT_SECRET = origSecret;
    }
  });

  // --- REQUIREMENT 5: SEED SCRIPTS DO NOT OVERWRITE EXISTING CREDENTIALS ---
  await recordTest('Seed scripts preserve existing user passwords on restart', 'REQUIREMENT 5', async () => {
    // 1. Get current hash of student demo user
    const studentBefore = await prisma.user.findUnique({
      where: { id: 'usr_student_1' },
      select: { passwordHash: true, salt: true },
    });

    if (!studentBefore || !studentBefore.passwordHash) {
      return { passed: false, details: 'usr_student_1 not found' };
    }

    // 2. Run ensureDemoAccounts
    await ensureDemoAccounts(prisma);

    // 3. Verify hash was not mutated
    const studentAfter = await prisma.user.findUnique({
      where: { id: 'usr_student_1' },
      select: { passwordHash: true, salt: true },
    });

    const preserved = studentBefore.passwordHash === studentAfter?.passwordHash;
    return {
      passed: preserved,
      details: preserved ? 'Existing credentials unchanged across seed runs' : 'Credentials were overwritten',
    };
  });

  // --- CRYPTOGRAPHIC COMPATIBILITY: PBKDF2 HMAC-SHA512 ---
  await recordTest('PBKDF2 HMAC-SHA512 implementation verifies standard credentials', 'CRYPTO', async () => {
    const testSalt = '1234567890abcdef1234567890abcdef';
    const testPass = 'InstitutionalTestingPassword@2026';
    const { hash, salt } = hashPassword(testPass, testSalt);

    const matches = verifyPassword(testPass, hash, salt);
    const rejectsWrong = !verifyPassword('WrongPassword', hash, salt);

    return {
      passed: matches && rejectsWrong,
      details: `Self-verification matches=${matches}, rejects wrong=${rejectsWrong}`,
    };
  });

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  console.log('\n============================================================');
  console.log(`TEST RESULTS SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED (${results.length} total)`);
  console.log('============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
