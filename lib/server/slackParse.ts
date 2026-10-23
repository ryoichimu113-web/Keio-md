/** Slack の投稿を読み取る（API に依存しない部分） */

const pad = (n: number) => String(n).padStart(2, "0");

/** Slack の ts を日本時間の "YYYY-MM-DD" に */
export function tsToDate(ts: string): string {
  const d = new Date((Number.parseFloat(ts) || 0) * 1000 + 9 * 3600 * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function shiftDate(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 投稿日をもとに、月日だけの日付に年を補う（年末年始をまたぐ場合も考える） */
function withYear(month: number, day: number, posted: string): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const postedYear = Number(posted.slice(0, 4));
  const postedMonth = Number(posted.slice(5, 7));
  let year = postedYear;
  if (month - postedMonth > 6) year--;
  if (postedMonth - month > 6) year++;
  const key = `${year}-${pad(month)}-${pad(day)}`;
  // 存在しない日付（2/30 など）を除く
  const d = new Date(`${key}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === key ? key : null;
}

/** 全角の数字・記号を半角に */
function normalize(text: string): string {
  return text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[／]/g, "/")
    .replace(/[，]/g, ",")
    .replace(/[〜～]/g, "~");
}

/** Slack の書式（<@U123>、<url|label>、:emoji:）を読みやすい文字に */
export function plainText(text: string): string {
  return text
    .replace(/<([^|>]+)\|([^>]+)>/g, "$2")
    .replace(/<[@#!][^>]*>/g, "")
    .replace(/<([^>]+)>/g, "$1")
    .replace(/:[a-z0-9_+-]+:/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/** #01_メニュー設定 の親投稿「10/25（日）【wttk】【MDC】」 */
export function parseMenuHeader(text: string, posted: string): { date: string; tags: string[] } | null {
  const t = normalize(plainText(text));
  const m = t.match(/^\s*(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  const date = withYear(Number(m[1]), Number(m[2]), posted);
  if (!date) return null;
  const tags = [...t.matchAll(/【([^】]+)】/g)].map((x) => x[1].trim()).filter(Boolean);
  return { date, tags };
}

/** スレッドの返信のうち、メニューではないもの（「↓」など） */
export function isMenuNoise(text: string): boolean {
  return /^[\s↓⬇︎⤵️👇.。・]*$/.test(plainText(text));
}

/**
 * 集合欠の投稿から日付を拾う。
 * 「10/24、10/25」「10/30, 31」「10/22(木)・10/29(木)」「10/24,25」「11/3~5」「明日」「本日」に対応。
 */
export function parseAbsenceDates(text: string, posted: string): string[] {
  const t = normalize(plainText(text));
  const dates = new Set<string>();
  const re = /(\d{1,2})\/(\d{1,2})(?:\s*[（(][^）)]{1,3}[）)])?((?:\s*[,、・~\-]\s*\d{1,2}(?![\/\d:*×])(?:\s*[（(][^）)]{1,3}[）)])?)*)/g;
  for (const m of t.matchAll(re)) {
    const month = Number(m[1]);
    const first = Number(m[2]);
    const firstKey = withYear(month, first, posted);
    if (!firstKey) continue;
    dates.add(firstKey);
    let prev = first;
    for (const part of m[3].matchAll(/([,、・~\-])\s*(\d{1,2})/g)) {
      const day = Number(part[2]);
      if (part[1] === "~" || part[1] === "-") {
        for (let d = prev + 1; d <= day && d - prev <= 14; d++) {
          const key = withYear(month, d, posted);
          if (key) dates.add(key);
        }
      } else {
        const key = withYear(month, day, posted);
        if (key) dates.add(key);
      }
      prev = day;
    }
  }
  // 「12/30~1/2」のように月をまたぐ期間
  for (const m of t.matchAll(/(\d{1,2})\/(\d{1,2})(?:\s*[（(][^）)]{1,3}[）)])?\s*~\s*(\d{1,2})\/(\d{1,2})/g)) {
    const from = withYear(Number(m[1]), Number(m[2]), posted);
    const to = withYear(Number(m[3]), Number(m[4]), posted);
    if (!from || !to) continue;
    for (let d = from, i = 0; d <= to && i <= 31; d = shiftDate(d, 1), i++) dates.add(d);
  }
  if (dates.size === 0) {
    if (/明後日|あさって/.test(t)) dates.add(shiftDate(posted, 2));
    else if (/明日|あした/.test(t)) dates.add(shiftDate(posted, 1));
    else if (/本日|今日/.test(t)) dates.add(posted);
  }
  return [...dates].sort();
}

/** 集合欠を取り消す投稿か */
export function isCancellation(text: string): boolean {
  return /取り?消|キャンセル|撤回/.test(text);
}

/** 挨拶などを除いた理由 */
export function absenceReason(text: string): string {
  return plainText(text)
    .replace(/お疲れ様です。?|お疲れさまです。?|おつかれさまです。?/g, "")
    .replace(/(どうぞ)?よろしくお願い(いた|致|し)?(します|申し上げます)。?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
