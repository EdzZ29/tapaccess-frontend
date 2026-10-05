import { BrandLogo } from "@/components/brand";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <BrandLogo compact />
      <p className="mt-6 text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-ink-2">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <LinkButton href="/" className="mt-6">
        Back to home
      </LinkButton>
    </main>
  );
}
