import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

/**
 * Robust JWT secret management
 * Production startup fails securely if JWT_SECRET is missing, weak, or default.
 */
const DEFAULT_DEV_SECRET = 'vit_industrial_exposure_super_secure_key_2026_dev_env';

export function getValidatedJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!envSecret || envSecret.trim().length < 32 || envSecret === DEFAULT_DEV_SECRET || envSecret.includes('development')) {
      throw new Error(
        'FATAL CONFIGURATION ERROR: In production, JWT_SECRET must be explicitly set to a strong secret of at least 32 characters in the environment. Server startup aborted for security.'
      );
    }
    return envSecret.trim();
  }

  // Development/test environment
  return envSecret && envSecret.trim().length >= 16 ? envSecret.trim() : DEFAULT_DEV_SECRET;
}

// Fast in-memory cache of revoked token JTIs (synchronized with database)
const revokedTokenMemorySet = new Set<string>();

/**
 * Initializes the revocation cache by preloading unexpired revocations from SQLite/PostgreSQL
 */
export async function initializeRevocationStore(): Promise<void> {
  try {
    const unexpired = await prisma.revokedToken.findMany({
      where: { expiresAt: { gt: new Date() } },
      select: { jti: true },
    });
    for (const r of unexpired) {
      revokedTokenMemorySet.add(r.jti);
    }
    console.log(`[AuthSecurity] Loaded ${unexpired.length} persistent revoked token(s) into active memory cache.`);
  } catch (err: any) {
    console.warn('[AuthSecurity] Could not preload revoked tokens from database:', err.message);
  }
}

// Prune expired records from database and memory cache periodically (every 15 minutes)
const pruneTimer = setInterval(async () => {
  try {
    const now = new Date();
    await prisma.revokedToken.deleteMany({
      where: { expiresAt: { lte: now } },
    });
    await prisma.passwordResetToken.deleteMany({
      where: { OR: [{ expiresAt: { lte: now } }, { used: true }] },
    });
  } catch {
    // Non-fatal background prune
  }
}, 15 * 60 * 1000);
if (pruneTimer.unref) {
  pruneTimer.unref();
}

/**
 * Canonical PBKDF2 password hashing compatible with existing credentials
 * Parameters: PBKDF2 HMAC-SHA512, 10000 iterations, 64-byte key length
 */
export function hashPassword(password: string, saltInput?: string): { hash: string; salt: string } {
  const salt = saltInput || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Constant-time password verification against stored PBKDF2 hash & salt
 * Fails safely on missing, malformed or empty inputs without throwing.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!password || !hash || !salt) return false;
  try {
    const { hash: calculatedHash } = hashPassword(password, salt);
    const bufStored = Buffer.from(hash, 'hex');
    const bufCalculated = Buffer.from(calculatedHash, 'hex');
    if (bufStored.length !== bufCalculated.length) return false;
    return crypto.timingSafeEqual(bufStored, bufCalculated);
  } catch (err) {
    return false;
  }
}

/**
 * Creates a signed JWT with unique jti, role, and persistent user tokenVersion
 */
export async function createAuthToken(userId: string, role?: string): Promise<string> {
  if (!userId) throw new Error('Cannot create token without a valid userId');

  // Look up user's current tokenVersion from authoritative database
  let tokenVersion = 1;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });
    if (user && typeof user.tokenVersion === 'number') {
      tokenVersion = user.tokenVersion;
    }
  } catch {
    // fallback to version 1
  }

  const secret = getValidatedJwtSecret();
  const jti = crypto.randomUUID();

  return jwt.sign(
    {
      userId,
      role,
      tokenVersion,
      jti,
    },
    secret,
    { expiresIn: '7d' }
  );
}

export interface DecodedTokenPayload {
  userId: string;
  role?: string;
  tokenVersion: number;
  jti: string;
  exp: number;
  iat: number;
}

/**
 * Verifies JWT signature, expiration, claim validity, and persistent session revocation.
 * Strictly rejects forged tokens, non-JWT strings, and revoked sessions.
 */
