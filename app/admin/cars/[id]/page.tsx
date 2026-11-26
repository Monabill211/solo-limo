import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin, serviceClient } from '@/app/lib/admin-server';
import type { CarRow } from '@/app/components/admin/carform';
import EditCar from './EditCar';

export default async function AdminCarPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data, error } = await serviceClient()
    .from('cars').select('*, costs(cost_egp)').eq('id', id).maybeSingle();

  if (error?.code === '22P02' || (!data && !error)) notFound();
  if (error) return <p role="alert" className="text-red-300">تعذّر تحميل بيانات السيارة.</p>;
  if (!data) notFound();

  const costs = Array.isArray(data.costs) ? data.costs[0] : data.costs;
  const car = {
    ...data,
    images: data.images ?? [],
    price_egp: Number(data.price_egp),
    price_usd: Number(data.price_usd),
    cost_egp: costs?.cost_egp == null ? null : Number(costs.cost_egp),
  } as CarRow;

  return (
    <section>
      <Link href="/admin/cars" className="font-bold text-gold hover:underline">كل السيارات</Link>
      <h1 className="mt-4 text-3xl font-extrabold">{car.name_ar}</h1>
      <EditCar car={car} />
    </section>
  );
}
