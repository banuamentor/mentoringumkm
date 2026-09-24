import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Sale, SalesChannel } from '../../types/index.ts';
import { formatCurrency, formatDate, formatPercent, formatNumber } from '../../utils/formatters.ts';
import {
  exportSingleTransactionPDF,
  exportTransactionsReportPDF,
} from '../../utils/pdfExport.ts';
import { StatCard } from '../../components/StatCard.tsx';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Receipt,
  X,
  AlertTriangle,
  Calendar,
  Zap,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  RotateCcw,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Percent,
  Layers,
} from 'lucide-react';

interface UmkmSalesListProps {
  onAddNew: () => void;
}

export const UmkmSalesList: React.FC<UmkmSalesListProps> = ({ onAddNew }) => {
  const { fetchWithAuth, umkm, user } = useAuth();

  const [sales, setSales] = useState<Sale[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Period Preset & Date Filters
  const [periodPreset, setPeriodPreset] = useState<string>('thisMonth');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modals & UI States
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Report Modal Custom Settings
  const [modalPreset, setModalPreset] = useState<string>('thisMonth');
  const [modalStartDate, setModalStartDate] = useState<string>('');
  const [modalEndDate, setModalEndDate] = useState<string>('');
  const [modalChannelFilter, setModalChannelFilter] = useState<string>('');
  const [modalSigningCity, setModalSigningCity] = useState<string>(
    umkm?.cityRegency || 'Banjarmasin'
  );
  const [modalSignerName, setModalSignerName] = useState<string>(
    umkm?.ownerName || user?.fullName || 'Pemilik Usaha'
  );
  const [modalSignerTitle, setModalSignerTitle] = useState<string>(
    'Pemilik Usaha / Penanggung Jawab'
  );

  // Helper date ranges for presets
  const getDateRangeForPreset = (preset: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      return { start: todayStr, end: todayStr };
    }
    if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 6);
      return { start: past.toISOString().split('T')[0], end: todayStr };
    }
    if (preset === '30days') {
      const past = new Date();
      past.setDate(now.getDate() - 29);
      return { start: past.toISOString().split('T')[0], end: todayStr };
    }
    if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: firstDay.toISOString().split('T')[0], end: todayStr };
    }
    if (preset === 'lastMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: firstDay.toISOString().split('T')[0], end: lastDay.toISOString().split('T')[0] };
    }
    if (preset === 'thisYear') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      return { start: firstDay.toISOString().split('T')[0], end: todayStr };
    }
    return { start: '', end: '' };
  };

  // Initialize initial dates for "thisMonth"
  useEffect(() => {
    const dates = getDateRangeForPreset('thisMonth');
    setStartDate(dates.start);
    setEndDate(dates.end);
    setModalStartDate(dates.start);
    setModalEndDate(dates.end);
  }, []);

  // Update signer name and city defaults when umkm or user profile updates
  useEffect(() => {
    if (umkm?.ownerName) {
      setModalSignerName(umkm.ownerName);
    } else if (user?.fullName) {
      setModalSignerName(user.fullName);
    }
    if (umkm?.cityRegency) {
      setModalSigningCity(umkm.cityRegency);
    }
  }, [umkm, user]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePeriodPresetChange = (preset: string) => {
    setPeriodPreset(preset);
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else {
      const { start, end } = getDateRangeForPreset(preset);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleModalPresetChange = (preset: string) => {
    setModalPreset(preset);
    if (preset === 'all') {
      setModalStartDate('');
      setModalEndDate('');
    } else {
      const { start, end } = getDateRangeForPreset(preset);
      setModalStartDate(start);
      setModalEndDate(end);
    }
  };

  // Load Sales from backend
  const loadSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (channelFilter) params.append('channelId', channelFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetchWithAuth(`/api/sales?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load sales list:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial channels fetch
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetchWithAuth('/api/sales-channels');
        if (res.ok) {
          const list = await res.json();
          setChannels(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchChannels();
  }, []);

  useEffect(() => {
    loadSales();
  }, [channelFilter, startDate, endDate]);

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/sales/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSales((prev) => prev.filter((s) => s.id !== id));
        setDeleteConfirmId(null);
        triggerToast(`Transaksi #TRX-${id} berhasil dihapus.`);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Gagal menghapus transaksi.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered sales based on local search input
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const invNumber = `INV-${String(s.id).padStart(5, '0')}`.toLowerCase();
      return (
        String(s.id).includes(q) ||
        invNumber.includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.channelName && s.channelName.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (s.items && s.items.some((it) => it.productNameSnapshot && it.productNameSnapshot.toLowerCase().includes(q)))
      );
    });
  }, [sales, search]);

  // Aggregate KPIs for the active period
  const kpis = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.totalRevenue || 0), 0);
    const totalHpp = filteredSales.reduce((acc, s) => acc + (s.totalHpp || 0), 0);
    const grossProfit = filteredSales.reduce((acc, s) => acc + (s.grossProfit || 0), 0);
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const totalTransactions = filteredSales.length;

    let totalUnits = 0;
    filteredSales.forEach((s) => {
      if (s.items && s.items.length > 0) {
        s.items.forEach((it) => {
          totalUnits += it.quantity || 0;
        });
      }
    });

    const atv = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalHpp,
      grossProfit,
      grossMargin,
      totalTransactions,
      totalUnits,
      atv,
    };
  }, [filteredSales]);

  // Reset all filters to default thisMonth
  const handleResetFilters = () => {
    setSearch('');
    setChannelFilter('');
    const dates = getDateRangeForPreset('thisMonth');
    setPeriodPreset('thisMonth');
    setStartDate(dates.start);
    setEndDate(dates.end);
  };

  // Helper to enrich a single sale object with UMKM metadata for official PDF printing
  const enrichSaleForPdf = (sale: Sale): Sale => {
    return {
      ...sale,
      businessName: sale.businessName || umkm?.businessName || 'Usaha UMKM',
      ownerName: sale.ownerName || umkm?.ownerName || user?.fullName || 'Pemilik Usaha',
      cityRegency: sale.cityRegency || umkm?.cityRegency || 'Kota Bandung',
      businessSector: sale.businessSector || umkm?.businessSector || 'Kuliner / F&B',
    };
  };

  // 1. Export Single Transaction PDF Receipt / Invoice (Di Setiap Transaksi)
  const handleExportSingleReceipt = (sale: Sale) => {
    try {
      const enriched = enrichSaleForPdf(sale);
      const filename = exportSingleTransactionPDF(
        enriched,
        'Pemilik Usaha / Penanggung Jawab Kasir'
      );
      triggerToast(`Nota transaksi #INV-${String(sale.id).padStart(5, '0')} berhasil diunduh: ${filename}`);
    } catch (err: any) {
      console.error('Error generating single receipt PDF:', err);
      alert('Gagal mencetak nota transaksi: ' + err.message);
    }
  };

  // 2. Quick PDF Export of currently displayed / filtered sales
  const handleQuickExportCurrent = () => {
    if (filteredSales.length === 0) {
      alert('Tidak ada data transaksi yang dapat dicetak dengan filter saat ini.');
      return;
    }

    setExportingPdf(true);
    try {
      let periodLabel = 'Semua Periode Transaksi';
      if (startDate && endDate) {
        periodLabel = `${formatDate(startDate)} s/d ${formatDate(endDate)}`;
      } else if (startDate) {
        periodLabel = `Mulai ${formatDate(startDate)}`;
      } else if (endDate) {
        periodLabel = `Sampai ${formatDate(endDate)}`;
      }

      const activeChannel = channels.find((c) => String(c.id) === channelFilter);
      const channelSuffix = activeChannel ? ` (Saluran: ${activeChannel.name})` : '';

      const filename = exportTransactionsReportPDF({
        scope: 'SINGLE',
        targetName: umkm?.businessName || 'Usaha UMKM',
        ownerName: umkm?.ownerName || user?.fullName || 'Pemilik Usaha',
        businessSector: umkm?.businessSector || undefined,
        cityRegency: umkm?.cityRegency || undefined,
        periodLabel: `${periodLabel}${channelSuffix}`,
        generatedBy: user?.fullName || umkm?.ownerName || 'Pemilik Usaha UMKM',
        signingCity: modalSigningCity || umkm?.cityRegency || 'Banjarmasin',
        signerName: modalSignerName || umkm?.ownerName || user?.fullName || 'Pemilik Usaha',
        signerTitle: modalSignerTitle || 'Pemilik Usaha / Pimpinan UMKM',
        sales: filteredSales,
      });

      triggerToast(`Laporan transaksi berhasil diunduh: ${filename}`);
    } catch (err: any) {
      console.error('Error exporting transactions PDF:', err);
      alert('Gagal menerbitkan laporan transaksi PDF: ' + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  // 3. Custom Report Generation from Modal
  const handleGenerateCustomReport = async () => {
    setExportingPdf(true);
    try {
      // Fetch precise sales for this modal configuration if different
      const params = new URLSearchParams();
      if (modalChannelFilter) params.append('channelId', modalChannelFilter);
      if (modalStartDate) params.append('startDate', modalStartDate);
      if (modalEndDate) params.append('endDate', modalEndDate);

      const res = await fetchWithAuth(`/api/sales?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Gagal mengambil data transaksi untuk laporan.');
      }
      const targetSales: Sale[] = await res.json();

      if (!targetSales || targetSales.length === 0) {
        alert('Tidak ada data transaksi yang sesuai dengan kriteria laporan yang dipilih.');
        setExportingPdf(false);
        return;
      }

      let periodLabel = 'Semua Periode Transaksi';
      if (modalStartDate && modalEndDate) {
        periodLabel = `${formatDate(modalStartDate)} s/d ${formatDate(modalEndDate)}`;
      } else if (modalStartDate) {
        periodLabel = `Mulai ${formatDate(modalStartDate)}`;
      } else if (modalEndDate) {
        periodLabel = `Sampai ${formatDate(modalEndDate)}`;
      }

      const activeChannel = channels.find((c) => String(c.id) === modalChannelFilter);
      const channelSuffix = activeChannel ? ` (Saluran: ${activeChannel.name})` : '';

      const filename = exportTransactionsReportPDF({
        scope: 'SINGLE',
        targetName: umkm?.businessName || 'Usaha UMKM',
        ownerName: umkm?.ownerName || modalSignerName,
        businessSector: umkm?.businessSector || undefined,
        cityRegency: umkm?.cityRegency || undefined,
        periodLabel: `${periodLabel}${channelSuffix}`,
        generatedBy: user?.fullName || modalSignerName,
        signingCity: modalSigningCity || umkm?.cityRegency || 'Banjarmasin',
        signerName: modalSignerName,
        signerTitle: modalSignerTitle,
        sales: targetSales,
      });

      setShowReportModal(false);
      triggerToast(`Laporan resmi transaksi berhasil diterbitkan: ${filename}`);
    } catch (err: any) {
      console.error('Error generating custom report:', err);
      alert('Gagal membuat laporan: ' + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-2xl transition-all">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <Receipt className="h-3.5 w-3.5" />
              Pembukuan & Laporan Transaksi UMKM
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Riwayat Transaksi Penjualan
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Catat penjualan, cetak bukti nota di setiap transaksi, dan terbitkan laporan keuangan berkala berformat PDF resmi dengan integritas snapshot HPP historis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick PDF Export of Current Filter */}
          <button
            onClick={handleQuickExportCurrent}
            disabled={exportingPdf || loading || filteredSales.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            title="Unduh laporan transaksi PDF berdasarkan filter yang saat ini aktif"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Unduh Laporan Periode Ini</span>
          </button>

          {/* Modal Generator for Custom Period Report */}
          <button
            onClick={() => {
              setModalPreset(periodPreset);
              setModalStartDate(startDate);
              setModalEndDate(endDate);
              setModalChannelFilter(channelFilter);
              setShowReportModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-800 shadow-sm hover:bg-teal-100 transition-colors cursor-pointer"
            title="Buka generator laporan PDF dengan pilihan periode dan tanda tangan resmi"
          >
            <Printer className="h-4 w-4 text-teal-700" />
            <span>Buat Laporan Periode Kustom</span>
          </button>

          {/* Add Sale Button */}
          <button
            onClick={onAddNew}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>Catat Penjualan Cepat</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid for the Active Period */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Omzet Penjualan"
          value={formatCurrency(kpis.totalRevenue)}
          icon={DollarSign}
          subtext={`${formatNumber(kpis.totalTransactions)} transaksi selesai dicatat`}
          variant="accent"
        />
        <StatCard
          label="Total HPP Terkunci"
          value={formatCurrency(kpis.totalHpp)}
          icon={ShoppingCart}
          subtext={`${formatNumber(kpis.totalUnits)} unit produk terjual`}
        />
        <StatCard
          label="Total Laba Kotor"
          value={formatCurrency(kpis.grossProfit)}
          icon={TrendingUp}
          subtext={`Gross Margin Rata-rata: ${formatPercent(kpis.grossMargin)}`}
          variant="success"
        />
        <StatCard
          label="Rata-rata Transaksi (ATV)"
          value={formatCurrency(kpis.atv)}
          icon={Percent}
          subtext="Rata-rata nilai belanja per pelanggan"
        />
      </div>

      {/* Filter and Period Selection Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        {/* Preset Period Buttons Bar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span>Pilihan Periode Transaksi</span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all', label: 'Semua Waktu' },
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari Terakhir' },
              { id: '30days', label: '30 Hari Terakhir' },
              { id: 'thisMonth', label: 'Bulan Ini' },
              { id: 'lastMonth', label: 'Bulan Lalu' },
              { id: 'thisYear', label: 'Tahun Ini' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodPresetChange(p.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  periodPreset === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}

            <button
              onClick={handleResetFilters}
              className="ml-2 flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset ke pengaturan default"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Detailed Input Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500">Pencarian Cepat</label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari no invoice, pembeli, catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500">Saluran Penjualan</label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs focus:border-slate-900 focus:outline-none"
            >
              <option value="">Semua Saluran Penjualan</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Daftar Transaksi ({filteredSales.length} tercatat)
            </span>
            {periodPreset !== 'all' && (
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                {startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Periode Terpilih'}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            Gunakan ikon printer untuk mencetak nota per transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">No. Invoice / Tanggal</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Saluran</th>
                <th className="py-3 px-4 font-semibold whitespace-nowrap">Pelanggan / Catatan</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Omzet</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Total HPP</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Laba Kotor</th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Margin %</th>
                <th className="py-3 px-4 font-semibold text-center whitespace-nowrap">Aksi / Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
                      <span>Memuat data transaksi penjualan...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="h-8 w-8 text-slate-300" />
                      <p className="font-medium text-slate-600">Tidak ada transaksi ditemukan</p>
                      <p className="text-[11px] text-slate-400">
                        Coba sesuaikan preset periode atau filter saluran penjualan di atas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const marginPct = sale.totalRevenue > 0 ? (sale.grossProfit / sale.totalRevenue) * 100 : 0;
                  const invNumber = `INV-${String(sale.id).padStart(5, '0')}`;
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{invNumber}</div>
                        <div className="text-[11px] text-slate-500">{formatDate(sale.transactionDate)}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {sale.channelName || 'Toko Fisik'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <div className="font-medium text-slate-900">
                          {sale.customerName || <span className="text-slate-400 italic">Pelanggan Umum</span>}
                        </div>
                        {sale.notes ? (
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]" title={sale.notes}>
                            {sale.notes}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            {sale.items && sale.items.length > 0 ? `${sale.items.length} jenis item` : '-'}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(sale.totalRevenue)}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
                        {formatCurrency(sale.totalHpp)}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-emerald-700 whitespace-nowrap">
                        {formatCurrency(sale.grossProfit)}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold text-[11px] ${
                            marginPct >= 40
                              ? 'bg-emerald-100 text-emerald-800'
                              : marginPct >= 20
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {formatPercent(marginPct)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Cetak Nota / Struk PDF di setiap transaksi */}
                          <button
                            onClick={() => handleExportSingleReceipt(sale)}
                            className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                            title="Cetak Bukti Nota / Struk Resmi Transaksi (PDF)"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak Nota</span>
                          </button>

                          {/* Lihat Detail Snapshot */}
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Lihat Detail Snapshot Terkunci"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Hapus Transaksi */}
                          <button
                            onClick={() => setDeleteConfirmId(sale.id)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Hapus Transaksi"
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
            {filteredSales.length > 0 && (
              <tfoot className="border-t-2 border-slate-200 bg-slate-50/90 text-slate-900 font-bold">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right">
                    Total Rekapitulasi ({filteredSales.length} Transaksi):
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700">
                    {formatCurrency(kpis.totalRevenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {formatCurrency(kpis.totalHpp)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-800">
                    {formatCurrency(kpis.grossProfit)}
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-800">
                    {formatPercent(kpis.grossMargin)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={handleQuickExportCurrent}
                      className="text-[11px] font-semibold text-teal-700 hover:underline cursor-pointer"
                    >
                      Unduh Laporan
                    </button>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Snapshot Detail Modal with Print Option */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">
                    Detail Transaksi #INV-{String(selectedSale.id).padStart(5, '0')}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {selectedSale.channelName || 'Toko Fisik'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Tanggal: {formatDate(selectedSale.transactionDate)} • Pembeli:{' '}
                  {selectedSale.customerName || 'Pelanggan Umum'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportSingleReceipt(selectedSale)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Nota PDF</span>
                </button>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {selectedSale.notes && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Catatan:</span> {selectedSale.notes}
              </div>
            )}

            {/* Items Snapshot Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Rincian Item (Snapshot Terkunci)
              </h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Nama Produk</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Qty</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Harga Jual</th>
                      <th className="py-2.5 px-3 font-semibold text-right">HPP Snapshot</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Subtotal</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Laba Kotor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSale.items && selectedSale.items.length > 0 ? (
                      selectedSale.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {item.productNameSnapshot}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right">{formatCurrency(item.sellingPrice)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-500">
                            {formatCurrency(item.hppSnapshot)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                            {formatCurrency(item.grossProfit)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          Tidak ada rincian item produk tersimpan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fees & Discounts breakdown */}
            {(selectedSale.discountAmount || selectedSale.shippingFee || selectedSale.taxAmount || selectedSale.otherFee) ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5 mb-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Produk:</span>
                  <span className="font-semibold">{formatCurrency(selectedSale.subtotal || selectedSale.totalRevenue)}</span>
                </div>
                {selectedSale.discountAmount ? (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon / Potongan Harga (-):</span>
                    <span className="font-semibold">-{formatCurrency(selectedSale.discountAmount)}</span>
                  </div>
                ) : null}
                {selectedSale.shippingFee ? (
                  <div className="flex justify-between text-slate-600">
                    <span>Ongkos Kirim (+):</span>
                    <span className="font-semibold">+{formatCurrency(selectedSale.shippingFee)}</span>
                  </div>
                ) : null}
                {selectedSale.taxAmount ? (
                  <div className="flex justify-between text-slate-600">
                    <span>Pajak ({selectedSale.taxType === 'PERCENTAGE' ? `${selectedSale.taxValue}%` : 'Nominal'}):</span>
                    <span className="font-semibold">+{formatCurrency(selectedSale.taxAmount)}</span>
                  </div>
                ) : null}
                {selectedSale.otherFee ? (
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Lain-lain (+):</span>
                    <span className="font-semibold">+{formatCurrency(selectedSale.otherFee)}</span>
                  </div>
                ) : null}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-slate-900">
                  <span>Total Tagihan Akhir:</span>
                  <span className="text-emerald-700">{formatCurrency(selectedSale.totalRevenue)}</span>
                </div>
              </div>
            ) : null}

            {/* Total Recap */}
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-900 p-4 text-white">
              <div>
                <div className="text-[10px] uppercase text-slate-400">Total Omzet</div>
                <div className="text-base font-bold text-white">
                  {formatCurrency(selectedSale.totalRevenue)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400">Total HPP</div>
                <div className="text-base font-bold text-slate-300">
                  {formatCurrency(selectedSale.totalHpp)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-emerald-400">Total Laba Kotor</div>
                <div className="text-base font-bold text-emerald-400">
                  {formatCurrency(selectedSale.grossProfit)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleExportSingleReceipt(selectedSale)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Nota PDF</span>
              </button>

              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Generator Laporan Transaksi Periode Tertentu (PDF) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Laporan Transaksi Periode UMKM
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cetak rekapitulasi penjualan, analisis saluran, dan pengesahan resmi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Entitas UMKM Identitas */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Entitas Usaha
                </div>
                <div className="mt-1 font-bold text-slate-900 text-sm">
                  {umkm?.businessName || 'Usaha UMKM'}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Pemilik: {umkm?.ownerName || 'Pemilik Usaha'} • {umkm?.cityRegency || 'Kota Bandung'}
                </div>
              </div>

              {/* Pilihan Preset Periode */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pilihan Periode Transaksi
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'Semua Waktu' },
                    { id: 'today', label: 'Hari Ini' },
                    { id: '7days', label: '7 Hari' },
                    { id: '30days', label: '30 Hari' },
                    { id: 'thisMonth', label: 'Bulan Ini' },
                    { id: 'lastMonth', label: 'Bulan Lalu' },
                    { id: 'thisYear', label: 'Tahun Ini' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleModalPresetChange(p.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        modalPreset === p.id
                          ? 'bg-teal-600 text-white shadow-2xs font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Tanggal Kustom */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mulai Tanggal
                  </label>
                  <input
                    type="date"
                    value={modalStartDate}
                    onChange={(e) => {
                      setModalStartDate(e.target.value);
                      setModalPreset('custom');
                    }}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={modalEndDate}
                    onChange={(e) => {
                      setModalEndDate(e.target.value);
                      setModalPreset('custom');
                    }}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Filter Channel */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Saluran Penjualan
                </label>
                <select
                  value={modalChannelFilter}
                  onChange={(e) => setModalChannelFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs focus:border-teal-600 focus:outline-none"
                >
                  <option value="">Semua Saluran Penjualan</option>
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Pengesahan Laporan */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pengesahan & Lembar Tanda Tangan
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tempat Pengesahan (Kota/Kab)
                    </label>
                    <input
                      type="text"
                      value={modalSigningCity}
                      onChange={(e) => setModalSigningCity(e.target.value)}
                      placeholder="Contoh: Banjarmasin"
                      className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Penandatangan
                    </label>
                    <input
                      type="text"
                      value={modalSignerName}
                      onChange={(e) => setModalSignerName(e.target.value)}
                      placeholder="Nama Pemilik / Manajer"
                      className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jabatan / Posisi Resmi
                    </label>
                    <input
                      type="text"
                      value={modalSignerTitle}
                      onChange={(e) => setModalSignerTitle(e.target.value)}
                      placeholder="Pemilik Usaha / Direktur"
                      className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pratinjau info */}
              <div className="rounded-xl bg-teal-50/60 border border-teal-100 p-3 text-[11px] text-teal-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-teal-600" />
                  Format Dokumen Standar:
                </div>
                <p className="text-teal-700/90 leading-relaxed">
                  Laporan mencakup kop resmi usaha, tabel ringkasan KPI (omzet, total HPP, laba kotor, gross margin, ATV), distribusi per saluran, tabel rincian transaksi dengan snapshot HPP produk, serta blok tanda tangan pengesahan.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                disabled={exportingPdf}
                onClick={() => setShowReportModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={exportingPdf}
                onClick={handleGenerateCustomReport}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>{exportingPdf ? 'Menerbitkan PDF...' : 'Cetak & Unduh Laporan PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hapus Transaksi?</h3>
                <p className="text-xs text-slate-500">
                  Data transaksi #TRX-{deleteConfirmId} akan dihapus secara aman (soft delete).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={deleting}
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={deleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
