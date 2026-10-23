/** 署名付きクッキーのセッション（middleware でも使えるよう Web Crypto のみ） */

export const SESSION_COOKIE = "md_session";
export const STATE_COOKIE = "md_oauth_state";
const MAX_AGE = 60 * 60 * 24 * 60;

export type Session = { uid: string; name: string; exp: number };

export const authEnabled = () => Boolean(process.env.SLACK_CLIENT_ID);

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): string {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function hmac(data: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET（16文字以上）が設定されていません");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function createSession(uid: string, name: string): Promise<{ value: string; maxAge: number }> {
  const session: Session = { uid, name, exp: Math.floor(Date.now() / 1000) + MAX_AGE };
  const body = b64url(enc.encode(JSON.stringify(session)));
  return { value: `${body}.${await hmac(body)}`, maxAge: MAX_AGE };
}

export async function readSession(value: string | undefined): Promise<Session | null> {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  try {
    const expected = await hmac(body);
    if (expected.length !== sig.length) return null;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    if (diff !== 0) return null;
    const session = JSON.parse(fromB64url(body)) as Session;
    return session.exp > Date.now() / 1000 ? session : null;
  } catch {
    return null;
  }
}

export function randomState(): string {
  return b64url(crypto.getRandomValues(new Uint8Array(24)));
}
