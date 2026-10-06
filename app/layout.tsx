import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import { fontVariables } from "@/lib/fonts";
import { VercelAnalytics } from "@/components/vercel-analytics";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { SITE_URL } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "TapAccess", template: "%s · TapAccess" },
  description: "Smart NFC digital business cards.",
  applicationName: "TapAccess",
};

// Every page gets a per-request CSP nonce from proxy.ts, which only works with
// dynamic rendering (a prerendered page can't carry a fresh nonce).
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    // data-theme is set before hydration by the theme script.
    <html lang="en" className={`${fontVariables} h-full`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        {children}
        <Toaster position="top-center" richColors closeButton />
        <VercelAnalytics />
      </body>
    </html>
  );
}
