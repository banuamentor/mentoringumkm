import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Sale, SalesChannel } from '../../types/index.ts';
import { formatCurrency, formatDate, formatPercent } from '../../utils/formatters.ts';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  PlusCircle,
  Receipt,
  X,
  AlertTriangle,
  Calendar,
  Layers,
  Zap,
} from 'lucide-react';

interface UmkmSalesListProps {
  onAddNew: () => void;
}

export const UmkmSalesList: React.FC<UmkmSalesListProps> = ({ onAddNew }) => {
  const { fetchWithAuth } = useAuth();

  const [sales, setSales] = useState<Sale[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const loadSales = async () => {
    setLoading(true);
    try {
      let query = '/api/sales?';
      if (channelFilter) query += `channelId=${channelFilter}&`;
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}&`;

      const res = await fetchWithAuth(query);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Failed to load sales list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetchWithAuth('/api/sales-channels');
        if (res.ok) {
          const list = await res.json();
          setChannels(list);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchChannels();
    loadSales();
  }, [channelFilter, startDate, endDate]);

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/api/sales/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSales(sales.filter((s) => s.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.channelName && s.channelName.toLowerCase().includes(q)) ||
      (s.notes && s.notes.toLowerCase().includes(q)) ||
      String(s.id).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi Penjualan</h1>
          <p className="text-xs text-slate-500">
            Daftar lengkap transaksi penjualan dengan integritas snapshot HPP historis
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer"
        >
          <Zap className="h-4 w-4 fill-current" />
          <span>Catat Penjualan Cepat</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500">Pencarian</label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pembeli, channel, catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500">Channel</label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs focus:border-slate-900 focus:outline-none"
            >
              <option value="">Semua Channel</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">ID / Tanggal</th>
                <th className="py-3 px-4 font-semibold">Channel</th>
                <th className="py-3 px-4 font-semibold">Pembeli</th>
                <th className="py-3 px-4 font-semibold text-right">Omzet</th>
                <th className="py-3 px-4 font-semibold text-right">Total HPP</th>
                <th className="py-3 px-4 font-semibold text-right">Laba Kotor</th>
                <th className="py-3 px-4 font-semibold text-center">Margin %</th>
                <th className="py-3 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data transaksi dari Cloud SQL...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi ditemukan dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const marginPct = sale.totalRevenue > 0 ? (sale.grossProfit / sale.totalRevenue) * 100 : 0;
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">#TRX-{sale.id}</div>
                        <div className="text-[11px] text-slate-500">{formatDate(sale.transactionDate)}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {sale.channelName || 'Toko'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {sale.customerName || <span className="text-slate-400 italic">Umum</span>}
                        {sale.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{sale.notes}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(sale.totalRevenue)}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-500">
                        {formatCurrency(sale.totalHpp)}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {formatCurrency(sale.grossProfit)}
                      </td>

                      <td className="py-3 px-4 text-center">
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

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="Lihat Detail Snapshot"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(sale.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
          </table>
        </div>
      </div>

      {/* Snapshot Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">
                    Detail Transaksi #TRX-{selectedSale.id}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {selectedSale.channelName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Tanggal: {formatDate(selectedSale.transactionDate)} • Pembeli:{' '}
                  {selectedSale.customerName || 'Pelanggan Umum'}
                </p>
              </div>

              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
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
                          Memuat rincian item...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Tutup
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
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                disabled={deleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
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
