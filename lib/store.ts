"use client";

import { useSyncExternalStore } from "react";
import { todayKey } from "./date";
import { createSample } from "./sample";
import type { AppState } from "./types";

const STORAGE_KEY = "keio-md:v1";

let state: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // 読めないときはサンプルで始める
  }
  return createSample(todayKey());
}

function getState(): AppState {
  if (!state) state = load();
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function update(fn: (s: AppState) => AppState) {
  state = fn(getState());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 保存できなくても画面上は反映する
  }
  listeners.forEach((l) => l());
}

export function resetToSample() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  state = createSample(todayKey());
  listeners.forEach((l) => l());
}

/** サーバー描画中は null */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getState, () => null);
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
