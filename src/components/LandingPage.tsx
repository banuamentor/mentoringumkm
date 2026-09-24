import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  BarChart3,
  CalendarCheck,
  Sparkles,
  Zap,
  FileSpreadsheet,
  CheckCircle2,
  Store,
  TrendingUp,
  Calculator,
  Users,
  ShieldCheck,
  Receipt,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Coffee,
  Shirt,
  Sparkle,
  PhoneCall,
  Check,
} from 'lucide-react';
import { AuthModal, AuthMode } from './AuthModal.tsx';
import { formatCurrency, formatNumber } from '../utils/formatters.ts';

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

  // Interactive Mini HPP Calculator State
  const [calcHpp, setCalcHpp] = useState<number>(18000);
  const [calcPackaging, setCalcPackaging] = useState<number>(2500);
  const [calcTargetMargin, setCalcTargetMargin] = useState<number>(40);
  const [calcQtyEstimate, setCalcQtyEstimate] = useState<number>(150);

  // FAQ open state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const openAuth = (mode: AuthMode, token?: string | null) => {
    setModalMode(mode);
    setActiveToken(token || null);
    setModalOpen(true);
  };

  // HPP Calculation Logic
  const totalCostPerUnit = (calcHpp || 0) + (calcPackaging || 0);
  // Selling price with desired gross margin: Price = Cost / (1 - Margin/100)
  const marginDecimal = Math.min(Math.max(calcTargetMargin, 5), 85) / 100;
  const recommendedSellingPrice = totalCostPerUnit > 0 ? Math.round(totalCostPerUnit / (1 - marginDecimal) / 500) * 500 : 0;
  const grossProfitPerUnit = Math.max(0, recommendedSellingPrice - totalCostPerUnit);
  const actualMarginPercent = recommendedSellingPrice > 0 ? ((grossProfitPerUnit / recommendedSellingPrice) * 100).toFixed(1) : '0';
  const estimatedMonthlyGrossProfit = grossProfitPerUnit * (calcQtyEstimate || 0);

  const faqs = [
    {
      q: 'Apakah pendaftaran akun UMKM di Banua Mentor dipungut biaya?',
      a: 'Pendaftaran akun UMKM sepenuhnya gratis. Anda dapat langsung menggunakan fitur kasir pencatatan penjualan, kalkulasi HPP, dan manajemen inventaris produk secara mandiri.',
    },
    {
      q: 'Bagaimana cara mendapatkan pendampingan dari Mentor Bisnis?',
      a: 'Setelah terdaftar, Anda dapat bergabung dalam program inkubasi atau pelatihan yang diselenggarakan oleh dinas/lembaga mitra, atau dihubungkan langsung dengan mentor terverifikasi yang sesuai dengan bidang usaha Anda.',
    },
    {
      q: 'Apakah data omzet dan resep HPP usaha saya aman?',
      a: 'Sangat aman. Seluruh data transaksi, resep biaya, dan laporan kinerja keuangan disimpan secara privat dengan proteksi enkripsi standar perbankan dan hanya dapat diakses oleh Anda serta mentor/admin yang Anda beri izin.',
    },
    {
      q: 'Apakah laporan transaksi bisa dicetak atau diekspor ke PDF?',
      a: 'Ya, Anda dapat mengekspor rekapitulasi penjualan, laporan laba rugi, dan lembar evaluasi berkala ke format dokumen PDF resmi siap cetak untuk keperluan pembukuan, kurasi, atau pengajuan modal usaha.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-[#FDFCF7]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white font-bold shadow-md shadow-emerald-700/20">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-950 tracking-tight">Banua Mentor</span>
              <span className="hidden sm:inline-block rounded-md bg-emerald-100/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                Inkubasi UMKM
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-emerald-700 transition-colors">
              Fitur Unggulan
            </a>
            <a href="#kalkulator" className="hover:text-emerald-700 transition-colors">
              Kalkulator HPP
            </a>
            <a href="#sektor" className="hover:text-emerald-700 transition-colors">
              Sektor UMKM
            </a>
            <a href="#testimoni" className="hover:text-emerald-700 transition-colors">
              Kisah Sukses
            </a>
            <a href="#faq" className="hover:text-emerald-700 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-emerald-50/80 border border-slate-300 transition-all cursor-pointer"
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 shadow-sm shadow-emerald-700/25 transition-all cursor-pointer"
            >
              Daftar UMKM Gratis
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-emerald-950/5 bg-gradient-to-b from-amber-50/60 via-emerald-50/30 to-[#FDFCF7]">
        {/* Subtle decorative background circles */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-r from-emerald-200/30 via-amber-200/25 to-teal-200/30 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Copy & CTAs */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-5">
              {/* Kicker Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 border border-emerald-300/80 text-emerald-800 text-xs font-bold shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                <span>Sahabat Usaha Mikro, Kecil & Menengah Indonesia</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.18]">
                Catat Penjualan Nyata,{' '}
                <span className="text-emerald-700 underline decoration-amber-400 decoration-wavy decoration-2 underline-offset-4">
                  Kendalikan HPP
                </span>
                , & Dampingi Bisnis Naik Kelas
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Aplikasi pembukuan kasir harian dan platform pendampingan inkubasi UMKM terlengkap. Hitung margin laba kotor otomatis, pantau perputaran omzet faktual, dan capai target rencana aksi bersama mentor ahli.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-98 shadow-md shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Mulai Catat Penjualan Gratis</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-800 hover:text-slate-950 bg-white hover:bg-emerald-50/50 border border-slate-300 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Masuk ke Akun Anda</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-emerald-950/10 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Kasir Cepat & Cetak Nota</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Kalkulasi HPP & Margin Bersih</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Ekspor Laporan PDF Resmi</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Fidelity UMKM Live POS & Margin Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md rounded-2xl bg-white border border-emerald-200/90 p-5 shadow-xl shadow-emerald-950/5 space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shadow-2xs">
                      ☕
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Kopi Banua Nusantara</div>
                      <div className="text-[11px] text-slate-500">UMKM Kuliner & Minuman • Bandung</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Kasir Aktif
                  </span>
                </div>

                {/* Sample Transaction Snapshot */}
                <div className="rounded-xl bg-slate-50 p-3.5 space-y-2 border border-slate-200/80 text-xs">
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Invoice #INV-00428</span>
                    <span>Hari ini, 14:30 WIB</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>2x Kopi Susu Gula Aren 250ml</span>
                      <span className="font-mono">Rp 36.000</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>1x Keripik Pisang Karamel</span>
                      <span className="font-mono">Rp 15.000</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center font-bold text-slate-900">
                    <span>Total Pembayaran (Tunai/QRIS)</span>
                    <span className="text-emerald-700 font-mono text-sm">Rp 51.000</span>
                  </div>
                </div>

                {/* Real Profit Calculation Pill */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-emerald-50/70 p-2.5 border border-emerald-100">
                    <div className="text-[10px] font-semibold text-emerald-800">Harga Pokok (HPP)</div>
                    <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">Rp 24.500</div>
                  </div>
                  <div className="rounded-xl bg-amber-50/80 p-2.5 border border-amber-100">
                    <div className="text-[10px] font-semibold text-amber-800">Margin Laba Kotor</div>
                    <div className="text-xs font-bold font-mono text-emerald-700 mt-0.5">
                      +Rp 26.500 <span className="text-[10px] font-normal text-slate-500">(52.0%)</span>
                    </div>
                  </div>
                </div>

                {/* Mentor Note Snippet */}
                <div className="rounded-xl bg-indigo-50/70 p-3 border border-indigo-100 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px]">
                    <Sparkle className="h-3 w-3 text-indigo-600" />
                    <span>Evaluasi Mentor Bisnis:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">
                    &ldquo;Margin produk kopi sudah sangat sehat (&gt;50%). Rekomendasi: tingkatkan bundling snack keripik untuk dongkrak basket size per pelanggan.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mini HPP & Profit Calculator Section */}
      <section id="kalkulator" className="py-16 bg-white border-b border-emerald-950/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Simulasi Interaktif UMKM</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
              Kalkulator HPP & Simulasi Margin Keuntungan
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Coba simulasi penentuan harga jual ideal produk Anda langsung di sini agar tidak lagi salah menetapkan harga atau merugi.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl bg-[#FAF9F5] border border-amber-200/80 p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Inputs */}
              <div className="md:col-span-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    1. Biaya Bahan Baku / Modal Pokok per Produk (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={calcHpp}
                    onChange={(e) => setCalcHpp(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    placeholder="Contoh: 18000"
                  />
                  <span className="text-[10px] text-slate-500">Biaya bahan mentah, bumbu, atau komponen dasar</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    2. Biaya Kemasan & Operasional Tambahan (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={calcPackaging}
                    onChange={(e) => setCalcPackaging(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    placeholder="Contoh: 2500"
                  />
                  <span className="text-[10px] text-slate-500">Plastik pouch, stiker label, gas/listrik, ongkos kirim</span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      3. Target Margin Laba Kotor: <span className="text-emerald-700">{calcTargetMargin}%</span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-500">Standar UMKM: 30% - 50%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={70}
                    step={5}
                    value={calcTargetMargin}
                    onChange={(e) => setCalcTargetMargin(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    4. Estimasi Terjual per Bulan (Pcs / Porsi)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={calcQtyEstimate}
                    onChange={(e) => setCalcQtyEstimate(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="md:col-span-6 rounded-2xl bg-white border border-emerald-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Calculator className="h-5 w-5 text-emerald-700" />
                  <div className="text-xs font-extrabold text-slate-900">Rekomendasi Harga & Proyeksi Laba</div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Total HPP + Kemasan per Unit:</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(totalCostPerUnit)}</span>
                  </div>

                  <div className="rounded-xl bg-emerald-50/80 p-3 border border-emerald-200 space-y-1">
                    <div className="text-[11px] font-semibold text-emerald-800">Rekomendasi Harga Jual:</div>
                    <div className="text-xl font-extrabold font-mono text-emerald-900">
                      {formatCurrency(recommendedSellingPrice)}
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      Margin faktual: <strong>{actualMarginPercent}%</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-slate-700">
                    <span>Laba Kotor per Pcs:</span>
                    <span className="font-mono font-bold text-emerald-700">+{formatCurrency(grossProfitPerUnit)}</span>
                  </div>

                  <div className="rounded-xl bg-amber-50/80 p-3 border border-amber-200 space-y-1">
                    <div className="text-[10px] font-semibold text-amber-800">Potensi Laba Kotor Bulanan ({calcQtyEstimate} pcs):</div>
                    <div className="text-base font-extrabold font-mono text-amber-950">
                      +{formatCurrency(estimatedMonthlyGrossProfit)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Gunakan Fitur Lengkap di Aplikasi</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars of UMKM Growth */}
      <section id="fitur" className="py-16 bg-[#FDFCF7] border-b border-emerald-950/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Solusi Terpadu</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
              4 Fitur Utama Penggerak UMKM Naik Kelas
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Dirancang dengan antarmuka yang sangat mudah dipahami oleh pemilik usaha, kasir toko, dan tim pembina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl bg-white border border-emerald-100 p-6 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all group">
              <div className="h-11 w-11 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Kasir Cepat & Nota Digital</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Catat penjualan offline maupun online dalam hitungan detik, hitung diskon produk otomatis, dan cetak struk digital langsung ke printer kasir.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl bg-white border border-amber-100 p-6 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all group">
              <div className="h-11 w-11 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Otomasi HPP & Margin Bersih</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Menghitung Harga Pokok Penjualan (HPP) setiap resep atau produk secara akurat sehingga Anda tahu persis keuntungan riil per transaksi.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl bg-white border border-teal-100 p-6 shadow-2xs hover:border-teal-400 hover:shadow-md transition-all group">
              <div className="h-11 w-11 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Rencana Aksi Bersama Mentor</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Pendampingan bisnis terstruktur. Notulensi sesi konsultasi, target mingguan, dan evaluasi capaian terdata rapi dan transparan.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl bg-white border border-sky-100 p-6 shadow-2xs hover:border-sky-400 hover:shadow-md transition-all group">
              <div className="h-11 w-11 rounded-xl bg-sky-100/80 text-sky-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-950">Laporan Keuangan & PDF Siap Ekspor</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Unduh rekapitulasi penjualan berkala, laporan laba rugi, dan dokumen progress kurasi dalam format PDF resmi standar inkubasi & perbankan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sektor Usaha UMKM Unggulan */}
      <section id="sektor" className="py-16 bg-white border-b border-emerald-950/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Dukungan Lintas Sektor</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
              Didesain Khusus untuk Berbagai Sektor UMKM
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Fleksibel digunakan untuk ribuan model usaha mikro, kecil, dan menengah di seluruh Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Sector 1 */}
            <div className="rounded-2xl bg-amber-50/50 border border-amber-200/80 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm">
                  🍲
                </div>
                <div className="font-bold text-xs text-slate-900">Kuliner & F&B Nusantara</div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cocok untuk kafe, resto, warung, katering, dan cemilan kemasan. Pencatatan resep bahan baku dan kasir cepat saat jam sibuk.
              </p>
              <div className="text-[10px] font-bold text-amber-900 bg-amber-100/70 px-2 py-1 rounded-md inline-block">
                Contoh: Keripik, Kopi, Sambal Kemasan
              </div>
            </div>

            {/* Sector 2 */}
            <div className="rounded-2xl bg-emerald-50/50 border border-emerald-200/80 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm">
                  🧵
                </div>
                <div className="font-bold text-xs text-slate-900">Fashion & Konveksi</div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Manajemen stok pakaian, hijab, batik, dan aksesoris. Hitung ongkos jahit per meter dan tentukan harga jual grosir/eceran.
              </p>
              <div className="text-[10px] font-bold text-emerald-900 bg-emerald-100/70 px-2 py-1 rounded-md inline-block">
                Contoh: Batik Tulis, Kaos Distro, Busana Muslim
              </div>
            </div>

            {/* Sector 3 */}
            <div className="rounded-2xl bg-teal-50/50 border border-teal-200/80 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center text-sm">
                  🪵
                </div>
                <div className="font-bold text-xs text-slate-900">Kriya & Kerajinan Tangan</div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Pencatatan produk anyaman bambu, ukiran kayu, keramik, dan suvenir pernikahan dengan biaya produksi berbasis bahan dan durasi pengerjaan.
              </p>
              <div className="text-[10px] font-bold text-teal-900 bg-teal-100/70 px-2 py-1 rounded-md inline-block">
                Contoh: Anyaman Rotan, Sabun Organik, Tas Etnik
              </div>
            </div>

            {/* Sector 4 */}
            <div className="rounded-2xl bg-sky-50/50 border border-sky-200/80 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center text-sm">
                  🌿
                </div>
                <div className="font-bold text-xs text-slate-900">Pertanian & Olahan Herbal</div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Madu murni, jamu tradisional, minyak atsiri, dan komoditas tani. Lacak hasil panen dan biaya kemasan botol higienis.
              </p>
              <div className="text-[10px] font-bold text-sky-900 bg-sky-100/70 px-2 py-1 rounded-md inline-block">
                Contoh: Madu Hutan, Kopi Biji Sangrai, Minuman Herbal
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kisah Sukses & Testimoni UMKM */}
      <section id="testimoni" className="py-16 bg-[#FAF9F5] border-b border-emerald-950/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Cerita Pembinaan</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
              Kata Pelaku Usaha & Mentor Binaan
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Pengalaman nyata pelaku UMKM yang telah bertumbuh dan menata manajemen keuangannya secara profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="rounded-2xl bg-white border border-emerald-200/80 p-6 shadow-2xs space-y-3">
              <div className="text-amber-500 text-sm">★★★★★</div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &ldquo;Dulu sering bingung menetapkan harga jual keripik pisang. Kadang merasa laris tapi uang kasnya tidak ada. Setelah input bahan di Banua Mentor, HPP terlihat jelas dan margin kami naik 28%!&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  SR
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Siti Rahmawati</div>
                  <div className="text-[10px] text-slate-500">Owner Keripik Berkah • Bandung</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="rounded-2xl bg-white border border-amber-200/80 p-6 shadow-2xs space-y-3">
              <div className="text-amber-500 text-sm">★★★★★</div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &ldquo;Sebagai mentor, aplikasi ini sangat menghemat waktu. Saya bisa langsung melihat riwayat transaksi anak asuh sebelum sesi mentoring, sehingga evaluasi action plan menjadi sangat tajam.&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                  BS
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Dr. Budi Santoso, S.E.</div>
                  <div className="text-[10px] text-slate-500">Senior Business Mentor • Inkubator UMKM</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="rounded-2xl bg-white border border-sky-200/80 p-6 shadow-2xs space-y-3">
              <div className="text-amber-500 text-sm">★★★★★</div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &ldquo;Fitur ekspor PDF-nya sangat rapi. Kami lampirkan saat kurasi pameran produk daerah dan langsung lolos karena rekapitulasi data penjualan tercatat transparan.&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                  HW
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Hendra Wijaya</div>
                  <div className="text-[10px] text-slate-500">Batik Lestari Nusantara • Solo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-white border-b border-emerald-950/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Bantuan & Informasi</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-[#FAF9F5] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-emerald-800 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-emerald-700 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-14 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Siap Membawa Usaha Anda Naik Kelas?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Bergabunglah sekarang bersama ribuan pelaku UMKM Indonesia. Mulai catat transaksi, ketahui profit riil, dan bertumbuh secara terarah.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 shadow-md transition-all cursor-pointer"
            >
              Daftar Usaha Anda Sekarang (Gratis)
            </button>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-500/40 transition-all cursor-pointer"
            >
              Masuk ke Akun
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-emerald-950/10 bg-[#FAF9F5] py-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-xs">
              <Store className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-slate-900">Banua Mentor</span>
            <span>&bull;</span>
            <span>Platform Inkubasi & Pembukuan UMKM</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-semibold">
            <button
              type="button"
              onClick={() => openAuth('forgot')}
              className="text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
            >
              Lupa Password?
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="text-slate-700 hover:text-slate-950 hover:underline cursor-pointer"
            >
              Login Pengguna
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
