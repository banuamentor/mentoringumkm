import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Save, Store, CheckCircle, AlertCircle } from 'lucide-react';
import { ChangePasswordCard } from '../../components/ChangePasswordCard.tsx';

export const UmkmProfile: React.FC = () => {
  const { umkm, fetchWithAuth, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    whatsapp: '',
    email: '',
    cityRegency: '',
    district: '',
    address: '',
    establishedYear: 2021,
    businessSector: 'Kuliner / F&B',
    commodity: '',
    description: '',
    nib: '',
    instagram: '',
    marketplace: '',
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (umkm) {
      setFormData({
        businessName: umkm.businessName || '',
        ownerName: umkm.ownerName || '',
        whatsapp: umkm.whatsapp || '',
        email: umkm.email || '',
        cityRegency: umkm.cityRegency || '',
        district: umkm.district || '',
        address: umkm.address || '',
        establishedYear: umkm.establishedYear || 2021,
        businessSector: umkm.businessSector || 'Kuliner / F&B',
        commodity: umkm.commodity || '',
        description: umkm.description || '',
        nib: umkm.nib || '',
        instagram: umkm.instagram || '',
        marketplace: umkm.marketplace || '',
      });
    }
  }, [umkm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetchWithAuth('/api/profile/umkm', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Gagal memperbarui profil UMKM');
      }

      setSuccessMsg('Profil usaha UMKM berhasil diperbarui');
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
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Profil Usaha UMKM</h1>
        <p className="text-xs text-slate-500">
          Informasi legalitas, domisili, dan profil komoditas usaha binaan
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
        {/* Identitas Pokok */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Identitas Utama & Pemilik Usaha
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-700">Nama Usaha / Brand *</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Nama Pemilik / Owner *</label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Nomor WhatsApp *</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Email Usaha</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Nomor Induk Berusaha (NIB)</label>
              <input
                type="text"
                placeholder="13 digit angka NIB"
                value={formData.nib}
                onChange={(e) => setFormData({ ...formData, nib: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Tahun Berdiri Usaha</label>
              <input
                type="number"
                min="1950"
                max="2030"
                value={formData.establishedYear}
                onChange={(e) => setFormData({ ...formData, establishedYear: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sektor Usaha & Komoditas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Sektor Usaha & Komoditas Unggulan
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-700">Sektor Usaha</label>
              <select
                value={formData.businessSector}
                onChange={(e) => setFormData({ ...formData, businessSector: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-slate-900 focus:outline-none"
              >
                <option value="Kuliner / F&B">Kuliner / Makanan & Minuman (F&B)</option>
                <option value="Fashion & Konveksi">Fashion & Konveksi</option>
                <option value="Kriya & Kerajinan">Kriya & Kerajinan Tangan</option>
                <option value="Pertanian & Olahan">Pertanian & Hasil Olahan</option>
                <option value="Kecantikan & Herbal">Kecantikan & Herbal</option>
                <option value="Jasa & Digital">Jasa & Produk Kreatif Digital</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Komoditas / Produk Utama</label>
              <input
                type="text"
                placeholder="Contoh: Kopi Olahan & Minuman Siap Minum"
                value={formData.commodity}
                onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700">Deskripsi Singkat Usaha</label>
              <textarea
                rows={3}
                placeholder="Jelaskan secara ringkas produk unggulan, kapasitas produksi, dan keunikan usaha..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Lokasi & Media Online */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Lokasi Usaha & Kanal Media Digital
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-700">Kota / Kabupaten</label>
              <input
                type="text"
                placeholder="Kota Bandung"
                value={formData.cityRegency}
                onChange={(e) => setFormData({ ...formData, cityRegency: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Kecamatan</label>
              <input
                type="text"
                placeholder="Coblong"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700">Alamat Lengkap Usaha</label>
              <input
                type="text"
                placeholder="Jl. Dago No. 128, Bandung"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Instagram Handle</label>
              <input
                type="text"
                placeholder="@kopinusantara.id"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">Link Toko Online / Marketplace</label>
              <input
                type="text"
                placeholder="https://shopee.co.id/kopinusantara"
                value={formData.marketplace}
                onChange={(e) => setFormData({ ...formData, marketplace: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
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
            <span>{saving ? 'Menyimpan Profil...' : 'Simpan Profil Usaha'}</span>
          </button>
        </div>
      </form>

      {/* Keamanan & Ubah Password Mandiri */}
      <ChangePasswordCard />
    </div>
  );
};
