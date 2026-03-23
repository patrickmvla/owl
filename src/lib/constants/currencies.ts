/** Supported display currencies for multi-currency pricing.
 *  ADR-004: "Vole supports 35+ currencies. Owl should present
 *  data in the user's local currency." */
export const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "K" },
  { code: "MWK", name: "Malawian Kwacha", symbol: "MK" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
