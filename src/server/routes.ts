import { Router, Response } from 'express';
import { db, ensureSequencesSynced } from '../db/index.ts';
import {
  profiles,
  umkmProfiles,
  mentorProfiles,
  products,
  salesChannels,
  sales,
  saleItems,
  programs,
  programParticipants,
  mentorAssignments,
  mentoringSessions,
  actionPlans,
  actionPlanEvaluations,
  invitations,
  auditLogs,
} from '../db/schema.ts';
import { eq, and, desc, sql, gte, lte, isNull, inArray } from 'drizzle-orm';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { logAudit } from './audit.ts';
import crypto from 'crypto';
import { hashPassword, verifyPassword, generateSecureToken } from './auth-utils.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTH & PROFILE ROUTES
// ==========================================

// Email and Password Login
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const userList = await db.select().from(profiles).where(eq(profiles.email, trimmedEmail)).limit(1);

    if (userList.length === 0) {
      return res.status(401).json({ error: 'Kombinasi email atau password salah' });
    }

    const user = userList[0];

    // Check account status
    if (user.accountStatus === 'INVITED') {
      return res.status(403).json({
        error: 'Akun mentor Anda belum diaktivasi. Silakan buka tautan undangan untuk membuat password pertama kali.',
        isInvited: true,
        inviteToken: user.inviteToken,
      });
    }

    if (user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan oleh administrator.' });
    }

    const isMatch = verifyPassword(String(password), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Kombinasi email atau password salah' });
    }

    let umkm = null;
    let mentor = null;
    if (user.role === 'UMKM') {
      const u = await db.select().from(umkmProfiles).where(eq(umkmProfiles.profileId, user.id)).limit(1);
      if (u.length > 0) umkm = u[0];
    } else if (user.role === 'MENTOR') {
      const m = await db.select().from(mentorProfiles).where(eq(mentorProfiles.profileId, user.id)).limit(1);
      if (m.length > 0) mentor = m[0];
    }

    await logAudit(user.id, 'LOGIN', 'profiles', user.id, { role: user.role, email: user.email });

    res.json({
      token: `auth-token-${encodeURIComponent(user.email)}`,
      profile: user,
      umkm,
      mentor,
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat login' });
  }
});

// UMKM Self-Registration (Only for UMKM)
apiRouter.post('/auth/register-umkm', async (req, res) => {
  try {
    const { fullName, businessName, email, whatsapp, password } = req.body;
    if (!fullName || !businessName || !email || !password) {
      return res.status(400).json({ error: 'Nama lengkap, nama usaha, email, dan password wajib diisi' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password minimal terdiri dari 8 karakter' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const existing = await db.select().from(profiles).where(eq(profiles.email, trimmedEmail)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email ini sudah terdaftar. Silakan login atau gunakan fitur lupa password.' });
    }

    const pHash = hashPassword(String(password));
    const newUid = 'uid-umkm-' + Date.now();

    const insertedProfile = await db
      .insert(profiles)
      .values({
        firebaseUid: newUid,
        email: trimmedEmail,
        fullName: String(fullName).trim(),
        role: 'UMKM',
        accountStatus: 'ACTIVE',
        passwordHash: pHash,
      })
      .returning();

    const newProfile = insertedProfile[0];

    const insertedUmkm = await db
      .insert(umkmProfiles)
      .values({
        profileId: newProfile.id,
        businessName: String(businessName).trim(),
        ownerName: String(fullName).trim(),
        whatsapp: whatsapp ? String(whatsapp).trim() : null,
        email: trimmedEmail,
        businessSector: 'Kuliner / F&B',
      })
      .returning();

    // Starter sample product so UMKM has immediate catalog
    await db.insert(products).values({
      umkmId: insertedUmkm[0].id,
      name: 'Produk Contoh 1',
      unit: 'pcs',
      defaultSellingPrice: 25000,
      defaultHpp: 15000,
      status: 'ACTIVE',
    });

    await logAudit(newProfile.id, 'REGISTER_UMKM', 'umkm_profiles', insertedUmkm[0].id);

    res.json({
      message: 'Pendaftaran UMKM berhasil! Selamat datang di sistem pendampingan bisnis.',
      token: `auth-token-${encodeURIComponent(newProfile.email)}`,
      profile: newProfile,
      umkm: insertedUmkm[0],
      mentor: null,
    });
  } catch (error: any) {
    console.error('Error registering UMKM:', error);
    res.status(500).json({ error: 'Gagal melakukan pendaftaran akun UMKM' });
  }
});

// Forgot Password Request
apiRouter.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const userList = await db.select().from(profiles).where(eq(profiles.email, trimmedEmail)).limit(1);

    if (userList.length === 0) {
      return res.json({
        message: 'Jika email terdaftar, instruksi dan tautan pembaruan password telah disiapkan.',
        found: false,
      });
    }

    const user = userList[0];
    const token = generateSecureToken(24);
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    await db
      .update(profiles)
      .set({
        resetToken: token,
        resetExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    await logAudit(user.id, 'REQUEST_PASSWORD_RESET', 'profiles', user.id);

    res.json({
      message: 'Tautan pembaruan password berhasil dibuat dan disiapkan untuk email Anda.',
      found: true,
      email: user.email,
      resetToken: token,
      resetUrl: `/?reset=${token}`,
    });
  } catch (error: any) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ error: 'Gagal memproses permintaan lupa password' });
  }
});

// Verify Reset Token
apiRouter.get('/auth/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token reset tidak ditemukan' });
    }

    const userList = await db
      .select()
      .from(profiles)
      .where(eq(profiles.resetToken, String(token)))
      .limit(1);

    if (userList.length === 0) {
      return res.status(400).json({ valid: false, error: 'Tautan pembaruan password tidak valid atau sudah digunakan' });
    }

    const user = userList[0];
    if (!user.resetExpiresAt || new Date(user.resetExpiresAt) < new Date()) {
      return res.status(400).json({ valid: false, error: 'Tautan pembaruan password telah kedaluwarsa. Silakan ajukan ulang.' });
    }

    res.json({
      valid: true,
      email: user.email,
      fullName: user.fullName,
    });
  } catch (error: any) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({ valid: false, error: 'Gagal memverifikasi token reset' });
  }
});

// Reset Password
apiRouter.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token dan password baru wajib diisi' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Password baru minimal terdiri dari 8 karakter' });
    }

    const userList = await db
      .select()
      .from(profiles)
      .where(eq(profiles.resetToken, String(token)))
      .limit(1);

    if (userList.length === 0) {
      return res.status(400).json({ error: 'Tautan pembaruan password tidak valid atau sudah pernah digunakan' });
    }

    const user = userList[0];
    if (!user.resetExpiresAt || new Date(user.resetExpiresAt) < new Date()) {
      return res.status(400).json({ error: 'Tautan telah kedaluwarsa. Silakan ajukan ulang permintaan lupa password.' });
    }

    const pHash = hashPassword(String(newPassword));

    await db
      .update(profiles)
      .set({
        passwordHash: pHash,
        resetToken: null,
        resetExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    await logAudit(user.id, 'RESET_PASSWORD', 'profiles', user.id);

    res.json({
      message: 'Password berhasil diperbarui! Silakan masuk dengan password baru Anda.',
    });
  } catch (error: any) {
    console.error('Error in reset-password:', error);
    res.status(500).json({ error: 'Gagal memperbarui password' });
  }
});

// Verify Mentor Invitation Token
apiRouter.get('/auth/verify-invite', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token undangan tidak ditemukan' });
    }

    const list = await db
      .select({
        profile: profiles,
        mentor: mentorProfiles,
      })
      .from(profiles)
      .leftJoin(mentorProfiles, eq(mentorProfiles.profileId, profiles.id))
      .where(eq(profiles.inviteToken, String(token)))
      .limit(1);

    if (list.length === 0) {
      return res.status(400).json({ valid: false, error: 'Tautan undangan mentor tidak valid atau sudah digunakan' });
    }

    const record = list[0];
    if (record.profile.accountStatus === 'ACTIVE') {
      return res.status(400).json({ valid: false, error: 'Akun mentor ini sudah aktif. Silakan langsung login.' });
    }

    res.json({
      valid: true,
      email: record.profile.email,
      fullName: record.profile.fullName,
      institution: record.mentor?.institution || null,
      position: record.mentor?.position || null,
    });
  } catch (error: any) {
    console.error('Error verifying invite token:', error);
    res.status(500).json({ valid: false, error: 'Gagal memverifikasi undangan' });
  }
});

// Accept Mentor Invitation & Set Initial Password
apiRouter.post('/auth/accept-invite', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token undangan dan password wajib diisi' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password minimal terdiri dari 8 karakter' });
    }

    const userList = await db
      .select()
      .from(profiles)
      .where(eq(profiles.inviteToken, String(token)))
      .limit(1);

    if (userList.length === 0) {
      return res.status(400).json({ error: 'Tautan undangan tidak valid atau sudah digunakan' });
    }

    const user = userList[0];
    const pHash = hashPassword(String(password));

    await db
      .update(profiles)
      .set({
        passwordHash: pHash,
        accountStatus: 'ACTIVE',
        inviteToken: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    const m = await db.select().from(mentorProfiles).where(eq(mentorProfiles.profileId, user.id)).limit(1);

    await logAudit(user.id, 'ACCEPT_MENTOR_INVITE', 'profiles', user.id);

    res.json({
      message: 'Aktivasi akun mentor berhasil! Password Anda telah disimpan.',
      token: `auth-token-${encodeURIComponent(user.email)}`,
      profile: { ...user, accountStatus: 'ACTIVE' },
      mentor: m[0] || null,
      umkm: null,
    });
  } catch (error: any) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Gagal mengaktivasi akun mentor' });
  }
});

// Admin Invites a New Mentor
apiRouter.post('/admin/invite-mentor', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { fullName, email, whatsapp, institution, position, expertise } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ error: 'Nama mentor dan email wajib diisi' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const existing = await db.select().from(profiles).where(eq(profiles.email, trimmedEmail)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email mentor ini sudah terdaftar di sistem' });
    }

    const inviteToken = generateSecureToken(24);
    const newUid = 'uid-mentor-' + Date.now();

    const insertedProfile = await db
      .insert(profiles)
      .values({
        firebaseUid: newUid,
        email: trimmedEmail,
        fullName: String(fullName).trim(),
        role: 'MENTOR',
        accountStatus: 'INVITED',
        inviteToken,
      })
      .returning();

    const newProfile = insertedProfile[0];

    const insertedMentor = await db
      .insert(mentorProfiles)
      .values({
        profileId: newProfile.id,
        fullName: String(fullName).trim(),
        email: trimmedEmail,
        whatsapp: whatsapp ? String(whatsapp).trim() : null,
        institution: institution ? String(institution).trim() : null,
        position: position ? String(position).trim() : null,
        expertise: expertise ? String(expertise).trim() : null,
      })
      .returning();

    await logAudit(req.profile!.id, 'INVITE_MENTOR', 'mentor_profiles', insertedMentor[0].id, {
      invitedEmail: trimmedEmail,
      invitedName: fullName,
    });

    res.json({
      message: 'Undangan mentor berhasil dibuat dan link aktivasi telah disiapkan.',
      inviteToken,
      inviteLink: `/?invite=${inviteToken}`,
      profile: newProfile,
      mentor: insertedMentor[0],
    });
  } catch (error: any) {
    console.error('Error inviting mentor:', error);
    res.status(500).json({ error: 'Gagal mengirim undangan mentor' });
  }
});

// Get current user profile
apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const profile = req.profile!;
    let umkm = req.umkm;
    let mentor = req.mentor;

    if (profile.role === 'UMKM' && !umkm) {
      const u = await db.select().from(umkmProfiles).where(eq(umkmProfiles.profileId, profile.id)).limit(1);
      if (u.length > 0) umkm = u[0];
    } else if (profile.role === 'MENTOR' && !mentor) {
      const m = await db.select().from(mentorProfiles).where(eq(mentorProfiles.profileId, profile.id)).limit(1);
      if (m.length > 0) mentor = m[0];
    }

    res.json({
      profile,
      umkm: umkm || null,
      mentor: mentor || null,
    });
  } catch (error: any) {
    console.error('Error fetching /api/auth/me:', error);
    res.status(500).json({ error: 'Gagal mengambil informasi profil' });
  }
});

