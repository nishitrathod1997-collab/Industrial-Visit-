import crypto from 'crypto';

/**
 * Password hashing using Node.js crypto PBKDF2
 */
export function hashPassword(password: string, saltInput?: string): { hash: string; salt: string } {
  const salt = saltInput || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!password || !hash || !salt) return false;
  const { hash: calculatedHash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculatedHash, 'hex'));
}

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vit_secret_super_key_development_only';

// Password reset token store: token -> { email: string; expiresAt: number }
const resetTokenStore = new Map<string, { userId: string; email: string; expiresAt: number }>();

export function createAuthToken(userId: string): string {
  // Create a JWT token that expires in 7 days
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function getUserIdFromToken(token: string): string | null {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

export function invalidateToken(token: string): boolean {
  // With JWTs, true invalidation requires a blacklist or short expiry + refresh tokens.
  // For now, we rely on token expiration. 
  return true;
}

export function createResetToken(userId: string, email: string): string {
  const token = `vit_reset_${crypto.randomBytes(12).toString('hex')}`;
  // Token expires in 15 minutes
  resetTokenStore.set(token, { userId, email, expiresAt: Date.now() + 15 * 60 * 1000 });
  return token;
}

export function verifyResetToken(token: string): { userId: string; email: string } | null {
  const data = resetTokenStore.get(token);
  if (!data) return null;
  if (Date.now() > data.expiresAt) {
    resetTokenStore.delete(token);
    return null;
  }
  return { userId: data.userId, email: data.email };
}

export function consumeResetToken(token: string): void {
  resetTokenStore.delete(token);
}
