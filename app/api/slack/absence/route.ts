import { NextResponse } from "next/server";
import { currentSession } from "@/lib/server/auth";
import { postAbsence } from "@/lib/server/slack";

/** アプリから集合欠を Slack に送る（Slack でサインインしている人だけ） */
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Slack でサインインしてください" }, { status: 401 });
  const { dates, reason } = (await request.json()) as { dates?: unknown; reason?: unknown };
  const valid = Array.isArray(dates) && dates.length > 0 && dates.length <= 31 && dates.every((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (!valid || (reason !== undefined && (typeof reason !== "string" || reason.length > 500))) {
    return NextResponse.json({ error: "入力が正しくありません" }, { status: 400 });
  }
  try {
    await postAbsence({ id: session.uid, name: session.name }, dates as string[], ((reason as string | undefined) ?? "").trim());
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
