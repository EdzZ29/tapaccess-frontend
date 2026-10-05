import {
  Bricolage_Grotesque,
  Inter,
  Inter_Tight,
  Instrument_Serif,
  Lora,
  Manrope,
  Montserrat,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Poppins,
  Space_Grotesk,
} from "next/font/google";
import type { ThemeFont } from "./types";

// Inter (admin UI + default body) and Inter Tight (default profile headline)
// are preloaded. The rest download on demand when a profile uses them.
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta", display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", preload: false });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap", preload: false });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
});
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", preload: false });

/** Class list that defines every font CSS variable; put it on <html>. */
export const fontVariables = [
  inter,
  interTight,
  plusJakarta,
  manrope,
  bricolage,
  instrumentSerif,
  poppins,
  montserrat,
  playfair,
  lora,
  spaceGrotesk,
]
  .map((f) => f.variable)
  .join(" ");

export const FONT_STACKS: Record<ThemeFont, string> = {
  "inter-tight": "var(--font-inter-tight), ui-sans-serif, system-ui, sans-serif",
  "plus-jakarta": "var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif",
  manrope: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
  bricolage: "var(--font-bricolage), ui-sans-serif, system-ui, sans-serif",
  "instrument-serif": "var(--font-instrument-serif), Georgia, serif",
  inter: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  poppins: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
  montserrat: "var(--font-montserrat), ui-sans-serif, system-ui, sans-serif",
  playfair: "var(--font-playfair), Georgia, serif",
  lora: "var(--font-lora), Georgia, serif",
  "space-grotesk": "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
};

/**
 * How each font should be set as a big headline. Display serifs look best
 * light and only slightly tightened; grotesks go heavy and tight.
 */
export const HEADLINE_STYLE: Record<ThemeFont, { weight: number; tracking: string }> = {
  "inter-tight": { weight: 700, tracking: "-0.045em" },
  "plus-jakarta": { weight: 800, tracking: "-0.04em" },
  manrope: { weight: 800, tracking: "-0.04em" },
  bricolage: { weight: 700, tracking: "-0.04em" },
  "instrument-serif": { weight: 400, tracking: "-0.02em" },
  inter: { weight: 700, tracking: "-0.04em" },
  poppins: { weight: 700, tracking: "-0.035em" },
  montserrat: { weight: 800, tracking: "-0.035em" },
  playfair: { weight: 700, tracking: "-0.02em" },
  lora: { weight: 700, tracking: "-0.02em" },
  "space-grotesk": { weight: 700, tracking: "-0.04em" },
};
