export type DiscountCode = { code: string; percent: number; active: boolean };

// برای افزودن کد جدید، فقط یک ردیف به این فهرست اضافه کنید.
export const discountCodes: DiscountCode[] = [
  { code: "BASE-50", percent: 50, active: true },
  { code: "COTAR-MEMBER", percent: 70, active: true },
  { code: "COTAR-EXECUTIVE", percent: 100, active: true },
  { code: "SPECIAL-GUEST", percent: 100, active: true },
];

const normalizeDiscountCode = (value: string) => value
  .trim()
  .toUpperCase()
  .replace(/[\s\u200c\u200d\u200e\u200f\u2060\ufeff]+/g, "");

export function findDiscount(rawCode: string) {
  const code = normalizeDiscountCode(rawCode);
  return discountCodes.find((item) => item.active && normalizeDiscountCode(item.code) === code);
}
