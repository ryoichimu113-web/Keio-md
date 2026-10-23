export type Category = "練習" | "試合" | "MTG" | "臨時オフ" | "合宿";

export const CATEGORIES: Category[] = ["練習", "試合", "MTG", "臨時オフ", "合宿"];

export const CATEGORY_STYLE: Record<Category, string> = {
  練習: "bg-blue-100 text-keio-navy",
  試合: "bg-red-100 text-keio-red",
  MTG: "bg-emerald-100 text-emerald-800",
  臨時オフ: "bg-slate-600 text-white",
  合宿: "bg-amber-100 text-amber-800",
};

export const CATEGORY_DOT: Record<Category, string> = {
  練習: "bg-keio-navy",
  試合: "bg-keio-red",
  MTG: "bg-emerald-600",
  臨時オフ: "bg-slate-600",
  合宿: "bg-amber-500",
};

export type Role = "管理者" | "予定編集" | "部員";

export const ROLES: Role[] = ["管理者", "予定編集", "部員"];

export type Member = {
  id: string;
  name: string;
  grade: number;
  role: Role;
};

export type ScheduleEvent = {
  id: string;
  date: string;
  /** 複数日にまたがる予定の最終日 */
  endDate?: string;
  category: Category;
  title: string;
  place?: string;
  detail?: string;
  createdBy?: string;
};

/** 基本の集合時間を上書きする期間 */
export type MeetOverride = {
  id: string;
  from: string;
  to: string;
  kind: "time" | "off" | "none";
  /** "09:00" */
  time?: string;
  excludeWeekdays?: number[];
  note?: string;
  /** 連動している予定 */
  eventId?: string;
  createdBy: string;
};

/** 集合欠の連絡（日単位） */
export type Absence = {
  date: string;
  memberId: string;
  reason?: string;
};

export type LogType = "ジョグ" | "ポイント" | "その他";

export const LOG_TYPES: LogType[] = ["ジョグ", "ポイント", "その他"];

export const LOG_TYPE_STYLE: Record<LogType, string> = {
  ジョグ: "bg-emerald-100 text-emerald-800",
  ポイント: "bg-red-100 text-keio-red",
  その他: "bg-slate-200 text-slate-700",
};

export const CONDITIONS = ["😀", "🙂", "😐", "😣"] as const;

export type Condition = (typeof CONDITIONS)[number];

export type Split = {
  /** "1000m" */
  label: string;
  times: string[];
};

export type PracticeLog = {
  id: string;
  memberId: string;
  date: string;
  type: LogType;
  /** ポイント練習の名前（インターバル など） */
  title?: string;
  distanceKm: number;
  /** 主観的運動強度 1〜10 */
  rpe?: number;
  condition?: Condition;
  splits?: Split[];
  note?: string;
};

export type AppState = {
  meId: string;
  members: Member[];
  events: ScheduleEvent[];
  overrides: MeetOverride[];
  absences: Absence[];
  logs: PracticeLog[];
  /** Googleカレンダーの iCal 非公開アドレス */
  icalUrl?: string;
};
