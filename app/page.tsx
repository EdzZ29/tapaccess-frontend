import {
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Wand2,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand";
import { accentFont, displayFont } from "@/components/landing/fonts";
import { BusinessCarousel } from "@/components/landing/business-carousel";
import { HeroVisual } from "@/components/landing/hero-visual";
import { BrandMark } from "@/components/profile/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLAN_META } from "@/lib/plans";
import { getFeaturedCards } from "@/lib/server-api";
import type { FeaturedCard } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "TapAccess: NFC digital business cards" },
  description:
    "One tap opens your business profile: services, contact details, socials and a one-tap call or save contact. Works on iPhone and Android, no app needed.",
};

/**
 * Root of the domain. Customers never sign in and the dashboard is not
 * linked from here; administrators go to /admin directly.
 */
export default async function Home() {
  const contact = contactOptions();
  const businesses = await getFeaturedCards();
  return (
    <div className={cn(displayFont.variable, accentFont.variable, "min-h-dvh bg-canvas text-ink")}>
      <Nav />
      <main>
        <Hero />
        <Highlights />
        <Businesses items={businesses} />
        <Services />
        <HowItWorks />
        <Packages />
        <About />
        <Faq />
        <Contact options={contact} />
      </main>
      <Footer />
    </div>
  );
}

// ─── Contact details (set on the server, e.g. in Vercel) ────────────────────

interface ContactOption {
  label: string;
  /** Shown after the label on wider screens. */
  value?: string;
  href: string;
  icon: ReactNode;
  tone: "facebook" | "primary" | "light";
}

/**
 * CONTACT_FACEBOOK / CONTACT_EMAIL / CONTACT_PHONE / CONTACT_MESSENGER, set
 * on the server (Vercel). Anything unset or invalid is left out; without an
 * email the section shows a "Gmail, coming soon" placeholder.
 */
function contactOptions(): ContactOption[] {
  const options: ContactOption[] = [];
  const facebook = process.env.CONTACT_FACEBOOK?.trim();
  if (facebook && /^https:\/\/(www\.|m\.|web\.)?(facebook\.com|fb\.com|fb\.me|m\.me)\/\S+$/i.test(facebook)) {
    options.push({ label: "Message us on Facebook", href: facebook, icon: <BrandMark name="facebook" className="h-5 w-5" />, tone: "facebook" });
  }
  const email = process.env.CONTACT_EMAIL?.trim();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    options.push({ label: "Email us", value: email, href: `mailto:${email}`, icon: <Mail className="h-5 w-5" />, tone: "primary" });
  }
  const phone = process.env.CONTACT_PHONE?.trim();
  if (phone && /^\+?[0-9 ()\-.]{6,32}$/.test(phone)) {
    options.push({ label: "Call us", value: phone, href: `tel:${phone.replace(/[^\d+]/g, "")}`, icon: <Phone className="h-5 w-5" />, tone: "light" });
  }
  const messenger = process.env.CONTACT_MESSENGER?.trim();
  if (messenger && /^https:\/\/\S+$/.test(messenger)) {
    options.push({ label: "Message us", value: "Messenger", href: messenger, icon: <MessageCircle className="h-5 w-5" />, tone: "light" });
  }
  return options;
}

// ─── Layout pieces ──────────────────────────────────────────────────────────

const NAV = [
  { href: "#services", label: "Services" },
  { href: "#how", label: "How it works" },
  { href: "#packages", label: "Packages" },
  { href: "#about", label: "About" },
  { href: "#faq", label: "FAQ" },
];

function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" aria-label="TapAccess home">
          <BrandLogo priority />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 justify-center gap-1 md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          <a
            href="#contact"
            className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-sm font-semibold text-canvas transition-opacity hover:opacity-85"
          >
            Get your card
          </a>
        </div>
      </Container>
    </header>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold tracking-wide text-brand">{children}</p>;
}

function SectionHeading({ eyebrow, title, intro, center }: { eyebrow: string; title: ReactNode; intro?: string; center?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 font-display text-[2.1rem] leading-[1.05] font-bold tracking-[-0.035em] text-balance sm:text-5xl">{title}</h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-pretty text-ink-2">{intro}</p>}
    </div>
  );
}

/** The italic serif accent used for one or two words per headline. */
function Accent({ children }: { children: ReactNode }) {
  return <em className="font-accent font-normal tracking-normal">{children}</em>;
}

// ─── Sections ───────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="overflow-hidden">
      <Container className="grid items-center gap-14 pt-14 pb-20 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pt-20 lg:pb-28">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            NFC digital business cards
          </p>
          <h1 className="mt-6 font-display text-[2.9rem] leading-[0.98] font-bold tracking-[-0.045em] text-balance sm:text-6xl lg:text-[4.6rem]">
            Your business, <Accent>one tap</Accent> away.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-ink-2 sm:text-xl">
            A TapAccess card opens a beautiful page with your services, contact details and socials, and lets customers call you or save your
            number in one tap. No app. Update it any time; the card never needs replacing.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#contact"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[0.95rem] font-semibold text-white shadow-[0_12px_30px_-12px_var(--brand)] transition-colors hover:bg-brand-hover"
            >
              Get your card <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="#how"
              className="inline-flex h-12 items-center rounded-full border border-line-strong bg-surface px-6 text-[0.95rem] font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              See how it works
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            {["iPhone & Android", "No app needed", "QR code included"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-brand" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <HeroVisual />
      </Container>
    </section>
  );
}

