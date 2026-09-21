import { validateRegistration } from "@/lib/validation";
import { getD1 } from "@/lib/d1";
import { REGISTRATION_BASE_PRICE } from "@/lib/pricing";
export async function POST(request: Request) {
  try {
    const input = validateRegistration(await request.json() as Record<string, unknown>); const id = crypto.randomUUID();
    await getD1().prepare(`INSERT INTO registrations (id, full_name, age, city, field, education, phone, email, source, status, base_amount, discount_percent, final_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, ?, ?)`)
      .bind(id, input.fullName, input.age, input.city, input.field, input.education, input.phone, input.email, input.source, REGISTRATION_BASE_PRICE, REGISTRATION_BASE_PRICE, new Date().toISOString()).run();
    return Response.json({ registrationId: id });
  } catch (error) { console.error("registration_create_failed", error); return Response.json({ message: error instanceof Error ? error.message : "ثبت اطلاعات انجام نشد." }, { status: 400 }); }
}
