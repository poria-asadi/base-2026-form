import { env } from "cloudflare:workers";

export function isAdminEmail(email: string) {
  const configured = [env.ADMIN_EMAIL, env.ADMIN_EMAILS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configured.includes(email.trim().toLowerCase());
}
