"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { usePortfolios, useCreatePortfolio } from "../hooks/use-portfolios";
import { HoldingsTable } from "./holdings-table";
import { AddHoldingDialog } from "./add-holding-dialog";

export function PortfolioView() {
  const { data: portfolios, isLoading } = usePortfolios();
  const createPortfolio = useCreatePortfolio();
  const [addHoldingOpen, setAddHoldingOpen] = useState(false);

  // Auto-select first portfolio or show create prompt
  const activePortfolio = portfolios?.[0];

  async function handleCreatePortfolio() {
    await createPortfolio.mutateAsync("My Portfolio");
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-card" />
        <div className="h-64 animate-pulse rounded-sm bg-card" />
      </div>
    );
  }

  if (!activePortfolio) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">No portfolios yet</p>
        <button
          onClick={handleCreatePortfolio}
          disabled={createPortfolio.isPending}
          className="flex h-8 items-center gap-2 border border-input px-4 text-xs hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Plus size={14} />
          {createPortfolio.isPending ? "Creating..." : "Create Portfolio"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-sm font-semibold">{activePortfolio.name}</h1>
        <button
          onClick={() => setAddHoldingOpen(true)}
          className="flex h-7 items-center gap-1.5 border border-input px-3 text-xs hover:bg-muted transition-colors"
        >
          <Plus size={14} />
          Add Holding
        </button>
      </div>

      {/* Holdings */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <HoldingsTable portfolioId={activePortfolio.id} />
      </div>

      <AddHoldingDialog
        portfolioId={activePortfolio.id}
        open={addHoldingOpen}
        onOpenChange={setAddHoldingOpen}
      />
    </div>
  );
}
