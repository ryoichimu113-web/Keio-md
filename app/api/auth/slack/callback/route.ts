import { type NextRequest, NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, STATE_COOKIE } from "@/lib/server/session";

type TokenResponse = { ok: boolean; access_token?: string; error?: string };
type UserInfo = { ok: boolean; sub?: string; name?: string; "https://slack.com/team_id"?: string; error?: string };

function fail(origin: string, reason: string) {
  return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(reason)}`);
}

export async function GET(request: NextRequest) {
  const origin = process.env.APP_URL ?? request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || state !== request.cookies.get(STATE_COOKIE)?.value) return fail(origin, "もう一度お試しください");

  const token = (await (
    await fetch("https://slack.com/api/openid.connect.token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID ?? "",
        client_secret: process.env.SLACK_CLIENT_SECRET ?? "",
        code,
        redirect_uri: `${origin}/api/auth/slack/callback`,
      }),
    })
  ).json()) as TokenResponse;
  if (!token.ok || !token.access_token) return fail(origin, "Slack でのサインインに失敗しました");

  const info = (await (
    await fetch("https://slack.com/api/openid.connect.userInfo", { headers: { Authorization: `Bearer ${token.access_token}` } })
  ).json()) as UserInfo;
  if (!info.ok || !info.sub) return fail(origin, "Slack でのサインインに失敗しました");
  if (process.env.SLACK_TEAM_ID && info["https://slack.com/team_id"] !== process.env.SLACK_TEAM_ID) {
    return fail(origin, "部の Slack ワークスペースのアカウントでサインインしてください");
  }

  const session = await createSession(info.sub, info.name ?? "");
  const res = NextResponse.redirect(`${origin}/`);
  res.cookies.set(SESSION_COOKIE, session.value, { httpOnly: true, secure: true, sameSite: "lax", maxAge: session.maxAge, path: "/" });
  res.cookies.delete(STATE_COOKIE);
  return res;
}
