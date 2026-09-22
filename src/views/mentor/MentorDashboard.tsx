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
} from 'lucide-react';

interface MentorDashboardProps {
  onSelectUmkm: (assignment: MentorAssignment) => void;
  onNavigate: (tab: string) => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ onSelectUmkm, onNavigate }) => {
  const { fetchWithAuth, mentor } = useAuth();

  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    umkmCount: 0,
    sessionCount: 0,
    actionPlanCount: 0,
    overdueCount: 0,
  });

  useEffect(() => {
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

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard Mentor Bisnis</h1>
        <p className="text-xs text-slate-500">
          Selamat datang, {mentor?.fullName || 'Budi Santoso, M.B.A.'} • Lembaga:{' '}
          {mentor?.institution || 'Klinik Bisnis UMKM'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="UMKM Dampingan Aktif"
          value={`${stats.umkmCount} UMKM`}
          icon={Store}
          subtext="Peserta program terdaftar"
          variant="accent"
        />

        <StatCard
          label="Total Sesi Mentoring"
          value={`${stats.sessionCount} Sesi`}
          icon={CalendarCheck}
          subtext="Riwayat pertemuan tersimpan"
        />

        <StatCard
          label="Action Plan Terbit"
          value={`${stats.actionPlanCount} Target`}
          icon={ListTodo}
          subtext="Target perbaikan operasional"
          variant="success"
        />

        <StatCard
          label="Action Plan Overdue"
          value={`${stats.overdueCount} Terlewat`}
          icon={AlertTriangle}
          subtext="Melebihi batas deadline"
          variant={stats.overdueCount > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Assigned UMKM Cards */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daftar UMKM Binaan Anda</h2>
            <p className="text-xs text-slate-500">
              Pilih UMKM untuk meninjau data penjualan, mencatat sesi mentoring, atau mengevaluasi action plan
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat penugasan UMKM...</div>
        ) : assignments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Belum ada UMKM yang ditugaskan kepada Anda oleh Administrator.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {assignments.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all bg-white"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.businessName}</h3>
                      <p className="text-xs text-slate-500">Owner: {item.ownerName}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      Aktif
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.businessSector || 'Kuliner / F&B'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.cityRegency || 'Kota Bandung'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Program: <span className="font-medium text-slate-700">{item.programName}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => onSelectUmkm(item)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <span>Buka Lembar Pendampingan UMKM</span>
                    <ArrowRight className="h-4 w-4" />
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
