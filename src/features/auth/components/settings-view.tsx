"use client";

import { useSession } from "../hooks/use-session";
import { useCurrency } from "@/features/real-time/stores/ui-store";
import { CURRENCIES } from "@/lib/constants/currencies";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";

export function SettingsView() {
  const { data: session } = useSession();
  const [currency, setCurrency] = useCurrency();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-3">
        <h1 className="text-sm font-semibold">Settings</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Profile */}
          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <span className="label-micro">Profile</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border">
              <div className="bg-card px-4 py-4">
                <span className="text-[10px] text-muted-foreground">Name</span>
                <div className="mt-1 text-xs font-medium">{session?.user?.name ?? "—"}</div>
              </div>
              <div className="bg-card px-4 py-4">
                <span className="text-[10px] text-muted-foreground">Email</span>
                <div className="mt-1 text-xs font-medium">{session?.user?.email ?? "—"}</div>
              </div>
            </div>
          </div>

          {/* Display preferences */}
          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <span className="label-micro">Display Preferences</span>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium">Currency</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    All prices and P&L displayed in this currency
                  </div>
                </div>
                <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
                  <SelectTrigger className="h-8 w-48 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-xs">
                        {c.symbol} {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium">Theme</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Dark mode is optimized for financial data
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Dark (default)</span>
              </div>
            </div>
          </div>

          {/* Data sources */}
          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <span className="label-micro">Data Sources</span>
            </div>
            <div className="divide-y divide-border">
              {[
                { name: "Binance WebSocket", desc: "Real-time crypto prices", status: "Connected", ok: true },
                { name: "Binance REST", desc: "Historical klines, ticker data", status: "Active", ok: true },
                { name: "CoinGecko REST", desc: "Metadata, market cap, trending", status: "Active", ok: true },
                { name: "Finnhub (Stocks)", desc: "Real-time stock & forex data", status: "Not configured", ok: false },
              ].map((source) => (
                <div key={source.name} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-xs font-medium">{source.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{source.desc}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${source.ok ? "bg-price-up" : "bg-muted-foreground"}`} />
                    <span className={`text-[10px] ${source.ok ? "price-up" : "text-muted-foreground"}`}>
                      {source.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API info */}
          <div className="border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <span className="label-micro">API</span>
            </div>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-xs font-medium">OpenAPI Spec</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Machine-readable API specification</div>
                </div>
                <a href="/api/v0/openapi.json" target="_blank" className="text-[10px] text-foreground underline underline-offset-4 hover:text-muted-foreground">
                  /api/v0/openapi.json
                </a>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-xs font-medium">Interactive Docs</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Scalar API reference with try-it</div>
                </div>
                <a href="/api/v0/docs" target="_blank" className="text-[10px] text-foreground underline underline-offset-4 hover:text-muted-foreground">
                  /api/v0/docs
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
