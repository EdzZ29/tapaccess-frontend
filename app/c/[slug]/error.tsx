"use client";

import { CardLoadError } from "@/components/profile/status-pages";

export default function ProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <CardLoadError
      action={
        <button
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white"
        >
          Try again
        </button>
      }
    />
  );
}
