import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { MentoringSession, ActionPlan } from '../../types/index.ts';
import { formatDate } from '../../utils/formatters.ts';
import {
  CalendarCheck,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Target,
  FileText,
} from 'lucide-react';

export const UmkmMentoring: React.FC = () => {
  const { fetchWithAuth } = useAuth();

  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, planRes] = await Promise.all([
        fetchWithAuth('/api/mentoring-sessions'),
        fetchWithAuth('/api/action-plans'),
      ]);

      if (sessRes.ok) {
        const sList = await sessRes.json();
        setSessions(sList);
        if (sList.length > 0) setExpandedSessionId(sList[0].id);
      }

      if (planRes.ok) {
        const pList = await planRes.json();
        setActionPlans(pList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateActionPlanStatus = async (planId: number, newStatus: string) => {
    try {
      const res = await fetchWithAuth(`/api/action-plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string, isOverdue?: boolean) => {
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
          <AlertTriangle className="h-3 w-3" />
          Overdue (Terlewat)
        </span>
      );
    }

    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Selesai
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
            <Clock className="h-3 w-3" />
            Sedang Berjalan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
            Belum Dimulai
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Pendampingan & Action Plan Bisnis
        </h1>
        <p className="text-xs text-slate-500">
          Catatan rekomendasi sesi mentoring dan target perbaikan operasional usaha dari Mentor
        </p>
      </div>

      {/* Action Plans Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Daftar Action Plan & Target Eksekusi</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {actionPlans.filter((p) => p.status === 'COMPLETED').length} dari {actionPlans.length} selesai
          </span>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">Memuat action plans...</div>
        ) : actionPlans.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Belum ada action plan yang ditugaskan oleh Mentor.
          </div>
        ) : (
          <div className="space-y-3">
            {actionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-4 transition-all ${
                  plan.isOverdue
                    ? 'border-rose-200 bg-rose-50/20'
                    : plan.status === 'COMPLETED'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{plan.title}</span>
                      {getStatusBadge(plan.status, plan.isOverdue)}
                    </div>
                    {plan.description && (
                      <p className="text-xs text-slate-600">{plan.description}</p>
                    )}
                    {plan.target && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
                        <Target className="h-3.5 w-3.5" />
                        <span>Target: {plan.target}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={plan.status}
                      onChange={(e) => handleUpdateActionPlanStatus(plan.id, e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="NOT_STARTED">Belum Dimulai</option>
                      <option value="IN_PROGRESS">Sedang Dikerjakan</option>
                      <option value="COMPLETED">Telah Selesai</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                  <div>
                    <span className="font-semibold text-slate-700">PIC:</span> {plan.pic || 'Owner'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Deadline:</span>{' '}
                    <span className={plan.isOverdue ? 'font-bold text-rose-600' : ''}>
                      {formatDate(plan.deadline)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Mentor:</span> {plan.mentorName}
                  </div>
                </div>

                {/* Evaluations log if exists */}
                {plan.evaluations && plan.evaluations.length > 0 && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Evaluasi Mentor ({formatDate(plan.evaluations[0].evaluationDate)})
                    </div>
                    <div className="text-slate-800 font-medium">{plan.evaluations[0].evaluationNotes}</div>
                    {plan.evaluations[0].nextRecommendation && (
                      <div className="text-[11px] text-indigo-700">
                        Saran Lanjutan: {plan.evaluations[0].nextRecommendation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mentoring Sessions Log Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <CalendarCheck className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Riwayat Sesi Mentoring Bisnis</h2>
            <p className="text-xs text-slate-500">Temuan lapangan dan rekomendasi pendampingan</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Belum ada catatan sesi mentoring dari mentor.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => {
              const isExpanded = expandedSessionId === sess.id;
              return (
                <div
                  key={sess.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => setExpandedSessionId(isExpanded ? null : sess.id)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50/70 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{sess.topic}</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {formatDate(sess.sessionDate)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Mentor: {sess.mentorName} • Program: {sess.programName}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/40 p-4 space-y-3 text-xs">
                      {sess.problem && (
                        <div>
                          <div className="font-semibold text-rose-800">Masalah yang Dihadapi:</div>
                          <div className="text-slate-700 mt-0.5">{sess.problem}</div>
                        </div>
                      )}

                      {sess.findings && (
                        <div>
                          <div className="font-semibold text-amber-800">Temuan di Lapangan:</div>
                          <div className="text-slate-700 mt-0.5">{sess.findings}</div>
                        </div>
                      )}

                      <div>
                        <div className="font-semibold text-emerald-800">
                          Rekomendasi & Arahan Solusi:
                        </div>
                        <div className="rounded-lg bg-emerald-50/60 p-2.5 text-emerald-950 font-medium border border-emerald-100 mt-1">
                          {sess.recommendation}
                        </div>
                      </div>

                      {sess.additionalNotes && (
                        <div>
                          <div className="font-semibold text-slate-600">Catatan Tambahan:</div>
                          <div className="text-slate-600 mt-0.5">{sess.additionalNotes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
