"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || "ورود ناموفق بود.");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ورود ناموفق بود.");
      setLoading(false);
    }
  }

  return <main className="admin-page" dir="rtl"><div className="admin-shell admin-card admin-denied">
    <LockKeyhole size={38} />
    <h1>ورود مدیر</h1>
    <p>برای مشاهده ثبت‌نام‌ها رمز عبور را وارد کنید.</p>
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "20rem" }}>
      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="رمز عبور" dir="ltr" autoFocus />
      {error && <p className="field-error" role="alert">{error}</p>}
      <Button type="submit" disabled={loading || !password}>{loading ? "در حال ورود…" : "ورود"}</Button>
    </form>
  </div></main>;
}
