import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UmkmAnalyticsData } from '../../types/index.ts';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters.ts';
import { exportUmkmReportPDF } from '../../utils/pdfExport.ts';
import {
  BarChart3,
  Download,
  Award,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  ShoppingBag,
  Share2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const UmkmAnalytics: React.FC = () => {
  const { fetchWithAuth, umkm } = useAuth();
  const [data, setData] = useState<UmkmAnalyticsData | null>(null);
  const [period, setPeriod] = useState<string>('this_month');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (filter: string) => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/analytics/umkm?filter=${filter}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  const handleExportPDF = () => {
    if (!data) return;
    const periodLabelMap: Record<string, string> = {
      today: 'Hari Ini',
      '7days': '7 Hari Terakhir',
      this_month: 'Bulan Ini',
      last_month: 'Bulan Lalu',
      this_year: 'Tahun Ini',
    };
    exportUmkmReportPDF(
      umkm?.businessName || 'Kopi Nusantara Roastery',
      data,
      periodLabelMap[period] || period
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Analisis Performa Produk & Saluran Penjualan
          </h1>
          <p className="text-xs text-slate-500">
            Peringkat produk profitabel dan distribusi channel penjualan berbasis data aktual
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs">
            {[
              { id: '7days', label: '7 Hari' },
              { id: 'this_month', label: 'Bulan Ini' },
              { id: 'last_month', label: 'Bulan Lalu' },
              { id: 'this_year', label: 'Tahun Ini' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  period === p.id
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportPDF}
            disabled={!data}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* 4 Key Product Rankings Cards */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Terlaris */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Produk Terlaris</span>
              <ShoppingBag className="h-4 w-4 text-amber-500" />
            </div>
            {data.products.topByQuantity ? (
              <div className="mt-3">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {data.products.topByQuantity.name}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatNumber(data.products.topByQuantity.quantity)}
                  </span>
                  <span className="text-xs text-slate-500">pcs terjual</span>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-400">Belum ada data</div>
            )}
          </div>

          {/* 2. Omzet Terbesar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Omzet Terbesar</span>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
            {data.products.topByRevenue ? (
              <div className="mt-3">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {data.products.topByRevenue.name}
                </div>
                <div className="mt-1 text-xl font-extrabold text-slate-900">
                  {formatCurrency(data.products.topByRevenue.revenue)}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-400">Belum ada data</div>
            )}
          </div>

          {/* 3. Laba Kotor Terbesar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Laba Kotor Terbesar</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            {data.products.topByGrossProfit ? (
              <div className="mt-3">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {data.products.topByGrossProfit.name}
                </div>
                <div className="mt-1 text-xl font-extrabold text-emerald-700">
                  {formatCurrency(data.products.topByGrossProfit.grossProfit)}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-400">Belum ada data</div>
            )}
          </div>

          {/* 4. Margin Tertinggi */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Margin Tertinggi</span>
              <Percent className="h-4 w-4 text-purple-500" />
            </div>
            {data.products.topByMargin ? (
              <div className="mt-3">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {data.products.topByMargin.name}
                </div>
                <div className="mt-1 text-xl font-extrabold text-purple-700">
                  {formatPercent(data.products.topByMargin.margin)}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-400">Belum ada data</div>
            )}
          </div>
        </div>
      )}

      {/* Product Contribution Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-900">Performa & Kontribusi Laba per Produk</h2>
          <p className="text-xs text-slate-500">
            Perbandingan omzet, HPP, serta persentase margin keuntungan setiap produk
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-12 text-center">#</th>
                <th className="py-2.5 px-4 font-semibold">Nama Produk</th>
                <th className="py-2.5 px-4 font-semibold text-center">Qty Terjual</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Omzet</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total HPP</th>
                <th className="py-2.5 px-4 font-semibold text-right">Laba Kotor</th>
                <th className="py-2.5 px-4 font-semibold text-center">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Memuat data produk...
                  </td>
                </tr>
              ) : !data || data.products.list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Belum ada data penjualan produk pada periode ini.
                  </td>
                </tr>
              ) : (
                data.products.list.map((prod, idx) => (
                  <tr key={prod.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{prod.name}</td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {formatNumber(prod.quantity)} pcs
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {formatCurrency(prod.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {formatCurrency(prod.hpp)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                      {formatCurrency(prod.grossProfit)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                        {formatPercent(prod.margin)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Channel Distribution Table & Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Channel Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Distribusi Saluran Penjualan</h2>
            <p className="text-xs text-slate-500">Kontribusi omzet dan profit antar channel penjualan</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="pb-2 font-semibold">Saluran</th>
                  <th className="pb-2 font-semibold text-center">Trx</th>
                  <th className="pb-2 font-semibold text-right">Omzet</th>
                  <th className="pb-2 font-semibold text-right">Laba Kotor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.channels.list.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-slate-900">{c.channelName}</td>
                    <td className="py-2.5 text-center text-slate-600">{c.transactions}</td>
                    <td className="py-2.5 text-right font-medium text-slate-900">
                      {formatCurrency(c.revenue)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-700">
                      {formatCurrency(c.grossProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channel Comparison Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Grafik Komparasi Omzet per Channel</h2>
            <p className="text-xs text-slate-500">Perbandingan volume omzet saluran penjualan</p>
          </div>

          <div className="h-64 w-full">
            {data?.channels.list && data.channels.list.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.channels.list} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="channelName"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), '']}
                    contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="revenue" name="Omzet" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="grossProfit" name="Laba Kotor" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Belum ada data channel
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