// Demo switch role helper (for quick evaluation of UMKM, MENTOR, and ADMIN views)
apiRouter.post('/auth/switch-demo-role', async (req, res) => {
  try {
    const { role } = req.body;
    let targetEmail = 'banuamentor@gmail.com';
    if (role === 'MENTOR') targetEmail = 'mentor.budi@umkm.id';
    else if (role === 'UMKM') targetEmail = 'kopi.nusantara@umkm.id';

    const p = await db.select().from(profiles).where(eq(profiles.email, targetEmail)).limit(1);
    if (p.length === 0) {
      return res.status(404).json({ error: 'User demo tidak ditemukan' });
    }

    let umkm = null;
    let mentor = null;

    if (p[0].role === 'UMKM') {
      const u = await db.select().from(umkmProfiles).where(eq(umkmProfiles.profileId, p[0].id)).limit(1);
      if (u.length > 0) umkm = u[0];
    } else if (p[0].role === 'MENTOR') {
      const m = await db.select().from(mentorProfiles).where(eq(mentorProfiles.profileId, p[0].id)).limit(1);
      if (m.length > 0) mentor = m[0];
    }

    res.json({
      token: `demo-token-${targetEmail}`,
      profile: p[0],
      umkm,
      mentor,
    });
  } catch (error: any) {
    console.error('Error in switch demo role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update UMKM Profile
apiRouter.post('/profile/umkm', requireAuth, requireRole(['UMKM', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const {
      businessName,
      ownerName,
      whatsapp,
      email,
      cityRegency,
      district,
      address,
      establishedYear,
      businessSector,
      commodity,
      description,
      nib,
      instagram,
      marketplace,
      logoUrl,
    } = req.body;

    const profileId = req.profile!.id;
    let umkm = req.umkm;

    if (!umkm) {
      const inserted = await db.insert(umkmProfiles).values({
        profileId,
        businessName: businessName || 'Nama Usaha Baru',
        ownerName: ownerName || req.profile!.fullName,
        whatsapp,
        email,
        cityRegency,
        district,
        address,
        establishedYear: establishedYear ? Number(establishedYear) : null,
        businessSector,
        commodity,
        description,
        nib,
        instagram,
        marketplace,
        logoUrl,
      }).returning();
      umkm = inserted[0];
    } else {
      const updated = await db.update(umkmProfiles).set({
        businessName,
        ownerName,
        whatsapp,
        email,
        cityRegency,
        district,
        address,
        establishedYear: establishedYear ? Number(establishedYear) : null,
        businessSector,
        commodity,
        description,
        nib,
        instagram,
        marketplace,
        logoUrl,
        updatedAt: new Date(),
      }).where(eq(umkmProfiles.id, umkm.id)).returning();
      umkm = updated[0];
    }

    await logAudit(req.profile!.id, 'UPDATE_UMKM_PROFILE', 'umkm_profiles', umkm.id);
    res.json({ message: 'Profil UMKM berhasil diperbarui', umkm });
  } catch (error: any) {
    console.error('Error updating UMKM profile:', error);
    res.status(500).json({ error: 'Gagal memperbarui profil UMKM' });
  }
});

// Update Mentor Profile
apiRouter.post('/profile/mentor', requireAuth, requireRole(['MENTOR', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { fullName, whatsapp, institution, position, bio, expertise, photoUrl } = req.body;
    const profileId = req.profile!.id;
    let mentor = req.mentor;

    if (!mentor) {
      const inserted = await db.insert(mentorProfiles).values({
        profileId,
        fullName: fullName || req.profile!.fullName,
        email: req.profile!.email,
        whatsapp,
        institution,
        position,
        bio,
        expertise,
        photoUrl,
      }).returning();
      mentor = inserted[0];
    } else {
      const updated = await db.update(mentorProfiles).set({
        fullName,
        whatsapp,
        institution,
        position,
        bio,
        expertise,
        photoUrl,
        updatedAt: new Date(),
      }).where(eq(mentorProfiles.id, mentor.id)).returning();
      mentor = updated[0];
    }

    await logAudit(req.profile!.id, 'UPDATE_MENTOR_PROFILE', 'mentor_profiles', mentor.id);
    res.json({ message: 'Profil Mentor berhasil diperbarui', mentor });
  } catch (error: any) {
    console.error('Error updating Mentor profile:', error);
    res.status(500).json({ error: 'Gagal memperbarui profil mentor' });
  }
});

// ==========================================
// 2. PRODUCTS API (UMKM only for own products)
// ==========================================

apiRouter.get('/products', requireAuth, async (req: AuthRequest, res) => {
  try {
    let targetUmkmId: number | null = null;

    if (req.profile!.role === 'UMKM') {
      if (!req.umkm) return res.json([]);
      targetUmkmId = req.umkm.id;
    } else if (req.query.umkmId) {
      targetUmkmId = Number(req.query.umkmId);
    } else {
      return res.status(400).json({ error: 'Parameter umkmId diperlukan.' });
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.umkmId, targetUmkmId))
      .orderBy(desc(products.createdAt));

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
});

apiRouter.post('/products', requireAuth, requireRole(['UMKM']), async (req: AuthRequest, res) => {
  try {
    if (!req.umkm) return res.status(400).json({ error: 'Profil usaha UMKM belum aktif' });

    const { name, sku, unit, defaultSellingPrice, defaultHpp, status } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nama produk wajib diisi' });
    }

    const price = Number(defaultSellingPrice) || 0;
    const hpp = Number(defaultHpp) || 0;

    const inserted = await db.insert(products).values({
      umkmId: req.umkm.id,
      name: name.trim(),
      sku: sku ? sku.trim() : null,
      unit: unit ? unit.trim() : 'pcs',
      defaultSellingPrice: price,
      defaultHpp: hpp,
      status: status || 'ACTIVE',
    }).returning();

    await logAudit(req.profile!.id, 'CREATE_PRODUCT', 'products', inserted[0].id, { name });
    res.status(201).json({ message: 'Produk berhasil ditambahkan', product: inserted[0] });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Gagal menambahkan produk' });
  }
});

apiRouter.put('/products/:id', requireAuth, requireRole(['UMKM']), async (req: AuthRequest, res) => {
  try {
    if (!req.umkm) return res.status(400).json({ error: 'Profil usaha UMKM belum aktif' });
    const productId = Number(req.params.id);

    // Verify ownership
    const existing = await db.select().from(products).where(and(eq(products.id, productId), eq(products.umkmId, req.umkm.id))).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan atau bukan milik Anda' });
    }

    const { name, sku, unit, defaultSellingPrice, defaultHpp, status } = req.body;

    const updated = await db.update(products).set({
      name: name?.trim() || existing[0].name,
      sku: sku !== undefined ? sku?.trim() : existing[0].sku,
      unit: unit?.trim() || existing[0].unit,
      defaultSellingPrice: defaultSellingPrice !== undefined ? Number(defaultSellingPrice) : existing[0].defaultSellingPrice,
      defaultHpp: defaultHpp !== undefined ? Number(defaultHpp) : existing[0].defaultHpp,
      status: status || existing[0].status,
      updatedAt: new Date(),
    }).where(eq(products.id, productId)).returning();

    await logAudit(req.profile!.id, 'UPDATE_PRODUCT', 'products', productId);
    res.json({ message: 'Produk berhasil diperbarui', product: updated[0] });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Gagal memperbarui produk' });
  }
});

apiRouter.delete('/products/:id', requireAuth, requireRole(['UMKM']), async (req: AuthRequest, res) => {
  try {
    if (!req.umkm) return res.status(400).json({ error: 'Profil usaha UMKM belum aktif' });
    const productId = Number(req.params.id);

    // Verify ownership
    const existing = await db.select().from(products).where(and(eq(products.id, productId), eq(products.umkmId, req.umkm.id))).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan atau bukan milik Anda' });
    }

    // Check if used in transactions
    const usedInSales = await db.select().from(saleItems).where(eq(saleItems.productId, productId)).limit(1);
    if (usedInSales.length > 0) {
      // Set INACTIVE instead of deleting
      await db.update(products).set({ status: 'INACTIVE', updatedAt: new Date() }).where(eq(products.id, productId));
      return res.json({ message: 'Produk memiliki riwayat transaksi, status diubah menjadi Nonaktif agar riwayat penjualan tetap terjaga.' });
    }

    await db.delete(products).where(eq(products.id, productId));
    await logAudit(req.profile!.id, 'DELETE_PRODUCT', 'products', productId);
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Gagal menghapus produk' });
  }
});

// ==========================================
// 3. SALES CHANNELS & TRANSACTIONS API
// ==========================================

apiRouter.get('/sales-channels', async (req, res) => {
  try {
    const list = await db.select().from(salesChannels).where(eq(salesChannels.isActive, true)).orderBy(salesChannels.sortOrder);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching sales channels:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar channel penjualan' });
  }
});

apiRouter.get('/sales', requireAuth, async (req: AuthRequest, res) => {
  try {
    let targetUmkmId: number | null = null;

    if (req.profile!.role === 'UMKM') {
      if (!req.umkm) return res.json([]);
      targetUmkmId = req.umkm.id;
    } else if (req.query.umkmId && req.query.umkmId !== 'all') {
      targetUmkmId = Number(req.query.umkmId);
      // If mentor, verify active assignment
      if (req.profile!.role === 'MENTOR') {
        const assignment = await db
          .select()
          .from(mentorAssignments)
          .where(
            and(
              eq(mentorAssignments.mentorId, req.mentor!.id),
              eq(mentorAssignments.umkmId, targetUmkmId),
              eq(mentorAssignments.status, 'ACTIVE')
            )
          )
          .limit(1);

        if (assignment.length === 0) {
          return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki assignment aktif ke UMKM ini.' });
        }
      }
    } else if (req.profile!.role === 'ADMIN') {
      // Admin is querying overall transactions across all UMKMs
      targetUmkmId = null;
    } else {
      return res.status(400).json({ error: 'Parameter umkmId diperlukan.' });
    }

    const { startDate, endDate, channelId, search, programId } = req.query;

    let conditions: any[] = [isNull(sales.deletedAt)];

    if (targetUmkmId !== null && !isNaN(targetUmkmId)) {
      conditions.push(eq(sales.umkmId, targetUmkmId));
    }

    if (startDate) {
      conditions.push(gte(sales.transactionDate, String(startDate)));
    }
    if (endDate) {
      conditions.push(lte(sales.transactionDate, String(endDate)));
    }
    if (channelId && Number(channelId) > 0) {
      conditions.push(eq(sales.salesChannelId, Number(channelId)));
    }

    // Program filter support
    if (programId && Number(programId) > 0) {
      const progUmkms = await db
        .select({ umkmId: mentorAssignments.umkmId })
        .from(mentorAssignments)
        .where(eq(mentorAssignments.programId, Number(programId)));

      const progUmkmIds = Array.from(new Set(progUmkms.map((p) => p.umkmId)));
      if (progUmkmIds.length > 0) {
        conditions.push(inArray(sales.umkmId, progUmkmIds));
      } else {
        return res.json([]);
      }
    }

    const salesList = await db
      .select({
        id: sales.id,
        umkmId: sales.umkmId,
        transactionDate: sales.transactionDate,
        salesChannelId: sales.salesChannelId,
        customerName: sales.customerName,
        notes: sales.notes,
        subtotal: sales.subtotal,
        discountType: sales.discountType,
        discountValue: sales.discountValue,
        discountAmount: sales.discountAmount,
        shippingFee: sales.shippingFee,
        taxType: sales.taxType,
        taxValue: sales.taxValue,
        taxAmount: sales.taxAmount,
        otherFee: sales.otherFee,
        totalRevenue: sales.totalRevenue,
        totalHpp: sales.totalHpp,
        grossProfit: sales.grossProfit,
        createdAt: sales.createdAt,
        channelName: salesChannels.name,
        businessName: umkmProfiles.businessName,
        ownerName: umkmProfiles.ownerName,
        cityRegency: umkmProfiles.cityRegency,
        businessSector: umkmProfiles.businessSector,
      })
      .from(sales)
      .leftJoin(salesChannels, eq(sales.salesChannelId, salesChannels.id))
      .leftJoin(umkmProfiles, eq(sales.umkmId, umkmProfiles.id))
      .where(and(...conditions))
      .orderBy(desc(sales.transactionDate), desc(sales.id));

    // Fetch items for each sale
    const saleIds = salesList.map((s) => s.id);
    let itemsMap: Record<number, any[]> = {};

    if (saleIds.length > 0) {
      const items = await db
        .select()
        .from(saleItems)
        .where(inArray(saleItems.saleId, saleIds));

      items.forEach((item) => {
        if (!itemsMap[item.saleId]) itemsMap[item.saleId] = [];
        itemsMap[item.saleId].push(item);
      });
    }

    let result = salesList.map((s) => ({
      ...s,
      items: itemsMap[s.id] || [],
    }));

    // In-memory search for customer, product snapshot, business name, or notes
    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      result = result.filter((s) => {
        return (
          String(s.id).includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          (s.businessName && s.businessName.toLowerCase().includes(q)) ||
          (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q)) ||
          (s.channelName && s.channelName.toLowerCase().includes(q)) ||
          s.items.some((it: any) => it.productNameSnapshot && it.productNameSnapshot.toLowerCase().includes(q))
        );
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Gagal mengambil riwayat transaksi' });
  }
});

// Single sale detail
apiRouter.get('/sales/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const saleId = Number(req.params.id);
    const saleRes = await db
      .select({
        id: sales.id,
        umkmId: sales.umkmId,
        transactionDate: sales.transactionDate,
        salesChannelId: sales.salesChannelId,
        customerName: sales.customerName,
        notes: sales.notes,
        subtotal: sales.subtotal,
        discountType: sales.discountType,
        discountValue: sales.discountValue,
        discountAmount: sales.discountAmount,
        shippingFee: sales.shippingFee,
        taxType: sales.taxType,
        taxValue: sales.taxValue,
        taxAmount: sales.taxAmount,
        otherFee: sales.otherFee,
        totalRevenue: sales.totalRevenue,
        totalHpp: sales.totalHpp,
        grossProfit: sales.grossProfit,
        createdAt: sales.createdAt,
        channelName: salesChannels.name,
        businessName: umkmProfiles.businessName,
        ownerName: umkmProfiles.ownerName,
        whatsapp: umkmProfiles.whatsapp,
        email: umkmProfiles.email,
        cityRegency: umkmProfiles.cityRegency,
        district: umkmProfiles.district,
        address: umkmProfiles.address,
        businessSector: umkmProfiles.businessSector,
        commodity: umkmProfiles.commodity,
      })
      .from(sales)
      .leftJoin(salesChannels, eq(sales.salesChannelId, salesChannels.id))
      .leftJoin(umkmProfiles, eq(sales.umkmId, umkmProfiles.id))
      .where(eq(sales.id, saleId))
      .limit(1);

    if (saleRes.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    const saleData = saleRes[0];

    // Authorization check
    if (req.profile!.role === 'UMKM') {
      if (!req.umkm || req.umkm.id !== saleData.umkmId) {
        return res.status(403).json({ error: 'Akses ditolak: Transaksi bukan milik UMKM Anda' });
      }
    } else if (req.profile!.role === 'MENTOR') {
      const assignment = await db
        .select()
        .from(mentorAssignments)
        .where(
          and(
            eq(mentorAssignments.mentorId, req.mentor!.id),
            eq(mentorAssignments.umkmId, saleData.umkmId),
            eq(mentorAssignments.status, 'ACTIVE')
          )
        )
        .limit(1);

      if (assignment.length === 0) {
        return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki assignment aktif ke UMKM ini.' });
      }
    }
    // ADMIN has unrestricted access

    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));

    res.json({
      ...saleData,
      items,
    });
  } catch (error: any) {
    console.error('Error fetching sale detail:', error);
    res.status(500).json({ error: 'Gagal mengambil detail transaksi' });
  }
});

