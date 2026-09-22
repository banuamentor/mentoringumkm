import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatDate } from '../../utils/formatters.ts';
import {
  Users,
  Mail,
  Phone,
  Building,
  Award,
  Plus,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  X,
  AlertCircle,
  Search,
  RefreshCw,
} from 'lucide-react';

export const AdminMentors: React.FC = () => {
  const { fetchWithAuth } = useAuth();

  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal: Invite Mentor
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    institution: '',
    position: '',
    expertise: '',
  });
  const [inviteResult, setInviteResult] = useState<{
    inviteUrl: string;
    token: string;
    email: string;
    fullName: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadMentors = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/admin/mentors');
      if (res.ok) {
        const data = await res.json();
        setMentors(data);
      }
    } catch (err) {
      console.error('Error loading mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentors();
  }, []);

  const handleInviteMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setInviteResult(null);

    try {
      const res = await fetchWithAuth('/api/invitations/mentor', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal mengirimkan undangan mentor');
      }

      setInviteResult(resData.invitation);
      loadMentors();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  const filteredMentors = mentors.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.fullName && m.fullName.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.institution && m.institution.toLowerCase().includes(q)) ||
      (m.expertise && m.expertise.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Mentor Pendamping</h1>
          <p className="text-xs text-slate-500">
            Daftar mentor resmi, pemantauan status aktivasi, dan pengiriman undangan baru
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadMentors}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button
            onClick={() => {
              setInviteForm({
                fullName: '',
                email: '',
                whatsapp: '',
                institution: '',
                position: '',
                expertise: '',
              });
              setInviteResult(null);
              setErrorMsg(null);
              setIsInviteModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Undang Mentor Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mentor, email, atau instansi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>
        <div className="text-xs font-medium text-slate-500">
          Total: <span className="font-bold text-slate-900">{filteredMentors.length}</span> Mentor
        </div>
      </div>

      {/* Mentors Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat daftar mentor...</div>
        ) : filteredMentors.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {search ? 'Tidak ada mentor yang sesuai dengan pencarian.' : 'Belum ada mentor yang terdaftar.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Mentor & Gelar</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4">Instansi & Jabatan</th>
                  <th className="py-3 px-4">Bidang Keahlian</th>
                  <th className="py-3 px-4 text-center">Status Akun</th>
                  <th className="py-3 px-4 text-center">UMKM Dampingan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMentors.map((m) => {
                  const isInvited = m.accountStatus === 'INVITED';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            {m.fullName ? m.fullName[0].toUpperCase() : 'M'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{m.fullName}</div>
                            <div className="text-[11px] text-slate-400">ID: #{m.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{m.email}</span>
                          </div>
                          {m.whatsapp && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{m.whatsapp}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{m.institution || '-'}</div>
                        <div className="text-[11px] text-slate-500">{m.position || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                          {m.expertise || 'Bisnis Umum & Finansial'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isInvited ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                            <Clock className="h-3 w-3" />
                            <span>Menunggu Aktivasi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle className="h-3 w-3" />
                            <span>Aktif</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {m.activeAssignmentsCount !== undefined ? `${m.activeAssignmentsCount} UMKM` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Mentor Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Undang Mentor Pendamping Baru</h3>
                <p className="text-xs text-slate-500">
                  Mentor bergabung melalui undangan resmi dan akan membuat password sendiri.
                </p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {inviteResult ? (
              <div className="mt-4 space-y-4 text-xs">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold mb-1">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span>Undangan Resmi Berhasil Dibuat!</span>
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    Akun mentor untuk <strong>{inviteResult.fullName}</strong> ({inviteResult.email}) telah didaftarkan dengan status <em>INVITED</em>.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tautan Undangan & Aktivasi:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteResult.inviteUrl}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteResult.inviteUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="shrink-0 flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedLink ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-start gap-2 text-indigo-900">
                  <ExternalLink className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Aktivasi Mandiri Mentor:</span>
                    <span>
                      Kirimkan tautan di atas melalui WhatsApp/Email mentor. Mentor akan membuka link tersebut dan menetapkan password akunnya.
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = inviteResult.inviteUrl;
                    }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
                  >
                    Buka Halaman Aktivasi &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteMentor} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar Mentor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dr. Budi Santoso, M.M."
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Undangan *</label>
                    <input
                      type="email"
                      required
                      placeholder="mentor@lembaga.id"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="0812xxxxxxxx"
                      value={inviteForm.whatsapp}
                      onChange={(e) => setInviteForm({ ...inviteForm, whatsapp: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Instansi / Lembaga</label>
                    <input
                      type="text"
                      placeholder="Contoh: Inkubator Bisnis Daerah"
                      value={inviteForm.institution}
                      onChange={(e) => setInviteForm({ ...inviteForm, institution: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jabatan / Posisi</label>
                    <input
                      type="text"
                      placeholder="Contoh: Lead Mentor Finansial"
                      value={inviteForm.position}
                      onChange={(e) => setInviteForm({ ...inviteForm, position: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bidang Keahlian</label>
                  <input
                    type="text"
                    placeholder="Contoh: Keuangan, HPP, Penetrasi Pasar Digital"
                    value={inviteForm.expertise}
                    onChange={(e) => setInviteForm({ ...inviteForm, expertise: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>{saving ? 'Mengirim...' : 'Kirim Undangan Mentor'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
