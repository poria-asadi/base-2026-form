import { getD1 } from "@/lib/d1";
import { createRegistrationsExcel, type RegistrationExportRow } from "@/lib/excel-export";
import { ADMIN_COOKIE_NAME, readCookie, verifyAdminSessionToken } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const token = readCookie(request.headers.get("cookie"), ADMIN_COOKIE_NAME);
  if (!(await verifyAdminSessionToken(token))) return new Response("Forbidden", { status: 403 });
  const result = await getD1().prepare(`SELECT registrations.id, registrations.full_name, registrations.age, registrations.city, registrations.field, registrations.education, registrations.phone, registrations.email, registrations.source, registrations.status, registrations.base_amount, registrations.discount_code, registrations.discount_percent, registrations.final_amount, registrations.identifier_code, registrations.payment_reference, registrations.created_at, registrations.paid_at, payment_receipts.original_name AS receipt_name, payment_receipts.created_at AS receipt_submitted_at FROM registrations LEFT JOIN payment_receipts ON payment_receipts.registration_id = registrations.id WHERE registrations.deleted_at IS NULL ORDER BY registrations.created_at DESC`).all<RegistrationExportRow>();
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
