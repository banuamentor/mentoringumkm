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
  X,
  AlertCircle,
  Search,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Store,
  UserCheck,
  Check,
  Lock,
  Power,
  PowerOff,
  Trash2,
  AlertTriangle,
  UserX,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const AdminMentors: React.FC = () => {
  const { user: currentUser, fetchWithAuth } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'UMKM' | 'MENTOR'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal: Create Account Directly
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [showCreatePassword, setShowCreatePassword] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    role: 'UMKM' as 'UMKM' | 'MENTOR',
    fullName: '',
    email: '',
    password: '',
    whatsapp: '',
    // UMKM
    businessName: '',
    businessSector: 'Kuliner / F&B',
    cityRegency: 'Kota Bandung',
    address: '',
    // Mentor
    institution: 'Klinik Bisnis UMKM',
    position: 'Mentor Bisnis',
    expertise: 'Manajemen Keuangan, HPP & Pemasaran',
  });

  // Success Credentials Dialog
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    role: string;
    fullName: string;
  } | null>(null);

  // Modal: Reset Password
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState<string>('');
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);
  const [resetSuccessResult, setResetSuccessResult] = useState<{
    email: string;
    newPassword: string;
  } | null>(null);

  // Modal: Toggle Status (Aktifkan / Menonaktifkan)
  const [statusModalUser, setStatusModalUser] = useState<{
    user: any;
    targetStatus: 'ACTIVE' | 'INACTIVE';
  } | null>(null);

  // Modal: Delete Account
  const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/admin/all-users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetchWithAuth('/api/admin/create-account', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal membuat akun');
      }

      setCreatedCredentials(resData.credentials);
      setIsCreateModalOpen(false);
      showToast(`Akun ${resData.credentials.fullName} berhasil dibuat dan langsung aktif!`);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetchWithAuth(`/api/admin/users/${resetModalUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: resetPasswordValue || undefined }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal mereset password');
      }

      setResetSuccessResult({
        email: resData.email,
        newPassword: resData.newPassword,
      });
      showToast(`Password untuk ${resData.email} berhasil diatur ulang!`);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusModalUser) return;
    const { user, targetStatus } = statusModalUser;

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetchWithAuth(`/api/admin/users/${user.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ accountStatus: targetStatus }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal mengubah status akun');
      }

      setStatusModalUser(null);
      showToast(
        `Akun ${user.fullName} berhasil ${targetStatus === 'ACTIVE' ? 'diaktifkan kembali' : 'dinonaktifkan'}!`
      );
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui status akun');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetchWithAuth(`/api/admin/users/${deleteModalUser.id}`, {
        method: 'DELETE',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menghapus akun');
      }

      const deletedName = deleteModalUser.fullName;
      setDeleteModalUser(null);
      setDeleteConfirmText('');
      showToast(`Akun ${deletedName} dan seluruh data terkait berhasil dihapus permanen.`);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus akun');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (statusFilter === 'ACTIVE' && u.accountStatus !== 'ACTIVE') return false;
    if (statusFilter === 'INACTIVE' && u.accountStatus === 'ACTIVE') return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.businessName && u.businessName.toLowerCase().includes(q)) ||
      (u.institution && u.institution.toLowerCase().includes(q)) ||
      (u.cityRegency && u.cityRegency.toLowerCase().includes(q))
    );
  });

  const umkmCount = users.filter((u) => u.role === 'UMKM').length;
  const mentorCount = users.filter((u) => u.role === 'MENTOR').length;
  const activeCount = users.filter((u) => u.accountStatus === 'ACTIVE').length;
  const inactiveCount = users.filter((u) => u.accountStatus !== 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-xl transition-all animate-bounce duration-300 ${
            toastMessage.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            <span>Manajemen Akun Pengguna</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola status aktif/nonaktif, hapus akun pengguna, daftarkan akun baru secara langsung, dan reset password
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const defaultPass = generateRandomPassword();
              setCreateForm({
                role: 'UMKM',
                fullName: '',
                email: '',
                password: defaultPass,
                whatsapp: '',
                businessName: '',
                businessSector: 'Kuliner / F&B',
                cityRegency: 'Kota Bandung',
                address: '',
                institution: 'Klinik Bisnis UMKM',
                position: 'Mentor Bisnis',
                expertise: 'Manajemen Keuangan & HPP',
              });
              setErrorMsg(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>+ Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Total Pengguna</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">{users.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Terdaftar dalam database</div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700">Pelaku UMKM</div>
          <div className="mt-1 text-xl font-extrabold text-emerald-900">{umkmCount}</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Unit usaha terdaftar</div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-sky-700">Mentor Bisnis</div>
          <div className="mt-1 text-xl font-extrabold text-sky-900">{mentorCount}</div>
          <div className="text-[10px] text-sky-600/80 mt-0.5">Pendamping aktif</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">Status Akun</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600">{activeCount} Aktif</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-rose-600">{inactiveCount} Nonaktif</span>
            </div>
          </div>
          <Shield className="h-6 w-6 text-indigo-500/40" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                roleFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('UMKM')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                roleFilter === 'UMKM' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>UMKM ({umkmCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('MENTOR')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                roleFilter === 'MENTOR' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Mentor ({mentorCount})</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'INACTIVE' ? 'bg-rose-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nonaktif ({inactiveCount})
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, email, usaha, atau instansi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
            <span>Memuat data pengguna sistem...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {search || roleFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Tidak ada pengguna yang cocok dengan filter atau pencarian.'
              : 'Belum ada akun pengguna terdaftar.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Tipe Akun</th>
                  <th className="py-3.5 px-4">Profil Usaha / Lembaga</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4 text-center">Status Akun</th>
                  <th className="py-3.5 px-4 text-right">Kelola & Aksi Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isUmkm = u.role === 'UMKM';
                  const isMentor = u.role === 'MENTOR';
                  const isAdmin = u.role === 'ADMIN';
                  const isSelf = currentUser?.id === u.id;
                  const isActive = u.accountStatus === 'ACTIVE';

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        !isActive ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                              isUmkm
                                ? 'bg-emerald-100 text-emerald-800'
                                : isMentor
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {u.fullName ? u.fullName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isSelf && (
                                <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[9px] font-extrabold text-purple-700">
                                  Anda (Admin)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              ID #{u.id} • Dibuat {formatDate(u.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                            isUmkm
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isMentor
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {isUmkm ? 'Pelaku UMKM' : isMentor ? 'Mentor Bisnis' : 'Admin'}
                        </span>
                      </td>

                      {/* Profile details */}
                      <td className="py-3.5 px-4">
                        {isUmkm ? (
                          <div>
                            <div className="font-semibold text-slate-900">{u.businessName || '-'}</div>
                            <div className="text-[11px] text-slate-500">
                              {u.businessSector || 'F&B'} • {u.cityRegency || 'Kota Bandung'}
                            </div>
                          </div>
                        ) : isMentor ? (
                          <div>
                            <div className="font-semibold text-slate-900">{u.institution || 'Klinik Bisnis'}</div>
                            <div className="text-[11px] text-slate-500">{u.expertise || 'Pendampingan Bisnis'}</div>
                          </div>
                        ) : (
                          <div className="text-slate-500">Pengelola Sistem GCP</div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-[11px]">{u.email}</span>
                          </div>
                          {u.whatsapp && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="text-[11px]">{u.whatsapp}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.accountStatus === 'INVITED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isActive && <CheckCircle className="h-3 w-3" />}
                          {u.accountStatus === 'INVITED' && <Clock className="h-3 w-3" />}
                          {!isActive && u.accountStatus !== 'INVITED' && <PowerOff className="h-3 w-3" />}
                          <span>{isActive ? 'Aktif' : u.accountStatus === 'INVITED' ? 'Undangan' : 'Nonaktif'}</span>
                        </span>
                      </td>

                      {/* Actions: Activate/Deactivate, Reset Password, Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Toggle Status (Aktifkan / Nonaktifkan) */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => {
                                setErrorMsg(null);
                                setStatusModalUser({
                                  user: u,
                                  targetStatus: isActive ? 'INACTIVE' : 'ACTIVE',
                                });
                              }}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95 ${
                                isActive
                                  ? 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-300'
                                  : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300'
                              }`}
                              title={isActive ? 'Nonaktifkan akun ini' : 'Aktifkan kembali akun ini'}
                            >
                              {isActive ? (
                                <>
                                  <PowerOff className="h-3.5 w-3.5 text-amber-700" />
                                  <span>Nonaktifkan</span>
                                </>
                              ) : (
                                <>
                                  <Power className="h-3.5 w-3.5 text-emerald-700" />
                                  <span>Aktifkan</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* 2. Reset Password */}
                          {!isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setResetModalUser(u);
                                setResetPasswordValue(generateRandomPassword());
                                setResetSuccessResult(null);
                                setErrorMsg(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Reset password akun"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-indigo-600" />
                              <span className="hidden xl:inline">Reset Pass</span>
                            </button>
                          )}

                          {/* 3. Delete Account */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteModalUser(u);
                                setDeleteConfirmText('');
                                setErrorMsg(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Hapus akun permanen"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                              <span className="hidden xl:inline">Hapus</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Create Account Directly */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto my-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Akun Pengguna Baru</h3>
                <p className="text-xs text-slate-500">
                  Daftarkan akun UMKM atau Mentor secara instan dengan email dan password
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              {/* Role Selection Toggle */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Tipe Akun *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'UMKM' })}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 border font-bold transition-all cursor-pointer ${
                      createForm.role === 'UMKM'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Store className="h-4 w-4 text-emerald-600" />
                    <span>Pelaku UMKM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'MENTOR' })}
                    className={`flex items-center justify-center gap-2 rounded-xl p-3 border font-bold transition-all cursor-pointer ${
                      createForm.role === 'MENTOR'
                        ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="h-4 w-4 text-sky-600" />
                    <span>Mentor Bisnis</span>
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder={createForm.role === 'UMKM' ? 'Contoh: Ahmad Fauzi' : 'Contoh: Dr. Budi Santoso'}
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700">Nomor WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={createForm.whatsapp}
                    onChange={(e) => setCreateForm({ ...createForm, whatsapp: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Login Credentials Group */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Lock className="h-4 w-4 text-slate-700" />
                  <span>Kredensial Login Akun</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Email Akun (Login) *</label>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">Password Awal (Min. 8 Karakter) *</label>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, password: generateRandomPassword() })}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                    >
                      Acak Ulang
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-xs font-mono focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Pengguna nantinya dapat mereset atau mengganti password ini sendiri kapan saja.
                  </p>
                </div>
              </div>

              {/* Role Specific Fields */}
              {createForm.role === 'UMKM' ? (
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700">Nama Usaha / Brand UMKM *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kopi Banua Nusantara"
                      value={createForm.businessName}
                      onChange={(e) => setCreateForm({ ...createForm, businessName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700">Sektor Usaha</label>
                      <select
                        value={createForm.businessSector}
                        onChange={(e) => setCreateForm({ ...createForm, businessSector: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                      >
                        <option value="Kuliner / F&B">Kuliner / F&B</option>
                        <option value="Fashion & Konveksi">Fashion & Konveksi</option>
                        <option value="Kerajinan / Kriya">Kerajinan / Kriya</option>
                        <option value="Kecantikan & Herbal">Kecantikan & Herbal</option>
                        <option value="Jasa & Percetakan">Jasa & Percetakan</option>
                        <option value="Pertanian & Olahan">Pertanian & Olahan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700">Kota / Kabupaten</label>
                      <input
                        type="text"
                        placeholder="Contoh: Kota Bandung"
                        value={createForm.cityRegency}
                        onChange={(e) => setCreateForm({ ...createForm, cityRegency: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700">Instansi / Lembaga</label>
                      <input
                        type="text"
                        placeholder="Klinik Bisnis / Kampus"
                        value={createForm.institution}
                        onChange={(e) => setCreateForm({ ...createForm, institution: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700">Jabatan / Posisi</label>
                      <input
                        type="text"
                        placeholder="Senior Mentor"
                        value={createForm.position}
                        onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700">Bidang Keahlian Mentor</label>
                    <input
                      type="text"
                      placeholder="Manajemen Keuangan, HPP, Penetapan Harga"
                      value={createForm.expertise}
                      onChange={(e) => setCreateForm({ ...createForm, expertise: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                >
                  {saving ? 'Menyimpan...' : 'Buat Akun Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Credentials Result Dialog */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-base text-slate-900">Akun Berhasil Didaftarkan!</h3>
                <p className="text-xs text-slate-500 font-normal">Kredensial login berikut sudah siap digunakan.</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama:</span>
                <span className="font-bold text-slate-900">{createdCredentials.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Peran:</span>
                <span className="font-bold text-emerald-700">
                  {createdCredentials.role === 'UMKM' ? 'Pelaku UMKM' : 'Mentor Bisnis'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono font-bold text-slate-900">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/80 pt-2">
                <span className="text-slate-500">Password:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-900">
                  {createdCredentials.password}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 p-3 rounded-xl">
              💡 <strong>Info:</strong> Berikan email & password ini kepada pemilik akun. Mereka dapat login dan mereset password sendiri melalui menu Profil atau opsi &quot;Lupa Password&quot;.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const text = `Kredensial Akun Banua Mentor\nNama: ${createdCredentials.fullName}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
                  copyToClipboard(text, 'created-credentials');
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
              >
                {copiedText === 'created-credentials' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin Kredensial</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Password Dialog */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Password Pengguna</h3>
                <p className="text-xs text-slate-500">Atur password baru untuk akun pengguna ini</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetModalUser(null);
                  setResetSuccessResult(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {resetSuccessResult ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Password Berhasil Direset!</span>
                  </div>
                  <div className="text-slate-700">
                    Akun: <strong>{resetSuccessResult.email}</strong>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-300">
                    <span className="text-slate-500">Password Baru:</span>
                    <span className="font-mono font-bold text-sm text-slate-900">{resetSuccessResult.newPassword}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Password Baru Banua Mentor\nAkun: ${resetSuccessResult.email}\nPassword Baru: ${resetSuccessResult.newPassword}`;
                      copyToClipboard(text, 'reset-password');
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                  >
                    {copiedText === 'reset-password' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin Password</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalUser(null);
                      setResetSuccessResult(null);
                    }}
                    className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1 border border-slate-200">
                  <div className="text-slate-500">Pengguna:</div>
                  <div className="font-bold text-slate-900">{resetModalUser.fullName}</div>
                  <div className="font-mono text-slate-600">{resetModalUser.email}</div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">Password Baru *</label>
                    <button
                      type="button"
                      onClick={() => setResetPasswordValue(generateRandomPassword())}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                    >
                      Acak Ulang
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-xs font-mono focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                  >
                    {saving ? 'Mereset...' : 'Simpan Password Baru'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: Status Confirmation (Aktifkan / Menonaktifkan Akun) */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  statusModalUser.targetStatus === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {statusModalUser.targetStatus === 'ACTIVE' ? (
                  <Power className="h-6 w-6" />
                ) : (
                  <PowerOff className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {statusModalUser.targetStatus === 'ACTIVE' ? 'Aktifkan Akun Pengguna' : 'Nonaktifkan Akun Pengguna'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {statusModalUser.targetStatus === 'ACTIVE'
                    ? 'Pengguna akan dapat masuk kembali dan menggunakan seluruh fitur sistem.'
                    : 'Pengguna yang dinonaktifkan tidak akan dapat masuk (login) ke sistem hingga diaktifkan kembali.'}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Pengguna:</span>
                <span className="font-bold text-slate-900">{statusModalUser.user.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-800">{statusModalUser.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipe Akun:</span>
                <span className="font-semibold text-slate-700">
                  {statusModalUser.user.role === 'UMKM' ? 'Pelaku UMKM' : 'Mentor Bisnis'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={saving}
                className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer active:scale-95 transition-all ${
                  statusModalUser.targetStatus === 'ACTIVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {saving
                  ? 'Memproses...'
                  : statusModalUser.targetStatus === 'ACTIVE'
                  ? 'Ya, Aktifkan Akun'
                  : 'Ya, Nonaktifkan Akun'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Account Dialog */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">Hapus Akun Pengguna</h3>
                <p className="text-xs text-rose-700/80 mt-0.5">
                  Tindakan ini bersifat <strong>permanen</strong> dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama:</span>
                <span className="font-bold text-slate-900">{deleteModalUser.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono font-bold text-slate-900">{deleteModalUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipe Akun:</span>
                <span className="font-semibold text-slate-700">
                  {deleteModalUser.role === 'UMKM' ? 'Pelaku UMKM' : 'Mentor Bisnis'}
                </span>
              </div>
              {deleteModalUser.businessName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Usaha:</span>
                  <span className="font-semibold text-slate-900">{deleteModalUser.businessName}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-amber-700" />
                <span>Dampak Penghapusan:</span>
              </div>
              <p>
                Seluruh data profil, riwayat transaksi, produk, penugasan, dan sesi pendampingan yang terhubung dengan akun ini akan dibersihkan dari basis data.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-[11px] font-semibold text-slate-700">
                Ketik <strong>HAPUS</strong> untuk mengonfirmasi:
              </label>
              <input
                type="text"
                placeholder="HAPUS"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold focus:border-rose-600 focus:outline-none uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalUser(null);
                  setDeleteConfirmText('');
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={saving || deleteConfirmText.trim().toUpperCase() !== 'HAPUS'}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 cursor-pointer active:scale-95 transition-all shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{saving ? 'Menghapus...' : 'Hapus Akun Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
