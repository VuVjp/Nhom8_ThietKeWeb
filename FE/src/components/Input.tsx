import type { InputHTMLAttributes } from 'react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none ring-0 transition focus:border-slate-300 focus:shadow-sm ${props.className ?? ''}`}
    />
  );
}
