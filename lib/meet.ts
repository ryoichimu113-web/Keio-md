import { WEEKDAYS, weekday } from "./date";
import type { AppState, MeetOverride } from "./types";

/** 曜日ごとの基本の集合時間（null はオフ） */
const BASE: Record<number, string | null> = { 0: "10:00", 1: null, 2: "16:45", 3: "16:45", 4: "16:45", 5: null, 6: "10:00" };

export const BASE_DESCRIPTION = "基本：火〜木 16:45 ／ 土日 10:00 ／ 月・金 オフ";

export type Meet = { kind: "time"; time: string; override?: MeetOverride } | { kind: "off" | "none"; override?: MeetOverride };

export function overrideFor(state: AppState, date: string): MeetOverride | undefined {
  const wd = weekday(date);
  // 後から登録したものを優先
  for (let i = state.overrides.length - 1; i >= 0; i--) {
    const o = state.overrides[i];
    if (date >= o.from && date <= o.to && !o.excludeWeekdays?.includes(wd)) return o;
  }
  return undefined;
}

export function meetFor(state: AppState, date: string): Meet {
  const override = overrideFor(state, date);
  if (override) {
    return override.kind === "time" ? { kind: "time", time: override.time ?? "", override } : { kind: override.kind, override };
  }
  const base = BASE[weekday(date)];
  return base ? { kind: "time", time: base } : { kind: "off" };
}

export function overrideLabel(o: MeetOverride): string {
  if (o.kind === "off") return "オフ";
  if (o.kind === "none") return "集合時間なし";
  return `${o.time}集合`;
}

export function excludeLabel(days: number[]): string {
  return `${[...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => WEEKDAYS[d]).join("・")}を除く`;
}
