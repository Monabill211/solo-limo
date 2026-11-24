// ⚠️ راجع تفاصيل الـ API مع توثيق Paymob الحالي قبل الإطلاق

export const paymobEnabled = () =>
  !!(
    process.env.PAYMOB_SECRET_KEY &&
    process.env.PAYMOB_PUBLIC_KEY &&
    process.env.PAYMOB_INTEGRATION_ID
  );

export async function createCheckout(input: {
  bookingId: string;
  amount: number;
  currency: 'EGP' | 'USD';
  name: string;
  phone: string;
  email: string;
  itemName: string;
  origin: string;
}) {
  const cents = Math.round(input.amount * 100);
  const [first, ...rest] = input.name.split(' ');

  const res = await fetch('https://accept.paymob.com/v1/intention/', {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: cents,
      currency: input.currency,
      payment_methods: [Number(process.env.PAYMOB_INTEGRATION_ID)],
      items: [
        { name: input.itemName, amount: cents, description: input.itemName, quantity: 1 },
      ],
      billing_data: {
        first_name: first || 'Customer',
        last_name: rest.join(' ') || 'Solo',
        email: input.email,
        phone_number: input.phone,
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        shipping_method: 'NA',
        postal_code: 'NA',
        city: 'NA',
        country: 'EG',
        state: 'NA',
      },
      special_reference: input.bookingId,
      notification_url: `${input.origin}/api/payments/webhook`,
      redirection_url: `${input.origin}/booking/success`,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.client_secret) throw new Error('paymob_failed');

  return {
    url: `https://accept.paymob.com/unifiedcheckout/?publicKey=${process.env.PAYMOB_PUBLIC_KEY}&clientSecret=${data.client_secret}`,
    orderId: String(data.intention_order_id ?? data.id ?? ''),
  };
}