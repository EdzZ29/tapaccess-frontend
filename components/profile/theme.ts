import type { CSSProperties } from "react";
import { FONT_STACKS, HEADLINE_STYLE } from "@/lib/fonts";
import type { Theme } from "@/lib/types";
import { readableOn, withAlpha } from "@/lib/utils";

/**
 * Turns a card's theme into CSS custom properties. Every profile component
 * reads only these variables, so the live page and the editor preview render
 * identically from the same theme object.
 */
export function themeVars(t: Theme): CSSProperties {
  const headline = HEADLINE_STYLE[t.fontHeading];
  return {
    "--p-primary": t.primaryColor,
    "--p-on-primary": readableOn(t.primaryColor),
    "--p-accent": t.accentColor,
    "--p-on-accent": readableOn(t.accentColor),
    "--p-bg": t.backgroundColor,
    "--p-surface": t.surfaceColor,
    "--p-text": t.textColor,
    "--p-muted": t.mutedTextColor,
    "--p-border": withAlpha(t.textColor, 0.1),
    "--p-hairline": withAlpha(t.textColor, 0.08),
    "--p-soft": withAlpha(t.primaryColor, 0.08),
    "--p-accent-soft": withAlpha(t.accentColor, 0.12),
    "--p-font-heading": FONT_STACKS[t.fontHeading],
    "--p-font-body": FONT_STACKS[t.fontBody],
    "--p-heading-weight": String(headline.weight),
    "--p-heading-tracking": headline.tracking,
    color: t.textColor,
    fontFamily: FONT_STACKS[t.fontBody],
  } as CSSProperties;
}

/** Page background. Gradients stay available but are kept very soft. */
export function backgroundStyle(t: Theme): CSSProperties {
  if (t.backgroundStyle === "gradient") {
    return { background: `linear-gradient(180deg, ${t.backgroundColor} 0%, ${t.gradientTo} 100%)` };
  }
  if (t.backgroundStyle === "image" && t.backgroundImageUrl) {
    // A flat wash of the background colour keeps text readable over any photo.
    return {
      backgroundColor: t.backgroundColor,
      backgroundImage: `linear-gradient(${withAlpha(t.backgroundColor, 0.86)}, ${withAlpha(t.backgroundColor, 0.86)}), url("${encodeURI(t.backgroundImageUrl)}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    };
  }
  return { backgroundColor: t.backgroundColor };
}

/** Accent fill that reads as "the" action, on a photo or on a plain background. */
export const HIGHLIGHT: CSSProperties = {
  background: "var(--p-accent)",
  color: "var(--p-on-accent)",
  borderColor: "transparent",
};

export const shapeClass = (t: Theme) =>
  t.buttonShape === "pill" ? "rounded-full" : t.buttonShape === "square" ? "rounded-lg" : "rounded-2xl";

/** Shared headline style: big, tight, in the card's heading font. */
export const headingStyle: CSSProperties = {
  fontFamily: "var(--p-font-heading)",
  fontWeight: "var(--p-heading-weight)" as unknown as number,
  letterSpacing: "var(--p-heading-tracking)",
};

/** Inline styles for a call-to-action button in the card's chosen style. */
export function buttonStyle(t: Theme, highlighted = false): CSSProperties {
  if (highlighted) return { background: "var(--p-accent)", color: "var(--p-on-accent)", borderColor: "transparent" };
  switch (t.buttonStyle) {
    case "solid":
      return { background: "var(--p-primary)", color: "var(--p-on-primary)", borderColor: "transparent" };
    case "soft":
      return { background: "var(--p-surface)", color: "var(--p-text)", borderColor: "var(--p-border)" };
    case "outline":
      return { background: "transparent", color: "var(--p-text)", borderColor: "var(--p-text)" };
    case "glass":
      return {
        background: withAlpha(t.surfaceColor, 0.6),
        color: "var(--p-text)",
        borderColor: "var(--p-border)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      };
  }
}
