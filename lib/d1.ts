import { env } from "cloudflare:workers";

export function getD1() {
  if (!env.DB) throw new Error("پایگاه داده در دسترس نیست.");
  return env.DB;
}
