import "server-only";
import { cookies } from "next/headers";
import { authEnabled, readSession, type Session, SESSION_COOKIE } from "./session";

/** サインインしている人。サインインを使わない設定なら null */
export async function currentSession(): Promise<Session | null> {
  if (!authEnabled()) return null;
  return readSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * 部員の実名や集合欠の理由を返してよいか。
 * サインインを使う設定ならサインイン済みのときだけ。使わない設定では開発時のみ。
 */
export async function canReadMemberData(): Promise<boolean> {
  if (authEnabled()) return (await currentSession()) !== null;
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_PUBLIC_MEMBER_DATA === "1";
}
