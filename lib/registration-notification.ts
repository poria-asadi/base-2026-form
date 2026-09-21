import { env } from "cloudflare:workers";

type RegistrationNotice = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  final_amount: number;
  identifier_code: string;
};

type D1Like = {
  prepare(query: string): { bind(...values: unknown[]): { run(): Promise<{ meta: { changes?: number } }> } };
};

const escapeHtml = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

export async function queueAndSendRegistrationNotice(db: D1Like, registration: RegistrationNotice) {
  const recipient = env.REGISTRATION_NOTIFICATION_TO?.trim();
  if (!recipient) return;
  const outboxId = crypto.randomUUID();
  await db.prepare(`INSERT OR IGNORE INTO notification_outbox (id, registration_id, recipient, status, attempts, created_at) VALUES (?, ?, ?, 'pending', 0, ?)`)
    .bind(outboxId, registration.id, recipient, new Date().toISOString()).run();
  if (!env.RESEND_API_KEY || !env.REGISTRATION_FROM_EMAIL) return;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "idempotency-key": `base2026-registration-${registration.id}`,
      },
      body: JSON.stringify({
        from: env.REGISTRATION_FROM_EMAIL,
        to: [recipient],
        subject: `ثبت‌نام قطعی جدید BASE 2026 — ${registration.full_name}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.9"><h2>یک ثبت‌نام قطعی جدید انجام شد</h2><p><strong>نام:</strong> ${escapeHtml(registration.full_name)}</p><p><strong>کد شناسایی:</strong> ${escapeHtml(registration.identifier_code)}</p><p><strong>شماره تماس:</strong> ${escapeHtml(registration.phone)}</p><p><strong>ایمیل:</strong> ${escapeHtml(registration.email)}</p><p><strong>شهر:</strong> ${escapeHtml(registration.city)}</p><p><strong>مبلغ پرداختی:</strong> ${registration.final_amount.toLocaleString("fa-IR")} تومان</p></div>`,
      }),
    });
    if (!response.ok) throw new Error(`Resend returned ${response.status}`);
    await db.prepare(`UPDATE notification_outbox SET status = 'sent', attempts = attempts + 1, sent_at = ?, last_error = NULL WHERE registration_id = ? AND recipient = ?`)
      .bind(new Date().toISOString(), registration.id, recipient).run();
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown email error";
    await db.prepare(`UPDATE notification_outbox SET status = 'failed', attempts = attempts + 1, last_error = ? WHERE registration_id = ? AND recipient = ?`)
      .bind(message, registration.id, recipient).run();
    console.error("registration_notification_failed", { registrationId: registration.id, message });
  }
}
