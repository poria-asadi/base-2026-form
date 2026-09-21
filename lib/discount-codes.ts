export type DiscountCode = { code: string; percent: number; active: boolean };
// کدهای نهایی رویداد را در این فهرست اضافه کنید.
// نمونه: { code: "BANYAN20", percent: 20, active: true }
export const discountCodes: DiscountCode[] = [];
export function findDiscount(rawCode: string) { const code = rawCode.trim().toUpperCase(); return discountCodes.find((item) => item.active && item.code.toUpperCase() === code); }
