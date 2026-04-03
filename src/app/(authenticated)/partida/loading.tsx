export default function PartidaLoading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
          <div className="h-7 w-40 rounded-md bg-surface-emphasis" />
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-foreground/5">
          <div className="space-y-5">
            {/* Team A selector */}
            <div className="space-y-2">
              <div className="h-3 w-20 rounded-pill bg-surface-emphasis" />
              <div className="h-10 w-full rounded-xl bg-surface-emphasis" />
            </div>

            {/* VS divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <div className="h-6 w-8 rounded-md bg-surface-emphasis" />
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Team B selector */}
            <div className="space-y-2">
              <div className="h-3 w-20 rounded-pill bg-surface-emphasis" />
              <div className="h-10 w-full rounded-xl bg-surface-emphasis" />
            </div>

            {/* Winner selector */}
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-pill bg-surface-emphasis" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-xl bg-surface-emphasis" />
                <div className="h-20 rounded-xl bg-surface-emphasis" />
              </div>
            </div>

            {/* Submit */}
            <div className="h-11 w-full rounded-xl bg-surface-emphasis" />
          </div>
        </div>
      </div>
    </main>
  );
}
