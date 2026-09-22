import { db, ensureSequencesSynced } from '../db/index.ts';
import { profiles, mentorProfiles, umkmProfiles } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { hashPassword } from './auth-utils.ts';

export async function ensureDemoEcosystemSeeded(): Promise<void> {
  try {
    const existingMentors = await db.select().from(mentorProfiles);
    const existingUmkms = await db.select().from(umkmProfiles);

    const defaultPasswordHash = hashPassword('Password123!');

    // 1. Seed additional mentors if < 4
    if (existingMentors.length < 4) {
      const demoMentors = [
        {
          email: 'rina.wijaya@mentor.id',
          fullName: 'Dr. Rina Wijaya, S.E., M.M.',
          whatsapp: '081223344556',
          institution: 'Inkubator Bisnis LPPM',
          position: 'Konsultan Pemasaran Digital & E-Commerce',
          bio: 'Praktisi dan akademisi pemasaran dengan pengalaman 10+ tahun mendampingi akselerasi digital UMKM.',
          expertise: 'Digital Marketing, Marketplace SEO, Social Commerce, Branding',
        },
        {
          email: 'hendra.gunawan@mentor.id',
          fullName: 'Hendra Gunawan, S.T., M.T.',
          whatsapp: '081399887766',
          institution: 'Balai Standardisasi Industri',
          position: 'Lead Advisor Manufaktur & Mutu',
          bio: 'Spesialis perbaikan rantai pasok, standardisasi mutu pangan, dan sertifikasi Halal / BPOM.',
          expertise: 'Standardisasi Mutu, Sertifikasi Halal & BPOM, Efisiensi HPP, Lean Production',
        },
        {
          email: 'dewi.sartika@mentor.id',
          fullName: 'Dewi Sartika, S.Ds.',
          whatsapp: '085711223344',
          institution: 'Studio Desain & Kreatif Nusantara',
          position: 'Creative Director & Brand Strategist',
          bio: 'Konsultan desain kemasan dan identitas visual merek untuk produk ekspor dan retail modern.',
          expertise: 'Packaging Design, Brand Identity, Visual Storytelling, Pasar Ritel Modern',
        },
      ];

      for (const m of demoMentors) {
        const found = await db.select().from(profiles).where(eq(profiles.email, m.email)).limit(1);
        let profileId: number;
        if (found.length === 0) {
          const insertedProfile = await db
            .insert(profiles)
            .values({
              firebaseUid: `uid-mentor-${m.email.split('@')[0]}`,
              email: m.email,
              fullName: m.fullName,
              role: 'MENTOR',
              accountStatus: 'ACTIVE',
              passwordHash: defaultPasswordHash,
            })
            .returning();
          profileId = insertedProfile[0].id;
        } else {
          profileId = found[0].id;
        }

        const mFound = await db.select().from(mentorProfiles).where(eq(mentorProfiles.profileId, profileId)).limit(1);
        if (mFound.length === 0) {
          await db.insert(mentorProfiles).values({
            profileId,
            fullName: m.fullName,
            email: m.email,
            whatsapp: m.whatsapp,
            institution: m.institution,
            position: m.position,
            bio: m.bio,
            expertise: m.expertise,
          });
        }
      }
    }

    // 2. Seed additional UMKMs if < 6
    if (existingUmkms.length < 6) {
      const demoUmkms = [
        {
          email: 'makciak@umkm.id',
          fullName: 'Hj. Nurhasanah',
          businessName: 'Sambal Juara Mak Ciak',
          ownerName: 'Hj. Nurhasanah',
          whatsapp: '081312345678',
          cityRegency: 'Kota Bandung',
          district: 'Coblong',
          businessSector: 'Kuliner / F&B',
          commodity: 'Sambal Kemasan Botol & Bumbu Siap Masak',
          establishedYear: 2021,
        },
        {
          email: 'batik.pesona@umkm.id',
          fullName: 'Joko Wibowo',
          businessName: 'Batik Canting Pesona Banua',
          ownerName: 'Joko Wibowo',
          whatsapp: '081298761234',
          cityRegency: 'Kota Yogyakarta',
          district: 'Kraton',
          businessSector: 'Fashion & Kriya',
          commodity: 'Batik Tulis Sutra & Kain Ecoprint Etnik',
          establishedYear: 2019,
        },
        {
          email: 'keripik.bunda@umkm.id',
          fullName: 'Kartini Suhanda',
          businessName: 'Keripik Singkong Renyah Bunda',
          ownerName: 'Kartini Suhanda',
          whatsapp: '085712349876',
          cityRegency: 'Kabupaten Sumedang',
          district: 'Jatinangor',
          businessSector: 'Makanan Ringan',
          commodity: 'Aneka Keripik Olahan Umbi & Singkong Pedas',
          establishedYear: 2022,
        },
        {
          email: 'madu.barokah@umkm.id',
          fullName: 'Ahmad Fauzi',
          businessName: 'Madu Hutan Asli Al-Barokah',
          ownerName: 'Ahmad Fauzi',
          whatsapp: '082145678901',
          cityRegency: 'Kabupaten Garut',
          district: 'Tarogong Kidul',
          businessSector: 'Herbal & Pertanian',
          commodity: 'Madu Hutan Liar Murni & Propolis',
          establishedYear: 2020,
        },
        {
          email: 'artisan.shoes@umkm.id',
          fullName: 'Rizky Ramadhan',
          businessName: 'Artisan Leather Craft & Shoes',
          ownerName: 'Rizky Ramadhan',
          whatsapp: '087812345678',
          cityRegency: 'Kabupaten Bandung Barat',
          district: 'Lembang',
          businessSector: 'Kerajinan Kulit & Sepatu',
          commodity: 'Sepatu Kulit Handmade & Dompet Kulit Nabati',
          establishedYear: 2023,
        },
      ];

      for (const u of demoUmkms) {
        const found = await db.select().from(profiles).where(eq(profiles.email, u.email)).limit(1);
        let profileId: number;
        if (found.length === 0) {
          const insertedProfile = await db
            .insert(profiles)
            .values({
              firebaseUid: `uid-umkm-${u.email.split('@')[0]}`,
              email: u.email,
              fullName: u.fullName,
              role: 'UMKM',
              accountStatus: 'ACTIVE',
              passwordHash: defaultPasswordHash,
            })
            .returning();
          profileId = insertedProfile[0].id;
        } else {
          profileId = found[0].id;
        }

        const uFound = await db.select().from(umkmProfiles).where(eq(umkmProfiles.profileId, profileId)).limit(1);
        if (uFound.length === 0) {
          await db.insert(umkmProfiles).values({
            profileId,
            businessName: u.businessName,
            ownerName: u.ownerName,
            whatsapp: u.whatsapp,
            email: u.email,
            cityRegency: u.cityRegency,
            district: u.district,
            businessSector: u.businessSector,
            commodity: u.commodity,
            establishedYear: u.establishedYear,
          });
        }
      }
    }

    await ensureSequencesSynced();
    console.log('✅ Demo ecosystem mentors & UMKMs ready');
  } catch (error) {
    console.warn('Notice in ensureDemoEcosystemSeeded:', error);
  }
}
