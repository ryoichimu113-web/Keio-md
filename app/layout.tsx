import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { PrototypeBanner } from "@/components/PrototypeBanner";
import { SwRegister } from "@/components/SwRegister";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "中距離ブロック",
  description: "慶應義塾體育會競走部 中距離ブロックの予定共有・練習記録アプリ",
  manifest: "/manifest.webmanifest",
  appleWebApp: { title: "中距離", statusBarStyle: "black-translucent" },
  other: { "mobile-web-app-capable": "yes" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1f4b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <PrototypeBanner />
        <main className="mx-auto min-h-dvh max-w-md bg-slate-50 pb-24">{children}</main>
        <BottomNav />
        <Toaster />
        <SwRegister />
      </body>
    </html>
  );
}
