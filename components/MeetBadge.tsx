import type { Meet } from "@/lib/meet";

/** その日の集合時間のバッジ */
export function MeetBadge({ meet }: { meet: Meet }) {
  if (meet.kind === "none") return null;
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm">
      {meet.kind === "time" ? (
        <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-keio-navy">集合 {meet.time}</span>
      ) : (
        <span className="rounded-md bg-slate-200 px-2 py-0.5 font-bold text-slate-600">オフ</span>
      )}
    </p>
  );
}
