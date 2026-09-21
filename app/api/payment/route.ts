import { getD1 } from "@/lib/d1";
export async function POST(request: Request) {
  try {
    const { registrationId } = await request.json() as { registrationId?: string };
    if (!registrationId) return Response.json({ message: "شناسه ثبت‌نام نامعتبر است." }, { status: 400 });
    const registration = await getD1().prepare("SELECT id, final_amount, status FROM registrations WHERE id = ? LIMIT 1").bind(registrationId).first<{ id: string; final_amount: number; status: string }>();
    if (!registration) return Response.json({ message: "ثبت‌نام پیدا نشد." }, { status: 404 });
    if (registration.status !== "pending") return Response.json({ message: "وضعیت این ثبت‌نام قابل پرداخت نیست." }, { status: 409 });
    return Response.json({ message: "درگاه پرداخت هنوز به حساب پذیرنده متصل نشده است. پس از تعیین شرکت پرداخت، این بخش فعال می‌شود." }, { status: 503 });
  } catch (error) { console.error("payment_start_failed", error); return Response.json({ message: "اتصال به درگاه ممکن نشد. لطفاً دوباره تلاش کنید." }, { status: 500 }); }
}
