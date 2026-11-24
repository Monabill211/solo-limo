export type Currency = 'EGP' | 'USD';

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(input: {
  unit: number;
  days: number;
  currency: Currency;
  rate: number; // سعر الدولار بالجنيه
  extras: { price: number; perDay: boolean }[];
  discount?: { type: 'percent' | 'fixed'; value: number } | null;
}) {
  const base = round2(input.unit * input.days);
  const extrasTotal = round2(
    input.extras.reduce((s, e) => s + (e.perDay ? e.price * input.days : e.price), 0)
  );
  const subtotal = round2(base + extrasTotal);

  let discountAmount = 0;
  if (input.discount) {
    discountAmount =
      input.discount.type === 'percent'
        ? (subtotal * input.discount.value) / 100
        : input.currency === 'EGP'
          ? input.discount.value
          : input.discount.value / input.rate; // المبلغ الثابت بالجنيه
    discountAmount = round2(Math.min(discountAmount, subtotal));
  }

  return {
    base,
    extrasTotal,
    subtotal,
    discountAmount,
    total: round2(Math.max(0, subtotal - discountAmount)),
  };
}

// بيرجّع سبب رفض الكود، أو null لو الكود سليم
export function discountProblem(d: any, userId: string) {
  if (!d) return 'discount_invalid';
  if (!d.active) return 'discount_inactive';
  if (d.expires_at && new Date(d.expires_at) < new Date()) return 'discount_expired';
  if (d.max_uses !== null && d.used_count >= d.max_uses) return 'discount_used_up';
  if (d.customer_id && d.customer_id !== userId) return 'discount_not_yours';
  return null;
}