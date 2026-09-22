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
} from 'lucide-react';

export const AdminMentors: React.FC = () => {
  const { fetchWithAuth } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'UMKM' | 'MENTOR'>('ALL');

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

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Manajemen Akun Pengguna (UMKM & Mentor)
          </h1>
          <p className="text-xs text-slate-500">
            Tambahkan akun UMKM dan Mentor baru langsung dengan email dan password, kelola hak akses, serta reset password
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
            <span>Segarkan</span>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
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
          <div className="py-14 text-center text-xs text-slate-400">Memuat data pengguna...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400">
            {search ? 'Tidak ada pengguna yang cocok dengan kriteria pencarian.' : 'Belum ada akun terdaftar.'}
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
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isUmkm = u.role === 'UMKM';
                  const isMentor = u.role === 'MENTOR';
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${
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
                            <div className="font-bold text-slate-900">{u.fullName}</div>
                            <div className="text-[11px] text-slate-400">ID #{u.id}</div>
                          </div>
                        </div>
                      </td>

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
                          <div className="text-slate-500">Pengelola Sistem</div>
                        )}
                      </td>

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

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            u.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.accountStatus === 'INVITED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.accountStatus === 'ACTIVE' && <CheckCircle className="h-3 w-3" />}
                          {u.accountStatus === 'INVITED' && <Clock className="h-3 w-3" />}
                          <span>{u.accountStatus === 'ACTIVE' ? 'Aktif' : u.accountStatus === 'INVITED' ? 'Undangan' : 'Nonaktif'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(u);
                              setResetPasswordValue(generateRandomPassword());
                              setResetSuccessResult(null);
                              setErrorMsg(null);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Reset password untuk pengguna ini"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                            <span>Reset Password</span>
                          </button>
                        )}
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
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
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
                      >
                      </input>
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
              💡 <strong>Info:</strong> Berikan email & password ini kepada pemilik akun. Mereka dapat login dan mereset password sendiri melalui menu Profil atau opsi "Lupa Password".
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
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
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
    </div>
  );
};
