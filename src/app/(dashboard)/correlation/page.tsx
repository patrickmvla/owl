import type { Metadata } from "next";
import { CorrelationMatrix } from "@/features/correlation/components/correlation-matrix";

export const metadata: Metadata = {
  title: "Correlation",
  description: "Cross-asset correlation analysis",
};

export default function CorrelationPage() {
  return <CorrelationMatrix />;
}
