import "server-only";
import type { MenuDay, SlackAbsence, SlackMember } from "@/lib/slackTypes";
import type { Role } from "@/lib/types";
import { absenceReason, isCancellation, isMenuNoise, parseAbsenceDates, parseMenuHeader, plainText, tsToDate } from "./slackParse";

const API = process.env.SLACK_API_BASE ?? "https://slack.com/api";
const CACHE_MS = 3 * 60 * 1000;
const DAY = 24 * 3600;

export const slackConfig = {
  token: () => process.env.SLACK_BOT_TOKEN,
  menuChannel: () => process.env.SLACK_MENU_CHANNEL_ID ?? "",
  absenceChannel: () => process.env.SLACK_ABSENCE_CHANNEL_ID ?? "",
  memberChannel: () => process.env.SLACK_MEMBER_CHANNEL_ID ?? "",
};

type SlackMessage = {
  ts: string;
  user?: string;
  bot_id?: string;
  subtype?: string;
  text?: string;
  reply_count?: number;
  thread_ts?: string;
  metadata?: { event_type: string; event_payload: Record<string, unknown> };
};

type SlackUser = {
  id: string;
  deleted?: boolean;
  is_bot?: boolean;
  name: string;
  real_name?: string;
  profile?: { real_name?: string; display_name?: string };
};

