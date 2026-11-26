import { serviceClient } from './admin-server';

export async function getUsdRate() {
  const { data, error } = await serviceClient()
    .from('settings')
    .select('value')
    .eq('key', 'usd_egp_rate')
    .single();
  if (error) throw error;
  const rate: unknown = data.value;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0.000001 || rate > 99999999.999999) {
    throw new Error('Invalid usd_egp_rate');
  }
  return Number(rate.toFixed(6));
}
