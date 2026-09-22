import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { formatDate } from '../../utils/formatters.ts';
import {
  ArrowLeft,
  Users,
  UserCheck,
  Building2,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  UserPlus,
  Briefcase,
  CheckSquare,
  Square,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  Tag,
  Clock,
  ChevronRight,
  Store,
} from 'lucide-react';

interface AdminProgramDetailProps {
  programId: number;
  onBack: () => void;
}

interface EnrolledMentor {
  id: number;
  profileId: number;
  fullName: string;
  email: string;
  whatsapp?: string;
  institution?: string;
  position?: string;
  bio?: string;
  expertise?: string;
  assignedUmkmCount: number;
}

interface EnrolledUmkm {
  id: number;
  profileId: number;
  businessName: string;
  ownerName: string;
  whatsapp?: string;
  email?: string;
  cityRegency?: string;
  district?: string;
  businessSector?: string;
  commodity?: string;
  assignmentId: number | null;
  assignedMentorId: number | null;
  assignedMentorName: string | null;
  assignedMentorEmail: string | null;
  assignedAt: string | null;
}

export const AdminProgramDetail: React.FC<AdminProgramDetailProps> = ({ programId, onBack }) => {
  const { fetchWithAuth } = useAuth();

  const [program, setProgram] = useState<any>(null);
  const [mentors, setMentors] = useState<EnrolledMentor[]>([]);
  const [umkms, setUmkms] = useState<EnrolledUmkm[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUmkms: 0,
    totalMentors: 0,
    assignedUmkmsCount: 0,
    unassignedUmkmsCount: 0,
  });

  // All available pool from system (for adding new mentors/UMKMs)
  const [allSystemMentors, setAllSystemMentors] = useState<any[]>([]);
  const [allSystemUmkms, setAllSystemUmkms] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active sub-tab: 'umkm' | 'mentors' | 'assignments'
  const [activeTab, setActiveTab] = useState<'umkm' | 'mentors' | 'assignments'>('umkm');

  // Search & Filters for UMKM table
  const [umkmSearch, setUmkmSearch] = useState<string>('');
  const [umkmFilter, setUmkmFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');

  // Selected UMKMs for Bulk Action
  const [selectedUmkmIds, setSelectedUmkmIds] = useState<number[]>([]);

  // Modals state
  const [isAddUmkmModalOpen, setIsAddUmkmModalOpen] = useState<boolean>(false);
  const [addUmkmSearch, setAddUmkmSearch] = useState<string>('');
  const [selectedUmkmsToAdd, setSelectedUmkmsToAdd] = useState<number[]>([]);

  const [isAddMentorModalOpen, setIsAddMentorModalOpen] = useState<boolean>(false);
  const [addMentorSearch, setAddMentorSearch] = useState<string>('');
  const [selectedMentorsToAdd, setSelectedMentorsToAdd] = useState<number[]>([]);

  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState<boolean>(false);
  const [bulkAssignMentorId, setBulkAssignMentorId] = useState<string>('');
  const [bulkAssignTargetUmkmIds, setBulkAssignTargetUmkmIds] = useState<number[]>([]);

  const [isSingleAssignModalOpen, setIsSingleAssignModalOpen] = useState<boolean>(false);
  const [singleAssignUmkm, setSingleAssignUmkm] = useState<EnrolledUmkm | null>(null);
  const [singleAssignMentorId, setSingleAssignMentorId] = useState<string>('');

  const loadProgramDetail = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [progRes, mentorsPoolRes, umkmPoolRes] = await Promise.all([
        fetchWithAuth(`/api/programs/${programId}`),
        fetchWithAuth('/api/admin/mentors'),
        fetchWithAuth('/api/admin/umkm'),
      ]);

      if (!progRes.ok) {
        throw new Error('Gagal memuat informasi program');
      }

      const data = await progRes.json();
      setProgram(data.program);
      setMentors(data.mentors || []);
      setUmkms(data.umkms || []);
      setAssignments(data.assignments || []);
      setStats(
        data.stats || {
          totalUmkms: (data.umkms || []).length,
          totalMentors: (data.mentors || []).length,
          assignedUmkmsCount: 0,
          unassignedUmkmsCount: 0,
        }
      );

      if (mentorsPoolRes.ok) {
        setAllSystemMentors(await mentorsPoolRes.json());
      }
      if (umkmPoolRes.ok) {
        setAllSystemUmkms(await umkmPoolRes.json());
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgramDetail();
  }, [programId]);

  // Flash message timeout
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // Available UMKMs to add (those in allSystemUmkms but not yet enrolled in this program)
  const availableUmkmsToAdd = useMemo(() => {
    const enrolledIds = new Set(umkms.map((u) => u.id));
    return allSystemUmkms.filter((u) => !enrolledIds.has(u.id));
  }, [allSystemUmkms, umkms]);

  // Available Mentors to add (those in allSystemMentors but not yet enrolled in this program)
  const availableMentorsToAdd = useMemo(() => {
    const enrolledIds = new Set(mentors.map((m) => m.id));
    return allSystemMentors.filter((m) => !enrolledIds.has(m.id));
  }, [allSystemMentors, mentors]);

  // Filtered UMKMs in current program
  const filteredProgramUmkms = useMemo(() => {
    return umkms.filter((u) => {
      const matchSearch =
        u.businessName.toLowerCase().includes(umkmSearch.toLowerCase()) ||
        u.ownerName.toLowerCase().includes(umkmSearch.toLowerCase()) ||
        (u.businessSector && u.businessSector.toLowerCase().includes(umkmSearch.toLowerCase())) ||
        (u.cityRegency && u.cityRegency.toLowerCase().includes(umkmSearch.toLowerCase()));

      if (!matchSearch) return false;

      if (umkmFilter === 'UNASSIGNED') return u.assignedMentorId === null;
      if (umkmFilter === 'ASSIGNED') return u.assignedMentorId !== null;
      return true;
    });
  }, [umkms, umkmSearch, umkmFilter]);

  // Handle toggle single select in UMKM table
  const handleToggleSelectUmkm = (id: number) => {
    setSelectedUmkmIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle select all currently visible
  const handleToggleSelectAllVisible = () => {
    const visibleIds = filteredProgramUmkms.map((u) => u.id);
    const allSelected = visibleIds.every((id) => selectedUmkmIds.includes(id));
    if (allSelected) {
      setSelectedUmkmIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedUmkmIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // 1. Submit Add UMKMs to Program
  const handleAddUmkmsSubmit = async () => {
    if (selectedUmkmsToAdd.length === 0) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth(`/api/programs/${programId}/umkms`, {
        method: 'POST',
        body: JSON.stringify({ umkmIds: selectedUmkmsToAdd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan UMKM ke program');

      setSuccessMsg(data.message || 'UMKM berhasil ditambahkan ke program');
      setIsAddUmkmModalOpen(false);
      setSelectedUmkmsToAdd([]);
      await loadProgramDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 2. Submit Add Mentors to Program
  const handleAddMentorsSubmit = async () => {
    if (selectedMentorsToAdd.length === 0) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth(`/api/programs/${programId}/mentors`, {
        method: 'POST',
        body: JSON.stringify({ mentorIds: selectedMentorsToAdd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan mentor ke program');

      setSuccessMsg(data.message || 'Mentor berhasil ditambahkan ke program');
      setIsAddMentorModalOpen(false);
      setSelectedMentorsToAdd([]);
      await loadProgramDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 3. Submit Bulk Mentor Assignment (assigning 1 mentor to multiple UMKMs simultaneously)
  const handleBulkAssignSubmit = async () => {
    if (!bulkAssignMentorId || bulkAssignTargetUmkmIds.length === 0) {
      setErrorMsg('Pilih mentor pendamping dan minimal 1 UMKM target.');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth('/api/assignments/bulk', {
        method: 'POST',
        body: JSON.stringify({
          programId,
          mentorId: Number(bulkAssignMentorId),
          umkmIds: bulkAssignTargetUmkmIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menugaskan mentor masal');

      setSuccessMsg(data.message || 'Penugasan mentor masal berhasil disimpan.');
      setIsBulkAssignModalOpen(false);
      setBulkAssignTargetUmkmIds([]);
      setSelectedUmkmIds([]);
      await loadProgramDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 4. Submit Single Mentor Assignment
  const handleSingleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleAssignUmkm || !singleAssignMentorId) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetchWithAuth('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          programId,
          mentorId: Number(singleAssignMentorId),
          umkmId: singleAssignUmkm.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menugaskan mentor');

      setSuccessMsg('Mentor berhasil ditugaskan ke UMKM.');
      setIsSingleAssignModalOpen(false);
      setSingleAssignUmkm(null);
      await loadProgramDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 5. Remove UMKM from program
  const handleRemoveUmkm = async (umkmId: number, name: string) => {
    if (!window.confirm(`Keluarkan UMKM "${name}" dari program ini? Penugasan mentor yang terkait juga akan diakhiri.`)) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/programs/${programId}/umkms/${umkmId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengeluarkan UMKM');

      setSuccessMsg(`UMKM ${name} berhasil dikeluarkan dari program.`);
      await loadProgramDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 6. Remove Mentor from program
  const handleRemoveMentor = async (mentorId: number, name: string) => {
    if (!window.confirm(`Keluarkan mentor "${name}" dari program ini? Semua penugasan UMKM mentor ini dalam program akan diakhiri.`)) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/programs/${programId}/mentors/${mentorId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengeluarkan mentor');

      setSuccessMsg(`Mentor ${name} berhasil dikeluarkan dari program.`);
      await loadProgramDetail();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 7. Delete an assignment
  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!window.confirm('Batalkan penugasan mentor ini? UMKM akan kembali berstatus belum memiliki mentor.')) {
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccessMsg('Penugasan mentor berhasil dibatalkan.');
        loadProgramDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !program) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 mb-3" />
        <p className="text-xs font-medium">Memuat detail program pendampingan...</p>
      </div>
    );
  }

  return (
    <div id="admin-program-detail-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-programs"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            title="Kembali ke Daftar Program"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Program Pendampingan</span>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="font-semibold text-slate-700">{program?.name}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {program?.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add UMKM button */}
          <button
            id="btn-open-add-umkm-modal"
            onClick={() => {
              setSelectedUmkmsToAdd([]);
              setAddUmkmSearch('');
              setIsAddUmkmModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah UMKM ke Program</span>
          </button>

          {/* Bulk Assign Mentor button */}
          <button
            id="btn-open-bulk-assign-modal"
            onClick={() => {
              if (mentors.length === 0) {
                alert('Belum ada mentor yang terdaftar dalam program ini. Silakan tambahkan mentor terlebih dahulu.');
                return;
              }
              setBulkAssignMentorId(String(mentors[0].id));
              // Default to selected UMKMs or all unassigned
              if (selectedUmkmIds.length > 0) {
                setBulkAssignTargetUmkmIds(selectedUmkmIds);
              } else {
                const unassignedIds = umkms.filter((u) => !u.assignedMentorId).map((u) => u.id);
                setBulkAssignTargetUmkmIds(unassignedIds.length > 0 ? unassignedIds : umkms.map((u) => u.id));
              }
              setIsBulkAssignModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            <span>Tugaskan Mentor ke UMKM</span>
          </button>

          {/* Add Mentor to program button */}
          <button
            id="btn-open-add-mentor-modal"
            onClick={() => {
              setSelectedMentorsToAdd([]);
              setAddMentorSearch('');
              setIsAddMentorModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah Mentor</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Program Summary Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  program?.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                STATUS: {program?.status}
              </span>
              {program?.organizer && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-slate-500" />
                  {program.organizer}
                </span>
              )}
            </div>
            {program?.description && (
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {program.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>
                Mulai: <strong className="text-slate-700 font-semibold">{formatDate(program?.startDate)}</strong>
              </span>
            </div>
            {program?.endDate && (
              <>
                <span className="text-slate-300">•</span>
                <span>
                  Selesai: <strong className="text-slate-700 font-semibold">{formatDate(program.endDate)}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Total UMKM</span>
              <Store className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">{stats.totalUmkms}</span>
              <span className="text-[10px] text-slate-400">pelaku usaha</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Mentor Program</span>
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-indigo-600">{stats.totalMentors}</span>
              <span className="text-[10px] text-slate-400">pendamping</span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-700">Sudah Ada Mentor</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-700">{stats.assignedUmkmsCount}</span>
              <span className="text-[10px] text-emerald-600 font-medium">
                {stats.totalUmkms > 0 ? `${Math.round((stats.assignedUmkmsCount / stats.totalUmkms) * 100)}%` : '0%'}
              </span>
            </div>
          </div>

          <div
            className={`rounded-xl border p-3.5 ${
              stats.unassignedUmkmsCount > 0
                ? 'border-amber-200 bg-amber-50/60'
                : 'border-slate-100 bg-slate-50/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-medium ${
                  stats.unassignedUmkmsCount > 0 ? 'text-amber-800' : 'text-slate-500'
                }`}
              >
                Belum Ada Mentor
              </span>
              <AlertCircle
                className={`h-4 w-4 ${
                  stats.unassignedUmkmsCount > 0 ? 'text-amber-600' : 'text-slate-400'
                }`}
              />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`text-xl font-bold ${
                  stats.unassignedUmkmsCount > 0 ? 'text-amber-800' : 'text-slate-900'
                }`}
              >
                {stats.unassignedUmkmsCount}
              </span>
              <span className="text-[10px] text-slate-400">perlu plotting</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('umkm')}
          className={`relative py-3 px-4 text-xs font-bold transition-colors ${
            activeTab === 'umkm'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Daftar UMKM Peserta</span>
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'umkm' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {umkms.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mentors')}
          className={`relative py-3 px-4 text-xs font-bold transition-colors ${
            activeTab === 'mentors'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Mentor Program</span>
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'mentors' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {mentors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`relative py-3 px-4 text-xs font-bold transition-colors ${
            activeTab === 'assignments'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Pasangan Penugasan</span>
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === 'assignments' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {assignments.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: UMKM BINAAN & PENUGASAN MENTOR                     */}
      {/* ========================================================= */}
      {activeTab === 'umkm' && (
        <div className="space-y-4">
          {/* Filter Bar & Bulk Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama usaha, pemilik, sektor..."
                  value={umkmSearch}
                  onChange={(e) => setUmkmSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <select
                value={umkmFilter}
                onChange={(e) => setUmkmFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua Status Plotting ({umkms.length})</option>
                <option value="UNASSIGNED">Belum Punya Mentor ({stats.unassignedUmkmsCount})</option>
                <option value="ASSIGNED">Sudah Ditugaskan ({stats.assignedUmkmsCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedUmkmsToAdd([]);
                  setAddUmkmSearch('');
                  setIsAddUmkmModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah UMKM</span>
              </button>
            </div>
          </div>

          {/* Bulk Action Sticky Bar if any checked */}
          {selectedUmkmIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-900 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                  {selectedUmkmIds.length}
                </span>
                <span className="font-semibold">UMKM Dipilih</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (mentors.length === 0) {
                      alert('Belum ada mentor dalam program ini. Tambahkan mentor terlebih dahulu.');
                      return;
                    }
                    setBulkAssignMentorId(String(mentors[0].id));
                    setBulkAssignTargetUmkmIds(selectedUmkmIds);
                    setIsBulkAssignModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Tugaskan Mentor ke {selectedUmkmIds.length} UMKM Terpilih</span>
                </button>

                <button
                  onClick={() => setSelectedUmkmIds([])}
                  className="rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* UMKM Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-3.5 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAllVisible}
                        className="text-slate-400 hover:text-slate-600"
                        title="Pilih Semua yang Ditampilkan"
                      >
                        {filteredProgramUmkms.length > 0 &&
                        filteredProgramUmkms.every((u) => selectedUmkmIds.includes(u.id)) ? (
                          <CheckSquare className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3.5">Nama Usaha & Sektor</th>
                    <th className="py-3 px-3.5">Pemilik & Kontak</th>
                    <th className="py-3 px-3.5">Kota / Wilayah</th>
                    <th className="py-3 px-3.5">Mentor Pendamping</th>
                    <th className="py-3 px-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProgramUmkms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Store className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-medium text-slate-600">Belum ada UMKM yang sesuai dengan filter</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Klik tombol &quot;Tambah UMKM ke Program&quot; untuk mendaftarkan pelaku usaha ke program ini.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProgramUmkms.map((u) => {
                      const isSelected = selectedUmkmIds.includes(u.id);
                      return (
                        <tr
                          key={u.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-3 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectUmkm(u.id)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-indigo-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900">{u.businessName}</div>
                            {u.businessSector && (
                              <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                {u.businessSector}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="font-medium text-slate-800">{u.ownerName}</div>
                            {u.whatsapp && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3 text-emerald-600" />
                                <span>{u.whatsapp}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3.5 text-slate-600">
                            {u.cityRegency || '-'}
                          </td>

                          <td className="py-3 px-3.5">
                            {u.assignedMentorId ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-indigo-700 flex items-center gap-1.5">
                                  <UserCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                  <span>{u.assignedMentorName}</span>
                                </div>
                                {u.assignedAt && (
                                  <div className="text-[10px] text-slate-400">
                                    Ditugaskan: {formatDate(u.assignedAt)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                                <AlertCircle className="h-3 w-3" />
                                Belum Ada Mentor
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setSingleAssignUmkm(u);
                                  setSingleAssignMentorId(
                                    u.assignedMentorId ? String(u.assignedMentorId) : (mentors[0]?.id ? String(mentors[0].id) : '')
                                  );
                                  setIsSingleAssignModalOpen(true);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs"
                              >
                                {u.assignedMentorId ? 'Ganti Mentor' : 'Tugaskan Mentor'}
                              </button>

                              <button
                                onClick={() => handleRemoveUmkm(u.id, u.businessName)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                title="Keluarkan UMKM dari Program"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MENTOR PROGRAM                                     */}
      {/* ========================================================= */}
      {activeTab === 'mentors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-xs font-bold text-slate-900">
                Daftar Mentor Pendamping Terlibat ({mentors.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Mentor yang terdaftar secara resmi mendampingi pelaku usaha dalam program ini
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedMentorsToAdd([]);
                setAddMentorSearch('');
                setIsAddMentorModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Tambah Mentor ke Program</span>
            </button>
          </div>

          {mentors.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">Belum ada mentor di program ini</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tambahkan mentor agar admin dapat mulai menugaskan pelaku UMKM ke mentor pendamping yang sesuai.
              </p>
              <button
                onClick={() => setIsAddMentorModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <UserPlus className="h-4 w-4" />
                <span>Pilih & Tambahkan Mentor</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map((m) => {
                // Find all UMKMs assigned to this mentor in this program
                const myAssignedUmkms = umkms.filter((u) => u.assignedMentorId === m.id);

                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{m.fullName}</h3>
                          <p className="text-[11px] text-slate-500">{m.position || m.institution || 'Mentor'}</p>
                        </div>
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                          {myAssignedUmkms.length} UMKM Binaan
                        </span>
                      </div>

                      {m.expertise && (
                        <div className="flex flex-wrap gap-1">
                          {m.expertise.split(',').map((exp, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              {exp.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="space-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        {m.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{m.email}</span>
                          </div>
                        )}
                        {m.whatsapp && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{m.whatsapp}</span>
                          </div>
                        )}
                      </div>

                      {/* List of UMKMs assigned to this mentor */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          UMKM yang Didampingi:
                        </span>
                        {myAssignedUmkms.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">Belum ada UMKM ditugaskan</p>
                        ) : (
                          <div className="space-y-1 max-h-28 overflow-y-auto">
                            {myAssignedUmkms.map((au) => (
                              <div
                                key={au.id}
                                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 text-slate-700"
                              >
                                <span className="font-semibold truncate">{au.businessName}</span>
                                <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                  {au.cityRegency || au.businessSector}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                      <button
                        onClick={() => {
                          setBulkAssignMentorId(String(m.id));
                          // Pre-select unassigned UMKMs
                          const unassigned = umkms.filter((u) => !u.assignedMentorId).map((u) => u.id);
                          setBulkAssignTargetUmkmIds(unassigned);
                          setIsBulkAssignModalOpen(true);
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Tugaskan UMKM Baru</span>
                      </button>

                      <button
                        onClick={() => handleRemoveMentor(m.id, m.fullName)}
                        className="text-xs text-rose-500 hover:text-rose-700 p-1"
                        title="Keluarkan dari Program"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SEMUA RIWAYAT PENUGASAN                            */}
      {/* ========================================================= */}
      {activeTab === 'assignments' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900">
                Riwayat Pasangan Penugasan Mentor ke UMKM ({assignments.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Daftar lengkap relasi pendampingan aktif dalam program ini
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Nama UMKM</th>
                  <th className="py-2.5 px-4">Pemilik UMKM</th>
                  <th className="py-2.5 px-4">Mentor Pendamping</th>
                  <th className="py-2.5 px-4 text-center">Tanggal Penugasan</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada penugasan mentor dibuat di program ini.
                    </td>
                  </tr>
                ) : (
                  assignments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.businessName}</td>
                      <td className="py-3 px-4 text-slate-600">{item.ownerName}</td>
                      <td className="py-3 px-4 font-semibold text-indigo-700">{item.mentorName}</td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {formatDate(item.assignedAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAssignment(item.id)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Batalkan Penugasan"
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
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH UMKM KE PROGRAM                             */}
      {/* ========================================================= */}
      {isAddUmkmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah UMKM ke Program</h3>
                <p className="text-xs text-slate-500">
                  Pilih satu atau lebih pelaku usaha untuk didaftarkan ke program ini
                </p>
              </div>
              <button
                onClick={() => setIsAddUmkmModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search and Select All controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari UMKM yang belum terdaftar..."
                  value={addUmkmSearch}
                  onChange={(e) => setAddUmkmSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const matchingIds = availableUmkmsToAdd
                    .filter(
                      (u) =>
                        u.businessName.toLowerCase().includes(addUmkmSearch.toLowerCase()) ||
                        u.ownerName.toLowerCase().includes(addUmkmSearch.toLowerCase()) ||
                        (u.businessSector && u.businessSector.toLowerCase().includes(addUmkmSearch.toLowerCase()))
                    )
                    .map((u) => u.id);

                  if (matchingIds.every((id) => selectedUmkmsToAdd.includes(id))) {
                    setSelectedUmkmsToAdd([]);
                  } else {
                    setSelectedUmkmsToAdd(matchingIds);
                  }
                }}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {selectedUmkmsToAdd.length > 0 ? 'Bersihkan Pilihan' : 'Pilih Semua'}
              </button>
            </div>

            {/* List of available UMKMs */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[220px] max-h-[350px] pr-1">
              {availableUmkmsToAdd
                .filter(
                  (u) =>
                    u.businessName.toLowerCase().includes(addUmkmSearch.toLowerCase()) ||
                    u.ownerName.toLowerCase().includes(addUmkmSearch.toLowerCase()) ||
                    (u.businessSector && u.businessSector.toLowerCase().includes(addUmkmSearch.toLowerCase()))
                )
                .map((u) => {
                  const isChecked = selectedUmkmsToAdd.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() =>
                        setSelectedUmkmsToAdd((prev) =>
                          prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                        )
                      }
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
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
                          <h4 className="text-xs font-bold text-slate-900 truncate">{u.businessName}</h4>
                          <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                            {u.cityRegency || '-'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Pemilik: <strong>{u.ownerName}</strong>
                        </p>
                        {u.businessSector && (
                          <span className="inline-block mt-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {u.businessSector}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

              {availableUmkmsToAdd.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Semua pelaku UMKM yang ada di sistem sudah terdaftar dalam program ini.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {selectedUmkmsToAdd.length} UMKM dipilih
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUmkmModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={saving || selectedUmkmsToAdd.length === 0}
                  onClick={handleAddUmkmsSubmit}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Menambahkan...' : `Tambahkan (${selectedUmkmsToAdd.length}) UMKM ke Program`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH MENTOR KE PROGRAM                           */}
      {/* ========================================================= */}
      {isAddMentorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Mentor ke Program</h3>
                <p className="text-xs text-slate-500">
                  Pilih satu atau lebih mentor pendamping untuk dilibatkan dalam program ini
                </p>
              </div>
              <button
                onClick={() => setIsAddMentorModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search and Select All controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari mentor berdasarkan nama atau keahlian..."
                  value={addMentorSearch}
                  onChange={(e) => setAddMentorSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const matchingIds = availableMentorsToAdd
                    .filter(
                      (m) =>
                        m.fullName.toLowerCase().includes(addMentorSearch.toLowerCase()) ||
                        (m.expertise && m.expertise.toLowerCase().includes(addMentorSearch.toLowerCase()))
                    )
                    .map((m) => m.id);

                  if (matchingIds.every((id) => selectedMentorsToAdd.includes(id))) {
                    setSelectedMentorsToAdd([]);
                  } else {
                    setSelectedMentorsToAdd(matchingIds);
                  }
                }}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {selectedMentorsToAdd.length > 0 ? 'Bersihkan Pilihan' : 'Pilih Semua'}
              </button>
            </div>

            {/* List of available Mentors */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[220px] max-h-[350px] pr-1">
              {availableMentorsToAdd
                .filter(
                  (m) =>
                    m.fullName.toLowerCase().includes(addMentorSearch.toLowerCase()) ||
                    (m.expertise && m.expertise.toLowerCase().includes(addMentorSearch.toLowerCase())) ||
                    (m.institution && m.institution.toLowerCase().includes(addMentorSearch.toLowerCase()))
                )
                .map((m) => {
                  const isChecked = selectedMentorsToAdd.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() =>
                        setSelectedMentorsToAdd((prev) =>
                          prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                        )
                      }
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
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
                          <h4 className="text-xs font-bold text-slate-900 truncate">{m.fullName}</h4>
                          <span className="text-[10px] text-indigo-600 font-semibold shrink-0 ml-2">
                            {m.institution || 'Mentor'}
                          </span>
                        </div>
                        {m.position && <p className="text-[11px] text-slate-500 mt-0.5">{m.position}</p>}
                        {m.expertise && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate">
                            Keahlian: {m.expertise}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

              {availableMentorsToAdd.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Semua mentor di sistem sudah terdaftar dalam program ini.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {selectedMentorsToAdd.length} mentor dipilih
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMentorModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={saving || selectedMentorsToAdd.length === 0}
                  onClick={handleAddMentorsSubmit}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Menambahkan...' : `Tambahkan (${selectedMentorsToAdd.length}) Mentor ke Program`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TUGASKAN MENTOR MASAL (BULK ASSIGN)                */}
      {/* ========================================================= */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Tugaskan Mentor ke Lebih dari Satu UMKM Sekaligus
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih 1 mentor pendamping, lalu tentukan daftar UMKM yang akan ditugaskan kepadanya
                </p>
              </div>
              <button
                onClick={() => setIsBulkAssignModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mentor Selection */}
            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-800">
                1. Pilih Mentor Pendamping *
              </label>
              <select
                value={bulkAssignMentorId}
                onChange={(e) => setBulkAssignMentorId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.institution || 'Mentor'}) - {m.assignedUmkmCount} UMKM saat ini
                  </option>
                ))}
              </select>
            </div>

            {/* Target UMKMs Checkbox List */}
            <div className="space-y-2 flex-1 flex flex-col min-h-0 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  2. Pilih UMKM Binaan Sasaran ({bulkAssignTargetUmkmIds.length} dipilih) *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const unassigned = umkms.filter((u) => !u.assignedMentorId).map((u) => u.id);
                      setBulkAssignTargetUmkmIds(unassigned);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Hanya yang Belum Ada Mentor
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (bulkAssignTargetUmkmIds.length === umkms.length) {
                        setBulkAssignTargetUmkmIds([]);
                      } else {
                        setBulkAssignTargetUmkmIds(umkms.map((u) => u.id));
                      }
                    }}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                  >
                    {bulkAssignTargetUmkmIds.length === umkms.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2.5 max-h-[300px]">
                {umkms.map((u) => {
                  const isChecked = bulkAssignTargetUmkmIds.includes(u.id);
                  const isAssignedToOther =
                    u.assignedMentorId && u.assignedMentorId !== Number(bulkAssignMentorId);
                  const isAssignedToSame =
                    u.assignedMentorId && u.assignedMentorId === Number(bulkAssignMentorId);

                  return (
                    <div
                      key={u.id}
                      onClick={() =>
                        setBulkAssignTargetUmkmIds((prev) =>
                          prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                        )
                      }
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-100 hover:bg-slate-50'
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
                          <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                            {u.cityRegency || '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                          <span>Pemilik: {u.ownerName}</span>
                          {isAssignedToSame && (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              (Sudah dibimbing mentor ini)
                            </span>
                          )}
                          {isAssignedToOther && (
                            <span className="text-[10px] text-amber-600 font-medium">
                              (Saat ini: {u.assignedMentorName} - akan dialihkan)
                            </span>
                          )}
                          {!u.assignedMentorId && (
                            <span className="text-[10px] text-slate-400 italic">
                              (Belum ada mentor)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {umkms.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Belum ada UMKM dalam program ini. Tambahkan UMKM terlebih dahulu.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-600">
                Total <strong>{bulkAssignTargetUmkmIds.length}</strong> UMKM akan ditugaskan
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkAssignModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={saving || bulkAssignTargetUmkmIds.length === 0 || !bulkAssignMentorId}
                  onClick={handleBulkAssignSubmit}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Penugasan Masal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TUGASKAN MENTOR TUNGGAL (SINGLE ASSIGN)            */}
      {/* ========================================================= */}
      {isSingleAssignModalOpen && singleAssignUmkm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tugaskan Mentor Pendamping</h3>
                <p className="text-xs text-slate-500">
                  Untuk UMKM: <strong>{singleAssignUmkm.businessName}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsSingleAssignModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSingleAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Mentor Pendamping *
                </label>
                <select
                  required
                  value={singleAssignMentorId}
                  onChange={(e) => setSingleAssignMentorId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:border-indigo-600 font-semibold text-slate-800"
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} - {m.institution || 'Mentor'} ({m.assignedUmkmCount} binaan)
                    </option>
                  ))}
                </select>
              </div>

              {singleAssignUmkm.assignedMentorId && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Perhatian:</strong> UMKM ini sebelumnya didampingi oleh{' '}
                  <strong>{singleAssignUmkm.assignedMentorName}</strong>. Menyimpan penugasan baru
                  akan mengalihkan pendampingan ke mentor yang dipilih.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSingleAssignModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || !singleAssignMentorId}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Penugasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
