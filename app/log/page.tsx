"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/components/Toaster";
import { addDays, md, mdw, startOfWeek, todayKey } from "@/lib/date";
import { useMe } from "@/lib/me";
import { useSlackData } from "@/lib/slackData";
import { update, useAppState } from "@/lib/store";
import { type AppState, LOG_TYPE_STYLE, LOG_TYPES, type PracticeLog } from "@/lib/types";
import { formatKm } from "@/lib/ui";

const WEEKS = 8;

function sumKm(logs: PracticeLog[]) {
  return logs.reduce((sum, l) => sum + l.distanceKm, 0);
}

function byDateDesc(a: PracticeLog, b: PracticeLog) {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

export default function LogPage() {
  const state = useAppState();
  const [view, setView] = useState<"me" | "block">("me");
  const [month, setMonth] = useState<string | null>(null);

  const header = (
    <PageHeader
      label="練習記録"
      title={view === "me" ? "自分の記録" : "ブロック全体"}
      right={
        <Link href="/log/new" className="rounded-full bg-keio-red px-3 py-1.5 text-xs font-bold text-white">
          ＋ 記録する
        </Link>
      }
    />
  );
  if (!state) return header;

  const today = todayKey();
  const weekStarts = Array.from({ length: WEEKS }, (_, i) => addDays(startOfWeek(today), (i - WEEKS + 1) * 7));

  return (
    <>
      {header}
      <div className="space-y-4 p-4">
        <div className="flex rounded-lg bg-slate-200 p-1 text-sm font-bold">
          {(
            [
              ["me", "自分"],
              ["block", "ブロック全体"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              className={`flex-1 rounded-md py-1.5 ${view === v ? "bg-white text-keio-navy shadow-sm" : "text-slate-500"}`}
              onClick={() => setView(v)}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "me" ? (
          <MyLogs state={state} weekStarts={weekStarts} month={month} setMonth={setMonth} />
        ) : (
          <BlockMenus today={today} />
        )}
      </div>
    </>
  );
}

function WeeklyChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <section className="rounded-xl bg-white p-3 shadow-sm">
      <h2 className="mb-1 text-xs font-bold text-slate-500">週間走行距離（km）</h2>
      <svg viewBox="0 0 320 160" className="w-full" role="img" aria-label="週間走行距離">
        {values.map((v, i) => {
          const h = (v / max) * 122;
          const x = 7 + i * 40;
          return (
            <g key={i}>
              <rect x={x} y={140 - h} width="26" height={h} rx="4" className={i === values.length - 1 ? "fill-keio-red" : "fill-keio-navy"} />
              <text x={x + 13} y={136 - h} textAnchor="middle" className="fill-slate-700 text-[10px] font-bold">
                {Math.round(v)}
              </text>
              <text x={x + 13} y="154" textAnchor="middle" className="fill-slate-500 text-[9px]">
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function MyLogs({
  state,
  weekStarts,
  month,
  setMonth,
}: {
  state: AppState;
  weekStarts: string[];
  month: string | null;
  setMonth: (m: string) => void;
}) {
  // この端末の記録はすべて自分のもの
  const logs = [...state.logs].sort(byDateDesc);
  const weekly = weekStarts.map((s) => sumKm(logs.filter((l) => l.date >= s && l.date <= addDays(s, 6))));
  const labels = weekStarts.map((s, i) => (i === weekStarts.length - 1 ? "今週" : md(s)));

  const months = [...new Set(logs.map((l) => l.date.slice(0, 7)))];
  const current = month && months.includes(month) ? month : months[0];
  const monthLogs = logs.filter((l) => l.date.startsWith(current ?? ""));

  const remove = (log: PracticeLog) => {
    if (!confirm(`${mdw(log.date)}の記録を削除しますか？`)) return;
    update((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== log.id) }));
    toast("記録を削除しました");
  };

  return (
    <>
      <WeeklyChart values={weekly} labels={labels} />
      <MyMenus logs={logs} />

      {months.length === 0 ? (
        <p className="text-sm text-slate-400">まだ記録がありません</p>
      ) : (
        <>
          <div role="tablist" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
            {months.map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={m === current}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${m === current ? "bg-keio-navy text-white" : "bg-white text-slate-600 shadow-sm"}`}
                onClick={() => setMonth(m)}
              >
                {Number(m.slice(5))}月
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
            <p className="whitespace-nowrap">
              <span className="text-xs text-slate-500">月間 </span>
              <span className="font-bold text-keio-navy">{formatKm(sumKm(monthLogs))}km</span>
            </p>
            <p className="ml-auto flex gap-1.5 text-[11px]">
              {LOG_TYPES.map((t) => (
                <span key={t} className={`whitespace-nowrap rounded px-1.5 py-0.5 font-bold ${LOG_TYPE_STYLE[t]}`}>
                  {t} {monthLogs.filter((l) => l.type === t).length}
                </span>
              ))}
            </p>
          </div>

          <div className="space-y-2">
            {monthLogs.map((log) => (
              <LogCard key={log.id} log={log} onDelete={() => remove(log)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function LogCard({ log, memberName, onDelete }: { log: PracticeLog; memberName?: string; onDelete?: () => void }) {
  const meta = [`${formatKm(log.distanceKm)}km`, log.rpe != null ? `RPE ${log.rpe}` : null, log.condition ?? null].filter(Boolean);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-bold text-slate-700">{mdw(log.date)}</span>
        {memberName && <span className="font-bold text-keio-navy">{memberName}</span>}
        <span className="ml-auto">{meta.join(" ・ ")}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${LOG_TYPE_STYLE[log.type]}`}>{log.type}</span>
        {log.title && <span className="font-bold">{log.title}</span>}
      </div>
      {log.splits?.map((s, i) => (
        <p key={i} className="mt-0.5 font-mono text-[13px] text-slate-700">
          <span className="font-bold">{s.label}</span>: {s.times.join(" / ")}
        </p>
      ))}
      {log.note && <p className="mt-1 text-sm text-slate-600">{log.note}</p>}
      {onDelete && (
        <button className="mt-1 text-[11px] font-bold text-slate-400" onClick={onDelete}>
          削除
        </button>
      )}
    </div>
  );
}

/** Slack の #01_メニュー設定 から、自分のメニュー（直近）を読み込む */
function MyMenus({ logs }: { logs: PracticeLog[] }) {
  const slack = useSlackData();
  const me = useMe();
  const today = todayKey();
  if (!slack?.connected || !me) return null;
  const mine = slack.menus
    .filter((d) => d.date >= addDays(today, -6) && d.date <= addDays(today, 2))
    .map((d) => ({ date: d.date, tags: d.tags, entry: d.entries.find((e) => e.memberId === me.id) }))
    .filter((d) => d.entry)
    .reverse();

  return (
    <section className="rounded-xl bg-white p-3 shadow-sm">
      <h2 className="mb-2 text-xs font-bold text-slate-500">自分の練習メニュー（Slack #01_メニュー設定）</h2>
      {mine.length === 0 ? (
        <p className="text-sm text-slate-400">直近のメニューの投稿はありません</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {mine.map((d) => {
            const recorded = logs.some((l) => l.date === d.date);
            return (
              <li key={d.date} className="flex items-start gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-700">
                    {mdw(d.date)}
                    {d.tags.length > 0 && <span className="ml-1 font-normal text-slate-500">{d.tags.map((t) => `【${t}】`).join("")}</span>}
                  </p>
                  <p className="whitespace-pre-wrap font-mono text-[13px] text-slate-800">{d.entry!.text}</p>
                </div>
                {d.date <= today &&
                  (recorded ? (
                    <span className="shrink-0 text-[11px] font-bold text-emerald-700">記録済み</span>
                  ) : (
                    <Link
                      href={`/log/new?date=${d.date}`}
                      className="shrink-0 rounded-full border border-keio-navy px-2.5 py-1 text-[11px] font-bold text-keio-navy"
                    >
                      記録する
                    </Link>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** みんなのメニュー（Slack #01_メニュー設定） */
function BlockMenus({ today }: { today: string }) {
  const slack = useSlackData();
  const me = useMe();
  if (!slack) return <p className="text-sm text-slate-400">読み込み中…</p>;
  if (!slack.connected) return <p className="text-sm text-slate-400">Slack と連携すると、ブロック全員の練習メニューが見られます。</p>;
  const days = slack.menus.filter((d) => d.date >= addDays(today, -7) && d.date <= addDays(today, 3)).reverse();

  return (
    <div className="space-y-3">
      {days.length === 0 && <p className="text-sm text-slate-400">メニューの投稿はありません</p>}
      {days.map((d) => (
        <section key={d.date} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            <span className={d.date === today ? "text-keio-red" : ""}>{mdw(d.date)}</span>
            {d.tags.map((t) => (
              <span key={t} className="rounded bg-blue-100 px-1.5 py-px text-[10px] text-keio-navy">
                {t}
              </span>
            ))}
            <span className="ml-auto font-normal text-slate-500">{d.entries.length}人</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {d.entries.map((e) => (
              <li key={e.memberId} className="px-3 py-1.5 text-xs">
                <p className={`font-bold ${e.memberId === me?.id ? "text-keio-red" : "text-slate-600"}`}>{e.name}</p>
                <p className="whitespace-pre-wrap font-mono text-[13px] text-slate-800">{e.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
