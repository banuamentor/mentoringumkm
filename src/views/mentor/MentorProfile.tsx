import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Save, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';

export const MentorProfile: React.FC = () => {
  const { mentor, fetchWithAuth, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    institution: '',
    position: '',
    expertise: 'Manajemen Keuangan, HPP, Penetapan Harga & Pemasaran Digital',
    bio: '',
    whatsapp: '',
    email: '',
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (mentor) {
      setFormData({
        fullName: mentor.fullName || '',
        institution: mentor.institution || '',
        position: mentor.position || '',
        expertise: mentor.expertise || '',
        bio: mentor.bio || '',
        whatsapp: mentor.whatsapp || '',
        email: mentor.email || '',
      });
    }
  }, [mentor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetchWithAuth('/api/profile/mentor', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Gagal memperbarui profil mentor');
      }

      setSuccessMsg('Profil mentor berhasil diperbarui');
      await refreshProfile();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Profil Mentor Pendamping</h1>
        <p className="text-xs text-slate-500">
          Kredensial keahlian dan kontak resmi pendamping program UMKM
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Identitas & Lembaga Afiliasi
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-700">Nama Lengkap & Gelar *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Lembaga / Institusi / Asosiasi</label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Jabatan / Peran Profesional</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Nomor WhatsApp Resmi</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700">Bidang Keahlian / Kompetensi Utama</label>
              <input
                type="text"
                placeholder="Contoh: Perhitungan HPP, Keuangan UMKM, Digital Marketing, Ekspor"
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700">Biografi Ringkas & Rekam Jejak</label>
              <textarea
                rows={3}
                placeholder="Pengalaman mendampingi UMKM, sertifikasi kompetensi pendamping, dsb..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Profil Mentor'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
