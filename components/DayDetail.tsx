"use client";

import { useState } from "react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { toast } from "@/components/Toaster";
import { md } from "@/lib/date";
import { useMe } from "@/lib/me";
import { isFromSchedule } from "@/lib/schedule";
import { menuOn, refreshSlackData, slackAbsencesOn, useSlackData } from "@/lib/slackData";
import { update, useAppState } from "@/lib/store";
import type { ScheduleEvent } from "@/lib/types";
import { inputClass } from "@/lib/ui";

/** 予定の一覧（時刻・場所・内容つき） */
export function EventList({ events, onDelete }: { events: ScheduleEvent[]; onDelete?: (e: ScheduleEvent) => void }) {
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div key={e.id} className="text-sm">
          <div className="flex items-start gap-2">
            <p className="flex-1">
              <CategoryBadge category={e.category} />
              {e.time && <span className="mr-1 font-bold text-keio-navy">{e.time}〜</span>}
              <span className="font-bold">{e.title}</span>
              {e.endDate && (
                <span className="ml-1 text-xs text-slate-500">
                  {md(e.date)}〜{md(e.endDate)}
                </span>
              )}
            </p>
            {onDelete && !isFromSchedule(e) && (
              <button className="shrink-0 text-[11px] font-bold text-slate-400" onClick={() => onDelete(e)}>
                削除
              </button>
            )}
          </div>
          {(e.place || e.detail) && (
            <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-500">{[e.place && `@${e.place}`, e.detail].filter(Boolean).join("　")}</p>
          )}
        </div>
      ))}
    </div>
  );
}

type AbsenceRow = { memberId: string; name: string; reason?: string; local: boolean };

/** その日の集合欠（Slack ＋ この端末） */
export function useAbsences(date: string): AbsenceRow[] {
  const slack = useSlackData();
  const state = useAppState();
  const rows: AbsenceRow[] = slackAbsencesOn(slack, date).map((a) => ({ memberId: a.memberId, name: a.name, reason: a.reason, local: false }));
  for (const a of state?.absences.filter((x) => x.date === date) ?? []) {
    if (rows.some((r) => r.memberId === a.memberId)) continue;
    const name = slack?.members.find((m) => m.id === a.memberId)?.name ?? "自分";
    rows.push({ memberId: a.memberId, name, reason: a.reason, local: true });
  }
  return rows;
}

/** 集合欠の一覧と自分の連絡 */
export function AbsenceSection({ date }: { date: string }) {
  const rows = useAbsences(date);
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-xs font-bold text-slate-500">集合欠（{rows.length}人）</p>
      {rows.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-xs">
          {rows.map((a) => (
            <li key={a.memberId}>
              <span className="font-bold">{a.name}</span>
              {a.reason && <span className="text-slate-500">：{a.reason}</span>}
              {a.local && <span className="ml-1 text-[10px] text-slate-400">（この端末のみ）</span>}
            </li>
          ))}
        </ul>
      )}
      <AbsenceToggle date={date} rows={rows} />
    </div>
  );
}

function AbsenceToggle({ date, rows }: { date: string; rows: AbsenceRow[] }) {
  const slack = useSlackData();
  const me = useMe();
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const meId = me?.id ?? "me";
  const mine = rows.find((r) => r.memberId === meId);

  if (mine) {
    if (!mine.local) return <p className="mt-2 text-[11px] text-slate-500">取り消すときは Slack の #01_集合欠 に投稿してください。</p>;
    return (
      <button
        className="mt-2 text-xs font-bold text-keio-red underline"
        onClick={() => {
          update((s) => ({ ...s, absences: s.absences.filter((a) => !(a.date === date && a.memberId === meId)) }));
          toast("集合欠を取り消しました");
        }}
      >
        自分の集合欠を取り消す
      </button>
    );
  }

  const toSlack = Boolean(slack?.connected && slack.me);

  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={async (ev) => {
        ev.preventDefault();
        if (toSlack) {
          setSending(true);
          const res = await fetch("/api/slack/absence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dates: [date], reason: reason.trim() }),
          }).catch(() => null);
          setSending(false);
          if (!res?.ok) {
            toast("Slack に送れませんでした");
            return;
          }
          await refreshSlackData();
          toast("#01_集合欠 に送りました");
        } else {
          update((s) => ({ ...s, absences: [...s.absences, { date, memberId: meId, reason: reason.trim() || undefined }] }));
          toast("集合欠を記録しました（この端末のみ）");
        }
        setReason("");
      }}
    >
      <input className={`${inputClass} py-1.5 text-sm`} placeholder="理由" value={reason} onChange={(ev) => setReason(ev.target.value)} />
      <button className="shrink-0 rounded-lg bg-keio-red px-3 text-xs font-bold text-white disabled:opacity-50" disabled={sending}>
        {toSlack ? "Slackで連絡" : "集合欠を連絡"}
      </button>
    </form>
  );
}

/** その日の練習メニュー（#01_メニュー設定）。自分のメニューを上に、他の人は開いて見る */
export function MenuSection({ date, events, showOthers = true }: { date: string; events: ScheduleEvent[]; showOthers?: boolean }) {
  const slack = useSlackData();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const menu = menuOn(slack, date);
  const mine = menu?.entries.find((e) => e.memberId === me?.id);
  const others = menu?.entries.filter((e) => e.memberId !== me?.id) ?? [];

  return (
    <div className="space-y-1.5">
      {menu && menu.tags.length > 0 && (
        <p className="flex flex-wrap gap-1">
          {menu.tags.map((t) => (
            <span key={t} className="rounded bg-blue-100 px-1.5 py-px text-[11px] font-bold text-keio-navy">
              {t}
            </span>
          ))}
        </p>
      )}
      <EventList events={events} />
      {mine ? (
        <p className="whitespace-pre-wrap rounded-lg bg-blue-50 px-2 py-1.5 font-mono text-[13px] text-slate-800">{mine.text}</p>
      ) : (
        events.length === 0 && (
          <p className="text-xs text-slate-400">{menu ? "自分のメニューはまだありません" : slack?.connected ? "メニューの投稿はまだありません" : "練習メニューは Slack 連携後に表示されます"}</p>
        )
      )}
      {showOthers && others.length > 0 && (
        <div>
          <button className="text-[11px] font-bold text-slate-500" onClick={() => setOpen(!open)} aria-expanded={open}>
            みんなのメニュー（{others.length}人）{open ? "▲" : "▼"}
          </button>
          {open && (
            <ul className="mt-1 divide-y divide-slate-100 rounded-lg border border-slate-100">
              {others.map((e) => (
                <li key={e.memberId} className="px-2 py-1.5 text-xs">
                  <p className="font-bold text-slate-600">{e.name}</p>
                  <p className="whitespace-pre-wrap font-mono text-slate-800">{e.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
