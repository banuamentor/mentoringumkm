import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UmkmAnalyticsData, Sale, MentoringSession, ActionPlan } from '../types/index.ts';
import { formatCurrency, formatNumber, formatPercent, formatDate } from './formatters.ts';

export function exportUmkmReportPDF(
  businessName: string,
  analytics: UmkmAnalyticsData,
  periodText: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KINERJA BISNIS & PENJUALAN UMKM', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(businessName || 'Usaha UMKM', pageWidth / 2, 27, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Periode: ${periodText} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 33, { align: 'center' });
  doc.setTextColor(0);

  // Line separator
  doc.setDrawColor(200);
  doc.line(14, 37, pageWidth - 14, 37);

  // Section 1: KPI Ringkasan
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Ringkasan Kinerja Utama (KPI)', 14, 44);

  const kpiData = [
    ['Total Omzet (Revenue)', formatCurrency(analytics.kpi.totalRevenue)],
    ['Total HPP (Harga Pokok Penjualan)', formatCurrency(analytics.kpi.totalHpp)],
    ['Laba Kotor (Gross Profit)', formatCurrency(analytics.kpi.grossProfit)],
    ['Gross Margin Rata-rata', formatPercent(analytics.kpi.grossProfitMargin)],
    ['Total Transaksi Selesai', `${formatNumber(analytics.kpi.totalTransactions)} transaksi`],
    ['Total Produk Terjual', `${formatNumber(analytics.kpi.totalQuantity)} pcs`],
    ['Rata-rata Nilai Transaksi (ATV)', formatCurrency(analytics.kpi.averageTransactionValue)],
    ['Pertumbuhan Penjualan (Growth)', analytics.kpi.growthLabel || '0%'],
  ];

  autoTable(doc, {
    startY: 47,
    head: [['Metrik Kinerja', 'Nilai Capaian']],
    body: kpiData,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right' },
    },
  });

  // Section 2: Tabel Produk
  const finalY1 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Performa Produk & Kontribusi Profit', 14, finalY1);

  const productRows = analytics.products.list.map((p, idx) => [
    idx + 1,
    p.name,
    formatNumber(p.quantity),
    formatCurrency(p.revenue),
    formatCurrency(p.hpp),
    formatCurrency(p.grossProfit),
    formatPercent(p.margin),
  ]);

  autoTable(doc, {
    startY: finalY1 + 3,
    head: [['#', 'Nama Produk', 'Qty', 'Omzet', 'HPP', 'Laba Kotor', 'Margin %']],
    body: productRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right' },
    },
  });

  // Section 3: Channel Penjualan
  const finalY2 = (doc as any).lastAutoTable.finalY + 10;
  if (finalY2 > 240) {
    doc.addPage();
  }
  const currentY = finalY2 > 240 ? 20 : finalY2;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Distribusi Saluran Penjualan (Sales Channels)', 14, currentY);

  const channelRows = analytics.channels.list.map((c) => [
    c.channelName,
    formatNumber(c.transactions),
    formatCurrency(c.revenue),
    formatCurrency(c.hpp),
    formatCurrency(c.grossProfit),
    c.revenue > 0 ? formatPercent((c.grossProfit / c.revenue) * 100) : '0%',
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Channel', 'Transaksi', 'Omzet', 'Total HPP', 'Laba Kotor', 'Margin']],
    body: channelRows,
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' },
    },
  });

  // Save/Download
  const filename = `Laporan_Bisnis_${businessName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export interface TransactionReportOptions {
  scope: 'ALL' | 'SINGLE';
  targetName: string;
  ownerName?: string;
  businessSector?: string;
  cityRegency?: string;
  periodLabel: string;
  generatedBy?: string;
  signerName?: string;
  signerTitle?: string;
  sales: Sale[];
}

/**
 * Generates and downloads an executive PDF report of UMKM transactions
 * Works for either an individual UMKM or consolidated across all UMKMs.
 */
export function exportTransactionsReportPDF(options: TransactionReportOptions) {
  const {
    scope,
    targetName,
    ownerName,
    businessSector,
    cityRegency,
    periodLabel,
    generatedBy = 'Administrator Sistem',
    signerName = 'Koordinator Pendampingan UMKM',
    signerTitle = 'Dinas Koperasi & UMKM / Banua Mentor',
    sales = [],
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color Palette Constants
  const navyDark = [15, 23, 42]; // slate-900
  const slateMuted = [100, 116, 139]; // slate-500
  const emeraldGreen = [16, 185, 129];

  // Financial aggregates
  const totalRevenue = sales.reduce((acc, s) => acc + (s.totalRevenue || 0), 0);
  const totalHpp = sales.reduce((acc, s) => acc + (s.totalHpp || 0), 0);
  const totalGrossProfit = sales.reduce((acc, s) => acc + (s.grossProfit || 0), 0);
  const grossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
  const totalTransactions = sales.length;

  let totalUnits = 0;
  sales.forEach((s) => {
    if (s.items && s.items.length > 0) {
      s.items.forEach((it) => {
        totalUnits += it.quantity || 0;
      });
    }
  });

  const atv = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Header Title
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('LAPORAN TRANSAKSI PENJUALAN UMKM', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Sistem Informasi Manajemen Bisnis & Mentoring UMKM (Banua Mentor)', pageWidth / 2, 23, { align: 'center' });

  // Top Metadata Box
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 27, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);

  // Left metadata column
  doc.setFont('helvetica', 'bold');
  doc.text('Cakupan Laporan:', 18, 33);
  doc.setFont('helvetica', 'normal');
  const scopeDesc =
    scope === 'ALL'
      ? `Konsolidasi Seluruh UMKM (${Array.from(new Set(sales.map((s) => s.umkmId))).length} UMKM Terdata)`
      : `${targetName} ${ownerName ? `(Owner: ${ownerName})` : ''}`;
  doc.text(scopeDesc, 52, 33);

  doc.setFont('helvetica', 'bold');
  doc.text('Periode Transaksi:', 18, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(periodLabel, 52, 39);

  if (scope === 'SINGLE' && (businessSector || cityRegency)) {
    doc.setFont('helvetica', 'bold');
    doc.text('Sektor / Lokasi:', 18, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(`${businessSector || '-'} • ${cityRegency || '-'}`, 52, 44);
  }

  // Right metadata column
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal Cetak:', pageWidth - 80, 33);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - 48, 33);

  doc.setFont('helvetica', 'bold');
  doc.text('Diterbitkan Oleh:', pageWidth - 80, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(generatedBy, pageWidth - 48, 39);

  // Section 1: KPI Ringkasan Finansial
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('1. Ringkasan Finansial Eksekutif', 14, 54);

  const kpiData = [
    [
      'Total Omzet Penjualan (Revenue)',
      formatCurrency(totalRevenue),
      'Total Transaksi Selesai',
      `${formatNumber(totalTransactions)} Transaksi`,
    ],
    [
      'Harga Pokok Penjualan (HPP)',
      formatCurrency(totalHpp),
      'Total Produk / Unit Terjual',
      `${formatNumber(totalUnits)} Unit`,
    ],
    [
      'Laba Kotor (Gross Profit)',
      formatCurrency(totalGrossProfit),
      'Rata-rata Nilai Transaksi (ATV)',
      formatCurrency(atv),
    ],
    [
      'Gross Profit Margin',
      formatPercent(grossMargin),
      'Status Efisiensi Profitabilitas',
      grossMargin >= 30 ? 'Sangat Sehat (>=30%)' : grossMargin >= 15 ? 'Moderat (15-30%)' : 'Rendah (<15%)',
    ],
  ];

  autoTable(doc, {
    startY: 57,
    head: [['Indikator Finansial', 'Nilai Akumulatif', 'Indikator Operasional', 'Volume / Nilai']],
    body: kpiData,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 40 },
      2: { fontStyle: 'bold', cellWidth: 50 },
      3: { halign: 'right', cellWidth: 42 },
    },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: If ALL, Per-UMKM Breakdown Table
  if (scope === 'ALL') {
    const umkmMap: Record<number, {
      id: number;
      name: string;
      owner: string;
      sector: string;
      city: string;
      count: number;
      revenue: number;
      hpp: number;
      profit: number;
    }> = {};

    sales.forEach((s) => {
      if (!umkmMap[s.umkmId]) {
        umkmMap[s.umkmId] = {
          id: s.umkmId,
          name: s.businessName || `UMKM #${s.umkmId}`,
          owner: s.ownerName || '-',
          sector: s.businessSector || 'F&B / Kuliner',
          city: s.cityRegency || 'Kota Bandung',
          count: 0,
          revenue: 0,
          hpp: 0,
          profit: 0,
        };
      }
      umkmMap[s.umkmId].count += 1;
      umkmMap[s.umkmId].revenue += s.totalRevenue || 0;
      umkmMap[s.umkmId].hpp += s.totalHpp || 0;
      umkmMap[s.umkmId].profit += s.grossProfit || 0;
    });

    const umkmList = Object.values(umkmMap).sort((a, b) => b.revenue - a.revenue);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text('2. Rekapitulasi Kinerja per UMKM', 14, currentY);

    const umkmRows = umkmList.map((u, i) => [
      i + 1,
      u.name,
      u.owner,
      u.sector,
      `${formatNumber(u.count)} trx`,
      formatCurrency(u.revenue),
      formatCurrency(u.hpp),
      formatCurrency(u.profit),
      u.revenue > 0 ? formatPercent((u.profit / u.revenue) * 100) : '0%',
      totalRevenue > 0 ? formatPercent((u.revenue / totalRevenue) * 100) : '0%',
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['#', 'Nama Usaha UMKM', 'Pemilik', 'Sektor', 'Trx', 'Omzet', 'Total HPP', 'Laba Kotor', 'Margin', 'Pangsa']],
      body: umkmRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { fontStyle: 'bold', cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 22 },
        4: { halign: 'center', cellWidth: 14 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 20 },
        7: { halign: 'right', cellWidth: 20 },
        8: { halign: 'right', cellWidth: 14 },
        9: { halign: 'right', cellWidth: 14 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Section 3: Detailed Transactions Table
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(
    scope === 'ALL' ? '3. Rincian Daftar Transaksi Penjualan' : '2. Rincian Daftar Transaksi Penjualan',
    14,
    currentY
  );

  const txRows = sales.map((s, index) => {
    const margin = s.totalRevenue > 0 ? (s.grossProfit / s.totalRevenue) * 100 : 0;
    const invNumber = `INV-${String(s.id).padStart(5, '0')}`;

    if (scope === 'ALL') {
      return [
        index + 1,
        formatDate(s.transactionDate),
        invNumber,
        s.businessName || `UMKM #${s.umkmId}`,
        s.channelName || 'Toko Fisik',
        s.customerName || 'Umum',
        formatCurrency(s.totalRevenue),
        formatCurrency(s.totalHpp),
        formatCurrency(s.grossProfit),
        formatPercent(margin),
      ];
    } else {
      // Single UMKM: show item product summary instead of business name
      const itemSummary =
        s.items && s.items.length > 0
          ? s.items.map((it) => `${it.productNameSnapshot} (${it.quantity})`).join(', ')
          : '-';

      return [
        index + 1,
        formatDate(s.transactionDate),
        invNumber,
        itemSummary,
        s.channelName || 'Toko Fisik',
        s.customerName || 'Umum',
        formatCurrency(s.totalRevenue),
        formatCurrency(s.totalHpp),
        formatCurrency(s.grossProfit),
        formatPercent(margin),
      ];
    }
  });

  const txHeaders =
    scope === 'ALL'
      ? [['#', 'Tanggal', 'No. Invoice', 'Nama UMKM', 'Saluran', 'Pelanggan', 'Omzet', 'HPP', 'Laba Kotor', 'Margin']]
      : [['#', 'Tanggal', 'No. Invoice', 'Rincian Produk (Qty)', 'Saluran', 'Pelanggan', 'Omzet', 'HPP', 'Laba Kotor', 'Margin']];

  autoTable(doc, {
    startY: currentY + 3,
    head: txHeaders,
    body: txRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 1.8 },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 18, fontStyle: 'bold' },
      3: { cellWidth: 38 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'right', cellWidth: 18 },
      9: { halign: 'right', cellWidth: 13 },
    },
    foot: [
      [
        'Total',
        '',
        `${formatNumber(sales.length)} Trx`,
        '',
        '',
        '',
        formatCurrency(totalRevenue),
        formatCurrency(totalHpp),
        formatCurrency(totalGrossProfit),
        formatPercent(grossMargin),
      ],
    ],
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Section 4: Channel Distribution
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 20;
  }

  const channelMap: Record<string, { count: number; revenue: number; profit: number }> = {};
  sales.forEach((s) => {
    const chName = s.channelName || 'Toko Fisik';
    if (!channelMap[chName]) {
      channelMap[chName] = { count: 0, revenue: 0, profit: 0 };
    }
    channelMap[chName].count += 1;
    channelMap[chName].revenue += s.totalRevenue || 0;
    channelMap[chName].profit += s.grossProfit || 0;
  });

  const channelRows = Object.entries(channelMap).map(([channel, data]) => [
    channel,
    `${formatNumber(data.count)} transaksi`,
    formatCurrency(data.revenue),
    totalRevenue > 0 ? formatPercent((data.revenue / totalRevenue) * 100) : '0%',
    formatCurrency(data.profit),
  ]);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(
    scope === 'ALL' ? '4. Distribusi Saluran Penjualan' : '3. Distribusi Saluran Penjualan',
    14,
    currentY
  );

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Saluran Penjualan', 'Frekuensi Transaksi', 'Total Omzet', 'Pangsa Omzet (%)', 'Kontribusi Laba Kotor']],
    body: channelRows,
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right', cellWidth: 35 },
      2: { halign: 'right', fontStyle: 'bold', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 35 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Signatures Section
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 25;
  }

  const signDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);

  doc.text(`Ditetapkan di: Banjarmasin / Bandung`, pageWidth - 80, currentY);
  doc.text(`Pada Tanggal: ${signDate}`, pageWidth - 80, currentY + 4.5);
  doc.text(signerTitle, pageWidth - 80, currentY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text(`( ${signerName} )`, pageWidth - 80, currentY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(`Petugas / Koordinator Pelaporan`, pageWidth - 80, currentY + 34);

  // Add Page Numbers footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Dokumen Resmi Sistem Manajemen UMKM • Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Generate clean filename
  const cleanTarget = targetName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const cleanDate = new Date().toISOString().split('T')[0];
  const filename = `Laporan_Transaksi_${scope === 'ALL' ? 'Seluruh_UMKM' : cleanTarget}_${cleanDate}.pdf`;

  doc.save(filename);
  return filename;
}

/**
 * Generates an official single-transaction receipt / invoice PDF
 */
export function exportSingleTransactionPDF(sale: Sale, signerTitle = 'Penanggung Jawab Penjualan') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const invNumber = `INV-${String(sale.id).padStart(6, '0')}`;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(sale.businessName || 'NOTA TRANSAKSI PENJUALAN', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`${sale.cityRegency || 'Kota Bandung'} • Sektor: ${sale.businessSector || 'Kuliner / F&B'}`, pageWidth / 2, 25, { align: 'center' });
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, 30, { align: 'center' });
  doc.setTextColor(0);

  doc.setDrawColor(200);
  doc.line(14, 34, pageWidth - 14, 34);

  // Metadata Table
  const metaRows = [
    ['Nomor Invoice / Transaksi', invNumber, 'Saluran Penjualan', sale.channelName || 'Toko Fisik'],
    ['Tanggal Transaksi', formatDate(sale.transactionDate), 'Nama Pelanggan', sale.customerName || 'Pelanggan Umum'],
    ['Nama Pemilik UMKM', sale.ownerName || '-', 'Catatan Transaksi', sale.notes || '-'],
  ];

  autoTable(doc, {
    startY: 37,
    head: [['Informasi Transaksi', '', '', '']],
    body: metaRows,
    theme: 'plain',
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 45 },
      3: { cellWidth: 45 },
    },
  });

  // Items table
  const items = sale.items || [];
  const itemRows = items.map((it, idx) => [
    idx + 1,
    it.productNameSnapshot,
    formatNumber(it.quantity),
    formatCurrency(it.sellingPrice),
    formatCurrency(it.subtotal),
    formatCurrency(it.totalHpp),
    formatCurrency(it.grossProfit),
    it.subtotal > 0 ? formatPercent((it.grossProfit / it.subtotal) * 100) : '0%',
  ]);

  const currentY = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Nama Produk', 'Qty', 'Harga Satuan', 'Subtotal Omzet', 'HPP Total', 'Laba Kotor', 'Margin']],
    body: itemRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 50 },
      2: { halign: 'right', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 27 },
      5: { halign: 'right', cellWidth: 23 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 23 },
      7: { halign: 'right', cellWidth: 13 },
    },
    foot: [
      [
        'Total',
        '',
        '',
        '',
        formatCurrency(sale.totalRevenue),
        formatCurrency(sale.totalHpp),
        formatCurrency(sale.grossProfit),
        sale.totalRevenue > 0 ? formatPercent((sale.grossProfit / sale.totalRevenue) * 100) : '0%',
      ],
    ],
    footStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Signature line
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pengesahan Transaksi:`, pageWidth - 70, finalY);
  doc.text(signerTitle, pageWidth - 70, finalY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(`( ${sale.ownerName || 'Pengelola UMKM'} )`, pageWidth - 70, finalY + 25);

  const filename = `Nota_Transaksi_${invNumber}_${sale.transactionDate}.pdf`;
  doc.save(filename);
  return filename;
}

export interface MentoringReportOptions {
  scope: 'ALL' | 'SINGLE_UMKM' | 'SINGLE_MENTOR';
  targetTitle: string;
  targetSubtitle?: string;
  umkmDetails?: {
    ownerName?: string;
    businessSector?: string;
    cityRegency?: string;
    whatsapp?: string;
  };
  mentorDetails?: {
    fullName?: string;
    institution?: string;
    position?: string;
    expertise?: string;
    whatsapp?: string;
  };
  programName?: string;
  periodText: string;
  generatedBy?: string;
  signerName?: string;
  signerTitle?: string;
  sessions: MentoringSession[];
  actionPlans?: ActionPlan[];
}

export function exportMentoringReportPDF(options: MentoringReportOptions): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header / Kop
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('SISTEM PENDAMPINGAN & PEMBINAAN UMKM TERPADU', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('LAPORAN KEGIATAN PENDAMPINGAN UMKM & EVALUASI MENTOR', pageWidth / 2, 21, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 116, 144); // cyan-700
  doc.text(options.targetTitle.toUpperCase(), pageWidth / 2, 27, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const progLabel = options.programName || 'Semua Program Pendampingan';
  doc.text(`Program: ${progLabel}  |  Periode: ${options.periodText}`, pageWidth / 2, 32, { align: 'center' });

  // Double line separator
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.6);
  doc.line(14, 35, pageWidth - 14, 35);
  doc.setLineWidth(0.2);
  doc.line(14, 36.2, pageWidth - 14, 36.2);

  // Document Metadata Table
  const metaRows: any[][] = [
    ['Cakupan Laporan', options.scope === 'ALL' ? 'Konsolidasi Seluruh UMKM & Mentor' : options.scope === 'SINGLE_UMKM' ? 'Satu UMKM Dampingan Tertentu' : 'Satu Mentor Pendamping Tertentu', 'Waktu Cetak', `${formatDate(new Date().toISOString())} ${new Date().toLocaleTimeString('id-ID')}`],
    ['Program Pendampingan', progLabel, 'Petugas Cetak', options.generatedBy || 'Administrator Sistem'],
    ['Periode Pelaporan', options.periodText, 'Total Sesi Dilaporkan', `${options.sessions.length} Sesi Pendampingan`],
  ];

  if (options.scope === 'SINGLE_UMKM' && options.umkmDetails) {
    metaRows.push([
      'Pemilik Usaha',
      options.umkmDetails.ownerName || '-',
      'Sektor & Domisili',
      `${options.umkmDetails.businessSector || '-'} (${options.umkmDetails.cityRegency || '-'})`,
    ]);
  } else if (options.scope === 'SINGLE_MENTOR' && options.mentorDetails) {
    metaRows.push([
      'Lembaga / Instansi',
      options.mentorDetails.institution || '-',
      'Jabatan & Keahlian',
      `${options.mentorDetails.position || '-'} (${options.mentorDetails.expertise || '-'})`,
    ]);
  }

  autoTable(doc, {
    startY: 38.5,
    body: metaRows,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38, textColor: [71, 85, 105] },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 38, textColor: [71, 85, 105] },
      3: { cellWidth: 51 },
    },
  });

  // Calculate Metrics
  const uniqueUmkms = new Set(options.sessions.map((s) => s.umkmId)).size;
  const uniqueMentors = new Set(options.sessions.map((s) => s.mentorId)).size;
  const aPlans = options.actionPlans || [];
  const completedPlans = aPlans.filter((p) => p.status === 'COMPLETED').length;
  const inProgressPlans = aPlans.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'NOT_STARTED').length;
  const overduePlans = aPlans.filter((p) => p.isOverdue).length;
  const completionRate = aPlans.length > 0 ? (completedPlans / aPlans.length) * 100 : 0;

  let currentY = (doc as any).lastAutoTable.finalY + 5;

  // Section 1: Executive KPI Box
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Ringkasan Kinerja & Capaian Pendampingan', 14, currentY);

  const kpiRows = [
    [
      'Total Sesi Terlaksana',
      `${formatNumber(options.sessions.length)} Sesi`,
      'Rencana Aksi Ditetapkan',
      `${formatNumber(aPlans.length)} Target Aksi`,
    ],
    [
      'UMKM Dampingan Terlibat',
      `${formatNumber(uniqueUmkms)} Usaha UMKM`,
      'Target Aksi Selesai',
      `${formatNumber(completedPlans)} (${formatPercent(completionRate)})`,
    ],
    [
      'Mentor Pendamping Aktif',
      `${formatNumber(uniqueMentors)} Tenaga Mentor`,
      'Aksi Berjalan / Terlambat',
      `${formatNumber(inProgressPlans)} Berjalan / ${formatNumber(overduePlans)} Overdue`,
    ],
  ];

  autoTable(doc, {
    startY: currentY + 2.5,
    body: kpiRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 46, fillColor: [248, 250, 252] },
      1: { cellWidth: 45, fontStyle: 'bold', textColor: [14, 116, 144] },
      2: { fontStyle: 'bold', cellWidth: 46, fillColor: [248, 250, 252] },
      3: { cellWidth: 45, fontStyle: 'bold', textColor: [16, 185, 129] },
    },
  });

  // Section 2: Mentoring Sessions Table
  currentY = (doc as any).lastAutoTable.finalY + 7;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Log & Rekapitulasi Sesi Pendampingan', 14, currentY);

  const sessionRows = options.sessions.map((s, idx) => {
    const mentorInfo = s.mentorInstitution ? `${s.mentorName || '-'}\n(${s.mentorInstitution})` : s.mentorName || '-';
    const umkmInfo = s.ownerName ? `${s.businessName || '-'}\n(Pemilik: ${s.ownerName})` : s.businessName || '-';
    const topicProblem = s.problem ? `Topik: ${s.topic}\nKendala: ${s.problem}` : `Topik: ${s.topic}`;
    const recFindings = s.findings ? `Temuan: ${s.findings}\nRekomendasi: ${s.recommendation}` : s.recommendation;

    return [
      idx + 1,
      formatDate(s.sessionDate),
      s.programName || '-',
      mentorInfo,
      umkmInfo,
      topicProblem,
      recFindings,
    ];
  });

  if (sessionRows.length === 0) {
    sessionRows.push(['-', '-', '-', '-', '-', 'Tidak ada sesi pendampingan pada kriteria ini', '-']);
  }

  autoTable(doc, {
    startY: currentY + 2.5,
    head: [['#', 'Tgl Sesi', 'Program', 'Mentor Pendamping', 'UMKM Dampingan', 'Topik & Pokok Masalah', 'Temuan & Rekomendasi Solusi']],
    body: sessionRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], fontSize: 7.5, halign: 'center' },
    styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 17, halign: 'center' },
      2: { cellWidth: 26 },
      3: { cellWidth: 32 },
      4: { cellWidth: 32 },
      5: { cellWidth: 36 },
      6: { cellWidth: 32 },
    },
  });

  // Section 3: Action Plans Table (if available)
  if (aPlans.length > 0) {
    currentY = (doc as any).lastAutoTable.finalY + 7;
    // Check if we need to add a page
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. Rekapitulasi Rencana Aksi & Target Perbaikan', 14, currentY);

    const aPlanRows = aPlans.map((p, idx) => {
      let statusLabel = 'Belum Mulai';
      if (p.status === 'COMPLETED') statusLabel = 'Selesai';
      else if (p.status === 'IN_PROGRESS') statusLabel = p.isOverdue ? 'Terlambat' : 'Sedang Berjalan';
      else if (p.status === 'CANCELLED') statusLabel = 'Dibatalkan';

      const lastEval = p.evaluations && p.evaluations.length > 0 ? p.evaluations[0].evaluationNotes : '-';

      return [
        idx + 1,
        p.title,
        p.businessName || '-',
        p.mentorName || '-',
        formatDate(p.deadline),
        statusLabel,
        lastEval,
      ];
    });

    autoTable(doc, {
      startY: currentY + 2.5,
      head: [['#', 'Target / Rencana Aksi', 'UMKM Dampingan', 'Mentor Pembimbing', 'Deadline', 'Status', 'Evaluasi Terakhir']],
      body: aPlanRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontSize: 7.5, halign: 'center' },
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 42 },
        2: { cellWidth: 32 },
        3: { cellWidth: 32 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 31 },
      },
    });
  }

  // Section 4: Signature / Pengesahan Dokumen
  let signY = (doc as any).lastAutoTable.finalY + 12;
  if (signY > pageHeight - 45) {
    doc.addPage();
    signY = 25;
  }

  const signerName = options.signerName || 'Administrator Program UMKM';
  const signerTitle = options.signerTitle || 'Koordinator Pendampingan & Pembinaan Usaha';

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Disahkan di: Banjarmasin`, pageWidth - 78, signY);
  doc.text(`Tanggal: ${formatDate(new Date().toISOString())}`, pageWidth - 78, signY + 4.5);
  doc.text(signerTitle, pageWidth - 78, signY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text(`( ${signerName} )`, pageWidth - 78, signY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100);
  doc.text('Tanda Tangan & Cap Resmi', pageWidth - 78, signY + 32);

  // Footer on each page
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.text(`Dokumen Resmi Sistem Pendampingan UMKM - Dicetak otomatis oleh Sistem`, 14, pageHeight - 8);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  const cleanSlug = options.targetTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const filename = `Laporan_Pendampingan_${cleanSlug}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  return filename;
}

export function exportSingleMentoringSessionPDF(session: MentoringSession, actionPlans?: ActionPlan[]): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header / Kop Surat
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('PEMERINTAH DAERAH / LEMBAGA PENGELOLA PENDAMPINGAN UMKM', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('BERITA ACARA & RESUME SESI PENDAMPINGAN UMKM', pageWidth / 2, 21, { align: 'center' });

  const docCode = `BA-PENDAMPINGAN-${String(session.id).padStart(4, '0')}/${session.sessionDate.replace(/-/g, '')}`;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 116, 144);
  doc.text(`Nomor Registrasi: ${docCode}`, pageWidth / 2, 27, { align: 'center' });

  // Double separator
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(14, 31, pageWidth - 14, 31);
  doc.setLineWidth(0.2);
  doc.line(14, 32.2, pageWidth - 14, 32.2);

  // Section: Informasi Waktu & Program
  const generalRows = [
    ['Program Pendampingan', session.programName || '-', 'Tanggal Pelaksanaan', formatDate(session.sessionDate)],
    ['Topik Sesi', session.topic, 'ID Dokumen Sesi', `#SESSION-${session.id}`],
  ];

  autoTable(doc, {
    startY: 35,
    body: generalRows,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 38, textColor: [71, 85, 105] },
      1: { cellWidth: 62 },
      2: { fontStyle: 'bold', cellWidth: 38, textColor: [71, 85, 105] },
      3: { cellWidth: 44 },
    },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 4;

  // Box 1 & 2: Identitas Mentor & UMKM (Two Column Table)
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('I. Identitas Para Pihak (Mentor & UMKM Dampingan)', 14, currentY);

  const partiesRows = [
    [
      'A. TENAGA MENTOR PENDAMPING',
      'B. PELAKU USAHA UMKM DAMPINGAN',
    ],
    [
      `Nama Mentor: ${session.mentorName || '-'}\nInstansi: ${session.mentorInstitution || '-'}\nJabatan: ${session.mentorPosition || '-'}\nEmail: ${session.mentorEmail || '-'}\nKontak/WA: ${session.mentorWhatsapp || '-'}`,
      `Nama Usaha: ${session.businessName || '-'}\nNama Pemilik: ${session.ownerName || '-'}\nSektor Usaha: ${session.businessSector || '-'}\nWilayah: ${session.cityRegency || '-'}\nAlamat: ${session.address || '-'}`,
    ],
  ];

  autoTable(doc, {
    startY: currentY + 2.5,
    body: partiesRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 91, fillColor: [248, 250, 252] },
      1: { cellWidth: 91, fillColor: [255, 255, 255] },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Section II: Uraian Hasil Pendampingan
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('II. Notulensi & Hasil Konsultasi Pendampingan', 14, currentY);

  const findingsRows = [
    ['Pokok Bahasan / Topik', session.topic],
    ['Kendala / Masalah Utama Usaha', session.problem || 'Tidak ada catatan masalah khusus yang dicatat'],
    ['Temuan Lapangan / Diagnosa Mentor', session.findings || 'Analisis operasional dan kepatuhan berjalan normal'],
    ['Rekomendasi & Solusi Strategis', session.recommendation],
    ['Catatan Tambahan & Kesepakatan', session.additionalNotes || 'Tidak ada catatan khusus'],
  ];

  autoTable(doc, {
    startY: currentY + 2.5,
    body: findingsRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, overflow: 'linebreak' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, fillColor: [241, 245, 249], textColor: [15, 23, 42] },
      1: { cellWidth: 132, textColor: [30, 41, 59] },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Section III: Action Plans
  const plans = actionPlans && actionPlans.length > 0 ? actionPlans : session.actionPlans || [];
  if (plans.length > 0) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('III. Target Rencana Aksi (Action Plans) Disepakati', 14, currentY);

    const planRows = plans.map((p, idx) => {
      let statusLabel = 'Belum Mulai';
      if (p.status === 'COMPLETED') statusLabel = 'Selesai';
      else if (p.status === 'IN_PROGRESS') statusLabel = p.isOverdue ? 'Terlambat' : 'Sedang Berjalan';

      return [
        idx + 1,
        p.title,
        p.target || '-',
        p.pic || 'Pelaku UMKM',
        formatDate(p.deadline),
        statusLabel,
      ];
    });

    autoTable(doc, {
      startY: currentY + 2.5,
      head: [['#', 'Target / Aksi Nyata', 'Target Capaian', 'PIC', 'Batas Waktu', 'Status']],
      body: planRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 7.5, halign: 'center' },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 52 },
        2: { cellWidth: 42 },
        3: { cellWidth: 26 },
        4: { cellWidth: 26, halign: 'center' },
        5: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Section IV: Tanda Tangan Para Pihak
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 25;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Demikian Berita Acara Pendampingan ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.', 14, currentY);

  const signTop = currentY + 7;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  // Left: UMKM
  doc.text('Pihak Pelaku Usaha UMKM,', 25, signTop);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${session.ownerName || session.businessName || 'Pelaku UMKM'} )`, 25, signTop + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(session.businessName || 'Usaha UMKM', 25, signTop + 26);

  // Right: Mentor
  doc.setFontSize(8.5);
  doc.text('Pihak Mentor Pendamping,', pageWidth - 75, signTop);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${session.mentorName || 'Mentor Pendamping'} )`, pageWidth - 75, signTop + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(session.mentorInstitution || 'Tenaga Pendamping Resmi', pageWidth - 75, signTop + 26);

  // Footer
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.text(`Berita Acara Sesi Pendampingan UMKM - ID #${session.id}`, 14, pageHeight - 8);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  const filename = `Berita_Acara_Pendampingan_Sesi_${session.id}_${session.sessionDate}.pdf`;
  doc.save(filename);
  return filename;
}
