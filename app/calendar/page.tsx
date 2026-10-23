"use client";

import Link from "next/link";
import { useState } from "react";
import { AbsenceSection, EventList } from "@/components/DayDetail";
import { MeetBadge } from "@/components/MeetBadge";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/components/Toaster";
import { addDays, md, mdw, toKey, todayKey, WEEKDAYS, weekday } from "@/lib/date";
import { BASE_DESCRIPTION, excludeLabel, meetFor, overrideLabel } from "@/lib/meet";
import { personalOn, usePersonalEvents } from "@/lib/personal";
import { postToSlack } from "@/lib/slack";
import { canEditSchedule, eventsOn, uid, update, useAppState } from "@/lib/store";
import { type AppState, CATEGORIES, CATEGORY_DOT, type Category, type MeetOverride, type ScheduleEvent } from "@/lib/types";
import { inputClass, labelClass, primaryButton } from "@/lib/ui";

type Tab = "club" | "practice" | "absence" | "personal";

const TABS: { id: Tab; label: string }[] = [
  { id: "club", label: "部活の予定" },
  { id: "practice", label: "練習予定" },
  { id: "absence", label: "集合欠" },
  { id: "personal", label: "個人" },
];

type Panel = "none" | "meet" | "event";

export default function CalendarPage() {
  const state = useAppState();
  const today = todayKey();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(today);
  const [tab, setTab] = useState<Tab>("club");
  const [panel, setPanel] = useState<Panel>("none");
  const personal = usePersonalEvents(state?.icalUrl);

  const move = (diff: number) =>
    setMonth(({ y, m }) => {
      const d = new Date(y, m + diff, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const header = (
    <PageHeader
      label="カレンダー"
      title={`${month.y}年 ${month.m + 1}月`}
      right={
        <div className="flex gap-1">
          <button className="rounded-lg bg-white/10 px-3 py-1 text-lg" aria-label="前の月" onClick={() => move(-1)}>
            ‹
          </button>
          <button className="rounded-lg bg-white/10 px-3 py-1 text-lg" aria-label="次の月" onClick={() => move(1)}>
            ›
          </button>
        </div>
      }
    >
      <div role="tablist" className="mt-3 flex rounded-lg bg-white/10 p-1 text-[13px] font-bold">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`flex-1 rounded-md py-1.5 ${tab === t.id ? "bg-white text-keio-navy shadow-sm" : "text-blue-100"}`}
            onClick={() => {
              setTab(t.id);
              setPanel("none");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </PageHeader>
  );

  if (!state) return header;

  const first = new Date(month.y, month.m, 1);
  const gridStart = toKey(new Date(month.y, month.m, 1 - first.getDay()));
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const monthPrefix = `${month.y}-${String(month.m + 1).padStart(2, "0")}`;
  const editable = canEditSchedule(state);

  const dotsFor = (date: string): string[] => {
    if (tab === "club") return eventsOn(state, date).filter((e) => e.category !== "練習").map((e) => CATEGORY_DOT[e.category]);
    if (tab === "practice") return eventsOn(state, date).filter((e) => e.category === "練習").map(() => "bg-blue-500");
    if (tab === "absence") return state.absences.filter((a) => a.date === date).map(() => "bg-keio-red");
    return personalOn(personal.events, date).map(() => "bg-sky-500");
  };

  const select = (date: string) => {
    setSelected(date);
    setPanel("none");
    if (!date.startsWith(monthPrefix)) setMonth({ y: Number(date.slice(0, 4)), m: Number(date.slice(5, 7)) - 1 });
  };

  const deleteEvent = (e: ScheduleEvent) => {
    if (!confirm(`「${e.title}」を削除しますか？`)) return;
    update((s) => ({
      ...s,
      events: s.events.filter((x) => x.id !== e.id),
      overrides: s.overrides.filter((o) => o.eventId !== e.id),
    }));
    toast("予定を削除しました");
  };

  const selectedEvents = eventsOn(state, selected).filter((e) => (tab === "practice" ? e.category === "練習" : e.category !== "練習"));

  return (
    <>
      {header}
      <div className="bg-white px-2 pb-2 pt-1 shadow-sm">
        <div className="grid grid-cols-7 text-center text-[11px] font-bold">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`py-1 ${i === 0 ? "text-keio-red" : i === 6 ? "text-blue-600" : "text-slate-500"}`}>
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((date) => {
            const isSelected = date === selected;
            const outside = !date.startsWith(monthPrefix);
            const meet = meetFor(state, date);
            const label = meet.kind === "time" ? meet.time : meet.kind === "off" ? "off" : "";
            const labelColor = isSelected ? "text-blue-100" : meet.override ? "font-bold text-keio-red" : "text-slate-400";
            return (
              <button
                key={date}
                onClick={() => select(date)}
                aria-pressed={isSelected}
                aria-label={mdw(date)}
                className={`flex h-14 flex-col items-center rounded-lg pt-1 text-sm ${isSelected ? "bg-keio-navy text-white" : date === today ? "bg-blue-50" : ""} ${outside ? "text-slate-300" : ""}`}
              >
                <span className="font-medium">{Number(date.slice(8))}</span>
                <span className={`text-[9px] leading-3 ${labelColor} ${outside ? "opacity-50" : ""}`}>{label}</span>
                <span className="mt-1 flex gap-0.5">
                  {dotsFor(date)
                    .slice(0, 4)
                    .map((c, i) => (
                      <span key={i} className={`h-1.5 w-1.5 rounded-full ${c}`} />
                    ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 p-4">
        {(tab === "club" || tab === "practice") && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-600">{mdw(selected)} の{tab === "practice" ? "練習" : "予定"}</h2>
              {editable && (
                <div className="flex gap-1.5">
                  {tab === "club" && (
                    <button
                      className="rounded-full border border-keio-navy bg-white px-3 py-1.5 text-xs font-bold text-keio-navy"
                      onClick={() => setPanel(panel === "meet" ? "none" : "meet")}
                    >
                      集合時間を変更
                    </button>
                  )}
                  <button
                    className="rounded-full bg-keio-red px-3 py-1.5 text-xs font-bold text-white"
                    onClick={() => setPanel(panel === "event" ? "none" : "event")}
                  >
                    ＋ {tab === "practice" ? "練習を追加" : "予定を追加"}
                  </button>
                </div>
              )}
            </div>
            {panel === "meet" && <MeetForm key={selected} state={state} date={selected} onDone={() => setPanel("none")} />}
            {panel === "event" && (
              <EventForm key={`${selected}-${tab}`} state={state} date={selected} practice={tab === "practice"} onDone={() => setPanel("none")} />
            )}
            <MeetBadge meet={meetFor(state, selected)} />
            {selectedEvents.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <EventList events={selectedEvents} onDelete={editable ? deleteEvent : undefined} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">{tab === "practice" ? "練習予定はありません" : "予定はありません"}</p>
            )}
            {tab === "club" && (
              <div className="pt-3">
                <MeetOverrides state={state} editable={editable} />
              </div>
            )}
          </>
        )}

        {tab === "absence" && (
          <>
            <h2 className="text-sm font-bold text-slate-600">{mdw(selected)} の集合欠</h2>
            <MeetBadge meet={meetFor(state, selected)} />
            {meetFor(state, selected).kind === "time" ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <AbsenceSection state={state} date={selected} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">この日は集合がありません</p>
            )}
            <MyAbsences state={state} today={today} onSelect={select} />
          </>
        )}

        {tab === "personal" && (
          <>
            <h2 className="text-sm font-bold text-slate-600">{mdw(selected)} の個人の予定</h2>
            {!state.icalUrl ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm">
                Googleカレンダーを連携すると、自分の予定をここに表示できます。
                <Link href="/settings#google" className="mt-2 block font-bold text-keio-navy underline">
                  設定で連携する
                </Link>
              </div>
            ) : personal.status === "loading" ? (
              <p className="text-sm text-slate-400">読み込み中…</p>
            ) : personal.status === "error" ? (
              <p className="text-sm text-keio-red">{personal.error}</p>
            ) : personalOn(personal.events, selected).length === 0 ? (
              <p className="text-sm text-slate-400">予定はありません</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
                {personalOn(personal.events, selected).map((e, i) => (
                  <li key={i} className="flex gap-3 px-3 py-2 text-sm">
                    <span className="w-24 shrink-0 text-xs font-bold text-slate-500">
                      {e.start ? `${e.start}${e.end ? `〜${e.end}` : ""}` : "終日"}
                    </span>
                    <span className="font-bold">{e.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}

function MeetOverrides({ state, editable }: { state: AppState; editable: boolean }) {
  const memberName = (id: string) => state.members.find((m) => m.id === id)?.name ?? "不明";
  const overrides = [...state.overrides].sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="text-sm font-bold">集合時間</h3>
      <p className="mt-0.5 text-xs text-slate-500">{BASE_DESCRIPTION}</p>
      {overrides.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100 border-t border-slate-100">
          {overrides.map((o) => {
            const event = o.eventId ? state.events.find((e) => e.id === o.eventId) : undefined;
            const sub = [
              o.excludeWeekdays?.length ? excludeLabel(o.excludeWeekdays) : null,
              event ? `予定「${event.title}」と連動` : null,
              o.note || null,
              `登録：${memberName(o.createdBy)}`,
            ].filter(Boolean);
            return (
              <li key={o.id} className="flex items-start gap-2 py-2">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-bold">
                    {o.from === o.to ? mdw(o.from) : `${mdw(o.from)}〜${mdw(o.to)}`}
                    <span className={`ml-2 ${o.kind === "time" ? "text-keio-navy" : "text-slate-500"}`}>{overrideLabel(o)}</span>
                  </p>
                  <p className="text-xs text-slate-500">{sub.join(" ・ ")}</p>
                </div>
                {editable && (
                  <button
                    className="shrink-0 text-[11px] font-bold text-slate-400"
                    onClick={() => {
                      if (!confirm("この集合時間の変更を取り消しますか？")) return;
                      update((s) => ({ ...s, overrides: s.overrides.filter((x) => x.id !== o.id) }));
                      toast("取り消しました");
                    }}
                  >
                    取消
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function MyAbsences({ state, today, onSelect }: { state: AppState; today: string; onSelect: (date: string) => void }) {
  const mine = state.absences
    .filter((a) => a.memberId === state.meId && a.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  return (
    <section className="pt-3">
      <h3 className="mb-2 text-sm font-bold text-slate-600">これからの自分の集合欠</h3>
      {mine.length === 0 ? (
        <p className="text-sm text-slate-400">ありません</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
          {mine.map((a) => (
            <li key={a.date}>
              <button className="flex w-full gap-3 px-3 py-2 text-left text-sm" onClick={() => onSelect(a.date)}>
                <span className="font-bold">{mdw(a.date)}</span>
                <span className="text-slate-500">{a.reason ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Segment<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          className={`rounded-md px-2.5 py-1 text-xs font-bold ${value === o.value ? "bg-keio-navy text-white" : "bg-slate-100 text-slate-600"}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MeetForm({ state, date, onDone }: { state: AppState; date: string; onDone: () => void }) {
  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(date);
  const [kind, setKind] = useState<MeetOverride["kind"]>("time");
  const [time, setTime] = useState("09:00");
  const [exclude, setExclude] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const multiDay = from < to;
  const valid = from && to && from <= to && (kind !== "time" || time);

  return (
    <form
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const override: MeetOverride = {
          id: uid(),
          from,
          to,
          kind,
          time: kind === "time" ? time : undefined,
          excludeWeekdays: multiDay && exclude.length ? exclude : undefined,
          note: note.trim() || undefined,
          createdBy: state.meId,
        };
        update((s) => ({ ...s, overrides: [...s.overrides, override] }));
        toast("集合時間を変更しました");
        onDone();
      }}
    >
      <h3 className="text-sm font-bold">集合時間を変更</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="meet-from">開始日</label>
          <input id="meet-from" type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="meet-to">終了日</label>
          <input id="meet-to" type="date" className={inputClass} value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <Segment
        value={kind}
        onChange={setKind}
        options={[
          { value: "time", label: "時刻を指定" },
          { value: "off", label: "オフ" },
          { value: "none", label: "集合時間なし" },
        ]}
      />
      {kind === "time" && (
        <div>
          <label className={labelClass} htmlFor="meet-time">集合時刻</label>
          <input id="meet-time" type="time" className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      )}
      {multiDay && (
        <div>
          <p className={labelClass}>除く曜日</p>
          <div className="flex gap-1">
            {WEEKDAYS.map((w, i) => (
              <button
                key={w}
                type="button"
                aria-pressed={exclude.includes(i)}
                className={`flex-1 rounded-md py-1 text-xs font-bold ${exclude.includes(i) ? "bg-keio-navy text-white" : "bg-slate-100 text-slate-600"}`}
                onClick={() => setExclude((x) => (x.includes(i) ? x.filter((d) => d !== i) : [...x, i]))}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className={labelClass} htmlFor="meet-note">メモ</label>
        <input id="meet-note" className={inputClass} placeholder="例：休暇期間" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button className={`${primaryButton} flex-1`} disabled={!valid}>
          変更する
        </button>
        <button type="button" className="rounded-lg px-4 text-sm font-bold text-slate-500" onClick={onDone}>
          やめる
        </button>
      </div>
    </form>
  );
}

function EventForm({ state, date, practice, onDone }: { state: AppState; date: string; practice: boolean; onDone: () => void }) {
  const [category, setCategory] = useState<Category>(practice ? "練習" : "試合");
  const [title, setTitle] = useState("");
  const [endDate, setEndDate] = useState("");
  const [place, setPlace] = useState("");
  const [detail, setDetail] = useState("");
  const isTempOff = category === "臨時オフ";
  const name = isTempOff ? title.trim() || "臨時オフ" : title.trim();
  const end = endDate && endDate > date ? endDate : undefined;

  return (
    <form
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name) return;
        const event: ScheduleEvent = {
          id: uid(),
          date,
          endDate: end,
          category,
          title: name,
          place: place.trim() || undefined,
          detail: detail.trim() || undefined,
          createdBy: state.meId,
        };
        // 臨時オフと合宿は集合時間も連動させる
        const linked: MeetOverride[] =
          category === "臨時オフ" || category === "合宿"
            ? [{ id: uid(), from: date, to: end ?? date, kind: isTempOff ? "off" : "none", eventId: event.id, createdBy: state.meId }]
            : [];
        update((s) => ({ ...s, events: [...s.events, event], overrides: [...s.overrides, ...linked] }));
        const me = state.members.find((m) => m.id === state.meId)?.name ?? "";
        postToSlack(`【予定追加】${mdw(date)}${end ? `〜${mdw(end)}` : ""} ${category}「${name}」${place.trim() ? `（${place.trim()}）` : ""} 登録：${me}`);
        toast("予定を追加しました");
        onDone();
      }}
    >
      <h3 className="text-sm font-bold">{mdw(date)} に追加</h3>
      {!practice && (
        <Segment
          value={category}
          onChange={setCategory}
          options={CATEGORIES.filter((c) => c !== "練習").map((c) => ({ value: c, label: c }))}
        />
      )}
      <div>
        <label className={labelClass} htmlFor="ev-title">{practice ? "メニュー" : "タイトル"}</label>
        <input
          id="ev-title"
          className={inputClass}
          placeholder={practice ? "例：ペース走" : isTempOff ? "臨時オフ" : "例：部内記録会"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      {!practice && (
        <div>
          <label className={labelClass} htmlFor="ev-end">最終日（複数日のとき）</label>
          <input id="ev-end" type="date" className={inputClass} min={addDays(date, 1)} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      )}
      {!isTempOff && (
        <div>
          <label className={labelClass} htmlFor="ev-place">場所</label>
          <input id="ev-place" className={inputClass} placeholder="例：日吉陸上競技場" value={place} onChange={(e) => setPlace(e.target.value)} />
        </div>
      )}
      <div>
        <label className={labelClass} htmlFor="ev-detail">内容・メモ</label>
        <textarea id="ev-detail" rows={2} className={inputClass} value={detail} onChange={(e) => setDetail(e.target.value)} />
      </div>
      {(category === "臨時オフ" || category === "合宿") && (
        <p className="text-[11px] text-slate-500">
          {md(date)}
          {end ? `〜${md(end)}` : ""} の集合時間が「{isTempOff ? "オフ" : "集合時間なし"}」になります。
        </p>
      )}
      <div className="flex gap-2">
        <button className={`${primaryButton} flex-1`} disabled={!name}>
          追加する
        </button>
        <button type="button" className="rounded-lg px-4 text-sm font-bold text-slate-500" onClick={onDone}>
          やめる
        </button>
      </div>
    </form>
  );
}
