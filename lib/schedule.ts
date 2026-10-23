import { NOTICES, SCHEDULE_EVENTS, SCHEDULE_OVERRIDES } from "@/data/schedule";
import type { AppState, MeetOverride, ScheduleEvent } from "./types";

/** 部の予定表（data/schedule.ts）とこの端末で追加した予定を合わせる */
export function allEvents(state?: AppState): ScheduleEvent[] {
  return [...SCHEDULE_EVENTS, ...(state?.events ?? [])];
}

export function allOverrides(state?: AppState): MeetOverride[] {
  return [...SCHEDULE_OVERRIDES, ...(state?.overrides ?? [])];
}

/** その日にかかっている予定（複数日の予定を含む） */
export function eventsOn(events: ScheduleEvent[], date: string): ScheduleEvent[] {
  return events
    .filter((e) => e.date <= date && date <= (e.endDate ?? e.date))
    .sort((a, b) => (a.time ?? "99").padStart(5, "0").localeCompare((b.time ?? "99").padStart(5, "0")));
}

/** 部の予定表から入れたもの（アプリでは消せない） */
export function isFromSchedule(item: { id: string }): boolean {
  return item.id.startsWith("s-");
}

export function noticeFor(date: string): string | undefined {
  return NOTICES[date.slice(0, 7)];
}
