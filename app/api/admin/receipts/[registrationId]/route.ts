import { env } from "cloudflare:workers";
import { getD1 } from "@/lib/d1";
import { ADMIN_COOKIE_NAME, readCookie, verifyAdminSessionToken } from "@/lib/admin-auth";

export async function GET(request: Request, context: { params: Promise<{ registrationId: string }> }) {
  const token = readCookie(request.headers.get("cookie"), ADMIN_COOKIE_NAME);
  if (!(await verifyAdminSessionToken(token))) return new Response("Forbidden", { status: 403 });
  if (!env.BUCKET) return new Response("Receipt storage unavailable", { status: 503 });
  const { registrationId } = await context.params;
  const receipt = await getD1().prepare("SELECT object_key, original_name, content_type FROM payment_receipts WHERE registration_id = ? LIMIT 1").bind(registrationId).first<{ object_key: string; original_name: string; content_type: string }>();
  if (!receipt) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(receipt.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  const safeName = receipt.original_name.replace(/[\r\n"\\]/g, "_");
  return new Response(object.body, { headers: {
    "content-type": receipt.content_type,
    "content-disposition": `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(receipt.original_name)}`,
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  } });
}
