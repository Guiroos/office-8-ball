export default function RankingLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse">
        {/* Header + tabs */}
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded-pill bg-surface-emphasis" />
            <div className="h-7 w-40 rounded-md bg-surface-emphasis" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-full xl:max-w-xl">
            <div className="h-10 rounded-xl bg-surface-emphasis" />
            <div className="h-10 rounded-xl bg-surface-emphasis" />
          </div>
        </div>

        {/* Podium top 3 */}
        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm shadow-foreground/5"
            >
              <div className="space-y-3">
                <div className="h-5 w-8 rounded-md bg-surface-emphasis" />
                <div className="h-6 w-36 rounded-md bg-surface-emphasis" />
                <div className="flex gap-3">
                  <div className="space-y-1">
                    <div className="h-3 w-16 rounded-pill bg-surface-emphasis" />
                    <div className="h-5 w-10 rounded-md bg-surface-emphasis" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-20 rounded-pill bg-surface-emphasis" />
                    <div className="h-5 w-12 rounded-md bg-surface-emphasis" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Standings list */}
        <section className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4 shadow-sm shadow-foreground/5"
            >
              <div className="h-5 w-6 rounded-md bg-surface-emphasis" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-40 rounded-md bg-surface-emphasis" />
                <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
              </div>
              <div className="flex gap-6">
                <div className="h-4 w-12 rounded-pill bg-surface-emphasis" />
                <div className="h-4 w-12 rounded-pill bg-surface-emphasis" />
                <div className="h-4 w-14 rounded-pill bg-surface-emphasis" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
