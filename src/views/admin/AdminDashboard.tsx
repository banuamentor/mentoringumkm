import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatCard } from '../../components/StatCard.tsx';
import { formatCurrency, formatNumber, formatDate, formatPercent } from '../../utils/formatters.ts';
import {
  Users,
  Store,
  DollarSign,
  TrendingUp,
  Award,
  Layers,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Receipt,
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

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { fetchWithAuth } = useAuth();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth('/api/analytics/admin');
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const json = await res.json();
            setAnalytics(json);
          } else {
            console.warn('Expected JSON response from /api/analytics/admin');
          }
        } else {
          console.warn('Admin analytics response not OK:', res.status);
        }
      } catch (err) {
        console.error('Error loading admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Ekosistem Pendampingan UMKM
          </h1>
          <p className="text-xs text-slate-500">
            Monitoring menyeluruh metrik kinerja bisnis, capaian mentoring, dan agregasi omzet program
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('admin-mentoring')}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors cursor-pointer"
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Kegiatan Pendampingan & PDF</span>
          </button>
          <button
            onClick={() => onNavigate('admin-transactions')}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Receipt className="h-4 w-4" />
            <span>Transaksi & Laporan PDF</span>
          </button>
          <button
            onClick={() => onNavigate('admin-programs')}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Layers className="h-4 w-4" />
            <span>Program & Penugasan</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Grid */}
      {loading || !analytics ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Omzet Ekosistem"
            value={formatCurrency(analytics.summary.totalRevenue)}
            icon={DollarSign}
            subtext="Akumulasi omzet seluruh UMKM"
            variant="accent"
          />

          <StatCard
            label="Total Laba Kotor"
            value={formatCurrency(analytics.summary.totalGrossProfit)}
            icon={TrendingUp}
            subtext="Laba kotor agregat"
            variant="success"
          />

          <StatCard
            label="UMKM Terdaftar"
            value={`${formatNumber(analytics.summary.totalUmkm)} UMKM`}
            icon={Store}
            subtext={`${analytics.summary.totalMentors} Mentor Aktif`}
          />

          <StatCard
            label="Sesi Mentoring & Target"
            value={`${formatNumber(analytics.summary.totalSessions)} Sesi`}
            icon={CalendarCheck}
            subtext={`${analytics.summary.totalActionPlans} Action Plans`}
          />
        </div>
      )}

      {/* Program Sector & Channel Aggregates */}
      {analytics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top UMKM Performers Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Peringkat Omzet Bisnis UMKM</h2>
                <p className="text-xs text-slate-500">UMKM dengan kontribusi omzet tertinggi</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigate('admin-transactions')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  <span>Lihat Semua & Cetak PDF</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-center w-10 whitespace-nowrap">#</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Nama UMKM</th>
                    <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Pemilik</th>
                    <th className="py-2.5 px-2 font-semibold text-center whitespace-nowrap">Trx</th>
                    <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Omzet</th>
                    <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Laba Kotor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.topUmkm.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Belum ada transaksi
                      </td>
                    </tr>
                  ) : (
                    analytics.topUmkm.map((u: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-700'
                                : idx === 2
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'text-slate-400 font-medium'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          <div className="max-w-[150px] truncate" title={u.businessName}>
                            {u.businessName}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          <div className="max-w-[120px] truncate" title={u.ownerName}>
                            {u.ownerName || '-'}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600 font-medium whitespace-nowrap">
                          {u.transactions}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                          {formatCurrency(u.revenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                          {formatCurrency(u.grossProfit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sektor Usaha Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Distribusi Sektor Usaha Binaan</h2>
              <p className="text-xs text-slate-500">Sebaran kategori bidang usaha peserta program</p>
            </div>

            <div className="h-64 w-full">
              {analytics.sectorDistribution && analytics.sectorDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.sectorDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="sector"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      interval="preserveStartEnd"
                      tickLine={false}
                      dy={5}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} UMKM`, 'Jumlah']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" name="Jumlah UMKM" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  Belum ada data sektor usaha
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