// Create Sale (Strict HPP snapshot, calculation, multi-product)
apiRouter.post('/sales', requireAuth, requireRole(['UMKM']), async (req: AuthRequest, res) => {
  try {
    if (!req.umkm) return res.status(400).json({ error: 'Profil usaha UMKM belum aktif' });

    const {
      transactionDate,
      salesChannelId,
      customerName,
      notes,
      items,
      discountType = 'NOMINAL',
      discountValue = 0,
      shippingFee = 0,
      taxType = 'PERCENTAGE',
      taxValue = 0,
      otherFee = 0,
    } = req.body;

    if (!transactionDate) {
      return res.status(400).json({ error: 'Tanggal transaksi wajib diisi (YYYY-MM-DD)' });
    }
    if (!salesChannelId) {
      return res.status(400).json({ error: 'Channel penjualan wajib dipilih' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Transaksi wajib memiliki minimal 1 item produk' });
    }

    // Fetch products to verify ownership & snapshot HPP and name
    const productIds = items.map((i: any) => Number(i.productId));
    const dbProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.umkmId, req.umkm.id), inArray(products.id, productIds)));

    const productMap = new Map<number, typeof products.$inferSelect>();
    dbProducts.forEach((p) => productMap.set(p.id, p));

    // Calculate totals on server (Never trust client totals!)
    let calculatedSubtotal = 0;
    let calculatedTotalHpp = 0;
    const processedItems: Array<{
      productId: number;
      productNameSnapshot: string;
      quantity: number;
      sellingPrice: number;
      hppSnapshot: number;
      subtotal: number;
      totalHpp: number;
      grossProfit: number;
    }> = [];

    for (const item of items) {
      const pId = Number(item.productId);
      const prod = productMap.get(pId);
      if (!prod) {
        return res.status(400).json({ error: `Produk ID #${pId} tidak valid atau bukan milik UMKM Anda` });
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: `Quantity untuk produk ${prod.name} harus lebih dari 0` });
      }

      // Selling price: user specified or default
      const sellingPrice = (item.sellingPrice !== undefined && item.sellingPrice !== null && !isNaN(Number(item.sellingPrice)))
        ? Number(item.sellingPrice)
        : prod.defaultSellingPrice;

      // HPP snapshot from product master at time of transaction
      const hppSnapshot = prod.defaultHpp;

      const subtotal = sellingPrice * qty;
      const itemTotalHpp = hppSnapshot * qty;
      const itemGrossProfit = subtotal - itemTotalHpp;

      calculatedSubtotal += subtotal;
      calculatedTotalHpp += itemTotalHpp;

      processedItems.push({
        productId: pId,
        productNameSnapshot: prod.name,
        quantity: qty,
        sellingPrice,
        hppSnapshot,
        subtotal,
        totalHpp: itemTotalHpp,
        grossProfit: itemGrossProfit,
      });
    }

    // 1. Discount calculation
    let calculatedDiscountAmount = 0;
    const discVal = Math.max(0, Number(discountValue) || 0);
    if (discountType === 'PERCENTAGE') {
      const pct = Math.min(100, discVal);
      calculatedDiscountAmount = Math.round((calculatedSubtotal * pct) / 100);
    } else {
      calculatedDiscountAmount = Math.min(calculatedSubtotal, discVal);
    }

    const netSales = Math.max(0, calculatedSubtotal - calculatedDiscountAmount);

    // 2. Shipping Fee
    const calculatedShippingFee = Math.max(0, Number(shippingFee) || 0);

    // 3. Tax calculation
    let calculatedTaxAmount = 0;
    const tVal = Math.max(0, Number(taxValue) || 0);
    if (taxType === 'PERCENTAGE') {
      calculatedTaxAmount = Math.round((netSales * tVal) / 100);
    } else {
      calculatedTaxAmount = tVal;
    }

    // 4. Other Fee
    const calculatedOtherFee = Math.max(0, Number(otherFee) || 0);

    // 5. Final totals
    const finalTotalRevenue = netSales + calculatedShippingFee + calculatedTaxAmount + calculatedOtherFee;
    const finalGrossProfit = netSales - calculatedTotalHpp;

    // Insert sale with automatic sequence retry
    let insertedSale;
    try {
      insertedSale = await db
        .insert(sales)
        .values({
          umkmId: req.umkm.id,
          transactionDate: String(transactionDate),
          salesChannelId: Number(salesChannelId),
          customerName: customerName ? String(customerName).trim() : null,
          notes: notes ? String(notes).trim() : null,
          subtotal: calculatedSubtotal,
          discountType: String(discountType),
          discountValue: Number(discountValue) || 0,
          discountAmount: calculatedDiscountAmount,
          shippingFee: calculatedShippingFee,
          taxType: String(taxType),
          taxValue: Number(taxValue) || 0,
          taxAmount: calculatedTaxAmount,
          otherFee: calculatedOtherFee,
          totalRevenue: finalTotalRevenue,
          totalHpp: calculatedTotalHpp,
          grossProfit: finalGrossProfit,
        })
        .returning();
    } catch (insertErr: any) {
      if (insertErr?.message?.includes('duplicate key') || insertErr?.code === '23505') {
        console.warn('Auto-resolving sequence collision in sales table...');
        await ensureSequencesSynced();
        insertedSale = await db
          .insert(sales)
          .values({
            umkmId: req.umkm.id,
            transactionDate: String(transactionDate),
            salesChannelId: Number(salesChannelId),
            customerName: customerName ? String(customerName).trim() : null,
            notes: notes ? String(notes).trim() : null,
            subtotal: calculatedSubtotal,
            discountType: String(discountType),
            discountValue: Number(discountValue) || 0,
            discountAmount: calculatedDiscountAmount,
            shippingFee: calculatedShippingFee,
            taxType: String(taxType),
            taxValue: Number(taxValue) || 0,
            taxAmount: calculatedTaxAmount,
            otherFee: calculatedOtherFee,
            totalRevenue: finalTotalRevenue,
            totalHpp: calculatedTotalHpp,
            grossProfit: finalGrossProfit,
          })
          .returning();
      } else {
        throw insertErr;
      }
    }

    const saleId = insertedSale[0].id;

    // Insert sale items
    const itemsToInsert = processedItems.map((item) => ({
      saleId,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      hppSnapshot: item.hppSnapshot,
      subtotal: item.subtotal,
      totalHpp: item.totalHpp,
      grossProfit: item.grossProfit,
    }));

    try {
      await db.insert(saleItems).values(itemsToInsert);
    } catch (itemsErr: any) {
      if (itemsErr?.message?.includes('duplicate key') || itemsErr?.code === '23505') {
        console.warn('Auto-resolving sequence collision in sale_items table...');
        await ensureSequencesSynced();
        await db.insert(saleItems).values(itemsToInsert);
      } else {
        throw itemsErr;
      }
    }

    await logAudit(req.profile!.id, 'CREATE_SALE', 'sales', saleId, {
      totalRevenue: finalTotalRevenue,
      grossProfit: finalGrossProfit,
    });

    res.status(201).json({
      message: 'Transaksi berhasil disimpan',
      sale: {
        ...insertedSale[0],
        items: processedItems,
      },
    });
  } catch (error: any) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Gagal menyimpan transaksi' });
  }
});

// Delete Sale (Soft delete)
apiRouter.delete('/sales/:id', requireAuth, requireRole(['UMKM', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const saleId = Number(req.params.id);
    const existing = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    if (req.profile!.role === 'UMKM') {
      if (!req.umkm || req.umkm.id !== existing[0].umkmId) {
        return res.status(403).json({ error: 'Akses ditolak: Transaksi ini bukan milik UMKM Anda' });
      }
    }

    await db.update(sales).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(sales.id, saleId));

    await logAudit(req.profile!.id, 'DELETE_SALE', 'sales', saleId);
    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Gagal menghapus transaksi' });
  }
});

// ==========================================
// 4. ANALYTICS & DASHBOARD API
// ==========================================

