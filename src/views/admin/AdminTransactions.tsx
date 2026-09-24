import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Sale, SalesChannel, Program } from '../../types/index.ts';
import { formatCurrency, formatDate, formatPercent, formatNumber } from '../../utils/formatters.ts';
import { exportTransactionsReportPDF, exportSingleTransactionPDF } from '../../utils/pdfExport.ts';
import { StatCard } from '../../components/StatCard.tsx';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Eye,
  Store,
  DollarSign,
  TrendingUp,
  Package,
  RotateCcw,
  X,
  FileText,
  Printer,
  ChevronDown,
  CheckCircle2,
  Building2,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export const AdminTransactions: React.FC = () => {
  const { fetchWithAuth, user } = useAuth();

  // Data state
  const [sales, setSales] = useState<Sale[]>([]);
  const [umkms, setUmkms] = useState<any[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter state (Program first, then UMKM)
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [selectedUmkmId, setSelectedUmkmId] = useState<string>('all');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');
  const [periodPreset, setPeriodPreset] = useState<string>('thisMonth');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination State (Options: 10, 50, 100)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // PDF Modal Form State
  const [pdfScope, setPdfScope] = useState<'ALL' | 'SINGLE'>('ALL');
  const [pdfProgramId, setPdfProgramId] = useState<string>('all');
  const [pdfUmkmId, setPdfUmkmId] = useState<string>('');
  const [pdfPeriodPreset, setPdfPeriodPreset] = useState<string>('thisMonth');
  const [pdfStartDate, setPdfStartDate] = useState<string>('');
  const [pdfEndDate, setPdfEndDate] = useState<string>('');
  const [pdfSigningCity, setPdfSigningCity] = useState<string>('Banjarmasin');
  const [pdfSignerName, setPdfSignerName] = useState<string>('Administrator Banua Mentor');
  const [pdfSignerTitle, setPdfSignerTitle] = useState<string>('Koordinator Monitoring & Evaluasi UMKM');

  // Helper to compute date presets
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

  // Set initial dates for "thisMonth"
  useEffect(() => {
    const dates = getDateRangeForPreset('thisMonth');
    setStartDate(dates.start);
    setEndDate(dates.end);

    setPdfStartDate(dates.start);
    setPdfEndDate(dates.end);
  }, []);

  // Fetch initial master data: UMKMs, Channels, Programs
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [umkmRes, chanRes, progRes] = await Promise.all([
          fetchWithAuth('/api/admin/umkm'),
          fetchWithAuth('/api/sales-channels'),
          fetchWithAuth('/api/programs'),
        ]);

        if (umkmRes.ok) {
          const uList = await umkmRes.json();
          setUmkms(Array.isArray(uList) ? uList : []);
        }
        if (chanRes.ok) {
          const cList = await chanRes.json();
          setChannels(Array.isArray(cList) ? cList : []);
        }
        if (progRes.ok) {
          const pList = await progRes.json();
          setPrograms(Array.isArray(pList) ? pList : []);
        }
      } catch (err) {
        console.error('Error loading master data:', err);
      }
    };

    loadMasterData();
  }, []);

  // Filter available UMKMs based on selectedProgramId
  const availableUmkms = useMemo(() => {
    if (selectedProgramId === 'all') {
      return umkms;
    }
    const pid = Number(selectedProgramId);
    return umkms.filter((u) => {
      if (Array.isArray(u.programIds) && u.programIds.includes(pid)) return true;
      if (u.programId === pid) return true;
      return false;
    });
  }, [umkms, selectedProgramId]);

  // Selected Program object
  const selectedProgramObj = useMemo(() => {
    if (selectedProgramId === 'all') return null;
    return programs.find((p) => String(p.id) === selectedProgramId) || null;
  }, [programs, selectedProgramId]);

  // Available UMKMs for PDF Modal
  const pdfAvailableUmkms = useMemo(() => {
    if (pdfProgramId === 'all') {
      return umkms;
    }
    const pid = Number(pdfProgramId);
    return umkms.filter((u) => {
      if (Array.isArray(u.programIds) && u.programIds.includes(pid)) return true;
      if (u.programId === pid) return true;
      return false;
    });
  }, [umkms, pdfProgramId]);

  // Handle Program Filter change with smart auto-sync of selected UMKM
  const handleProgramChange = (newProgId: string) => {
    setSelectedProgramId(newProgId);
    if (newProgId !== 'all') {
      const pid = Number(newProgId);
      // Check if current selectedUmkmId is in this program's UMKMs
      if (selectedUmkmId !== 'all') {
        const isStillValid = umkms.some((u) => {
          if (String(u.id) !== selectedUmkmId) return false;
          if (Array.isArray(u.programIds) && u.programIds.includes(pid)) return true;
          if (u.programId === pid) return true;
          return false;
        });
        if (!isStillValid) {
          // Reset to 'all' so it shows all UMKMs in this newly chosen program
          setSelectedUmkmId('all');
        }
      }
    }
  };

  // Load Sales Data whenever filters change
  const loadSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProgramId !== 'all') {
        params.append('programId', selectedProgramId);
      }
      if (selectedUmkmId !== 'all') {
        params.append('umkmId', selectedUmkmId);
      }
      if (selectedChannelId !== 'all') {
        params.append('channelId', selectedChannelId);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const res = await fetchWithAuth(`/api/sales?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to fetch sales, status:', res.status);
      }
    } catch (err) {
      console.error('Error loading sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [selectedProgramId, selectedUmkmId, selectedChannelId, startDate, endDate]);

  // Handle Preset Changes for main view
  const handlePresetChange = (preset: string) => {
    setPeriodPreset(preset);
    if (preset === 'allTime') {
      setStartDate('');
      setEndDate('');
    } else if (preset !== 'custom') {
      const dates = getDateRangeForPreset(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  };

  // Handle Preset Changes for PDF Modal
  const handlePdfPresetChange = (preset: string) => {
    setPdfPeriodPreset(preset);
    if (preset === 'allTime') {
      setPdfStartDate('');
      setPdfEndDate('');
    } else if (preset !== 'custom') {
      const dates = getDateRangeForPreset(preset);
      setPdfStartDate(dates.start);
      setPdfEndDate(dates.end);
    }
  };

  // Client-side search filtering (if typing without hitting search)
  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales;
    const q = search.trim().toLowerCase();
    return sales.filter((s) => {
      return (
        String(s.id).includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.businessName && s.businessName.toLowerCase().includes(q)) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (s.channelName && s.channelName.toLowerCase().includes(q)) ||
        (s.items && s.items.some((it) => it.productNameSnapshot && it.productNameSnapshot.toLowerCase().includes(q)))
      );
    });
  }, [sales, search]);

  // Real-time Financial Aggregates
  const stats = useMemo(() => {
    const totalRev = filteredSales.reduce((acc, s) => acc + (s.totalRevenue || 0), 0);
    const totalHpp = filteredSales.reduce((acc, s) => acc + (s.totalHpp || 0), 0);
    const totalProfit = filteredSales.reduce((acc, s) => acc + (s.grossProfit || 0), 0);
    const margin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
    const totalCount = filteredSales.length;

    let totalUnits = 0;
    filteredSales.forEach((s) => {
      if (s.items) {
        s.items.forEach((it) => {
          totalUnits += it.quantity || 0;
        });
      }
    });

    const atv = totalCount > 0 ? totalRev / totalCount : 0;
    const uniqueUmkms = new Set(filteredSales.map((s) => s.umkmId)).size;

    return {
      totalRev,
      totalHpp,
      totalProfit,
      margin,
      totalCount,
      totalUnits,
      atv,
      uniqueUmkms,
    };
  }, [filteredSales]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedProgramId('all');
    setSelectedUmkmId('all');
    setSelectedChannelId('all');
    setSearch('');
    const dates = getDateRangeForPreset('thisMonth');
    setPeriodPreset('thisMonth');
    setStartDate(dates.start);
    setEndDate(dates.end);
    setCurrentPage(1);
  };

  // Pagination Calculations
  const totalItems = filteredSales.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 on filter/search/pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProgramId, selectedUmkmId, selectedChannelId, startDate, endDate, search, pageSize]);

  // Ensure currentPage does not exceed totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedSales = useMemo(() => {
    return filteredSales.slice(startIndex, endIndex);
  }, [filteredSales, startIndex, endIndex]);

  // Helper to generate numbered pagination list
  const getVisiblePageNumbers = (current: number, total: number) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    if (current > 3) {
      pages.push('...');
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) {
      pages.push('...');
    }
    pages.push(total);
    return pages;
  };

  // Quick Export with current active filter
  const handleQuickExportCurrent = () => {
    if (filteredSales.length === 0) {
      alert('Tidak ada data transaksi yang dapat dicetak dengan filter saat ini.');
      return;
    }

    setExportingPdf(true);
    try {
      const isSingle = selectedUmkmId !== 'all';
      const umkmTarget = isSingle ? umkms.find((u) => String(u.id) === selectedUmkmId) : null;

      let targetTitle = 'Konsolidasi Seluruh UMKM (Semua Program)';
      if (isSingle) {
        targetTitle = umkmTarget?.businessName || `UMKM #${selectedUmkmId}`;
      } else if (selectedProgramId !== 'all') {
        targetTitle = `Konsolidasi UMKM — ${selectedProgramObj?.name || 'Program Pendampingan'}`;
      }

      const periodLabel =
        startDate && endDate
          ? `${formatDate(startDate)} s/d ${formatDate(endDate)}`
          : startDate
          ? `Mulai ${formatDate(startDate)}`
          : endDate
          ? `Sampai ${formatDate(endDate)}`
          : 'Semua Waktu';

      const filename = exportTransactionsReportPDF({
        scope: isSingle ? 'SINGLE' : 'ALL',
        targetName: targetTitle,
        ownerName: umkmTarget?.ownerName,
        businessSector: umkmTarget?.businessSector,
        cityRegency: umkmTarget?.cityRegency,
        periodLabel,
        generatedBy: user?.fullName || 'Administrator Sistem',
        signingCity: pdfSigningCity || umkmTarget?.cityRegency || 'Banjarmasin',
        signerName: pdfSignerName || 'Koordinator Pendampingan UMKM',
        signerTitle: pdfSignerTitle || 'Dinas Koperasi & UMKM / Banua Mentor',
        sales: filteredSales,
      });

      setToastMessage(`Laporan PDF "${filename}" berhasil diunduh!`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Gagal membuat laporan PDF: ' + (err as Error).message);
    } finally {
      setExportingPdf(false);
    }
  };

  // Modal PDF Generation
  const handleGeneratePdfFromModal = async () => {
    setExportingPdf(true);
    try {
      const params = new URLSearchParams();
      if (pdfProgramId !== 'all') {
        params.append('programId', pdfProgramId);
      }
      if (pdfScope === 'SINGLE' && pdfUmkmId) {
        params.append('umkmId', pdfUmkmId);
      }
      if (pdfStartDate) {
        params.append('startDate', pdfStartDate);
      }
      if (pdfEndDate) {
        params.append('endDate', pdfEndDate);
      }

      const res = await fetchWithAuth(`/api/sales?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Gagal memuat data transaksi dari server');
      }

      const targetSales: Sale[] = await res.json();
      if (!Array.isArray(targetSales) || targetSales.length === 0) {
        alert('Tidak ada transaksi yang tercatat pada periode dan sasaran yang dipilih.');
        setExportingPdf(false);
        return;
      }

      const isSingle = pdfScope === 'SINGLE' && Boolean(pdfUmkmId);
      const targetUmkm = isSingle ? umkms.find((u) => String(u.id) === pdfUmkmId) : null;
      const targetProg = pdfProgramId !== 'all' ? programs.find((p) => String(p.id) === pdfProgramId) : null;

      let targetTitle = 'Konsolidasi Seluruh UMKM (Semua Program)';
      if (isSingle) {
        targetTitle = targetUmkm?.businessName || `UMKM #${pdfUmkmId}`;
      } else if (pdfProgramId !== 'all') {
        targetTitle = `Konsolidasi UMKM — ${targetProg?.name || 'Program Pendampingan'}`;
      }

      const periodLabel =
        pdfStartDate && pdfEndDate
          ? `${formatDate(pdfStartDate)} s/d ${formatDate(pdfEndDate)}`
          : pdfStartDate
          ? `Mulai ${formatDate(pdfStartDate)}`
          : pdfEndDate
          ? `Sampai ${formatDate(pdfEndDate)}`
          : 'Semua Periode';

      const filename = exportTransactionsReportPDF({
        scope: isSingle ? 'SINGLE' : 'ALL',
        targetName: targetTitle,
        ownerName: targetUmkm?.ownerName,
        businessSector: targetUmkm?.businessSector,
        cityRegency: targetUmkm?.cityRegency,
        periodLabel,
        generatedBy: user?.fullName || 'Administrator Sistem',
        signingCity: pdfSigningCity || targetUmkm?.cityRegency || 'Banjarmasin',
        signerName: pdfSignerName || 'Koordinator Pendampingan UMKM',
        signerTitle: pdfSignerTitle || 'Dinas Koperasi & UMKM / Banua Mentor',
        sales: targetSales,
      });

      setShowPdfModal(false);
      setToastMessage(`Laporan PDF "${filename}" berhasil diunduh!`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error('Error generating PDF from modal:', err);
      alert('Gagal mengekspor PDF: ' + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  // Open single sale detail
  const handleOpenSaleDetail = async (sale: Sale) => {
    try {
      const res = await fetchWithAuth(`/api/sales/${sale.id}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedSale(full);
      } else {
        setSelectedSale(sale);
      }
    } catch (e) {
      setSelectedSale(sale);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Transaksi & Laporan Finansial UMKM
            </h1>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
              Admin Reporting
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring seluruh transaksi penjualan UMKM, analisis detail nota/invoice, dan cetak laporan PDF resmi per program, per UMKM, maupun konsolidasi seluruh UMKM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Download with Current Filter */}
          <button
            onClick={handleQuickExportCurrent}
            disabled={exportingPdf || filteredSales.length === 0}
            title="Download PDF langsung dengan filter yang sedang aktif di layar"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Unduh PDF Cepat</span>
          </button>

          {/* Full PDF Report Generator Modal */}
          <button
            onClick={() => {
              setPdfProgramId(selectedProgramId);
              if (selectedUmkmId !== 'all') {
                setPdfScope('SINGLE');
                setPdfUmkmId(selectedUmkmId);
              } else {
                setPdfScope('ALL');
                setPdfUmkmId('');
              }
              setShowPdfModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Buat Laporan PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="h-3.5 w-3.5 text-indigo-600" />
            <span>Filter Transaksi & Periode Pelaporan</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Filter</span>
          </button>
        </div>

        {/* Filter Grid: Program Pendampingan FIRST, then Sasaran UMKM */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Program Pendampingan (Placed first) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Program Pendampingan
            </label>
            <div className="relative">
              <select
                value={selectedProgramId}
                onChange={(e) => handleProgramChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer"
              >
                <option value="all">Semua Program Pendampingan</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.batch ? `(Batch ${p.batch})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-slate-400" />
            </div>
          </div>

          {/* 2. Sasaran UMKM (Placed second, dynamically filtered based on chosen Program) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Sasaran UMKM
              </label>
              {selectedProgramId !== 'all' && (
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {availableUmkms.length} UMKM Terdaftar
                </span>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedUmkmId}
                onChange={(e) => setSelectedUmkmId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer"
              >
                {selectedProgramId === 'all' ? (
                  <option value="all">Semua UMKM (Konsolidasi Keseluruhan)</option>
                ) : (
                  <option value="all">
                    Semua UMKM dalam Program Ini ({selectedProgramObj?.name || 'Program Terpilih'})
                  </option>
                )}
                {availableUmkms.length === 0 && selectedProgramId !== 'all' ? (
                  <option disabled value="">(Tidak ada UMKM terdaftar di program ini)</option>
                ) : (
                  availableUmkms.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.businessName} ({u.ownerName})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-slate-400" />
            </div>
          </div>

          {/* 3. Saluran Penjualan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Saluran Penjualan (Channel)
            </label>
            <div className="relative">
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer"
              >
                <option value="all">Semua Saluran Penjualan</option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-slate-400" />
            </div>
          </div>

          {/* 4. Pencarian Cepat */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Cari Transaksi / Nota
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari ID, UMKM, produk, pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadSales()}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 pl-8 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Periode Preset Buttons & Custom Date Range */}
        <div className="pt-3 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0">Periode:</span>
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari' },
              { id: '30days', label: '30 Hari' },
              { id: 'thisMonth', label: 'Bulan Ini' },
              { id: 'lastMonth', label: 'Bulan Lalu' },
              { id: 'thisYear', label: 'Tahun 2026' },
              { id: 'allTime', label: 'Semua Waktu' },
              { id: 'custom', label: 'Kustom' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                  periodPreset === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Picker Range - Fully responsive, cleanly contained */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 w-full xl:w-auto min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50/80 p-1.5 sm:p-0 sm:bg-transparent rounded-lg min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0 w-12 sm:w-auto">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full sm:w-36 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50/80 p-1.5 sm:p-0 sm:bg-transparent rounded-lg min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0 w-12 sm:w-auto">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full sm:w-36 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Omzet Penjualan"
          value={formatCurrency(stats.totalRev)}
          icon={DollarSign}
          subtext={`${formatNumber(stats.totalCount)} Transaksi • ${stats.uniqueUmkms} UMKM`}
          variant="accent"
        />

        <StatCard
          label="Total Laba Kotor (Gross)"
          value={formatCurrency(stats.totalProfit)}
          icon={TrendingUp}
          subtext={`Margin Rata-rata: ${formatPercent(stats.margin)}`}
          variant="success"
        />

        <StatCard
          label="Total HPP Terakumulasi"
          value={formatCurrency(stats.totalHpp)}
          icon={Package}
          subtext={`Total Unit Terjual: ${formatNumber(stats.totalUnits)} pcs`}
        />

        <StatCard
          label="Rata-rata Nilai Transaksi (ATV)"
          value={formatCurrency(stats.atv)}
          icon={Receipt}
          subtext={`Efisiensi: ${stats.margin >= 25 ? 'Tinggi (>=25%)' : 'Normal (<25%)'}`}
        />
      </div>

      {/* Transactions Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Daftar Transaksi UMKM
              </h2>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                {totalItems > 0 ? `Halaman ${currentPage} (${startIndex + 1}-${endIndex} dari ${formatNumber(totalItems)})` : '0 transaksi'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedProgramId !== 'all' && selectedUmkmId === 'all'
                ? `Menampilkan transaksi semua UMKM pada program "${selectedProgramObj?.name || 'Program Terpilih'}" (${availableUmkms.length} UMKM terdaftar)`
                : selectedUmkmId !== 'all'
                ? `Menampilkan transaksi untuk ${umkms.find((u) => String(u.id) === selectedUmkmId)?.businessName || 'UMKM Terpilih'}`
                : 'Menampilkan transaksi konsolidasi seluruh UMKM pada seluruh program'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Quick Page Size Pill Selector (1-10, 1-50, 1-100) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-500">Per Halaman:</span>
              <div className="flex items-center rounded-lg bg-slate-200/80 p-0.5 border border-slate-200">
                {[10, 50, 100].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setPageSize(sz)}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      pageSize === sz
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    1-{sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:block text-xs font-semibold text-slate-600 border-l border-slate-200 pl-3">
              Total Nilai: <span className="text-indigo-600 font-bold">{formatCurrency(stats.totalRev)}</span>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="mt-3 text-xs font-medium">Memuat data transaksi UMKM...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Receipt className="h-10 w-10 text-slate-300 stroke-1" />
              <p className="mt-3 text-sm font-bold text-slate-700">Tidak ada transaksi ditemukan</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Tidak ada transaksi yang cocok dengan kriteria filter atau periode yang dipilih. Silakan sesuaikan pilihan program, sasaran UMKM, atau rentang tanggal.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">No. Invoice & Tanggal</th>
                  <th className="py-3 px-4 whitespace-nowrap">Identitas UMKM</th>
                  <th className="py-3 px-4 whitespace-nowrap">Saluran & Pelanggan</th>
                  <th className="py-3 px-4 whitespace-nowrap">Rincian Produk (Snapshot)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Omzet (Gross)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">HPP</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Laba Kotor</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSales.map((sale) => {
                    const margin = sale.totalRevenue > 0 ? (sale.grossProfit / sale.totalRevenue) * 100 : 0;
                    const invNumber = `INV-${String(sale.id).padStart(5, '0')}`;
                    const itemsSummary =
                      sale.items && sale.items.length > 0
                        ? sale.items.map((it) => `${it.productNameSnapshot} (x${it.quantity})`).join(', ')
                        : '-';

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Invoice & Date */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{invNumber}</div>
                          <div className="text-[11px] text-slate-500">{formatDate(sale.transactionDate)}</div>
                        </td>

                        {/* UMKM Identity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{sale.businessName || `UMKM #${sale.umkmId}`}</div>
                          <div className="text-[11px] text-slate-500">
                            {sale.ownerName || '-'} {sale.cityRegency ? `• ${sale.cityRegency}` : ''}
                          </div>
                        </td>

                        {/* Channel & Customer */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {sale.channelName || 'Toko Fisik'}
                          </span>
                          <div className="mt-0.5 text-[11px] text-slate-600 truncate max-w-[140px]">
                            {sale.customerName || 'Pelanggan Umum'}
                          </div>
                        </td>

                        {/* Product Summary */}
                        <td className="py-3 px-4 max-w-[220px]">
                          <p className="text-xs text-slate-700 truncate" title={itemsSummary}>
                            {itemsSummary}
                          </p>
                          {sale.items && (
                            <span className="text-[10px] text-slate-400">
                              {sale.items.length} jenis item
                            </span>
                          )}
                        </td>

                        {/* Omzet */}
                        <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(sale.totalRevenue)}
                        </td>

                        {/* HPP */}
                        <td className="py-3 px-4 text-right text-slate-600 whitespace-nowrap">
                          {formatCurrency(sale.totalHpp)}
                        </td>

                        {/* Laba Kotor & Margin */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="font-bold text-emerald-600">
                            {formatCurrency(sale.grossProfit)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Margin: {formatPercent(margin)}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenSaleDetail(sale)}
                              title="Lihat Detail Lengkap Transaksi"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => exportSingleTransactionPDF(sale, sale.businessName || 'UMKM')}
                            title="Cetak Struk Nota Transaksi PDF"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && filteredSales.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-xs">
            {/* Range info and page size selector */}
            <div className="flex flex-wrap items-center gap-3 text-slate-600">
              <span>
                Menampilkan <strong className="font-bold text-slate-900">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</strong> dari <strong className="font-bold text-slate-900">{formatNumber(totalItems)}</strong> transaksi
              </span>
              <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
                <span className="text-[11px] text-slate-500">Pilihan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value={10}>1-10 (10 / halaman)</option>
                  <option value={50}>1-50 (50 / halaman)</option>
                  <option value={100}>1-100 (100 / halaman)</option>
                </select>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 mx-1">
                {getVisiblePageNumbers(currentPage, totalPages).map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(p);
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Halaman Berikutnya"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Detail Transaksi Penjualan Single */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Detail Transaksi Penjualan
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  INV-{String(selectedSale.id).padStart(5, '0')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-4">
              <div>
                <span className="text-slate-500">Unit Usaha:</span>
                <p className="font-bold text-slate-900">{selectedSale.businessName || `UMKM #${selectedSale.umkmId}`}</p>
              </div>
              <div>
                <span className="text-slate-500">Tanggal:</span>
                <p className="font-bold text-slate-900">{formatDate(selectedSale.transactionDate)}</p>
              </div>
              <div>
                <span className="text-slate-500">Saluran:</span>
                <p className="font-bold text-slate-900">{selectedSale.channelName || 'Toko Fisik'}</p>
              </div>
              <div>
                <span className="text-slate-500">Pelanggan:</span>
                <p className="font-bold text-slate-900">{selectedSale.customerName || 'Umum'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">Daftar Item Terjual & Snapshot Biaya</h4>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Produk</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Harga Jual</th>
                      <th className="py-2 px-3 text-right">HPP Snapshot</th>
                      <th className="py-2 px-3 text-right">Subtotal Omzet</th>
                      <th className="py-2 px-3 text-right">Laba Kotor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSale.items && selectedSale.items.length > 0 ? (
                      selectedSale.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {it.productNameSnapshot}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-700">
                            {it.quantity}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700">
                            {formatCurrency(it.sellingPrice)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {formatCurrency(it.hppSnapshot)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(it.subtotal)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-600">
                            {formatCurrency(it.grossProfit)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          Tidak ada rincian item.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Calculation Summary */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-xs bg-slate-50/50">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Penjualan Produk:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              {(selectedSale.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon Penjualan ({selectedSale.discountType}):</span>
                  <span>- {formatCurrency(selectedSale.discountAmount || 0)}</span>
                </div>
              )}
              {(selectedSale.shippingFee || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Kirim:</span>
                  <span>+ {formatCurrency(selectedSale.shippingFee || 0)}</span>
                </div>
              )}
              {(selectedSale.taxAmount || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Pajak ({selectedSale.taxType}):</span>
                  <span>+ {formatCurrency(selectedSale.taxAmount || 0)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                <span className="text-slate-900">Total Nilai Bersih (Total Omzet):</span>
                <span className="text-indigo-600">{formatCurrency(selectedSale.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Total HPP Produk:</span>
                <span>{formatCurrency(selectedSale.totalHpp)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg mt-1">
                <span>Total Laba Kotor Faktual (Gross Profit):</span>
                <span>{formatCurrency(selectedSale.grossProfit)} ({formatPercent(selectedSale.totalRevenue > 0 ? (selectedSale.grossProfit / selectedSale.totalRevenue) * 100 : 0)})</span>
              </div>
            </div>

            {selectedSale.notes && (
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                <span className="font-bold">Catatan Transaksi: </span>
                {selectedSale.notes}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => exportSingleTransactionPDF(selectedSale, selectedSale.businessName || 'UMKM')}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer shadow-sm transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Nota PDF</span>
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Dialog Buat Laporan PDF Resmi */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Konfigurasi Laporan Transaksi PDF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Format cetak standar resmi dengan kop dokumen, ringkasan finansial, tabel transaksi, dan legalitas pengesahan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Program Selection in PDF Modal */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                1. Program Pendampingan
              </label>
              <div className="relative">
                <select
                  value={pdfProgramId}
                  onChange={(e) => {
                    const newProgId = e.target.value;
                    setPdfProgramId(newProgId);
                    if (newProgId !== 'all') {
                      const pid = Number(newProgId);
                      const validUmkms = umkms.filter(
                        (u) =>
                          (Array.isArray(u.programIds) && u.programIds.includes(pid)) ||
                          u.programId === pid
                      );
                      if (pdfUmkmId && !validUmkms.some((u) => String(u.id) === pdfUmkmId)) {
                        setPdfUmkmId(validUmkms[0] ? String(validUmkms[0].id) : '');
                      }
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Program Pendampingan</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.batch ? `(Batch ${p.batch})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                2. Sasaran Dokumen Laporan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPdfScope('ALL')}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    pdfScope === 'ALL'
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 font-bold ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    <span>
                      {pdfProgramId === 'all'
                        ? 'Konsolidasi Seluruh UMKM'
                        : 'Konsolidasi Semua UMKM di Program'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-normal text-slate-500">
                    {pdfProgramId === 'all'
                      ? 'Akumulasi seluruh transaksi UMKM di semua program.'
                      : `Akumulasi data ${pdfAvailableUmkms.length} UMKM pada program terpilih.`}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPdfScope('SINGLE');
                    if (!pdfUmkmId && pdfAvailableUmkms.length > 0) {
                      setPdfUmkmId(String(pdfAvailableUmkms[0].id));
                    }
                  }}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    pdfScope === 'SINGLE'
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 font-bold ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Store className="h-4 w-4 text-indigo-600" />
                    <span>Satu UMKM Spesifik</span>
                  </div>
                  <p className="mt-1 text-[11px] font-normal text-slate-500">
                    Laporan kinerja eksklusif per satu unit usaha UMKM terpilih.
                  </p>
                </button>
              </div>

              {/* Specific UMKM Dropdown */}
              {pdfScope === 'SINGLE' && (
                <div className="mt-3 animate-in fade-in">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Pilih Unit Usaha UMKM {pdfProgramId !== 'all' ? '(Sesuai Program)' : ''}:
                  </label>
                  <select
                    value={pdfUmkmId}
                    onChange={(e) => setPdfUmkmId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {pdfAvailableUmkms.length === 0 ? (
                      <option disabled value="">(Tidak ada UMKM di program ini)</option>
                    ) : (
                      pdfAvailableUmkms.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.businessName} — {u.ownerName} ({u.cityRegency || 'Jawa Barat'})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* Period Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                3. Pilihan Periode Laporan
              </label>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'today', label: 'Hari Ini' },
                  { id: '7days', label: '7 Hari Terakhir' },
                  { id: '30days', label: '30 Hari Terakhir' },
                  { id: 'thisMonth', label: 'Bulan Ini' },
                  { id: 'lastMonth', label: 'Bulan Lalu' },
                  { id: 'thisYear', label: 'Tahun Berjalan (2026)' },
                  { id: 'allTime', label: 'Semua Waktu' },
                  { id: 'custom', label: 'Rentang Kustom' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePdfPresetChange(p.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      pdfPeriodPreset === p.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Start & End Date Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tanggal Mulai:
                  </label>
                  <input
                    type="date"
                    value={pdfStartDate}
                    onChange={(e) => {
                      setPdfStartDate(e.target.value);
                      setPdfPeriodPreset('custom');
                    }}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tanggal Selesai:
                  </label>
                  <input
                    type="date"
                    value={pdfEndDate}
                    onChange={(e) => {
                      setPdfEndDate(e.target.value);
                      setPdfPeriodPreset('custom');
                    }}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Document Signature Settings */}
            <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                4. Data Pengesahan Dokumen (Tanda Tangan & Lokasi)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tempat Pengesahan (Kota/Kab):
                  </label>
                  <input
                    type="text"
                    value={pdfSigningCity}
                    onChange={(e) => setPdfSigningCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="Contoh: Banjarmasin"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nama Penandatangan:
                  </label>
                  <input
                    type="text"
                    value={pdfSignerName}
                    onChange={(e) => setPdfSignerName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="Nama Pengesah"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jabatan / Instansi:
                  </label>
                  <input
                    type="text"
                    value={pdfSignerTitle}
                    onChange={(e) => setPdfSignerTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                    placeholder="Jabatan"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleGeneratePdfFromModal}
                disabled={exportingPdf}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 cursor-pointer transition-all active:scale-95"
              >
                {exportingPdf ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Membuat PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Unduh Dokumen PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
