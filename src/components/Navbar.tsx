import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/index.ts';
import {
  Building2,
  UserCheck,
  ShieldAlert,
  LogOut,
  LogIn,
  ChevronDown,
  Sparkles,
  Menu,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onQuickSale?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen, onQuickSale }) => {
  const { user, umkm, mentor, role, signOut, switchDemoRole, signInWithGoogle, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const getRoleInfo = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return { label: 'Admin Pengelola', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200', icon: ShieldAlert };
      case 'MENTOR':
        return { label: 'Mentor Bisnis', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200', icon: UserCheck };
      case 'UMKM':
      default:
        return { label: 'Pelaku UMKM', color: 'bg-amber-500/10 text-amber-700 border-amber-200', icon: Building2 };
    }
  };

  const currentRoleInfo = getRoleInfo(role);
  const IconComponent = currentRoleInfo.icon;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          title="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 tracking-tight">Banua Mentor</span>
              <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 sm:inline-block">
                UMKM Cloud SQL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Business Performance & Mentoring Management
            </p>
          </div>
        </div>
      </div>

      {/* User Status & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Catat Jual Button for UMKM in Top Header */}
        {role === 'UMKM' && onQuickSale && (
          <button
            id="navbar-quick-sale-btn"
            type="button"
            onClick={onQuickSale}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer ring-2 ring-emerald-500/20"
            title="Catat Penjualan Cepat"
          >
            <Zap className="h-3.5 w-3.5 fill-current text-white" />
            <span className="tracking-tight">Catat Jual</span>
          </button>
        )}

        {/* Active Role Dedicated Badge */}
        <div className={`hidden sm:flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${currentRoleInfo.color}`}>
          <IconComponent className="h-4 w-4" />
          <span>{currentRoleInfo.label}</span>
        </div>

        {/* User Profile Pill / Menu */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 pr-2.5 text-left text-sm hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-800">
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="max-w-[140px] truncate text-xs font-bold text-slate-900">
                    {role === 'UMKM' ? umkm?.businessName || user.fullName : user.fullName}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black/5 z-50">
                <div className="border-b border-slate-100 p-2.5 text-xs space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${currentRoleInfo.color}`}>
                      {currentRoleInfo.label}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm mt-1">{user.fullName}</p>
                  <p className="text-slate-500 truncate text-[11px]">{user.email}</p>
                  {role === 'UMKM' && umkm && (
                    <div className="mt-1 rounded-md bg-amber-50 p-1.5 text-amber-900 border border-amber-200/60">
                      <div className="font-semibold text-[11px]">{umkm.businessName}</div>
                      <div className="text-[10px] text-amber-700">{umkm.cityRegency || 'UMKM Binaan'}</div>
                    </div>
                  )}
                  {role === 'MENTOR' && mentor && (
                    <div className="mt-1 rounded-md bg-emerald-50 p-1.5 text-emerald-900 border border-emerald-200/60">
                      <div className="font-semibold text-[11px]">{mentor.institution || 'Mentor Profesional'}</div>
                      <div className="text-[10px] text-emerald-700">{mentor.expertise || 'Bisnis & Finansial'}</div>
                    </div>
                  )}
                  {role === 'ADMIN' && (
                    <div className="mt-1 rounded-md bg-indigo-50 p-1.5 text-indigo-900 border border-indigo-200/60">
                      <div className="font-semibold text-[11px]">Administrator Ekosistem</div>
                      <div className="text-[10px] text-indigo-700">Akses Penuh Pengelolaan Platform</div>
                    </div>
                  )}
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      signOut();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span>Login Google</span>
          </button>
        )}

        {/* Quick Logout Button */}
        {user && (
          <button
            onClick={() => signOut()}
            title="Keluar dari Akun"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-2xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </button>
        )}
      </div>
    </header>
  );
};
