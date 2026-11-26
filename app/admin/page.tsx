import Link from 'next/link';
import { requireAdmin, serviceClient } from '@/app/lib/admin-server';
import { t } from '../components/admin/ar';

const actions = [
  ['/admin/cars', 'addCar'],
  ['/admin/apartments', 'addApartment'],
  ['/admin/discounts', 'addDiscount'],
  ['/admin/bookings', 'allBookings'],
] as const;
const statusLabels: Record<string, string> = { paid: 'مدفوع', pending: 'معلّق', cancelled: 'ملغي' };
const bookingTypes: Record<string, string> = { car: 'سيارة', apartment: 'شقة', airport: 'المطار' };
const number = new Intl.NumberFormat('ar-EG');

export default async function AdminPage() {
  await requireAdmin();
  const supabase = serviceClient();
  const [all, pending, paid, recent] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
    supabase.from('bookings').select('id, customer_name, booking_type, start_date, status, total, currency')
      .order('created_at', { ascending: false }).limit(5),
  ]);
  const stats = [
    { title: t('statBookings'), count: all.count },
    { title: t('statPending'), count: pending.count },
    { title: 'الحجوزات المدفوعة', count: paid.count },
  ];

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">{t('welcome')}</h1>
        <p className="mt-2 text-muted">{new Date().toLocaleDateString('ar-EG', { dateStyle: 'full', timeZone: 'Africa/Cairo' })}</p>
      </div>
      <nav aria-label="الإجراءات السريعة" className="flex flex-wrap gap-3">
        {actions.map(([href, label]) => <Link key={href} prefetch={false} href={href} className="rounded-xl border border-gold px-4 py-2 font-bold text-gold hover:bg-gold hover:text-navy">{t(label)}</Link>)}
      </nav>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ title, count }) => (
          <div key={title} className="rounded-2xl border border-line bg-navy-light p-5">
            <h2 className="font-bold text-gold">{title}</h2>
            <p className="mt-2 text-3xl font-extrabold">{count === null ? '—' : number.format(count)}</p>
          </div>
        ))}
      </div>
      {(all.error || pending.error || paid.error) && <p role="alert" className="text-red-300">تعذّر تحميل بعض إحصاءات الحجوزات.</p>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-navy-light p-5">
        <h2 className="text-xl font-extrabold text-gold">أحدث الحجوزات</h2>
        {recent.error ? <p role="alert" className="mt-3 text-red-300">تعذّر تحميل أحدث الحجوزات.</p> :
          !recent.data?.length ? <p className="mt-3 text-muted">لا توجد حجوزات بعد.</p> : (
            <table className="mt-3 w-full whitespace-nowrap text-start">
              <thead className="text-muted"><tr>{['العميل', 'الخدمة', 'التاريخ', 'الحالة', 'الإجمالي'].map((label) => <th key={label} scope="col" className="p-3 text-start">{label}</th>)}</tr></thead>
              <tbody>{recent.data.map((booking) => (
                <tr key={booking.id} className="border-t border-line">
                  <td className="p-3">{booking.customer_name}</td>
                  <td className="p-3">{bookingTypes[booking.booking_type] ?? '—'}</td>
                  <td className="p-3"><bdi>{booking.start_date}</bdi></td>
                  <td className="p-3">{statusLabels[booking.status] ?? '—'}</td>
                  <td className="p-3">{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: booking.currency === 'USD' ? 'USD' : 'EGP' }).format(Number(booking.total))}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
      </div>
      <Link prefetch={false} href="/admin/finance" className="inline-block font-bold text-gold hover:underline">عرض الماليات</Link>
    </section>
  );
}
