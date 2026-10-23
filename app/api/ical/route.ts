import { NextResponse } from "next/server";
import { parseIcal } from "@/lib/ical";

/** Googleカレンダーの非公開 iCal を取得して予定の一覧を返す（ブラウザから直接は CORS で読めないため） */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url") ?? "";
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ error: "URLが正しくありません" }, { status: 400 });
  }
  if (target.protocol !== "https:" || target.hostname !== "calendar.google.com" || !target.pathname.startsWith("/calendar/ical/")) {
    return NextResponse.json({ error: "Googleカレンダーの iCal アドレスを指定してください" }, { status: 400 });
  }

  try {
    const res = await fetch(target, { cache: "no-store", redirect: "error" });
    if (!res.ok) return NextResponse.json({ error: `取得に失敗しました（${res.status}）` }, { status: 502 });
    return NextResponse.json({ events: parseIcal(await res.text()) });
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 502 });
  }
}
