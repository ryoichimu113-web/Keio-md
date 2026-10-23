"use client";

import { useEffect, useState } from "react";
import type { PersonalEvent } from "./ical";

type Result = { status: "idle" | "loading" | "error"; events: PersonalEvent[]; error?: string };

const cache = new Map<string, PersonalEvent[]>();

/** 連携した Googleカレンダーの予定 */
export function usePersonalEvents(icalUrl?: string): Result {
  const [result, setResult] = useState<Result>({ status: "idle", events: [] });

  useEffect(() => {
    if (!icalUrl) {
      setResult({ status: "idle", events: [] });
      return;
    }
    const cached = cache.get(icalUrl);
    if (cached) {
      setResult({ status: "idle", events: cached });
      return;
    }
    let cancelled = false;
    setResult({ status: "loading", events: [] });
    fetch(`/api/ical?url=${encodeURIComponent(icalUrl)}`)
      .then(async (res) => {
        const body = (await res.json()) as { events?: PersonalEvent[]; error?: string };
        if (!res.ok || !body.events) throw new Error(body.error ?? "取得に失敗しました");
        cache.set(icalUrl, body.events);
        if (!cancelled) setResult({ status: "idle", events: body.events });
      })
      .catch((e: Error) => !cancelled && setResult({ status: "error", events: [], error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [icalUrl]);

  return result;
}

export function personalOn(events: PersonalEvent[], date: string) {
  return events.filter((e) => e.date <= date && date <= (e.endDate ?? e.date));
}
