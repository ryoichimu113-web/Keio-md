"use client";

import { useSyncExternalStore } from "react";
import type { MenuDay, SlackAbsence, SlackData } from "./slackTypes";

let data: SlackData | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Slack の部員・メニュー・集合欠を読み込む（画面をまたいで使い回す） */
export function refreshSlackData(): Promise<void> {
  loading ??= fetch("/api/slack/data", { cache: "no-store" })
    .then(async (res) => {
      data = (await res.json()) as SlackData;
    })
    .catch(() => {
      data = { connected: false, me: null, authRequired: false, members: [], menus: [], absences: [], error: "Slack の情報を読み込めませんでした" };
    })
    .finally(() => {
      loading = null;
      listeners.forEach((l) => l());
    });
  return loading;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!data && !loading) void refreshSlackData();
  return () => listeners.delete(listener);
}

/** 読み込み中は null */
export function useSlackData(): SlackData | null {
  return useSyncExternalStore(
    subscribe,
    () => data,
    () => null,
  );
}

export function menuOn(slack: SlackData | null, date: string): MenuDay | undefined {
  return slack?.menus.find((m) => m.date === date);
}

export function slackAbsencesOn(slack: SlackData | null, date: string): SlackAbsence[] {
  return slack?.absences.filter((a) => a.date === date) ?? [];
}
