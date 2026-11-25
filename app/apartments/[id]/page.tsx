import ItemDetails from '@/app/components/details/ItemDetails';

export default async function ApartmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ItemDetails type="apartment" id={id} />;
}
