type BuyerProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BuyerProductDetailPage({
  params,
}: BuyerProductDetailPageProps) {
  const { slug } = await params;

  return <main style={{ padding: "24px" }}>Product detail: {slug}</main>;
}
