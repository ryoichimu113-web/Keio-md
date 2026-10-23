export type PersonalEvent = {
  /** "YYYY-MM-DD" */
  date: string;
  endDate?: string;
  /** "HH:MM"。終日なら undefined */
  start?: string;
  end?: string;
  title: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** iCal の日時を日本時間の日付・時刻に */
function parseDate(value: string, params: string): { date: string; time?: string } | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, , z] = m;
  if (!h || params.includes("VALUE=DATE")) return { date: `${y}-${mo}-${d}` };
  if (!z) return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}` }; // TZID 付きは現地時刻のまま扱う
  const jst = new Date(Date.UTC(+y, +mo - 1, +d, +h + 9, +mi));
  return {
    date: `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`,
    time: `${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`,
  };
}

function unescape(text: string) {
  return text.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1");
}

/** 繰り返し予定（RRULE）は最初の1回だけを返す */
export function parseIcal(ics: string): PersonalEvent[] {
  const lines = ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/);
  const events: PersonalEvent[] = [];
  let current: Record<string, { params: string; value: string }> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") current = {};
    else if (line === "END:VEVENT" && current) {
      const start = current.DTSTART && parseDate(current.DTSTART.value, current.DTSTART.params);
      if (start) {
        const end = current.DTEND && parseDate(current.DTEND.value, current.DTEND.params);
        let endDate = end?.date;
        // 終日予定の DTEND は翌日を指す
        if (end && !start.time && endDate) {
          const d = new Date(`${endDate}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() - 1);
          endDate = d.toISOString().slice(0, 10);
        }
        events.push({
          date: start.date,
          endDate: endDate && endDate > start.date ? endDate : undefined,
          start: start.time,
          end: end?.time,
          title: unescape(current.SUMMARY?.value ?? "（タイトルなし）"),
        });
      }
      current = null;
    } else if (current) {
      const colon = line.indexOf(":");
      if (colon < 0) continue;
      const [name, ...params] = line.slice(0, colon).split(";");
      current[name] = { params: params.join(";"), value: line.slice(colon + 1) };
    }
  }
  return events;
}
