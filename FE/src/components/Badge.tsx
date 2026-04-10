interface BadgeProps {
  value: string;
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
};

export function Badge({ value }: BadgeProps) {
  return (
    <span className={`inline-flex w-15 justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classByValue[value] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {value}
    </span>
  );
}
