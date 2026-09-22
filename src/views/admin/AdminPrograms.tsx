import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Program, MentorAssignment } from '../../types/index.ts';
import { formatDate } from '../../utils/formatters.ts';
import { AdminProgramDetail } from './AdminProgramDetail.tsx';
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
  ChevronRight,
  Users,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';

export const AdminPrograms: React.FC = () => {
  const { fetchWithAuth } = useAuth();

  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

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
    organizer: 'Dinas Koperasi & UMKM x Banua Mentor',
    batch: 'Batch 1 - 2026',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    targetParticipants: 25,
    status: 'ACTIVE',
  });
  // Mentors selected during program creation (Multi-select)
  const [selectedMentorIdsForNewProgram, setSelectedMentorIdsForNewProgram] = useState<number[]>([]);
  const [mentorSearchInModal, setMentorSearchInModal] = useState<string>('');

  // New Assignment Modal (Bulk-capable)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [assignProgramId, setAssignProgramId] = useState<string>('');
  const [assignMentorId, setAssignMentorId] = useState<string>('');
  const [assignTargetUmkmIds, setAssignTargetUmkmIds] = useState<number[]>([]);

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
        if (pList.length > 0 && !assignProgramId) {
          setAssignProgramId(String(pList[0].id));
        }
      }

      if (assignRes.ok) setAssignments(await assignRes.json());
      if (mentorRes.ok) {
        const mList = await mentorRes.json();
        setMentors(mList);
        if (mList.length > 0 && !assignMentorId) {
          setAssignMentorId(String(mList[0].id));
        }
      }
      if (umkmRes.ok) {
        const uList = await umkmRes.json();
        setUmkms(uList);
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
        body: JSON.stringify({
          ...programForm,
          mentorIds: selectedMentorIdsForNewProgram,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal membuat program');

      setIsProgramModalOpen(false);
      setSelectedMentorIdsForNewProgram([]);
      setProgramForm({
        name: '',
        description: '',
        organizer: 'Dinas Koperasi & UMKM x Banua Mentor',
        batch: 'Batch 1 - 2026',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        targetParticipants: 25,
        status: 'ACTIVE',
      });
      setSuccessMsg('Program pendampingan baru berhasil dibuat beserta mentor terpilih.');
      await loadAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignProgramId || !assignMentorId || assignTargetUmkmIds.length === 0) {
      setErrorMsg('Pilih program, mentor, dan minimal 1 UMKM target.');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth('/api/assignments/bulk', {
        method: 'POST',
        body: JSON.stringify({
          programId: Number(assignProgramId),
          mentorId: Number(assignMentorId),
          umkmIds: assignTargetUmkmIds,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal membuat penugasan');

      setIsAssignModalOpen(false);
      setAssignTargetUmkmIds([]);
      setSuccessMsg(resData.message || 'Penugasan mentor berhasil disimpan.');
      await loadAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!window.confirm('Batalkan penugasan mentor ini?')) return;
    try {
      const res = await fetchWithAuth(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMsg('Penugasan mentor berhasil dibatalkan.');
        loadAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setInviteResult(null);

    try {
      const res = await fetchWithAuth('/api/admin/mentors/invite', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat undangan mentor');
      }

      setInviteResult({
        inviteUrl: data.inviteUrl,
        token: data.token,
        email: data.email,
        fullName: data.fullName,
      });

      setInviteForm({
        fullName: '',
        email: '',
        whatsapp: '',
        institution: '',
        position: '',
        expertise: '',
      });

      loadAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // If a program is selected, show detail view directly
  if (selectedProgramId !== null) {
    return (
      <AdminProgramDetail
        programId={selectedProgramId}
        onBack={() => {
          setSelectedProgramId(null);
          loadAll();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Program Pendampingan & Penugasan Mentor
          </h1>
          <p className="text-xs text-slate-500">
            Kelola program pendampingan, masukkan mentor & UMKM, dan plotting penugasan mentor sekaligus
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
            onClick={() => {
              setSelectedMentorIdsForNewProgram([]);
              setMentorSearchInModal('');
              setIsProgramModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Program</span>
          </button>

          <button
            onClick={() => {
              if (programs.length > 0 && !assignProgramId) {
                setAssignProgramId(String(programs[0].id));
              }
              if (mentors.length > 0 && !assignMentorId) {
                setAssignMentorId(String(mentors[0].id));
              }
              setAssignTargetUmkmIds([]);
              setIsAssignModalOpen(true);
            }}
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Daftar Program Pendampingan</h2>
          <span className="text-xs text-slate-500">Klik program untuk mengelola UMKM & plotting mentor</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => {
            // Count assignments in this program
            const progAssignments = assignments.filter((a) => a.programId === p.id);

            return (
              <div
                key={p.id}
                className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                        {p.batch || 'Batch 1'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">
                        {p.name}
                      </h3>
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

                  {p.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Mulai: {formatDate(p.startDate)} {p.endDate && `• Selesai: ${formatDate(p.endDate)}`}
                      </span>
                    </div>
                    {p.organizer && (
                      <div className="text-[11px] text-slate-600">
                        Penyelenggara: <strong>{p.organizer}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold">
                    <UserCheck className="h-4 w-4" />
                    <span>{progAssignments.length} UMKM Terplot</span>
                  </div>

                  <button
                    onClick={() => setSelectedProgramId(p.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Detail & Kelola UMKM</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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

      {/* Modal: New Program with DIRECT MULTI-MENTOR SELECTION */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Program Pendampingan</h3>
                <p className="text-xs text-slate-500">
                  Buat program baru dan tambahkan langsung lebih dari satu mentor ke dalamnya
                </p>
              </div>
              <button
                onClick={() => setIsProgramModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4 text-xs overflow-y-auto pr-1">
              <div>
                <label className="block font-semibold text-slate-700">Nama Program *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Akselerasi UMKM Naik Kelas 2026"
                  value={programForm.name}
                  onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Batch / Gelombang</label>
                  <input
                    type="text"
                    value={programForm.batch}
                    onChange={(e) => setProgramForm({ ...programForm, batch: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Penyelenggara / Organizer</label>
                  <input
                    type="text"
                    value={programForm.organizer}
                    onChange={(e) => setProgramForm({ ...programForm, organizer: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Deskripsi Program</label>
                <textarea
                  rows={2}
                  value={programForm.description}
                  onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-indigo-600"
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

              {/* Direct Multi-Mentor Selection */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-900">
                      Pilih Mentor Langsung ke Program (Bisa Lebih dari Satu)
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {selectedMentorIdsForNewProgram.length} mentor dipilih
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMentorIdsForNewProgram.length === mentors.length) {
                        setSelectedMentorIdsForNewProgram([]);
                      } else {
                        setSelectedMentorIdsForNewProgram(mentors.map((m) => m.id));
                      }
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {selectedMentorIdsForNewProgram.length === mentors.length
                      ? 'Batalkan Semua'
                      : 'Pilih Semua Mentor'}
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter mentor berdasarkan nama atau keahlian..."
                    value={mentorSearchInModal}
                    onChange={(e) => setMentorSearchInModal(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {mentors
                    .filter(
                      (m) =>
                        m.fullName.toLowerCase().includes(mentorSearchInModal.toLowerCase()) ||
                        (m.expertise && m.expertise.toLowerCase().includes(mentorSearchInModal.toLowerCase()))
                    )
                    .map((m) => {
                      const isChecked = selectedMentorIdsForNewProgram.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() =>
                            setSelectedMentorIdsForNewProgram((prev) =>
                              prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                            )
                          }
                          className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-indigo-500 bg-indigo-50/60'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isChecked ? (
                              <CheckSquare className="h-4 w-4 text-indigo-600" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 truncate">{m.fullName}</span>
                              <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                                {m.institution || 'Mentor'}
                              </span>
                            </div>
                            {m.expertise && (
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                Keahlian: {m.expertise}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                  {saving ? 'Menyimpan...' : 'Simpan Program & Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Assign Mentor to UMKM */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tugaskan Mentor ke UMKM</h3>
                <p className="text-xs text-slate-500">
                  Dapat menugaskan satu mentor ke lebih dari satu UMKM sekaligus
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs overflow-y-auto pr-1">
              <div>
                <label className="block font-semibold text-slate-700">Pilih Program *</label>
                <select
                  required
                  value={assignProgramId}
                  onChange={(e) => setAssignProgramId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none font-semibold text-slate-800"
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
                  value={assignMentorId}
                  onChange={(e) => setAssignMentorId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none font-semibold text-slate-800"
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.institution || 'Mentor'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-UMKM Checkbox Selection */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-900">
                    Pilih UMKM Sasaran ({assignTargetUmkmIds.length} dipilih) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (assignTargetUmkmIds.length === umkms.length) {
                        setAssignTargetUmkmIds([]);
                      } else {
                        setAssignTargetUmkmIds(umkms.map((u) => u.id));
                      }
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {assignTargetUmkmIds.length === umkms.length ? 'Batal Semua' : 'Pilih Semua UMKM'}
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                  {umkms.map((u) => {
                    const isChecked = assignTargetUmkmIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() =>
                          setAssignTargetUmkmIds((prev) =>
                            prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                          )
                        }
                        className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? 'border-indigo-500 bg-indigo-50/60'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate">{u.businessName}</span>
                            <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                              {u.cityRegency || '-'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pemilik: {u.ownerName} • {u.businessSector || 'UMKM'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  disabled={saving || assignTargetUmkmIds.length === 0}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : `Plotting ke (${assignTargetUmkmIds.length}) UMKM`}
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
