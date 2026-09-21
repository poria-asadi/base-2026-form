import { clearAdminSessionCookie } from "@/lib/admin-auth";

export async function POST() {
  return Response.json({ ok: true }, { headers: { "set-cookie": clearAdminSessionCookie() } });
}
