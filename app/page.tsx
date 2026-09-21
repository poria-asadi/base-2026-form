"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CircleCheck, Clipboard, FileCheck2, MessageCircle, ShieldCheck, Ticket, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { REGISTRATION_BASE_PRICE } from "@/lib/pricing";

type FormData = { fullName: string; age: string; city: string; field: string; education: string; phone: string; email: string; source: string };
type Errors = Partial<Record<keyof FormData, string>>;
type PaymentInfo = { configured: boolean; cardNumber: string; cardHolder: string; bankName: string };
const initialForm: FormData = { fullName: "", age: "", city: "", field: "", education: "", phone: "", email: "", source: "" };
const educationOptions = ["فارغ‌التحصیل", "دانشجوی دکتری", "دانشجوی کارشناسی ارشد", "دانشجوی کارشناسی"];
const sourceOptions = ["کانال‌های تلگرامی", "لینکدین", "اینستاگرام", "دوستان و همکاران"];
const faToEn = (value: string) => value.replace(/[۰-۹]/g, (char) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char))).replace(/[٠-٩]/g, (char) => String("٠١٢٣٤٥٦٧٨٩".indexOf(char)));
function copyText(value: string) {
  if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(value).catch(() => fallbackCopy(value)); return; }
  fallbackCopy(value);
}
function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try { document.execCommand("copy"); } catch { /* clipboard unavailable */ }
  document.body.removeChild(textarea);
}
const normalizePhone = (value: string) => {
  const clean = faToEn(value).replace(/[\s()-]/g, "");
  if (clean.startsWith("+98")) return `0${clean.slice(3)}`;
  if (clean.startsWith("0098")) return `0${clean.slice(4)}`;
  return clean;
};

function validate(values: FormData): Errors {
  const errors: Errors = {};
  const persianText = /^[\u0600-\u06FF\u200c\s\-]+$/u;
  const fullName = values.fullName.trim().replace(/\s+/g, " ");
  if (fullName.length < 5 || fullName.split(" ").length < 2 || !persianText.test(fullName)) errors.fullName = "نام و نام خانوادگی را کامل و با حروف فارسی وارد کنید.";
  const age = Number(faToEn(values.age));
  if (!Number.isInteger(age) || age < 12 || age > 100) errors.age = "سن را به‌صورت عددی بین ۱۲ تا ۱۰۰ وارد کنید.";
  if (values.city.trim().length < 2 || !persianText.test(values.city.trim())) errors.city = "نام شهر را با حروف فارسی وارد کنید.";
  if (values.field.trim().length < 2) errors.field = "رشته تحصیلی یا حوزه کاری را کامل‌تر بنویسید.";
  if (!educationOptions.includes(values.education)) errors.education = "یکی از گزینه‌ها را انتخاب کنید.";
  if (!/^09\d{9}$/.test(normalizePhone(values.phone))) errors.phone = "شماره موبایل معتبر وارد کنید؛ مثال: ۰۹۱۲۱۲۳۴۵۶۷";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(values.email.trim())) errors.email = "ساختار ایمیل صحیح نیست؛ مثال: name@example.com";
  if (!sourceOptions.includes(values.source)) errors.source = "یکی از گزینه‌ها را انتخاب کنید.";
  return errors;
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return <div className="field-wrap"><label className="field-label">{label}</label>{children}{error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}</div>;
}

