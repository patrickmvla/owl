import type { Metadata } from "next";
import { PortfolioView } from "@/features/portfolio/components/portfolio-view";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Track your holdings and P&L",
};

export default function PortfolioPage() {
  return <PortfolioView />;
}
