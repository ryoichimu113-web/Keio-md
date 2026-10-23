"use client";

import Link from "next/link";
import { DayBody, DayCard } from "@/components/DayCard";
import { PageHeader } from "@/components/PageHeader";
import { addDays, mdw, startOfWeek, todayKey } from "@/lib/date";
import { useMe } from "@/lib/me";
import { allEvents, allOverrides, eventsOn, noticeFor } from "@/lib/schedule";
import { menuOn, useSlackData } from "@/lib/slackData";
import { useAppState } from "@/lib/store";
import { formatKm } from "@/lib/ui";

export default function HomePage() {
  const state = useAppState();
  const slack = useSlackData();
  const me = useMe();
  if (!state) return <PageHeader title="" />;

  const today = todayKey();
  const meId = me?.id ?? "me";
  const myLogs = state.logs.filter((l) => l.memberId === meId);
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const weekKm = myLogs.filter((l) => l.date >= weekStart && l.date <= weekEnd).reduce((sum, l) => sum + l.distanceKm, 0);
  const todayLogs = myLogs.filter((l) => l.date === today);
  const todayKm = todayLogs.reduce((sum, l) => sum + l.distanceKm, 0);

  const events = allEvents(state);
  const overrides = allOverrides(state);
  const upcomingDates = Array.from({ length: 14 }, (_, i) => addDays(today, i + 1)).filter(
    (d) => eventsOn(events, d).length > 0 || menuOn(slack, d) || overrides.some((o) => o.from <= d && d <= o.to),
  );
  const notice = noticeFor(today);

  return (
    <>
      <PageHeader title={`${mdw(today)} ${me ? `${me.name}さん` : ""}`} />
      <div className="space-y-5 p-4">
        {notice && (
          <p className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-900">
            <span className="font-bold">今月のお知らせ　</span>
            {notice}
          </p>
        )}
        {slack && !slack.connected && (
          <p className="rounded-xl bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
            Slack とまだつながっていないため、部員・練習メニュー・集合欠は表示されません。
            <Link href="/settings" className="ml-1 font-bold text-keio-navy underline">
              設定
            </Link>
          </p>
        )}
        {slack?.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-keio-red">{slack.error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs font-bold text-slate-500">今週の走行距離</p>
            <p className="text-2xl font-bold text-keio-navy">
              {formatKm(weekKm)}
              <span className="ml-0.5 text-sm">km</span>
            </p>
          </div>
          <Link href="/log/new" className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs font-bold text-slate-500">今日の記録</p>
            {todayLogs.length > 0 ? (
              <p className="text-lg font-bold text-keio-navy">
                {formatKm(todayKm)}
                <span className="ml-0.5 text-sm">km</span>
              </p>
            ) : (
              <p className="text-lg font-bold text-keio-red">未入力</p>
            )}
          </Link>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">今日の予定</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <DayBody date={today} />
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">これからの予定（2週間）</h2>
          <div className="space-y-1.5">
            {upcomingDates.length > 0 ? (
              upcomingDates.map((d) => <DayCard key={d} date={d} />)
            ) : (
              <p className="text-sm text-slate-400">予定はありません</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
