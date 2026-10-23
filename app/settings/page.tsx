"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/components/Toaster";
import { calendarKind, normalizeCalendarUrl } from "@/lib/calendarUrl";
import { useMe } from "@/lib/me";
import { useSlackData } from "@/lib/slackData";
import { clearLocalData, uid, update, useAppState } from "@/lib/store";
import { inputClass, labelClass, primaryButton, secondaryButton } from "@/lib/ui";

type Status = { bot: boolean; menuChannel: boolean; absenceChannel: boolean; webhook: boolean; auth: boolean };

const HOW_TO: Record<string, string[]> = {
  Googleカレンダー: [
    "パソコンのブラウザで Googleカレンダーを開く（スマホのアプリでは表示されません）",
    "右上の歯車 →「設定」→ 左のメニューで、取り込みたいカレンダーを選ぶ",
    "「カレンダーの統合」の「iCal 形式の非公開アドレス」をコピー",
  ],
  Appleカレンダー: [
    "iPhone の「カレンダー」→ 下の「カレンダー」→ 取り込みたいカレンダーの ⓘ",
    "「公開カレンダー」をオンにして「リンクを共有」→ コピー",
    "（Mac のカレンダーでは、カレンダー名を右クリック →「共有設定」→「公開カレンダー」）",
  ],
  Outlook: ["outlook.com の「設定」→「予定表」→「共有の予定表」", "「予定表を公開する」で「すべての詳細を表示可能」を選び、ICS のリンクをコピー"],
};

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`font-bold ${ok ? "text-emerald-700" : "text-slate-400"}`}>{ok ? "✓" : "－"}</span>
      {children}
    </li>
  );
}

