import { env } from "cloudflare:workers";
import { getD1 } from "@/lib/d1";

const CONFIRMED_STATUSES = new Set(["paid", "approved"]);

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return mismatch === 0;
}

export async function POST(request: Request) {
  const apiKey = env.INTERNAL_API_KEY;
  if (!apiKey) return Response.json({ message: "این سرویس هنوز پیکربندی نشده است." }, { status: 503 });

  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token || !timingSafeEqual(token, apiKey)) {
    return Response.json({ message: "احراز هویت نامعتبر است." }, { status: 401 });
  }

  const { code } = await request.json().catch(() => ({})) as { code?: string };
  if (!/^\d{5}$/.test(String(code ?? ""))) return Response.json({ message: "کد شناسایی باید ۵ رقم باشد." }, { status: 400 });

  const registration = await getD1()
    .prepare("SELECT full_name, status FROM registrations WHERE identifier_code = ? AND deleted_at IS NULL LIMIT 1")
    .bind(code)
    .first<{ full_name: string; status: string }>();

  if (!registration) return Response.json({ valid: false });
  return Response.json({
    valid: CONFIRMED_STATUSES.has(registration.status),
    full_name: registration.full_name,
    status: registration.status,
  });
}
