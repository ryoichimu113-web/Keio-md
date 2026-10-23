export type Category = "練習" | "試合" | "行事" | "連絡" | "MTG" | "臨時オフ" | "合宿";

export const CATEGORIES: Category[] = ["練習", "試合", "行事", "連絡", "MTG", "臨時オフ", "合宿"];

export const CATEGORY_STYLE: Record<Category, string> = {
  練習: "bg-blue-100 text-keio-navy",
  試合: "bg-red-100 text-keio-red",
  行事: "bg-violet-100 text-violet-800",
  連絡: "bg-orange-100 text-orange-800",
  MTG: "bg-emerald-100 text-emerald-800",
  臨時オフ: "bg-slate-600 text-white",
  合宿: "bg-amber-100 text-amber-800",
};

export const CATEGORY_DOT: Record<Category, string> = {
  練習: "bg-keio-navy",
  試合: "bg-keio-red",
  行事: "bg-violet-500",
  連絡: "bg-orange-500",
  MTG: "bg-emerald-600",
  臨時オフ: "bg-slate-600",
  合宿: "bg-amber-500",
};

export type Role = "管理者" | "予定編集" | "部員";

export const ROLES: Role[] = ["管理者", "予定編集", "部員"];

/** 部員（id は Slack のユーザーID） */
export type Member = {
  id: string;
  name: string;
  role: Role;
};

export type ScheduleEvent = {
  id: string;
  date: string;
  /** 複数日にまたがる予定の最終日 */
  endDate?: string;
  category: Category;
  title: string;
  /** 開始時刻 "9:00" */
  time?: string;
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
  /** 全体集合／ブロック集合 */
  scope?: "全体" | "ブロック";
  excludeWeekdays?: number[];
  note?: string;
  /** 連動している予定 */
  eventId?: string;
  /** 登録した人の名前。部の予定表から入れたものは undefined */
  createdBy?: string;
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

/** 個人の予定として読み込むカレンダー（iCal） */
export type CalendarFeed = {
  id: string;
  name: string;
  url: string;
};

/** 端末に保存するデータ。部員・メニュー・集合欠は Slack から、部の予定は data/schedule.ts から読む */
export type AppState = {
  /** Slack サインインを使わないときに選ぶ自分 */
  meId?: string;
  /** この端末で追加した予定 */
  events: ScheduleEvent[];
  overrides: MeetOverride[];
  /** Slack 未接続のときの集合欠 */
  absences: Absence[];
  logs: PracticeLog[];
  calendars: CalendarFeed[];
};
