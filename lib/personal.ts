"use client";

import { useEffect, useState } from "react";
import type { PersonalEvent } from "./ical";
import type { CalendarFeed } from "./types";

export type FeedEvent = PersonalEvent & { feed: string };

type Result = { loading: boolean; events: FeedEvent[]; errors: string[] };

const cache = new Map<string, PersonalEvent[]>();

async function load(feed: CalendarFeed): Promise<PersonalEvent[]> {
  const hit = cache.get(feed.url);
  if (hit) return hit;
  const res = await fetch(`/api/ical?url=${encodeURIComponent(feed.url)}`);
  const body = (await res.json()) as { events?: PersonalEvent[]; error?: string };
  if (!res.ok || !body.events) throw new Error(`${feed.name}：${body.error ?? "取得に失敗しました"}`);
  cache.set(feed.url, body.events);
  return body.events;
}

/** 連携したカレンダー（複数）の予定 */
export function usePersonalEvents(feeds: CalendarFeed[] | undefined): Result {
  const [result, setResult] = useState<Result>({ loading: false, events: [], errors: [] });
  const key = (feeds ?? []).map((f) => f.url).join("\n");

  useEffect(() => {
    const list = feeds ?? [];
    if (list.length === 0) {
      setResult({ loading: false, events: [], errors: [] });
      return;
    }
    let cancelled = false;
    setResult((r) => ({ ...r, loading: true }));
    Promise.allSettled(list.map(load)).then((settled) => {
      if (cancelled) return;
      const events: FeedEvent[] = [];
      const errors: string[] = [];
      settled.forEach((s, i) => {
        if (s.status === "fulfilled") events.push(...s.value.map((e) => ({ ...e, feed: list[i].name })));
        else errors.push((s.reason as Error).message);
      });
      setResult({ loading: false, events, errors });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return result;
}

export function personalOn(events: FeedEvent[], date: string) {
  return events
    .filter((e) => e.date <= date && date <= (e.endDate ?? e.date))
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
}