apiRouter.get('/analytics/umkm', requireAuth, async (req: AuthRequest, res) => {
  try {
    let targetUmkmId: number;

    if (req.profile!.role === 'UMKM') {
      if (!req.umkm) return res.status(400).json({ error: 'Profil usaha belum ditemukan' });
      targetUmkmId = req.umkm.id;
    } else if (req.query.umkmId) {
      targetUmkmId = Number(req.query.umkmId);
      if (req.profile!.role === 'MENTOR') {
        const assignment = await db
          .select()
          .from(mentorAssignments)
          .where(
            and(
              eq(mentorAssignments.mentorId, req.mentor!.id),
              eq(mentorAssignments.umkmId, targetUmkmId),
              eq(mentorAssignments.status, 'ACTIVE')
            )
          )
          .limit(1);

        if (assignment.length === 0) {
          return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki pendampingan aktif ke UMKM ini' });
        }
      }
    } else {
      return res.status(400).json({ error: 'Parameter umkmId diperlukan.' });
    }

    const { filter = 'this_month', startDate, endDate } = req.query;

    // Date range calculation
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let start = '';
    let end = toYMD(now);
    let prevStart = '';
    let prevEnd = '';

    if (filter === 'today') {
      start = toYMD(now);
      end = toYMD(now);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      prevStart = toYMD(yesterday);
      prevEnd = toYMD(yesterday);
    } else if (filter === '7days') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      start = toYMD(past7);
      const prevPast7 = new Date(past7);
      prevPast7.setDate(prevPast7.getDate() - 7);
      prevStart = toYMD(prevPast7);
      const prevPastEnd = new Date(past7);
      prevPastEnd.setDate(prevPastEnd.getDate() - 1);
      prevEnd = toYMD(prevPastEnd);
    } else if (filter === 'this_month') {
      start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      prevStart = toYMD(prevMonthDate);
      prevEnd = toYMD(prevMonthEnd);
    } else if (filter === 'last_month') {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      start = toYMD(lastMonthStart);
      end = toYMD(lastMonthEnd);
      const prev2MonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const prev2MonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      prevStart = toYMD(prev2MonthStart);
      prevEnd = toYMD(prev2MonthEnd);
    } else if (filter === 'this_year') {
      start = `${now.getFullYear()}-01-01`;
      prevStart = `${now.getFullYear() - 1}-01-01`;
      prevEnd = `${now.getFullYear() - 1}-12-31`;
    } else if (filter === 'custom' && startDate && endDate) {
      start = String(startDate);
      end = String(endDate);
    } else {
      start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    }

    // Query current period sales
    const currentSales = await db
      .select({
        id: sales.id,
        transactionDate: sales.transactionDate,
        totalRevenue: sales.totalRevenue,
        totalHpp: sales.totalHpp,
        grossProfit: sales.grossProfit,
        salesChannelId: sales.salesChannelId,
        channelName: salesChannels.name,
      })
      .from(sales)
      .leftJoin(salesChannels, eq(sales.salesChannelId, salesChannels.id))
      .where(
        and(
          eq(sales.umkmId, targetUmkmId),
          isNull(sales.deletedAt),
          gte(sales.transactionDate, start),
          lte(sales.transactionDate, end)
        )
      )
      .orderBy(sales.transactionDate);

    // Query items for these sales
    const currentSaleIds = currentSales.map((s) => s.id);
    let currentItems: Array<typeof saleItems.$inferSelect> = [];
    if (currentSaleIds.length > 0) {
      currentItems = await db
        .select()
        .from(saleItems)
        .where(inArray(saleItems.saleId, currentSaleIds));
    }

    // Calculate Current KPIs
    const totalRevenue = currentSales.reduce((acc, s) => acc + s.totalRevenue, 0);
    const totalHpp = currentSales.reduce((acc, s) => acc + s.totalHpp, 0);
    const grossProfit = totalRevenue - totalHpp;
    const totalTransactions = currentSales.length;
    const totalQuantity = currentItems.reduce((acc, i) => acc + i.quantity, 0);
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Previous period revenue for Growth calculation
    let prevRevenue = 0;
    if (prevStart && prevEnd) {
      const prevSales = await db
        .select({ totalRevenue: sales.totalRevenue })
        .from(sales)
        .where(
          and(
            eq(sales.umkmId, targetUmkmId),
            isNull(sales.deletedAt),
            gte(sales.transactionDate, prevStart),
            lte(sales.transactionDate, prevEnd)
          )
        );
      prevRevenue = prevSales.reduce((acc, s) => acc + s.totalRevenue, 0);
    }

    // Growth label calculation (respecting requirement 51)
    let growthRate: number | null = null;
    let growthLabel = '0%';
    if (prevRevenue === 0 && totalRevenue > 0) {
      growthLabel = 'Baru Ada Penjualan';
    } else if (prevRevenue === 0 && totalRevenue === 0) {
      growthLabel = '0%';
    } else {
      growthRate = ((totalRevenue - prevRevenue) / prevRevenue) * 100;
      growthLabel = `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`;
    }

    // Product Analytics Aggregations
    const productAgg: Record<
      number,
      {
        id: number;
        name: string;
        quantity: number;
        revenue: number;
        hpp: number;
        grossProfit: number;
        margin: number;
      }
    > = {};

    currentItems.forEach((item) => {
      if (!productAgg[item.productId]) {
        productAgg[item.productId] = {
          id: item.productId,
          name: item.productNameSnapshot,
          quantity: 0,
          revenue: 0,
          hpp: 0,
          grossProfit: 0,
          margin: 0,
        };
      }
      productAgg[item.productId].quantity += item.quantity;
      productAgg[item.productId].revenue += item.subtotal;
      productAgg[item.productId].hpp += item.totalHpp;
      productAgg[item.productId].grossProfit += item.grossProfit;
    });

    const productList = Object.values(productAgg).map((p) => ({
      ...p,
      margin: p.revenue > 0 ? (p.grossProfit / p.revenue) * 100 : 0,
    }));

    // Top Rankings (Requirement 31)
    const topByQuantity = [...productList].sort((a, b) => b.quantity - a.quantity)[0] || null;
    const topByRevenue = [...productList].sort((a, b) => b.revenue - a.revenue)[0] || null;
    const topByGrossProfit = [...productList].sort((a, b) => b.grossProfit - a.grossProfit)[0] || null;
    const topByMargin = [...productList].sort((a, b) => b.margin - a.margin)[0] || null;

    // Channel Analytics Aggregations (Requirement 32)
    const channelAgg: Record<
      string,
      {
        channelName: string;
        revenue: number;
        hpp: number;
        grossProfit: number;
        transactions: number;
      }
    > = {};

    currentSales.forEach((sale) => {
      const cName = sale.channelName || 'Lainnya';
      if (!channelAgg[cName]) {
        channelAgg[cName] = {
          channelName: cName,
          revenue: 0,
          hpp: 0,
          grossProfit: 0,
          transactions: 0,
        };
      }
      channelAgg[cName].revenue += sale.totalRevenue;
      channelAgg[cName].hpp += sale.totalHpp;
      channelAgg[cName].grossProfit += sale.grossProfit;
      channelAgg[cName].transactions += 1;
    });

    const channelList = Object.values(channelAgg);
    const topChannelByRevenue = [...channelList].sort((a, b) => b.revenue - a.revenue)[0] || null;
    const topChannelByProfit = [...channelList].sort((a, b) => b.grossProfit - a.grossProfit)[0] || null;
    const topChannelByTransactions = [...channelList].sort((a, b) => b.transactions - a.transactions)[0] || null;

    // Daily Trend for Charts (Requirement 33)
    const trendMap: Record<string, { date: string; omzet: number; labaKotor: number }> = {};
    currentSales.forEach((sale) => {
      if (!trendMap[sale.transactionDate]) {
        trendMap[sale.transactionDate] = {
          date: sale.transactionDate,
          omzet: 0,
          labaKotor: 0,
        };
      }
      trendMap[sale.transactionDate].omzet += sale.totalRevenue;
      trendMap[sale.transactionDate].labaKotor += sale.grossProfit;
    });

    const trend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period: {
        filter,
        start,
        end,
      },
      kpi: {
        totalRevenue,
        totalHpp,
        grossProfit,
        grossProfitMargin,
        totalTransactions,
        totalQuantity,
        averageTransactionValue,
        growthLabel,
        growthRate,
        prevRevenue,
      },
      products: {
        list: productList,
        topByQuantity,
        topByRevenue,
        topByGrossProfit,
        topByMargin,
      },
      channels: {
        list: channelList,
        topByRevenue: topChannelByRevenue,
        topByProfit: topChannelByProfit,
        topByTransactions: topChannelByTransactions,
      },
      trend,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Gagal mengambil data analitik' });
  }
});

// ==========================================
// 5. PROGRAMS, PARTICIPANTS & ASSIGNMENTS API
// ==========================================

apiRouter.get('/programs', requireAuth, async (req: AuthRequest, res) => {
  try {
    const list = await db.select().from(programs).orderBy(desc(programs.createdAt));
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar program' });
  }
});

apiRouter.get('/programs/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const programId = Number(req.params.id);
    const prog = await db.select().from(programs).where(eq(programs.id, programId)).limit(1);
    if (prog.length === 0) {
      return res.status(404).json({ error: 'Program tidak ditemukan' });
    }

    // Get all active participants
    const participants = await db
      .select({
        id: programParticipants.id,
        participantRole: programParticipants.participantRole,
        status: programParticipants.status,
        joinedAt: programParticipants.joinedAt,
        fullName: profiles.fullName,
        email: profiles.email,
        profileId: profiles.id,
      })
      .from(programParticipants)
      .innerJoin(profiles, eq(programParticipants.profileId, profiles.id))
      .where(and(eq(programParticipants.programId, programId), eq(programParticipants.status, 'ACTIVE')));

    // Get assignments
    const assignments = await db
      .select({
        id: mentorAssignments.id,
        mentorId: mentorAssignments.mentorId,
        umkmId: mentorAssignments.umkmId,
        status: mentorAssignments.status,
        assignedAt: mentorAssignments.assignedAt,
        mentorName: mentorProfiles.fullName,
        mentorEmail: mentorProfiles.email,
        businessName: umkmProfiles.businessName,
        ownerName: umkmProfiles.ownerName,
        cityRegency: umkmProfiles.cityRegency,
        businessSector: umkmProfiles.businessSector,
      })
      .from(mentorAssignments)
      .innerJoin(mentorProfiles, eq(mentorAssignments.mentorId, mentorProfiles.id))
      .innerJoin(umkmProfiles, eq(mentorAssignments.umkmId, umkmProfiles.id))
      .where(and(eq(mentorAssignments.programId, programId), eq(mentorAssignments.status, 'ACTIVE')));

    // Build assignment lookup by umkmId
    const assignmentMap = new Map<number, typeof assignments[0]>();
    for (const a of assignments) {
      assignmentMap.set(a.umkmId, a);
    }

    // Build mentor assigned counts lookup
    const mentorCountMap = new Map<number, number>();
    for (const a of assignments) {
      mentorCountMap.set(a.mentorId, (mentorCountMap.get(a.mentorId) || 0) + 1);
    }

    // Get detailed mentor profiles enrolled in this program
    const mentorProfileIds = participants
      .filter((p) => p.participantRole === 'MENTOR')
      .map((p) => p.profileId);

    let enrolledMentors: any[] = [];
    if (mentorProfileIds.length > 0) {
      const mProfiles = await db
        .select()
        .from(mentorProfiles)
        .where(inArray(mentorProfiles.profileId, mentorProfileIds));

      enrolledMentors = mProfiles.map((m) => ({
        ...m,
        assignedUmkmCount: mentorCountMap.get(m.id) || 0,
      }));
    }

    // Get detailed UMKM profiles enrolled in this program
    const umkmProfileIds = participants
      .filter((p) => p.participantRole === 'UMKM')
      .map((p) => p.profileId);

    let enrolledUmkms: any[] = [];
    if (umkmProfileIds.length > 0) {
      const uProfiles = await db
        .select()
        .from(umkmProfiles)
        .where(inArray(umkmProfiles.profileId, umkmProfileIds));

      enrolledUmkms = uProfiles.map((u) => {
        const assign = assignmentMap.get(u.id);
        return {
          ...u,
          assignmentId: assign?.id || null,
          assignedMentorId: assign?.mentorId || null,
          assignedMentorName: assign?.mentorName || null,
          assignedMentorEmail: assign?.mentorEmail || null,
          assignedAt: assign?.assignedAt || null,
        };
      });
    }

    const assignedUmkmsCount = enrolledUmkms.filter((u) => u.assignedMentorId !== null).length;
    const unassignedUmkmsCount = enrolledUmkms.length - assignedUmkmsCount;

    res.json({
      program: prog[0],
      participants,
      mentors: enrolledMentors,
      umkms: enrolledUmkms,
      assignments,
      stats: {
        totalUmkms: enrolledUmkms.length,
        totalMentors: enrolledMentors.length,
        assignedUmkmsCount,
        unassignedUmkmsCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching program detail:', error);
    res.status(500).json({ error: 'Gagal mengambil detail program' });
  }
});

apiRouter.post('/programs', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { name, description, organizer, startDate, endDate, status, mentorIds } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nama program wajib diisi' });
    }

    const inserted = await db
      .insert(programs)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        organizer: organizer?.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || 'ACTIVE',
        createdBy: req.profile!.id,
      })
      .returning();

    const newProgramId = inserted[0].id;

    // Direct addition of multiple mentors into the new program
    if (Array.isArray(mentorIds) && mentorIds.length > 0) {
      const selectedMentors = await db
        .select({ id: mentorProfiles.id, profileId: mentorProfiles.profileId })
        .from(mentorProfiles)
        .where(inArray(mentorProfiles.id, mentorIds.map(Number)));

      for (const m of selectedMentors) {
        await db.insert(programParticipants).values({
          programId: newProgramId,
          profileId: m.profileId,
          participantRole: 'MENTOR',
          status: 'ACTIVE',
        });
      }
    }

    await logAudit(req.profile!.id, 'CREATE_PROGRAM', 'programs', newProgramId, {
      name,
      initialMentorsCount: Array.isArray(mentorIds) ? mentorIds.length : 0,
    });

    res.status(201).json({ message: 'Program berhasil dibuat', program: inserted[0] });
  } catch (error: any) {
    console.error('Error creating program:', error);
    res.status(500).json({ error: 'Gagal membuat program' });
  }
});

