"use client";

import { useState } from "react";
import { DayDetail } from "@/components/DayDetail";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/components/Toaster";
import { mdw, toKey, todayKey, WEEKDAYS, weekday } from "@/lib/date";
import { uid, update, useAppState } from "@/lib/store";
import { CATEGORIES, CATEGORY_DOT, type Category } from "@/lib/types";
import { formatKm, inputClass, labelClass, primaryButton } from "@/lib/ui";

export default function CalendarPage() {
  const state = useAppState();
  const today = todayKey();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(today);

  if (!state) return <PageHeader title="カレンダー" />;

  const first = new Date(month.y, month.m, 1);
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toKey(new Date(month.y, month.m, i + 1))),
  ];
  while (cells.length % 7) cells.push(null);

  const move = (diff: number) =>
    setMonth(({ y, m }) => {
      const d = new Date(y, m + diff, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const selectedEvents = state.events.filter((e) => e.date === selected);
  const isOff = weekday(selected) === state.offWeekday || selectedEvents.some((e) => e.category === "臨時オフ");

  const deleteEvent = (id: string) => {
    if (!confirm("この予定を削除しますか？")) return;
    update((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
    toast("予定を削除しました");
  };

  return (
    <>
      <PageHeader title="カレンダー" />
      <div className="space-y-5 p-4">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <button className="px-3 py-1 text-lg font-bold text-slate-400" aria-label="前の月" onClick={() => move(-1)}>
              ‹
            </button>
            <p className="font-bold text-keio-navy">
              {month.y}年{month.m + 1}月
            </p>
            <button className="px-3 py-1 text-lg font-bold text-slate-400" aria-label="次の月" onClick={() => move(1)}>
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-bold">
            {WEEKDAYS.map((w, i) => (
              <p key={w} className={`pb-1 ${i === 0 ? "text-keio-red" : i === 6 ? "text-blue-600" : "text-slate-400"}`}>
                {w}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-100">
            {cells.map((date, i) => {
              if (!date) return <div key={`blank-${i}`} className="bg-white" />;
              const events = state.events.filter((e) => e.date === date);
              const km = state.logs.filter((l) => l.date === date).reduce((s, l) => s + l.distanceKm, 0);
              const wd = weekday(date);
              const off = wd === state.offWeekday || events.some((e) => e.category === "臨時オフ");
              return (
                <button
                  key={date}
                  onClick={() => setSelected(date)}
                  aria-pressed={selected === date}
                  className={`flex min-h-14 flex-col items-center gap-0.5 py-1 ${
                    selected === date ? "bg-blue-50 ring-2 ring-inset ring-keio-navy" : off ? "bg-slate-50" : "bg-white"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      date === today ? "bg-keio-red text-white" : wd === 0 ? "text-keio-red" : wd === 6 ? "text-blue-600" : "text-slate-700"
                    }`}
                  >
                    {Number(date.slice(8))}
                  </span>
                  <span className="flex gap-0.5">
                    {events.slice(0, 3).map((e) => (
                      <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[e.category]}`} />
                    ))}
                  </span>
                  {km > 0 && <span className="text-[9px] font-bold leading-none text-slate-400">{formatKm(km)}k</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
            {CATEGORIES.map((c) => (
              <span key={c} className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[c]}`} />
                {c}
              </span>
            ))}
          </div>
        </div>

        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-600">
            {mdw(selected)}の予定
            {isOff && <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs text-slate-600">オフ</span>}
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {selectedEvents.length > 0 ? (
              <DayDetail state={state} date={selected} onDeleteEvent={deleteEvent} />
            ) : (
              <p className="text-sm text-slate-400">予定はありません</p>
            )}
          </div>
        </section>

        <AddEventForm key={selected} date={selected} />
      </div>
    </>
  );
}

function AddEventForm({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("練習");
  const [title, setTitle] = useState("");
  const [meetTime, setMeetTime] = useState("");
  const [place, setPlace] = useState("");
  const [detail, setDetail] = useState("");

  if (!open) {
    return (
      <button className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-bold text-slate-500" onClick={() => setOpen(true)}>
        ＋ {mdw(date)}に予定を追加
      </button>
    );
  }

  const isTempOff = category === "臨時オフ";

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-slate-600">{mdw(date)}に予定を追加</h2>
      <form
        className="space-y-3 rounded-xl bg-white p-3 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const name = isTempOff ? "臨時オフ" : title.trim();
          if (!name) return;
          update((s) => ({
            ...s,
            events: [
              ...s.events,
              {
                id: uid(),
                date,
                category,
                title: name,
                meetTime: isTempOff ? undefined : meetTime.replace(/^0(\d):/, "$1:") || undefined,
                place: isTempOff ? undefined : place.trim() || undefined,
                detail: detail.trim() || undefined,
              },
            ],
          }));
          toast("予定を追加しました");
          setOpen(false);
        }}
      >
        <div>
          <p className={labelClass}>種類</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                className={`rounded-md px-2.5 py-1 text-xs font-bold ${category === c ? "bg-keio-navy text-white" : "bg-slate-100 text-slate-600"}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        {!isTempOff && (
          <>
            <div>
              <label className={labelClass} htmlFor="ev-title">タイトル</label>
              <input id="ev-title" className={inputClass} placeholder="例：ペース走" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="ev-time">集合時刻</label>
                <input id="ev-time" type="time" className={inputClass} value={meetTime} onChange={(e) => setMeetTime(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="ev-place">場所</label>
                <input id="ev-place" className={inputClass} placeholder="例：日吉陸上競技場" value={place} onChange={(e) => setPlace(e.target.value)} />
              </div>
            </div>
          </>
        )}
        <div>
          <label className={labelClass} htmlFor="ev-detail">内容・メモ</label>
          <textarea id="ev-detail" rows={2} className={inputClass} value={detail} onChange={(e) => setDetail(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className={`${primaryButton} flex-1`} disabled={!isTempOff && !title.trim()}>
            追加する
          </button>
          <button type="button" className="rounded-lg px-4 text-sm font-bold text-slate-500" onClick={() => setOpen(false)}>
            やめる
          </button>
        </div>
      </form>
    </section>
  );
}
