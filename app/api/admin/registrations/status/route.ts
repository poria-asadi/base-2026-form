import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isAdminEmail } from "@/lib/admin-access";
import { getD1 } from "@/lib/d1";

const allowedStatuses = new Set(["approved", "rejected"]);

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user || !isAdminEmail(user.email)) return new Response("Forbidden", { status: 403 });

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response("Forbidden", { status: 403 });

  const formData = await request.formData();
  const registrationId = String(formData.get("registrationId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!registrationId || !allowedStatuses.has(status)) return new Response("Bad request", { status: 400 });

  const approvedAt = status === "approved" ? new Date().toISOString() : null;
  const result = await getD1().prepare(`
    UPDATE registrations
    SET status = ?, paid_at = ?
    WHERE id = ?
      AND status IN ('receipt_submitted', 'approved', 'rejected')
      AND EXISTS (SELECT 1 FROM payment_receipts WHERE payment_receipts.registration_id = registrations.id)
  `).bind(status, approvedAt, registrationId).run();

  if (!result.meta.changes) return new Response("Registration not found or cannot be reviewed", { status: 404 });
  return Response.redirect(new URL(`/admin?updated=${status}`, request.url), 303);
}