// Add multiple mentors to an existing program
apiRouter.post('/programs/:id/mentors', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const programId = Number(req.params.id);
    const { mentorIds } = req.body;

    if (!Array.isArray(mentorIds) || mentorIds.length === 0) {
      return res.status(400).json({ error: 'Daftar mentor wajib dipilih' });
    }

    const numericMentorIds = mentorIds.map(Number).filter((n) => !isNaN(n));
    if (numericMentorIds.length === 0) {
      return res.status(400).json({ error: 'ID mentor tidak valid' });
    }

    const mentors = await db
      .select({ id: mentorProfiles.id, profileId: mentorProfiles.profileId, fullName: mentorProfiles.fullName })
      .from(mentorProfiles)
      .where(inArray(mentorProfiles.id, numericMentorIds));

    let addedCount = 0;
    for (const m of mentors) {
      const existing = await db
        .select()
        .from(programParticipants)
        .where(
          and(
            eq(programParticipants.programId, programId),
            eq(programParticipants.profileId, m.profileId),
            eq(programParticipants.participantRole, 'MENTOR')
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(programParticipants).values({
          programId,
          profileId: m.profileId,
          participantRole: 'MENTOR',
          status: 'ACTIVE',
        });
        addedCount++;
      } else if (existing[0].status !== 'ACTIVE') {
        await db
          .update(programParticipants)
          .set({ status: 'ACTIVE', removedAt: null })
          .where(eq(programParticipants.id, existing[0].id));
        addedCount++;
      }
    }

    await logAudit(req.profile!.id, 'ADD_MENTORS_TO_PROGRAM', 'programs', programId, {
      mentorIds: numericMentorIds,
      addedCount,
    });

    res.json({ message: `Berhasil menambahkan ${addedCount} mentor ke dalam program`, addedCount });
  } catch (error: any) {
    console.error('Error adding mentors to program:', error);
    res.status(500).json({ error: 'Gagal menambahkan mentor ke program' });
  }
});

// Remove mentor from program
apiRouter.delete('/programs/:id/mentors/:mentorId', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const programId = Number(req.params.id);
    const mentorId = Number(req.params.mentorId);

    const m = await db.select().from(mentorProfiles).where(eq(mentorProfiles.id, mentorId)).limit(1);
    if (m.length === 0) {
      return res.status(404).json({ error: 'Mentor tidak ditemukan' });
    }

    // Deactivate participant
    await db
      .update(programParticipants)
      .set({ status: 'INACTIVE', removedAt: new Date() })
      .where(
        and(
          eq(programParticipants.programId, programId),
          eq(programParticipants.profileId, m[0].profileId),
          eq(programParticipants.participantRole, 'MENTOR')
        )
      );

    // End active assignments for this mentor in this program
    await db
      .update(mentorAssignments)
      .set({ status: 'ENDED', endedAt: new Date() })
      .where(
        and(
          eq(mentorAssignments.programId, programId),
          eq(mentorAssignments.mentorId, mentorId),
          eq(mentorAssignments.status, 'ACTIVE')
        )
      );

    await logAudit(req.profile!.id, 'REMOVE_MENTOR_FROM_PROGRAM', 'programs', programId, { mentorId });
    res.json({ message: 'Mentor berhasil dihapus dari program' });
  } catch (error: any) {
    console.error('Error removing mentor from program:', error);
    res.status(500).json({ error: 'Gagal menghapus mentor dari program' });
  }
});

// Add multiple UMKMs to a program (called when viewing program detail)
apiRouter.post('/programs/:id/umkms', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const programId = Number(req.params.id);
    const { umkmIds } = req.body;

    if (!Array.isArray(umkmIds) || umkmIds.length === 0) {
      return res.status(400).json({ error: 'Daftar UMKM wajib dipilih' });
    }

    const numericUmkmIds = umkmIds.map(Number).filter((n) => !isNaN(n));
    if (numericUmkmIds.length === 0) {
      return res.status(400).json({ error: 'ID UMKM tidak valid' });
    }

    const umkms = await db
      .select({ id: umkmProfiles.id, profileId: umkmProfiles.profileId, businessName: umkmProfiles.businessName })
      .from(umkmProfiles)
      .where(inArray(umkmProfiles.id, numericUmkmIds));

    let addedCount = 0;
    for (const u of umkms) {
      const existing = await db
        .select()
        .from(programParticipants)
        .where(
          and(
            eq(programParticipants.programId, programId),
            eq(programParticipants.profileId, u.profileId),
            eq(programParticipants.participantRole, 'UMKM')
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(programParticipants).values({
          programId,
          profileId: u.profileId,
          participantRole: 'UMKM',
          status: 'ACTIVE',
        });
        addedCount++;
      } else if (existing[0].status !== 'ACTIVE') {
        await db
          .update(programParticipants)
          .set({ status: 'ACTIVE', removedAt: null })
          .where(eq(programParticipants.id, existing[0].id));
        addedCount++;
      }
    }

    await logAudit(req.profile!.id, 'ADD_UMKMS_TO_PROGRAM', 'programs', programId, {
      umkmIds: numericUmkmIds,
      addedCount,
    });

    res.json({ message: `Berhasil menambahkan ${addedCount} UMKM ke dalam program`, addedCount });
  } catch (error: any) {
    console.error('Error adding UMKMs to program:', error);
    res.status(500).json({ error: 'Gagal menambahkan UMKM ke program' });
  }
});

// Remove UMKM from program
apiRouter.delete('/programs/:id/umkms/:umkmId', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const programId = Number(req.params.id);
    const umkmId = Number(req.params.umkmId);

    const u = await db.select().from(umkmProfiles).where(eq(umkmProfiles.id, umkmId)).limit(1);
    if (u.length === 0) {
      return res.status(404).json({ error: 'UMKM tidak ditemukan' });
    }

    // Deactivate participant
    await db
      .update(programParticipants)
      .set({ status: 'INACTIVE', removedAt: new Date() })
      .where(
        and(
          eq(programParticipants.programId, programId),
          eq(programParticipants.profileId, u[0].profileId),
          eq(programParticipants.participantRole, 'UMKM')
        )
      );

    // End active assignment for this UMKM in this program
    await db
      .update(mentorAssignments)
      .set({ status: 'ENDED', endedAt: new Date() })
      .where(
        and(
          eq(mentorAssignments.programId, programId),
          eq(mentorAssignments.umkmId, umkmId),
          eq(mentorAssignments.status, 'ACTIVE')
        )
      );

    await logAudit(req.profile!.id, 'REMOVE_UMKM_FROM_PROGRAM', 'programs', programId, { umkmId });
    res.json({ message: 'UMKM berhasil dikeluarkan dari program' });
  } catch (error: any) {
    console.error('Error removing UMKM from program:', error);
    res.status(500).json({ error: 'Gagal mengeluarkan UMKM dari program' });
  }
});

apiRouter.put('/programs/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const programId = Number(req.params.id);
    const { name, description, organizer, startDate, endDate, status } = req.body;

    const updated = await db
      .update(programs)
      .set({
        name,
        description,
        organizer,
        startDate,
        endDate,
        status,
        updatedAt: new Date(),
      })
      .where(eq(programs.id, programId))
      .returning();

    await logAudit(req.profile!.id, 'UPDATE_PROGRAM', 'programs', programId);
    res.json({ message: 'Program berhasil diperbarui', program: updated[0] });
  } catch (error: any) {
    console.error('Error updating program:', error);
    res.status(500).json({ error: 'Gagal memperbarui program' });
  }
});

// Mentor Assignments
apiRouter.get('/assignments', requireAuth, async (req: AuthRequest, res) => {
  try {
    let conditions = [eq(mentorAssignments.status, 'ACTIVE')];

    if (req.profile!.role === 'MENTOR') {
      if (!req.mentor) return res.json([]);
      conditions.push(eq(mentorAssignments.mentorId, req.mentor.id));
    } else if (req.profile!.role === 'UMKM') {
      if (!req.umkm) return res.json([]);
      conditions.push(eq(mentorAssignments.umkmId, req.umkm.id));
    } else {
      if (req.query.mentorId && req.query.mentorId !== 'all') {
        conditions.push(eq(mentorAssignments.mentorId, Number(req.query.mentorId)));
      }
    }

    if (req.query.programId && req.query.programId !== 'all') {
      conditions.push(eq(mentorAssignments.programId, Number(req.query.programId)));
    }
    if (req.query.umkmId && req.query.umkmId !== 'all') {
      conditions.push(eq(mentorAssignments.umkmId, Number(req.query.umkmId)));
    }

    const list = await db
      .select({
        id: mentorAssignments.id,
        programId: mentorAssignments.programId,
        programName: programs.name,
        mentorId: mentorAssignments.mentorId,
        mentorName: mentorProfiles.fullName,
        mentorEmail: mentorProfiles.email,
        mentorPhotoUrl: mentorProfiles.photoUrl,
        mentorInstitution: mentorProfiles.institution,
        mentorPosition: mentorProfiles.position,
        mentorExpertise: mentorProfiles.expertise,
        umkmId: mentorAssignments.umkmId,
        businessName: umkmProfiles.businessName,
        ownerName: umkmProfiles.ownerName,
        cityRegency: umkmProfiles.cityRegency,
        businessSector: umkmProfiles.businessSector,
        assignedAt: mentorAssignments.assignedAt,
        status: mentorAssignments.status,
      })
      .from(mentorAssignments)
      .innerJoin(programs, eq(mentorAssignments.programId, programs.id))
      .innerJoin(mentorProfiles, eq(mentorAssignments.mentorId, mentorProfiles.id))
      .innerJoin(umkmProfiles, eq(mentorAssignments.umkmId, umkmProfiles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(list);
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Gagal mengambil penugasan pendampingan' });
  }
});

// Single assignment
apiRouter.post('/assignments', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { programId, mentorId, umkmId } = req.body;
    if (!programId || !mentorId || !umkmId) {
      return res.status(400).json({ error: 'Program, Mentor, dan UMKM wajib dipilih' });
    }

    const pId = Number(programId);
    const mId = Number(mentorId);
    const uId = Number(umkmId);

    // Auto-enroll mentor and umkm into program participants if not already enrolled
    const mentorRecord = await db.select().from(mentorProfiles).where(eq(mentorProfiles.id, mId)).limit(1);
    if (mentorRecord.length > 0) {
      const partM = await db
        .select()
        .from(programParticipants)
        .where(
          and(
            eq(programParticipants.programId, pId),
            eq(programParticipants.profileId, mentorRecord[0].profileId),
            eq(programParticipants.participantRole, 'MENTOR')
          )
        )
        .limit(1);

      if (partM.length === 0) {
        await db.insert(programParticipants).values({
          programId: pId,
          profileId: mentorRecord[0].profileId,
          participantRole: 'MENTOR',
          status: 'ACTIVE',
        });
      }
    }

    const umkmRecord = await db.select().from(umkmProfiles).where(eq(umkmProfiles.id, uId)).limit(1);
    if (umkmRecord.length > 0) {
      const partU = await db
        .select()
        .from(programParticipants)
        .where(
          and(
            eq(programParticipants.programId, pId),
            eq(programParticipants.profileId, umkmRecord[0].profileId),
            eq(programParticipants.participantRole, 'UMKM')
          )
        )
        .limit(1);

      if (partU.length === 0) {
        await db.insert(programParticipants).values({
          programId: pId,
          profileId: umkmRecord[0].profileId,
          participantRole: 'UMKM',
          status: 'ACTIVE',
        });
      }
    }

    // Check existing active assignment for this UMKM in this program
    const existing = await db
      .select()
      .from(mentorAssignments)
      .where(
        and(
          eq(mentorAssignments.programId, pId),
          eq(mentorAssignments.umkmId, uId),
          eq(mentorAssignments.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].mentorId === mId) {
        return res.status(200).json({ message: 'Mentor sudah ditugaskan ke UMKM ini.', assignment: existing[0] });
      }
      // Reassign: end previous assignment
      await db
        .update(mentorAssignments)
        .set({ status: 'ENDED', endedAt: new Date() })
        .where(eq(mentorAssignments.id, existing[0].id));
    }

    const inserted = await db
      .insert(mentorAssignments)
      .values({
        programId: pId,
        mentorId: mId,
        umkmId: uId,
        status: 'ACTIVE',
        createdBy: req.profile!.id,
      })
      .returning();

    await logAudit(req.profile!.id, 'ASSIGN_MENTOR', 'mentor_assignments', inserted[0].id, {
      programId: pId,
      mentorId: mId,
      umkmId: uId,
    });

    res.status(201).json({ message: 'Mentor berhasil ditugaskan ke UMKM', assignment: inserted[0] });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Gagal membuat penugasan mentor' });
  }
});

