import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ثبت‌نام BASE 2026 | مرکز نوآوری بانیان",
  description: "فرم رسمی ثبت‌نام اولین رویداد مرکز نوآوری بانیان؛ Banyan Accelerator & Startup Event 2026",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
