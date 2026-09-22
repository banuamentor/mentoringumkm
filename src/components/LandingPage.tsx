import React, { useState } from 'react';
import {
  TrendingUp,
  Shield,
  Users,
  Target,
  ArrowRight,
  CheckCircle,
  Mail,
  Lock,
  Building,
  UserCheck,
  Award,
  BarChart3,
  FileSpreadsheet,
  CalendarCheck,
  ChevronRight,
  Sparkles,
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">UMKM Mentoring</span>
              <span className="text-[10px] text-indigo-400 block -mt-1 font-medium tracking-wide">Business & Growth Hub</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#alur-kerja" className="hover:text-white transition-colors">Alur Kerja Sistem</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openAuth('login')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all"
            >
              Masuk
            </button>
            <button
              onClick={() => openAuth('register')}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-sm shadow-indigo-600/30 transition-all"
            >
              Daftar UMKM
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-900/60 to-slate-950 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 animate-in fade-in">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Sistem Manajemen Bisnis & Inkubasi Terpadu</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight">
            Pantau Kinerja Riil,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">
              Akselerasi Pertumbuhan UMKM
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Platform komprehensif untuk pencatatan transaksi penjualan multi-item, kalkulasi HPP otomatis, analisis margin laba harian, dan pendampingan mentor bisnis terstruktur.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>Daftar Akun UMKM Baru</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => openAuth('login')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <span>Masuk ke Akun Anda</span>
            </button>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-10 pt-6 border-t border-slate-800/80 max-w-xl mx-auto">
            <p className="text-xs font-medium text-slate-400 mb-2.5">
              Atau coba langsung via simulasi peran instan:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => switchDemoRole('UMKM')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Building className="h-3.5 w-3.5 text-emerald-400" />
                <span>Demo UMKM</span>
              </button>
              <button
                onClick={() => switchDemoRole('MENTOR')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Award className="h-3.5 w-3.5 text-sky-400" />
                <span>Demo Mentor</span>
              </button>
              <button
                onClick={() => switchDemoRole('ADMIN')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>Demo Admin</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Workflow Step-by-Step */}
      <section id="alur-kerja" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Alur Kerja Sistem</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Bagaimana Platform Beroperasi</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-900/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-700/50">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Pendaftaran Mandiri Pelaku UMKM</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  UMKM mendaftar dengan mengisi nama, nama usaha, email, dan password. Sistem langsung menyiapkan profil usaha awal dan katalog produk perdana.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-900/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-700/50">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Administrator Mengundang Mentor Resmi</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admin menginput data mentor (nama, email, instansi, keahlian). Sistem menghasilkan tautan undangan aktivasi unik yang dapat dikirim langsung ke mentor.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-900/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-700/50">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Aktivasi Akun & Pembuatan Password Mentor</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mentor membuka tautan undangan, menetapkan password akun minimal 8 karakter, dan akun langsung aktif untuk digunakan login kapan saja.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-900/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-700/50">
                4
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Pencatatan Penjualan, Sesi Mentoring, dan Evaluasi Rencana Aksi</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  UMKM mencatat transaksi harian, mentor meninjau margin laba kotor faktual tanpa rekayasa, dan bersama merumuskan action plan mingguan yang terukur.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 UMKM Business & Mentoring Management System. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Admin Default: banuamentor@gmail.com</span>
            <span>&bull;</span>
            <button
              onClick={() => openAuth('forgot')}
              className="text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              Lupa Password?
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal Dialog */}
      <AuthModal
        isOpen={modalOpen}
        initialMode={modalMode}
        initialToken={activeToken}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
