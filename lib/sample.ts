import { addDays } from "./date";
import type { AppState, Member, PracticeLog, ScheduleEvent } from "./types";

const MEMBERS: Member[] = [
  { id: "m1", name: "山田 大輝", grade: 3, role: "管理者" },
  { id: "m2", name: "佐藤 健太", grade: 4, role: "管理者" },
  { id: "m3", name: "鈴木 葵", grade: 2, role: "部員" },
  { id: "m4", name: "高橋 蓮", grade: 1, role: "部員" },
  { id: "m5", name: "伊藤 美咲", grade: 3, role: "予定編集" },
  { id: "m6", name: "渡辺 陸", grade: 2, role: "部員" },
];

/** ジョグの距離と RPE の繰り返し */
const JOG_KM = [14, 9, 8, 10, 12, 6];
const JOG_RPE = [4, 5, 3, 4, 5, 3];

function myLogs(d: (n: number) => string): PracticeLog[] {
  const logs: PracticeLog[] = [
    {
      id: "l1",
      memberId: "m1",
      date: d(-1),
      type: "ポイント",
      title: "スピード",
      distanceKm: 7,
      rpe: 7,
      condition: "🙂",
      splits: [{ label: "200m", times: ["29.8", "29.6", "29.9", "29.7", "29.5", "29.8", "30.1", "29.6", "29.4", "29.0"] }],
      note: "後半もフォームを維持できた",
    },
    { id: "l2", memberId: "m1", date: d(-2), type: "ジョグ", distanceKm: 12, rpe: 3, condition: "🙂", note: "脚の張りなし" },
    {
      id: "l3",
      memberId: "m1",
      date: d(-3),
      type: "ポイント",
      title: "インターバル",
      distanceKm: 10.5,
      rpe: 8,
      condition: "😀",
      splits: [{ label: "1000m", times: ["2'54", "2'51", "2'50", "2'47", "2'44"] }],
      note: "ラスト1本は余裕あり。次は2'43まで上げたい",
    },
  ];
  // 4日前から41日前まで、7日おきに休み
  for (let i = 4; i <= 41; i++) {
    if (i % 7 === 0) continue;
    const k = (i - 4) % 6;
    logs.push({ id: `l${i}`, memberId: "m1", date: d(-i), type: "ジョグ", distanceKm: JOG_KM[k], rpe: JOG_RPE[k], condition: "🙂" });
  }
  return logs;
}

/** ブロック全体で見せるための他の部員の記録 */
function othersLogs(d: (n: number) => string): PracticeLog[] {
  const logs: PracticeLog[] = [];
  const base: Record<string, number> = { m2: 13, m3: 10, m4: 8, m5: 11, m6: 9 };
  for (const [memberId, km] of Object.entries(base)) {
    for (let i = 1; i <= 20; i++) {
      if (i % 7 === 0) continue;
      const point = i % 7 === 3;
      logs.push({
        id: `${memberId}-${i}`,
        memberId,
        date: d(-i),
        type: point ? "ポイント" : "ジョグ",
        title: point ? "インターバル" : undefined,
        distanceKm: point ? km - 1.5 : km + ((i * 3) % 5) - 2,
        rpe: point ? 8 : 4,
        condition: "🙂",
      });
    }
  }
  return logs;
}

/** 今日を基準にした架空のサンプルデータ */
export function createSample(today: string): AppState {
  const d = (n: number) => addDays(today, n);

  const events: ScheduleEvent[] = [
    { id: "e1", date: d(1), category: "練習", title: "ペース走", place: "日吉陸上競技場", detail: "8000m ペース走（3'20/km）", createdBy: "m2" },
    { id: "e2", date: d(1), category: "試合", title: "部内記録会", place: "日吉陸上競技場", detail: "800m / 1500m\n招集 13:30", createdBy: "m2" },
    { id: "e3", date: d(2), category: "練習", title: "レペティション", place: "日吉陸上競技場", detail: "1000m×3（r=10分）", createdBy: "m2" },
    { id: "e4", date: d(5), category: "MTG", title: "ブロックMTG", place: "日吉 部室", detail: "冬季練習の方針について", createdBy: "m5" },
    { id: "e5", date: d(9), category: "臨時オフ", title: "臨時オフ", createdBy: "m2" },
    { id: "e6", date: d(12), endDate: d(15), category: "合宿", title: "冬季強化合宿", place: "菅平高原", createdBy: "m2" },
  ];

  return {
    meId: "m1",
    members: MEMBERS,
    events,
    overrides: [
      { id: "o1", from: d(9), to: d(9), kind: "off", eventId: "e5", createdBy: "m2" },
      { id: "o2", from: d(12), to: d(15), kind: "none", eventId: "e6", createdBy: "m2" },
      { id: "o3", from: d(20), to: d(30), kind: "time", time: "09:00", excludeWeekdays: [1, 5], note: "休暇期間（例）", createdBy: "m2" },
    ],
    absences: [
      { date: d(1), memberId: "m3", reason: "授業" },
      { date: d(1), memberId: "m4", reason: "通院" },
      { date: d(2), memberId: "m6", reason: "就活" },
    ],
    logs: [...myLogs(d), ...othersLogs(d)],
  };
}
