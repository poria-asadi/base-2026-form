import { env } from "cloudflare:workers";
import { createAdminSessionCookie } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { password } = await request.json() as { password?: string };
  if (!env.ADMIN_PASSWORD || !password || password !== env.ADMIN_PASSWORD) {
    return Response.json({ message: "رمز عبور نادرست است." }, { status: 401 });
  }
  const cookie = await createAdminSessionCookie(request.headers.get("x-forwarded-proto") === "https");
  return Response.json({ ok: true }, { headers: { "set-cookie": cookie } });
}
