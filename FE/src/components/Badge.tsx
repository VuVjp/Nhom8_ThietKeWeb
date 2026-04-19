interface BadgeProps {
  value: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

const classByValue: Record<string, string> = {
  Available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Occupied: 'bg-rose-100 text-rose-700 border-rose-200',
  Cleaning: 'bg-amber-100 text-amber-700 border-amber-200',
  Inspecting: 'bg-sky-100 text-sky-700 border-sky-200',
  Active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  Clean: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Dirty: 'bg-amber-100 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
};

const classByVariant: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-sky-100 text-sky-700 border-sky-200',
  default: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function Badge({ value, variant }: BadgeProps) {
  const cls = variant ? (classByVariant[variant] ?? classByValue[value]) : (classByValue[value] ?? 'bg-slate-100 text-slate-600 border-slate-200');
  return (
    <span className={`inline-flex w-20 justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {value}
    </span>
  );
}
