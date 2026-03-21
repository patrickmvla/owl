export function StatusStrip() {
  return (
    <div
      className="flex h-[var(--status-strip-height)] shrink-0 items-center border-t border-border bg-card px-4"
    >
      <span className="label-micro">live prices will appear here</span>
    </div>
  );
}
