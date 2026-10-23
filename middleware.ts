import { type NextRequest, NextResponse } from "next/server";
import { authEnabled, readSession, SESSION_COOKIE } from "@/lib/server/session";

/** Slack サインインを使う設定のときは、サインインしていない人を /signin に送る */
export async function middleware(request: NextRequest) {
  if (!authEnabled()) return NextResponse.next();
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "サインインしてください" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // サインイン画面・認証・カレンダー配信・静的ファイルは除く
  matcher: ["/((?!signin|api/auth|api/calendar\\.ics|_next/|icon-|manifest\\.webmanifest|sw\\.js|favicon).*)"],
};
