import { queueAndSendRegistrationNotice } from "@/lib/registration-notification";

type RegistrationNotice = { id: string; full_name: string; phone: string; email: string; city: string; final_amount: number; identifier_code: string };
type D1Like = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ meta: { changes?: number } }>;
      first<T>(): Promise<T | null>;
    };
  };
};

function createIdentifierCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(10000 + (bytes[0] % 90000));
}

/**
 * این تابع فقط باید پس از تأیید رمزنگاری‌شده پرداخت توسط آداپتر درگاه فراخوانی شود.
 * ایندکس یکتای پایگاه داده از تکرار کد بین ثبت‌نام‌ها جلوگیری می‌کند.
 */
export async function finalizePaidRegistration(db: D1Like, registrationId: string, paymentReference: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const identifier = createIdentifierCode();
    try {
      const result = await db.prepare(`
        UPDATE registrations
        SET status = 'paid', identifier_code = ?, payment_reference = ?, paid_at = ?
        WHERE id = ? AND status = 'pending'
      `).bind(identifier, paymentReference, new Date().toISOString(), registrationId).run();
      if (result.meta.changes) {
        const registration = await db.prepare(`SELECT id, full_name, phone, email, city, final_amount, identifier_code FROM registrations WHERE id = ? LIMIT 1`).bind(registrationId).first<RegistrationNotice>();
        if (registration) {
          try { await queueAndSendRegistrationNotice(db, registration); }
          catch (error) { console.error("registration_notification_queue_failed", { registrationId, error }); }
        }
        return identifier;
      }
      throw new Error("ثبت‌نام پیدا نشد یا قبلاً نهایی شده است.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.toLowerCase().includes("unique") && !message.toLowerCase().includes("constraint")) throw error;
    }
  }
  throw new Error("ساخت کد شناسایی یکتا انجام نشد؛ دوباره تلاش کنید.");
}
