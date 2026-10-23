import { NextResponse } from "next/server";
import { randomState, STATE_COOKIE } from "@/lib/server/session";

/** Sign in with Slack（OpenID Connect）を始める */
export async function GET(request: Request) {
  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "SLACK_CLIENT_ID が設定されていません" }, { status: 500 });
  const origin = process.env.APP_URL ?? new URL(request.url).origin;
  const state = randomState();
  const params = new URLSearchParams({
    response_type: "code",
    scope: "openid profile",
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/slack/callback`,
    state,
  });
  if (process.env.SLACK_TEAM_ID) params.set("team", process.env.SLACK_TEAM_ID);
  const res = NextResponse.redirect(`https://slack.com/openid/connect/authorize?${params}`);
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