/** Businesses the admin chose to feature (hidden until there is at least one). */
function Businesses({ items }: { items: FeaturedCard[] }) {
  if (items.length === 0) return null;
  return (
    <section id="businesses" className="scroll-mt-20 pt-24 sm:pt-32" aria-labelledby="businesses-title">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <Eyebrow>Businesses on TapAccess</Eyebrow>
            <h2 id="businesses-title" className="mt-3 font-display text-[2.1rem] leading-[1.05] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
              Already <Accent>tapping</Accent> with us.
            </h2>
          </div>
          <p className="text-sm text-ink-2">Tap any card to see it live.</p>
        </div>
        <div className="mt-10">
          <BusinessCarousel items={items} />
        </div>
      </Container>
    </section>
  );
}

function Highlights() {
  const items = [
    { icon: Smartphone, title: "Works on any phone", text: "Opens in the browser on iPhone and Android." },
    { icon: RefreshCw, title: "Always current", text: "Edit the page; the card stays the same." },
    { icon: UserPlus, title: "Saved in one tap", text: "Your details go straight into Contacts." },
    { icon: ShieldCheck, title: "Private by design", text: "No ads, no trackers, no data sold." },
  ];
  return (
    <section aria-label="Highlights" className="border-y border-line bg-surface">
      <Container className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.title} className="flex gap-4 py-7 sm:px-2 lg:px-5">
            <i.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
            <div>
              <p className="font-semibold">{i.title}</p>
              <p className="mt-1 text-sm text-ink-2">{i.text}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

function Services() {
  const services = [
    {
      icon: CreditCard,
      title: "NFC business cards",
      text: "Tap-to-share cards, programmed and activated for you. Hand one over and your page opens on their phone.",
    },
    {
      icon: Palette,
      title: "Profile page design",
      text: "A fast mobile page in your colours and fonts, with your logo, photos, services, prices and opening hours.",
    },
    {
      icon: Phone,
      title: "One-tap Call & Save contact",
      text: "Big Call and Save contact buttons, or set the card to open straight on them. Customers reach you in seconds.",
    },
    {
      icon: QrCode,
      title: "QR code backup",
      text: "Every card comes with a QR code for phones without NFC, perfect for counters, flyers and signage.",
    },
    {
      icon: Wand2,
      title: "Updates done for you",
      text: "New prices, promos or hours? We update your page and it's live instantly. The card itself never changes.",
    },
    {
      icon: BarChart3,
      title: "Visit insights",
      text: "See how many people opened your page and which buttons they used, without tracking who they are.",
    },
  ];
  return (
    <section id="services" className="scroll-mt-20 py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="Services"
          title={
            <>
              Everything to get you <Accent>found</Accent>, saved and called.
            </>
          }
          intro="We handle the design, the card and the updates. You just hand it over."
        />
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.title} className="group rounded-3xl border border-line bg-surface p-7 transition-colors hover:border-line-strong">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink transition-transform group-hover:-rotate-6">
                <s.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-2">{s.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { title: "Tell us about your business", text: "Send your logo, services, contact details and socials, or just the basics." },
    { title: "We design and program", text: "We build your page, write it to your card and test it on iPhone and Android." },
    { title: "Tap, share, grow", text: "Customers tap your card to call you, save your contact or follow you." },
  ];
  return (
    <section id="how" className="scroll-mt-20 border-y border-line bg-surface py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow="How it works" title={<>Ready in three <Accent>simple</Accent> steps.</>} />
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
          {steps.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="font-display text-6xl font-bold tracking-tight text-line-strong">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function Packages() {
  const plans = [
    { key: "starter" as const, note: "For getting started fast", featured: false, card: "/images/tap-white.png" },
    { key: "business" as const, note: "For the full brand experience", featured: true, card: "/images/tap-black.png" },
  ];
  return (
    <section id="packages" className="scroll-mt-20 py-24 sm:py-32">
      <Container>
        <SectionHeading
          center
          eyebrow="Packages"
          title={
            <>
              Pick the page that <Accent>fits</Accent> you.
            </>
          }
          intro="Both packages include the NFC card, a QR code, every theme and font, and one-tap Call & Save contact."
        />
        <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
          {plans.map(({ key, note, featured, card }) => {
            const plan = PLAN_META[key];
            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col rounded-3xl border p-8",
                  featured ? "border-transparent bg-ink text-canvas" : "border-line bg-surface",
                )}
              >
                <Image
                  src={card}
                  alt=""
                  width={1004}
                  height={638}
                  sizes="(min-width: 768px) 380px, 90vw"
                  className={cn("mb-7 w-full rounded-2xl", featured ? "ring-1 ring-white/15" : "ring-1 ring-black/5 shadow-[0_18px_40px_-24px_rgb(15_23_42/0.35)]")}
                />
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-2xl font-bold tracking-tight">{plan.label}</h3>
                  {featured && <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">Most complete</span>}
                </div>
                <p className={cn("mt-1 text-sm", featured ? "text-canvas/70" : "text-ink-2")}>{note}</p>
                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[0.95rem]">
                      <Check className={cn("mt-0.5 h-4 w-4 shrink-0", featured ? "text-canvas" : "text-brand")} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={cn(
                    "mt-8 inline-flex h-12 items-center justify-center rounded-full text-[0.95rem] font-semibold transition-opacity hover:opacity-90",
                    featured ? "bg-canvas text-ink" : "bg-ink text-canvas",
                  )}
                >
                  Ask about {plan.label}
                </a>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function About() {
  const values = [
    { title: "Privacy first", text: "No ads, no tracking cookies, and the people who tap your card are never identified or shared." },
    { title: "Made to just work", text: "Plain web pages that open instantly on any phone. No app, no account, no learning curve." },
    { title: "Done for you", text: "We set everything up and keep it current, so you can focus on your customers." },
  ];
  return (
    <section id="about" className="scroll-mt-20 border-y border-line bg-surface py-24 sm:py-32">
      <Container className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="About TapAccess"
            title={
              <>
                Making it <Accent>effortless</Accent> to reach the businesses you meet.
              </>
            }
          />
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-pretty text-ink-2">
            <p>
              Paper cards get lost, and typing a number from one is a chore. TapAccess turns the moment you meet a customer into a saved contact, a
              booked call or a new follower.
            </p>
            <p>
              We design each profile, program each card and keep everything up to date, for salons, clinics, shops, restaurants, freelancers and
              every business that grows by word of mouth.
            </p>
          </div>
        </div>
        <ul className="space-y-4 self-center">
          {values.map((v, i) => (
            <li key={v.title} className="flex gap-5 rounded-3xl border border-line bg-canvas p-6">
              <span className="font-display text-sm font-bold text-brand">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight">{v.title}</h3>
                <p className="mt-1 leading-relaxed text-ink-2">{v.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function Faq() {
  const faqs = [
    {
      q: "Do people need an app to use my card?",
      a: "No. Tapping the card opens your page in the phone's browser. Phones without NFC can scan the QR code instead.",
    },
    {
      q: "Does it work on iPhone?",
      a: "Yes. iPhone XS and newer read the card automatically when unlocked. Just hold it near the top of the phone. Android phones with NFC turned on work the same way.",
    },
    {
      q: "Can I change my details later?",
      a: "Any time. Your page updates instantly and the card keeps working. It never needs to be replaced or rewritten.",
    },
    {
      q: "Can customers save my number straight away?",
      a: "Yes. Every page has a Save contact button, and the card can open straight on it. The phone asks them to confirm, then it's in their contacts.",
    },
    {
      q: "What happens to the data of people who tap?",
      a: "We only count visits and button taps, without cookies or personal details, and we never sell or share data.",
    },
  ];
  return (
    <section id="faq" className="scroll-mt-20 py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeading eyebrow="FAQ" title={<>Questions, <Accent>answered</Accent>.</>} />
        <div className="divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Contact({ options }: { options: ContactOption[] }) {
  return (
    <section id="contact" className="scroll-mt-20 pb-24 sm:pb-32">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-center text-canvas sm:px-12 sm:py-20">
          <h2 className="mx-auto max-w-2xl font-display text-4xl leading-[1.05] font-bold tracking-[-0.035em] text-balance sm:text-5xl">
            Ready to put your business <Accent>in their hands</Accent>?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-canvas/70">
            Tell us about your business and we&apos;ll design your page and program your card.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {options.map((o) => (
              <a
                key={o.href}
                href={o.href}
                {...(o.href.startsWith("https:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={cn(
                  "inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-[0.95rem] font-semibold transition-opacity hover:opacity-90",
                  o.tone === "facebook" ? "bg-[#1877F2] text-white" : o.tone === "primary" ? "bg-brand text-white" : "bg-canvas text-ink",
                )}
              >
                {o.icon}
                {o.label}
                {o.value && <span className="hidden font-normal opacity-70 sm:inline">· {o.value}</span>}
              </a>
            ))}
            {!options.some((o) => o.href.startsWith("mailto:")) && (
              // Email isn't set up yet (CONTACT_EMAIL): show it as coming soon.
              <span
                aria-disabled="true"
                className="inline-flex h-12 cursor-default items-center gap-2.5 rounded-full border border-canvas/25 px-6 text-[0.95rem] font-semibold text-canvas/60"
              >
                <Mail className="h-5 w-5" aria-hidden />
                Gmail
                <span className="rounded-full bg-canvas/15 px-2 py-0.5 text-xs font-medium text-canvas/80">Coming soon</span>
              </span>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BrandLogo />
          <p className="mt-2 text-sm text-ink-3">NFC digital business cards.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-ink">
              {n.label}
            </a>
          ))}
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </nav>
      </Container>
      <Container className="pb-10 text-xs text-ink-3">© {new Date().getFullYear()} TapAccess. All rights reserved.</Container>
    </footer>
  );
}
