import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsView } from "@/features/auth/components/settings-view";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-card" />
        <div className="h-32 animate-pulse rounded-sm bg-card" />
      </div>
    }>
      <SettingsView />
    </Suspense>
  );
}
