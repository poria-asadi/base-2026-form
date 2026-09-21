import { env } from "cloudflare:workers";

export async function GET() {
  const cardNumber = env.PAYMENT_CARD_NUMBER?.trim() ?? "";
  const cardHolder = env.PAYMENT_CARD_HOLDER?.trim() ?? "";
  return Response.json({
    configured: Boolean(cardNumber && cardHolder),
    cardNumber,
    cardHolder,
    bankName: env.PAYMENT_BANK_NAME?.trim() ?? "",
  }, { headers: { "cache-control": "no-store" } });
}
