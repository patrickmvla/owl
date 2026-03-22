"use client";

import { useState } from "react";
import { Plus, Trash, Bell, BellSlash, X } from "@phosphor-icons/react";
import { Dialog } from "radix-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { useAlertRules, useCreateAlert, useToggleAlert, useDeleteAlert } from "../hooks/use-alerts";
import { formatPrice } from "@/lib/utils/format";

const CONDITION_LABELS: Record<string, string> = {
  price_above: "Price Above",
  price_below: "Price Below",
  peg_deviation: "Peg Deviation",
};

function AlertRow({ rule }: { rule: any }) {
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();

  return (
    <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleAlert.mutate({ id: rule.id, active: !rule.active })}
          className={`transition-colors ${rule.active ? "text-foreground" : "text-muted-foreground"}`}
        >
          {rule.active ? <Bell size={16} weight="bold" /> : <BellSlash size={16} />}
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{rule.symbol}</span>
            <span className="text-[10px] text-muted-foreground">
              {CONDITION_LABELS[rule.condition] ?? rule.condition}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground tabular-nums">
            {rule.condition === "peg_deviation"
              ? `${rule.threshold}%`
              : formatPrice(parseFloat(rule.threshold))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="label-micro">{rule.notifyVia}</span>
        <button
          onClick={() => deleteAlert.mutate(rule.id)}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash size={14} />
        </button>
      </div>
    </div>
  );
}

function CreateAlertDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState<"crypto" | "stock">("crypto");
  const [condition, setCondition] = useState<"price_above" | "price_below" | "peg_deviation">("price_above");
  const [threshold, setThreshold] = useState("");
  const createAlert = useCreateAlert();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createAlert.mutateAsync({
      symbol: symbol.toUpperCase(),
      asset_type: assetType,
      condition,
      threshold,
    });
    setSymbol("");
    setThreshold("");
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 border border-border bg-background p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-sm font-semibold">Create Alert</Dialog.Title>
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
                placeholder="BTC, USDC..."
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
              <label className="label-micro">Condition</label>
              <Select value={condition} onValueChange={(v) => setCondition(v as typeof condition)}>
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price_above" className="text-xs">Price Above</SelectItem>
                  <SelectItem value="price_below" className="text-xs">Price Below</SelectItem>
                  <SelectItem value="peg_deviation" className="text-xs">Peg Deviation (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="label-micro">
                {condition === "peg_deviation" ? "Deviation %" : "Price (USD)"}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder={condition === "peg_deviation" ? "0.5" : "50000"}
                required
                className="flex h-8 w-full border border-input bg-transparent px-3 text-xs tabular-nums placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={createAlert.isPending}
              className="flex h-8 w-full items-center justify-center bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createAlert.isPending ? "Creating..." : "Create Alert"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AlertsView() {
  const { data: rules, isLoading } = useAlertRules();
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-sm bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-sm font-semibold">Alerts</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex h-7 items-center gap-1.5 border border-input px-3 text-xs hover:bg-muted transition-colors"
        >
          <Plus size={14} />
          Create Alert
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {!rules?.length ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No alert rules yet. Create one to get notified on price changes.
          </div>
        ) : (
          rules.map((rule: any) => <AlertRow key={rule.id} rule={rule} />)
        )}
      </div>

      <CreateAlertDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
