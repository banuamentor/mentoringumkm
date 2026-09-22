import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { MentoringSession, MentorAssignment } from '../../types/index.ts';
import { formatDate } from '../../utils/formatters.ts';
import {
  CalendarCheck,
  Search,
  RefreshCw,
  Store,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface MentorSessionsProps {
  onSelectUmkm: (assignment: MentorAssignment) => void;
}

export const MentorSessions: React.FC<MentorSessionsProps> = ({ onSelectUmkm }) => {
  const { fetchWithAuth } = useAuth();

  const [sessions, setSessions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, assignRes] = await Promise.all([
        fetchWithAuth('/api/mentoring-sessions'),
        fetchWithAuth('/api/assignments'),
      ]);

      if (sessRes.ok) setSessions(await sessRes.json());
      if (assignRes.ok) setAssignments(await assignRes.json());
    } catch (err) {
      console.error('Error loading mentor sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenUmkm = (umkmId: number) => {
    const found = assignments.find((a) => a.umkmId === umkmId);
    if (found) {
      onSelectUmkm(found);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.businessName && s.businessName.toLowerCase().includes(q)) ||
      (s.topic && s.topic.toLowerCase().includes(q)) ||
      (s.problem && s.problem.toLowerCase().includes(q)) ||
      (s.recommendation && s.recommendation.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Sesi Mentoring</h1>
          <p className="text-xs text-slate-500">
            Rekam jejak seluruh pertemuan pendampingan dan arahan rekomendasi untuk UMKM binaan
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari topik, masalah, atau nama UMKM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>
        <div className="text-xs font-medium text-slate-500">
          Total: <span className="font-bold text-slate-900">{filteredSessions.length}</span> Sesi Pertemuan
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat riwayat sesi mentoring...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          {search ? 'Tidak ada sesi yang sesuai dengan kata kunci pencarian.' : 'Belum ada sesi mentoring yang tercatat.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredSessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                      <Store className="h-3.5 w-3.5" />
                      <span>{s.businessName}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{s.topic}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(s.sessionDate)}</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {s.problem && (
                    <div className="rounded-lg bg-rose-50/60 p-2.5 border border-rose-100/80">
                      <span className="font-semibold text-rose-900 block mb-0.5">Permasalahan Kunci:</span>
                      <p className="text-rose-800 line-clamp-2">{s.problem}</p>
                    </div>
                  )}

                  {s.findings && (
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <span className="font-semibold text-slate-800 block mb-0.5">Temuan Lapangan:</span>
                      <p className="text-slate-600 line-clamp-2">{s.findings}</p>
                    </div>
                  )}

                  <div className="rounded-lg bg-emerald-50/60 p-2.5 border border-emerald-100/80">
                    <span className="font-semibold text-emerald-900 block mb-0.5">Rekomendasi & Solusi:</span>
                    <p className="text-emerald-800 line-clamp-3">{s.recommendation}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Program: {s.programName || 'Akselerasi UMKM'}
                </span>
                <button
                  onClick={() => handleOpenUmkm(s.umkmId)}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  <span>Buka Lembar UMKM</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
