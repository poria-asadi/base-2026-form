import { getD1 } from "@/lib/d1";
import { finalizePaidRegistration } from "@/lib/finalize-payment";

export async function POST(request: Request) {
  try {
    const { registrationId } = await request.json() as { registrationId?: string };
    if (!registrationId) return Response.json({ message: "شناسه ثبت‌نام نامعتبر است." }, { status: 400 });
    const db = getD1();
    const registration = await db.prepare("SELECT status, final_amount, discount_percent FROM registrations WHERE id = ? LIMIT 1").bind(registrationId).first<{ status: string; final_amount: number; discount_percent: number }>();
    if (!registration) return Response.json({ message: "ثبت‌نام پیدا نشد." }, { status: 404 });
    if (registration.status !== "pending") return Response.json({ message: "این ثبت‌نام قبلاً نهایی شده است." }, { status: 409 });
    if (registration.final_amount !== 0 || registration.discount_percent !== 100) return Response.json({ message: "این ثبت‌نام رایگان نیست." }, { status: 400 });
    const identifier = await finalizePaidRegistration(db, registrationId, "DISCOUNT_100");
    return Response.json({ identifier });
  } catch (error) {
    console.error("free_registration_finalize_failed", error);
    return Response.json({ message: error instanceof Error ? error.message : "تکمیل ثبت‌نام انجام نشد." }, { status: 500 });
  }
}
