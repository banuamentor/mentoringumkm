import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { MentorAssignment, MentoringSession, ActionPlan, Sale, Product } from '../../types/index.ts';
import { formatCurrency, formatDate, formatPercent } from '../../utils/formatters.ts';
import {
  ArrowLeft,
  CalendarCheck,
  ListTodo,
  Plus,
  Receipt,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  FileCheck,
  Save,
} from 'lucide-react';

interface MentorUmkmDetailProps {
  assignment: MentorAssignment;
  onBack: () => void;
}

export const MentorUmkmDetail: React.FC<MentorUmkmDetailProps> = ({ assignment, onBack }) => {
  const { fetchWithAuth } = useAuth();

  const [activeTab, setActiveTab] = useState<'sessions' | 'action_plans' | 'sales'>('sessions');

  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal: New Session
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [sessionForm, setSessionForm] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    topic: '',
    problem: '',
    findings: '',
    recommendation: '',
    additionalNotes: '',
  });

  // Modal: New Action Plan
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [planForm, setPlanForm] = useState({
    title: '',
    description: '',
    target: '',
    pic: assignment.ownerName || 'Owner',
    deadline: '',
  });

  // Modal: Evaluate Action Plan
  const [evaluatingPlan, setEvaluatingPlan] = useState<ActionPlan | null>(null);
  const [evalForm, setEvalForm] = useState({
    status: 'COMPLETED',
    evaluationNotes: '',
    result: '',
    nextRecommendation: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sessRes, planRes, salesRes, prodRes] = await Promise.all([
        fetchWithAuth(`/api/mentoring-sessions?umkmId=${assignment.umkmId}`),
        fetchWithAuth(`/api/action-plans?umkmId=${assignment.umkmId}`),
        fetchWithAuth(`/api/sales?umkmId=${assignment.umkmId}`),
        fetchWithAuth(`/api/products?umkmId=${assignment.umkmId}`),
      ]);

      if (sessRes.ok) setSessions(await sessRes.json());
      if (planRes.ok) setActionPlans(await planRes.json());
      if (salesRes.ok) setSales(await salesRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [assignment.umkmId]);

  // Create Session
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/mentoring-sessions', {
        method: 'POST',
        body: JSON.stringify({
          programId: assignment.programId,
          umkmId: assignment.umkmId,
          ...sessionForm,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menyimpan sesi');

      setIsSessionModalOpen(false);
      setSessionForm({
        sessionDate: new Date().toISOString().split('T')[0],
        topic: '',
        problem: '',
        findings: '',
        recommendation: '',
        additionalNotes: '',
      });
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Create Action Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/action-plans', {
        method: 'POST',
        body: JSON.stringify({
          programId: assignment.programId,
          umkmId: assignment.umkmId,
          ...planForm,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal membuat action plan');

      setIsPlanModalOpen(false);
      setPlanForm({
        title: '',
        description: '',
        target: '',
        pic: assignment.ownerName || 'Owner',
        deadline: '',
      });
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Evaluate Action Plan
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingPlan) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/action-plans/${evaluatingPlan.id}/evaluations`, {
        method: 'POST',
        body: JSON.stringify(evalForm),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal menyimpan evaluasi');

      setEvaluatingPlan(null);
      setEvalForm({
        status: 'COMPLETED',
        evaluationNotes: '',
        result: '',
        nextRecommendation: '',
      });
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalRevenue = sales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const totalHpp = sales.reduce((acc, s) => acc + s.totalHpp, 0);
  const totalGrossProfit = totalRevenue - totalHpp;
  const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Navigation & UMKM Identity Card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer active:scale-95"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight break-words">
                {assignment.businessName}
              </h1>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 shrink-0">
                {assignment.cityRegency || 'Kota Bandung'}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
              <span>Owner: <strong className="font-semibold text-slate-700">{assignment.ownerName}</strong></span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="truncate max-w-[240px] sm:max-w-none">Program: {assignment.programName}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsSessionModalOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="truncate">Catat Sesi</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPlanModalOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="truncate">Action Plan</span>
          </button>
        </div>
      </div>

      {/* Financial Health Quick Ribbon */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase text-slate-400">Total Omzet UMKM</div>
          <div className="text-sm sm:text-base font-bold text-slate-900 truncate" title={formatCurrency(totalRevenue)}>
            {formatCurrency(totalRevenue)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase text-slate-400">Total HPP</div>
          <div className="text-sm sm:text-base font-bold text-slate-600 truncate" title={formatCurrency(totalHpp)}>
            {formatCurrency(totalHpp)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase text-emerald-600">Laba Kotor</div>
          <div className="text-sm sm:text-base font-bold text-emerald-700 truncate" title={formatCurrency(totalGrossProfit)}>
            {formatCurrency(totalGrossProfit)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase text-slate-400">Gross Margin</div>
          <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {formatPercent(overallMargin)}
          </div>
        </div>
      </div>

      {/* Worksheet Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs font-semibold overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`pb-2.5 px-1 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'sessions'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="h-4 w-4 shrink-0" />
          <span>Sesi Mentoring ({sessions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('action_plans')}
          className={`pb-2.5 px-1 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'action_plans'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListTodo className="h-4 w-4 shrink-0" />
          <span>Action Plans ({actionPlans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`pb-2.5 px-1 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'sales'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="h-4 w-4 shrink-0" />
          <span>Data Transaksi ({sales.length})</span>
        </button>
      </div>

      {/* Tab 1: Sesi Mentoring */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              Belum ada catatan sesi mentoring untuk UMKM ini. Klik tombol{' '}
              <strong className="text-slate-700">"Catat Sesi Mentoring"</strong> di atas untuk
              memulai.
            </div>
          ) : (
            sessions.map((sess) => (
              <div key={sess.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{sess.topic}</h3>
                    <div className="text-[11px] text-slate-500">
                      Tanggal Sesi: {formatDate(sess.sessionDate)}
                    </div>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                    Sesi Tersimpan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {sess.problem && (
                    <div className="rounded-lg bg-rose-50/50 p-3 border border-rose-100">
                      <div className="font-bold text-rose-800">Problem / Kendala:</div>
                      <div className="text-slate-700 mt-1">{sess.problem}</div>
                    </div>
                  )}

                  {sess.findings && (
                    <div className="rounded-lg bg-amber-50/50 p-3 border border-amber-100">
                      <div className="font-bold text-amber-800">Temuan di Lapangan:</div>
                      <div className="text-slate-700 mt-1">{sess.findings}</div>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-emerald-50/60 p-3 border border-emerald-100 text-xs">
                  <div className="font-bold text-emerald-900">Rekomendasi Arahan Mentor:</div>
                  <div className="text-emerald-950 mt-1 font-medium">{sess.recommendation}</div>
                </div>

                {sess.additionalNotes && (
                  <div className="text-xs text-slate-500 italic">
                    Catatan: {sess.additionalNotes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Action Plans */}
      {activeTab === 'action_plans' && (
        <div className="space-y-4">
          {actionPlans.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              Belum ada action plan yang dibuat untuk UMKM ini.
            </div>
          ) : (
            actionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-5 transition-all bg-white shadow-sm space-y-3 ${
                  plan.isOverdue ? 'border-rose-200 bg-rose-50/20' : ''
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{plan.title}</h3>
                      {plan.isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </span>
                      ) : plan.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                          <Clock className="h-3 w-3" />
                          {plan.status}
                        </span>
                      )}
                    </div>
                    {plan.description && <p className="text-xs text-slate-600">{plan.description}</p>}
                    {plan.target && (
                      <p className="text-xs text-indigo-700 font-medium">Target: {plan.target}</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEvaluatingPlan(plan);
                      setEvalForm({
                        status: plan.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
                        evaluationNotes: plan.evaluations?.[0]?.evaluationNotes || '',
                        result: plan.evaluations?.[0]?.result || '',
                        nextRecommendation: plan.evaluations?.[0]?.nextRecommendation || '',
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Evaluasi Target</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                  <div>
                    <span className="font-semibold text-slate-700">PIC:</span> {plan.pic}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Deadline:</span>{' '}
                    <span className={plan.isOverdue ? 'font-bold text-rose-600' : ''}>
                      {formatDate(plan.deadline)}
                    </span>
                  </div>
                </div>

                {/* Historical Evaluations */}
                {plan.evaluations && plan.evaluations.length > 0 && (
                  <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-100 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      Evaluasi Mentor Terakhir ({formatDate(plan.evaluations[0].evaluationDate)})
                    </div>
                    <div className="font-medium text-slate-800">
                      {plan.evaluations[0].evaluationNotes}
                    </div>
                    {plan.evaluations[0].result && (
                      <div className="text-slate-600">Hasil Capaian: {plan.evaluations[0].result}</div>
                    )}
                    {plan.evaluations[0].nextRecommendation && (
                      <div className="text-indigo-700 font-medium">
                        Rekomendasi Lanjutan: {plan.evaluations[0].nextRecommendation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Data Transaksi UMKM (Read-only for Mentor) */}
      {activeTab === 'sales' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Tanggal</th>
                  <th className="py-2.5 px-4 font-semibold">Channel</th>
                  <th className="py-2.5 px-4 font-semibold">Pelanggan</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Omzet</th>
                  <th className="py-2.5 px-4 font-semibold text-right">HPP</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Laba Kotor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4">{formatDate(s.transactionDate)}</td>
                    <td className="py-2.5 px-4">{s.channelName || 'Toko'}</td>
                    <td className="py-2.5 px-4">{s.customerName || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-900">
                      {formatCurrency(s.totalRevenue)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {formatCurrency(s.totalHpp)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-700">
                      {formatCurrency(s.grossProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Mentoring Session */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Catat Sesi Mentoring Baru</h3>
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveSession} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Tanggal Pertemuan *</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.sessionDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Topik Sesi Mentoring *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Evaluasi Margin HPP Cold Brew"
                    value={sessionForm.topic}
                    onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Masalah / Tantangan UMKM</label>
                <textarea
                  rows={2}
                  placeholder="Kendala yang dikeluhkan atau dihadapi owner..."
                  value={sessionForm.problem}
                  onChange={(e) => setSessionForm({ ...sessionForm, problem: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Temuan di Lapangan (Fakta Data)</label>
                <textarea
                  rows={2}
                  placeholder="Hasil observasi data penjualan, pencatatan biaya, kemasan..."
                  value={sessionForm.findings}
                  onChange={(e) => setSessionForm({ ...sessionForm, findings: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Rekomendasi Arahan Solusi *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Langkah strategis konkret yang diarahkan oleh mentor..."
                  value={sessionForm.recommendation}
                  onChange={(e) => setSessionForm({ ...sessionForm, recommendation: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Jadwal follow-up berikutnya..."
                  value={sessionForm.additionalNotes}
                  onChange={(e) => setSessionForm({ ...sessionForm, additionalNotes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Sesi Mentoring'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Action Plan */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Buat Action Plan Baru</h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Judul Action Plan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penerapan Standard Recipe & HPP Cold Brew Baru"
                  value={planForm.title}
                  onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Deskripsi / Langkah Teknis</label>
                <textarea
                  rows={2}
                  placeholder="Rincian tahapan yang perlu dilakukan..."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Target Kuantitatif / Kualitatif</label>
                <input
                  type="text"
                  placeholder="Contoh: Mengunci margin 50% dan mencetak label harga baru"
                  value={planForm.target}
                  onChange={(e) => setPlanForm({ ...planForm, target: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">PIC / Penanggung Jawab *</label>
                  <input
                    type="text"
                    required
                    value={planForm.pic}
                    onChange={(e) => setPlanForm({ ...planForm, pic: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Batas Waktu (Deadline) *</label>
                  <input
                    type="date"
                    required
                    value={planForm.deadline}
                    onChange={(e) => setPlanForm({ ...planForm, deadline: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Terbitkan Action Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Evaluate Action Plan */}
      {evaluatingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Evaluasi Capaian Action Plan</h3>
                <p className="text-xs text-slate-500">{evaluatingPlan.title}</p>
              </div>
              <button
                onClick={() => setEvaluatingPlan(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Status Pencapaian Target *</label>
                <select
                  value={evalForm.status}
                  onChange={(e) => setEvalForm({ ...evalForm, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:outline-none"
                >
                  <option value="COMPLETED">Tercapai / Selesai (COMPLETED)</option>
                  <option value="IN_PROGRESS">Masih Berjalan (IN_PROGRESS)</option>
                  <option value="CANCELLED">Dibatalkan / Tidak Relevan (CANCELLED)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Catatan Evaluasi Mentor *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ulasan mentor terhadap proses eksekusi dan kendala di lapangan..."
                  value={evalForm.evaluationNotes}
                  onChange={(e) => setEvalForm({ ...evalForm, evaluationNotes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Hasil Capaian Nyata</label>
                <input
                  type="text"
                  placeholder="Contoh: Tercapai 100%, margin berhasil dikunci 50%"
                  value={evalForm.result}
                  onChange={(e) => setEvalForm({ ...evalForm, result: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Rekomendasi Tahap Berikutnya</label>
                <input
                  type="text"
                  placeholder="Contoh: Terapkan untuk produk varian baru..."
                  value={evalForm.nextRecommendation}
                  onChange={(e) => setEvalForm({ ...evalForm, nextRecommendation: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none"
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
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Evaluasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
