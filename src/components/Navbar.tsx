import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/index.ts';
import {
  Building2,
  LogOut,
  LogIn,
  ChevronDown,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, umkm, mentor, role, signOut, signInWithGoogle } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return { label: 'Administrator', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'MENTOR':
        return { label: 'Mentor Bisnis', badgeColor: 'bg-sky-100 text-sky-800 border-sky-200' };
      case 'UMKM':
      default:
        return { label: 'Pelaku UMKM', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  const currentRoleInfo = getRoleLabel(role);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          title="Buka Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight whitespace-nowrap">
            Banua Mentor
          </span>
        </div>
      </div>

      {/* User Account Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2.5 text-left text-sm hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shrink-0">
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="max-w-[150px] md:max-w-[200px] truncate block text-xs font-bold text-slate-900 whitespace-nowrap">
                  {role === 'UMKM' ? umkm?.businessName || user.fullName : user.fullName}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="border-b border-slate-100 p-2.5 text-xs space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${currentRoleInfo.badgeColor}`}>
                      {currentRoleInfo.label}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm mt-1">{user.fullName}</p>
                  <p className="text-slate-500 truncate text-[11px]">{user.email}</p>
                  {role === 'UMKM' && umkm && (
                    <div className="mt-1.5 rounded-lg bg-slate-50 p-2 text-slate-800 border border-slate-200/80">
                      <div className="font-bold text-xs">{umkm.businessName}</div>
                      <div className="text-[10px] text-slate-500">{umkm.cityRegency || 'UMKM Binaan'}</div>
                    </div>
                  )}
                  {role === 'MENTOR' && mentor && (
                    <div className="mt-1.5 rounded-lg bg-slate-50 p-2 text-slate-800 border border-slate-200/80">
                      <div className="font-bold text-xs">{mentor.institution || 'Mentor Profesional'}</div>
                      <div className="text-[10px] text-slate-500">{mentor.expertise || 'Bisnis & Finansial'}</div>
                    </div>
                  )}
                  {role === 'ADMIN' && (
                    <div className="mt-1.5 rounded-lg bg-slate-50 p-2 text-slate-800 border border-slate-200/80">
                      <div className="font-bold text-xs">Administrator Ekosistem</div>
                      <div className="text-[10px] text-slate-500">Akses Penuh Pengelolaan Platform</div>
                    </div>
                  )}
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
            type="button"
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>Login Google</span>
          </button>
        )}
      </div>
    </header>
  );
};
