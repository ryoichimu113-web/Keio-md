"use client";

import { useEffect, useState } from "react";

const KEY = "keio-md:banner-dismissed-v2";

export function PrototypeBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "1") setVisible(false);
    } catch {}
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };

  return (
    <div className="mx-auto flex max-w-md items-start gap-2 bg-amber-100 px-4 py-2 text-xs text-amber-900">
      <p className="flex-1">
        <span className="font-bold">試作版です。</span>
        練習記録と、この端末で追加した予定はこの端末にだけ保存されます。部の予定は予定表、部員・メニュー・集合欠は Slack から読み込んでいます。
      </p>
      <button className="shrink-0 text-lg leading-none text-amber-700" aria-label="注意書きを閉じる" onClick={dismiss}>
        ×
      </button>
    </div>
  );
}

