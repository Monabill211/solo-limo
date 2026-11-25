import AirportBooking from '@/app/components/booking/AirportBooking';
import BookingClient from '@/app/components/booking/BookingClient';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  const { type, id } = await searchParams;
  const itemId = id ?? '';

  if (type === 'airport') return <AirportBooking id={itemId} />;

  return <BookingClient type={type === 'apartment' ? 'apartment' : 'car'} id={itemId} />;
}
