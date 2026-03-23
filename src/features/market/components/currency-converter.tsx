"use client";

import { useState, useMemo } from "react";
import { ArrowsDownUp, CaretDown } from "@phosphor-icons/react";
import { useExchangeRates } from "../hooks/use-exchange-rates";
import { CURRENCIES } from "@/lib/constants/currencies";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { ScrollArea } from "@/ui/components/scroll-area";

export function CurrencyConverter() {
  const { data: rates } = useExchangeRates();
  const [amount, setAmount] = useState("1000");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("ZMW");

  const result = useMemo(() => {
    if (!rates || !amount) return null;
    const fromRate = rates[fromCurrency.toLowerCase()];
    const toRate = rates[toCurrency.toLowerCase()];
    if (!fromRate || !toRate) return null;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return null;
    return amountNum * (toRate.value / fromRate.value);
  }, [rates, amount, fromCurrency, toCurrency]);

  const rate = useMemo(() => {
    if (!rates) return null;
    const fromRate = rates[fromCurrency.toLowerCase()];
    const toRate = rates[toCurrency.toLowerCase()];
    if (!fromRate || !toRate) return null;
    return toRate.value / fromRate.value;
  }, [rates, fromCurrency, toCurrency]);

  function handleSwap() {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }

  const fromInfo = CURRENCIES.find((c) => c.code === fromCurrency);
  const toInfo = CURRENCIES.find((c) => c.code === toCurrency);

  return (
    <div className="space-y-1">
      <span className="label-micro">Convert</span>

      <div className="space-y-1.5">
        {/* From row */}
        <div className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50">
          <span className="text-xs text-muted-foreground">{fromInfo?.symbol}</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-xs tabular-nums font-medium placeholder:text-muted-foreground focus:outline-none"
            placeholder="1000"
          />
          <CurrencyPicker value={fromCurrency} onChange={setFromCurrency} />
        </div>

        {/* Swap */}
        <div className="flex items-center gap-2 px-2">
          <div className="h-px flex-1 bg-border/50" />
          <button
            onClick={handleSwap}
            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Swap currencies"
          >
            <ArrowsDownUp size={10} />
          </button>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* To row */}
        <div className="flex items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted/50">
          <span className="text-xs text-muted-foreground">{toInfo?.symbol}</span>
          <span className="flex-1 text-xs tabular-nums font-medium">
            {result != null
              ? result.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "—"}
          </span>
          <CurrencyPicker value={toCurrency} onChange={setToCurrency} />
        </div>

        {/* Rate */}
        {rate != null && (
          <div className="px-2 text-[10px] text-muted-foreground tabular-nums">
            1 {fromCurrency} = {rate.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {toCurrency}
          </div>
        )}
      </div>
    </div>
  );
}

function CurrencyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const info = CURRENCIES.find((c) => c.code === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {info?.code ?? value}
          <CaretDown size={10} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-0">
        <ScrollArea className="h-64">
          <DropdownMenuRadioGroup value={value} onValueChange={onChange} className="p-1">
            {CURRENCIES.map((c) => (
              <DropdownMenuRadioItem key={c.code} value={c.code} className="text-xs">
                {c.symbol} {c.code} — {c.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
