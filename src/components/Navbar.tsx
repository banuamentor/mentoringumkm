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
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
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

      {/* Role Switcher & User Status */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Switcher Tabs */}
        <div className="hidden md:flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-1 text-xs">
          <button
            onClick={() => switchDemoRole('UMKM')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
              role === 'UMKM'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-amber-600" />
            <span>UMKM</span>
            {role === 'UMKM' && <CheckCircle2 className="h-3 w-3 text-amber-600" />}
          </button>

          <button
            onClick={() => switchDemoRole('MENTOR')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
              role === 'MENTOR'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Mentor</span>
            {role === 'MENTOR' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
          </button>

          <button
            onClick={() => switchDemoRole('ADMIN')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
              role === 'ADMIN'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
            <span>Admin</span>
            {role === 'ADMIN' && <CheckCircle2 className="h-3 w-3 text-indigo-600" />}
          </button>
        </div>

        {/* User Profile Pill / Menu */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 pr-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="max-w-[120px] truncate text-xs font-medium text-slate-900">
                    {role === 'UMKM' ? umkm?.businessName || user.fullName : user.fullName}
                  </span>
                  <span className={`rounded border px-1 py-0.2 text-[10px] font-semibold ${currentRoleInfo.color}`}>
                    {role}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black/5 z-50">
                <div className="border-b border-slate-100 p-2 text-xs">
                  <p className="font-semibold text-slate-900">{user.fullName}</p>
                  <p className="text-slate-500 truncate">{user.email}</p>
                  {role === 'UMKM' && umkm && (
                    <p className="mt-1 font-medium text-amber-700">{umkm.businessName}</p>
                  )}
                  {role === 'MENTOR' && mentor && (
                    <p className="mt-1 font-medium text-emerald-700">{mentor.institution || 'Mentor Bisnis'}</p>
                  )}
                </div>

                <div className="p-1">
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400">Ganti Perspektif Akun</div>
                  <button
                    onClick={() => {
                      switchDemoRole('UMKM');
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left ${
                      role === 'UMKM' ? 'bg-amber-50 text-amber-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-amber-600" />
                    <div className="flex-1">
                      <div>UMKM (Kopi Nusantara)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Pencatatan sales, produk & HPP</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchDemoRole('MENTOR');
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left ${
                      role === 'MENTOR' ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    <div className="flex-1">
                      <div>Mentor (Budi Santoso, M.B.A.)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Sesi mentoring & action plan</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchDemoRole('ADMIN');
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left ${
                      role === 'ADMIN' ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4 text-indigo-600" />
                    <div className="flex-1">
                      <div>Admin (banuamentor@gmail.com)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Monitoring program & pengguna</div>
                    </div>
                  </button>
                </div>

                <div className="border-t border-slate-100 p-1">
                  <button
                    onClick={() => {
                      signOut();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar Akun</span>
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
      </div>
    </header>
  );
};
