"use client";

import { useState } from "react";
import { Check, MagnifyingGlass } from "@phosphor-icons/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/popover";
import { useSearch } from "@/features/market/hooks/use-search";
import { cn } from "@/lib/utils/cn";

interface CoinComboboxProps {
  onSelect: (coin: { id: string; symbol: string; name: string; thumb: string }) => void;
}

export function CoinCombobox({ onSelect }: CoinComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: searchResults } = useSearch(query);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex h-8 w-full items-center gap-2 border border-input bg-transparent px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MagnifyingGlass size={14} />
          <span>Search coins to add...</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or symbol..."
            value={query}
            onValueChange={setQuery}
            className="text-xs"
          />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
              {query.length < 2 ? "Type to search..." : "No coins found"}
            </CommandEmpty>
            {searchResults?.coins && searchResults.coins.length > 0 && (
              <CommandGroup>
                {searchResults.coins.slice(0, 8).map((coin) => (
                  <CommandItem
                    key={coin.id}
                    value={coin.id}
                    onSelect={() => {
                      onSelect({
                        id: coin.id,
                        symbol: coin.symbol.toUpperCase(),
                        name: coin.name,
                        thumb: coin.thumb,
                      });
                      setQuery("");
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <img
                      src={coin.thumb}
                      alt={coin.name}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    <span className="font-medium">{coin.symbol.toUpperCase()}</span>
                    <span className="text-muted-foreground">{coin.name}</span>
                    {coin.market_cap_rank && (
                      <span className="ml-auto text-muted-foreground tabular-nums">
                        #{coin.market_cap_rank}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
