import type { CardPlan, PublicProfile, SectionType, SocialPlatform } from "./types";

/**
 * Package rules, mirrored from `tapaccess-backend/src/common/plans.ts`. The
 * API enforces them on the public page; this copy keeps the editor preview
 * and the locked controls in step with what visitors will actually see.
 * Every package gets the full theme editor.
 */
export interface PlanFeatures {
  images: boolean;
  socialPlatforms: readonly SocialPlatform[] | "all";
  sections: readonly SectionType[] | "all";
  /** Shown whenever they have content, regardless of their toggle. */
  alwaysOn: readonly SectionType[];
}

export const PLAN_FEATURES: Record<CardPlan, PlanFeatures> = {
  starter: {
    images: false,
    socialPlatforms: ["facebook", "instagram", "tiktok", "x", "google_reviews"],
    sections: ["actions", "about", "contact", "social"],
    alwaysOn: ["contact", "social"],
  },
  business: { images: true, socialPlatforms: "all", sections: "all", alwaysOn: [] },
};

export const PLAN_META: Record<CardPlan, { label: string; tagline: string; features: string[] }> = {
  starter: {
    label: "Starter",
    tagline: "About, buttons, contact details and social links",
    features: [
      "Business name, short description & about",
      "Custom CTA buttons",
      "Contact details, Call & Save contact",
      "Facebook, Instagram, TikTok, X & Google Reviews",
      "All themes, colours & fonts",
    ],
  },
  business: {
    label: "Business",
    tagline: "Photos, every section and all socials",
    features: [
      "Everything in Starter",
      "Logo, cover & photo gallery",
      "Services, products, promotions, hours & map",
      "Every social network",
    ],
  },
};

export const sectionAllowed = (plan: CardPlan, type: SectionType) => {
  const s = PLAN_FEATURES[plan].sections;
  return s === "all" || s.includes(type);
};

export const sectionAlwaysOn = (plan: CardPlan, type: SectionType) => PLAN_FEATURES[plan].alwaysOn.includes(type);

export const socialAllowed = (plan: CardPlan, platform: SocialPlatform) => {
  const p = PLAN_FEATURES[plan].socialPlatforms;
  return p === "all" || p.includes(platform);
};

/** Expects sections already filtered by `enabled` (or always-on) by the caller. */
export function applyPlan(profile: PublicProfile, plan: CardPlan): PublicProfile {
  const f = PLAN_FEATURES[plan];
  const image = (url: string | null) => (f.images ? url : null);
  return {
    ...profile,
    logoUrl: image(profile.logoUrl),
    coverUrl: image(profile.coverUrl),
    theme: { ...profile.theme, backgroundImageUrl: image(profile.theme.backgroundImageUrl) },
    sections: profile.sections
      .filter((s) => sectionAllowed(plan, s.type))
      .map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, imageUrl: image(i.imageUrl) })) })),
    socialLinks: profile.socialLinks.filter((l) => socialAllowed(plan, l.platform)),
  };
}
