import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What TapAccess collects when you open a card, and what it never does.",
};

/**
 * Plain-language privacy notice for people who tap a card. Keep it in step
 * with tapaccess-backend (analytics.service.ts, card-visit.entity.ts) if what
 * is collected ever changes.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-ink">
      <Link href="/">
        <BrandLogo />
      </Link>
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-3 text-ink-2">
        TapAccess shows business profiles when you tap one of our NFC cards. You don&apos;t need an account, and we keep what we learn
        about you to an absolute minimum.
      </p>

      <Section title="We never">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>sell, rent or share information about visitors with anyone, including the businesses on the cards;</li>
          <li>use advertising, tracking pixels or social-media trackers, or build a profile of you;</li>
          <li>set cookies or store anything on your device when you view a card;</li>
          <li>store your IP address, your precise location, or any device identifier in our records;</li>
          <li>load fonts, ads or trackers from other companies when you view a card (images come only from our own storage).</li>
        </ul>
        <p className="mt-2">
          Like every website, our hosting providers keep standard server logs (which include IP addresses) for a short time to keep the
          service secure. We don&apos;t use them to track or identify visitors.
        </p>
      </Section>

      <Section title="What a card visit records">
        <p>To show each business how often its card is used, we count anonymous visits and taps on its buttons. For each one we store only:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>which card and which button, and when;</li>
          <li>the type of device (phone, tablet or computer);</li>
          <li>the name of the website that linked to the card, if any (just the domain, never the full address);</li>
          <li>
            a scrambled code that changes every day, used only to avoid counting the same visit twice. It is made with a secret key and
            can&apos;t be turned back into your IP address or used to recognise you on another day.
          </li>
        </ul>
        <p className="mt-2">These records are deleted automatically after about 13 months.</p>
      </Section>

      <Section title="Website statistics">
        <p>
          We use Vercel Web Analytics, run by our hosting provider Vercel, to count how many people view our pages, including card pages.
          It uses no cookies and stores nothing on your device. It records the page address (without anything after a &ldquo;?&rdquo;),
          the referring website, your country, and your browser, operating system and device type. Visitors are counted with a value that
          resets every day, so you can&apos;t be followed across days or across other websites. Our dashboard and editing pages are never
          counted.
        </p>
      </Section>

      <Section title="Saving a contact">
        <p>
          &ldquo;Save contact&rdquo; downloads the business&apos;s public details to your phone. Your phone always asks before adding
          anything; we never see your contacts.
        </p>
      </Section>

      <Section title="Links to other sites">
        <p>
          Buttons such as Facebook, Instagram or a booking page take you to those sites, which have their own privacy policies. We tell
          them nothing about which card you came from.
        </p>
      </Section>

      <Section title="Security">
        <p>
          All pages are served over encrypted HTTPS. Business details are managed by the TapAccess administrator. On the Business package,
          the administrator can give a business an access code that lets it change only its own card&apos;s buttons and social links; codes
          are stored scrambled, attempts are limited, and a code can be replaced or switched off at any time.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-ink-2 leading-relaxed">{children}</div>
    </section>
  );
}
