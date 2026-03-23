import { createStore, useStore } from "zustand";
import type { CurrencyCode } from "@/lib/constants/currencies";

interface UIState {
  preferredCurrency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

export const uiStore = createStore<UIState>((set) => ({
  preferredCurrency: (typeof window !== "undefined"
    ? (localStorage.getItem("owl:currency") as CurrencyCode)
    : null) ?? "USD",

  setCurrency: (currency) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("owl:currency", currency);
    }
    set({ preferredCurrency: currency });
  },
}));

export function useCurrency(): [CurrencyCode, (c: CurrencyCode) => void] {
  const currency = useStore(uiStore, (s) => s.preferredCurrency);
  const setCurrency = useStore(uiStore, (s) => s.setCurrency);
  return [currency, setCurrency];
}
