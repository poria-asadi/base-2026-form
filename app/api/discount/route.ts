import { findDiscount } from "@/lib/discount-codes";
import { getD1 } from "@/lib/d1";
import { REGISTRATION_BASE_PRICE } from "@/lib/pricing";
export async function POST(request: Request) {
  try {
    const { registrationId, code } = await request.json() as { registrationId?: string; code?: string };
    if (!registrationId || !code) return Response.json({ message: "کد تخفیف را وارد کنید." }, { status: 400 });
    const discount = findDiscount(code); if (!discount) return Response.json({ message: "این کد تخفیف معتبر یا فعال نیست." }, { status: 404 });
    const finalAmount = Math.round(REGISTRATION_BASE_PRICE * (100 - discount.percent) / 100);
    const result = await getD1().prepare(`UPDATE registrations SET discount_code = ?, discount_percent = ?, final_amount = ? WHERE id = ? AND status = 'pending'`).bind(discount.code, discount.percent, finalAmount, registrationId).run();
    if (!result.meta.changes) return Response.json({ message: "ثبت‌نام پیدا نشد یا قبلاً پرداخت شده است." }, { status: 404 });
    return Response.json({ percent: discount.percent, finalAmount });
  } catch (error) { console.error("discount_apply_failed", error); return Response.json({ message: "اعمال کد تخفیف انجام نشد." }, { status: 400 }); }
}
