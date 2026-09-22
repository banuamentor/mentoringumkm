import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UmkmAnalyticsData } from '../../types/index.ts';
import { StatCard } from '../../components/StatCard.tsx';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters.ts';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Percent,
  PlusCircle,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  Store,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface UmkmDashboardProps {
  onNavigate: (tab: string) => void;
}

export const UmkmDashboard: React.FC<UmkmDashboardProps> = ({ onNavigate }) => {
  const { fetchWithAuth, umkm } = useAuth();
  const [data, setData] = useState<UmkmAnalyticsData | null>(null);
  const [period, setPeriod] = useState<string>('this_month');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (selectedPeriod: string) => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/analytics/umkm?filter=${selectedPeriod}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load UMKM analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Header with Title and Period Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Kinerja Bisnis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {umkm?.businessName || 'Kopi Nusantara Roastery'} • Pemilik: {umkm?.ownerName || 'Siti Rahmawati'}
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 text-xs">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: '7days', label: '7 Hari' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'last_month', label: 'Bulan Lalu' },
            { id: 'this_year', label: 'Tahun Ini' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition-colors ${
                period === item.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      {loading && !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Omzet (Revenue)"
            value={formatCurrency(data.kpi.totalRevenue)}
            icon={DollarSign}
            growth={data.kpi.growthLabel}
            isPositive={data.kpi.growthRate !== null ? data.kpi.growthRate >= 0 : true}
            subtext="vs periode sebelumnya"
            variant="accent"
          />

          <StatCard
            label="Total HPP"
            value={formatCurrency(data.kpi.totalHpp)}
            icon={Package}
            subtext="Harga Pokok Penjualan tercatat"
          />

          <StatCard
            label="Laba Kotor (Gross Profit)"
            value={formatCurrency(data.kpi.grossProfit)}
            icon={TrendingUp}
            subtext={`Margin laba kotor: ${formatPercent(data.kpi.grossProfitMargin)}`}
            variant="success"
          />

          <StatCard
            label="Total Transaksi"
            value={`${formatNumber(data.kpi.totalTransactions)} trx`}
            icon={ShoppingCart}
            subtext={`ATV: ${formatCurrency(data.kpi.averageTransactionValue)}`}
          />
        </div>
      ) : null}

      {/* Action Banner / Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/60 to-orange-50/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Catat Penjualan Hari Ini</h3>
            <p className="text-xs text-slate-600">
              Input transaksi baru dengan snapshot HPP otomatis dan kalkulasi margin seketika.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('umkm-sales-new')}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Catat Transaksi</span>
          </button>
          <button
            onClick={() => onNavigate('umkm-analytics')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Laporan Lengkap</span>
          </button>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tren Penjualan & Laba Kotor Harian</h2>
            <p className="text-xs text-slate-500">Pergerakan omzet dan laba kotor selama periode terpilih</p>
          </div>
          <span className="text-xs font-medium text-slate-400">Grafik Interaktif</span>
        </div>

        <div className="mt-4 h-72 w-full">
          {data?.trend && data.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                  labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="omzet"
                  name="Omzet (Revenue)"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOmzet)"
                />
                <Area
                  type="monotone"
                  dataKey="labaKotor"
                  name="Laba Kotor (Gross Profit)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Belum ada data transaksi pada rentang periode ini
            </div>
          )}
        </div>
      </div>

      {/* Key Highlights Grid: Top Product & Top Channel */}
      {data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Top Product Highlight */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Produk Kontributor Terbesar
              </h3>
              <button
                onClick={() => onNavigate('umkm-products')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                Lihat Semua
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {data.products.topByRevenue ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {data.products.topByRevenue.name}
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      Margin {formatPercent(data.products.topByRevenue.margin)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-400">Qty Terjual</div>
                      <div className="font-bold text-slate-800">{data.products.topByRevenue.quantity} pcs</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-400">Omzet</div>
                      <div className="font-bold text-slate-800">{formatCurrency(data.products.topByRevenue.revenue)}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-400">Laba Kotor</div>
                      <div className="font-bold text-emerald-700">{formatCurrency(data.products.topByRevenue.grossProfit)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">Belum ada transaksi produk</div>
              )}
            </div>
          </div>

          {/* Top Channel Highlight */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Channel Penjualan Terkuat
              </h3>
              <button
                onClick={() => onNavigate('umkm-analytics')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                Detail Channel
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {data.channels.topByRevenue ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      {data.channels.topByRevenue.channelName}
                    </span>
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                      {data.channels.topByRevenue.transactions} Transaksi
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-400">Total Omzet Channel</div>
                      <div className="font-bold text-slate-800">{formatCurrency(data.channels.topByRevenue.revenue)}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-400">Total Laba Kotor</div>
                      <div className="font-bold text-emerald-700">{formatCurrency(data.channels.topByRevenue.grossProfit)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">Belum ada data channel</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
