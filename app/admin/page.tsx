import Link from 'next/link';
import { t } from '../components/admin/ar';
import { connection } from 'next/server';

// ⚠️ كل الأرقام والحجوزات هنا بيانات تجريبية لحد ما نربط Supabase
const STATS = [
  { key: 'statBookings', value: 48, change: 12, kind: 'count' },
  { key: 'statPending', value: 6, change: -2, kind: 'count' },
  { key: 'statRevenue', value: 184500, change: 18, kind: 'money' },
  { key: 'statProfit', value: 71200, change: 9, kind: 'money' },
] as const;

const WEEK = [12400, 18200, 9300, 22100, 15600, 28400, 20500];

const LATEST = [
  { id: 'SL-1048', customer: 'أحمد محمد', type: 'car', name: 'مرسيدس E-Class', from: 2, to: 5, total: 13500, status: 'paid' },
  { id: 'SL-1047', customer: 'سارة علي', type: 'apartment', name: 'جناح بإطلالة على النيل', from: 3, to: 6, total: 9000, status: 'pending' },
  { id: 'SL-1046', customer: 'محمد حسن', type: 'car', name: 'تويوتا كامري', from: 1, to: 2, total: 2500, status: 'paid' },
  { id: 'SL-1045', customer: 'منى إبراهيم', type: 'apartment', name: 'استوديو وسط البلد', from: 4, to: 8, total: 6000, status: 'cancelled' },
  { id: 'SL-1044', customer: 'خالد عمر', type: 'car', name: 'هيونداي ستاريا', from: 5, to: 7, total: 7000, status: 'paid' },
] as const;

const TODAY = [
  { kind: 'pickup', time: '10:30', customer: 'أحمد محمد', name: 'مرسيدس E-Class' },
  { kind: 'return', time: '14:00', customer: 'محمد حسن', name: 'تويوتا كامري' },
  { kind: 'pickup', time: '18:15', customer: 'سارة علي', name: 'جناح بإطلالة على النيل' },
] as const;

const STATUS_STYLE: Record<string, string> = {
  paid: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  pending: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  cancelled: 'border-red-500/40 bg-red-500/10 text-red-300',
};

const ic = (path: React.ReactNode, size = 'h-6 w-6') => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={size}
  >
    {path}
  </svg>
);

