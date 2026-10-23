"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/components/Toaster";
import { addDays, md, mdw, startOfWeek, todayKey, WEEKDAYS, weekday, weekdayClass } from "@/lib/date";
import { uid, update, useAppState } from "@/lib/store";
import type { Condition, PracticeLog } from "@/lib/types";
import { formatKm, inputClass, labelClass, primaryButton, secondaryButton } from "@/lib/ui";

const MENUS = ["ジョグ", "ペース走", "インターバル", "レペティション", "ビルドアップ", "ロング走", "試合・記録会", "補強", "休養", "その他"];
const CONDITIONS: Condition[] = ["◎", "○", "△", "×"];

type Form = {
  id?: string;
  date: string;
  menu: string;
  detail: string;
  distance: string;
  duration: string;
  rpe?: number;
  condition?: Condition;
  note: string;
};

const emptyForm = (date: string): Form => ({ date, menu: "ジョグ", detail: "", distance: "", duration: "", note: "" });

function sumKm(logs: PracticeLog[], from: string, to: string) {
  return logs.filter((l) => l.date >= from && l.date <= to).reduce((sum, l) => sum + l.distanceKm, 0);
}

export default function LogPage() {
  const state = useAppState();
  const today = todayKey();
  const [form, setForm] = useState<Form>(() => emptyForm(today));
  const [weeksShown, setWeeksShown] = useState(4);

  if (!state) return <PageHeader title="練習記録" />;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const weekStart = startOfWeek(today);
  const lastWeekStart = addDays(weekStart, -7);
  const monthStart = today.slice(0, 8) + "01";
  const thisWeekKm = sumKm(state.logs, weekStart, addDays(weekStart, 6));
  const lastWeekKm = sumKm(state.logs, lastWeekStart, addDays(weekStart, -1));
  const monthKm = sumKm(state.logs, monthStart, today);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dailyKm = weekDays.map((d) => sumKm(state.logs, d, d));
  const maxKm = Math.max(10, ...dailyKm);

  const sorted = [...state.logs].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  const weeks: { start: string; logs: PracticeLog[] }[] = [];
  for (const log of sorted) {
    const start = startOfWeek(log.date);
    const last = weeks[weeks.length - 1];
    if (last && last.start === start) last.logs.push(log);
    else weeks.push({ start, logs: [log] });
  }

  const distance = Number(form.distance || 0);
  const durationValid = form.duration === "" || Number(form.duration) >= 0;
  const canSave = form.date !== "" && Number.isFinite(distance) && distance >= 0 && durationValid;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const log: PracticeLog = {
      id: form.id ?? uid(),
      date: form.date,
      menu: form.menu,
      detail: form.detail.trim() || undefined,
      distanceKm: Math.round(distance * 10) / 10,
      durationMin: form.duration ? Number(form.duration) : undefined,
      rpe: form.rpe,
      condition: form.condition,
      note: form.note.trim() || undefined,
    };
    update((s) => ({
      ...s,
      logs: form.id ? s.logs.map((l) => (l.id === form.id ? log : l)) : [...s.logs, log],
    }));
    toast(form.id ? "記録を更新しました" : "記録を保存しました");
    setForm(emptyForm(today));
  };

  const edit = (log: PracticeLog) => {
    setForm({
      id: log.id,
      date: log.date,
      menu: log.menu,
      detail: log.detail ?? "",
      distance: String(log.distanceKm),
      duration: log.durationMin != null ? String(log.durationMin) : "",
      rpe: log.rpe,
      condition: log.condition,
      note: log.note ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = () => {
    if (!form.id || !confirm("この記録を削除しますか？")) return;
    update((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== form.id) }));
    toast("記録を削除しました");
    setForm(emptyForm(today));
  };

  return (
    <>
      <PageHeader title="練習記録" />
      <div className="space-y-5 p-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["今週", thisWeekKm],
            ["先週", lastWeekKm],
            ["今月", monthKm],
          ].map(([label, km]) => (
            <div key={label} className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="text-xl font-bold text-keio-navy">
                {formatKm(km as number)}
                <span className="ml-0.5 text-xs">km</span>
              </p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">今週の推移</h2>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex h-28 items-end gap-2">
              {weekDays.map((d, i) => (
                <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  {dailyKm[i] > 0 && <span className="text-[10px] font-bold text-slate-500">{formatKm(dailyKm[i])}</span>}
                  <div
                    className={`w-full rounded-t ${d === today ? "bg-keio-red" : "bg-keio-navy"}`}
                    style={{ height: `${(dailyKm[i] / maxKm) * 80}%`, minHeight: dailyKm[i] > 0 ? 2 : 0 }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-2 border-t border-slate-100 pt-1">
              {weekDays.map((d) => (
                <p key={d} className={`flex-1 text-center text-[11px] font-bold ${d === today ? "text-keio-red" : weekdayClass(d)}`}>
                  {WEEKDAYS[weekday(d)]}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">{form.id ? "記録を編集" : "記録をつける"}</h2>
          <form onSubmit={save} className="space-y-3 rounded-xl bg-white p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="log-date">日付</label>
                <input id="log-date" type="date" className={inputClass} value={form.date} max={today} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="log-menu">練習内容</label>
                <select id="log-menu" className={inputClass} value={form.menu} onChange={(e) => set("menu", e.target.value)}>
                  {MENUS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="log-detail">メニュー詳細</label>
              <input id="log-detail" className={inputClass} placeholder="例：1000m×5（r=200m）" value={form.detail} onChange={(e) => set("detail", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="log-distance">距離（km）</label>
                <input id="log-distance" type="number" inputMode="decimal" step="0.1" min="0" className={inputClass} placeholder="0" value={form.distance} onChange={(e) => set("distance", e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="log-duration">時間（分）</label>
                <input id="log-duration" type="number" inputMode="numeric" min="0" className={inputClass} placeholder="任意" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
              </div>
            </div>

            <div>
              <p className={labelClass}>きつさ（1〜10）</p>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={form.rpe === n}
                    className={`rounded-md py-1.5 text-xs font-bold ${form.rpe === n ? "bg-keio-navy text-white" : "bg-slate-100 text-slate-600"}`}
                    onClick={() => set("rpe", form.rpe === n ? undefined : n)}
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
                    aria-pressed={form.condition === c}
                    className={`rounded-md py-1.5 text-sm font-bold ${form.condition === c ? "bg-keio-navy text-white" : "bg-slate-100 text-slate-600"}`}
                    onClick={() => set("condition", form.condition === c ? undefined : c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="log-note">メモ</label>
              <textarea id="log-note" rows={2} className={inputClass} placeholder="気づいたこと・痛みなど" value={form.note} onChange={(e) => set("note", e.target.value)} />
            </div>

            <div className="flex gap-2">
              <button className={`${primaryButton} flex-1`} disabled={!canSave}>
                {form.id ? "更新する" : "保存する"}
              </button>
              {form.id && (
                <>
                  <button type="button" className={secondaryButton} onClick={() => setForm(emptyForm(today))}>
                    やめる
                  </button>
                  <button type="button" className="rounded-lg px-3 text-sm font-bold text-keio-red" onClick={remove}>
                    削除
                  </button>
                </>
              )}
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-600">これまでの記録</h2>
          {weeks.length === 0 && <p className="text-sm text-slate-400">まだ記録がありません</p>}
          <div className="space-y-3">
            {weeks.slice(0, weeksShown).map((w) => (
              <div key={w.start} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  <span>
                    {md(w.start)}〜{md(addDays(w.start, 6))}
                  </span>
                  <span className="text-keio-navy">合計 {formatKm(w.logs.reduce((s, l) => s + l.distanceKm, 0))}km</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {w.logs.map((log) => (
                    <li key={log.id}>
                      <button className="flex w-full items-center gap-3 px-3 py-2 text-left" onClick={() => edit(log)}>
                        <p className={`w-14 shrink-0 text-xs font-bold ${log.id === form.id ? "text-keio-red" : ""}`}>{mdw(log.date)}</p>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            <span className="font-bold">{log.menu}</span>
                            {log.detail && <span className="text-slate-500"> {log.detail}</span>}
                          </p>
                          {(log.durationMin != null || log.rpe != null || log.condition || log.note) && (
                            <p className="truncate text-[11px] text-slate-500">
                              {[
                                log.durationMin != null && `${log.durationMin}分`,
                                log.rpe != null && `きつさ ${log.rpe}`,
                                log.condition && `体調 ${log.condition}`,
                                log.note,
                              ]
                                .filter(Boolean)
                                .join(" ・ ")}
                            </p>
                          )}
                        </div>
                        <p className="shrink-0 text-sm font-bold text-keio-navy">
                          {formatKm(log.distanceKm)}
                          <span className="ml-0.5 text-[10px]">km</span>
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {weeks.length > weeksShown && (
            <button className={`${secondaryButton} mt-3 w-full`} onClick={() => setWeeksShown((n) => n + 4)}>
              もっと見る
            </button>
          )}
        </section>
      </div>
    </>
  );
}
