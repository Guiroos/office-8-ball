export default function AuthenticatedLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6" aria-label="Carregando tela">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
          <div className="space-y-4">
            <div className="h-3 w-28 rounded-pill bg-surface-emphasis" />
            <div className="h-8 w-56 rounded-md bg-surface-emphasis" />
            <div className="h-4 w-full max-w-2xl rounded-md bg-surface-emphasis" />
            <div className="h-4 w-3/4 rounded-md bg-surface-emphasis" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5"
            >
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
                    <div className="h-7 w-36 rounded-md bg-surface-emphasis" />
                  </div>
                  <div className="h-8 w-20 rounded-pill bg-surface-emphasis" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-border bg-surface-emphasis p-4">
                    <div className="h-3 w-20 rounded-pill bg-surface-muted" />
                    <div className="h-8 w-16 rounded-md bg-surface-muted" />
                  </div>
                  <div className="space-y-2 rounded-lg border border-border bg-surface-emphasis p-4">
                    <div className="h-3 w-24 rounded-pill bg-surface-muted" />
                    <div className="h-8 w-20 rounded-md bg-surface-muted" />
                  </div>
                </div>

                <div className="h-11 w-full rounded-xl bg-surface-emphasis" />
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
            <div className="h-4 w-32 rounded-pill bg-surface-emphasis" />
            <div className="h-20 rounded-xl bg-surface-emphasis" />
            <div className="h-20 rounded-xl bg-surface-emphasis" />
            <div className="h-20 rounded-xl bg-surface-emphasis" />
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
            <div className="h-4 w-24 rounded-pill bg-surface-emphasis" />
            <div className="h-28 rounded-xl bg-surface-emphasis" />
            <div className="h-16 rounded-xl bg-surface-emphasis" />
          </div>
        </section>
      </div>
    </main>
  );
}
