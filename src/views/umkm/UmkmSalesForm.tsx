import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Product, SalesChannel } from '../../types/index.ts';
import { formatCurrency, formatPercent } from '../../utils/formatters.ts';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface UmkmSalesFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormItem {
  productId: number;
  productName: string;
  unit: string;
  defaultHpp: number;
  sellingPrice: number;
  quantity: number;
}

export const UmkmSalesForm: React.FC<UmkmSalesFormProps> = ({ onSuccess, onCancel }) => {
  const { fetchWithAuth } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [salesChannelId, setSalesChannelId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [items, setItems] = useState<FormItem[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load products and channels
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, chanRes] = await Promise.all([
          fetchWithAuth('/api/products'),
          fetchWithAuth('/api/sales-channels'),
        ]);

        if (prodRes.ok) {
          const prods: Product[] = await prodRes.json();
          setProducts(prods);

          // Add first product as default row if available
          if (prods.length > 0 && items.length === 0) {
            setItems([
              {
                productId: prods[0].id,
                productName: prods[0].name,
                unit: prods[0].unit,
                defaultHpp: prods[0].defaultHpp,
                sellingPrice: prods[0].defaultSellingPrice,
                quantity: 1,
              },
            ]);
          }
        }

        if (chanRes.ok) {
          const chans: SalesChannel[] = await chanRes.json();
          setChannels(chans);
          if (chans.length > 0) {
            setSalesChannelId(chans[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
      }
    };

    fetchData();
  }, []);

  const handleProductChange = (index: number, newProductId: number) => {
    const selectedProd = products.find((p) => p.id === newProductId);
    if (!selectedProd) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: selectedProd.id,
      productName: selectedProd.name,
      unit: selectedProd.unit,
      defaultHpp: selectedProd.defaultHpp,
      sellingPrice: selectedProd.defaultSellingPrice,
    };
    setItems(newItems);
  };

  const handleQtyChange = (index: number, val: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, val || 1);
    setItems(newItems);
  };

  const handlePriceChange = (index: number, val: number) => {
    const newItems = [...items];
    newItems[index].sellingPrice = Math.max(0, val || 0);
    setItems(newItems);
  };

  const addRow = () => {
    if (products.length === 0) return;
    const defaultP = products[0];
    setItems([
      ...items,
      {
        productId: defaultP.id,
        productName: defaultP.name,
        unit: defaultP.unit,
        defaultHpp: defaultP.defaultHpp,
        sellingPrice: defaultP.defaultSellingPrice,
        quantity: 1,
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg('Transaksi harus memiliki minimal 1 item produk.');
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Calculations
  const calculatedItems = items.map((item) => {
    const subtotal = item.sellingPrice * item.quantity;
    const totalHpp = item.defaultHpp * item.quantity;
    const grossProfit = subtotal - totalHpp;
    const margin = subtotal > 0 ? (grossProfit / subtotal) * 100 : 0;
    return {
      ...item,
      subtotal,
      totalHpp,
      grossProfit,
      margin,
    };
  });

  const totalRevenue = calculatedItems.reduce((acc, i) => acc + i.subtotal, 0);
  const totalHpp = calculatedItems.reduce((acc, i) => acc + i.totalHpp, 0);
  const totalGrossProfit = totalRevenue - totalHpp;
  const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!salesChannelId) {
      setErrorMsg('Pilih channel penjualan terlebih dahulu.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Masukkan minimal 1 produk.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        transactionDate,
        salesChannelId: Number(salesChannelId),
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          sellingPrice: i.sellingPrice,
        })),
      };

      const res = await fetchWithAuth('/api/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menyimpan transaksi.');
      }

      setSuccessMsg('Transaksi berhasil dicatat dengan snapshot HPP tersimpan.');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Catat Penjualan Baru</h1>
            <p className="text-xs text-slate-500">
              Input rincian transaksi dengan snapshot HPP otomatis ke Cloud SQL
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Header Info */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Tanggal Transaksi *</label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Channel Penjualan *</label>
            <select
              required
              value={salesChannelId}
              onChange={(e) => setSalesChannelId(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            >
              <option value="">-- Pilih Channel Penjualan --</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Nama Pembeli (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Pak Hendra / Shopee Live"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Dynamic Multi-Product Items Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daftar Produk yang Terjual</h2>
              <p className="text-xs text-slate-500">
                Snapshot HPP diambil otomatis dari master produk saat transaksi dicatat
              </p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Baris Produk</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg bg-amber-50 p-4 text-xs text-amber-800">
              Belum ada data produk aktif di katalog. Tambahkan produk terlebih dahulu di menu{' '}
              <strong className="underline">Katalog Produk & HPP</strong>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-semibold">Produk</th>
                    <th className="pb-2 font-semibold w-24 text-right">Harga Jual</th>
                    <th className="pb-2 font-semibold w-20 text-center">Qty</th>
                    <th className="pb-2 font-semibold w-24 text-right">HPP Item</th>
                    <th className="pb-2 font-semibold w-28 text-right">Subtotal</th>
                    <th className="pb-2 font-semibold w-24 text-right">Laba Kotor</th>
                    <th className="pb-2 font-semibold w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculatedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 pr-2">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.unit})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.sellingPrice}
                          onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                          className="w-24 rounded border border-slate-300 px-2 py-1 text-right text-xs focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                          className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-xs focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-right text-slate-500">
                        {formatCurrency(item.defaultHpp)}
                      </td>

                      <td className="py-2.5 px-2 text-right font-medium text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </td>

                      <td className="py-2.5 px-2 text-right font-semibold text-emerald-700">
                        {formatCurrency(item.grossProfit)}
                        <span className="block text-[10px] font-normal text-slate-400">
                          {formatPercent(item.margin)}
                        </span>
                      </td>

                      <td className="py-2.5 pl-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Hapus Baris"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notes and Live Calculation Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Notes */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-xs font-semibold text-slate-700">Catatan Tambahan Transaksi</label>
            <textarea
              rows={4}
              placeholder="Catatan promo, nomor resi kurir, atau detail khusus pelanggan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-slate-900 focus:outline-none"
            />
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              <span>Semua total dihitung ulang dan diverifikasi integritasnya oleh server.</span>
            </div>
          </div>

          {/* Real-time Summary Card */}
          <div className="rounded-xl border border-slate-900 bg-slate-900 p-5 text-white shadow-md">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ringkasan Live Transaksi
            </div>

            <div className="mt-4 space-y-2.5 border-b border-slate-800 pb-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Omzet (Revenue)</span>
                <span className="font-semibold text-white">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total HPP (Harga Pokok)</span>
                <span className="text-slate-300">{formatCurrency(totalHpp)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Gross Margin %</span>
                <span className="text-amber-400 font-semibold">{formatPercent(overallMargin)}</span>
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Laba Kotor (Gross Profit)
              </span>
              <span className="text-xl font-extrabold text-emerald-400">
                {formatCurrency(totalGrossProfit)}
              </span>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={submitting || products.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{submitting ? 'Menyimpan ke Cloud SQL...' : 'Simpan Transaksi'}</span>
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
