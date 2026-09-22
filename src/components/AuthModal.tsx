import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Building2,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'invite';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  initialToken?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  initialToken = null,
  onClose,
  onSuccess,
}) => {
  const {
    loginWithPassword,
    registerUmkm,
    forgotPassword,
    resetPassword,
    verifyInvite,
    acceptInvite,
    switchDemoRole,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [token, setToken] = useState<string | null>(initialToken);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Status and feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null);

  // Invite verify state
  const [inviteData, setInviteData] = useState<{
    email: string;
    fullName: string;
    institution?: string;
  } | null>(null);

  // Synchronize initial mode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setToken(initialToken);
      setErrorMessage(null);
      setSuccessMessage(null);
      setGeneratedResetLink(null);

      if (initialMode === 'invite' && initialToken) {
        handleCheckInvite(initialToken);
      }
    }
  }, [isOpen, initialMode, initialToken]);

  const handleCheckInvite = async (invToken: string) => {
    setLoading(true);
    setErrorMessage(null);
    const res = await verifyInvite(invToken);
    setLoading(false);
    if (res.valid && res.email && res.fullName) {
      setInviteData({
        email: res.email,
        fullName: res.fullName,
        institution: res.institution,
      });
      setEmail(res.email);
    } else {
      setErrorMessage(res.error || 'Tautan undangan mentor tidak valid atau telah kedaluwarsa.');
    }
  };

  if (!isOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await loginWithPassword(email, password);
    setLoading(false);

    if (res.success) {
      onSuccess?.();
      onClose();
    } else {
      if (res.isInvited && res.inviteToken) {
        setToken(res.inviteToken);
        setMode('invite');
        handleCheckInvite(res.inviteToken);
      } else {
        setErrorMessage(res.error || 'Login gagal');
      }
    }
  };

  // Handle UMKM Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok dengan password');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password minimal terdiri dari 8 karakter');
      return;
    }

    setLoading(true);
    const res = await registerUmkm({
      fullName,
      businessName,
      email,
      whatsapp,
      password,
    });
    setLoading(false);

    if (res.success) {
      onSuccess?.();
      onClose();
    } else {
      setErrorMessage(res.error || 'Pendaftaran gagal');
    }
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setGeneratedResetLink(null);
    setLoading(true);

    const res = await forgotPassword(email);
    setLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Instruksi pembaruan password telah disiapkan.');
      if (res.resetUrl && res.resetToken) {
        setGeneratedResetLink(res.resetUrl);
        setToken(res.resetToken);
      }
    } else {
      setErrorMessage(res.error || 'Permintaan gagal');
    }
  };

  // Handle Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Token reset tidak ditemukan');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password baru minimal terdiri dari 8 karakter');
      return;
    }

    setLoading(true);
    const res = await resetPassword(token, password);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('Password berhasil diperbarui! Silakan masuk dengan password baru.');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setSuccessMessage(null);
      }, 1500);
    } else {
      setErrorMessage(res.error || 'Reset password gagal');
    }
  };

  // Handle Mentor Invite Acceptance
  const handleAcceptInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Token undangan tidak valid');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password minimal terdiri dari 8 karakter');
      return;
    }

    setLoading(true);
    const res = await acceptInvite(token, password);
    setLoading(false);

    if (res.success) {
      onSuccess?.();
      onClose();
    } else {
      setErrorMessage(res.error || 'Aktivasi mentor gagal');
    }
  };

  // Quick helper for fill credentials
  const fillCredentials = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 pt-6 pb-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300 ring-1 ring-white/20">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              {mode === 'register' && 'Khusus Pelaku UMKM'}
              {mode === 'invite' && 'Aktivasi Mentor'}
              {mode === 'forgot' && 'Pemulihan Password'}
              {mode === 'reset' && 'Password Baru'}
              {mode === 'login' && 'Autentikasi Terpadu'}
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === 'login' && 'Masuk ke Portal'}
            {mode === 'register' && 'Daftar Akun UMKM Baru'}
            {mode === 'forgot' && 'Lupa Password Akun'}
            {mode === 'reset' && 'Perbarui Password Anda'}
            {mode === 'invite' && 'Tentukan Password Mentor'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {mode === 'login' && 'Masukkan kombinasi email dan password Anda untuk melanjutkan.'}
            {mode === 'register' && 'Pendaftaran mandiri untuk mulai mencatat transaksi & HPP bisnis.'}
            {mode === 'forgot' && 'Masukkan email terdaftar untuk menerima tautan pembaruan password.'}
            {mode === 'reset' && 'Tentukan password baru minimal 8 karakter untuk mengamankan akun.'}
            {mode === 'invite' && 'Selamat datang! Buat password untuk mengaktifkan akun mentor Anda.'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 flex flex-col gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 animate-in fade-in">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMessage}</span>
              </div>
              {generatedResetLink && (
                <div className="mt-2 pt-2 border-t border-emerald-200 flex flex-col gap-1.5">
                  <span className="font-semibold text-emerald-900">Tautan Simulasi Email:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setSuccessMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-indigo-700 font-semibold hover:underline text-left"
                  >
                    <span>Klik di sini untuk langsung memperbarui password akun &rarr;</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= MODE: LOGIN ================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Terdaftar</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-lg bg-slate-900 py-2.5 px-4 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              {/* Quick Fill Credentials Helper */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-medium text-slate-500 mb-2 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Akun Uji Coba Cepat (Klik untuk Mengisi):
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => fillCredentials('banuamentor@gmail.com', '12345678')}
                    className="rounded-md border border-slate-200 bg-slate-50 p-1.5 text-left hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    <span className="block font-bold text-slate-900">Admin</span>
                    <span className="block text-[10px] text-slate-500 truncate">banuamentor@...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('mentor.budi@umkm.id', '12345678')}
                    className="rounded-md border border-slate-200 bg-slate-50 p-1.5 text-left hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    <span className="block font-bold text-slate-900">Mentor</span>
                    <span className="block text-[10px] text-slate-500 truncate">mentor.budi@...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('kopi.nusantara@umkm.id', '12345678')}
                    className="rounded-md border border-slate-200 bg-slate-50 p-1.5 text-left hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    <span className="block font-bold text-slate-900">UMKM</span>
                    <span className="block text-[10px] text-slate-500 truncate">kopi.nusantara@...</span>
                  </button>
                </div>
              </div>

              {/* Switch to Register link */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Pelaku UMKM baru?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Daftar Akun UMKM di sini
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================= MODE: REGISTER (KHUSUS UMKM) ================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Informative notice about UMKM-only self-registration */}
              <div className="rounded-lg bg-indigo-50/80 border border-indigo-100 p-2.5 text-[11px] text-indigo-900 leading-relaxed">
                <span className="font-semibold text-indigo-950">Catatan Peran: </span>
                Pendaftaran mandiri diperuntukkan bagi <strong>Pelaku UMKM</strong>. Akun Mentor didaftarkan melalui undangan khusus dari Administrator.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Pemilik</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Siti Rahmawati"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Usaha / Merek Bisnis</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Contoh: Sambal Roa Oma Bandung"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="umkm@email.com"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password (Minimal 8 Karakter)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 rounded-lg bg-indigo-700 py-2.5 px-4 text-sm font-semibold text-white hover:bg-indigo-800 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {loading ? 'Mendaftarkan...' : 'Daftar Sebagai UMKM'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Sudah memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================= MODE: FORGOT PASSWORD ================= */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                Masukkan alamat email akun Anda (berlaku untuk Pelaku UMKM, Mentor, maupun Admin). Tautan pembaruan password akan disiapkan untuk email tersebut.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Terdaftar</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-slate-900 py-2.5 px-4 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {loading ? 'Memproses...' : 'Kirim Tautan Pembaruan Password'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  &larr; Kembali ke Halaman Masuk
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE: RESET PASSWORD (DARI TOKEN/LINK) ================= */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                Silakan tentukan password baru yang aman untuk akun Anda.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password Baru (Min 8 Karakter)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ulangi Password Baru</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-700 py-2.5 px-4 text-sm font-semibold text-white hover:bg-emerald-800 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Batal & Masuk dengan Akun Lain
                </button>
              </div>
            </form>
          )}

          {/* ================= MODE: MENTOR INVITE ACTIVATION ================= */}
          {mode === 'invite' && (
            <form onSubmit={handleAcceptInviteSubmit} className="space-y-4">
              {inviteData ? (
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-950">
                  <p className="font-bold text-sm text-indigo-900 mb-0.5">{inviteData.fullName}</p>
                  <p className="text-indigo-700">{inviteData.email}</p>
                  {inviteData.institution && (
                    <p className="text-[11px] text-indigo-600 mt-1">Lembaga: {inviteData.institution}</p>
                  )}
                  <p className="text-[11px] text-slate-600 mt-2">
                    Akun Anda telah diundang secara resmi sebagai Mentor Bisnis. Silakan buat password pertama Anda untuk mengakses portal pendampingan.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                  Memverifikasi data undangan mentor...
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Buat Password Mentor (Min 8 Karakter)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !inviteData}
                className="w-full rounded-lg bg-indigo-700 py-2.5 px-4 text-sm font-semibold text-white hover:bg-indigo-800 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {loading ? 'Mengaktifkan...' : 'Aktifkan Akun Mentor & Masuk'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Sudah pernah aktivasi? Masuk di sini
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
