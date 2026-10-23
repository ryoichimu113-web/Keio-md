import { NextResponse } from "next/server";

const webhook = () => process.env.SLACK_WEBHOOK_URL;

export async function GET() {
  return NextResponse.json({ connected: Boolean(webhook()) });
}

/** 予定の追加を Slack に投稿する */
export async function POST(request: Request) {
  const url = webhook();
  if (!url) return NextResponse.json({ posted: false });
  const { text } = (await request.json()) as { text?: unknown };
  if (typeof text !== "string" || !text || text.length > 2000) {
    return NextResponse.json({ error: "text が必要です" }, { status: 400 });
  }
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  return NextResponse.json({ posted: res.ok }, { status: res.ok ? 200 : 502 });
}
