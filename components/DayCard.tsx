"use client";

import { useState } from "react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { DayDetail } from "@/components/DayDetail";
import { md, WEEKDAYS, weekday, weekdayClass } from "@/lib/date";
import type { AppState } from "@/lib/types";

/** これからの予定の1日分。タップで詳細を開く */
export function DayCard({ state, date }: { state: AppState; date: string }) {
  const [open, setOpen] = useState(false);
  const events = state.events.filter((e) => e.date === date);
  const absentCount = state.absences.filter((a) => a.date === date).length;
  const isTempOff = events.some((e) => e.category === "臨時オフ");
  const meetTime = events.find((e) => e.meetTime)?.meetTime;
  const summary = isTempOff ? "オフ" : meetTime ? `集合 ${meetTime}` : "";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button className="flex w-full items-center gap-3 px-3 py-2 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <div className="w-10 shrink-0 text-center leading-tight">
          <p className="text-sm font-bold">{md(date)}</p>
          <p className={`text-[11px] font-bold ${weekdayClass(date)}`}>{WEEKDAYS[weekday(date)]}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">
            {events.map((e, i) => (
              <span key={e.id}>
                {i > 0 && <span className="text-slate-300"> ／ </span>}
                <CategoryBadge category={e.category} />
                <span className="font-bold">{e.title}</span>
              </span>
            ))}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {summary}
            {!isTempOff && absentCount > 0 && (
              <span className="text-keio-red">
                {summary && " ・ "}集合欠 {absentCount}人
              </span>
            )}
          </p>
        </div>
        <span className="shrink-0 text-xs text-slate-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-3 py-3">
          <DayDetail state={state} date={date} />
        </div>
      )}
    </div>
  );
}
