export function SidebarSkeleton() {
  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Logo skeleton */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-200">
        <div className="h-8 w-8 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-5 w-24 rounded bg-slate-200 animate-pulse" />
      </div>

      {/* Search bar skeleton (for roles that have it) */}
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="h-10 w-full rounded-lg bg-slate-200 animate-pulse" />
      </div>

      {/* Navigation items skeleton */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          >
            <div className="h-5 w-5 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* User section skeleton */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
            <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
