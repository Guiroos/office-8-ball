export default function HeadToHeadLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-pill bg-surface-emphasis" />
          <div className="h-7 w-44 rounded-md bg-surface-emphasis" />
        </div>

        {/* Team selectors */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm shadow-foreground/5">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded-pill bg-surface-emphasis" />
              <div className="h-10 w-full rounded-xl bg-surface-emphasis" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm shadow-foreground/5">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded-pill bg-surface-emphasis" />
              <div className="h-10 w-full rounded-xl bg-surface-emphasis" />
            </div>
          </div>
        </div>

        {/* VS summary */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
          <div className="flex items-center justify-around gap-4">
            <div className="space-y-2 text-center">
              <div className="mx-auto h-10 w-28 rounded-md bg-surface-emphasis" />
              <div className="mx-auto h-3 w-16 rounded-pill bg-surface-emphasis" />
            </div>
            <div className="h-8 w-8 rounded-full bg-surface-emphasis" />
            <div className="space-y-2 text-center">
              <div className="mx-auto h-10 w-28 rounded-md bg-surface-emphasis" />
              <div className="mx-auto h-3 w-16 rounded-pill bg-surface-emphasis" />
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="space-y-1 rounded-xl border border-border bg-surface p-4 shadow-sm shadow-foreground/5"
            >
              <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
              <div className="h-8 w-16 rounded-md bg-surface-emphasis" />
            </div>
          ))}
        </div>

        {/* Match history */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-md bg-surface-emphasis" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-emphasis p-3"
              >
                <div className="h-3 w-28 rounded-pill bg-surface-muted" />
                <div className="h-5 w-16 rounded-pill bg-surface-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
