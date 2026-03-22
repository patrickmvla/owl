"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useHoldings(portfolioId: string) {
  return useQuery({
    queryKey: ["holdings", portfolioId],
    queryFn: async () => {
      const res = await fetch(`/api/v0/portfolio/${portfolioId}/holdings`);
      if (!res.ok) throw new Error("Failed to fetch holdings");
      return res.json();
    },
    enabled: !!portfolioId,
  });
}

export function useCreateHolding(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      symbol: string;
      asset_type: "stock" | "crypto";
      quantity: string;
      avg_cost_basis: string;
      currency?: string;
    }) => {
      const res = await fetch(`/api/v0/portfolio/${portfolioId}/holdings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add holding");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holdings", portfolioId] });
    },
  });
}

export function useDeleteHolding(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holdingId: string) => {
      const res = await fetch(`/api/v0/portfolio/${portfolioId}/holdings/${holdingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete holding");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holdings", portfolioId] });
    },
  });
}
