import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { ListingForm } from "../../new/ListingForm";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const listing = await api.tianiShop.getListing({
    id: Number.parseInt(listingId),
  });

  // Check if the user is the publisher
  const session = await auth();
  if (!session || listing.publisherId !== session.user.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="font-bold text-2xl">編輯商品</h1>
      <ListingForm mode="edit" initialData={listing} />
    </div>
  );
}
