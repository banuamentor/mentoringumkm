import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ActionPlan, MentorAssignment } from '../../types/index.ts';
import { formatDate } from '../../utils/formatters.ts';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Search,
  RefreshCw,
  Store,
  ArrowRight,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';

interface MentorActionPlansProps {
  onSelectUmkm: (assignment: MentorAssignment) => void;
}

export const MentorActionPlans: React.FC<MentorActionPlansProps> = ({ onSelectUmkm }) => {
  const { fetchWithAuth } = useAuth();

  const [plans, setPlans] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'OVERDUE' | 'COMPLETED'>('ALL');

  // Evaluation Modal
  const [evaluatingPlan, setEvaluatingPlan] = useState<any | null>(null);
  const [evalForm, setEvalForm] = useState({
    status: 'COMPLETED',
    actualResult: '',
    achievementRate: 100,
    notes: '',
  });
  const [savingEval, setSavingEval] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [planRes, assignRes] = await Promise.all([
        fetchWithAuth('/api/action-plans'),
        fetchWithAuth('/api/assignments'),
      ]);

      if (planRes.ok) setPlans(await planRes.json());
      if (assignRes.ok) setAssignments(await assignRes.json());
    } catch (err) {
      console.error('Error loading action plans:', err);
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

  const handleOpenEvalModal = (plan: any) => {
    setEvaluatingPlan(plan);
    setEvalForm({
      status: plan.status === 'COMPLETED' ? 'COMPLETED' : 'COMPLETED',
      actualResult: '',
      achievementRate: 100,
      notes: '',
    });
    setErrorMsg(null);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingPlan) return;
    setSavingEval(true);
    setErrorMsg(null);

    try {
      const res = await fetchWithAuth(`/api/action-plans/${evaluatingPlan.id}/evaluate`, {
        method: 'POST',
        body: JSON.stringify(evalForm),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menyimpan evaluasi rencana aksi');
      }

      setEvaluatingPlan(null);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSavingEval(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (statusFilter === 'OVERDUE' && !p.isOverdue) return false;
    if (statusFilter === 'IN_PROGRESS' && p.status !== 'IN_PROGRESS') return false;
    if (statusFilter === 'COMPLETED' && p.status !== 'COMPLETED') return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.businessName && p.businessName.toLowerCase().includes(q)) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.target && p.target.toLowerCase().includes(q)) ||
      (p.pic && p.pic.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Evaluasi Action Plan UMKM</h1>
          <p className="text-xs text-slate-500">
            Pantau dan evaluasi pencapaian target operasional seluruh UMKM binaan
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari target, PIC, atau nama UMKM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({plans.length})
          </button>
          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Berjalan
          </button>
          <button
            onClick={() => setStatusFilter('OVERDUE')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              statusFilter === 'OVERDUE'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            Overdue
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat target rencana aksi...</div>
      ) : filteredPlans.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          {search ? 'Tidak ada rencana aksi yang cocok dengan pencarian.' : 'Belum ada target rencana aksi.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredPlans.map((p) => {
            const isCompleted = p.status === 'COMPLETED';
            const isOverdue = p.isOverdue;

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                        <Store className="h-3.5 w-3.5" />
                        <span>{p.businessName}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{p.title}</h3>
                    </div>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Tercapai</span>
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Overdue</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800">
                        <Clock className="h-3 w-3" />
                        <span>Berjalan</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

                  <div className="space-y-1.5 rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Target Capaian:</span>
                      <span className="font-bold text-slate-900">{p.target}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Penanggung Jawab (PIC):</span>
                      <span className="text-slate-800 font-semibold">{p.pic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Batas Waktu (Deadline):</span>
                      <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                        {formatDate(p.deadline)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenUmkm(p.umkmId)}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                  >
                    <span>Detail Usaha</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleOpenEvalModal(p)}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-xs"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>Evaluasi Capaian</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evaluate Modal */}
      {evaluatingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Evaluasi Rencana Aksi</h3>
                <p className="text-xs text-slate-500">{evaluatingPlan.businessName}</p>
              </div>
              <button
                onClick={() => setEvaluatingPlan(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-900 block">{evaluatingPlan.title}</span>
              <span className="text-slate-500 block mt-0.5">Target: {evaluatingPlan.target}</span>
            </div>

            {errorMsg && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvaluation} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Ketercapaian *</label>
                <select
                  value={evalForm.status}
                  onChange={(e) => setEvalForm({ ...evalForm, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="COMPLETED">COMPLETED (Target Tercapai)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Masih Dikerjakan)</option>
                  <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hasil Nyata di Lapangan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Telah berhasil menghitung ulang HPP 10 item menu dan margin naik ke 35%"
                  value={evalForm.actualResult}
                  onChange={(e) => setEvalForm({ ...evalForm, actualResult: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Persentase Keberhasilan (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={evalForm.achievementRate}
                  onChange={(e) => setEvalForm({ ...evalForm, achievementRate: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan Mentor</label>
                <input
                  type="text"
                  placeholder="Arahan tindak lanjut untuk periode selanjutnya"
                  value={evalForm.notes}
                  onChange={(e) => setEvalForm({ ...evalForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEvaluatingPlan(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEval}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{savingEval ? 'Menyimpan...' : 'Simpan Evaluasi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
