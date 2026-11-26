import Link from 'next/link';
import { requireAdmin, serviceClient } from '@/app/lib/admin-server';

const PAGE_SIZE = 25;
const money = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' });

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const { page: value } = await searchParams;
  const parsed = Number(value);
  const page = Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 1000000 ? parsed : 1;
  const start = (page - 1) * PAGE_SIZE;
  const { data, error, count } = await serviceClient().from('bookings')
    .select('id, created_at, customer_name, currency, exchange_rate, total, booking_finance(total_cost_egp)', { count: 'exact' })
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .order('id')
    .range(start, start + PAGE_SIZE - 1);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold">الماليات</h1>
        <p className="mt-2 text-muted">إيرادات وتكاليف الحجوزات المدفوعة بالجنيه المصري.</p>
      </div>
      {error ? <p role="alert" className="text-red-300">تعذّر تحميل البيانات المالية.</p> : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-line bg-navy-light">
            <table className="w-full whitespace-nowrap text-start">
              <thead className="border-b border-line text-gold">
                <tr>{['العميل', 'التاريخ', 'الإيراد', 'التكلفة', 'صافي الربح'].map((label) => <th key={label} scope="col" className="p-4 text-start">{label}</th>)}</tr>
              </thead>
              <tbody>
                {!data?.length && <tr><td colSpan={5} className="p-4 text-muted">لا توجد حجوزات مدفوعة في هذه الصفحة.</td></tr>}
                {data?.map((booking) => {
                  const finance = Array.isArray(booking.booking_finance) ? booking.booking_finance[0] : booking.booking_finance;
                  const amount = booking.total == null ? null : Number(booking.total);
                  const rate = booking.currency === 'USD' ? Number(booking.exchange_rate) : 1;
                  const revenue = amount !== null && Number.isFinite(amount) && rate > 0 ? amount * rate : null;
                  const cost = finance?.total_cost_egp == null ? null : Number(finance.total_cost_egp);
                  const profit = revenue === null || cost === null ? null : revenue - cost;
                  return (
                    <tr key={booking.id} className="border-b border-line last:border-0">
                      <td className="p-4">{booking.customer_name}</td>
                      <td className="p-4">{new Date(booking.created_at).toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</td>
                      {[revenue, cost, profit].map((amount, index) => (
                        <td key={index} className="p-4">{amount === null ? '—' : money.format(amount)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav aria-label="صفحات الماليات" className="flex gap-4 text-gold">
            {page > 1 && <Link href={`?page=${page - 1}`}>السابق</Link>}
            {(count ?? 0) > start + PAGE_SIZE && <Link href={`?page=${page + 1}`}>التالي</Link>}
          </nav>
        </>
      )}
    </section>
  );
}
