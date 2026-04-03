export default function TimesLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <div className="h-3 w-10 rounded-pill bg-surface-emphasis" />
            <div className="h-7 w-32 rounded-md bg-surface-emphasis" />
          </div>
          <div className="h-10 w-full rounded-xl bg-surface-emphasis xl:max-w-sm" />
        </div>

        {/* Content grid */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
          {/* Team cards list */}
          <section className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface p-5 shadow-sm shadow-foreground/5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="h-3 w-16 rounded-pill bg-surface-emphasis" />
                      <div className="h-6 w-40 rounded-md bg-surface-emphasis" />
                    </div>
                    <div className="h-6 w-14 rounded-pill bg-surface-emphasis" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div
                        key={j}
                        className="space-y-1 rounded-lg border border-border bg-surface-emphasis p-3"
                      >
                        <div className="h-3 w-16 rounded-pill bg-surface-muted" />
                        <div className="h-6 w-10 rounded-md bg-surface-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Aside */}
          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="space-y-3">
                <div className="h-4 w-32 rounded-md bg-surface-emphasis" />
                <div className="h-3 w-full rounded-pill bg-surface-emphasis" />
                <div className="h-3 w-4/5 rounded-pill bg-surface-emphasis" />
                <div className="mt-4 h-9 w-36 rounded-pill bg-surface-emphasis" />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-emphasis p-5">
              <div className="space-y-2">
                <div className="h-3 w-20 rounded-pill bg-surface-muted" />
                <div className="h-7 w-28 rounded-md bg-surface-muted" />
                <div className="h-3 w-full rounded-pill bg-surface-muted" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
