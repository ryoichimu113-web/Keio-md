"use client";

import { DayCard } from "@/components/DayCard";
import { DayDetail } from "@/components/DayDetail";
import { PageHeader } from "@/components/PageHeader";
import { addDays, mdw, startOfWeek, todayKey, weekday } from "@/lib/date";
import { useAppState } from "@/lib/store";
import { formatKm } from "@/lib/ui";

export default function HomePage() {
  const state = useAppState();
  if (!state) return <PageHeader title="" />;

  const today = todayKey();
  const me = state.members.find((m) => m.id === state.meId);
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const weekKm = state.logs.filter((l) => l.date >= weekStart && l.date <= weekEnd).reduce((sum, l) => sum + l.distanceKm, 0);
  const todayLogs = state.logs.filter((l) => l.date === today);
  const todayKm = todayLogs.reduce((sum, l) => sum + l.distanceKm, 0);

  const todayEvents = state.events.filter((e) => e.date === today);
  const isOff = weekday(today) === state.offWeekday || todayEvents.some((e) => e.category === "臨時オフ");
  const meetTime = todayEvents.find((e) => e.meetTime)?.meetTime;

  const upcomingDates = Array.from({ length: 14 }, (_, i) => addDays(today, i + 1)).filter((d) =>
    state.events.some((e) => e.date === d),
  );

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
            {(isOff || meetTime) && (
              <p className="flex flex-wrap items-center gap-1.5 text-sm">
                {isOff ? (
                  <span className="rounded-md bg-slate-200 px-2 py-0.5 font-bold text-slate-600">オフ</span>
                ) : (
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-keio-navy">集合 {meetTime}</span>
                )}
              </p>
            )}
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
