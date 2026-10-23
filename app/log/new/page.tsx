"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/components/Toaster";
import { todayKey } from "@/lib/date";
import { uid, update, useAppState } from "@/lib/store";
import { type Condition, CONDITIONS, LOG_TYPE_STYLE, LOG_TYPES, type LogType, type Split } from "@/lib/types";
import { inputClass, labelClass, primaryButton } from "@/lib/ui";

type SplitRow = { label: string; times: string };

/** "2'54 / 2'51, 2'50" のような入力をタイムの配列に */
function parseTimes(text: string): string[] {
  return text
    .split(/[\/,、\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function NewLogPage() {
  const state = useAppState();
  const router = useRouter();
  const [date, setDate] = useState(todayKey);
  const [type, setType] = useState<LogType>("ジョグ");
  const [title, setTitle] = useState("");
  const [distance, setDistance] = useState("");
  const [rpe, setRpe] = useState<number>();
  const [condition, setCondition] = useState<Condition>();
  const [splits, setSplits] = useState<SplitRow[]>([]);
  const [note, setNote] = useState("");

  const km = Number(distance);
  const valid = Boolean(state) && date !== "" && distance !== "" && Number.isFinite(km) && km >= 0;

  const setSplit = (i: number, row: Partial<SplitRow>) => setSplits((rows) => rows.map((r, j) => (j === i ? { ...r, ...row } : r)));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !state) return;
    const parsed: Split[] = splits
      .map((s) => ({ label: s.label.trim(), times: parseTimes(s.times) }))
      .filter((s) => s.label && s.times.length > 0);
    update((s) => ({
      ...s,
      logs: [
        ...s.logs,
        {
          id: uid(),
          memberId: s.meId,
          date,
          type,
          title: type !== "ジョグ" ? title.trim() || undefined : undefined,
          distanceKm: Math.round(km * 10) / 10,
          rpe,
          condition,
          splits: parsed.length ? parsed : undefined,
          note: note.trim() || undefined,
        },
      ],
    }));
    toast("記録しました");
    router.push("/log");
  };

  return (
    <>
      <PageHeader
        label="練習記録"
        title="記録する"
        right={
          <Link href="/log" className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
            戻る
          </Link>
        }
      />
      <form onSubmit={save} className="space-y-4 p-4">
        <section className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="date">日付</label>
              <input id="date" type="date" className={inputClass} value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="distance">距離（km）</label>
              <input
                id="distance"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                className={inputClass}
                placeholder="12"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className={labelClass}>種類</p>
            <div className="flex gap-2">
              {LOG_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={type === t}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold ${type === t ? LOG_TYPE_STYLE[t] + " ring-2 ring-current" : "bg-slate-100 text-slate-500"}`}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {type !== "ジョグ" && (
            <div>
              <label className={labelClass} htmlFor="title">メニュー名</label>
              <input
                id="title"
                className={inputClass}
                placeholder={type === "ポイント" ? "例：インターバル" : "例：補強"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          )}

          <div>
            <p className={labelClass}>RPE（きつさ 1〜10）</p>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={rpe === n}
                  className={`rounded-md py-1.5 text-xs font-bold ${rpe === n ? "bg-keio-navy text-white" : "bg-slate-100 text-slate-600"}`}
                  onClick={() => setRpe(rpe === n ? undefined : n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={labelClass}>体調</p>
            <div className="grid grid-cols-4 gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={condition === c}
                  className={`rounded-lg py-1.5 text-xl ${condition === c ? "bg-blue-100 ring-2 ring-keio-navy" : "bg-slate-100"}`}
                  onClick={() => setCondition(condition === c ? undefined : c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">タイム</h2>
            <button
              type="button"
              className="rounded-full border border-keio-navy px-3 py-1 text-xs font-bold text-keio-navy"
              onClick={() => setSplits((rows) => [...rows, { label: "", times: "" }])}
            >
              ＋ 追加
            </button>
          </div>
          {splits.length === 0 && <p className="text-xs text-slate-500">インターバルなどのタイムを残せます（任意）</p>}
          {splits.map((row, i) => (
            <div key={i} className="flex items-start gap-2">
              <input
                className={`${inputClass} w-24 shrink-0`}
                placeholder="1000m"
                aria-label="距離"
                value={row.label}
                onChange={(e) => setSplit(i, { label: e.target.value })}
              />
              <input
                className={`${inputClass} font-mono`}
                placeholder="2'54 / 2'51 / 2'50"
                aria-label="タイム"
                value={row.times}
                onChange={(e) => setSplit(i, { times: e.target.value })}
              />
              <button
                type="button"
                className="shrink-0 py-2 text-lg leading-none text-slate-400"
                aria-label="この行を削除"
                onClick={() => setSplits((rows) => rows.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <label className={labelClass} htmlFor="note">メモ</label>
          <textarea id="note" rows={3} className={inputClass} placeholder="気づいたこと・脚の状態など" value={note} onChange={(e) => setNote(e.target.value)} />
        </section>

        <button className={`${primaryButton} w-full`} disabled={!valid}>
          記録する
        </button>
      </form>
    </>
  );
}
