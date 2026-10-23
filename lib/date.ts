export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const pad = (n: number) => String(n).padStart(2, "0");

/** ローカル日付を "YYYY-MM-DD" に */
export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function weekday(key: string): number {
  return fromKey(key).getDay();
}

/** "10/24" */
export function md(key: string): string {
  const d = fromKey(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** "10/24(土)" */
export function mdw(key: string): string {
  return `${md(key)}(${WEEKDAYS[weekday(key)]})`;
}

/** 月曜始まりの週の初日 */
export function startOfWeek(key: string): string {
  const wd = weekday(key);
  return addDays(key, wd === 0 ? -6 : 1 - wd);
}

export function weekdayClass(key: string): string {
  const wd = weekday(key);
  if (wd === 6) return "text-blue-600";
  if (wd === 0) return "text-keio-red";
  return "text-slate-400";
}
