import { NextResponse } from "next/server";
import { canReadMemberData, currentSession } from "@/lib/server/auth";
import { authEnabled } from "@/lib/server/session";
import { getAbsences, getMembers, getMenus, slackConfig } from "@/lib/server/slack";
import type { SlackData } from "@/lib/slackTypes";

export const dynamic = "force-dynamic";

/** Slack から部員・メニュー・集合欠をまとめて返す */
export async function GET() {
  const session = await currentSession();
  const base: SlackData = {
    connected: Boolean(slackConfig.token()),
    me: session ? { id: session.uid, name: session.name } : null,
    authRequired: authEnabled(),
    members: [],
    menus: [],
    absences: [],
  };
  if (!base.connected) return NextResponse.json(base);
  if (!(await canReadMemberData())) {
    return NextResponse.json({ ...base, error: "部員の情報を表示するには、Slack サインインの設定が必要です" });
  }
  try {
    const [members, menus, absences] = await Promise.all([getMembers(), getMenus(), getAbsences()]);
    return NextResponse.json({ ...base, members, menus, absences } satisfies SlackData);
  } catch (e) {
    return NextResponse.json({ ...base, error: (e as Error).message } satisfies SlackData, { status: 502 });
  }
}
