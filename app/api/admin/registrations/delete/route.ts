import { getD1 } from "@/lib/d1";
import { ADMIN_COOKIE_NAME, readCookie, verifyAdminSessionToken } from "@/lib/admin-auth";

function externalOrigin(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const host = request.headers.get("host") ?? new URL(request.url).host;
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  const token = readCookie(request.headers.get("cookie"), ADMIN_COOKIE_NAME);
  if (!(await verifyAdminSessionToken(token))) return new Response("Forbidden", { status: 403 });

  const origin = request.headers.get("origin");
  if (origin && origin !== externalOrigin(request)) return new Response("Forbidden", { status: 403 });

  const formData = await request.formData();
  const registrationId = String(formData.get("registrationId") ?? "").trim();
  if (!registrationId) return new Response("Bad request", { status: 400 });

  const result = await getD1()
    .prepare("UPDATE registrations SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL")
    .bind(new Date().toISOString(), registrationId)
    .run();

  if (!result.meta.changes) return new Response("Registration not found", { status: 404 });
  return Response.redirect(`${externalOrigin(request)}/admin?deleted=1`, 303);
}