export default function SettingsPage() {
  const state = useAppState();
  const slack = useSlackData();
  const me = useMe();
  const [status, setStatus] = useState<Status | null>(null);
  const [feedPath, setFeedPath] = useState<string | null>(null);
  const [withMeet, setWithMeet] = useState(true);
  const [calName, setCalName] = useState("");
  const [calUrl, setCalUrl] = useState("");
  const [howTo, setHowTo] = useState("Googleカレンダー");

  useEffect(() => {
    fetch("/api/slack/status")
      .then((res) => res.json() as Promise<Status>)
      .then(setStatus)
      .catch(() => {});
    fetch("/api/calendar-feed")
      .then((res) => res.json() as Promise<{ path: string }>)
      .then((body) => setFeedPath(body.path))
      .catch(() => {});
  }, []);

  const header = <PageHeader label="設定" title="設定" />;
  if (!state) return header;

  const feedUrl = feedPath ? new URL(`${feedPath}${withMeet ? `${feedPath.includes("?") ? "&" : "?"}meet=1` : ""}`, window.location.origin) : null;
  const webcal = feedUrl ? feedUrl.toString().replace(/^https?:/, "webcal:") : "";
  const validCal = normalizeCalendarUrl(calUrl) !== null;

  return (
    <>
      {header}
      <div className="space-y-5 p-4">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          {slack?.me ? (
            <>
              <p className={labelClass}>サインイン中</p>
              <p className="text-base font-bold">{slack.me.name}</p>
              <form action="/api/auth/logout" method="post" className="mt-2">
                <button className="text-xs font-bold text-slate-500 underline">サインアウト</button>
              </form>
            </>
          ) : slack?.connected && slack.members.length > 0 ? (
            <>
              <label className={labelClass} htmlFor="me">使っている人（仮ログイン）</label>
              <select
                id="me"
                className={inputClass}
                value={state.meId ?? ""}
                onChange={(e) => {
                  const meId = e.target.value || undefined;
                  update((s) => ({ ...s, meId }));
                  toast("切り替えました");
                }}
              >
                <option value="">選んでください</option>
                {slack.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}（{m.role}）
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">Slack サインインを設定すると、自動で自分になります。</p>
            </>
          ) : (
            <>
              <p className={labelClass}>使っている人</p>
              <p className="text-sm text-slate-600">Slack と連携すると、部員の名前が Slack から読み込まれます。</p>
            </>
          )}
        </section>

        {me?.role === "管理者" && (
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-1 text-sm font-bold">管理者画面</h2>
            <p className="mb-2 text-xs text-slate-500">部員の一覧と、予定を追加できる人（予定編集の権限）を確認できます。</p>
            <Link className={`${primaryButton} block text-center`} href="/admin">
              管理者画面を開く
            </Link>
          </section>
        )}

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold">Slack連携（KeioMD）</h2>
          {status ? (
            <ul className="space-y-1 text-sm">
              <Check ok={status.bot}>Slack アプリ（ボット）</Check>
              <Check ok={status.menuChannel}>#01_メニュー設定 から練習メニューを読み込む</Check>
              <Check ok={status.absenceChannel}>#01_集合欠 から集合欠を読み込む・送る</Check>
              <Check ok={status.auth}>Slackでサインイン</Check>
              <Check ok={status.webhook}>予定の追加を Slack に投稿</Check>
            </ul>
          ) : (
            <p className="text-sm text-slate-400">確認中…</p>
          )}
          {slack?.connected && !slack.error && (
            <p className="mt-2 text-xs text-slate-500">
              部員 {slack.members.length}人・メニュー {slack.menus.length}日分・集合欠 {slack.absences.length}件 を読み込みました。
            </p>
          )}
          {slack?.error && <p className="mt-2 text-xs text-keio-red">{slack.error}</p>}
          <p className="mt-2 text-xs text-slate-500">設定のしかたは、リポジトリの docs/SETUP.md を見てください。</p>
        </section>

        <section id="export" className="scroll-mt-4 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-bold">部の予定をカレンダーに書き出す</h2>
          <p className="mb-3 text-xs text-slate-500">
            Appleカレンダー・Googleカレンダー・Outlook で購読すると、部の予定と集合時間が自動で更新されます。
          </p>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={withMeet} onChange={(e) => setWithMeet(e.target.checked)} />
            毎日の集合時間も入れる
          </label>
          {feedUrl ? (
            <div className="space-y-2">
              <a className={`${primaryButton} block text-center`} href={webcal}>
                Appleカレンダーに追加
              </a>
              <a
                className={`${secondaryButton} block text-center`}
                href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`}
                target="_blank"
                rel="noreferrer"
              >
                Googleカレンダーに追加
              </a>
              <div className="flex gap-2">
                <button
                  className={`${secondaryButton} flex-1`}
                  onClick={() => {
                    navigator.clipboard.writeText(feedUrl.toString()).then(
                      () => toast("URLをコピーしました"),
                      () => toast("コピーできませんでした"),
                    );
                  }}
                >
                  URLをコピー
                </button>
                <a className={`${secondaryButton} flex-1 text-center`} href={feedUrl.toString()} download="keio-md.ics">
                  ファイルで保存
                </a>
              </div>
              <p className="text-[11px] text-slate-500">
                Outlook は「予定表を追加」→「Web から購読」に URL を貼り付けます。この端末だけで追加した予定は含まれません。
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">準備中…</p>
          )}
        </section>

        <section id="calendars" className="scroll-mt-4 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-bold">個人のカレンダーを読み込む</h2>
          <p className="mb-3 text-xs text-slate-500">
            自分のカレンダーの予定を、カレンダーの「個人」タブに表示します（読み取りのみ・いくつでも追加できます）。
          </p>
          {state.calendars.length > 0 && (
            <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {state.calendars.map((c) => (
                <li key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-bold">{c.name}</span>
                    <span className="ml-1 text-[11px] text-slate-400">{calendarKind(c.url)}</span>
                  </span>
                  <button
                    className="shrink-0 text-[11px] font-bold text-slate-400"
                    onClick={() => {
                      update((s) => ({ ...s, calendars: s.calendars.filter((x) => x.id !== c.id) }));
                      toast("連携を解除しました");
                    }}
                  >
                    解除
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mb-2 flex gap-1.5">
            {Object.keys(HOW_TO).map((k) => (
              <button
                key={k}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${howTo === k ? "bg-keio-navy text-white" : "bg-slate-100 text-slate-600"}`}
                onClick={() => setHowTo(k)}
              >
                {k.replace("カレンダー", "")}
              </button>
            ))}
          </div>
          <ol className="mb-3 list-decimal space-y-1 pl-5 text-xs text-slate-600">
            {HOW_TO[howTo].map((step) => (
              <li key={step}>{step}</li>
            ))}
            <li>コピーしたURLを下に貼り付けて「追加する」</li>
          </ol>
          <div className="space-y-2">
            <input className={inputClass} placeholder="名前（例：大学）" value={calName} onChange={(e) => setCalName(e.target.value)} />
            <input
              className={inputClass}
              placeholder="https://… または webcal://…"
              autoComplete="off"
              spellCheck={false}
              value={calUrl}
              onChange={(e) => setCalUrl(e.target.value)}
            />
            {calUrl.trim() && !validCal && (
              <p className="text-xs text-keio-red">Googleカレンダー・iCloud・Outlook のカレンダーのURLを貼り付けてください。</p>
            )}
            <button
              className={`${primaryButton} w-full`}
              disabled={!validCal}
              onClick={() => {
                const url = calUrl.trim();
                update((s) => ({ ...s, calendars: [...s.calendars, { id: uid(), name: calName.trim() || calendarKind(url), url }] }));
                setCalName("");
                setCalUrl("");
                toast("追加しました");
              }}
            >
              追加する
            </button>
            <p className="text-[11px] leading-relaxed text-slate-500">
              ⚠️ このURLを知っている人は、そのカレンダーの予定を見られます。他の人には教えないでください。URLはこの端末の中にだけ保存されます。
            </p>
          </div>
        </section>

        <section className="rounded-xl border-2 border-keio-red/30 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-bold">感想・要望を送る</h2>
          <p className="mb-2 text-xs text-slate-500">使いにくい点、欲しい機能、気づいた不具合など、何でも送ってください。</p>
          <p className="text-sm text-slate-600">Slackで作成者に直接送ってください。</p>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold">ホーム画面に追加する方法</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>iPhone（Safari）：共有ボタン →「ホーム画面に追加」</li>
            <li>Android（Chrome）：右上のメニュー →「ホーム画面に追加」または「アプリをインストール」</li>
          </ul>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-bold">データ</h2>
          <p className="mb-2 text-xs text-slate-500">
            練習記録・この端末で追加した予定・カレンダーの連携は、この端末のブラウザにだけ保存されています。
          </p>
          <button
            className={`${secondaryButton} w-full text-keio-red`}
            onClick={() => {
              if (!confirm("この端末に保存した練習記録などをすべて消しますか？")) return;
              clearLocalData();
              toast("消去しました");
            }}
          >
            この端末のデータを消す
          </button>
        </section>
      </div>
    </>
  );
}
