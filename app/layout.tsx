import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { fontVariables } from "@/lib/fonts";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <body className="min-h-full">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
