"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/components/Toaster";
import { useMe } from "@/lib/me";
import { useSlackData } from "@/lib/slackData";
import { type Role, ROLES } from "@/lib/types";

const ROLE_HELP: Record<Role, string> = {
  管理者: "管理者画面・予定の追加・集合時間の変更",
  予定編集: "予定の追加・集合時間の変更",
  部員: "閲覧・集合欠の連絡・練習記録",
};

const ROLE_ENV: Record<Role, string | null> = { 管理者: "SLACK_ADMIN_IDS", 予定編集: "SLACK_EDITOR_IDS", 部員: null };

export default function AdminPage() {
  const slack = useSlackData();
  const me = useMe();

  const header = (
    <PageHeader
      label="設定"
      title="管理者画面"
      right={
        <Link href="/settings" className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
          戻る
        </Link>
      }
    />
  );
  if (!slack) return header;

  if (me?.role !== "管理者") {
    return (
      <>
        {header}
        <p className="p-4 text-sm text-slate-500">管理者だけが開けます。</p>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="space-y-5 p-4">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold">権限</h2>
          <ul className="space-y-1 text-xs text-slate-600">
            {ROLES.map((r) => (
              <li key={r}>
                <span className="font-bold">{r}</span>：{ROLE_HELP[r]}
                {ROLE_ENV[r] && <span className="ml-1 font-mono text-[10px] text-slate-400">{ROLE_ENV[r]}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">
            権限は Vercel の環境変数に Slack のユーザーID をカンマ区切りで書いて設定します。ID をタップするとコピーできます。
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">部員（Slack から {slack.members.length}人）</h2>
          <ul className="divide-y divide-slate-100 rounded-xl bg-white shadow-sm">
            {slack.members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 font-bold">{m.name}</span>
                <span className={`text-xs font-bold ${m.role === "部員" ? "text-slate-400" : "text-keio-navy"}`}>{m.role}</span>
                <button
                  className="font-mono text-[10px] text-slate-400"
                  onClick={() => navigator.clipboard.writeText(m.id).then(() => toast("IDをコピーしました"))}
                >
                  {m.id}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">
            部員は SLACK_MEMBER_CHANNEL_ID のチャンネルのメンバーです（未設定なら、最近メニューか集合欠を投稿した人）。
          </p>
        </section>
      </div>
    </>
  );
}
