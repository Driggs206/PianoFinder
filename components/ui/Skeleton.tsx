export function SkeletonCard() {
  return (
    <div className="border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="skeleton h-5 w-48 rounded" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="skeleton h-3 w-32 rounded" />
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}

export function SkeletonMap() {
  return (
    <div className="w-full h-full skeleton rounded-xl" />
  );
}
