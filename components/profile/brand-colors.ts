import type { CSSProperties } from "react";
import type { SocialPlatform, Theme } from "@/lib/types";
import { GOOGLE_REVIEW_STYLE } from "./google";
import { tintedButton } from "./theme";

/** Official brand colours of each network's logo. */
const BRAND: Partial<Record<SocialPlatform, string>> = {
  facebook: "#1877f2",
  tiktok: "#000000",
  youtube: "#ff0000",
  x: "#000000",
  linkedin: "#0a66c2",
  whatsapp: "#25d366",
  telegram: "#26a5e4",
  messenger: "#0084ff",
  pinterest: "#e60023",
  threads: "#000000",
};

/** Instagram's logo is itself a gradient, so the button uses it too. */
const INSTAGRAM =
  "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)";

/**
 * A social button in the network's own colours. Black brands get a faint
 * outline so they stay visible on dark themes. Unknown platforms ("other")
 * fall back to the card's surface style. Soft, outline and glass styles tint
 * the button with the brand colour instead of filling it.
 */
export function socialButtonStyle(platform: SocialPlatform, style: Theme["buttonStyle"] = "solid"): CSSProperties {
  if (style !== "solid") {
    const brand = platform === "google_reviews" ? "#4285f4" : platform === "instagram" ? "#d6249f" : BRAND[platform];
    // Black brands and "other" use the text colour so they show on any theme.
    return tintedButton(style, !brand || brand === "#000000" ? "var(--p-text)" : brand, "#ffffff");
  }
  if (platform === "google_reviews") return { ...GOOGLE_REVIEW_STYLE, border: "1px solid #dadce0" };
  if (platform === "instagram") {
    return { background: INSTAGRAM, color: "#ffffff", border: "1px solid transparent" };
  }
  const color = BRAND[platform];
  if (!color) return { background: "var(--p-surface)", color: "var(--p-text)", border: "1px solid var(--p-hairline)" };
  // Every network's own buttons use white on the brand colour.
  return {
    background: color,
    color: "#ffffff",
    border: `1px solid ${color === "#000000" ? "rgba(255,255,255,0.18)" : "transparent"}`,
  };
}
