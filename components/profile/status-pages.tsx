import { CirclePause, SearchX, WifiOff, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Neutral, friendly pages for when a tapped card cannot show its profile.
 * They deliberately reveal nothing about the business behind the slug.
 */
function StatusPage({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-6 text-slate-900">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-900/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="mt-5 text-xl font-semibold">{title}</h1>
        <div className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">{children}</div>
        {action && <div className="mt-6">{action}</div>}
        <p className="mt-8 text-xs text-slate-400">
          Powered by <span className="font-semibold">TapAccess</span>
          {" · "}
          <a href="/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </a>
        </p>
      </div>
    </main>
  );
}

export function CardUnavailable() {
  return (
    <StatusPage icon={CirclePause} title="This card is currently unavailable">
      The profile linked to this card isn&apos;t active right now. Please check back later or contact the business directly.
    </StatusPage>
  );
}

export function CardNotFound() {
  return (
    <StatusPage icon={SearchX} title="Card not found">
      We couldn&apos;t find a profile for this link. The card may not be set up yet.
    </StatusPage>
  );
}

export function CardLoadError({ action }: { action?: ReactNode }) {
  return (
    <StatusPage icon={WifiOff} title="Couldn't load this profile" action={action}>
      Something went wrong on our side. Please try again in a moment.
    </StatusPage>
  );
}
