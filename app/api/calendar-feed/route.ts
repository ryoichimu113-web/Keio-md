import { NextResponse } from "next/server";

/** カレンダー配信のパス（トークン込み）。サインインを使う設定なら middleware で守られる */
export async function GET() {
  const token = process.env.CALENDAR_FEED_TOKEN;
  return NextResponse.json({ path: `/api/calendar.ics${token ? `?token=${encodeURIComponent(token)}` : ""}` });
}
