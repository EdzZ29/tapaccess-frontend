import type { Metadata } from "next";
import { CardNotFound } from "@/components/profile/status-pages";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function NotFound() {
  return <CardNotFound />;
}
