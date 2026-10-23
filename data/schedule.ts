import type { MeetOverride, ScheduleEvent } from "@/lib/types";

/**
 * 部の予定表。ここを書き換えてデプロイすると、全員のアプリに反映される。
 * id は "s-" で始める（アプリ上では削除できない）。
 */
export const SCHEDULE_EVENTS: ScheduleEvent[] = [
  { id: "s-1001-ground", date: "2026-10-01", category: "連絡", title: "18:00まで競技場利用不可", detail: "中等部運動会のため" },
  { id: "s-1003-handover", date: "2026-10-03", category: "行事", title: "代交代式", time: "9:00", place: "12教室" },
  { id: "s-1004-meet", date: "2026-10-04", category: "試合", title: "第28回慶大競技会", time: "14:00" },
  { id: "s-1011-leave", date: "2026-10-11", category: "連絡", title: "12:00 完全撤収", time: "12:00", detail: "医学部サッカーのため" },
  { id: "s-1017-hakone", date: "2026-10-17", category: "試合", title: "箱根駅伝予選会", detail: "109代最後の公式戦" },
  { id: "s-1017-ground", date: "2026-10-17", category: "連絡", title: "競技場利用不可" },
  { id: "s-1018-mita", date: "2026-10-18", category: "行事", title: "連合三田会", detail: "競技場利用不可" },
  { id: "s-1023-prep", date: "2026-10-23", category: "行事", title: "慶大競技会 前日準備", time: "16:00" },
  { id: "s-1024-meet", date: "2026-10-24", endDate: "2026-10-25", category: "試合", title: "第29回慶大競技会 兼 第2回慶大混成競技会" },
  { id: "s-1030-prep", date: "2026-10-30", category: "行事", title: "ALL KEIO 前日準備" },
  { id: "s-1031-allkeio", date: "2026-10-31", category: "行事", title: "ALL KEIO" },
];

export const SCHEDULE_OVERRIDES: MeetOverride[] = [
  { id: "s-o-1001", from: "2026-10-01", to: "2026-10-01", kind: "none", note: "中等部運動会のため" },
  { id: "s-o-1003", from: "2026-10-03", to: "2026-10-03", kind: "time", time: "10:00", scope: "全体", note: "109参加" },
  { id: "s-o-1006", from: "2026-10-06", to: "2026-10-06", kind: "time", time: "16:45", scope: "ブロック", note: "塾高運動会設営のため" },
  { id: "s-o-1007", from: "2026-10-07", to: "2026-10-07", kind: "time", time: "18:00", scope: "全体", note: "塾高運動会のため" },
  { id: "s-o-1018", from: "2026-10-18", to: "2026-10-18", kind: "none", note: "連合三田会・競技場利用不可" },
];

/** 月ごとのお知らせ（"YYYY-MM"） */
export const NOTICES: Record<string, string> = {
  "2026-10": "イレギュラーが非常に多い月となります。全員必ずスケジュールを把握するようよろしくお願いします。",
};
