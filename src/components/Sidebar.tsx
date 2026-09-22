import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Package,
  BarChart3,
  ListTodo,
  Store,
  Users,
  CalendarCheck,
  Award,
  UserCog,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Shield,
  Building,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen, onClose }) => {
  const { role, umkm, mentor, user } = useAuth();

  const getMenuItems = () => {
    if (role === 'UMKM') {
      return [
        { id: 'umkm-dashboard', label: 'Dashboard Bisnis', icon: LayoutDashboard },
        { id: 'umkm-sales-new', label: 'Catat Penjualan', icon: PlusCircle, badge: 'Cepat' },
        { id: 'umkm-sales-list', label: 'Riwayat Transaksi', icon: Receipt, badge: 'PDF' },
        { id: 'umkm-products', label: 'Katalog Produk & HPP', icon: Package },
        { id: 'umkm-analytics', label: 'Analisis Kinerja', icon: BarChart3 },
        { id: 'umkm-mentoring', label: 'Sesi & Rencana Aksi', icon: ListTodo },
        { id: 'umkm-profile', label: 'Profil Usaha', icon: Store },
      ];
    } else if (role === 'MENTOR') {
      return [
        { id: 'mentor-dashboard', label: 'Dashboard Mentor', icon: LayoutDashboard },
        { id: 'mentor-umkms', label: 'UMKM Dampingan', icon: Store },
        { id: 'mentor-sessions', label: 'Sesi Pendampingan', icon: CalendarCheck },
        { id: 'mentor-action-plans', label: 'Evaluasi Target Aksi', icon: ListTodo },
        { id: 'mentor-profile', label: 'Profil Mentor', icon: UserCog },
      ];
    } else {
      // ADMIN
      return [
        { id: 'admin-dashboard', label: 'Dashboard Eksekutif', icon: LayoutDashboard },
        { id: 'admin-mentoring', label: 'Aktivitas Pendampingan', icon: CalendarCheck, badge: 'PDF' },
        { id: 'admin-transactions', label: 'Laporan Transaksi', icon: Receipt, badge: 'PDF' },
        { id: 'admin-programs', label: 'Program & Penugasan', icon: Award },
        { id: 'admin-mentors', label: 'Kelola Akun (UMKM & Mentor)', icon: Users },
        { id: 'admin-audit', label: 'Audit Log Sistem', icon: ShieldCheck },
      ];
    }
  };

  const menuItems = getMenuItems();

  const getRoleBadgeStyle = () => {
    switch (role) {
      case 'ADMIN':
        return {
          title: 'Administrator',
          badge: 'GCP Admin',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          dotColor: 'bg-purple-500',
        };
      case 'MENTOR':
        return {
          title: 'Mentor Bisnis',
          badge: 'Verified Mentor',
          badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
          dotColor: 'bg-sky-500',
        };
      default:
        return {
          title: 'Pelaku UMKM',
          badge: 'Cloud SQL',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dotColor: 'bg-emerald-500',
        };
    }
  };

  const roleStyle = getRoleBadgeStyle();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-72 border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 overflow-y-auto">
          <div className="space-y-4 sm:space-y-5">
            {/* Header role context card */}
            <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-slate-100/70 p-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Mode Akses Aktif
                </span>
                <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${roleStyle.badgeColor}`}>
                  {roleStyle.badge}
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${roleStyle.dotColor} animate-pulse`} />
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  {roleStyle.title}
                </span>
              </div>

              <div className="mt-1 text-[11px] font-medium text-slate-500 truncate" title={
                role === 'UMKM'
                  ? umkm?.businessName || 'Kopi Nusantara Roastery'
                  : role === 'MENTOR'
                  ? mentor?.fullName || 'Budi Santoso, M.B.A.'
                  : user?.email || 'banuamentor@gmail.com'
              }>
                {role === 'UMKM'
                  ? umkm?.businessName || 'Kopi Nusantara Roastery'
                  : role === 'MENTOR'
                  ? mentor?.fullName || 'Budi Santoso, M.B.A.'
                  : user?.email || 'banuamentor@gmail.com'}
              </div>
            </div>

            {/* Menu List */}
            <nav className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menu Utama
              </div>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-emerald-400 stroke-[2.25px]'
                            : 'text-slate-400 group-hover:text-slate-700 stroke-[1.75px]'
                        }`}
                      />
                      <span className="truncate tracking-tight text-left">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer system note */}
          <div className="border-t border-slate-200/80 pt-3 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Banua Mentor</span>
              <span className="font-mono text-[10px] text-slate-400">v2.4</span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">PostgreSQL Cloud SQL • Asia-SE1</p>
          </div>
        </div>
      </aside>
    </>
  );
};
