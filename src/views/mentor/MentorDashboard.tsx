import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { MentorAssignment } from '../../types/index.ts';
import { StatCard } from '../../components/StatCard.tsx';
import {
  Users,
  CalendarCheck,
  ListTodo,
  AlertTriangle,
  ArrowRight,
  Store,
  MapPin,
  Tag,
  Search,
  UserCheck,
  Award,
  Sparkles,
  ChevronRight,
  Building2,
  RefreshCw,
} from 'lucide-react';

interface MentorDashboardProps {
  onSelectUmkm: (assignment: MentorAssignment) => void;
  onNavigate: (tab: string) => void;
  showOnlyUmkms?: boolean;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ onSelectUmkm, onNavigate, showOnlyUmkms = false }) => {
  const { fetchWithAuth, mentor, user } = useAuth();

  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');

  const [stats, setStats] = useState({
    umkmCount: 0,
    sessionCount: 0,
    actionPlanCount: 0,
    overdueCount: 0,
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [assignRes, sessRes, planRes] = await Promise.all([
        fetchWithAuth('/api/assignments'),
        fetchWithAuth('/api/mentoring-sessions'),
        fetchWithAuth('/api/action-plans'),
      ]);

      let assignList: MentorAssignment[] = [];
      if (assignRes.ok) {
        assignList = await assignRes.json();
        setAssignments(assignList);
      }

      let sessionTotal = 0;
      if (sessRes.ok) {
        const sessions = await sessRes.json();
        sessionTotal = sessions.length;
      }

      let planTotal = 0;
      let overdueTotal = 0;
      if (planRes.ok) {
        const plans = await planRes.json();
        planTotal = plans.length;
        overdueTotal = plans.filter((p: any) => p.isOverdue).length;
      }

      setStats({
        umkmCount: assignList.length,
        sessionCount: sessionTotal,
        actionPlanCount: planTotal,
        overdueCount: overdueTotal,
      });
    } catch (err) {
      console.error('Error loading mentor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Filter assignments
  const filteredAssignments = assignments.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cityRegency?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.businessSector?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.programName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSector =
      sectorFilter === 'ALL' || item.businessSector === sectorFilter;

    return matchesSearch && matchesSector;
  });

  // Extract unique sectors
  const availableSectors = Array.from(
    new Set(assignments.map((a) => a.businessSector).filter(Boolean))
  ) as string[];

  const mentorName = mentor?.fullName || user?.fullName || 'Mentor Profesional';
  const mentorInstitution = mentor?.institution || 'Klinik Bisnis UMKM';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mentor Identity Banner */}
      {!showOnlyUmkms && (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-6 text-white shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 shadow-inner">
                <UserCheck className="h-6 w-6 stroke-[2.25]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-xl font-bold tracking-tight text-white break-words">
                    {mentorName}
                  </h1>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 shrink-0">
                    Mentor Terverifikasi
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate max-w-[240px] sm:max-w-none">{mentorInstitution}</span>
                  </span>
                  <span className="hidden sm:inline text-slate-500">•</span>
                  <span className="text-slate-400 text-[11px] sm:text-xs">
                    {stats.umkmCount} UMKM dalam dampingan aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Mobile Action Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t border-slate-800/80 sm:border-t-0">
              <button
                type="button"
                onClick={() => onNavigate('mentor-sessions')}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-semibold text-white transition-all border border-white/10 cursor-pointer active:scale-95"
              >
                <CalendarCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="whitespace-nowrap">Riwayat Sesi</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('mentor-action-plans')}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <ListTodo className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Evaluasi Target</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header if showOnlyUmkms */}
      {showOnlyUmkms && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Daftar UMKM Dampingan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih salah satu UMKM untuk mengakses lembar pendampingan, rekam penjualan, dan catatan sesi.
            </p>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all active:scale-95"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      )}

      {/* KPI Cards (Clean 2x2 grid on mobile, 4 columns on desktop) */}
      {!showOnlyUmkms && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="UMKM Aktif"
            value={`${stats.umkmCount} UMKM`}
            icon={Store}
            subtext="Peserta program"
            variant="accent"
          />

          <StatCard
            label="Sesi Mentoring"
            value={`${stats.sessionCount} Sesi`}
            icon={CalendarCheck}
            subtext="Tercatat di sistem"
          />

          <StatCard
            label="Target Aksi"
            value={`${stats.actionPlanCount} Target`}
            icon={ListTodo}
            subtext="Rencana perbaikan"
            variant="success"
          />

          <StatCard
            label="Target Overdue"
            value={`${stats.overdueCount} Terlewat`}
            icon={AlertTriangle}
            subtext="Melebihi deadline"
            variant={stats.overdueCount > 0 ? 'warning' : 'default'}
          />
        </div>
      )}

      {/* Assigned UMKM Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Title & Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Daftar UMKM Binaan Anda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih UMKM untuk meninjau data penjualan, mencatat sesi mentoring, atau evaluasi action plan.
            </p>
          </div>

          <span className="self-start sm:self-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
            {filteredAssignments.length} dari {assignments.length} UMKM
          </span>
        </div>

        {/* Search & Sector Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama UMKM, pemilik, kota, atau program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
            />
          </div>

          {availableSectors.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button
                type="button"
                onClick={() => setSectorFilter('ALL')}
                className={`rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap transition-colors ${
                  sectorFilter === 'ALL'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Sektor
              </button>
              {availableSectors.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => setSectorFilter(sector)}
                  className={`rounded-lg px-2.5 py-1.5 font-medium whitespace-nowrap transition-colors ${
                    sectorFilter === sector
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
            <span>Memuat data penugasan UMKM...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl p-6">
            <Store className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Belum Ada UMKM Ditugaskan</p>
            <p className="text-slate-500 mt-1">
              Administrator belum menugaskan peserta UMKM kepada akun mentor Anda.
            </p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl p-6">
            Tidak ada UMKM yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2">
            {filteredAssignments.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-indigo-300 hover:shadow-md transition-all shadow-xs"
              >
                <div className="space-y-3">
                  {/* Card Header: Business Name & Status */}
                  <div className="flex items-start justify-between gap-2.5 min-w-0">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
                          {item.businessName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          Owner: <span className="font-medium text-slate-700">{item.ownerName || '-'}</span>
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      Aktif
                    </span>
                  </div>

                  {/* Metadata Chips - Stackable and responsive without overlapping */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 pt-1">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                      <Tag className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {item.businessSector || 'Kuliner / F&B'}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {item.cityRegency || 'Kota Bandung'}
                      </span>
                    </span>

                    {item.programName && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50/70 border border-indigo-100/60 px-2.5 py-1 text-[11px] font-medium text-indigo-700 max-w-full">
                        <Award className="h-3 w-3 text-indigo-500 shrink-0" />
                        <span className="truncate">{item.programName}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectUmkm(item)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 sm:py-3 px-4 text-xs font-bold text-white hover:bg-indigo-600 active:scale-98 transition-all shadow-2xs cursor-pointer"
                  >
                    <span>Buka Lembar Pendampingan</span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
