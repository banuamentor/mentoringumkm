import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  BarChart3,
  CalendarCheck,
  Sparkles,
  Zap,
  FileSpreadsheet,
} from 'lucide-react';
import { AuthModal, AuthMode } from './AuthModal.tsx';

interface LandingPageProps {
  initialInviteToken?: string | null;
  initialResetToken?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  initialInviteToken = null,
  initialResetToken = null,
}) => {
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
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="fitur" className="py-16 bg-slate-900/50 border-t border-slate-800/80">
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
