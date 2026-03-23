export default function CoinDetailLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-border px-6 py-3">
        <div className="h-6 w-32 animate-pulse rounded-sm bg-card" />
        <div className="h-8 w-24 animate-pulse rounded-sm bg-card ml-auto" />
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-card" />
        <div className="h-[400px] animate-pulse rounded-sm bg-card" />
        <div className="grid grid-cols-4 gap-px">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
