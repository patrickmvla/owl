import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Peg Monitor",
};

export default function Page() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold tracking-tight">Peg Monitor</h1>
      <p className="mt-2 text-xs text-muted-foreground">Coming in a later stage.</p>
    </div>
  );
}
