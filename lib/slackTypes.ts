import type { Role } from "./types";

export type SlackMember = { id: string; name: string; role: Role };

export type MenuEntry = { memberId: string; name: string; text: string };

/** #01_メニュー設定 の1日分 */
export type MenuDay = { date: string; tags: string[]; entries: MenuEntry[] };

export type SlackAbsence = { date: string; memberId: string; name: string; reason: string };

export type SlackData = {
  /** Slack のボットが設定されているか */
  connected: boolean;
  /** Slack でサインインしているか（サインインを使う設定のときだけ） */
  me: { id: string; name: string } | null;
  authRequired: boolean;
  members: SlackMember[];
  menus: MenuDay[];
  absences: SlackAbsence[];
  error?: string;
};
