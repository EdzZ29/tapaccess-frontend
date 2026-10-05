import { Bricolage_Grotesque, Instrument_Serif } from "next/font/google";

// Landing page type: a contemporary grotesque for headlines and an italic
// serif for the occasional accent word. Imported only by the landing page,
// so card pages and the dashboard never download them.
export const displayFont = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-landing-display", display: "swap" });
export const accentFont = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-landing-accent",
  display: "swap",
});
