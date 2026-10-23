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
  臨時オフ: "bg-slate-500",
  合宿: "bg-amber-500",
};

export type Member = {
  id: string;
  name: string;
  grade: number;
};

export type ScheduleEvent = {
  id: string;
  date: string;
  category: Category;
  title: string;
  /** "10:00" */
  meetTime?: string;
  place?: string;
  detail?: string;
};

/** 集合欠の連絡（日単位） */
export type Absence = {
  date: string;
  memberId: string;
  reason?: string;
};

export type Condition = "◎" | "○" | "△" | "×";

export type PracticeLog = {
  id: string;
  date: string;
  menu: string;
  detail?: string;
  distanceKm: number;
  durationMin?: number;
  /** 主観的運動強度 1〜10 */
  rpe?: number;
  condition?: Condition;
  note?: string;
};

export type AppState = {
  meId: string;
  /** 定休日の曜日（0=日〜6=土） */
  offWeekday: number;
  members: Member[];
  events: ScheduleEvent[];
  absences: Absence[];
  logs: PracticeLog[];
};