async function call<T>(method: string, params: Record<string, string>, body?: Record<string, unknown>): Promise<T> {
  const token = slackConfig.token();
  if (!token) throw new Error("SLACK_BOT_TOKEN が設定されていません");
  const url = `${API}/${method}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json; charset=utf-8" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as { ok: boolean; error?: string } & T;
  if (!json.ok) throw new Error(`Slack API ${method}: ${json.error ?? res.status}`);
  return json;
}

/** 同じ結果を数分間使い回す（Slack の回数制限対策） */
const cache = new Map<string, { at: number; value: Promise<unknown> }>();
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { at: Date.now(), value });
  value.catch(() => cache.delete(key));
  return value;
}

async function history(channel: string, oldest: number): Promise<SlackMessage[]> {
  const messages: SlackMessage[] = [];
  let cursor = "";
  for (let page = 0; page < 5; page++) {
    const res = await call<{ messages: SlackMessage[]; response_metadata?: { next_cursor?: string } }>("conversations.history", {
      channel,
      oldest: String(oldest),
      limit: "200",
      include_all_metadata: "true",
      ...(cursor ? { cursor } : {}),
    });
    messages.push(...res.messages);
    cursor = res.response_metadata?.next_cursor ?? "";
    if (!cursor) break;
  }
  return messages;
}

async function replies(channel: string, ts: string): Promise<SlackMessage[]> {
  const res = await call<{ messages: SlackMessage[] }>("conversations.replies", { channel, ts, limit: "200" });
  return res.messages.filter((m) => m.ts !== ts);
}

function nameOf(u: SlackUser): string {
  return u.profile?.real_name || u.real_name || u.profile?.display_name || u.name;
}

function roleOf(id: string): Role {
  const list = (key: string) => (process.env[key] ?? "").split(",").map((s) => s.trim());
  if (list("SLACK_ADMIN_IDS").includes(id)) return "管理者";
  if (list("SLACK_EDITOR_IDS").includes(id)) return "予定編集";
  return "部員";
}

/** ワークスペースの全ユーザー（id → 名前） */
function users(): Promise<Map<string, string>> {
  return cached("users", async () => {
    const map = new Map<string, string>();
    let cursor = "";
    for (let page = 0; page < 10; page++) {
      const res = await call<{ members: SlackUser[]; response_metadata?: { next_cursor?: string } }>("users.list", {
        limit: "200",
        ...(cursor ? { cursor } : {}),
      });
      for (const u of res.members) if (!u.deleted && !u.is_bot && u.id !== "USLACKBOT") map.set(u.id, nameOf(u));
      cursor = res.response_metadata?.next_cursor ?? "";
      if (!cursor) break;
    }
    return map;
  });
}

async function channelMembers(channel: string): Promise<string[]> {
  return cached(`members:${channel}`, async () => {
    const ids: string[] = [];
    let cursor = "";
    for (let page = 0; page < 10; page++) {
      const res = await call<{ members: string[]; response_metadata?: { next_cursor?: string } }>("conversations.members", {
        channel,
        limit: "200",
        ...(cursor ? { cursor } : {}),
      });
      ids.push(...res.members);
      cursor = res.response_metadata?.next_cursor ?? "";
      if (!cursor) break;
    }
    return ids;
  });
}

/** #01_メニュー設定：前後2週間ほどの日ごとのメニュー */
export function getMenus(): Promise<MenuDay[]> {
  const channel = slackConfig.menuChannel();
  if (!channel) return Promise.resolve([]);
  return cached("menus", async () => {
    const [names, posts] = await Promise.all([users(), history(channel, Date.now() / 1000 - 35 * DAY)]);
    const today = tsToDate(String(Date.now() / 1000));
    const days = new Map<string, MenuDay>();
    const headers = posts
      .filter((p) => !p.thread_ts || p.thread_ts === p.ts)
      .map((p) => ({ post: p, header: parseMenuHeader(p.text ?? "", tsToDate(p.ts)) }))
      .filter((x): x is { post: SlackMessage; header: { date: string; tags: string[] } } => x.header !== null)
      // 古い順に処理して、同じ日付の投稿があれば新しいものを優先
      .sort((a, b) => Number(a.post.ts) - Number(b.post.ts));

    const inRange = headers.filter(({ header }) => Math.abs(Date.parse(header.date) - Date.parse(today)) <= 21 * DAY * 1000);
    // スレッドの返信は5件ずつ並行して取る
    const threadReplies = new Map<string, SlackMessage[]>();
    const withReplies = inRange.filter(({ post }) => post.reply_count);
    for (let i = 0; i < withReplies.length; i += 5) {
      const batch = withReplies.slice(i, i + 5);
      const results = await Promise.all(batch.map(({ post }) => replies(channel, post.ts)));
      batch.forEach(({ post }, j) => threadReplies.set(post.ts, results[j]));
    }

    for (const { post, header } of inRange) {
      const entries = new Map<string, string[]>();
      for (const r of threadReplies.get(post.ts) ?? []) {
        if (!r.user || !r.text || isMenuNoise(r.text)) continue;
        entries.set(r.user, [...(entries.get(r.user) ?? []), plainText(r.text)]);
      }
      days.set(header.date, {
        date: header.date,
        tags: header.tags,
        entries: [...entries].map(([memberId, texts]) => ({ memberId, name: names.get(memberId) ?? "（不明）", text: texts.join("\n") })),
      });
    }
    return [...days.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  });
}

/** #01_集合欠：直近の集合欠 */
export function getAbsences(): Promise<SlackAbsence[]> {
  const channel = slackConfig.absenceChannel();
  if (!channel) return Promise.resolve([]);
  return cached("absences", async () => {
    const [names, posts] = await Promise.all([users(), history(channel, Date.now() / 1000 - 45 * DAY)]);
    const byKey = new Map<string, SlackAbsence>();
    for (const p of [...posts].sort((a, b) => Number(a.ts) - Number(b.ts))) {
      if (p.thread_ts && p.thread_ts !== p.ts) continue;
      // アプリから送った集合欠は metadata に誰の分かが入っている
      const payload = p.metadata?.event_type === "md_absence" ? p.metadata.event_payload : null;
      const memberId = payload ? String(payload.member_id ?? "") : p.user;
      if (!memberId || (!payload && (p.bot_id || p.subtype))) continue;
      const dates = payload ? ((payload.dates as string[] | undefined) ?? []) : parseAbsenceDates(p.text ?? "", tsToDate(p.ts));
      const reason = payload ? String(payload.reason ?? "") : absenceReason(p.text ?? "");
      const cancel = !payload && isCancellation(p.text ?? "");
      for (const date of dates) {
        const key = `${date}:${memberId}`;
        if (cancel) byKey.delete(key);
        else byKey.set(key, { date, memberId, name: names.get(memberId) ?? "（不明）", reason });
      }
    }
    return [...byKey.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  });
}

/**
 * 部員の一覧。SLACK_MEMBER_CHANNEL_ID があればそのチャンネルのメンバー、
 * なければ最近メニューか集合欠を投稿した人（＝現役）。
 */
export async function getMembers(): Promise<SlackMember[]> {
  const names = await users();
  let ids: string[];
  const channel = slackConfig.memberChannel();
  if (channel) {
    ids = await channelMembers(channel);
  } else {
    const [menus, absences] = await Promise.all([getMenus(), getAbsences()]);
    ids = [...new Set([...menus.flatMap((d) => d.entries.map((e) => e.memberId)), ...absences.map((a) => a.memberId)])];
  }
  return ids
    .filter((id) => names.has(id))
    .map((id) => ({ id, name: names.get(id)!, role: roleOf(id) }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

/** アプリから集合欠を #01_集合欠 に投稿する */
export async function postAbsence(member: { id: string; name: string }, dates: string[], reason: string) {
  const channel = slackConfig.absenceChannel();
  if (!channel) throw new Error("SLACK_ABSENCE_CHANNEL_ID が設定されていません");
  const label = dates.map((d) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`).join("、");
  await call("chat.postMessage", {}, {
    channel,
    text: `${member.name}：${label} 集合欠${reason ? `（${reason}）` : ""}　※アプリから送信`,
    metadata: { event_type: "md_absence", event_payload: { member_id: member.id, dates, reason } },
  });
  cache.delete("absences");
}
