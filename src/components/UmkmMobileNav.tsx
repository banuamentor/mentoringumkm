import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  Package,
  BarChart3,
  Zap,
} from 'lucide-react';

interface UmkmMobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const UmkmMobileNav: React.FC<UmkmMobileNavProps> = ({ currentTab, onSelectTab }) => {
  // Hide mobile nav when on the new sale form so the form's sticky save button has full thumb-zone focus
  if (currentTab === 'umkm-sales-new') {
    return null;
  }

  const navItems = [
    { id: 'umkm-dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'umkm-sales-list', label: 'Riwayat', icon: Receipt },
    {
      id: 'umkm-sales-new',
      label: 'Catat Jual',
      icon: Zap,
      isPrimary: true,
    },
    { id: 'umkm-products', label: 'Produk', icon: Package },
    { id: 'umkm-analytics', label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <nav
      id="umkm-mobile-bottom-nav"
      aria-label="Navigasi Bawah UMKM"
      className="relative z-40 flex h-16 shrink-0 items-center justify-around border-t border-slate-200 bg-white px-2 shadow-lg lg:hidden overflow-visible select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        if (item.isPrimary) {
          return (
            <button
              key={item.id}
              id="umkm-nav-quick-sale-btn"
              type="button"
              onClick={() => onSelectTab(item.id)}
              className="group relative -top-3.5 flex flex-col items-center focus:outline-none cursor-pointer"
              title="Catat Penjualan Cepat (1 Tangan)"
            >
              <div className="flex h-13.5 w-13.5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-4 ring-white transition-all active:scale-95 group-hover:bg-emerald-500">
                <Zap className="h-6 w-6 fill-current animate-pulse" />
              </div>
              <span className="mt-0.5 text-[10px] font-bold text-emerald-700 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors focus:outline-none ${
              isActive
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
            <span className={`text-[10px] tracking-tight ${isActive ? 'font-bold text-slate-900' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
