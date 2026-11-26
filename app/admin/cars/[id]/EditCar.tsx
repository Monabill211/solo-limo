'use client';

import { useRouter } from 'next/navigation';
import CarForm, { type CarRow } from '@/app/components/admin/carform';

export default function EditCar({ car }: { car: CarRow }) {
  const router = useRouter();
  const back = () => {
    router.replace('/admin/cars');
    router.refresh();
  };
  return <CarForm initial={car} onSaved={back} onClose={back} />;
}
