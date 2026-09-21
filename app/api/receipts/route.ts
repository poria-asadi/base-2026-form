import { env } from "cloudflare:workers";
import { getD1 } from "@/lib/d1";
import { queueAndSendRegistrationNotice } from "@/lib/registration-notification";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

type RegistrationNotice = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  final_amount: number;
  identifier_code: string;
};

function createIdentifierCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(10000 + (bytes[0] % 90000));
}

export async function POST(request: Request) {
  let objectKey = "";
  try {
    if (!env.BUCKET) return Response.json({ message: "فضای ذخیره‌سازی فیش هنوز فعال نشده است." }, { status: 503 });
    const formData = await request.formData();
    const registrationId = String(formData.get("registrationId") ?? "").trim();
    const receipt = formData.get("receipt");
    if (!registrationId || !(receipt instanceof File)) return Response.json({ message: "فایل فیش واریزی را انتخاب کنید." }, { status: 400 });
    if (!ALLOWED_TYPES[receipt.type]) return Response.json({ message: "فرمت فیش باید JPG، PNG یا PDF باشد." }, { status: 415 });
    if (!receipt.size || receipt.size > MAX_FILE_SIZE) return Response.json({ message: "حجم فایل فیش باید حداکثر ۸ مگابایت باشد." }, { status: 413 });

    const db = getD1();
    const registration = await db.prepare("SELECT id, status FROM registrations WHERE id = ? LIMIT 1").bind(registrationId).first<{ id: string; status: string }>();
    if (!registration) return Response.json({ message: "ثبت‌نام پیدا نشد." }, { status: 404 });
    if (registration.status !== "pending") return Response.json({ message: "برای این ثبت‌نام قبلاً فیش ثبت شده است." }, { status: 409 });

    const receiptId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    objectKey = `receipts/${registrationId}/${receiptId}.${ALLOWED_TYPES[receipt.type]}`;
    await env.BUCKET.put(objectKey, await receipt.arrayBuffer(), {
      httpMetadata: { contentType: receipt.type },
      customMetadata: { originalName: receipt.name.slice(0, 180), registrationId },
    });

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const identifier = createIdentifierCode();
      try {
        const results = await db.batch([
          db.prepare("UPDATE registrations SET status = 'receipt_submitted', identifier_code = ?, payment_reference = ? WHERE id = ? AND status = 'pending'").bind(identifier, "CARD_TO_CARD_RECEIPT", registrationId),
          db.prepare("INSERT INTO payment_receipts (id, registration_id, object_key, original_name, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(receiptId, registrationId, objectKey, receipt.name.slice(0, 180), receipt.type, receipt.size, createdAt),
        ]);
        if (!results[0].meta.changes) throw new Error("برای این ثبت‌نام قبلاً فیش ثبت شده است.");
        const notice = await db.prepare("SELECT id, full_name, phone, email, city, final_amount, identifier_code FROM registrations WHERE id = ? LIMIT 1").bind(registrationId).first<RegistrationNotice>();
        if (notice) {
          try { await queueAndSendRegistrationNotice(db, notice, "receipt_submitted"); }
          catch (error) { console.error("registration_notification_queue_failed", { registrationId, error }); }
        }
        return Response.json({ identifier });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const collision = message.toLowerCase().includes("unique") || message.toLowerCase().includes("constraint");
        if (!collision || message.includes("قبلاً")) throw error;
      }
    }
    throw new Error("ساخت کد شناسایی یکتا انجام نشد؛ دوباره تلاش کنید.");
  } catch (error) {
    if (objectKey && env.BUCKET) await env.BUCKET.delete(objectKey).catch(() => undefined);
    console.error("receipt_upload_failed", error);
    const message = error instanceof Error ? error.message : "آپلود فیش انجام نشد.";
    const status = message.includes("قبلاً") ? 409 : 500;
    return Response.json({ message }, { status });
  }
}
