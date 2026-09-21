import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { CheckCircle2, Download, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getD1 } from "@/lib/d1";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/app/admin/login-form";
import { AdminLogoutButton } from "@/app/admin/logout-button";

export const dynamic = "force-dynamic";
type Summary = { total: number; pending: number; awaiting: number; approved: number; rejected: number };
type RecentRow = { id: string; full_name: string; phone: string; status: string; final_amount: number; identifier_code: string | null; created_at: string; receipt_name: string | null };

const statusLabel = (status: string) => {
  if (status === "receipt_submitted") return "در انتظار تأیید";
  if (status === "approved" || status === "paid") return "تأیید شده";
  if (status === "rejected") return "تأیید نشده";
  return "در انتظار واریز";
};

const statusClass = (status: string) => status === "approved" || status === "paid"
  ? "approved"
  : status === "rejected"
    ? "rejected"
    : status === "receipt_submitted"
      ? "awaiting"
      : "payment-pending";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const cookieStore = await cookies();
  const allowed = await verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  if (!allowed) return <AdminLoginForm />;

  const db = getD1();
  const summary = await db.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status = 'receipt_submitted' THEN 1 ELSE 0 END) AS awaiting, SUM(CASE WHEN status IN ('approved', 'paid') THEN 1 ELSE 0 END) AS approved, SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected FROM registrations`).first<Summary>();
  const recent = await db.prepare(`SELECT registrations.id, registrations.full_name, registrations.phone, registrations.status, registrations.final_amount, registrations.identifier_code, registrations.created_at, payment_receipts.original_name AS receipt_name FROM registrations LEFT JOIN payment_receipts ON payment_receipts.registration_id = registrations.id ORDER BY registrations.created_at DESC LIMIT 250`).all<RecentRow>();
  const emailActive = Boolean(env.RESEND_API_KEY && env.REGISTRATION_FROM_EMAIL && env.REGISTRATION_NOTIFICATION_TO);
  const { updated } = await searchParams;

  return <main className="admin-page" dir="rtl"><div className="admin-shell">
    <header className="admin-head"><div><span className="eyebrow">مدیریت رویداد</span><h1>ثبت‌نام‌های BASE 2026</h1></div><div className="admin-actions"><a className={buttonVariants({ size: "lg" })} href="/api/admin/export"><Download /> دانلود فایل اکسل</a><AdminLogoutButton /></div></header>
    {updated && <div className="admin-notice active">وضعیت ثبت‌نام با موفقیت به‌روزرسانی شد.</div>}
    <div className={`admin-notice ${emailActive ? "active" : "pending"}`}>{emailActive ? "اعلان ایمیلی ثبت‌نام‌های جدید فعال است." : "ذخیره اعلان‌ها فعال است؛ برای ارسال ایمیل، کلید سرویس ایمیل و آدرس فرستنده باید متصل شود."}</div>
    <section className="admin-card">
      <div className="admin-summary">
        <div className="admin-stat"><span>همه ثبت‌نام‌ها</span><strong>{summary?.total ?? 0}</strong></div>
        <div className="admin-stat"><span>در انتظار واریز</span><strong>{summary?.pending ?? 0}</strong></div>
        <div className="admin-stat"><span>در انتظار تأیید</span><strong>{summary?.awaiting ?? 0}</strong></div>
        <div className="admin-stat"><span>تأیید شده</span><strong>{summary?.approved ?? 0}</strong></div>
        <div className="admin-stat"><span>تأیید نشده</span><strong>{summary?.rejected ?? 0}</strong></div>
      </div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>نام و نام خانوادگی</th><th>شماره تماس</th><th>وضعیت ثبت‌نام</th><th>مبلغ نهایی</th><th>کد شناسایی</th><th>فیش واریزی</th><th>بررسی مدیر</th><th>تاریخ ثبت</th></tr></thead><tbody>
        {recent.results.map((row) => <tr key={row.id}>
          <td>{row.full_name}</td>
          <td dir="ltr">{row.phone}</td>
          <td><span className={`registration-status ${statusClass(row.status)}`}>{statusLabel(row.status)}</span></td>
          <td>{row.final_amount === 0 ? "رایگان" : `${row.final_amount.toLocaleString("fa-IR")} تومان`}</td>
          <td dir="ltr">{row.identifier_code ?? "—"}</td>
          <td>{row.receipt_name ? <a href={`/api/admin/receipts/${row.id}`} target="_blank" rel="noreferrer">مشاهده فیش</a> : "—"}</td>
          <td>{row.receipt_name ? <div className="admin-decision-actions">
            <form action="/api/admin/registrations/status" method="post"><input type="hidden" name="registrationId" value={row.id} /><input type="hidden" name="status" value="approved" /><button className="decision-button approve" type="submit" disabled={row.status === "approved"}><CheckCircle2 /> تأیید</button></form>
            <form action="/api/admin/registrations/status" method="post"><input type="hidden" name="registrationId" value={row.id} /><input type="hidden" name="status" value="rejected" /><button className="decision-button reject" type="submit" disabled={row.status === "rejected"}><XCircle /> تأیید نشده</button></form>
          </div> : row.status === "paid" ? "ثبت‌نام رایگان" : "پس از دریافت فیش"}</td>
          <td>{new Date(row.created_at).toLocaleString("fa-IR")}</td>
        </tr>)}
      </tbody></table>{!recent.results.length && <p className="admin-empty">هنوز ثبت‌نامی ثبت نشده است.</p>}</div>
    </section>
  </div></main>;
}
