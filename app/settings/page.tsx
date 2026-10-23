"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/components/Toaster";
import { resetToSample, update, useAppState } from "@/lib/store";
import { inputClass, labelClass, primaryButton, secondaryButton } from "@/lib/ui";

const ICAL_PATTERN = /^https:\/\/calendar\.google\.com\/calendar\/ical\/.+\.ics$/;

export default function SettingsPage() {
  const state = useAppState();
  const [icalInput, setIcalInput] = useState("");
  const [slackConnected, setSlackConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/slack")
      .then((res) => res.json() as Promise<{ connected: boolean }>)
      .then((body) => setSlackConnected(body.connected))
      .catch(() => setSlackConnected(false));
  }, []);

  const header = <PageHeader label="設定" title="設定" />;
  if (!state) return header;

  const me = state.members.find((m) => m.id === state.meId);

  return (
    <>
      {header}
      <div className="space-y-5 p-4">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <label className={labelClass} htmlFor="me">使っている人（試作版の仮ログイン）</label>
          <select
            id="me"
            className={inputClass}
            value={state.meId}
            onChange={(e) => {
              const meId = e.target.value;
              update((s) => ({ ...s, meId }));
              toast("切り替えました");
            }}
          >
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}（{m.grade}年・{m.role}）
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">本番では「Slackでサインイン」に置き換えます。</p>
        </section>

        {me?.role === "管理者" && (
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-1 text-sm font-bold">管理者画面</h2>
            <p className="mb-2 text-xs text-slate-500">部員の追加・編集と、予定を追加できる人（予定編集の権限）の設定ができます。</p>
            <Link className={`${primaryButton} block text-center`} href="/admin">
              管理者画面を開く
            </Link>
          </section>
        )}

        <section id="google" className="scroll-mt-4 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-bold">Googleカレンダー連携</h2>
          <p className="mb-3 text-xs text-slate-500">Googleカレンダーの予定を、カレンダーの「個人」タブに表示します（読み取りのみ）。</p>
          {state.icalUrl ? (
            <div className="space-y-3">
              <p className="text-sm">
                状態：<span className="font-bold text-emerald-700">連携済み</span>
              </p>
              <button
                className={`${secondaryButton} w-full`}
                onClick={() => {
                  update((s) => ({ ...s, icalUrl: undefined }));
                  toast("連携を解除しました");
                }}
              >
                連携を解除する
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <ol className="list-decimal space-y-1 pl-5 text-xs text-slate-600">
                <li>
                  <span className="font-bold">パソコンのブラウザ</span>で Googleカレンダーを開く（スマホのアプリでは表示されません）
                </li>
                <li>右上の歯車 →「設定」→ 左のメニューで、取り込みたいカレンダーを選ぶ</li>
                <li>「カレンダーの統合」の「iCal 形式の非公開アドレス」をコピー</li>
                <li>コピーしたURLを下に貼り付けて「連携する」</li>
              </ol>
              <input
                className={inputClass}
                placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
                autoComplete="off"
                spellCheck={false}
                value={icalInput}
                onChange={(e) => setIcalInput(e.target.value)}
              />
              {icalInput.trim() && !ICAL_PATTERN.test(icalInput.trim()) && (
                <p className="text-xs text-keio-red">「https://calendar.google.com/calendar/ical/」で始まり「.ics」で終わるURLを貼り付けてください。</p>
              )}
              <button
                className={`${primaryButton} w-full`}
                disabled={!ICAL_PATTERN.test(icalInput.trim())}
                onClick={() => {
                  const icalUrl = icalInput.trim();
                  update((s) => ({ ...s, icalUrl }));
                  setIcalInput("");
                  toast("連携しました");
                }}
              >
                連携する
              </button>
              <p className="text-[11px] leading-relaxed text-slate-500">
                ⚠️ このURLを知っている人は、あなたの予定をすべて見られます。他の人には教えないでください。試作版では、URLはこの端末の中にだけ保存されます。漏れてしまったときは、Googleカレンダーの同じ画面で「リセット」すると無効にできます。
              </p>
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold">Slack連携</h2>
          <p className="text-sm">
            状態：
            {slackConnected ? (
              <span className="font-bold text-emerald-700">接続済み</span>
            ) : (
              <span className="font-bold text-slate-500">{slackConnected === null ? "確認中…" : "未接続"}</span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            予定を追加すると、Slackのチャンネルに自動で投稿されます。接続するには、SlackでIncoming Webhookを作り、そのURLをサーバーの環境変数 SLACK_WEBHOOK_URL に設定します。
          </p>
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
          <p className="mb-2 text-xs text-slate-500">試作版のデータはこの端末のブラウザにだけ保存されています。</p>
          <button
            className={`${secondaryButton} w-full text-keio-red`}
            onClick={() => {
              if (!confirm("入力したデータをすべて消して、サンプルデータに戻しますか？")) return;
              resetToSample();
              toast("サンプルデータに戻しました");
            }}
          >
            サンプルデータに戻す
          </button>
        </section>
      </div>
    </>
  );
}
