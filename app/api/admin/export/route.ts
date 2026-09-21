import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/lib/d1";
import { createRegistrationsExcel, type RegistrationExportRow } from "@/lib/excel-export";

export async function GET() {
  const user = await getChatGPTUser();
  const adminEmail = env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!user || !adminEmail || user.email.trim().toLowerCase() !== adminEmail) return new Response("Forbidden", { status: 403 });
  const result = await getD1().prepare(`SELECT id, full_name, age, city, field, education, phone, email, source, status, base_amount, discount_code, discount_percent, final_amount, identifier_code, payment_reference, created_at, paid_at FROM registrations ORDER BY created_at DESC`).all<RegistrationExportRow>();
  const xml = createRegistrationsExcel(result.results);
  return new Response(xml, {
    headers: {
      "content-type": "application/vnd.ms-excel; charset=utf-8",
      "content-disposition": `attachment; filename="base-2026-registrations-${new Date().toISOString().slice(0, 10)}.xls"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
