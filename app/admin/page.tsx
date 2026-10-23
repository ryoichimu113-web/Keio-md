"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/components/Toaster";
import { uid, update, useAppState } from "@/lib/store";
import { type Member, type Role, ROLES } from "@/lib/types";
import { inputClass, labelClass, primaryButton } from "@/lib/ui";

const ROLE_HELP: Record<Role, string> = {
  管理者: "部員の管理・予定の追加・集合時間の変更",
  予定編集: "予定の追加・集合時間の変更",
  部員: "閲覧・集合欠の連絡・練習記録",
};

export default function AdminPage() {
  const state = useAppState();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(1);
  const [role, setRole] = useState<Role>("部員");

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
  if (!state) return header;

  if (state.members.find((m) => m.id === state.meId)?.role !== "管理者") {
    return (
      <>
        {header}
        <p className="p-4 text-sm text-slate-500">管理者だけが開けます。</p>
      </>
    );
  }

  const edit = (id: string, patch: Partial<Member>) =>
    update((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const adminCount = state.members.filter((m) => m.role === "管理者").length;

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
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">部員（{state.members.length}人）</h2>
          <ul className="space-y-2">
            {state.members.map((m) => {
              const lastAdmin = m.role === "管理者" && adminCount === 1;
              return (
                <li key={m.id} className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="flex gap-2">
                    <input
                      className={`${inputClass} py-1.5`}
                      aria-label="名前"
                      value={m.name}
                      onChange={(e) => edit(m.id, { name: e.target.value })}
                    />
                    <select
                      className={`${inputClass} w-20 shrink-0 py-1.5`}
                      aria-label="学年"
                      value={m.grade}
                      onChange={(e) => edit(m.id, { grade: Number(e.target.value) })}
                    >
                      {[1, 2, 3, 4].map((g) => (
                        <option key={g} value={g}>
                          {g}年
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      className={`${inputClass} py-1.5`}
                      aria-label="権限"
                      value={m.role}
                      disabled={lastAdmin}
                      onChange={(e) => edit(m.id, { role: e.target.value as Role })}
                    >
                      {ROLES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                    {m.id !== state.meId && (
                      <button
                        className="shrink-0 text-[11px] font-bold text-slate-400"
                        onClick={() => {
                          if (!confirm(`${m.name}さんを削除しますか？`)) return;
                          update((s) => ({
                            ...s,
                            members: s.members.filter((x) => x.id !== m.id),
                            absences: s.absences.filter((a) => a.memberId !== m.id),
                          }));
                          toast("削除しました");
                        }}
                      >
                        削除
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <form
          className="space-y-3 rounded-xl bg-white p-4 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            update((s) => ({ ...s, members: [...s.members, { id: uid(), name: name.trim(), grade, role }] }));
            setName("");
            toast("部員を追加しました");
          }}
        >
          <h2 className="text-sm font-bold">部員を追加</h2>
          <div>
            <label className={labelClass} htmlFor="new-name">名前</label>
            <input id="new-name" className={inputClass} placeholder="例：慶應 太郎" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass} htmlFor="new-grade">学年</label>
              <select id="new-grade" className={inputClass} value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                {[1, 2, 3, 4].map((g) => (
                  <option key={g} value={g}>
                    {g}年
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="new-role">権限</label>
              <select id="new-role" className={inputClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <button className={`${primaryButton} w-full`} disabled={!name.trim()}>
            追加する
          </button>
        </form>
      </div>
    </>
  );
}