// Bulk assignment: Assign a mentor to MULTIPLE UMKMs simultaneously
apiRouter.post('/assignments/bulk', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { programId, mentorId, umkmIds } = req.body;
    if (!programId || !mentorId || !Array.isArray(umkmIds) || umkmIds.length === 0) {
      return res.status(400).json({ error: 'Program, Mentor, dan minimal 1 UMKM wajib dipilih' });
    }

    const pId = Number(programId);
    const mId = Number(mentorId);
    const numericUmkmIds = umkmIds.map(Number).filter((n) => !isNaN(n));

    if (numericUmkmIds.length === 0) {
      return res.status(400).json({ error: 'ID UMKM tidak valid' });
    }

    // Verify mentor exists
    const mentorRecord = await db.select().from(mentorProfiles).where(eq(mentorProfiles.id, mId)).limit(1);
    if (mentorRecord.length === 0) {
      return res.status(404).json({ error: 'Mentor tidak ditemukan' });
    }

    // Auto-enroll mentor in program participants if needed
    const partM = await db
      .select()
      .from(programParticipants)
      .where(
        and(
          eq(programParticipants.programId, pId),
          eq(programParticipants.profileId, mentorRecord[0].profileId),
          eq(programParticipants.participantRole, 'MENTOR')
        )
      )
      .limit(1);

    if (partM.length === 0) {
      await db.insert(programParticipants).values({
        programId: pId,
        profileId: mentorRecord[0].profileId,
        participantRole: 'MENTOR',
        status: 'ACTIVE',
      });
    }

    let assignedCount = 0;
    for (const uId of numericUmkmIds) {
      const umkmRecord = await db.select().from(umkmProfiles).where(eq(umkmProfiles.id, uId)).limit(1);
      if (umkmRecord.length === 0) continue;

      // Auto-enroll UMKM in program participants if needed
      const partU = await db
        .select()
        .from(programParticipants)
        .where(
          and(
            eq(programParticipants.programId, pId),
            eq(programParticipants.profileId, umkmRecord[0].profileId),
            eq(programParticipants.participantRole, 'UMKM')
          )
        )
        .limit(1);

      if (partU.length === 0) {
        await db.insert(programParticipants).values({
          programId: pId,
          profileId: umkmRecord[0].profileId,
          participantRole: 'UMKM',
          status: 'ACTIVE',
        });
      }

      // Check existing active assignment
      const existing = await db
        .select()
        .from(mentorAssignments)
        .where(
          and(
            eq(mentorAssignments.programId, pId),
            eq(mentorAssignments.umkmId, uId),
            eq(mentorAssignments.status, 'ACTIVE')
          )
        )
        .limit(1);

      if (existing.length > 0) {
        if (existing[0].mentorId === mId) {
          // Already assigned to this mentor
          assignedCount++;
          continue;
        }
        // End old assignment
        await db
          .update(mentorAssignments)
          .set({ status: 'ENDED', endedAt: new Date() })
          .where(eq(mentorAssignments.id, existing[0].id));
      }

      // Insert new assignment
      await db.insert(mentorAssignments).values({
        programId: pId,
        mentorId: mId,
        umkmId: uId,
        status: 'ACTIVE',
        createdBy: req.profile!.id,
      });

      assignedCount++;
    }

    await logAudit(req.profile!.id, 'BULK_ASSIGN_MENTOR', 'mentor_assignments', pId, {
      programId: pId,
      mentorId: mId,
      mentorName: mentorRecord[0].fullName,
      assignedCount,
      umkmIds: numericUmkmIds,
    });

    res.status(201).json({
      message: `Berhasil menugaskan ${mentorRecord[0].fullName} ke ${assignedCount} UMKM terpilih`,
      assignedCount,
    });
  } catch (error: any) {
    console.error('Error in bulk assignment:', error);
    res.status(500).json({ error: 'Gagal melakukan penugasan masal mentor' });
  }
});

// Delete or cancel an assignment
apiRouter.delete('/assignments/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const assignmentId = Number(req.params.id);
    await db
      .update(mentorAssignments)
      .set({
        status: 'ENDED',
        endedAt: new Date(),
      })
      .where(eq(mentorAssignments.id, assignmentId));

    await logAudit(req.profile!.id, 'DELETE_ASSIGNMENT', 'mentor_assignments', assignmentId);
    res.json({ message: 'Penugasan mentor berhasil dibatalkan' });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Gagal menghapus penugasan mentor' });
  }
});

apiRouter.put('/assignments/:id/end', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const assignmentId = Number(req.params.id);
    const updated = await db
      .update(mentorAssignments)
      .set({
        status: 'ENDED',
        endedAt: new Date(),
      })
      .where(eq(mentorAssignments.id, assignmentId))
      .returning();

    await logAudit(req.profile!.id, 'END_ASSIGNMENT', 'mentor_assignments', assignmentId);
    res.json({ message: 'Penugasan pendampingan berhasil diselesaikan', assignment: updated[0] });
  } catch (error: any) {
    console.error('Error ending assignment:', error);
    res.status(500).json({ error: 'Gagal mengakhiri penugasan' });
  }
});

// ==========================================
// 6. MENTORING SESSIONS & ACTION PLANS API
// ==========================================

apiRouter.get('/mentoring-sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    let conditions = [];

    if (req.profile!.role === 'MENTOR') {
      if (!req.mentor) return res.json([]);
      conditions.push(eq(mentoringSessions.mentorId, req.mentor.id));
    } else if (req.profile!.role === 'UMKM') {
      if (!req.umkm) return res.json([]);
      conditions.push(eq(mentoringSessions.umkmId, req.umkm.id));
    } else {
      if (req.query.mentorId && req.query.mentorId !== 'all') {
        conditions.push(eq(mentoringSessions.mentorId, Number(req.query.mentorId)));
      }
    }

    if (req.query.umkmId && req.query.umkmId !== 'all') {
      conditions.push(eq(mentoringSessions.umkmId, Number(req.query.umkmId)));
    }
    if (req.query.programId && req.query.programId !== 'all') {
      conditions.push(eq(mentoringSessions.programId, Number(req.query.programId)));
    }
    if (req.query.startDate) {
      conditions.push(gte(mentoringSessions.sessionDate, String(req.query.startDate)));
    }
    if (req.query.endDate) {
      conditions.push(lte(mentoringSessions.sessionDate, String(req.query.endDate)));
    }

    const list = await db
      .select({
        id: mentoringSessions.id,
        programId: mentoringSessions.programId,
        programName: programs.name,
        mentorId: mentoringSessions.mentorId,
        mentorName: mentorProfiles.fullName,
        mentorInstitution: mentorProfiles.institution,
        mentorPosition: mentorProfiles.position,
        mentorEmail: mentorProfiles.email,
        mentorWhatsapp: mentorProfiles.whatsapp,
        umkmId: mentoringSessions.umkmId,
        businessName: umkmProfiles.businessName,
        ownerName: umkmProfiles.ownerName,
        cityRegency: umkmProfiles.cityRegency,
        businessSector: umkmProfiles.businessSector,
        sessionDate: mentoringSessions.sessionDate,
        topic: mentoringSessions.topic,
        problem: mentoringSessions.problem,
        findings: mentoringSessions.findings,
        recommendation: mentoringSessions.recommendation,
        additionalNotes: mentoringSessions.additionalNotes,
        createdAt: mentoringSessions.createdAt,
      })
      .from(mentoringSessions)
      .innerJoin(programs, eq(mentoringSessions.programId, programs.id))
      .innerJoin(mentorProfiles, eq(mentoringSessions.mentorId, mentorProfiles.id))
      .innerJoin(umkmProfiles, eq(mentoringSessions.umkmId, umkmProfiles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(mentoringSessions.sessionDate));

    let result = list;
    if (req.query.search) {
      const q = String(req.query.search).toLowerCase();
      result = list.filter((s) => {
        return (
          (s.topic && s.topic.toLowerCase().includes(q)) ||
          (s.businessName && s.businessName.toLowerCase().includes(q)) ||
          (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
          (s.mentorName && s.mentorName.toLowerCase().includes(q)) ||
          (s.programName && s.programName.toLowerCase().includes(q)) ||
          (s.problem && s.problem.toLowerCase().includes(q)) ||
          (s.recommendation && s.recommendation.toLowerCase().includes(q)) ||
          (s.findings && s.findings.toLowerCase().includes(q))
        );
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching mentoring sessions:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar sesi mentoring' });
  }
});

// Single mentoring session detail with associated action plans
apiRouter.get('/mentoring-sessions/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) return res.status(400).json({ error: 'ID sesi tidak valid' });

    const sessionRes = await db
      .select({
        id: mentoringSessions.id,
        programId: mentoringSessions.programId,
        programName: programs.name,
        programDescription: programs.description,
        mentorId: mentoringSessions.mentorId,
        mentorName: mentorProfiles.fullName,
        mentorInstitution: mentorProfiles.institution,
        mentorPosition: mentorProfiles.position,
        mentorEmail: mentorProfiles.email,
        mentorWhatsapp: mentorProfiles.whatsapp,
        mentorExpertise: mentorProfiles.expertise,
        umkmId: mentoringSessions.umkmId,
        businessName: umkmProfiles.businessName,
        ownerName: umkmProfiles.ownerName,
        cityRegency: umkmProfiles.cityRegency,
        district: umkmProfiles.district,
        address: umkmProfiles.address,
        businessSector: umkmProfiles.businessSector,
        whatsapp: umkmProfiles.whatsapp,
        sessionDate: mentoringSessions.sessionDate,
        topic: mentoringSessions.topic,
        problem: mentoringSessions.problem,
        findings: mentoringSessions.findings,
        recommendation: mentoringSessions.recommendation,
        additionalNotes: mentoringSessions.additionalNotes,
        createdAt: mentoringSessions.createdAt,
      })
      .from(mentoringSessions)
      .innerJoin(programs, eq(mentoringSessions.programId, programs.id))
      .innerJoin(mentorProfiles, eq(mentoringSessions.mentorId, mentorProfiles.id))
      .innerJoin(umkmProfiles, eq(mentoringSessions.umkmId, umkmProfiles.id))
      .where(eq(mentoringSessions.id, sessionId))
      .limit(1);

    if (sessionRes.length === 0) {
      return res.status(404).json({ error: 'Sesi mentoring tidak ditemukan' });
    }

    const session = sessionRes[0];

    // Authorization check
    if (req.profile!.role === 'MENTOR' && req.mentor && session.mentorId !== req.mentor.id) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }
    if (req.profile!.role === 'UMKM' && req.umkm && session.umkmId !== req.umkm.id) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    const aPlans = await db
      .select()
      .from(actionPlans)
      .where(eq(actionPlans.mentoringSessionId, sessionId))
      .orderBy(desc(actionPlans.deadline));

    res.json({
      ...session,
      actionPlans: aPlans,
    });
  } catch (error: any) {
    console.error('Error fetching mentoring session detail:', error);
    res.status(500).json({ error: 'Gagal mengambil detail sesi mentoring' });
  }
});

