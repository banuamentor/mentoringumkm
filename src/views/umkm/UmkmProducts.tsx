import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Product } from '../../types/index.ts';
import { formatCurrency, formatPercent } from '../../utils/formatters.ts';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Tag,
} from 'lucide-react';

export const UmkmProducts: React.FC = () => {
  const { fetchWithAuth } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    unit: string;
    defaultSellingPrice: number | '';
    defaultHpp: number | '';
    status: string;
  }>({
    name: '',
    sku: '',
    unit: 'pcs',
    defaultSellingPrice: '',
    defaultHpp: '',
    status: 'ACTIVE',
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      unit: 'pack',
      defaultSellingPrice: '',
      defaultHpp: '',
      status: 'ACTIVE',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku || '',
      unit: p.unit || 'pcs',
      defaultSellingPrice: p.defaultSellingPrice === 0 ? '' : p.defaultSellingPrice,
      defaultHpp: p.defaultHpp === 0 ? '' : p.defaultHpp,
      status: p.status,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg('Nama produk wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        defaultSellingPrice: Number(formData.defaultSellingPrice) || 0,
        defaultHpp: Number(formData.defaultHpp) || 0,
      };

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menyimpan produk');
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Hapus atau nonaktifkan produk ini?')) return;
    try {
      const res = await fetchWithAuth(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      alert(data.message || 'Berhasil');
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
  });

  const sellingNum = Number(formData.defaultSellingPrice) || 0;
  const hppNum = Number(formData.defaultHpp) || 0;
  const estimatedProfit = sellingNum - hppNum;
  const estimatedMargin = sellingNum > 0 ? (estimatedProfit / sellingNum) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Katalog Produk & HPP Standar</h1>
          <p className="text-xs text-slate-500">
            Kelola master harga jual dan perhitungan HPP acuan untuk snapshot transaksi
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-slate-900 focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total: <span className="font-bold text-slate-900">{filteredProducts.length}</span> produk
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">Nama Produk</th>
                <th className="py-3 px-4 font-semibold">SKU / Kode</th>
                <th className="py-3 px-4 font-semibold">Satuan</th>
                <th className="py-3 px-4 font-semibold text-right">Harga Jual</th>
                <th className="py-3 px-4 font-semibold text-right">HPP Standar</th>
                <th className="py-3 px-4 font-semibold text-right">Estimasi Laba</th>
                <th className="py-3 px-4 font-semibold text-center">Margin %</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Memuat data produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Belum ada produk yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profit = p.defaultSellingPrice - p.defaultHpp;
                  const marginPct = p.defaultSellingPrice > 0 ? (profit / p.defaultSellingPrice) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{p.sku || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{p.unit}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(p.defaultSellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {formatCurrency(p.defaultHpp)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {formatCurrency(profit)}
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
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="Edit Produk"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Hapus Produk"
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Master Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Nama Produk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Arabika Gayo 250g"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">SKU / Kode Unik</label>
                  <input
                    type="text"
                    placeholder="KOP-GYO-250"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Satuan Unit</label>
                  <input
                    type="text"
                    placeholder="pack / botol / box"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Harga Jual Standar (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Contoh: 35000"
                    value={formData.defaultSellingPrice === '' ? '' : formData.defaultSellingPrice}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                      setFormData({ ...formData, defaultSellingPrice: raw === '' ? '' : Number(raw) });
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">HPP Standar (Harga Pokok) (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Contoh: 25000"
                    value={formData.defaultHpp === '' ? '' : formData.defaultHpp}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/^0+(?=\d)/, '');
                      setFormData({ ...formData, defaultHpp: raw === '' ? '' : Number(raw) });
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time Profit Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Kalkulasi Laba & Margin Otomatis
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Estimasi Laba Kotor per Unit:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(estimatedProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Estimasi Margin:</span>
                  <span className="font-bold text-slate-900">{formatPercent(estimatedMargin)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Status Produk</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-slate-900 focus:outline-none"
                >
                  <option value="ACTIVE">Aktif (Dapat dijual)</option>
                  <option value="INACTIVE">Nonaktif (Arsip)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
