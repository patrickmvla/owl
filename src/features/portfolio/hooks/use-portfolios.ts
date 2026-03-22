"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function usePortfolios() {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const res = await fetch("/api/v0/portfolio");
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Failed to fetch portfolios: ${res.status} ${body}`);
      }
      return res.json();
    },
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/v0/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Failed to create portfolio: ${res.status} ${body}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v0/portfolio/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete portfolio");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });
}
