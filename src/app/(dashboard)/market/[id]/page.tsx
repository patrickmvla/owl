import { CoinDetail } from "@/features/market/components/coin-detail";

export default async function CoinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CoinDetail coinId={id} />;
}
