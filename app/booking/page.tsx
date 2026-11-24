import BookingClient from '@/app/components/booking/BookingClient';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  const { type, id } = await searchParams;

  return <BookingClient type={type === 'apartment' ? 'apartment' : 'car'} id={id ?? ''} />;
}