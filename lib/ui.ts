export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-keio-navy focus:outline-none";

export const labelClass = "mb-1 block text-xs font-bold text-slate-500";

export const primaryButton =
  "rounded-lg bg-keio-navy px-4 py-2 text-sm font-bold text-white active:opacity-80 disabled:opacity-40";

export const secondaryButton =
  "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600 active:bg-slate-100";

export function formatKm(km: number): string {
  return (Math.round(km * 10) / 10).toString();
}