function OptionGroup({ value, onChange, options, name, invalid }: { value: string; onChange: (value: string) => void; options: string[]; name: string; invalid?: boolean }) {
  return <RadioGroup dir="rtl" value={value} onValueChange={onChange} aria-invalid={invalid} className="option-grid">{options.map((option) => <label className={`option-card ${value === option ? "selected" : ""}`} key={option}><RadioGroupItem value={option} id={`${name}-${option}`} /><span>{option}</span></label>)}</RadioGroup>;
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [registrationId, setRegistrationId] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountMessage, setDiscountMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [completionMethod, setCompletionMethod] = useState<"receipt" | "free">("receipt");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const basePrice = REGISTRATION_BASE_PRICE;
  const finalPrice = useMemo(() => Math.round(basePrice * (100 - discountPercent) / 100), [discountPercent, basePrice]);
  const update = (key: keyof FormData, value: string) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })); };

  useEffect(() => {
    if (step !== 2 || paymentInfo) return;
    fetch("/api/payment-info", { cache: "no-store" }).then(async (response) => {
      const data = await response.json() as PaymentInfo & { message?: string };
      if (!response.ok) throw new Error(data.message || "اطلاعات کارت دریافت نشد.");
      setPaymentInfo(data);
    }).catch((error) => setServerMessage(error instanceof Error ? error.message : "اطلاعات کارت دریافت نشد."));
  }, [step, paymentInfo]);

  async function submitInfo(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); setTimeout(() => document.querySelector("[aria-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0); return; }
    setLoading(true); setServerMessage("");
    try {
      const response = await fetch("/api/registrations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, age: Number(faToEn(form.age)), phone: normalizePhone(form.phone) }) });
      const data = await response.json() as { message?: string; registrationId?: string };
      if (!response.ok) throw new Error(data.message || "ثبت اطلاعات انجام نشد.");
      if (!data.registrationId) throw new Error("شناسه ثبت‌نام دریافت نشد.");
      setRegistrationId(data.registrationId); setStep(2); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { setServerMessage(error instanceof Error ? error.message : "خطایی رخ داد. دوباره تلاش کنید."); } finally { setLoading(false); }
  }

  async function applyDiscount() {
    if (!discountCode.trim()) { setDiscountApplied(false); setDiscountMessage("ابتدا کد تخفیف را وارد کنید."); return; }
    setLoading(true); setDiscountMessage("");
    try {
      const response = await fetch("/api/discount", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ registrationId, code: discountCode.trim() }) });
      const data = await response.json() as { message?: string; percent?: number; finalAmount?: number };
      if (!response.ok) throw new Error(data.message || "کد تخفیف معتبر نیست.");
      if (typeof data.percent !== "number") throw new Error("پاسخ کد تخفیف معتبر نیست.");
      setDiscountPercent(data.percent); setDiscountApplied(true); setDiscountMessage(`کد تخفیف اعمال شد: ${data.percent}٪ تخفیف`);
    } catch (error) { setDiscountApplied(false); setDiscountMessage(error instanceof Error ? error.message : "کد تخفیف معتبر نیست."); } finally { setLoading(false); }
  }

  async function uploadReceipt() {
    if (!receipt) { setServerMessage("ابتدا تصویر یا فایل فیش واریزی را انتخاب کنید."); return; }
    setLoading(true); setServerMessage("");
    try {
      const payload = new FormData();
      payload.append("registrationId", registrationId);
      payload.append("receipt", receipt);
      const response = await fetch("/api/receipts", { method: "POST", body: payload });
      const data = await response.json() as { message?: string; identifier?: string };
      if (!response.ok) throw new Error(data.message || "آپلود فیش انجام نشد.");
      if (!data.identifier) throw new Error("کد شناسایی دریافت نشد.");
      setIdentifier(data.identifier); setCompletionMethod("receipt"); setStep(3); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { setServerMessage(error instanceof Error ? error.message : "آپلود فیش انجام نشد."); } finally { setLoading(false); }
  }

  async function completeFreeRegistration() {
    setLoading(true); setServerMessage("");
    try {
      const response = await fetch("/api/free-registration", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ registrationId }) });
      const data = await response.json() as { message?: string; identifier?: string };
      if (!response.ok) throw new Error(data.message || "تکمیل ثبت‌نام انجام نشد.");
      if (!data.identifier) throw new Error("کد شناسایی دریافت نشد.");
      setIdentifier(data.identifier); setCompletionMethod("free"); setStep(3); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { setServerMessage(error instanceof Error ? error.message : "تکمیل ثبت‌نام انجام نشد."); } finally { setLoading(false); }
  }

  const steps = ["اطلاعات", "پرداخت", "تأیید"];
  return <main className="page-shell" dir="rtl"><div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="layout">
    <aside className="brand-panel"><div className="brand-top"><img className="brand-logo" src="/brand/banyan-innovation-center-logo-orange.png" alt="لوگوی مرکز نوآوری بانیان" /></div><div className="event-lockup" lang="en"><span className="edition">FIRST EDITION · 2026</span><h1><b>BASE</b><em>2026</em></h1><p>Banyan Accelerator<br />& Startup Event</p></div><div className="brand-note"><Ticket /><span>فرم رسمی ثبت‌نام<br /><b>اولین رویداد بانیان</b></span></div><div className="perforation" aria-hidden="true" /></aside>
    <section className="form-panel"><header className="mobile-brand"><img className="brand-logo mobile-logo" src="/brand/banyan-innovation-center-logo-orange.png" alt="لوگوی مرکز نوآوری بانیان" /><div><strong lang="en">BASE 2026</strong><span>مرکز نوآوری بانیان</span></div></header>
      <div className="stepper" aria-label="مراحل ثبت‌نام"><div className="step-labels">{steps.map((item, index) => <span key={item} className={step >= index + 1 ? "active" : ""}>{index + 1}. {item}</span>)}</div><Progress value={step * 33.33} className="progress" /></div>
      {step === 1 && <div className="stage enter"><div className="intro"><span className="eyebrow">ثبت‌نام رویداد</span><h2>به اولین ایونت مرکز نوآوری بانیان خوش آمدید.</h2><p>در این ایونت در خدمت میهمان‌های بزرگی از صنعت استارت‌آپ ایران هستیم و قصد داریم ضمن استفاده از تجربه‌ی این میهمانان گرانقدر، با مسیر ساخت یک استارت‌آپ آشنا شویم.</p><p>خواهشمندیم برای ثبت‌نام در رویداد BASE-2026 اطلاعات مورد نیاز را با دقت تکمیل فرمایید.</p></div>
        <form onSubmit={submitInfo} noValidate className="registration-form">
          <div className="two-col"><Field label="نام و نام خانوادگی" error={errors.fullName}><Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} aria-invalid={!!errors.fullName} autoComplete="name" placeholder="مثال: سارا احمدی" /></Field><Field label="سن" error={errors.age} hint="سن را به سال وارد کنید؛ مثال: ۳۶"><Input value={form.age} onChange={(e) => update("age", e.target.value)} aria-invalid={!!errors.age} inputMode="numeric" placeholder="۳۶" /></Field></div>
          <div className="two-col"><Field label="شهر محل اقامت" error={errors.city}><Input value={form.city} onChange={(e) => update("city", e.target.value)} aria-invalid={!!errors.city} autoComplete="address-level2" placeholder="مثال: تهران" /></Field><Field label="رشته تحصیلی یا حوزه کاری" error={errors.field}><Input value={form.field} onChange={(e) => update("field", e.target.value)} aria-invalid={!!errors.field} placeholder="مثال: طراحی محصول" /></Field></div>
          <Field label="مقطع تحصیلی" error={errors.education}><OptionGroup name="education" value={form.education} onChange={(v) => update("education", v)} options={educationOptions} invalid={!!errors.education} /></Field>
          <div className="two-col"><Field label="شماره تماس" error={errors.phone} hint="شماره موبایل ایران؛ مثال: ۰۹۱۲۱۲۳۴۵۶۷"><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} aria-invalid={!!errors.phone} inputMode="tel" autoComplete="tel" dir="ltr" className="text-right" placeholder="09121234567" /></Field><Field label="آدرس ایمیل" error={errors.email}><Input value={form.email} onChange={(e) => update("email", e.target.value)} aria-invalid={!!errors.email} type="email" autoComplete="email" dir="ltr" className="text-left" placeholder="name@example.com" /></Field></div>
          <Field label="نحوه آشنایی با ایونت" error={errors.source}><OptionGroup name="source" value={form.source} onChange={(v) => update("source", v)} options={sourceOptions} invalid={!!errors.source} /></Field>
          {serverMessage && <p className="server-error" role="alert">{serverMessage}</p>}<Button type="submit" size="lg" className="primary-action" disabled={loading}>{loading ? "در حال ثبت اطلاعات…" : <>ادامه و پرداخت <ArrowLeft /></>}</Button><p className="privacy"><ShieldCheck /> اطلاعات شما فقط برای مدیریت این رویداد استفاده می‌شود.</p>
        </form></div>}
      {step === 2 && <div className="stage enter payment-stage"><span className="eyebrow">مرحله دوم</span><h2>{finalPrice === 0 ? "ثبت‌نام رایگان" : "پرداخت کارت‌به‌کارت"}</h2><p className="muted-copy">{finalPrice === 0 ? "تخفیف کامل اعمال شده است؛ ثبت‌نام را بدون پرداخت نهایی کنید." : "مبلغ نهایی را به کارت زیر واریز کنید و سپس تصویر یا فایل فیش را بارگذاری کنید."}</p><Card className="price-card"><CardContent className="price-content"><div className={`price-row original ${discountPercent > 0 ? "discounted" : ""}`}><span>هزینه ثبت‌نام</span><strong>{basePrice.toLocaleString("fa-IR")} <small>تومان</small></strong></div>{discountPercent > 0 && <div className="price-row discount"><span>تخفیف</span><strong>{discountPercent}٪−</strong></div>}<div className="price-row total"><span>مبلغ نهایی</span><strong>{finalPrice === 0 ? "رایگان" : <>{finalPrice.toLocaleString("fa-IR")} <small>تومان</small></>}</strong></div></CardContent></Card><div className="discount-box"><label className="field-label" htmlFor="discount">کد تخفیف دارید؟</label><div className="discount-row"><Input id="discount" value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} dir="ltr" className="text-left" placeholder="DISCOUNT CODE" /><Button type="button" variant="outline" onClick={applyDiscount} disabled={loading}>اعمال کد</Button></div>{discountMessage && <p className={discountApplied ? "discount-ok" : "field-error"}>{discountMessage}</p>}</div>{finalPrice === 0 ? <>{serverMessage && <p className="server-error" role="alert">{serverMessage}</p>}<Button size="lg" className="primary-action" onClick={completeFreeRegistration} disabled={loading}>{loading ? "در حال تکمیل ثبت‌نام…" : <><Check /> تکمیل ثبت‌نام رایگان</>}</Button></> : <>{paymentInfo?.configured ? <div className="bank-card-visual"><img src="/payment/saman-card-base-2026.png" alt={`کارت بانک سامان به نام ${paymentInfo.cardHolder} با شماره ${paymentInfo.cardNumber}`} /><button type="button" aria-label="کپی شماره کارت" onClick={() => copyText(paymentInfo.cardNumber.replace(/\s/g, ""))}><Clipboard /><span>کپی شماره کارت</span></button></div> : <div className="card-transfer unconfigured"><div><span>شماره کارت مقصد</span><strong>هنوز تنظیم نشده</strong></div></div>}{paymentInfo && !paymentInfo.configured && <p className="setup-warning">اطلاعات کارت مقصد هنوز توسط برگزارکننده تنظیم نشده است. بارگذاری فیش پس از تکمیل این اطلاعات فعال می‌شود.</p>}<label className={`receipt-upload ${receipt ? "has-file" : ""}`}><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => { const file = event.target.files?.[0] ?? null; setReceipt(file); setServerMessage(file && file.size > 8 * 1024 * 1024 ? "حجم فایل باید حداکثر ۸ مگابایت باشد." : ""); }} disabled={!paymentInfo?.configured || loading} /><span className="upload-icon">{receipt ? <FileCheck2 /> : <Upload />}</span><strong>{receipt ? receipt.name : "تصویر یا فایل فیش را انتخاب کنید"}</strong><small>JPG، PNG یا PDF · حداکثر ۸ مگابایت</small></label>{serverMessage && <p className="server-error" role="alert">{serverMessage}</p>}<Button size="lg" className="primary-action" onClick={uploadReceipt} disabled={loading || !paymentInfo?.configured || !receipt || receipt.size > 8 * 1024 * 1024}>{loading ? "در حال بارگذاری فیش…" : <><Upload /> ثبت فیش و تکمیل ثبت‌نام</>}</Button></>}<button className="back-button" onClick={() => setStep(1)}>بازگشت و ویرایش اطلاعات</button></div>}
      {step === 3 && <div className="stage enter success-stage"><div className="success-icon"><CircleCheck /></div><span className="eyebrow">ثبت‌نام تکمیل شد</span><h2>{form.fullName} عزیز، ثبت‌نام شما در ایونت BASE-2026 با موفقیت انجام شد.</h2><p className="muted-copy">{completionMethod === "free" ? "ثبت‌نام رایگان شما با موفقیت نهایی شد." : "فیش واریزی شما با موفقیت دریافت شد."}</p><div className="id-ticket"><span>کد شناسایی اختصاصی شما</span><strong dir="ltr">{identifier || "— — — — —"}</strong><div className="ticket-cut left" /><div className="ticket-cut right" /></div><div className="important-note"><Check /><p>لطفاً کد شناسایی مخصوص خود را تا روز برگزاری ایونت به خاطر داشته باشید. همراه داشتن این کد برای ورود به ایونت و پرسش سؤال از میهمانان الزامی است.</p></div><p className="code-link-note">این کد به نام و اطلاعات ثبت‌نامی شما متصل است و در بات تلگرام رویداد برای پرسیدن سؤال از میهمان‌ها استفاده خواهد شد.</p><div className="telegram-actions"><MessageCircle /><div><p>برای اینکه در جریان اطلاعات بیشتری از این ایونت قرار بگیرید، عضو گروه تلگرام ایونت به نشانی <a href="https://t.me/+YMKc5Kxk3eYzODA0" target="_blank" rel="noopener noreferrer" dir="ltr">t.me/+YMKc5Kxk3eYzODA0</a> شوید.</p><p>برای پرسیدن سؤال از میهمانان ایونت، می‌توانید به بات تلگرامی ایونت به نشانی <a href="https://t.me/BanyanEventsBot" target="_blank" rel="noopener noreferrer" dir="ltr">t.me/BanyanEventsBot</a> مراجعه کنید.</p></div></div></div>}
    </section></div></main>;
}
