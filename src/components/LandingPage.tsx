import React, { useState } from 'react';
import {
  ArrowRight,
  Store,
  Receipt,
  BarChart3,
  CalendarCheck,
  FileSpreadsheet,
  Sparkles,
  Phone,
  Mail,
  MessageCircle,
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

  const whatsappNumber = '+6285320741100';
  const whatsappClean = '6285320741100';
  const emailAddress = 'banuamentor@gmail.com';

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-[#FDFCF7]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white font-bold shadow-md shadow-emerald-700/20">
              <Store className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-950 tracking-tight">Banua Mentor</span>
          </div>

          {/* Header Actions & Contact */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <a
              href={`https://wa.me/${whatsappClean}?text=Halo%20Admin%20Banua%20Mentor%2C%20saya%20ingin%20bertanya%20tentang%20program%20inkubasi%20UMKM`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>WA: {whatsappNumber}</span>
            </a>

            <button
              type="button"
              onClick={() => openAuth('login')}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 hover:bg-emerald-50/80 border border-slate-300 transition-all cursor-pointer"
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 shadow-sm shadow-emerald-700/25 transition-all cursor-pointer"
            >
              Daftar UMKM
            </button>
          </div>
        </div>
      </header>

      {/* Main Incubation Narrative Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-14 sm:py-20 lg:py-24 border-b border-emerald-950/5 bg-gradient-to-b from-amber-50/70 via-emerald-50/30 to-[#FDFCF7]">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-gradient-to-r from-emerald-200/30 via-amber-200/25 to-teal-200/30 blur-3xl -z-10 rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300/80 text-emerald-800 text-xs sm:text-sm font-bold shadow-2xs mx-auto">
              <Sparkles className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Program Inkubasi & Pendampingan Bisnis UMKM</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.2]">
              Dampingi Usaha Mikro, Kecil & Menengah{' '}
              <span className="text-emerald-700 underline decoration-amber-400 decoration-wavy decoration-2 underline-offset-4">
                Tumbuh Naik Kelas
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Platform terintegrasi untuk mendukung proses inkubasi bisnis UMKM: mulai dari pencatatan penjualan kasir harian, standarisasi kalkulasi HPP dan laba kotor, hingga pemantauan rencana aksi (*action plan*) serta evaluasi berkala bersama mentor pendamping.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-98 shadow-md shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Daftar Akun UMKM Baru</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => openAuth('login')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-800 hover:text-slate-950 bg-white hover:bg-emerald-50/50 border border-slate-300 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Masuk ke Dashboard</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4 Core Incubation Pillars */}
        <section className="py-14 sm:py-16 bg-[#FDFCF7]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Pillar 1: POS & Sales */}
              <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-2xs">
                <div className="h-11 w-11 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mb-4">
                  <Receipt className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-extrabold text-slate-950">Pencatatan Penjualan & Kasir</h2>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Pencatatan transaksi penjualan secara cepat, rapi, dan terstruktur untuk memantau omzet harian usaha binaan.
                </p>
              </div>

              {/* Pillar 2: HPP & Profit */}
              <div className="rounded-2xl bg-white border border-amber-100 p-6 shadow-2xs">
                <div className="h-11 w-11 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center mb-4">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-extrabold text-slate-950">Kalkulasi HPP & Laba Bersih</h2>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Perhitungan Harga Pokok Penjualan dan margin laba kotor yang akurat agar penetapan harga jual produk tepat dan menguntungkan.
                </p>
              </div>

              {/* Pillar 3: Action Plans & Mentoring */}
              <div className="rounded-2xl bg-white border border-teal-100 p-6 shadow-2xs">
                <div className="h-11 w-11 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center mb-4">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-extrabold text-slate-950">Pendampingan & Action Plan</h2>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Penyusunan target rencana aksi mingguan dan pencatatan sesi konsultasi terarah bersama mentor bisnis.
                </p>
              </div>

              {/* Pillar 4: Reports & Analytics */}
              <div className="rounded-2xl bg-white border border-sky-100 p-6 shadow-2xs">
                <div className="h-11 w-11 rounded-xl bg-sky-100/80 text-sky-800 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-extrabold text-slate-950">Laporan Evaluasi & PDF</h2>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Rekapitulasi perkembangan performa bisnis siap ekspor ke format PDF untuk evaluasi program inkubasi.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Contact Details */}
      <footer className="mt-auto border-t border-emerald-950/10 bg-[#FAF9F5] py-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Brand Section */}
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="h-9 w-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs shrink-0">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 tracking-tight">Banua Mentor</div>
                <div className="text-[11px] text-slate-500">Platform Inkubasi & Pendampingan Bisnis UMKM</div>
              </div>
            </div>

            {/* Official Contact Info */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <a
                href={`https://wa.me/${whatsappClean}?text=Halo%20Admin%20Banua%20Mentor%2C%20saya%20ingin%20bertanya%20tentang%20program%20inkubasi%20UMKM`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200/80 border border-emerald-300/80 transition-all shadow-2xs"
                title="Hubungi WhatsApp Banua Mentor"
              >
                <MessageCircle className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>WA: <span className="font-bold">{whatsappNumber}</span></span>
              </a>

              <a
                href={`mailto:${emailAddress}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 transition-all shadow-2xs"
                title="Kirim Email ke Banua Mentor"
              >
                <Mail className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Email: <span className="font-bold">{emailAddress}</span></span>
              </a>
            </div>

            {/* Auth Quick Links */}
            <div className="flex items-center gap-4 text-slate-500 font-semibold text-xs">
              <button
                type="button"
                onClick={() => openAuth('forgot')}
                className="text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
              >
                Lupa Password?
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="text-slate-700 hover:text-slate-950 hover:underline cursor-pointer"
              >
                Masuk Akun
              </button>
            </div>
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
