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

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('admin-programs')}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <Layers className="h-4 w-4" />
            <span>Kelola Program & Penugasan</span>
          </button>
          <button
            onClick={() => onNavigate('admin-audit')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ShieldAlert className="h-4 w-4 text-slate-500" />
            <span>Audit Log Sistem</span>
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Peringkat Omzet Bisnis UMKM</h2>
                <p className="text-xs text-slate-500">UMKM dengan kontribusi omzet tertinggi</p>
              </div>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                Data Transaksi Nyata
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-2 font-semibold">Nama UMKM</th>
                    <th className="pb-2 font-semibold">Pemilik</th>
                    <th className="pb-2 font-semibold text-center">Trx</th>
                    <th className="pb-2 font-semibold text-right">Omzet</th>
                    <th className="pb-2 font-semibold text-right">Laba Kotor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.topUmkm.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        Belum ada transaksi
                      </td>
                    </tr>
                  ) : (
                    analytics.topUmkm.map((u: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-900">{u.businessName}</td>
                        <td className="py-2.5 text-slate-600">{u.ownerName}</td>
                        <td className="py-2.5 text-center text-slate-600">{u.transactions}</td>
                        <td className="py-2.5 text-right font-semibold text-slate-900">
                          {formatCurrency(u.revenue)}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-emerald-700">
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
                  <BarChart data={analytics.sectorDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="sector"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} UMKM`, 'Jumlah']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
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
