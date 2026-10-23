"use client";

import { useState } from "react";
import { toast } from "@/components/Toaster";
import { CategoryBadge } from "@/components/CategoryBadge";
import { update } from "@/lib/store";
import type { AppState } from "@/lib/types";
import { inputClass } from "@/lib/ui";

/** その日の予定の詳細・集合欠の一覧と連絡 */
export function DayDetail({ state, date, onDeleteEvent }: { state: AppState; date: string; onDeleteEvent?: (id: string) => void }) {
  const events = state.events.filter((e) => e.date === date);
  const absences = state.absences.filter((a) => a.date === date);
  const memberName = (id: string) => state.members.find((m) => m.id === id)?.name ?? "不明";

  return (
    <div className="space-y-3">
      {events.map((e) => (
        <div key={e.id} className="text-sm">
          <div className="flex items-start gap-2">
            <p className="flex-1">
              <CategoryBadge category={e.category} />
              <span className="font-bold">{e.title}</span>
            </p>
            {onDeleteEvent && (
              <button
                className="shrink-0 text-xs text-slate-400"
                aria-label={`${e.title}を削除`}
                onClick={() => onDeleteEvent(e.id)}
              >
                削除
              </button>
            )}
          </div>
          {(e.meetTime || e.place) && (
            <p className="mt-1 text-xs text-slate-500">
              {e.meetTime && <span>集合 {e.meetTime}</span>}
              {e.meetTime && e.place && <span className="text-slate-300"> ／ </span>}
              {e.place && <span>{e.place}</span>}
            </p>
          )}
          {e.detail && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-700">{e.detail}</p>}
        </div>
      ))}

      {events.some((e) => e.category !== "臨時オフ") && (
        <div className="rounded-lg bg-slate-50 p-2">
          <p className="text-xs font-bold text-slate-500">集合欠（{absences.length}人）</p>
          {absences.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs">
              {absences.map((a) => (
                <li key={a.memberId}>
                  <span className="font-bold">{memberName(a.memberId)}</span>
                  {a.reason && <span className="text-slate-500">：{a.reason}</span>}
                </li>
              ))}
            </ul>
          )}
          <AbsenceToggle state={state} date={date} />
        </div>
      )}
    </div>
  );
}

function AbsenceToggle({ state, date }: { state: AppState; date: string }) {
  const [reason, setReason] = useState("");
  const mine = state.absences.find((a) => a.date === date && a.memberId === state.meId);

  if (mine) {
    return (
      <button
        className="mt-2 text-xs font-bold text-keio-red underline"
        onClick={() => {
          update((s) => ({ ...s, absences: s.absences.filter((a) => !(a.date === date && a.memberId === s.meId)) }));
          toast("集合欠を取り消しました");
        }}
      >
        自分の集合欠を取り消す
      </button>
    );
  }

  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(ev) => {
        ev.preventDefault();
        update((s) => ({
          ...s,
          absences: [...s.absences, { date, memberId: s.meId, reason: reason.trim() || undefined }],
        }));
        setReason("");
        toast("集合欠を連絡しました");
      }}
    >
      <input
        className={`${inputClass} py-1.5 text-xs`}
        placeholder="理由（任意）"
        value={reason}
        onChange={(ev) => setReason(ev.target.value)}
      />
      <button className="shrink-0 rounded-lg bg-keio-red px-3 text-xs font-bold text-white">集合欠を連絡</button>
    </form>
  );
}
