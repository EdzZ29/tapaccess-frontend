/**
 * Shown the moment a card is tapped, while the profile loads. It mirrors the
 * real page (top bar, headline, two big buttons, facts, sections and the
 * Call / Save contact bar) so nothing jumps when the content arrives.
 */
export default function Loading() {
  return (
    <div className="min-h-dvh bg-[#f6f6f7]" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading the business profile…</p>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[520px] flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-[max(env(safe-area-inset-top),1.5rem)]">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-3 w-28 rounded-full" />
          </div>
          <div className="skeleton h-10 w-10 rounded-full" />
        </div>

        {/* Hero */}
        <div className="px-6 pt-14 pb-10">
          <div className="skeleton h-2.5 w-24 rounded-full" />
          <div className="mt-6 space-y-3">
            <div className="skeleton h-11 w-11/12 rounded-xl" />
            <div className="skeleton h-11 w-2/3 rounded-xl" />
          </div>
          <div className="mt-6 space-y-2.5">
            <div className="skeleton h-3.5 w-full rounded-full" />
            <div className="skeleton h-3.5 w-4/5 rounded-full" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="skeleton h-14 rounded-2xl" />
            <div className="skeleton h-14 rounded-2xl" />
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-black/5 pt-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-2.5 w-14 rounded-full" />
                <div className="skeleton h-3.5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4 px-6 pt-4">
          <div className="skeleton h-3 w-28 rounded-full" />
          <div className="skeleton h-14 rounded-2xl" />
          <div className="skeleton h-14 rounded-2xl" />
        </div>

        {/* Call / Save contact bar */}
        <div className="sticky bottom-0 mt-auto border-t border-black/5 bg-[#f6f6f7]/90 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.875rem)] backdrop-blur">
          {/* Only seen when a card opens for the first time while the server wakes up. */}
          <div className="grid pb-3 text-center text-sm text-neutral-500" aria-hidden>
            <p className="load-note-1 [grid-area:1/1]">Opening the card…</p>
            <p className="load-note-2 [grid-area:1/1]">Almost there. The first open takes a few seconds.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-[52px] rounded-2xl" />
            <div className="skeleton h-[52px] rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
