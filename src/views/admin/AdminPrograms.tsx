import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Program, MentorAssignment } from '../../types/index.ts';
import { formatDate } from '../../utils/formatters.ts';
import {
  Layers,
  Plus,
  UserCheck,
  Store,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  Mail,
  Copy,
  ExternalLink,
} from 'lucide-react';

export const AdminPrograms: React.FC = () => {
  const { fetchWithAuth } = useAuth();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [umkms, setUmkms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Program Modal
  const [isProgramModalOpen, setIsProgramModalOpen] = useState<boolean>(false);
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    batch: 'Batch 1 - 2026',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    targetParticipants: 25,
    status: 'ACTIVE',
  });

  // New Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [assignForm, setAssignForm] = useState({
    programId: '',
    mentorId: '',
    umkmId: '',
  });

  // Invite Mentor Modal
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [progRes, assignRes, mentorRes, umkmRes] = await Promise.all([
        fetchWithAuth('/api/programs'),
        fetchWithAuth('/api/assignments'),
        fetchWithAuth('/api/admin/mentors'),
        fetchWithAuth('/api/admin/umkm'),
      ]);

      if (progRes.ok) {
        const pList = await progRes.json();
        setPrograms(pList);
        if (pList.length > 0 && !assignForm.programId) {
          setAssignForm((prev) => ({ ...prev, programId: String(pList[0].id) }));
        }
      }

      if (assignRes.ok) setAssignments(await assignRes.json());
      if (mentorRes.ok) {
        const mList = await mentorRes.json();
        setMentors(mList);
        if (mList.length > 0 && !assignForm.mentorId) {
          setAssignForm((prev) => ({ ...prev, mentorId: String(mList[0].id) }));
        }
      }
      if (umkmRes.ok) {
        const uList = await umkmRes.json();
        setUmkms(uList);
        if (uList.length > 0 && !assignForm.umkmId) {
          setAssignForm((prev) => ({ ...prev, umkmId: String(uList[0].id) }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth('/api/programs', {
        method: 'POST',
        body: JSON.stringify(programForm),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal membuat program');

      setIsProgramModalOpen(false);
      setSuccessMsg('Program pendampingan baru berhasil dibuat.');
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          programId: Number(assignForm.programId),
          mentorId: Number(assignForm.mentorId),
          umkmId: Number(assignForm.umkmId),
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menugaskan mentor');

      setIsAssignModalOpen(false);
      setSuccessMsg('Mentor berhasil ditugaskan ke UMKM terpilih.');
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth('/api/admin/invite-mentor', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal mengirim undangan mentor');

      setInviteResult({
        inviteUrl: resData.inviteUrl,
        token: resData.inviteToken,
        email: resData.email,
        fullName: inviteForm.fullName,
      });
      setSuccessMsg(`Undangan resmi berhasil disiapkan untuk ${inviteForm.fullName} (${resData.email})`);
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!window.confirm('Hapus penugasan mentor ini?')) return;
    try {
      const res = await fetchWithAuth(`/api/assignments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAssignments(assignments.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Program Pendampingan & Penugasan Mentor
          </h1>
          <p className="text-xs text-slate-500">
            Kelola gelombang program pendampingan dan plotting mentor ke pelaku usaha binaan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setInviteResult(null);
              setCopiedLink(false);
              setIsInviteModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span>Undang Mentor Baru</span>
          </button>

          <button
            onClick={() => setIsProgramModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Program</span>
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            <span>Tugaskan Mentor ke UMKM</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Program Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Program Pendampingan Aktif</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                    {p.batch}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{p.name}</h3>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    p.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.status}
                </span>
              </div>

              {p.description && <p className="text-xs text-slate-600">{p.description}</p>}

              <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500 space-y-1">
                <div>
                  Mulai: {formatDate(p.startDate)} {p.endDate && `• Selesai: ${formatDate(p.endDate)}`}
                </div>
                <div>Target Peserta: {p.targetParticipants} UMKM</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mentor Assignments Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
        <div className="border-b border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daftar Plotting Penugasan Mentor</h2>
            <p className="text-xs text-slate-500">
              Relasi one-on-one pendampingan antara mentor dan UMKM per program
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {assignments.length} Pasangan Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Program</th>
                <th className="py-2.5 px-4 font-semibold">Nama UMKM</th>
                <th className="py-2.5 px-4 font-semibold">Pemilik UMKM</th>
                <th className="py-2.5 px-4 font-semibold">Mentor Pendamping</th>
                <th className="py-2.5 px-4 font-semibold text-center">Tanggal Penugasan</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                <th className="py-2.5 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Memuat data penugasan...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Belum ada penugasan mentor dibuat.
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{item.programName}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{item.businessName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{item.ownerName}</td>
                    <td className="py-2.5 px-4 font-semibold text-indigo-700">{item.mentorName}</td>
                    <td className="py-2.5 px-4 text-center text-slate-500">
                      {formatDate(item.assignedAt || (item as any).assignedDate)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteAssignment(item.id)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Hapus Penugasan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Program */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tambah Program Pendampingan</h3>
              <button
                onClick={() => setIsProgramModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Nama Program *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Akselerasi UMKM Naik Kelas 2026"
                  value={programForm.name}
                  onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Batch / Gelombang</label>
                <input
                  type="text"
                  value={programForm.batch}
                  onChange={(e) => setProgramForm({ ...programForm, batch: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Deskripsi Ringkas</label>
                <textarea
                  rows={2}
                  value={programForm.description}
                  onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={programForm.startDate}
                    onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={programForm.endDate}
                    onChange={(e) => setProgramForm({ ...programForm, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Mentor to UMKM */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Tugaskan Mentor ke UMKM</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Pilih Program *</label>
                <select
                  required
                  value={assignForm.programId}
                  onChange={(e) => setAssignForm({ ...assignForm, programId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.batch})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Pilih Mentor Pendamping *</label>
                <select
                  required
                  value={assignForm.mentorId}
                  onChange={(e) => setAssignForm({ ...assignForm, mentorId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none"
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} - {m.institution || 'Mentor'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Pilih UMKM Binaan *</label>
                <select
                  required
                  value={assignForm.umkmId}
                  onChange={(e) => setAssignForm({ ...assignForm, umkmId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none"
                >
                  {umkms.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.businessName} (Owner: {u.ownerName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Plotting Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Mentor Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in">
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
                    <span className="font-semibold block">Uji Langsung Alur Mentor:</span>
                    <span>
                      Klik tombol di bawah untuk membuka halaman aktivasi password mentor di tab ini atau kirimkan tautan tersebut via WhatsApp/Email.
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
                    Buka Halaman Aktivasi Mentor Sekarang &rarr;
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
