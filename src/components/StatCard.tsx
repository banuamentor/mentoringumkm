import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  growth?: string | null;
  growthLabel?: string;
  isPositive?: boolean;
  subtext?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  growth,
  growthLabel,
  isPositive,
  subtext,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'accent':
        return 'border-indigo-100 bg-indigo-50/30';
      case 'success':
        return 'border-emerald-100 bg-emerald-50/30';
      case 'warning':
        return 'border-amber-100 bg-amber-50/30';
      default:
        return 'border-slate-200/80 bg-white';
    }
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${getVariantStyles()}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      </div>

      {(growth || subtext) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {growth && (
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 font-semibold text-[11px] ${
                isPositive !== undefined
                  ? isPositive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {growth}
            </span>
          )}
          {subtext && <span className="text-slate-500 text-[11px] truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
