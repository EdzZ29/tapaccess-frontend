/** Shown while the profile is fetched; mirrors the hero layout to avoid a jump. */
export default function Loading() {
  return (
    <div className="min-h-dvh bg-neutral-100" aria-busy="true" aria-label="Loading profile">
      <div className="mx-auto flex min-h-dvh max-w-[520px] animate-pulse flex-col px-6 pt-6 pb-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-neutral-300" />
          <div className="h-3 w-32 rounded bg-neutral-300" />
        </div>
        <div className="mt-auto space-y-3">
          <div className="h-3 w-40 rounded bg-neutral-300" />
          <div className="h-12 w-11/12 rounded-xl bg-neutral-300" />
          <div className="h-12 w-3/4 rounded-xl bg-neutral-300" />
          <div className="h-4 w-2/3 rounded bg-neutral-200" />
          <div className="grid grid-cols-2 gap-3 pt-5">
            <div className="h-14 rounded-full bg-neutral-300" />
            <div className="h-14 rounded-full bg-neutral-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