apiRouter.post('/mentoring-sessions', requireAuth, requireRole(['MENTOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.mentor) return res.status(400).json({ error: 'Profil mentor belum aktif' });

    const { programId, umkmId, sessionDate, topic, problem, findings, recommendation, additionalNotes } = req.body;

    if (!programId || !umkmId || !sessionDate || !topic || !recommendation) {
      return res.status(400).json({ error: 'Program, UMKM, Tanggal Sesi, Topik, dan Rekomendasi wajib diisi' });
    }

    // Authorization check: mentor must have active assignment to this UMKM
    const assignment = await db
      .select()
      .from(mentorAssignments)
      .where(
        and(
          eq(mentorAssignments.programId, Number(programId)),
          eq(mentorAssignments.mentorId, req.mentor.id),
          eq(mentorAssignments.umkmId, Number(umkmId)),
          eq(mentorAssignments.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (assignment.length === 0) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki penugasan aktif ke UMKM ini dalam program tersebut' });
    }

    const inserted = await db
      .insert(mentoringSessions)
      .values({
        programId: Number(programId),
        mentorId: req.mentor.id,
        umkmId: Number(umkmId),
        sessionDate: String(sessionDate),
        topic: String(topic).trim(),
        problem: problem ? String(problem).trim() : null,
        findings: findings ? String(findings).trim() : null,
        recommendation: String(recommendation).trim(),
        additionalNotes: additionalNotes ? String(additionalNotes).trim() : null,
      })
      .returning();

    await logAudit(req.profile!.id, 'CREATE_MENTORING_SESSION', 'mentoring_sessions', inserted[0].id, {
      programId,
      umkmId,
      topic,
    });

    res.status(201).json({ message: 'Sesi mentoring berhasil dicatat', session: inserted[0] });
  } catch (error: any) {
    console.error('Error creating mentoring session:', error);
    res.status(500).json({ error: 'Gagal mencatat sesi mentoring' });
  }
});

// Action Plans API
apiRouter.get('/action-plans', requireAuth, async (req: AuthRequest, res) => {
  try {
    let conditions = [];

    if (req.profile!.role === 'MENTOR') {
      if (!req.mentor) return res.json([]);
      conditions.push(eq(actionPlans.mentorId, req.mentor.id));
    } else if (req.profile!.role === 'UMKM') {
      if (!req.umkm) return res.json([]);
      conditions.push(eq(actionPlans.umkmId, req.umkm.id));
    } else {
      if (req.query.mentorId && req.query.mentorId !== 'all') {
        conditions.push(eq(actionPlans.mentorId, Number(req.query.mentorId)));
      }
    }

    if (req.query.umkmId && req.query.umkmId !== 'all') {
      conditions.push(eq(actionPlans.umkmId, Number(req.query.umkmId)));
    }
    if (req.query.programId && req.query.programId !== 'all') {
      conditions.push(eq(actionPlans.programId, Number(req.query.programId)));
    }
    if (req.query.status && req.query.status !== 'all') {
      conditions.push(eq(actionPlans.status, req.query.status as any));
    }
    if (req.query.startDate) {
      conditions.push(gte(actionPlans.deadline, String(req.query.startDate)));
    }
    if (req.query.endDate) {
      conditions.push(lte(actionPlans.deadline, String(req.query.endDate)));
    }

    const list = await db
      .select({
        id: actionPlans.id,
        programId: actionPlans.programId,
        programName: programs.name,
        mentoringSessionId: actionPlans.mentoringSessionId,
        mentorId: actionPlans.mentorId,
        mentorName: mentorProfiles.fullName,
        mentorInstitution: mentorProfiles.institution,
        umkmId: actionPlans.umkmId,
        businessName: umkmProfiles.businessName,
        ownerName: umkmProfiles.ownerName,
        cityRegency: umkmProfiles.cityRegency,
        businessSector: umkmProfiles.businessSector,
        title: actionPlans.title,
        description: actionPlans.description,
        target: actionPlans.target,
        pic: actionPlans.pic,
        deadline: actionPlans.deadline,
        status: actionPlans.status,
        completedAt: actionPlans.completedAt,
        createdAt: actionPlans.createdAt,
      })
      .from(actionPlans)
      .innerJoin(programs, eq(actionPlans.programId, programs.id))
      .innerJoin(mentorProfiles, eq(actionPlans.mentorId, mentorProfiles.id))
      .innerJoin(umkmProfiles, eq(actionPlans.umkmId, umkmProfiles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(actionPlans.deadline));

    // Overdue calculation (Requirement 44):
    // Overdue if deadline < current date AND status NOT IN ('COMPLETED', 'CANCELLED')
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch evaluations for these action plans
    const actionPlanIds = list.map((a) => a.id);
    let evalMap: Record<number, any[]> = {};
    if (actionPlanIds.length > 0) {
      const evals = await db
        .select()
        .from(actionPlanEvaluations)
        .where(inArray(actionPlanEvaluations.actionPlanId, actionPlanIds))
        .orderBy(desc(actionPlanEvaluations.evaluationDate));

      evals.forEach((e) => {
        if (!evalMap[e.actionPlanId]) evalMap[e.actionPlanId] = [];
        evalMap[e.actionPlanId].push(e);
      });
    }

    let enriched = list.map((a) => {
      const isOverdue = a.deadline < todayStr && a.status !== 'COMPLETED' && a.status !== 'CANCELLED';
      return {
        ...a,
        isOverdue,
        evaluations: evalMap[a.id] || [],
      };
    });

    if (req.query.search) {
      const q = String(req.query.search).toLowerCase();
      enriched = enriched.filter((a) => {
        return (
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          (a.target && a.target.toLowerCase().includes(q)) ||
          (a.pic && a.pic.toLowerCase().includes(q)) ||
          (a.businessName && a.businessName.toLowerCase().includes(q)) ||
          (a.ownerName && a.ownerName.toLowerCase().includes(q)) ||
          (a.mentorName && a.mentorName.toLowerCase().includes(q)) ||
          (a.programName && a.programName.toLowerCase().includes(q))
        );
      });
    }

    res.json(enriched);
  } catch (error: any) {
    console.error('Error fetching action plans:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar action plan' });
  }
});

apiRouter.post('/action-plans', requireAuth, requireRole(['MENTOR', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { programId, mentoringSessionId, umkmId, title, description, target, pic, deadline, status } = req.body;

    if (!programId || !umkmId || !title || !deadline) {
      return res.status(400).json({ error: 'Program, UMKM, Judul Action Plan, dan Deadline wajib diisi' });
    }

    let mentorId = req.mentor ? req.mentor.id : null;
    if (!mentorId && req.body.mentorId) {
      mentorId = Number(req.body.mentorId);
    }

    if (!mentorId) {
      return res.status(400).json({ error: 'Mentor ID wajib disertakan' });
    }

    const inserted = await db
      .insert(actionPlans)
      .values({
        programId: Number(programId),
        mentoringSessionId: mentoringSessionId ? Number(mentoringSessionId) : null,
        mentorId,
        umkmId: Number(umkmId),
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        target: target ? String(target).trim() : null,
        pic: pic ? String(pic).trim() : null,
        deadline: String(deadline),
        status: status || 'NOT_STARTED',
      })
      .returning();

    await logAudit(req.profile!.id, 'CREATE_ACTION_PLAN', 'action_plans', inserted[0].id, { title });
    res.status(201).json({ message: 'Action plan berhasil dibuat', actionPlan: inserted[0] });
  } catch (error: any) {
    console.error('Error creating action plan:', error);
    res.status(500).json({ error: 'Gagal membuat action plan' });
  }
});

apiRouter.put('/action-plans/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status, completedAt } = req.body;

    const existing = await db.select().from(actionPlans).where(eq(actionPlans.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Action plan tidak ditemukan' });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED' && !existing[0].completedAt) {
        updateData.completedAt = new Date();
      } else if (status !== 'COMPLETED') {
        updateData.completedAt = null;
      }
    }

    const updated = await db.update(actionPlans).set(updateData).where(eq(actionPlans.id, id)).returning();

    await logAudit(req.profile!.id, 'UPDATE_ACTION_PLAN_STATUS', 'action_plans', id, { status });
    res.json({ message: 'Status action plan berhasil diperbarui', actionPlan: updated[0] });
  } catch (error: any) {
    console.error('Error updating action plan:', error);
    res.status(500).json({ error: 'Gagal memperbarui status action plan' });
  }
});

// Action Plan Evaluation
apiRouter.post('/action-plans/:id/evaluations', requireAuth, requireRole(['MENTOR']), async (req: AuthRequest, res) => {
  try {
    if (!req.mentor) return res.status(400).json({ error: 'Profil mentor belum aktif' });

    const actionPlanId = Number(req.params.id);
    const { status, evaluationNotes, result, nextRecommendation } = req.body;

    if (!status || !evaluationNotes) {
      return res.status(400).json({ error: 'Status evaluasi dan catatan evaluasi wajib diisi' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const inserted = await db
      .insert(actionPlanEvaluations)
      .values({
        actionPlanId,
        mentorId: req.mentor.id,
        evaluationDate: todayStr,
        status: String(status),
        evaluationNotes: String(evaluationNotes).trim(),
        result: result ? String(result).trim() : null,
        nextRecommendation: nextRecommendation ? String(nextRecommendation).trim() : null,
      })
      .returning();

    // Also update action plan status if changed
    await db.update(actionPlans).set({ status, updatedAt: new Date() }).where(eq(actionPlans.id, actionPlanId));

    await logAudit(req.profile!.id, 'EVALUATE_ACTION_PLAN', 'action_plan_evaluations', inserted[0].id);
    res.status(201).json({ message: 'Evaluasi action plan berhasil disimpan', evaluation: inserted[0] });
  } catch (error: any) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({ error: 'Gagal menyimpan evaluasi' });
  }
});

// ==========================================
// 7. ADMIN DASHBOARD & USER MANAGEMENT API
// ==========================================

apiRouter.get('/analytics/admin', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const totalUmkmRes = await db.select({ count: sql<number>`count(*)` }).from(umkmProfiles);
    const totalMentorRes = await db.select({ count: sql<number>`count(*)` }).from(mentorProfiles);
    const totalProgramsRes = await db.select({ count: sql<number>`count(*)` }).from(programs).where(eq(programs.status, 'ACTIVE'));
    const totalSalesRes = await db
      .select({
        count: sql<number>`count(*)`,
        totalRevenue: sql<number>`coalesce(sum(${sales.totalRevenue}), 0)`,
        totalGrossProfit: sql<number>`coalesce(sum(${sales.grossProfit}), 0)`,
      })
      .from(sales)
      .where(isNull(sales.deletedAt));

    const mentoringRes = await db.select({ count: sql<number>`count(*)` }).from(mentoringSessions);
    const actionPlanRes = await db.select({ count: sql<number>`count(*)` }).from(actionPlans);

    // Top UMKM by Revenue
    const allUmkms = await db.select().from(umkmProfiles);
    const topUmkm = await Promise.all(
      allUmkms.map(async (u) => {
        const uSales = await db
          .select({
            count: sql<number>`count(*)`,
            totalRevenue: sql<number>`coalesce(sum(${sales.totalRevenue}), 0)`,
            totalGrossProfit: sql<number>`coalesce(sum(${sales.grossProfit}), 0)`,
          })
          .from(sales)
          .where(and(eq(sales.umkmId, u.id), isNull(sales.deletedAt)));

        return {
          id: u.id,
          businessName: u.businessName,
          ownerName: u.ownerName,
          transactions: Number(uSales[0]?.count || 0),
          revenue: Number(uSales[0]?.totalRevenue || 0),
          grossProfit: Number(uSales[0]?.totalGrossProfit || 0),
        };
      })
    );

    topUmkm.sort((a, b) => b.revenue - a.revenue);

    // Sector distribution
    const sectorMap: Record<string, number> = {};
    for (const u of allUmkms) {
      const s = u.businessSector || 'Lainnya';
      sectorMap[s] = (sectorMap[s] || 0) + 1;
    }
    const sectorDistribution = Object.entries(sectorMap).map(([sector, count]) => ({ sector, count }));

    res.json({
      summary: {
        totalRevenue: Number(totalSalesRes[0]?.totalRevenue || 0),
        totalGrossProfit: Number(totalSalesRes[0]?.totalGrossProfit || 0),
        totalUmkm: Number(totalUmkmRes[0]?.count || 0),
        totalMentors: Number(totalMentorRes[0]?.count || 0),
        totalSessions: Number(mentoringRes[0]?.count || 0),
        totalActionPlans: Number(actionPlanRes[0]?.count || 0),
        activePrograms: Number(totalProgramsRes[0]?.count || 0),
      },
      topUmkm,
      sectorDistribution,
    });
  } catch (error: any) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ error: 'Gagal mengambil data analitik admin' });
  }
});

