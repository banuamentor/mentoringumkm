import React, { useState } from 'react';
import {
  TrendingUp,
  Shield,
  Users,
  Target,
  ArrowRight,
  CheckCircle,
  Building2,
  Award,
  BarChart3,
  Receipt,
  CalendarCheck,
  ChevronRight,
  Sparkles,
  Zap,
  Check,
  Lock,
  Store,
  UserCheck,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { AuthModal, AuthMode } from './AuthModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface LandingPageProps {
  initialInviteToken?: string | null;
  initialResetToken?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  initialInviteToken = null,
  initialResetToken = null,
}) => {
  const { switchDemoRole } = useAuth();
  const [modalOpen, setModalOpen] = useState(
    Boolean(initialInviteToken || initialResetToken)
  );
  const [modalMode, setModalMode] = useState<AuthMode>(
    initialInviteToken ? 'invite' : initialResetToken ? 'reset' : 'login'
  );
  const [activeToken, setActiveToken] = useState<string | null>(
    initialInviteToken || initialResetToken
  );

  const openAuth = (mode: AuthMode, token?: string | null) => {
    setModalMode(mode);
    setActiveToken(token || null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold shadow-md shadow-emerald-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">Banua Mentor</span>
              <span className="hidden sm:inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                Inkubasi UMKM
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#fitur" className="hover:text-emerald-400 transition-colors">Fitur Unggulan</a>
            <a href="#alur-kerja" className="hover:text-emerald-400 transition-colors">Alur Sistem</a>
            <a href="#peran" className="hover:text-emerald-400 transition-colors">Akses Peran</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/90 border border-slate-700/80 transition-all cursor-pointer"
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Daftar UMKM
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/30 via-slate-900/60 to-slate-950 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6 animate-in fade-in">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Sistem Manajemen Pendampingan & Kinerja Bisnis UMKM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight">
            Pantau Kinerja Transaksi Riil,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-300">
              Akselerasi Pertumbuhan UMKM
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Platform komprehensif untuk pencatatan transaksi penjualan cepat, kalkulasi HPP otomatis, analisis margin laba faktual, dan kolaborasi pendampingan mentor bisnis terstruktur.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Daftar Akun UMKM Baru</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => openAuth('login')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Masuk ke Akun Anda</span>
            </button>
          </div>

          {/* Demo Sandbox Quick Switcher */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 max-w-xl mx-auto">
            <p className="text-xs font-medium text-slate-400 mb-3">
              Atau eksplorasi langsung fitur sistem melalui mode demo simulasi:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => switchDemoRole('UMKM')}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer hover:border-emerald-500/50 hover:text-emerald-300"
              >
                <Store className="h-4 w-4 text-emerald-400" />
                <span>Demo Pelaku UMKM</span>
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('MENTOR')}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer hover:border-sky-500/50 hover:text-sky-300"
              >
                <UserCheck className="h-4 w-4 text-sky-400" />
                <span>Demo Mentor Bisnis</span>
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('ADMIN')}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer hover:border-purple-500/50 hover:text-purple-300"
              >
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span>Demo Administrator</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="fitur" className="py-16 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Fitur Utama</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Solusi Terpadu Ekosistem Usaha & Mentoring
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Dirancang khusus untuk memfasilitasi kebutuhan pencatatan UMKM harian dan supervisi mentor profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-emerald-500/50 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Pencatatan Penjualan Cepat</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Antarmuka kasir responsif untuk mencatat penjualan multi-item, diskon produk, ongkir, serta cetak struk nota digital.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-sky-500/50 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Kalkulasi HPP & Margin Riil</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Menghitung Harga Pokok Penjualan (HPP) otomatis dan margin keuntungan kotor faktual tanpa rekayasa data.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-indigo-500/50 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Sesi & Target Aksi Mentor</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Pendampingan terstruktur dengan log notulensi sesi tatap muka dan action plan mingguan yang dapat dievaluasi langsung.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 hover:border-purple-500/50 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Pelaporan Eksekutif PDF</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Ekspor rekapitulasi penjualan, laporan laba rugi berkala, dan ringkasan aktivitas pembinaan dalam format PDF resmi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Step-by-Step */}
      <section id="alur-kerja" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Alur Kerja Sistem</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Bagaimana Banua Mentor Bekerja</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-900/40 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-700/50">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Pendaftaran Mandiri / Penambahan oleh Admin</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pelaku UMKM mendaftar mandiri atau didaftarkan langsung oleh Administrator. Profil usaha dan katalog produk siap digunakan saat pertama kali login.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-sky-900/40 text-sky-300 font-bold flex items-center justify-center shrink-0 border border-sky-700/50">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Penugasan Mentor & Program Pendampingan</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admin menugaskan Mentor Bisnis sesuai bidang keahlian (Manajemen Keuangan, HPP, Pemasaran) untuk mendampingi UMKM tertentu.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-900/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-700/50">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Pencatatan Penjualan Harian & Analisis Kinerja</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  UMKM mencatat transaksi harian, grafik performa omzet dan laba bersih langsung terakumulasi secara real-time pada dashboard.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-purple-900/40 text-purple-300 font-bold flex items-center justify-center shrink-0 border border-purple-700/50">
                4
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Evaluasi Target Aksi & Ekspor Laporan PDF</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mentor dan UMKM meninjau progress target aksi mingguan, serta mencetak laporan berkala untuk pembinaan berkelanjutan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Overview */}
      <section id="peran" className="py-16 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Hak Akses Sistem</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Peran Pengguna Terintegrasi</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-slate-900 border border-emerald-500/20 p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Store className="h-5 w-5" />
                <span>Pelaku UMKM</span>
              </div>
              <p className="text-xs text-slate-300">
                Akses pencatatan kasir penjualan, katalog produk & HPP, grafik analisis omzet harian/bulanan, sesi mentoring, dan ubah profil/password mandiri.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-sky-500/20 p-6 space-y-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <UserCheck className="h-5 w-5" />
                <span>Mentor Bisnis</span>
              </div>
              <p className="text-xs text-slate-300">
                Akses rekap data UMKM binaan, histori penjualan faktual, pembuatan notulensi sesi bimbingan, evaluasi action plan, dan profil keahlian.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-purple-500/20 p-6 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <ShieldCheck className="h-5 w-5" />
                <span>Administrator</span>
              </div>
              <p className="text-xs text-slate-300">
                Dashboard eksekutif seluruh UMKM, pendaftaran akun langsung, penugasan mentor, manajemen program pembinaan, reset password, dan audit log sistem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-slate-300">Banua Mentor</span>
            <span>&copy; 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => openAuth('forgot')}
              className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
            >
              Lupa Password?
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="text-slate-300 hover:text-white hover:underline cursor-pointer"
            >
              Login Sistem
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal Dialog (Login, Register, Reset, Invite) */}
      <AuthModal
        isOpen={modalOpen}
        initialMode={modalMode}
        initialToken={activeToken}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
