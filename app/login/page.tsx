import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandLogo } from "@/components/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo />
          <h1 className="mt-6 text-xl font-semibold text-ink">Sign in to the dashboard</h1>
          <p className="mt-1 text-sm text-ink-2">Administrator access only.</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
