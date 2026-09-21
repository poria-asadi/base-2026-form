export const educationOptions = ["فارغ‌التحصیل", "دانشجوی دکتری", "دانشجوی کارشناسی ارشد", "دانشجوی کارشناسی"] as const;
export const sourceOptions = ["کانال‌های تلگرامی", "لینکدین", "اینستاگرام", "دوستان و همکاران"] as const;
const persianText = /^[\u0600-\u06FF\u200c\s\-]+$/u;
export function validateRegistration(input: Record<string, unknown>) {
  const fullName = String(input.fullName ?? "").trim().replace(/\s+/g, " ");
  const city = String(input.city ?? "").trim(); const field = String(input.field ?? "").trim();
  const phone = String(input.phone ?? "").trim(); const email = String(input.email ?? "").trim().toLowerCase();
  const education = String(input.education ?? ""); const source = String(input.source ?? ""); const age = Number(input.age);
  if (fullName.length < 5 || fullName.split(" ").length < 2 || !persianText.test(fullName)) throw new Error("نام و نام خانوادگی معتبر نیست.");
  if (!Number.isInteger(age) || age < 12 || age > 100) throw new Error("سن واردشده معتبر نیست.");
  if (city.length < 2 || !persianText.test(city)) throw new Error("نام شهر معتبر نیست.");
  if (field.length < 2 || field.length > 120) throw new Error("رشته یا حوزه کاری معتبر نیست.");
  if (!educationOptions.includes(education as typeof educationOptions[number])) throw new Error("مقطع تحصیلی معتبر نیست.");
  if (!/^09\d{9}$/.test(phone)) throw new Error("شماره موبایل معتبر نیست.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) throw new Error("آدرس ایمیل معتبر نیست.");
  if (!sourceOptions.includes(source as typeof sourceOptions[number])) throw new Error("نحوه آشنایی معتبر نیست.");
  return { fullName, age, city, field, education, phone, email, source };
}
