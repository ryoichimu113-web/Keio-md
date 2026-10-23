"use client";

import { useState } from "react";
import { CategoryBadge } from "@/components/CategoryBadge";
import { AbsenceSection, EventList, MenuSection, useAbsences } from "@/components/DayDetail";
import { md, WEEKDAYS, weekday, weekdayClass } from "@/lib/date";
import { useMe } from "@/lib/me";
import { meetFor, meetText } from "@/lib/meet";
import { allEvents, allOverrides, eventsOn } from "@/lib/schedule";
import { menuOn, useSlackData } from "@/lib/slackData";
import { useAppState } from "@/lib/store";

/** その日の予定を「集合」と「練習メニュー」に分ける */
export function useDay(date: string) {
  const state = useAppState() ?? undefined;
  const events = eventsOn(allEvents(state), date);
  const meet = meetFor(allOverrides(state), date);
  return {
    meet,
    clubEvents: events.filter((e) => e.category !== "練習"),
    practiceEvents: events.filter((e) => e.category === "練習"),
  };
}

export function MeetLine({ date, compact }: { date: string; compact?: boolean }) {
  const { meet } = useDay(date);
  const absent = useAbsences(date).length;
  const note = meet.override?.note;
  return (
    <p className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${compact ? "text-[12px]" : "text-sm"}`}>
      <span
        className={`rounded-md px-2 py-0.5 font-bold ${meet.kind === "time" ? "bg-blue-100 text-keio-navy" : "bg-slate-200 text-slate-600"}`}
      >
        {meetText(meet)}
      </span>
      {note && <span className="text-xs text-slate-500">{note}</span>}
      {meet.kind === "time" && absent > 0 && <span className="text-xs font-bold text-keio-red">集合欠 {absent}人</span>}
    </p>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[10px] font-bold tracking-wider text-slate-400">{children}</p>;
}

/** 1日分の中身。上に集合の予定、下に練習メニュー */
export function DayBody({ date }: { date: string }) {
  const { meet, clubEvents, practiceEvents } = useDay(date);
  return (
    <div className="divide-y divide-slate-100">
      <div className="space-y-2 pb-3">
        <SectionLabel>集合・予定</SectionLabel>
        <MeetLine date={date} />
        {clubEvents.length > 0 && <EventList events={clubEvents} />}
        {meet.kind === "time" && <AbsenceSection date={date} />}
      </div>
      <div className="pt-3">
        <SectionLabel>練習メニュー</SectionLabel>
        <MenuSection date={date} events={practiceEvents} />
      </div>
    </div>
  );
}

/** これからの予定の1日分。タップで詳細を開く */
export function DayCard({ date }: { date: string }) {
  const [open, setOpen] = useState(false);
  const { clubEvents, practiceEvents } = useDay(date);
  const slack = useSlackData();
  const me = useMe();
  const menu = menuOn(slack, date);
  const mine = menu?.entries.find((e) => e.memberId === me?.id);
  const practice = mine?.text ?? practiceEvents.map((e) => e.title).join("／");

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button className="flex w-full items-start gap-3 px-3 py-2 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <div className="w-10 shrink-0 pt-0.5 text-center leading-tight">
          <p className="text-sm font-bold">{md(date)}</p>
          <p className={`text-[11px] font-bold ${weekdayClass(date)}`}>{WEEKDAYS[weekday(date)]}</p>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <MeetLine date={date} compact />
          {clubEvents.length > 0 && (
            <p className="truncate text-sm">
              {clubEvents.map((e, i) => (
                <span key={e.id}>
                  {i > 0 && <span className="text-slate-300"> ／ </span>}
                  <CategoryBadge category={e.category} />
                  {e.time && <span className="mr-0.5 text-xs font-bold text-keio-navy">{e.time}</span>}
                  <span className="font-bold">{e.title}</span>
                </span>
              ))}
            </p>
          )}
          {(practice || menu?.tags.length) && (
            <p className="truncate border-t border-dashed border-slate-200 pt-1 text-xs text-slate-600">
              <span className="mr-1 rounded bg-blue-100 px-1 py-px text-[10px] font-bold text-keio-navy">練習</span>
              {practice || menu?.tags.join("・")}
            </p>
          )}
        </div>
        <span className="shrink-0 pt-1 text-xs text-slate-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-3 py-3">
          <DayBody date={date} />
        </div>
      )}
    </div>
  );
}
