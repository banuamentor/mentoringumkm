import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UmkmAnalyticsData } from '../types/index.ts';
import { formatCurrency, formatNumber, formatPercent } from './formatters.ts';

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
