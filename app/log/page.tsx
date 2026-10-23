"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/components/Toaster";
import { addDays, md, mdw, startOfWeek, todayKey } from "@/lib/date";
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
          <BlockLogs state={state} weekStart={weekStarts[WEEKS - 1]} />
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
  const logs = state.logs.filter((l) => l.memberId === state.meId).sort(byDateDesc);
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

function BlockLogs({ state, weekStart }: { state: AppState; weekStart: string }) {
  const weekEnd = addDays(weekStart, 6);
  const ranking = state.members
    .map((m) => ({
      member: m,
      km: sumKm(state.logs.filter((l) => l.memberId === m.id && l.date >= weekStart && l.date <= weekEnd)),
    }))
    .sort((a, b) => b.km - a.km);
  const max = Math.max(...ranking.map((r) => r.km), 1);
  const recent = [...state.logs].sort(byDateDesc).slice(0, 30);
  const nameOf = (id: string) => state.members.find((m) => m.id === id)?.name ?? "不明";

  return (
    <>
      <section className="rounded-xl bg-white p-3 shadow-sm">
        <h2 className="mb-2 text-xs font-bold text-slate-500">
          今週の走行距離（{md(weekStart)}〜{md(weekEnd)}）
        </h2>
        <ul className="space-y-1.5">
          {ranking.map(({ member, km }) => (
            <li key={member.id} className="flex items-center gap-2 text-sm">
              <span className={`w-20 shrink-0 truncate font-bold ${member.id === state.meId ? "text-keio-red" : ""}`}>{member.name}</span>
              <span className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  className={`block h-full rounded-full ${member.id === state.meId ? "bg-keio-red" : "bg-keio-navy"}`}
                  style={{ width: `${(km / max) * 100}%` }}
                />
              </span>
              <span className="w-14 shrink-0 text-right font-bold text-keio-navy">{formatKm(km)}km</span>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="text-sm font-bold text-slate-600">最近の記録</h2>
      <div className="space-y-2">
        {recent.map((log) => (
          <LogCard key={log.id} log={log} memberName={nameOf(log.memberId)} />
        ))}
      </div>
    </>
  );
}
