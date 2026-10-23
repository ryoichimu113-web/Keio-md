"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { showBanner } from "@/components/PrototypeBanner";
import { toast } from "@/components/Toaster";
import { WEEKDAYS } from "@/lib/date";
import { resetToSample, uid, update, useAppState } from "@/lib/store";
import { inputClass, labelClass, primaryButton, secondaryButton } from "@/lib/ui";

export default function SettingsPage() {
  const state = useAppState();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(1);

  if (!state) return <PageHeader title="設定" />;

  const members = [...state.members].sort((a, b) => b.grade - a.grade);

  return (
    <>
      <PageHeader title="設定" />
      <div className="space-y-5 p-4">
        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">プロフィール</h2>
          <div className="space-y-3 rounded-xl bg-white p-3 shadow-sm">
            <div>
              <label className={labelClass} htmlFor="me">自分</label>
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
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}（{m.grade}年）
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="off">定休日（オフの曜日）</label>
              <select
                id="off"
                className={inputClass}
                value={state.offWeekday}
                onChange={(e) => {
                  const offWeekday = Number(e.target.value);
                  update((s) => ({ ...s, offWeekday }));
                  toast("保存しました");
                }}
              >
                {WEEKDAYS.map((w, i) => (
                  <option key={w} value={i}>
                    {w}曜日
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">部員（{state.members.length}人）</h2>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="w-8 shrink-0 text-xs font-bold text-slate-400">{m.grade}年</span>
                  <span className="flex-1 font-bold">
                    {m.name}
                    {m.id === state.meId && <span className="ml-1 text-xs text-keio-red">（自分）</span>}
                  </span>
                  {m.id !== state.meId && (
                    <button
                      className="text-xs text-slate-400"
                      onClick={() => {
                        if (!confirm(`${m.name}さんを削除しますか？`)) return;
                        update((s) => ({
                          ...s,
                          members: s.members.filter((x) => x.id !== m.id),
                          absences: s.absences.filter((a) => a.memberId !== m.id),
                        }));
                      }}
                    >
                      削除
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <form
              className="flex gap-2 border-t border-slate-100 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                update((s) => ({ ...s, members: [...s.members, { id: uid(), name: name.trim(), grade }] }));
                setName("");
                toast("部員を追加しました");
              }}
            >
              <input className={inputClass} placeholder="名前" value={name} onChange={(e) => setName(e.target.value)} />
              <select className={`${inputClass} w-20 shrink-0`} value={grade} onChange={(e) => setGrade(Number(e.target.value))} aria-label="学年">
                {[1, 2, 3, 4].map((g) => (
                  <option key={g} value={g}>
                    {g}年
                  </option>
                ))}
              </select>
              <button className={`${primaryButton} shrink-0`} disabled={!name.trim()}>
                追加
              </button>
            </form>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">データ</h2>
          <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
            <button className={`${secondaryButton} w-full`} onClick={() => showBanner()}>
              試作版の注意書きを再表示
            </button>
            <button
              className="w-full rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-keio-red active:bg-red-50"
              onClick={() => {
                if (!confirm("入力したデータをすべて消して、サンプルデータに戻しますか？")) return;
                resetToSample();
                toast("サンプルデータに戻しました");
              }}
            >
              サンプルデータに戻す
            </button>
            <p className="text-[11px] text-slate-400">データはこの端末のブラウザにだけ保存されています。</p>
          </div>
        </section>
      </div>
    </>
  );
}
