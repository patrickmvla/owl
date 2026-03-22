"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useWatchlists() {
  return useQuery({
    queryKey: ["watchlists"],
    queryFn: async () => {
      const res = await fetch("/api/v0/watchlist");
      if (!res.ok) throw new Error("Failed to fetch watchlists");
      return res.json();
    },
  });
}

export function useCreateWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/v0/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create watchlist");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useWatchlistItems(watchlistId: string) {
  return useQuery({
    queryKey: ["watchlist-items", watchlistId],
    queryFn: async () => {
      const res = await fetch(`/api/v0/watchlist/${watchlistId}/items`);
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
    enabled: !!watchlistId,
  });
}

export function useAddWatchlistItem(watchlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { symbol: string; asset_type: "stock" | "crypto" }) => {
      const res = await fetch(`/api/v0/watchlist/${watchlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add item");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist-items", watchlistId] }),
  });
}

export function useRemoveWatchlistItem(watchlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/v0/watchlist/${watchlistId}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove item");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist-items", watchlistId] }),
  });
}
