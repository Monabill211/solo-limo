import { serviceClient } from './admin-server';

// سعر الدولار بالجنيه: من جدول settings، ولو مش موجود من .env، وآخرها 50
export async function getUsdRate() {
  try {
    const { data } = await serviceClient()
      .from('settings')
      .select('value')
      .eq('key', 'usd_egp_rate')
      .maybeSingle();

    const n = Number(data?.value);
    if (n > 0) return n;
  } catch {}

  return Number(process.env.USD_EGP_RATE || 50);
}