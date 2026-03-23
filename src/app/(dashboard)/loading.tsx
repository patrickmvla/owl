export default function DashboardLoading() {
  return (
    <div className="space-y-4 p-6">
      {/* Personal command bar skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-20 animate-pulse rounded-sm bg-card" />
        <div className="h-20 animate-pulse rounded-sm bg-card" />
        <div className="h-20 animate-pulse rounded-sm bg-card" />
      </div>

      {/* Global stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        <div className="h-20 animate-pulse rounded-sm bg-card" />
        <div className="h-20 animate-pulse rounded-sm bg-card" />
        <div className="h-20 animate-pulse rounded-sm bg-card" />
      </div>

      {/* Table skeleton */}
      <div className="space-y-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-sm bg-card" />
        ))}
      </div>
    </div>
  );
}
