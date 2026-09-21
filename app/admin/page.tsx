import { env } from "cloudflare:workers";
import { Download, LockKeyhole } from "lucide-react";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { buttonVariants } from "@/components/ui/button";
import { getD1 } from "@/lib/d1";

export const dynamic = "force-dynamic";
type Summary = { total: number; submitted: number; pending: number };
type RecentRow = { id: string; full_name: string; phone: string; status: string; final_amount: number; identifier_code: string | null; created_at: string; receipt_name: string | null };

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const allowed = Boolean(env.ADMIN_EMAIL && user.email.trim().toLowerCase() === env.ADMIN_EMAIL.trim().toLowerCase());
  if (!allowed) return <main className="admin-page"><div className="admin-shell admin-card admin-denied"><LockKeyhole size={38} /><h1>دسترسی مجاز نیست</h1><p>این بخش فقط برای مدیر ثبت‌نام رویداد در دسترس است.</p></div></main>;
  const db = getD1();
  const summary = await db.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status IN ('receipt_submitted', 'paid') THEN 1 ELSE 0 END) AS submitted, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending FROM registrations`).first<Summary>();
  const recent = await db.prepare(`SELECT registrations.id, registrations.full_name, registrations.phone, registrations.status, registrations.final_amount, registrations.identifier_code, registrations.created_at, payment_receipts.original_name AS receipt_name FROM registrations LEFT JOIN payment_receipts ON payment_receipts.registration_id = registrations.id ORDER BY registrations.created_at DESC LIMIT 10`).all<RecentRow>();
  const emailActive = Boolean(env.RESEND_API_KEY && env.REGISTRATION_FROM_EMAIL && env.REGISTRATION_NOTIFICATION_TO);
  return <main className="admin-page" dir="rtl"><div className="admin-shell"><header className="admin-head"><div><span className="eyebrow">مدیریت رویداد</span><h1>ثبت‌نام‌های BASE 2026</h1><p>ورود با حساب {user.email}</p></div><div className="admin-actions"><a className={buttonVariants({ size: "lg" })} href="/api/admin/export"><Download /> دانلود فایل اکسل</a></div></header><div className={`admin-notice ${emailActive ? "active" : "pending"}`}>{emailActive ? "اعلان ایمیلی ثبت‌نام‌های جدید فعال است." : "ذخیره اعلان‌ها فعال است؛ برای ارسال ایمیل، کلید سرویس ایمیل و آدرس فرستنده باید متصل شود."}</div><section className="admin-card"><div className="admin-summary"><div className="admin-stat"><span>همه ثبت‌نام‌ها</span><strong>{summary?.total ?? 0}</strong></div><div className="admin-stat"><span>ثبت‌نام تکمیل‌شده</span><strong>{summary?.submitted ?? 0}</strong></div><div className="admin-stat"><span>در انتظار واریز</span><strong>{summary?.pending ?? 0}</strong></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>نام و نام خانوادگی</th><th>شماره تماس</th><th>وضعیت</th><th>مبلغ نهایی</th><th>کد شناسایی</th><th>فیش واریزی</th><th>تاریخ ثبت</th></tr></thead><tbody>{recent.results.map((row) => <tr key={row.id}><td>{row.full_name}</td><td dir="ltr">{row.phone}</td><td>{row.status === "receipt_submitted" ? "فیش ثبت‌شده" : row.status === "paid" ? "ثبت‌نام رایگان" : "در انتظار واریز"}</td><td>{row.final_amount === 0 ? "رایگان" : `${row.final_amount.toLocaleString("fa-IR")} تومان`}</td><td dir="ltr">{row.identifier_code ?? "—"}</td><td>{row.receipt_name ? <a href={`/api/admin/receipts/${row.id}`} target="_blank" rel="noreferrer">مشاهده فیش</a> : "—"}</td><td>{new Date(row.created_at).toLocaleString("fa-IR")}</td></tr>)}</tbody></table>{!recent.results.length && <p className="admin-empty">هنوز ثبت‌نامی ثبت نشده است.</p>}</div></section></div></main>;
}
