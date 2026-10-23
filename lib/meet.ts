import { WEEKDAYS, weekday } from "./date";
import type { MeetOverride } from "./types";

/** 曜日ごとの基本の集合時間（null はオフ） */
const BASE: Record<number, string | null> = { 0: "10:00", 1: null, 2: "16:45", 3: "16:45", 4: "16:45", 5: null, 6: "10:00" };

export const BASE_DESCRIPTION = "基本：火〜木 16:45 ／ 土日 10:00 ／ 月・金 オフ";

export type Meet = { kind: "time"; time: string; override?: MeetOverride } | { kind: "off" | "none"; override?: MeetOverride };

export function overrideFor(overrides: MeetOverride[], date: string): MeetOverride | undefined {
  const wd = weekday(date);
  // 後から登録したものを優先
  for (let i = overrides.length - 1; i >= 0; i--) {
    const o = overrides[i];
    if (date >= o.from && date <= o.to && !o.excludeWeekdays?.includes(wd)) return o;
  }
  return undefined;
}

export function meetFor(overrides: MeetOverride[], date: string): Meet {
  const override = overrideFor(overrides, date);
  if (override) {
    return override.kind === "time" ? { kind: "time", time: override.time ?? "", override } : { kind: override.kind, override };
  }
  const base = BASE[weekday(date)];
  return base ? { kind: "time", time: base } : { kind: "off" };
}

/** "18:00 全体集合" のような表示 */
export function meetText(meet: Meet): string {
  if (meet.kind !== "time") return meet.kind === "off" ? "オフ" : "集合なし";
  const scope = meet.override?.scope;
  return `${meet.time} ${scope ? `${scope}集合` : "集合"}`;
}

export function overrideLabel(o: MeetOverride): string {
  if (o.kind === "off") return "オフ";
  if (o.kind === "none") return "集合なし";
  return `${o.time}${o.scope ?? ""}集合`;
}

export function excludeLabel(days: number[]): string {
  return `${[...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => WEEKDAYS[d]).join("・")}を除く`;
}
