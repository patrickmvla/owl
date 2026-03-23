export default function MarketLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-border px-6 py-3">
        <div className="h-8 w-64 animate-pulse rounded-sm bg-card" />
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex gap-2">
          <div className="h-7 w-16 animate-pulse rounded-sm bg-card" />
          <div className="h-7 w-16 animate-pulse rounded-sm bg-card" />
          <div className="h-7 w-16 animate-pulse rounded-sm bg-card" />
        </div>
        <div className="space-y-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-sm bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