apiRouter.get('/admin/dashboard', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const totalUmkmRes = await db.select({ count: sql<number>`count(*)` }).from(umkmProfiles);
    const totalMentorRes = await db.select({ count: sql<number>`count(*)` }).from(mentorProfiles);
    const totalProgramsRes = await db.select({ count: sql<number>`count(*)` }).from(programs).where(eq(programs.status, 'ACTIVE'));
    const totalSalesRes = await db
      .select({
        count: sql<number>`count(*)`,
        totalRevenue: sql<number>`coalesce(sum(${sales.totalRevenue}), 0)`,
        totalGrossProfit: sql<number>`coalesce(sum(${sales.grossProfit}), 0)`,
      })
      .from(sales)
      .where(isNull(sales.deletedAt));

    // Mentoring sessions this month
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const mentoringThisMonthRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(mentoringSessions)
      .where(gte(mentoringSessions.sessionDate, monthStart));

    // Action plans active and overdue
    const todayStr = new Date().toISOString().split('T')[0];
    const allActionPlans = await db.select().from(actionPlans);
    const activeActionPlans = allActionPlans.filter((a) => a.status === 'NOT_STARTED' || a.status === 'IN_PROGRESS');
    const overdueActionPlans = activeActionPlans.filter((a) => a.deadline < todayStr);

    // Performance per program (Requirement 48)
    const allPrograms = await db.select().from(programs);
    const programPerformance = await Promise.all(
      allPrograms.map(async (p) => {
        const participants = await db
          .select()
          .from(programParticipants)
          .where(and(eq(programParticipants.programId, p.id), eq(programParticipants.status, 'ACTIVE')));

        const umkmCount = participants.filter((part) => part.participantRole === 'UMKM').length;
        const mentorCount = participants.filter((part) => part.participantRole === 'MENTOR').length;

        const sessions = await db.select().from(mentoringSessions).where(eq(mentoringSessions.programId, p.id));
        const pPlans = await db.select().from(actionPlans).where(eq(actionPlans.programId, p.id));
        const completedPlans = pPlans.filter((pl) => pl.status === 'COMPLETED').length;

        return {
          id: p.id,
          name: p.name,
          organizer: p.organizer,
          status: p.status,
          umkmCount,
          mentorCount,
          mentoringCount: sessions.length,
          actionPlanCount: pPlans.length,
          completedActionPlans: completedPlans,
        };
      })
    );

    res.json({
      kpi: {
        totalUmkm: Number(totalUmkmRes[0]?.count || 0),
        totalMentor: Number(totalMentorRes[0]?.count || 0),
        activePrograms: Number(totalProgramsRes[0]?.count || 0),
        totalTransactions: Number(totalSalesRes[0]?.count || 0),
        totalRevenue: Number(totalSalesRes[0]?.totalRevenue || 0),
        totalGrossProfit: Number(totalSalesRes[0]?.totalGrossProfit || 0),
        mentoringThisMonth: Number(mentoringThisMonthRes[0]?.count || 0),
        activeActionPlans: activeActionPlans.length,
        overdueActionPlans: overdueActionPlans.length,
      },
      programPerformance,
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Gagal mengambil data dashboard admin' });
  }
});

// Admin UMKM Monitoring List
const getAdminUmkmList = async (req: AuthRequest, res: Response) => {
  try {
    const umkms = await db
      .select({
        id: umkmProfiles.id,
        businessName: umkmProfiles.businessName,
        ownerName: umkmProfiles.ownerName,
        cityRegency: umkmProfiles.cityRegency,
        businessSector: umkmProfiles.businessSector,
        whatsapp: umkmProfiles.whatsapp,
        email: umkmProfiles.email,
        createdAt: umkmProfiles.createdAt,
      })
      .from(umkmProfiles);

    const todayStr = new Date().toISOString().split('T')[0];

    const enriched = await Promise.all(
      umkms.map(async (u) => {
        // Sales aggregate
        const sList = await db
          .select({
            totalRevenue: sales.totalRevenue,
            grossProfit: sales.grossProfit,
            transactionDate: sales.transactionDate,
          })
          .from(sales)
          .where(and(eq(sales.umkmId, u.id), isNull(sales.deletedAt)))
          .orderBy(desc(sales.transactionDate));

        const revenue = sList.reduce((acc, s) => acc + s.totalRevenue, 0);
        const profit = sList.reduce((acc, s) => acc + s.grossProfit, 0);
        const lastTransaction = sList[0]?.transactionDate || null;

        // Mentoring
        const mSessions = await db
          .select({ sessionDate: mentoringSessions.sessionDate })
          .from(mentoringSessions)
          .where(eq(mentoringSessions.umkmId, u.id))
          .orderBy(desc(mentoringSessions.sessionDate));

        const lastMentoring = mSessions[0]?.sessionDate || null;

        // Action plans
        const aPlans = await db.select().from(actionPlans).where(eq(actionPlans.umkmId, u.id));
        const activePlans = aPlans.filter((p) => p.status === 'NOT_STARTED' || p.status === 'IN_PROGRESS');
        const overduePlans = activePlans.filter((p) => p.deadline < todayStr);

        // Program assignment
        const assign = await db
          .select({ programName: programs.name, mentorName: mentorProfiles.fullName })
          .from(mentorAssignments)
          .innerJoin(programs, eq(mentorAssignments.programId, programs.id))
          .innerJoin(mentorProfiles, eq(mentorAssignments.mentorId, mentorProfiles.id))
          .where(and(eq(mentorAssignments.umkmId, u.id), eq(mentorAssignments.status, 'ACTIVE')))
          .limit(1);

        return {
          ...u,
          programName: assign[0]?.programName || 'Belum Terdaftar Program',
          mentorName: assign[0]?.mentorName || 'Belum Ada Mentor',
          totalRevenue: revenue,
          totalGrossProfit: profit,
          lastTransaction,
          lastMentoring,
          activeActionPlansCount: activePlans.length,
          overdueActionPlansCount: overduePlans.length,
        };
      })
    );

    res.json(enriched);
  } catch (error: any) {
    console.error('Error fetching admin umkm list:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar monitoring UMKM' });
  }
};

apiRouter.get('/admin/umkm', requireAuth, requireRole(['ADMIN']), getAdminUmkmList);
apiRouter.get('/admin/umkm-list', requireAuth, requireRole(['ADMIN']), getAdminUmkmList);

// Admin Mentor Monitoring List
const getAdminMentorsList = async (req: AuthRequest, res: Response) => {
  try {
    const mentors = await db
      .select({
        id: mentorProfiles.id,
        fullName: mentorProfiles.fullName,
        email: mentorProfiles.email,
        whatsapp: mentorProfiles.whatsapp,
        institution: mentorProfiles.institution,
        position: mentorProfiles.position,
        expertise: mentorProfiles.expertise,
      })
      .from(mentorProfiles);

    const todayStr = new Date().toISOString().split('T')[0];

    const enriched = await Promise.all(
      mentors.map(async (m) => {
        // Active assigned UMKMs
        const assignments = await db
          .select()
          .from(mentorAssignments)
          .where(and(eq(mentorAssignments.mentorId, m.id), eq(mentorAssignments.status, 'ACTIVE')));

        // Mentoring sessions count & last date
        const sessions = await db
          .select({ sessionDate: mentoringSessions.sessionDate })
          .from(mentoringSessions)
          .where(eq(mentoringSessions.mentorId, m.id))
          .orderBy(desc(mentoringSessions.sessionDate));

        // Action plans
        const aPlans = await db.select().from(actionPlans).where(eq(actionPlans.mentorId, m.id));
        const completedPlans = aPlans.filter((p) => p.status === 'COMPLETED').length;
        const overduePlans = aPlans.filter((p) => (p.status === 'NOT_STARTED' || p.status === 'IN_PROGRESS') && p.deadline < todayStr).length;

        return {
          ...m,
          assignedUmkmCount: assignments.length,
          mentoringCount: sessions.length,
          lastMentoring: sessions[0]?.sessionDate || null,
          actionPlansCreated: aPlans.length,
          actionPlansCompleted: completedPlans,
          actionPlansOverdue: overduePlans,
        };
      })
    );

    res.json(enriched);
  } catch (error: any) {
    console.error('Error fetching admin mentors list:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar monitoring mentor' });
  }
};

apiRouter.get('/admin/mentors', requireAuth, requireRole(['ADMIN']), getAdminMentorsList);
apiRouter.get('/admin/mentors-list', requireAuth, requireRole(['ADMIN']), getAdminMentorsList);

// Admin User Management List
apiRouter.get('/admin/users', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const list = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
});

apiRouter.post('/admin/users/:id/status', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const targetProfileId = Number(req.params.id);
    const { accountStatus } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(accountStatus)) {
      return res.status(400).json({ error: 'Status akun tidak valid' });
    }

    const updated = await db
      .update(profiles)
      .set({
        accountStatus,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, targetProfileId))
      .returning();

    await logAudit(req.profile!.id, 'CHANGE_USER_STATUS', 'profiles', targetProfileId, { accountStatus });
    res.json({ message: `Status akun berhasil diubah menjadi ${accountStatus}`, profile: updated[0] });
  } catch (error: any) {
    console.error('Error changing user status:', error);
    res.status(500).json({ error: 'Gagal mengubah status akun' });
  }
});

// Admin Mentor Invitation Flow (Requirement 53, 54, 55)
apiRouter.post('/admin/invite-mentor', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { email, programId } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email mentor tidak valid' });
    }

    // Check if invitation already exists pending
    const existingInv = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.email, email.trim().toLowerCase()), eq(invitations.status, 'PENDING')))
      .limit(1);

    if (existingInv.length > 0) {
      return res.status(400).json({ error: 'Undangan untuk email ini masih aktif (status PENDING)' });
    }

    // Generate secure token hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 7 days expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const inserted = await db
      .insert(invitations)
      .values({
        email: email.trim().toLowerCase(),
        role: 'MENTOR',
        programId: programId ? Number(programId) : null,
        invitedBy: req.profile!.id,
        tokenHash,
        expiresAt,
        status: 'PENDING',
      })
      .returning();

    await logAudit(req.profile!.id, 'INVITE_MENTOR', 'invitations', inserted[0].id, {
      email,
      programId,
    });

    res.status(201).json({
      message: 'Undangan mentor berhasil dibuat',
      invitation: {
        id: inserted[0].id,
        email: inserted[0].email,
        expiresAt: inserted[0].expiresAt,
        invitationLink: `/invite?token=${rawToken}`,
      },
    });
  } catch (error: any) {
    console.error('Error inviting mentor:', error);
    res.status(500).json({ error: 'Gagal mengirim undangan mentor' });
  }
});

// Audit Logs list
const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        id: auditLogs.id,
        actorProfileId: auditLogs.actorProfileId,
        actorName: profiles.fullName,
        actorEmail: profiles.email,
        userEmail: profiles.email,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        metadata: auditLogs.metadata,
        details: auditLogs.metadata,
        ipAddress: sql<string>`'127.0.0.1'`,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(profiles, eq(auditLogs.actorProfileId, profiles.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

    res.json(list);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Gagal mengambil audit log' });
  }
};

apiRouter.get('/audit-logs', requireAuth, requireRole(['ADMIN']), getAuditLogs);
apiRouter.get('/admin/audit-logs', requireAuth, requireRole(['ADMIN']), getAuditLogs);
