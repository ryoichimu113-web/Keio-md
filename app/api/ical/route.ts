import { NextResponse } from "next/server";
import { normalizeCalendarUrl } from "@/lib/calendarUrl";
import { parseIcal } from "@/lib/ical";

/** Google・iCloud・Outlook の iCal を取得して予定の一覧を返す（ブラウザから直接は CORS で読めないため） */
export async function GET(request: Request) {
  let target = normalizeCalendarUrl(new URL(request.url).searchParams.get("url") ?? "");
  if (!target) {
    return NextResponse.json({ error: "Googleカレンダー・iCloud・Outlook の公開／非公開アドレスを指定してください" }, { status: 400 });
  }

  try {
    // iCloud は別のサーバーへ転送することがあるので、転送先も毎回確かめる
    for (let hop = 0; hop < 4; hop++) {
      const res = await fetch(target, { cache: "no-store", redirect: "manual", headers: { Accept: "text/calendar" } });
      if (res.status >= 300 && res.status < 400) {
        const next = normalizeCalendarUrl(new URL(res.headers.get("location") ?? "", target).toString());
        if (!next) return NextResponse.json({ error: "取得に失敗しました（転送先が不正です）" }, { status: 502 });
        target = next;
        continue;
      }
      if (!res.ok) return NextResponse.json({ error: `取得に失敗しました（${res.status}）` }, { status: 502 });
      return NextResponse.json({ events: parseIcal(await res.text()) });
    }
    return NextResponse.json({ error: "取得に失敗しました（転送が多すぎます）" }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 502 });
  }
}
