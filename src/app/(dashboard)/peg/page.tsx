import type { Metadata } from "next";
import { PegDashboard } from "@/features/peg/components/peg-dashboard";

export const metadata: Metadata = {
  title: "Peg Monitor",
  description: "Track stablecoin peg deviations in real-time",
};

export default function PegPage() {
  return <PegDashboard />;
}
