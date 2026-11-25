import ItemDetails from '@/app/components/details/ItemDetails';

export default async function CarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ItemDetails type="car" id={id} />;
}
