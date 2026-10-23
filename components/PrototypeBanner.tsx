"use client";

import { useEffect, useState } from "react";

const KEY = "keio-md:banner-dismissed";
export const SHOW_BANNER_EVENT = "keio-md:show-banner";

export function PrototypeBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "1") setVisible(false);
    } catch {}
    const show = () => setVisible(true);
    window.addEventListener(SHOW_BANNER_EVENT, show);
    return () => window.removeEventListener(SHOW_BANNER_EVENT, show);
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
        入力したデータはこの端末にだけ保存され、他の部員には共有されません。部員や予定はすべて架空のサンプルです。
      </p>
      <button className="shrink-0 text-lg leading-none text-amber-700" aria-label="注意書きを閉じる" onClick={dismiss}>
        ×
      </button>
    </div>
  );
}

export function showBanner() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(SHOW_BANNER_EVENT));
}
