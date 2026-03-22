"use client";

import { useState, useMemo } from "react";
import { Plus, Trash, Bell, BellSlash, X, Lightning } from "@phosphor-icons/react";
import { Dialog } from "radix-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { useAlertRules, useCreateAlert, useToggleAlert, useDeleteAlert } from "../hooks/use-alerts";
import { usePrice } from "@/features/real-time/stores/price-store";
import { formatPrice } from "@/lib/utils/format";

const CONDITION_LABELS: Record<string, string> = {
  price_above: "Price Above",
  price_below: "Price Below",
  peg_deviation: "Peg Deviation",
};

function ProximityBadge({ rule }: { rule: any }) {
  const wsSymbol = `${rule.symbol}/USDT`;
  const update = usePrice(wsSymbol);

  if (!rule.active) return <span className="text-[10px] text-muted-foreground">inactive</span>;

  if (rule.lastTriggeredAt) {
    const ago = Date.now() - new Date(rule.lastTriggeredAt).getTime();
    const hours = Math.floor(ago / 3600000);
    const label = hours < 1 ? "just now" : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
    return (
      <span className="flex items-center gap-1 text-[10px] text-warning">
        <Lightning size={10} weight="fill" />
        {label}
      </span>
    );
  }

  if (!update) return <span className="text-[10px] text-muted-foreground">no data</span>;

  const threshold = parseFloat(rule.threshold);
  if (rule.condition === "peg_deviation") {
    return <span className="text-[10px] text-muted-foreground">peg rule</span>;
  }

  const distance = Math.abs((update.price - threshold) / threshold) * 100;
  const isClose = distance < 1;
  const isNear = distance < 3;

  return (
    <span className={`text-[10px] tabular-nums ${
      isClose ? "text-warning font-medium" : isNear ? "text-muted-foreground" : "text-muted-foreground/60"
    }`}>
      {distance.toFixed(1)}% away
    </span>
  );
}

function AlertRow({ rule }: { rule: any }) {
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();

  return (
    <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleAlert.mutate({ id: rule.id, active: !rule.active })}
          className={`cursor-pointer transition-colors ${rule.active ? "text-foreground" : "text-muted-foreground"}`}
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
      <div className="flex items-center gap-4">
        <ProximityBadge rule={rule} />
        <span className="label-micro">{rule.notifyVia}</span>
        <button
          onClick={() => deleteAlert.mutate(rule.id)}
          className="cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash size={14} />
        </button>
      </div>
    </div>
  );
}

function SummaryPills({ rules }: { rules: any[] }) {
  const counts = useMemo(() => {
    let active = 0;
    let triggered = 0;
    let inactive = 0;

    for (const r of rules) {
      if (!r.active) {
        inactive++;
      } else if (r.lastTriggeredAt) {
        triggered++;
      } else {
        active++;
      }
    }

    return { active, triggered, inactive };
  }, [rules]);

  return (
    <div className="flex items-center gap-2 border-b border-border px-6 py-2">
      <span className="inline-flex items-center gap-1 rounded-sm bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground">
        {counts.active} Active
      </span>
      {counts.triggered > 0 && (
        <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
          {counts.triggered} Triggered
        </span>
      )}
      {counts.inactive > 0 && (
        <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {counts.inactive} Inactive
        </span>
      )}
    </div>
  );
}

function ActivityFeed({ rules }: { rules: any[] }) {
  const triggered = useMemo(() => {
    return rules
      .filter((r: any) => r.lastTriggeredAt)
      .sort((a: any, b: any) =>
        new Date(b.lastTriggeredAt).getTime() - new Date(a.lastTriggeredAt).getTime(),
      )
      .slice(0, 5);
  }, [rules]);

  if (triggered.length === 0) return null;

  return (
    <div className="border-t border-border p-4 space-y-2">
      <span className="label-micro">Recent Activity</span>
      <div className="space-y-1.5">
        {triggered.map((r: any) => {
          const ago = Date.now() - new Date(r.lastTriggeredAt).getTime();
          const hours = Math.floor(ago / 3600000);
          const label = hours < 1 ? "just now" : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;

          return (
            <div key={r.id} className="flex items-center gap-2 text-[10px]">
              <span className="h-1 w-1 rounded-full bg-warning" />
              <span className="font-medium">{r.symbol}</span>
              <span className="text-muted-foreground">
                {CONDITION_LABELS[r.condition]} {r.condition === "peg_deviation" ? `${r.threshold}%` : formatPrice(parseFloat(r.threshold))}
              </span>
              <span className="ml-auto text-muted-foreground">{label}</span>
            </div>
          );
        })}
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

      {rules?.length ? <SummaryPills rules={rules} /> : null}

      <div className="flex-1 overflow-auto">
        {!rules?.length ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No alert rules yet. Create one to get notified on price changes.
          </div>
        ) : (
          <>
            {rules.map((rule: any) => <AlertRow key={rule.id} rule={rule} />)}
            <ActivityFeed rules={rules} />
          </>
        )}
      </div>

      <CreateAlertDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
