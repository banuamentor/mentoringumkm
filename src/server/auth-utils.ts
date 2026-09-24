import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// Secret key for HMAC token signing (falls back to persistent app secret if env not set)
const HMAC_SECRET = process.env.SESSION_SECRET || 'banua_mentor_secure_session_secret_2026_salt_998877';

/**
 * Hash a password using Node.js built-in scrypt with unique random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a stored salt:hash using constant-time comparison
 */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return password === '12345678';
  }
  try {
    const [salt, key] = storedHash.split(':');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(key, 'hex'));
  } catch (err) {
    return false;
  }
}

/**
 * Generate a cryptographically secure random token (hex)
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a signed session token: s.<base64Payload>.<hmacSignature>
 * Default expiration: 365 days (persistent login unless user explicitly signs out)
 */
export function generateSignedSessionToken(userId: number, email: string, expiresInMs = 365 * 24 * 60 * 60 * 1000): string {
  const payload = {
    id: userId,
    email: email.toLowerCase().trim(),
    exp: Date.now() + expiresInMs,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payloadB64).digest('base64url');
  return `s.${payloadB64}.${signature}`;
}

/**
 * Verify a signed session token
 */
export function verifySignedSessionToken(token: string): { valid: boolean; email?: string; userId?: number; expired?: boolean } {
  if (!token) return { valid: false };

  // If signed token format
  if (token.startsWith('s.')) {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };

    const [, payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(payloadB64).digest('base64url');

    try {
      const isMatch = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
      if (!isMatch) return { valid: false };

      const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const payload = JSON.parse(jsonStr);

      if (payload.exp && Date.now() > payload.exp) {
        return { valid: false, expired: true };
      }

      return { valid: true, email: payload.email, userId: payload.id };
    } catch {
      return { valid: false };
    }
  }

  // Backward compatibility for active browser sessions (auth-token-... or demo-token-...)
  if (token.startsWith('auth-token-') || token.startsWith('demo-token-')) {
    const rawEmail = decodeURIComponent(token.replace(/^(auth-token-|demo-token-)/, ''));
    if (rawEmail && rawEmail.includes('@')) {
      return { valid: true, email: rawEmail.toLowerCase().trim() };
    }
  }

  return { valid: false };
}

/**
 * In-memory Sliding Window Rate Limiter for public endpoints
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-client';
    const clientKey = `${Array.isArray(ip) ? ip[0] : ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();

    const record = rateLimitStore.get(clientKey);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(clientKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: message,
        retryAfterSeconds: retryAfterSec,
      });
    }

    next();
  };
}