const STAT_ICONS = {
  statBookings: ic(
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  statPending: ic(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  statRevenue: ic(
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  statProfit: ic(
    <>
      <path d="M3 3v18h18" />
      <path d="m7 15 4-4 3 3 5-6" />
    </>
  ),
};

const ACTIONS = [
  { href: '/admin/cars', key: 'addCar' },
  { href: '/admin/apartments', key: 'addApartment' },
  { href: '/admin/discounts', key: 'addDiscount' },
  { href: '/admin/bookings', key: 'allBookings' },
] as const;

const LOC = 'ar-EG';
const money = (n: number) =>
  new Intl.NumberFormat(LOC, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n);
const num = (n: number) => new Intl.NumberFormat(LOC).format(n);

export default async function AdminPage() {
  await connection();

  // باقي الكود بتاعك زي ما هو...
  const today = new Intl.DateTimeFormat(LOC, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Cairo',
  }).format(new Date());

  // آخر 7 أيام
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return new Intl.DateTimeFormat(LOC, { weekday: 'short', timeZone: 'Africa/Cairo' }).format(d);
  });
  const max = Math.max(...WEEK);

  // تاريخ الحجز التجريبي = يوم من الشهر الحالي
  const day = (n: number) =>
    new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short' }).format(
      new Date(new Date().getFullYear(), new Date().getMonth(), n)
    );

  return (
    <div className="flex flex-col gap-8">
      {/* ---------- الترحيب ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">{t('welcome')}</h1>
          <p className="text-muted" style={{ marginBlockStart: '0.3rem' }}>
            {today}
          </p>
        </div>
        <span
          className="rounded-full border border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-300"
          style={{ padding: '0.3rem 0.9rem' }}
        >
          {t('sampleNote')}
        </span>
      </div>

      {/* ---------- إجراءات سريعة ---------- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ACTIONS.map((a, i) => (
          <Link
            key={a.key}
            href={a.href}
            style={{ padding: '0.9rem 1rem' }}
            className={`flex items-center justify-center gap-2 rounded-2xl border text-center text-sm font-bold transition hover:-translate-y-0.5 sm:text-base ${
              i === 0
                ? 'border-transparent bg-linear-to-br from-gold to-gold-light text-navy hover:shadow-lg hover:shadow-gold/40'
                : 'border-line bg-navy-light text-white hover:border-gold hover:text-gold-light'
            }`}
          >
            {i < 3 && <span className="text-lg leading-none">+</span>}
            {t(a.key)}
          </Link>
        ))}
      </div>

      {/* ---------- الإحصائيات ---------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const up = s.change >= 0;
          return (
            <div
              key={s.key}
              className="group relative overflow-hidden rounded-3xl border border-line bg-navy-light transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl hover:shadow-gold/10"
              style={{ padding: '1.4rem' }}
            >
              <span className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/25" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">{t(s.key)}</p>
                  <p className="text-2xl font-extrabold text-white md:text-3xl" style={{ marginBlockStart: '0.5rem' }}>
                    {s.kind === 'money' ? money(s.value) : num(s.value)}
                  </p>
                </div>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-gold">
                  {STAT_ICONS[s.key]}
                </span>
              </div>

              <p
                className={`relative flex items-center gap-1.5 text-sm font-bold ${
                  up ? 'text-emerald-400' : 'text-red-400'
                }`}
                style={{ marginBlockStart: '1rem' }}
              >
                <span>{up ? '▲' : '▼'}</span>
                <span dir="ltr">{Math.abs(s.change)}%</span>
                <span className="font-normal text-muted">{t('vsLast')}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* ---------- الرسم + حركة النهارده ---------- */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* الرسم */}
        <section className="rounded-3xl border border-line bg-navy-light" style={{ padding: '1.5rem' }}>
          <div style={{ marginBlockEnd: '1.5rem' }}>
            <h2 className="text-xl font-bold text-white">{t('chartTitle')}</h2>
            <p className="text-sm text-muted">{t('chartSub')}</p>
          </div>

          <div className="flex h-52 items-end gap-2 sm:gap-4">
            {WEEK.map((v, i) => (
              <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-bold text-gold-light opacity-0 transition group-hover:opacity-100">
                  {money(v)}
                </span>
                <div
                  className="w-full rounded-t-xl bg-linear-to-t from-gold/40 to-gold transition group-hover:from-gold group-hover:to-gold-light"
                  style={{ height: `${(v / max) * 78}%` }}
                />
                <span className="text-xs text-muted">{days[i]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* حركة النهارده */}
        <section className="rounded-3xl border border-line bg-navy-light" style={{ padding: '1.5rem' }}>
          <h2 className="text-xl font-bold text-white" style={{ marginBlockEnd: '1.25rem' }}>
            {t('todayTitle')}
          </h2>

          <div className="flex flex-col gap-3">
            {TODAY.map((x, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-line bg-navy transition hover:border-gold/60"
                style={{ padding: '0.8rem 0.9rem' }}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                    x.kind === 'pickup' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gold/15 text-gold'
                  }`}
                >
                  {x.kind === 'pickup' ? '↓' : '↑'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-white">{x.name}</p>
                  <p className="truncate text-sm text-muted">
                    {t(x.kind)} · {x.customer}
                  </p>
                </div>
                <span dir="ltr" className="text-sm font-bold text-gold-light">
                  {x.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ---------- آخر الحجوزات ---------- */}
      <section className="rounded-3xl border border-line bg-navy-light" style={{ padding: '1.5rem' }}>
        <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginBlockEnd: '1.25rem' }}>
          <h2 className="text-xl font-bold text-white">{t('latestTitle')}</h2>
          <Link
            href="/admin/bookings"
            style={{ padding: '0.4rem 1.1rem' }}
            className="rounded-xl border border-gold text-sm font-bold text-gold transition hover:bg-gold hover:text-navy"
          >
            {t('viewAll')}
          </Link>
        </div>

        {/* جدول للشاشات الكبيرة */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[40rem] text-start">
            <thead>
              <tr className="border-b border-line text-sm text-muted">
                {(['colId', 'colCustomer', 'colService', 'colDates', 'colTotal', 'colStatus'] as const).map((c) => (
                  <th key={c} className="text-start font-bold" style={{ padding: '0.7rem 0.75rem' }}>
                    {t(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LATEST.map((b) => (
                <tr key={b.id} className="border-b border-line/60 transition hover:bg-navy">
                  <td className="font-bold text-gold-light" style={{ padding: '0.9rem 0.75rem' }}>
                    {b.id}
                  </td>
                  <td className="text-white" style={{ padding: '0.9rem 0.75rem' }}>
                    {b.customer}
                  </td>
                  <td style={{ padding: '0.9rem 0.75rem' }}>
                    <span className="block text-white">{b.name}</span>
                    <span className="text-xs text-muted">{t(b.type)}</span>
                  </td>
                  <td className="text-muted" style={{ padding: '0.9rem 0.75rem' }}>
                    {day(b.from)} ← {day(b.to)}
                  </td>
                  <td className="font-bold text-white" style={{ padding: '0.9rem 0.75rem' }}>
                    {money(b.total)}
                  </td>
                  <td style={{ padding: '0.9rem 0.75rem' }}>
                    <span
                      className={`rounded-full border text-xs font-bold ${STATUS_STYLE[b.status]}`}
                      style={{ padding: '0.25rem 0.8rem' }}
                    >
                      {t(`status_${b.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* كروت للموبايل */}
        <div className="flex flex-col gap-3 md:hidden">
          {LATEST.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-line bg-navy"
              style={{ padding: '1rem' }}
            >
              <div className="flex items-center justify-between gap-2" style={{ marginBlockEnd: '0.6rem' }}>
                <span className="font-bold text-gold-light">{b.id}</span>
                <span
                  className={`rounded-full border text-xs font-bold ${STATUS_STYLE[b.status]}`}
                  style={{ padding: '0.2rem 0.7rem' }}
                >
                  {t(`status_${b.status}`)}
                </span>
              </div>
              <p className="font-bold text-white">{b.customer}</p>
              <p className="text-sm text-muted">
                {b.name} · {t(b.type)}
              </p>
              <div className="flex items-center justify-between text-sm" style={{ marginBlockStart: '0.7rem' }}>
                <span className="text-muted">
                  {day(b.from)} ← {day(b.to)}
                </span>
                <span className="font-bold text-white">{money(b.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}