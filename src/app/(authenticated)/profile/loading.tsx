export default function ProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        {/* Profile header */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="size-20 shrink-0 rounded-full bg-surface-emphasis" />
            <div className="flex-1 space-y-3">
              <div className="h-7 w-40 rounded-md bg-surface-emphasis" />
              <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
              <div className="h-3 w-full max-w-sm rounded-pill bg-surface-emphasis" />
            </div>
            <div className="h-9 w-28 rounded-xl bg-surface-emphasis sm:self-start" />
          </div>
        </div>

        {/* Stats tiles */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="space-y-1 rounded-xl border border-border bg-surface p-4 shadow-sm shadow-foreground/5"
            >
              <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
              <div className="h-8 w-16 rounded-md bg-surface-emphasis" />
            </div>
          ))}
        </section>

        {/* Teams list */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="h-3 w-14 rounded-pill bg-surface-emphasis" />
              <div className="h-5 w-28 rounded-md bg-surface-emphasis" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-emphasis p-3"
              >
                <div className="space-y-1">
                  <div className="h-4 w-36 rounded-md bg-surface-muted" />
                  <div className="h-3 w-20 rounded-pill bg-surface-muted" />
                </div>
                <div className="h-6 w-16 rounded-pill bg-surface-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
