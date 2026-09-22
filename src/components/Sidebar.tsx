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
  FileSpreadsheet,
  Layers,
  ChevronRight,
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
        { id: 'umkm-sales-new', label: 'Catat Penjualan', icon: PlusCircle, badge: 'Baru' },
        { id: 'umkm-sales-list', label: 'Riwayat Transaksi', icon: Receipt },
        { id: 'umkm-products', label: 'Katalog Produk & HPP', icon: Package },
        { id: 'umkm-analytics', label: 'Analisis & Laporan', icon: BarChart3 },
        { id: 'umkm-mentoring', label: 'Sesi & Action Plan', icon: ListTodo },
        { id: 'umkm-profile', label: 'Profil Usaha', icon: Store },
      ];
    } else if (role === 'MENTOR') {
      return [
        { id: 'mentor-dashboard', label: 'Dashboard Mentor', icon: LayoutDashboard },
        { id: 'mentor-umkms', label: 'UMKM Dampingan', icon: Store },
        { id: 'mentor-sessions', label: 'Sesi Mentoring', icon: CalendarCheck },
        { id: 'mentor-action-plans', label: 'Evaluasi Action Plan', icon: ListTodo },
        { id: 'mentor-profile', label: 'Profil Mentor', icon: UserCog },
      ];
    } else {
      // ADMIN
      return [
        { id: 'admin-dashboard', label: 'Dashboard Eksekutif', icon: LayoutDashboard },
        { id: 'admin-umkms', label: 'Monitoring UMKM', icon: Store },
        { id: 'admin-mentors', label: 'Monitoring Mentor', icon: Users },
        { id: 'admin-programs', label: 'Program Akselerasi', icon: Award },
        { id: 'admin-assignments', label: 'Penugasan Mentor', icon: Layers },
        { id: 'admin-users', label: 'Manajemen Akun', icon: UserCog },
        { id: 'admin-audit', label: 'Audit Log Sistem', icon: ShieldCheck },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div className="space-y-6">
            {/* Header role context */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Mode Akses Aktif
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {role === 'ADMIN' ? 'Administrator' : role === 'MENTOR' ? 'Mentor Bisnis' : 'Pelaku UMKM'}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  Cloud SQL
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 truncate">
                {role === 'UMKM'
                  ? umkm?.businessName || 'Kopi Nusantara Roastery'
                  : role === 'MENTOR'
                  ? mentor?.fullName || 'Budi Santoso, M.B.A.'
                  : user?.email || 'banuamentor@gmail.com'}
              </div>
            </div>

            {/* Menu List */}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            <p className="font-medium text-slate-600">Banua Mentor v2.4</p>
            <p>PostgreSQL Cloud SQL • Asia-Southeast1</p>
          </div>
        </div>
      </aside>
    </>
  );
};
