import { addDays, eachDay } from "./date";
import { meetFor, meetText } from "./meet";
import type { MeetOverride, ScheduleEvent } from "./types";

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Asia/Tokyo",
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:+0900",
  "TZOFFSETTO:+0900",
  "TZNAME:JST",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function escape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

const day = (key: string) => key.replace(/-/g, "");

/** "9:00" に分を足して "HHMM00" に */
function time(t: string, plusMinutes = 0): string {
  const [h, m] = t.split(":").map(Number);
  const total = Math.min(h * 60 + m + plusMinutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}${String(total % 60).padStart(2, "0")}00`;
}

/** 75 オクテットごとに折り返す */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += n;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

type Vevent = { uid: string; summary: string; date: string; endDate?: string; start?: string; minutes?: number; location?: string; description?: string };

function vevent(e: Vevent, stamp: string): string[] {
  const lines = ["BEGIN:VEVENT", `UID:${e.uid}@keio-md`, `DTSTAMP:${stamp}`];
  if (e.start) {
    lines.push(`DTSTART;TZID=Asia/Tokyo:${day(e.date)}T${time(e.start)}`, `DTEND;TZID=Asia/Tokyo:${day(e.date)}T${time(e.start, e.minutes ?? 60)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${day(e.date)}`, `DTEND;VALUE=DATE:${day(addDays(e.endDate ?? e.date, 1))}`);
  }
  lines.push(`SUMMARY:${escape(e.summary)}`);
  if (e.location) lines.push(`LOCATION:${escape(e.location)}`);
  if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
  lines.push("END:VEVENT");
  return lines;
}

/**
 * 部の予定と集合時間を iCalendar にする。
 * withDailyMeet なら、変更のない日の集合時間（基本の時刻）も from〜to の範囲で入れる。
 */
export function buildIcs(
  events: ScheduleEvent[],
  overrides: MeetOverride[],
  options: { withDailyMeet: boolean; from: string; to: string },
): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const vevents: string[] = [];

  for (const e of events) {
    vevents.push(
      ...vevent(
        { uid: e.id, summary: `【${e.category}】${e.title}`, date: e.date, endDate: e.endDate, start: e.time, location: e.place, description: e.detail },
        stamp,
      ),
    );
  }

  for (const d of eachDay(options.from, options.to)) {
    const meet = meetFor(overrides, d);
    if (!meet.override && !options.withDailyMeet) continue;
    if (!meet.override && meet.kind === "off") continue;
    const note = meet.override?.note;
    vevents.push(
      ...vevent(
        {
          uid: `meet-${d}`,
          summary: meet.kind === "time" ? meetText(meet) : `【${meetText(meet)}】`,
          date: d,
          start: meet.kind === "time" ? meet.time : undefined,
          minutes: 30,
          description: note,
        },
        stamp,
      ),
    );
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Keio MD//中距離ブロック//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:慶應競走部 中距離ブロック",
    "X-WR-TIMEZONE:Asia/Tokyo",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
    ...VTIMEZONE,
    ...vevents,
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n");
}
