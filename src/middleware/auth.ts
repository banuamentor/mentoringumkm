import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { profiles, umkmProfiles, mentorProfiles } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { verifySignedSessionToken } from '../server/auth-utils.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  profile?: typeof profiles.$inferSelect;
  umkm?: typeof umkmProfiles.$inferSelect;
  mentor?: typeof mentorProfiles.$inferSelect;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesi tidak valid: Token otorisasi tidak ditemukan.' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Sesi tidak valid: Token kosong.' });
  }

  try {
    // 1. Check Signed Session Token or backward-compatible auth-token
    const sessionResult = verifySignedSessionToken(token);
    if (sessionResult.valid && sessionResult.email) {
      const existingUser = await db
        .select()
        .from(profiles)
        .where(eq(profiles.email, sessionResult.email))
        .limit(1);

      if (existingUser.length > 0) {
        const user = existingUser[0];

        if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'INACTIVE') {
          return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan oleh administrator.' });
        }

        req.profile = user;
        req.user = {
          uid: user.firebaseUid,
          email: user.email,
        } as DecodedIdToken;

        if (req.profile.role === 'UMKM') {
          const u = await db.select().from(umkmProfiles).where(eq(umkmProfiles.profileId, req.profile.id)).limit(1);
          if (u.length > 0) req.umkm = u[0];
        } else if (req.profile.role === 'MENTOR') {
          const m = await db.select().from(mentorProfiles).where(eq(mentorProfiles.profileId, req.profile.id)).limit(1);
          if (m.length > 0) req.mentor = m[0];
        }
        return next();
      }
    } else if (sessionResult.expired) {
      return res.status(401).json({ error: 'Sesi login telah kedaluwarsa. Silakan masuk kembali.' });
    }

    // 2. Fallback to Firebase ID Token verification
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: 'Sesi telah kedaluwarsa atau token tidak valid. Silakan login kembali.' });
    }

    req.user = decodedToken;

    // Find or sync profile in DB
    let userProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.firebaseUid, decodedToken.uid))
      .limit(1);

    if (userProfiles.length === 0 && decodedToken.email) {
      userProfiles = await db
        .select()
        .from(profiles)
        .where(eq(profiles.email, decodedToken.email.toLowerCase().trim()))
        .limit(1);
    }

    if (userProfiles.length === 0) {
      // Auto-create profile on first Google Auth login
      const defaultRole = (decodedToken.email === 'banuamentor@gmail.com') ? 'ADMIN' : 'UMKM';
      const inserted = await db
        .insert(profiles)
        .values({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email?.toLowerCase().trim() || `user-${decodedToken.uid}@app.local`,
          fullName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User UMKM',
          role: defaultRole,
          accountStatus: 'ACTIVE',
        })
        .returning();

      req.profile = inserted[0];

      if (defaultRole === 'UMKM') {
        const u = await db
          .insert(umkmProfiles)
          .values({
            profileId: req.profile.id,
            businessName: `Usaha ${req.profile.fullName}`,
            ownerName: req.profile.fullName,
            email: req.profile.email,
          })
          .returning();
        req.umkm = u[0];
      }
    } else {
      req.profile = userProfiles[0];
      if (req.profile.role === 'UMKM') {
        let u = await db.select().from(umkmProfiles).where(eq(umkmProfiles.profileId, req.profile.id)).limit(1);
        if (u.length === 0) {
          const createdU = await db.insert(umkmProfiles).values({
            profileId: req.profile.id,
            businessName: `Usaha ${req.profile.fullName}`,
            ownerName: req.profile.fullName,
            email: req.profile.email,
          }).returning();
          req.umkm = createdU[0];
        } else {
          req.umkm = u[0];
        }
      } else if (req.profile.role === 'MENTOR') {
        let m = await db.select().from(mentorProfiles).where(eq(mentorProfiles.profileId, req.profile.id)).limit(1);
        if (m.length === 0) {
          const createdM = await db.insert(mentorProfiles).values({
            profileId: req.profile.id,
            fullName: req.profile.fullName,
            email: req.profile.email,
          }).returning();
          req.mentor = createdM[0];
        } else {
          req.mentor = m[0];
        }
      }
    }

    if (req.profile.accountStatus === 'SUSPENDED' || req.profile.accountStatus === 'INACTIVE') {
      return res.status(403).json({ error: 'Akun Anda sedang dinonaktifkan atau disuspend. Hubungi Administrator.' });
    }

    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Terjadi kesalahan saat memverifikasi sesi pengguna.' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.profile) {
      return res.status(401).json({ error: 'Profil pengguna tidak ditemukan.' });
    }
    if (!allowedRoles.includes(req.profile.role)) {
      return res.status(403).json({ error: `Akses ditolak: Memerlukan hak akses ${allowedRoles.join(' atau ')}.` });
    }
    next();
  };
};
