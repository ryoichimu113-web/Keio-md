"use client";

import { useSlackData } from "./slackData";
import { useAppState } from "./store";
import type { Member } from "./types";

/** 自分。Slack でサインインしていればその人、そうでなければ設定で選んだ人 */
export function useMe(): Member | null {
  const slack = useSlackData();
  const state = useAppState();
  if (slack?.me) {
    return slack.members.find((m) => m.id === slack.me!.id) ?? { id: slack.me.id, name: slack.me.name, role: "部員" };
  }
  return slack?.members.find((m) => m.id === state?.meId) ?? null;
}

/** 予定を追加・集合時間を変更できるか。Slack 未接続（試作）のときは誰でも */
export function canEditSchedule(me: Member | null, slackConnected: boolean): boolean {
  if (!slackConnected) return true;
  return me?.role === "管理者" || me?.role === "予定編集";
}
