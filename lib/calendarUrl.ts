/** 読み込んでよいカレンダーのホスト（それ以外への接続はしない） */
const ALLOWED_HOSTS = [/^calendar\.google\.com$/, /^p\d+-caldav\.icloud\.com$/, /^p\d+-calendars\.icloud\.com$/, /^outlook\.(live|office|office365)\.com$/];

/** webcal:// を https:// にして、許可したホストかを確かめる */
export function normalizeCalendarUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim().replace(/^webcals?:\/\//i, "https://"));
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.some((h) => h.test(url.hostname))) return null;
  return url;
}

export function calendarKind(url: string): string {
  const host = normalizeCalendarUrl(url)?.hostname ?? "";
  if (host.endsWith("icloud.com")) return "Appleカレンダー";
  if (host.startsWith("outlook.")) return "Outlook";
  return "Googleカレンダー";
}
