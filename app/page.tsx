"use client";

import { DayCard } from "@/components/DayCard";
import { DayDetail } from "@/components/DayDetail";
import { MeetBadge } from "@/components/MeetBadge";
import { PageHeader } from "@/components/PageHeader";
import { addDays, mdw, startOfWeek, todayKey } from "@/lib/date";
import { meetFor } from "@/lib/meet";
import { eventsOn, useAppState } from "@/lib/store";
import { formatKm } from "@/lib/ui";

export default function HomePage() {
  const state = useAppState();
  if (!state) return <PageHeader title="" />;

  const today = todayKey();
  const me = state.members.find((m) => m.id === state.meId);
  const myLogs = state.logs.filter((l) => l.memberId === state.meId);
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const weekKm = myLogs.filter((l) => l.date >= weekStart && l.date <= weekEnd).reduce((sum, l) => sum + l.distanceKm, 0);
  const todayLogs = myLogs.filter((l) => l.date === today);
  const todayKm = todayLogs.reduce((sum, l) => sum + l.distanceKm, 0);

  const todayEvents = eventsOn(state, today);
  const meet = meetFor(state, today);

  const upcomingDates = Array.from({ length: 14 }, (_, i) => addDays(today, i + 1)).filter((d) => eventsOn(state, d).length > 0);

  return (
    <>
      <PageHeader title={`${mdw(today)} ${me ? `${me.name}さん` : ""}`} />
      <div className="space-y-5 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs font-bold text-slate-500">今週の走行距離</p>
            <p className="text-2xl font-bold text-keio-navy">
              {formatKm(weekKm)}
              <span className="ml-0.5 text-sm">km</span>
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs font-bold text-slate-500">今日の記録</p>
            {todayLogs.length > 0 ? (
              <p className="text-lg font-bold text-keio-navy">
                {formatKm(todayKm)}
                <span className="ml-0.5 text-sm">km</span>
              </p>
            ) : (
              <p className="text-lg font-bold text-keio-red">未入力</p>
            )}
          </div>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">今日の予定</h2>
          <div className="space-y-2">
            <MeetBadge meet={meet} />
            {todayEvents.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <DayDetail state={state} date={today} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">予定はありません</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">これからの予定（2週間）</h2>
          <div className="space-y-1.5">
            {upcomingDates.length > 0 ? (
              upcomingDates.map((d) => <DayCard key={d} state={state} date={d} />)
            ) : (
              <p className="text-sm text-slate-400">予定はありません</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
