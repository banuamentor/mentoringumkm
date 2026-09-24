import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { MentoringSession, ActionPlan, Program } from '../../types/index.ts';
import { formatDate, formatPercent, formatNumber } from '../../utils/formatters.ts';
import {
  exportMentoringReportPDF,
  exportSingleMentoringSessionPDF,
} from '../../utils/pdfExport.ts';
import { StatCard } from '../../components/StatCard.tsx';
import {
  CalendarCheck,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Store,
  RotateCcw,
  X,
  FileText,
  Printer,
  ChevronDown,
  CheckCircle2,
  Building2,
  Users,
  Award,
  ListTodo,
  AlertTriangle,
  Clock,
  UserCheck,
  BookOpen,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface AssignmentItem {
  id: number;
  programId: number;
  programName: string;
  mentorId: number;
  mentorName: string;
  mentorEmail: string;
  mentorPhotoUrl?: string;
  mentorInstitution?: string;
  mentorPosition?: string;
  mentorExpertise?: string;
  umkmId: number;
  businessName: string;
  ownerName: string;
  cityRegency?: string;
  businessSector?: string;
  assignedAt: string;
  status: 'ACTIVE' | 'ENDED';
}

export const AdminMentoringActivities: React.FC = () => {
  const { fetchWithAuth, user } = useAuth();

  // Primary Data
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [umkms, setUmkms] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Tab: 'sessions' | 'actionPlans' | 'assignments'
  const [activeTab, setActiveTab] = useState<'sessions' | 'actionPlans' | 'assignments'>('sessions');

  // Filters State
  const [targetType, setTargetType] = useState<'all' | 'umkm' | 'mentor'>('all');
  const [selectedUmkmId, setSelectedUmkmId] = useState<string>('all');
  const [selectedMentorId, setSelectedMentorId] = useState<string>('all');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [selectedSession, setSelectedSession] = useState<MentoringSession | null>(null);
  const [selectedActionPlan, setSelectedActionPlan] = useState<ActionPlan | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PDF Modal Form State
  const [pdfScope, setPdfScope] = useState<'ALL' | 'SINGLE_UMKM' | 'SINGLE_MENTOR'>('ALL');
  const [pdfTargetId, setPdfTargetId] = useState<string>('');
  const [pdfProgramId, setPdfProgramId] = useState<string>('all');
  const [pdfPeriodPreset, setPdfPeriodPreset] = useState<string>('all');
  const [pdfStartDate, setPdfStartDate] = useState<string>('');
  const [pdfEndDate, setPdfEndDate] = useState<string>('');
  const [pdfSigningCity, setPdfSigningCity] = useState<string>('Banjarmasin');
  const [pdfSignerName, setPdfSignerName] = useState<string>(user?.fullName || 'Administrator Sistem UMKM');
  const [pdfSignerTitle, setPdfSignerTitle] = useState<string>('Koordinator Monitoring & Evaluasi Pendampingan');

  // Date Presets Helper
  const getDateRangeForPreset = (preset: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      return { start: todayStr, end: todayStr };
    }
    if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 6);
      return { start: past.toISOString().split('T')[0], end: todayStr };
    }
    if (preset === '30days') {
      const past = new Date();
      past.setDate(now.getDate() - 29);
      return { start: past.toISOString().split('T')[0], end: todayStr };
    }
    if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: firstDay.toISOString().split('T')[0], end: todayStr };
    }
    if (preset === 'lastMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: firstDay.toISOString().split('T')[0], end: lastDay.toISOString().split('T')[0] };
    }
    if (preset === 'thisYear') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      return { start: firstDay.toISOString().split('T')[0], end: todayStr };
    }
    return { start: '', end: '' };
  };

  const handlePeriodPresetChange = (preset: string) => {
    setPeriodPreset(preset);
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else {
      const { start, end } = getDateRangeForPreset(preset);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handlePdfPresetChange = (preset: string) => {
    setPdfPeriodPreset(preset);
    if (preset === 'all') {
      setPdfStartDate('');
      setPdfEndDate('');
    } else {
      const { start, end } = getDateRangeForPreset(preset);
      setPdfStartDate(start);
      setPdfEndDate(end);
    }
  };

  // Toast Notification Trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Auxiliary Master Data (Programs, UMKMs, Mentors)
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [progRes, umkmRes, mentorRes] = await Promise.all([
          fetchWithAuth('/api/programs'),
          fetchWithAuth('/api/admin/umkm-list'),
          fetchWithAuth('/api/admin/mentors-list'),
        ]);

        if (progRes.ok) {
          const data = await progRes.json();
          setPrograms(Array.isArray(data) ? data : []);
        }
        if (umkmRes.ok) {
          const data = await umkmRes.json();
          setUmkms(Array.isArray(data) ? data : []);
        }
        if (mentorRes.ok) {
          const data = await mentorRes.json();
          setMentors(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching master data:', err);
      }
    };

    fetchMasterData();
  }, [fetchWithAuth]);

  // Fetch Mentoring Activities Data (Sessions, Action Plans, Assignments)
  const fetchActivitiesData = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();

      if (targetType === 'umkm' && selectedUmkmId !== 'all') {
        params.append('umkmId', selectedUmkmId);
      } else if (targetType === 'mentor' && selectedMentorId !== 'all') {
        params.append('mentorId', selectedMentorId);
      }

      if (selectedProgramId !== 'all') {
        params.append('programId', selectedProgramId);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const [sessRes, plansRes, assignRes] = await Promise.all([
        fetchWithAuth(`/api/mentoring-sessions${queryString}`),
        fetchWithAuth(`/api/action-plans${queryString}`),
        fetchWithAuth(`/api/assignments${selectedProgramId !== 'all' ? `?programId=${selectedProgramId}` : ''}`),
      ]);

      if (sessRes.ok) {
        const data = await sessRes.json();
        setSessions(Array.isArray(data) ? data : []);
      }
      if (plansRes.ok) {
        const data = await plansRes.json();
        setActionPlans(Array.isArray(data) ? data : []);
      }
      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching activities data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivitiesData();
  }, [selectedProgramId, selectedUmkmId, selectedMentorId, targetType, startDate, endDate]);

  // Handle Search Debounce / Enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActivitiesData();
  };

  const handleResetFilters = () => {
    setTargetType('all');
    setSelectedUmkmId('all');
    setSelectedMentorId('all');
    setSelectedProgramId('all');
    setPeriodPreset('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setStatusFilter('all');
  };

  // Filtered action plans by status filter (if set in view tab)
  const filteredActionPlans = useMemo(() => {
    if (statusFilter === 'all') return actionPlans;
    if (statusFilter === 'OVERDUE') return actionPlans.filter((p) => p.isOverdue);
    return actionPlans.filter((p) => p.status === statusFilter);
  }, [actionPlans, statusFilter]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (targetType === 'umkm' && selectedUmkmId !== 'all' && a.umkmId !== Number(selectedUmkmId)) return false;
      if (targetType === 'mentor' && selectedMentorId !== 'all' && a.mentorId !== Number(selectedMentorId)) return false;
      if (selectedProgramId !== 'all' && a.programId !== Number(selectedProgramId)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.mentorName.toLowerCase().includes(q) ||
          a.businessName.toLowerCase().includes(q) ||
          a.programName.toLowerCase().includes(q) ||
          (a.ownerName && a.ownerName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [assignments, targetType, selectedUmkmId, selectedMentorId, selectedProgramId, search]);

  // Executive KPI Calculations
  const kpis = useMemo(() => {
    const totalSessions = sessions.length;
    const uniqueUmkmCount = new Set(sessions.map((s) => s.umkmId)).size;
    const uniqueMentorCount = new Set(sessions.map((s) => s.mentorId)).size;
    const totalPlans = actionPlans.length;
    const completedPlans = actionPlans.filter((p) => p.status === 'COMPLETED').length;
    const inProgressPlans = actionPlans.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'NOT_STARTED').length;
    const overduePlans = actionPlans.filter((p) => p.isOverdue).length;
    const completionRate = totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;
    const activePairings = assignments.filter((a) => a.status === 'ACTIVE').length;

    return {
      totalSessions,
      uniqueUmkmCount,
      uniqueMentorCount,
      totalPlans,
      completedPlans,
      inProgressPlans,
      overduePlans,
      completionRate,
      activePairings,
    };
  }, [sessions, actionPlans, assignments]);

  // Quick PDF Export (using current active filters)
  const handleQuickPdfExport = () => {
    try {
      setExportingPdf(true);
      let targetTitle = 'KONSOLIDASI SELURUH UMKM & MENTOR';
      let scope: 'ALL' | 'SINGLE_UMKM' | 'SINGLE_MENTOR' = 'ALL';
      let umkmDetails;
      let mentorDetails;

      if (targetType === 'umkm' && selectedUmkmId !== 'all') {
        scope = 'SINGLE_UMKM';
        const found = umkms.find((u) => String(u.id) === selectedUmkmId);
        targetTitle = found ? `UMKM: ${found.businessName}` : 'DAMPINGAN SATU UMKM';
        if (found) {
          umkmDetails = {
            ownerName: found.ownerName,
            businessSector: found.businessSector,
            cityRegency: found.cityRegency,
          };
        }
      } else if (targetType === 'mentor' && selectedMentorId !== 'all') {
        scope = 'SINGLE_MENTOR';
        const found = mentors.find((m) => String(m.id) === selectedMentorId);
        targetTitle = found ? `MENTOR: ${found.fullName}` : 'SATU TENAGA MENTOR';
        if (found) {
          mentorDetails = {
            fullName: found.fullName,
            institution: found.institution,
            position: found.position,
            expertise: found.expertise,
          };
        }
      }

      const activeProgram = programs.find((p) => String(p.id) === selectedProgramId);
      const programName = activeProgram ? activeProgram.name : 'Semua Program Pendampingan';

      let periodText = 'Semua Periode Tercatat';
      if (startDate && endDate) {
        periodText = `${formatDate(startDate)} s/d ${formatDate(endDate)}`;
      } else if (startDate) {
        periodText = `Mulai ${formatDate(startDate)}`;
      } else if (endDate) {
        periodText = `Sampai ${formatDate(endDate)}`;
      }

      const filename = exportMentoringReportPDF({
        scope,
        targetTitle,
        umkmDetails,
        mentorDetails,
        programName,
        periodText,
        generatedBy: user?.fullName || 'Administrator Sistem',
        signingCity: pdfSigningCity || 'Banjarmasin',
        signerName: user?.fullName || 'Administrator Banua Mentor',
        signerTitle: 'Koordinator Pendampingan UMKM Terpadu',
        sessions,
        actionPlans,
      });

      triggerToast(`Laporan PDF berhasil diunduh: ${filename}`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      triggerToast('Gagal membuat laporan PDF: ' + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  // Advanced PDF Generation from Modal
  const handleGeneratePdfFromModal = async () => {
    try {
      setExportingPdf(true);
      let targetTitle = 'KONSOLIDASI SELURUH UMKM & MENTOR';
      let umkmDetails;
      let mentorDetails;

      const params = new URLSearchParams();
      if (pdfProgramId !== 'all') params.append('programId', pdfProgramId);
      if (pdfStartDate) params.append('startDate', pdfStartDate);
      if (pdfEndDate) params.append('endDate', pdfEndDate);

      if (pdfScope === 'SINGLE_UMKM') {
        if (!pdfTargetId) {
          alert('Silakan pilih salah satu UMKM dampingan terlebih dahulu');
          setExportingPdf(false);
          return;
        }
        params.append('umkmId', pdfTargetId);
        const found = umkms.find((u) => String(u.id) === pdfTargetId);
        targetTitle = found ? `LAPORAN PENDAMPINGAN: ${found.businessName}` : 'LAPORAN SATU UMKM';
        if (found) {
          umkmDetails = {
            ownerName: found.ownerName,
            businessSector: found.businessSector,
            cityRegency: found.cityRegency,
          };
        }
      } else if (pdfScope === 'SINGLE_MENTOR') {
        if (!pdfTargetId) {
          alert('Silakan pilih salah satu tenaga Mentor terlebih dahulu');
          setExportingPdf(false);
          return;
        }
        params.append('mentorId', pdfTargetId);
        const found = mentors.find((m) => String(m.id) === pdfTargetId);
        targetTitle = found ? `LAPORAN KINERJA MENTOR: ${found.fullName}` : 'LAPORAN SATU MENTOR';
        if (found) {
          mentorDetails = {
            fullName: found.fullName,
            institution: found.institution,
            position: found.position,
            expertise: found.expertise,
          };
        }
      }

      // Fetch precise dataset matching the modal configuration
      const q = params.toString() ? `?${params.toString()}` : '';
      const [sessRes, plansRes] = await Promise.all([
        fetchWithAuth(`/api/mentoring-sessions${q}`),
        fetchWithAuth(`/api/action-plans${q}`),
      ]);

      const targetSessions: MentoringSession[] = sessRes.ok ? await sessRes.json() : [];
      const targetPlans: ActionPlan[] = plansRes.ok ? await plansRes.json() : [];

      const activeProgram = programs.find((p) => String(p.id) === pdfProgramId);
      const programName = activeProgram ? activeProgram.name : 'Semua Program Pendampingan';

      let periodText = 'Semua Periode Tercatat';
      if (pdfStartDate && pdfEndDate) {
        periodText = `${formatDate(pdfStartDate)} s/d ${formatDate(pdfEndDate)}`;
      } else if (pdfStartDate) {
        periodText = `Mulai ${formatDate(pdfStartDate)}`;
      } else if (pdfEndDate) {
        periodText = `Sampai ${formatDate(pdfEndDate)}`;
      }

      const filename = exportMentoringReportPDF({
        scope: pdfScope,
        targetTitle,
        umkmDetails,
        mentorDetails,
        programName,
        periodText,
        generatedBy: user?.fullName || 'Administrator Sistem',
        signingCity: pdfSigningCity || 'Banjarmasin',
        signerName: pdfSignerName,
        signerTitle: pdfSignerTitle,
        sessions: targetSessions,
        actionPlans: targetPlans,
      });

      setShowPdfModal(false);
      triggerToast(`Laporan PDF resmi berhasil diterbitkan: ${filename}`);
    } catch (err: any) {
      console.error('Error generating PDF from modal:', err);
      triggerToast('Gagal menerbitkan PDF: ' + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  // Export Single Session Resume PDF
  const handleExportSingleSessionPdf = (session: MentoringSession) => {
    try {
      const filename = exportSingleMentoringSessionPDF(session);
      triggerToast(`Berita Acara Sesi #${session.id} berhasil diunduh: ${filename}`);
    } catch (err: any) {
      console.error('Error exporting session BA:', err);
      triggerToast('Gagal mencetak Berita Acara sesi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-2xl transition-all">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/20">
              <CalendarCheck className="h-3.5 w-3.5" />
              Monitoring Kegiatan & Laporan PDF
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Kegiatan Pendampingan UMKM & Mentor
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl">
            Pantau seluruh sesi pendampingan, progres rencana aksi perbaikan, dan matriks penugasan mentor secara menyeluruh maupun detail. Terbitkan laporan resmi dalam format PDF berstandar cetak per program dan periode tertentu.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleQuickPdfExport}
            disabled={exportingPdf || loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            title="Unduh laporan PDF berdasarkan filter yang saat ini aktif"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Unduh PDF Cepat</span>
          </button>

          <button
            onClick={() => {
              setPdfScope(targetType === 'umkm' ? 'SINGLE_UMKM' : targetType === 'mentor' ? 'SINGLE_MENTOR' : 'ALL');
              setPdfTargetId(targetType === 'umkm' ? selectedUmkmId : targetType === 'mentor' ? selectedMentorId : '');
              setPdfProgramId(selectedProgramId);
              setPdfPeriodPreset(periodPreset);
              setPdfStartDate(startDate);
              setPdfEndDate(endDate);
              setShowPdfModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Buat Laporan PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Sesi Pendampingan"
          value={`${formatNumber(kpis.totalSessions)} Sesi`}
          icon={CalendarCheck}
          subtext="Sesi konsultasi & mentoring terlaksana"
          variant="accent"
        />
        <StatCard
          label="UMKM Didampingi"
          value={`${formatNumber(kpis.uniqueUmkmCount)} Usaha`}
          icon={Store}
          subtext={`${formatNumber(kpis.uniqueMentorCount)} mentor aktif membimbing`}
        />
        <StatCard
          label="Target Rencana Aksi"
          value={`${formatNumber(kpis.totalPlans)} Target`}
          icon={ListTodo}
          subtext={`${formatNumber(kpis.completedPlans)} selesai (${formatPercent(kpis.completionRate)})`}
          variant="warning"
        />
        <StatCard
          label="Ketercapaian Target"
          value={formatPercent(kpis.completionRate)}
          icon={Award}
          subtext={kpis.overduePlans > 0 ? `${kpis.overduePlans} target terlambat` : 'Semua rencana aksi tepat waktu'}
          variant="success"
        />
      </div>

      {/* Filter and Control Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Filter className="h-4 w-4 text-teal-600" />
            <span>Filter Sasaran, Program & Periode Pendampingan</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Target Type & Specific Select */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Cakupan Sasaran</label>
            <select
              value={targetType}
              onChange={(e) => {
                const val = e.target.value as 'all' | 'umkm' | 'mentor';
                setTargetType(val);
                if (val === 'all') {
                  setSelectedUmkmId('all');
                  setSelectedMentorId('all');
                }
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Semua UMKM & Mentor (Keseluruhan)</option>
              <option value="umkm">Per Satu UMKM Dampingan</option>
              <option value="mentor">Per Satu Mentor Pendamping</option>
            </select>
          </div>

          {/* Conditional Dropdown for UMKM or Mentor */}
          {targetType === 'umkm' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Pilih UMKM Dampingan</label>
              <select
                value={selectedUmkmId}
                onChange={(e) => setSelectedUmkmId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="all">-- Semua UMKM --</option>
                {umkms.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.businessName} {u.ownerName ? `(${u.ownerName})` : ''} - {u.cityRegency || 'Kota'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'mentor' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Pilih Tenaga Mentor</label>
              <select
                value={selectedMentorId}
                onChange={(e) => setSelectedMentorId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="all">-- Semua Mentor --</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} {m.institution ? `(${m.institution})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Program Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Pilihan Program</label>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Semua Program Pendampingan</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Preset */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Pilihan Periode Waktu</label>
            <select
              value={periodPreset}
              onChange={(e) => handlePeriodPresetChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">Semua Periode Tercatat</option>
              <option value="today">Hari Ini</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="thisMonth">Bulan Ini</option>
              <option value="lastMonth">Bulan Lalu</option>
              <option value="thisYear">Tahun Ini</option>
              <option value="custom">Rentang Tanggal Kustom</option>
            </select>
          </div>

          {/* Date Picker (Start - End) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Rentang Tanggal</label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="relative pt-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata kunci topik sesi, nama usaha UMKM, nama mentor, kendala, atau rekomendasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-24 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-2 rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cari
          </button>
        </form>
      </div>

      {/* View Tabs Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Sesi Pendampingan</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'sessions' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('actionPlans')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'actionPlans'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Target Rencana Aksi</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'actionPlans' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {actionPlans.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Penugasan Mentor-UMKM</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'assignments' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {filteredAssignments.length}
            </span>
          </button>
        </div>

        {/* Sub-filter if on Action Plans tab */}
        {activeTab === 'actionPlans' && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium mr-1">Status:</span>
            {['all', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all'
                  ? 'Semua'
                  : st === 'NOT_STARTED'
                  ? 'Belum Mulai'
                  : st === 'IN_PROGRESS'
                  ? 'Sedang Berjalan'
                  : st === 'COMPLETED'
                  ? 'Selesai'
                  : 'Terlambat'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area based on Tab */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
          <p className="mt-3 text-xs font-medium text-slate-500">Memuat data kegiatan pendampingan UMKM & mentor...</p>
        </div>
      ) : activeTab === 'sessions' ? (
        /* TAB 1: MENTORING SESSIONS TABLE */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">#</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Tanggal Sesi</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Program</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Mentor Pendamping</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">UMKM Dampingan</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Topik & Pokok Masalah</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Rekomendasi Utama</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Aksi & Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <CalendarCheck className="mx-auto h-9 w-9 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada data sesi pendampingan ditemukan</p>
                      <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan filter sasaran, program, atau periode tanggal Anda</p>
                    </td>
                  </tr>
                ) : (
                  sessions.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3 text-center font-mono text-slate-400 text-[11px] whitespace-nowrap">{idx + 1}</td>
                      <td className="px-3.5 py-3 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-teal-600" />
                          <span>{formatDate(s.sessionDate)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">ID #{s.id}</span>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-800">
                          {s.programName || '-'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{s.mentorName || '-'}</div>
                        <div className="text-[11px] text-slate-500">{s.mentorInstitution || 'Tenaga Mentor'}</div>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="font-semibold text-teal-800">{s.businessName || '-'}</div>
                        <div className="text-[11px] text-slate-500">
                          {s.ownerName ? `Pemilik: ${s.ownerName}` : ''} {s.cityRegency ? `(${s.cityRegency})` : ''}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 max-w-xs">
                        <div className="font-medium text-slate-900 line-clamp-1">{s.topic}</div>
                        {s.problem && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            <span className="text-amber-700 font-semibold">Kendala:</span> {s.problem}
                          </div>
                        )}
                      </td>
                      <td className="px-3.5 py-3 max-w-xs">
                        <div className="text-[11px] text-slate-600 line-clamp-2">{s.recommendation}</div>
                      </td>
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSession(s)}
                            className="flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
                            title="Lihat Detail Lengkap Sesi"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => handleExportSingleSessionPdf(s)}
                            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Unduh Berita Acara Sesi PDF"
                          >
                            <Printer className="h-3.5 w-3.5 text-slate-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'actionPlans' ? (
        /* TAB 2: ACTION PLANS TABLE */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">#</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Rencana Aksi & Target</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">UMKM Dampingan</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Mentor Pembimbing</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Program</th>
                  <th className="px-3.5 py-3 whitespace-nowrap">Batas Waktu (Deadline)</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Status</th>
                  <th className="px-3.5 py-3 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredActionPlans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <ListTodo className="mx-auto h-9 w-9 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada target rencana aksi pada kriteria ini</p>
                    </td>
                  </tr>
                ) : (
                  filteredActionPlans.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="px-3.5 py-3 max-w-sm">
                        <div className="font-semibold text-slate-900">{p.title}</div>
                        {p.target && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            <span className="font-medium text-slate-700">Target:</span> {p.target}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">PIC: {p.pic || 'Pelaku UMKM'}</div>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-medium text-slate-900">{p.businessName || '-'}</div>
                        <div className="text-[11px] text-slate-500">{p.ownerName || '-'}</div>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-medium text-slate-900">{p.mentorName || '-'}</div>
                        <div className="text-[11px] text-slate-500">{p.mentorInstitution || 'Mentor'}</div>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {p.programName || '-'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className={`font-medium ${p.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                          {formatDate(p.deadline)}
                        </div>
                        {p.isOverdue && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-600">
                            <AlertTriangle className="h-3 w-3" /> Melewati batas
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        {p.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            <CheckCircle2 className="h-3 w-3" /> Selesai
                          </span>
                        ) : p.status === 'IN_PROGRESS' ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              p.isOverdue
                                ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
                                : 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                            }`}
                          >
                            <Clock className="h-3 w-3" /> {p.isOverdue ? 'Terlambat' : 'Sedang Berjalan'}
                          </span>
                        ) : p.status === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                            Dibatalkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-600/20">
                            Belum Mulai
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedActionPlan(p)}
                          className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 3: ASSIGNMENTS MATRIX TABLE */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3.5 py-3 text-center">#</th>
                  <th className="px-3.5 py-3">Mentor Pendamping</th>
                  <th className="px-3.5 py-3">UMKM Dampingan</th>
                  <th className="px-3.5 py-3">Program Pendampingan</th>
                  <th className="px-3.5 py-3">Mulai Ditugaskan</th>
                  <th className="px-3.5 py-3 text-center">Status</th>
                  <th className="px-3.5 py-3 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="mx-auto h-9 w-9 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada penugasan mentor-UMKM aktif ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-slate-900">{a.mentorName}</div>
                        <div className="text-[11px] text-slate-500">{a.mentorInstitution || 'Tenaga Ahli'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{a.mentorEmail}</div>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-teal-800">{a.businessName}</div>
                        <div className="text-[11px] text-slate-500">
                          {a.ownerName ? `Pemilik: ${a.ownerName}` : ''} {a.cityRegency ? `(${a.cityRegency})` : ''}
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-800">
                          {a.programName}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap text-slate-600">
                        {formatDate(a.assignedAt)}
                      </td>
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Aktif Damping
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setTargetType('umkm');
                            setSelectedUmkmId(String(a.umkmId));
                            setActiveTab('sessions');
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50/50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
                        >
                          <span>Lihat Sesi</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: DETAIL SESI PENDAMPINGAN */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 my-8">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                    Sesi Pendampingan ID #{selectedSession.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    Tanggal: {formatDate(selectedSession.sessionDate)}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {selectedSession.topic}
                </h2>
                <p className="text-xs text-slate-500">
                  Program: {selectedSession.programName || '-'}
                </p>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profiles of Mentor and UMKM */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Mentor Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <UserCheck className="h-4 w-4 text-teal-600" />
                  <span>Tenaga Mentor Pendamping</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{selectedSession.mentorName || '-'}</div>
                <div className="text-xs text-slate-600">{selectedSession.mentorInstitution || 'Instansi / Lembaga'}</div>
                {selectedSession.mentorPosition && (
                  <div className="text-[11px] text-slate-500">Jabatan: {selectedSession.mentorPosition}</div>
                )}
                {selectedSession.mentorEmail && (
                  <div className="text-[11px] text-slate-500 font-mono">Email: {selectedSession.mentorEmail}</div>
                )}
                {selectedSession.mentorWhatsapp && (
                  <div className="text-[11px] text-slate-500">WA: {selectedSession.mentorWhatsapp}</div>
                )}
              </div>

              {/* UMKM Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Store className="h-4 w-4 text-indigo-600" />
                  <span>Pelaku Usaha UMKM Dampingan</span>
                </div>
                <div className="text-sm font-bold text-teal-900">{selectedSession.businessName || '-'}</div>
                <div className="text-xs text-slate-600">
                  Pemilik: {selectedSession.ownerName || '-'}
                </div>
                {selectedSession.businessSector && (
                  <div className="text-[11px] text-slate-500">Sektor: {selectedSession.businessSector}</div>
                )}
                {selectedSession.cityRegency && (
                  <div className="text-[11px] text-slate-500">Domisili: {selectedSession.cityRegency}</div>
                )}
                {selectedSession.address && (
                  <div className="text-[11px] text-slate-500 line-clamp-1">Alamat: {selectedSession.address}</div>
                )}
              </div>
            </div>

            {/* Detailed Content Findings & Recommendations */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Notulensi & Hasil Konsultasi Sesi
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block mb-0.5">Topik Bahasan Sesi:</span>
                  <p className="rounded-lg bg-slate-50 p-2.5 text-slate-700 border border-slate-100">
                    {selectedSession.topic}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-900 block mb-0.5">Kendala / Masalah yang Dihadapi UMKM:</span>
                  <p className="rounded-lg bg-amber-50/50 p-2.5 text-slate-700 border border-amber-200/50">
                    {selectedSession.problem || 'Tidak ada catatan masalah khusus'}
                  </p>
                </div>

                {selectedSession.findings && (
                  <div>
                    <span className="font-semibold text-slate-900 block mb-0.5">Temuan Lapangan / Diagnosa:</span>
                    <p className="rounded-lg bg-slate-50 p-2.5 text-slate-700 border border-slate-100">
                      {selectedSession.findings}
                    </p>
                  </div>
                )}

                <div>
                  <span className="font-semibold text-slate-900 block mb-0.5">Rekomendasi & Arahan Solutif Mentor:</span>
                  <p className="rounded-lg bg-emerald-50/50 p-2.5 text-slate-800 border border-emerald-200/50 font-medium">
                    {selectedSession.recommendation}
                  </p>
                </div>

                {selectedSession.additionalNotes && (
                  <div>
                    <span className="font-semibold text-slate-900 block mb-0.5">Catatan Tambahan / Kesepakatan:</span>
                    <p className="rounded-lg bg-slate-50 p-2.5 text-slate-600 border border-slate-100">
                      {selectedSession.additionalNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => handleExportSingleSessionPdf(selectedSession)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Berita Acara Sesi (PDF)</span>
              </button>

              <button
                onClick={() => setSelectedSession(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL ACTION PLAN */}
      {selectedActionPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                  Target Rencana Aksi #{selectedActionPlan.id}
                </span>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedActionPlan.title}</h2>
              </div>
              <button
                onClick={() => setSelectedActionPlan(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px]">UMKM Dampingan:</span>
                  <span className="font-semibold text-slate-900">{selectedActionPlan.businessName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Mentor Pembimbing:</span>
                  <span className="font-semibold text-slate-900">{selectedActionPlan.mentorName || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Batas Waktu (Deadline):</span>
                  <span className={`font-semibold ${selectedActionPlan.isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                    {formatDate(selectedActionPlan.deadline)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status Saat Ini:</span>
                  <span className="font-bold text-slate-900">
                    {selectedActionPlan.status === 'COMPLETED'
                      ? 'Selesai'
                      : selectedActionPlan.status === 'IN_PROGRESS'
                      ? selectedActionPlan.isOverdue
                        ? 'Terlambat'
                        : 'Sedang Berjalan'
                      : 'Belum Mulai'}
                  </span>
                </div>
              </div>

              {selectedActionPlan.description && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Deskripsi Tindak Lanjut:</span>
                  <p className="rounded-lg bg-slate-50 p-2.5 text-slate-700 border border-slate-100">
                    {selectedActionPlan.description}
                  </p>
                </div>
              )}

              {selectedActionPlan.target && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-0.5">Target Kuantitatif / Capaian:</span>
                  <p className="rounded-lg bg-slate-50 p-2.5 text-slate-700 border border-slate-100">
                    {selectedActionPlan.target}
                  </p>
                </div>
              )}

              {/* History of Mentor Evaluations */}
              {selectedActionPlan.evaluations && selectedActionPlan.evaluations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                    Riwayat Evaluasi dari Mentor:
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedActionPlan.evaluations.map((ev, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs bg-slate-50/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-teal-700">{formatDate(ev.evaluationDate)}</span>
                          <span className="font-mono text-[10px] text-slate-500">Status: {ev.status}</span>
                        </div>
                        <p className="text-slate-700">{ev.evaluationNotes}</p>
                        {ev.nextRecommendation && (
                          <p className="text-emerald-700 text-[11px] mt-1 font-medium">
                            Arahan Berikutnya: {ev.nextRecommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedActionPlan(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: GENERATOR LAPORAN PENDAMPINGAN PDF RESMI */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700">
                  <Printer className="h-4 w-4" />
                  <span>Generator Dokumen Resmi</span>
                </div>
                <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                  Buat Laporan Pendampingan UMKM (PDF)
                </h2>
                <p className="text-xs text-slate-500">
                  Konfigurasikan sasaran, program, rentang periode, dan data pengesahan pejabat untuk dokumen PDF.
                </p>
              </div>

              <button
                onClick={() => setShowPdfModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 block">1. Pilih Sasaran Pelaporan:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPdfScope('ALL');
                    setPdfTargetId('');
                  }}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    pdfScope === 'ALL'
                      ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600 text-teal-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">Konsolidasi Seluruhnya</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Semua UMKM & Mentor</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPdfScope('SINGLE_UMKM');
                    if (umkms.length > 0 && !pdfTargetId) setPdfTargetId(String(umkms[0].id));
                  }}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    pdfScope === 'SINGLE_UMKM'
                      ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600 text-teal-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">Satu UMKM Spesifik</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Laporan untuk 1 UMKM</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPdfScope('SINGLE_MENTOR');
                    if (mentors.length > 0 && !pdfTargetId) setPdfTargetId(String(mentors[0].id));
                  }}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    pdfScope === 'SINGLE_MENTOR'
                      ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600 text-teal-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">Satu Mentor Spesifik</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Kinerja 1 Tenaga Mentor</div>
                </button>
              </div>

              {/* Dropdown if specific scope selected */}
              {pdfScope === 'SINGLE_UMKM' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Pilih UMKM yang Akan Dilaporkan</label>
                  <select
                    value={pdfTargetId}
                    onChange={(e) => setPdfTargetId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:outline-none"
                  >
                    {umkms.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.businessName} {u.ownerName ? `(${u.ownerName})` : ''} - {u.cityRegency || 'Kota'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {pdfScope === 'SINGLE_MENTOR' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Pilih Tenaga Mentor yang Akan Dilaporkan</label>
                  <select
                    value={pdfTargetId}
                    onChange={(e) => setPdfTargetId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:outline-none"
                  >
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} {m.institution ? `(${m.institution})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Program Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">2. Pilihan Program Pendampingan:</label>
              <select
                value={pdfProgramId}
                onChange={(e) => setPdfProgramId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="all">Semua Program Pendampingan</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">3. Pilihan Periode Laporan:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={pdfPeriodPreset}
                  onChange={(e) => handlePdfPresetChange(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-teal-500 focus:outline-none"
                >
                  <option value="all">Semua Periode Tercatat</option>
                  <option value="thisMonth">Bulan Ini</option>
                  <option value="lastMonth">Bulan Lalu</option>
                  <option value="30days">30 Hari Terakhir</option>
                  <option value="thisYear">Tahun Ini</option>
                  <option value="custom">Rentang Tanggal Kustom</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={pdfStartDate}
                    onChange={(e) => {
                      setPdfStartDate(e.target.value);
                      setPdfPeriodPreset('custom');
                    }}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
                  />
                  <span className="text-slate-400 text-xs">-</span>
                  <input
                    type="date"
                    value={pdfEndDate}
                    onChange={(e) => {
                      setPdfEndDate(e.target.value);
                      setPdfPeriodPreset('custom');
                    }}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Official Signer Configuration */}
            <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <label className="text-xs font-bold text-slate-800 block">4. Data Pengesahan Dokumen (Tanda Tangan & Lokasi):</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-500 block font-semibold">Tempat Pengesahan (Kota/Kab):</label>
                  <input
                    type="text"
                    value={pdfSigningCity}
                    onChange={(e) => setPdfSigningCity(e.target.value)}
                    placeholder="Contoh: Banjarmasin"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block font-semibold">Nama Pejabat Penandatangan:</label>
                  <input
                    type="text"
                    value={pdfSignerName}
                    onChange={(e) => setPdfSignerName(e.target.value)}
                    placeholder="Nama Lengkap Pejabat"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block font-semibold">Jabatan / Posisi Pejabat:</label>
                  <input
                    type="text"
                    value={pdfSignerTitle}
                    onChange={(e) => setPdfSignerTitle(e.target.value)}
                    placeholder="Jabatan Resmi"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={exportingPdf}
                onClick={handleGeneratePdfFromModal}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>{exportingPdf ? 'Menerbitkan PDF...' : 'Generate & Unduh Laporan PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