export async function verifyAuthToken(token: string): Promise<DecodedTokenPayload | null> {
  if (!token || typeof token !== 'string') return null;

  try {
    const secret = getValidatedJwtSecret();
    const decoded = jwt.verify(token, secret) as DecodedTokenPayload;
    if (!decoded || !decoded.userId || !decoded.jti) {
      return null;
    }

    // 1. Check in-memory revoked tokens cache
    if (revokedTokenMemorySet.has(decoded.jti)) {
      return null;
    }

    // 2. Check persistent database revocation table
    try {
      const dbRevoked = await prisma.revokedToken.findUnique({
        where: { jti: decoded.jti },
      });
      if (dbRevoked) {
        revokedTokenMemorySet.add(decoded.jti);
        return null;
      }
    } catch {
      // If db check fails transiently, continue to tokenVersion verification
    }

    // 3. Check authoritative server-side user tokenVersion and active status
    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { tokenVersion: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        return null;
      }

      const authoritativeVersion = user.tokenVersion || 1;
      const claimedVersion = decoded.tokenVersion || 1;

      // If tokenVersion in JWT is older than authoritative database version, session has been revoked
      if (claimedVersion < authoritativeVersion) {
        return null;
      }
    } catch {
      // If user lookup fails, reject for safety
      return null;
    }

    return decoded;
  } catch (error) {
    // Cryptographic failure, invalid signature, expired, or malformed
    return null;
  }
}

/**
 * Canonical helper to extract verified userId from a token
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  const verified = await verifyAuthToken(token);
  return verified ? verified.userId : null;
}

/**
 * Persistently invalidates a specific JWT session (called during logout)
 */
export async function invalidateToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const secret = getValidatedJwtSecret();
    const decoded = jwt.decode(token) as DecodedTokenPayload | null;
    if (decoded && decoded.jti && decoded.userId) {
      const expMs = decoded.exp ? decoded.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
      
      // Update memory cache
      revokedTokenMemorySet.add(decoded.jti);

      // Persist in authoritative database
      try {
        await prisma.revokedToken.upsert({
          where: { jti: decoded.jti },
          create: {
            jti: decoded.jti,
            userId: decoded.userId,
            expiresAt: new Date(expMs),
          },
          update: {},
        });
      } catch (err: any) {
        console.error('[AuthSecurity] Failed to persist revoked token:', err.message);
      }
      return true;
    }
  } catch {
    // Ignore decode error
  }
  return false;
}

/**
 * Persistently revokes ALL active sessions for a user across all instances
 * Called on password change, password reset, or administrative account suspension.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  } catch (err: any) {
    console.error(`[AuthSecurity] Failed to increment tokenVersion for user ${userId}:`, err.message);
  }
}

/**
 * Generates a high-entropy, single-use, 15-minute password reset token.
 * Stores a SHA-256 hash persistently in the database to prevent plain-token disclosure if database is dumped.
 */
export async function createResetToken(userId: string, email: string): Promise<string> {
  const rawToken = `vit_rst_${crypto.randomBytes(32).toString('hex')}`;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  try {
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId,
        email: email.toLowerCase(),
        expiresAt,
        used: false,
      },
    });
  } catch (err: any) {
    console.error('[AuthSecurity] Error saving persistent reset token:', err.message);
    throw new Error('Failed to generate secure password reset token');
  }

  return rawToken;
}

/**
 * Validates a persistent password reset token from authoritative database
 */
export async function verifyResetToken(rawToken: string): Promise<{ userId: string; email: string } | null> {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record) return null;
    if (record.used) return null;
    if (new Date() > record.expiresAt) return null;

    return { userId: record.userId, email: record.email };
  } catch (err: any) {
    console.error('[AuthSecurity] Error verifying persistent reset token:', err.message);
    return null;
  }
}

/**
 * Atomically consumes a password reset token so it cannot be reused
 */
export async function consumeResetToken(rawToken: string): Promise<boolean> {
  if (!rawToken || typeof rawToken !== 'string') return false;

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  try {
    const updateResult = await prisma.passwordResetToken.updateMany({
      where: {
        tokenHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });

    return updateResult.count > 0;
  } catch (err: any) {
    console.error('[AuthSecurity] Error consuming persistent reset token:', err.message);
    return false;
  }
}
