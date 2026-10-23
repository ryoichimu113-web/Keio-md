import { addDays, weekday } from "./date";
import type { AppState, Member, PracticeLog, ScheduleEvent } from "./types";

const MEMBERS: Member[] = [
  { id: "m1", name: "山田 大輝", grade: 3 },
  { id: "m2", name: "佐藤 健太", grade: 4 },
  { id: "m3", name: "鈴木 翔", grade: 2 },
  { id: "m4", name: "高橋 悠斗", grade: 1 },
  { id: "m5", name: "田中 蓮", grade: 3 },
  { id: "m6", name: "伊藤 陸", grade: 2 },
  { id: "m7", name: "渡辺 颯", grade: 1 },
];

const OFF_WEEKDAY = 5;

/** 今日を基準にした架空のサンプルデータ */
export function createSample(today: string): AppState {
  const d = (n: number) => addDays(today, n);

  const events: ScheduleEvent[] = [
    { id: "e1", date: d(-6), category: "練習", title: "インターバル", meetTime: "16:30", place: "日吉陸上競技場", detail: "400m×10（r=200mジョグ）" },
    { id: "e2", date: d(-4), category: "練習", title: "ジョグ", meetTime: "16:30", place: "日吉陸上競技場", detail: "60分ジョグ＋流し" },
    { id: "e3", date: d(-2), category: "練習", title: "ビルドアップ", meetTime: "16:30", place: "日吉陸上競技場", detail: "4000m ビルドアップ（3'40→3'10/km）" },
    { id: "e4", date: d(1), category: "練習", title: "ペース走", meetTime: "10:00", place: "日吉陸上競技場", detail: "8000m ペース走（3'20/km）" },
    { id: "e5", date: d(1), category: "試合", title: "部内記録会", place: "日吉陸上競技場", detail: "800m / 1500m\n招集 13:30" },
    { id: "e6", date: d(2), category: "練習", title: "レペティション", meetTime: "10:00", place: "日吉陸上競技場", detail: "1000m×3（r=10分）" },
    { id: "e7", date: d(5), category: "MTG", title: "ブロックMTG", meetTime: "16:45", place: "日吉 部室", detail: "冬季練習の方針について" },
    { id: "e8", date: d(9), category: "臨時オフ", title: "臨時オフ" },
    { id: "e9", date: d(12), category: "合宿", title: "冬季強化合宿", place: "菅平高原", detail: "1日目：移動・午後ジョグ" },
    { id: "e10", date: d(13), category: "合宿", title: "冬季強化合宿", place: "菅平高原", detail: "2日目：クロカン走" },
    { id: "e11", date: d(14), category: "合宿", title: "冬季強化合宿", place: "菅平高原", detail: "3日目：ロング走・帰京" },
    { id: "e12", date: d(20), category: "試合", title: "関東学生記録会", meetTime: "8:30", place: "未定", detail: "エントリー締切に注意" },
  ];

  // 曜日ごとのメニュー（月〜木で 43.5km）
  const byWeekday: Record<number, [string, number, string]> = {
    1: ["ジョグ", 12, "70分ジョグ"],
    2: ["インターバル", 8.5, "400m×10"],
    3: ["ジョグ", 14, "80分ジョグ"],
    4: ["ペース走", 9, "8000m ペース走"],
    6: ["ロング走", 16, "90分ロング"],
    0: ["ジョグ", 6, "40分ジョグ"],
  };
  const logs: PracticeLog[] = [];
  for (let i = 13; i >= 1; i--) {
    const date = d(-i);
    const wd = weekday(date);
    if (wd === OFF_WEEKDAY || !byWeekday[wd]) continue;
    const [menu, km, detail] = byWeekday[wd];
    logs.push({ id: `l${i}`, date, menu, detail, distanceKm: km, rpe: 5 + (i % 3), condition: i % 4 === 0 ? "△" : "○" });
  }

  return {
    meId: "m1",
    offWeekday: OFF_WEEKDAY,
    members: MEMBERS,
    events,
    absences: [
      { date: d(1), memberId: "m3", reason: "授業" },
      { date: d(1), memberId: "m4", reason: "通院" },
      { date: d(2), memberId: "m5", reason: "就活" },
    ],
    logs,
  };
}
