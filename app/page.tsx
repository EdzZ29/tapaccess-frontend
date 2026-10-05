import { BarChart3, Palette, RefreshCw } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand";

/**
 * Root of the domain. Customers never sign in and the dashboard is not
 * linked from here; administrators go to /admin directly.
 */
export default function Home() {
  const points = [
    { icon: RefreshCw, title: "Always up to date", text: "Profiles change instantly — the card in your hand never needs rewriting." },
    { icon: Palette, title: "Branded pages", text: "Every business gets its own colours, fonts, photos and layout." },
    { icon: BarChart3, title: "Privacy-friendly", text: "No accounts, no cookies, no tracking of the people who tap." },
  ];
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center px-6 py-5">
        <BrandLogo />
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold text-brand">NFC digital business cards</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
          One tap opens a beautiful, always up-to-date business profile.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-2">
          Hold a TapAccess card near the top of your phone to open the business&apos;s profile — no app required.
        </p>
        <ul className="mt-16 grid gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <li key={p.title} className="rounded-xl border border-line bg-surface p-5">
              <p.icon className="h-5 w-5 text-brand" aria-hidden />
              <h2 className="mt-3 font-semibold text-ink">{p.title}</h2>
              <p className="mt-1 text-sm text-ink-2">{p.text}</p>
            </li>
          ))}
        </ul>
      </main>
      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-xs text-ink-3">
        © TapAccess ·{" "}
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
