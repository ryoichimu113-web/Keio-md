import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/server/session";
import { slackConfig } from "@/lib/server/slack";

export async function GET() {
  return NextResponse.json({
    bot: Boolean(slackConfig.token()),
    menuChannel: Boolean(slackConfig.menuChannel()),
    absenceChannel: Boolean(slackConfig.absenceChannel()),
    webhook: Boolean(process.env.SLACK_WEBHOOK_URL),
    auth: authEnabled(),
  });
}
