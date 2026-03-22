"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { X } from "@phosphor-icons/react";
import { useCreateHolding } from "../hooks/use-holdings";

interface AddHoldingDialogProps {
  portfolioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddHoldingDialog({ portfolioId, open, onOpenChange }: AddHoldingDialogProps) {
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState<"crypto" | "stock">("crypto");
  const [quantity, setQuantity] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const createHolding = useCreateHolding(portfolioId);

  function resetForm() {
    setSymbol("");
    setAssetType("crypto");
    setQuantity("");
    setCostBasis("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await createHolding.mutateAsync({
      symbol: symbol.toUpperCase(),
      asset_type: assetType,
      quantity,
      avg_cost_basis: costBasis,
    });

    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 border border-border bg-background p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-sm font-semibold">Add Holding</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="label-micro">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="BTC, AAPL, ETH..."
                required
                className="flex h-8 w-full border border-input bg-transparent px-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="label-micro">Asset Type</label>
              <div className="flex gap-2">
                {(["crypto", "stock"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAssetType(type)}
                    className={`flex-1 h-8 text-xs border transition-colors ${
                      assetType === type
                        ? "border-foreground bg-foreground/5 text-foreground"
                        : "border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-micro">Quantity</label>
              <input
                type="text"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.5"
                required
                className="flex h-8 w-full border border-input bg-transparent px-3 text-xs tabular-nums placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="label-micro">Avg Cost Basis (USD)</label>
              <input
                type="text"
                inputMode="decimal"
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
                placeholder="42000.00"
                required
                className="flex h-8 w-full border border-input bg-transparent px-3 text-xs tabular-nums placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={createHolding.isPending}
              className="flex h-8 w-full items-center justify-center bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createHolding.isPending ? "Adding..." : "Add Holding"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
