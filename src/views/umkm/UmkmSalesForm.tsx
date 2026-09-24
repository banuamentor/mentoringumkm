import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Product, SalesChannel } from '../../types/index.ts';
import { formatCurrency, formatPercent } from '../../utils/formatters.ts';
import {
  Plus,
  Minus,
  Trash2,
  Save,
  ArrowLeft,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Store,
  MessageCircle,
  ShoppingBag,
  RotateCcw,
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

  // Mode: 'quick' (POS / One-Handed) or 'classic' (Detailed Form)
  const [mode, setMode] = useState<'quick' | 'classic'>('quick');

  const [products, setProducts] = useState<Product[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [salesChannelId, setSalesChannelId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [items, setItems] = useState<FormItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOptionalDetails, setShowOptionalDetails] = useState<boolean>(false);

  // Discount, shipping, tax and other fees
  const [discountType, setDiscountType] = useState<'NOMINAL' | 'PERCENTAGE'>('NOMINAL');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [shippingFee, setShippingFee] = useState<string>('');
  const [taxType, setTaxType] = useState<'NOMINAL' | 'PERCENTAGE'>('PERCENTAGE');
  const [taxValue, setTaxValue] = useState<string>('');
  const [otherFee, setOtherFee] = useState<string>('');

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

          // In classic mode, initialize with 1 product row if available
          if (prods.length > 0 && items.length === 0 && mode === 'classic') {
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
  }, [mode]);

  // One-Handed Quick POS Methods:
  const handleQuickAdd = (product: Product) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            unit: product.unit,
            defaultHpp: product.defaultHpp,
            sellingPrice: product.defaultSellingPrice,
            quantity: 1,
          },
        ];
      }
    });
  };

  const handleQuickDecrease = (productId: number) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === productId);
      if (existingIdx < 0) return prev;

      if (prev[existingIdx].quantity <= 1) {
        return prev.filter((i) => i.productId !== productId);
      } else {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity - 1,
        };
        return updated;
      }
    });
  };

  const handleQuickQuantityBoost = (productId: number, delta: number) => {
    setItems((prev) => {
      return prev.map((i) => {
        if (i.productId === productId) {
          return { ...i, quantity: Math.max(1, i.quantity + delta) };
        }
        return i;
      });
    });
  };

  const handleRemoveProduct = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  // Classic Form Methods
  const handleClassicProductChange = (index: number, newProductId: number) => {
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

  const handleClassicQtyChange = (index: number, val: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, val || 1);
    setItems(newItems);
  };

  const handleClassicPriceChange = (index: number, val: number) => {
    const newItems = [...items];
    newItems[index].sellingPrice = Math.max(0, val || 0);
    setItems(newItems);
  };

  const handleClassicAddRow = () => {
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

  const subtotalRevenue = calculatedItems.reduce((acc, i) => acc + i.subtotal, 0);
  const totalHpp = calculatedItems.reduce((acc, i) => acc + i.totalHpp, 0);

  // Discount calculation
  let discountAmount = 0;
  const discValueNum = Math.max(0, Number(discountValue) || 0);
  if (discountType === 'PERCENTAGE') {
    const pct = Math.min(100, discValueNum);
    discountAmount = Math.round((subtotalRevenue * pct) / 100);
  } else {
    discountAmount = Math.min(subtotalRevenue, discValueNum);
  }

  const netSales = Math.max(0, subtotalRevenue - discountAmount);

  // Shipping Fee
  const shipFee = Math.max(0, Number(shippingFee) || 0);

  // Tax calculation
  let taxAmount = 0;
  const taxValueNum = Math.max(0, Number(taxValue) || 0);
  if (taxType === 'PERCENTAGE') {
    taxAmount = Math.round((netSales * taxValueNum) / 100);
  } else {
    taxAmount = taxValueNum;
  }

  // Other Fee
  const othFee = Math.max(0, Number(otherFee) || 0);

  // Grand Total for Customer to Pay
  const totalRevenue = netSales + shipFee + taxAmount + othFee;

  // Real Business Gross Profit (Revenue from goods minus HPP)
  const totalGrossProfit = netSales - totalHpp;
  const overallMargin = subtotalRevenue > 0 ? (totalGrossProfit / subtotalRevenue) * 100 : 0;
  const totalQuantity = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!salesChannelId) {
      setErrorMsg('Pilih channel penjualan terlebih dahulu.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Pilih minimal 1 produk yang terjual.');
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
        discountType,
        discountValue: Number(discountValue) || 0,
        shippingFee: Number(shippingFee) || 0,
        taxType,
        taxValue: Number(taxValue) || 0,
        otherFee: Number(otherFee) || 0,
      };

      const res = await fetchWithAuth('/api/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menyimpan transaksi.');
      }

      setSuccessMsg('Transaksi berhasil dicatat!');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-36 sm:pb-32">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs active:scale-95"
            title="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Catat Penjualan</span>
              {mode === 'quick' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  <Zap className="h-3 w-3 fill-current" />
                  1-Tangan
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-500">
              {mode === 'quick'
                ? 'Sentuh produk untuk tambah item, simpan di tombol bawah'
                : 'Form input detail penjualan'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Segmented Control */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-bold transition-all ${
              mode === 'quick'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Mode Cepat (1-Tangan)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('classic');
              if (items.length === 0 && products.length > 0) {
                setItems([
                  {
                    productId: products[0].id,
                    productName: products[0].name,
                    unit: products[0].unit,
                    defaultHpp: products[0].defaultHpp,
                    sellingPrice: products[0].defaultSellingPrice,
                    quantity: 1,
                  },
                ]);
              }
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-bold transition-all ${
              mode === 'classic'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Form Detail</span>
          </button>
        </div>
      </div>

      {/* TOP ACTION & SUMMARY BAR (Accessible without scrolling down) */}
      <div
        id="umkm-sales-top-action-bar"
        className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-3.5 sm:p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                Total Transaksi ({totalQuantity} unit)
              </span>
              {items.length > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  {items.length} jenis produk
                </span>
              )}
            </div>
            <div className="text-lg sm:text-2xl font-black text-emerald-400 truncate">
              {formatCurrency(totalRevenue)}
            </div>
            {totalRevenue > 0 && (
              <div className="text-[11px] text-slate-300 truncate">
                Est. Laba Kotor: <strong className="text-emerald-300">{formatCurrency(totalGrossProfit)}</strong> ({formatPercent(overallMargin)})
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-initial rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || items.length === 0 || !salesChannelId}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-md hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
            title="Simpan penjualan sekarang"
          >
            <Save className="h-4 w-4" />
            <span>
              {submitting
                ? 'Menyimpan...'
                : items.length === 0
                ? 'Pilih Produk'
                : 'Simpan Transaksi'}
            </span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. CHANNEL PENJUALAN CEPAT (ONE-TAP THUMB PILLS) */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Saluran Penjualan <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-500">Sentuh untuk memilih</span>
        </div>

        {/* Scrollable pill buttons designed for thumb tap */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {channels.map((chan) => {
            const isSelected = salesChannelId === chan.id;
            return (
              <button
                key={chan.id}
                type="button"
                onClick={() => setSalesChannelId(chan.id)}
                className={`flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isSelected ? (
                  <Check className="h-4 w-4 text-emerald-400 stroke-[3px]" />
                ) : (
                  <Store className="h-4 w-4 text-slate-400" />
                )}
                <span>{chan.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: CEPAT & SATU TANGAN (POS-STYLE) */}
      {/* ======================================================== */}
      {mode === 'quick' ? (
        <div className="space-y-4">
          {/* Product Search (if more than 4 products) */}
          {products.length > 4 && (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Quick Product Grid (One-Handed Tap Zone) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Katalog Produk (Sentuh untuk Menambah)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Tekan produk untuk menambah 1 unit penjualan
                </p>
              </div>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Pilihan</span>
                </button>
              )}
            </div>

            {products.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-4 text-xs text-amber-900 border border-amber-200">
                Belum ada data produk di katalog. Tambahkan produk di menu{' '}
                <strong>Katalog Produk & HPP</strong> terlebih dahulu.
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                Produk "{searchQuery}" tidak ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {filteredProducts.map((p) => {
                  const cartItem = items.find((i) => i.productId === p.id);
                  const isSelected = !!cartItem;
                  const qty = cartItem ? cartItem.quantity : 0;

                  return (
                    <div
                      key={p.id}
                      className={`relative flex flex-col justify-between rounded-xl border p-3 transition-all select-none ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/30'
                          : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      {/* Product tap area */}
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(p)}
                        className="w-full text-left focus:outline-none cursor-pointer active:scale-98 transition-transform"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="line-clamp-2 text-xs font-bold text-slate-900 leading-tight">
                            {p.name}
                          </span>
                          {isSelected && (
                            <span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                              {qty}
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5">
                          <div className="text-xs font-extrabold text-slate-900">
                            {formatCurrency(p.defaultSellingPrice)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            per {p.unit}
                          </div>
                        </div>
                      </button>

                      {/* Stepper controls right on the tile for 1-hand speed */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                        {isSelected ? (
                          <div className="flex w-full items-center justify-between">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickDecrease(p.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-800 active:scale-90 font-bold hover:bg-rose-200"
                              title="Kurangi 1"
                            >
                              <Minus className="h-4 w-4 stroke-[3px]" />
                            </button>

                            <span className="text-xs font-black text-emerald-950">
                              {qty} {p.unit}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAdd(p);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white active:scale-90 font-bold hover:bg-emerald-700"
                              title="Tambah 1"
                            >
                              <Plus className="h-4 w-4 stroke-[3px]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(p)}
                            className="flex w-full items-center justify-center gap-1 rounded-lg bg-white border border-slate-300 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 active:scale-95 shadow-2xs"
                          >
                            <Plus className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Pilih</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ringkasan Item Terpilih (Cart Summary) */}
          {items.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Item Terpilih ({totalQuantity} unit)
                  </span>
                </div>
                <span className="text-xs font-black text-slate-900">
                  Subtotal: {formatCurrency(totalRevenue)}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {calculatedItems.map((item) => (
                  <div
                    key={item.productId}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatCurrency(item.sellingPrice)} × {item.quantity} {item.unit} ={' '}
                        <strong className="text-slate-800 font-bold">
                          {formatCurrency(item.subtotal)}
                        </strong>
                      </div>
                    </div>

                    {/* Quick Boosters (+1, +5) and Steppers */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuickQuantityBoost(item.productId, 5)}
                        className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 active:scale-95"
                        title="Tambah 5 unit"
                      >
                        +5
                      </button>

                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleQuickDecrease(item.productId)}
                          className="flex h-7 w-7 items-center justify-center rounded text-slate-700 hover:bg-white active:scale-90"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-extrabold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(products.find((p) => p.id === item.productId)!)}
                          className="flex h-7 w-7 items-center justify-center rounded text-slate-700 hover:bg-white active:scale-90"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.productId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opsi Tambahan (Collapsible Accordion for Date, Customer, Notes) */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowOptionalDetails(!showOptionalDetails)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>Atur Tanggal, Nama Pembeli & Catatan</span>
                {(customerName || notes || transactionDate !== new Date().toISOString().split('T')[0]) && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Terisi
                  </span>
                )}
              </div>
              {showOptionalDetails ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {showOptionalDetails && (
              <div className="border-t border-slate-100 p-3.5 space-y-3 bg-slate-50/50">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full sm:max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Pembeli (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ibu Rina / Pelanggan Setia"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Catatan Transaksi (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan tambahan pesanan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* MODE 2: FORM DETAIL (CLASSIC DESKTOP/MOBILE VIEW) */
        /* ======================================================== */
        <div className="space-y-4">
          {/* Tanggal Transaksi */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Tanggal Transaksi <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full sm:max-w-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
            />
          </div>

          {/* Daftar Produk (Form List) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Daftar Produk yang Terjual
                </h2>
                <p className="text-[11px] text-slate-500">
                  Produk, harga jual per unit, dan jumlah terjual
                </p>
              </div>
              <button
                type="button"
                onClick={handleClassicAddRow}
                className="flex items-center gap-1 rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            {/* Mobile Card List */}
            <div className="space-y-3 sm:hidden">
              {calculatedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Item #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (items.length > 1) {
                          setItems(items.filter((_, i) => i !== idx));
                        }
                      }}
                      disabled={items.length <= 1}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-30"
                    >
                      Hapus
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Produk
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleClassicProductChange(idx, Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Harga Jual (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.sellingPrice}
                        onChange={(e) => handleClassicPriceChange(idx, Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-right font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1 text-center">
                        Qty (Jumlah)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleClassicQtyChange(idx, Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-center text-xs font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-white p-2 text-xs">
                    <span className="font-semibold text-slate-600">Subtotal:</span>
                    <span className="font-extrabold text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-semibold">Produk</th>
                    <th className="pb-2 font-semibold text-right w-36">Harga Jual</th>
                    <th className="pb-2 font-semibold text-center w-24">Qty</th>
                    <th className="pb-2 font-semibold text-right w-36">Subtotal</th>
                    <th className="pb-2 font-semibold text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculatedItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-2">
                        <select
                          value={item.productId}
                          onChange={(e) => handleClassicProductChange(idx, Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900"
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
                          placeholder="0"
                          value={item.sellingPrice === 0 ? '' : item.sellingPrice}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/^0+(?=\d)/, '');
                            handleClassicPriceChange(idx, raw === '' ? 0 : Number(raw));
                          }}
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-right text-xs font-medium text-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/^0+(?=\d)/, '');
                            handleClassicQtyChange(idx, raw === '' ? 1 : Number(raw));
                          }}
                          className="w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-center text-xs font-medium text-slate-900"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="py-2.5 pl-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (items.length > 1) {
                              setItems(items.filter((_, i) => i !== idx));
                            }
                          }}
                          disabled={items.length <= 1}
                          className="rounded p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan Tambahan Transaksi */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              Catatan Tambahan Transaksi
            </label>
            <textarea
              rows={2}
              placeholder="Catatan promo, pesanan khusus..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Nama Pembeli */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Nama Pembeli (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Pak Hendra"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DISKON, PAJAK, ONGKOS KIRIM & BIAYA LAIN-LAIN */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <span>Diskon & Biaya Tambahan</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Diskon */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Diskon / Potongan Harga
            </label>
            <div className="flex gap-1.5">
              <div className="flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setDiscountType('NOMINAL')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${discountType === 'NOMINAL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  Rp
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('PERCENTAGE')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${discountType === 'PERCENTAGE' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  %
                </button>
              </div>
              <input
                type="number"
                min="0"
                placeholder={discountType === 'PERCENTAGE' ? "Contoh: 10" : "Contoh: 15000"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value.replace(/^0+(?=\d)/, ''))}
                className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>
            {discountType === 'PERCENTAGE' && discountAmount > 0 && (
              <p className="text-[10px] text-emerald-600 font-semibold">
                Setara dengan -{formatCurrency(discountAmount)}
              </p>
            )}
          </div>

          {/* Ongkos Kirim */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Ongkos Kirim (Ongkir)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 10000"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value.replace(/^0+(?=\d)/, ''))}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pajak */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Pajak (misal: PPN)
            </label>
            <div className="flex gap-1.5">
              <div className="flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setTaxType('PERCENTAGE')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${taxType === 'PERCENTAGE' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setTaxType('NOMINAL')}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${taxType === 'NOMINAL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  Rp
                </button>
              </div>
              <input
                type="number"
                min="0"
                placeholder={taxType === 'PERCENTAGE' ? "Contoh: 11" : "Contoh: 5000"}
                value={taxValue}
                onChange={(e) => setTaxValue(e.target.value.replace(/^0+(?=\d)/, ''))}
                className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>
            {taxType === 'PERCENTAGE' && taxAmount > 0 && (
              <p className="text-[10px] text-indigo-600 font-semibold">
                Setara dengan +{formatCurrency(taxAmount)}
              </p>
            )}
          </div>

          {/* Biaya Lain-lain */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Biaya Lain-lain (Kemasan, Layanan)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 2000"
                value={otherFee}
                onChange={(e) => setOtherFee(e.target.value.replace(/^0+(?=\d)/, ''))}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Breakdown Summary */}
        {subtotalRevenue > 0 && (
          <div className="mt-3 bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Produk ({totalQuantity} unit):</span>
              <span className="font-semibold">{formatCurrency(subtotalRevenue)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Diskon / Potongan Harga (-):</span>
                <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {shipFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim (+):</span>
                <span className="font-semibold">+{formatCurrency(shipFee)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Pajak (+):</span>
                <span className="font-semibold">+{formatCurrency(taxAmount)}</span>
              </div>
            )}
            {othFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Biaya Lain-lain (+):</span>
                <span className="font-semibold">+{formatCurrency(othFee)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-slate-900 text-sm">
              <span>Total Akhir Tagihan:</span>
              <span className="text-emerald-700">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* STICKY BOTTOM ACTION BAR (THUMB ZONE - 1 HAND REACH) */}
      {/* ======================================================== */}
      <div
        id="umkm-sales-sticky-thumb-bar"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur-md text-white shadow-2xl"
      >
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
          {/* Ringkasan Nilai Transaksi */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Total Transaksi ({totalQuantity} unit)
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 truncate">
              {formatCurrency(totalRevenue)}
            </div>
            {totalRevenue > 0 && (
              <div className="text-[10px] text-slate-300 truncate">
                Est. Laba: {formatCurrency(totalGrossProfit)} ({formatPercent(overallMargin)})
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || items.length === 0 || !salesChannelId}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 sm:px-8 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>
                {submitting
                  ? 'Menyimpan...'
                  : items.length === 0
                  ? 'Pilih Produk'
                  : 'Simpan Transaksi'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
