"use client";

import { ExternalLink } from "lucide-react";
import { useState, type ReactNode } from "react";
import { SiteUrlWarning } from "@/components/admin/site-url-warning";
import { CopyButton, QrCode, Segmented } from "@/components/admin/widgets";
import { Switch } from "@/components/ui/switch";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { chipFit, contactFields, contactRecordSize, dialable, NFC_CHIPS, phoneRecordSize, type ChipFit } from "@/lib/nfc-records";
import type { CardDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "link" | "contact" | "call";

const MODES: { value: Mode; label: string }[] = [
  { value: "link", label: "Profile" },
  { value: "contact", label: "Contact" },
  { value: "call", label: "Call" },
];

const DESCRIPTIONS: Record<Mode, string> = {
  link: "Write this URL to the card's NFC tag. It never changes, so profile edits never need a rewrite.",
  contact: "Writes the contact itself onto the chip: a tap opens the phone's Add contact screen with no page and no download.",
  call: "Writes the phone number onto the chip: a tap offers to call it straight away.",
};

export function NfcSetupPanel({ card, url }: { card: CardDetail; url: string }) {
  const [mode, setMode] = useState<Mode>("link");

  return (
    <Panel className="lg:col-span-2">
      <PanelHeader title="NFC setup" description={DESCRIPTIONS[mode]} />
      <div className="space-y-5 p-5">
        <Segmented label="What a tap does" value={mode} onChange={setMode} options={MODES} />
        {card.status !== "active" && mode === "link" && (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink">
            This card is {card.status}. Visitors currently see an “unavailable” page.
          </p>
        )}
        {mode === "link" && <LinkSetup card={card} url={url} />}
        {mode === "contact" && <ContactSetup card={card} url={url} />}
        {mode === "call" && <CallSetup card={card} />}
      </div>
    </Panel>
  );
}

function LinkSetup({ card, url }: { card: CardDetail; url: string }) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="rounded-lg border border-line bg-surface-2 p-3">
          <p className="text-xs font-medium text-ink-3">Public URL</p>
          <p className="mt-1 font-mono text-sm break-all text-ink">{url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton text={url} label="Copy URL" what="Public URL" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-sm hover:bg-surface-2"
            >
              <ExternalLink className="h-4 w-4" /> Open
            </a>
          </div>
        </div>
        <SiteUrlWarning compact />
        <Steps>
          <li>
            Open <strong className="text-ink">NFC Tools</strong> → <em>Write</em> → <em>Add a record</em> → <em>URL / URI</em>.
          </li>
          <li>Paste the URL above, tap <em>Write</em>, then hold the card to the phone.</li>
          <li>
            Optional: <em>Other</em> → <em>Lock tag</em> so nobody can overwrite it (this is irreversible).
          </li>
          <li>Tap the card to test it, then hand it to the client.</li>
        </Steps>
        <p className="text-xs text-ink-3">
          Works on iPhone and Android. To open on Save contact or Call, set <em>When the card is tapped</em> under Edit profile → Contact & hours.
        </p>
      </div>
      <div className="shrink-0 sm:w-44">
        <QrCode value={url} fileName={card.slug} />
      </div>
    </div>
  );
}

function ContactSetup({ card, url }: { card: CardDetail; url: string }) {
  const [withAddress, setWithAddress] = useState(false);
  const all = contactFields(card, url);
  const hasAddress = all.some((f) => f.optional);
  const fields = all.filter((f) => !f.optional || withAddress);
  const hasContact = fields.some((f) => f.key === "phone" || f.key === "email");

  return (
    <div className="space-y-5">
      <Tradeoffs>
        <li>
          <strong className="text-ink">Android only.</strong> iPhones ignore contact records when a card is tapped — they only open links and
          phone numbers. iPhone owners get nothing, so use <em>Profile</em> (set to open on Save contact) if the client’s customers use iPhones.
        </li>
        <li>No profile page, and visits and clicks aren’t counted.</li>
        <li>The details are copied onto the chip. After editing the profile, write the card again — so don’t lock it.</li>
      </Tradeoffs>

      {!hasContact && (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink">Add a phone number or email to the profile first.</p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Type these into the Contact record</p>
        <dl className="divide-y divide-line rounded-lg border border-line">
          {fields.map((f) => (
            <div key={f.key} className="flex items-center gap-3 px-3 py-2">
              <dt className="w-20 shrink-0 text-xs font-medium text-ink-3">{f.label}</dt>
              <dd className="min-w-0 flex-1 truncate font-mono text-sm text-ink" title={f.value}>
                {f.value}
              </dd>
              <CopyButton text={f.value} size="icon-sm" label="Copy" what={f.label} />
            </div>
          ))}
        </dl>
        <p className="text-xs text-ink-3">The website is the card’s profile link, so the saved contact still opens the live page.</p>
        {hasAddress && (
          <div className="pt-1 text-sm text-ink-2">
            <Switch size="sm" checked={withAddress} onChange={setWithAddress} label="Include the address (takes a lot of space)" />
          </div>
        )}
      </div>

      <ChipFitList size={contactRecordSize(fields)} />

      <Steps>
        <li>
          Open <strong className="text-ink">NFC Tools</strong> → <em>Write</em> → <em>Add a record</em> → <em>Contact</em>.
        </li>
        <li>Fill in the fields above (leave the others empty), then tap <em>OK</em>.</li>
        <li>
          Make sure it’s the only record, tap <em>Write</em> and hold the card to the phone.
        </li>
        <li>Test with an Android phone: the tap should open Add contact with these details.</li>
      </Steps>
    </div>
  );
}

function CallSetup({ card }: { card: CardDetail }) {
  const phone = card.profile.phone;
  if (!phone) {
    return <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink">Add a phone number to the profile first.</p>;
  }
  const number = dialable(phone);

  return (
    <div className="space-y-5">
      <Tradeoffs>
        <li>Works on iPhone (it shows a “Call …” notification) and Android (it opens the dialer). The visitor taps Call.</li>
        <li>No profile page, and visits and clicks aren’t counted.</li>
        <li>If the number changes, write the card again — so don’t lock it.</li>
      </Tradeoffs>

      <div className="rounded-lg border border-line bg-surface-2 p-3">
        <p className="text-xs font-medium text-ink-3">Phone number</p>
        <p className="mt-1 font-mono text-sm text-ink">{number}</p>
        <div className="mt-3">
          <CopyButton text={number} label="Copy number" what="Phone number" />
        </div>
      </div>

      <ChipFitList size={phoneRecordSize(phone)} />

      <Steps>
        <li>
          Open <strong className="text-ink">NFC Tools</strong> → <em>Write</em> → <em>Add a record</em> → <em>Phone number</em>.
        </li>
        <li>Paste the number above, tap <em>OK</em>, then <em>Write</em> and hold the card to the phone.</li>
        <li>Test with both an iPhone and an Android phone.</li>
      </Steps>
    </div>
  );
}

function Tradeoffs({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <p className="text-sm font-medium text-ink">Before you choose this</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-ink-2">{children}</ul>
    </div>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-2">{children}</ol>;
}

const FIT_LABEL: Record<ChipFit, string> = { fits: "Fits", tight: "Tight", "too-big": "Too big" };
const FIT_CLASS: Record<ChipFit, string> = {
  fits: "bg-success-soft text-success-ink",
  tight: "bg-warning-soft text-warning-ink",
  "too-big": "bg-danger-soft text-danger-ink",
};

function ChipFitList({ size }: { size: number }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-2">
        About <strong className="text-ink">{size} bytes</strong> on the chip. NFC Tools → <em>Read</em> shows which chip the card has.
      </p>
      <ul className="flex flex-wrap gap-2">
        {NFC_CHIPS.map((chip) => {
          const fit = chipFit(size, chip.bytes);
          return (
            <li key={chip.name} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", FIT_CLASS[fit])}>
              {chip.name} ({chip.bytes} bytes): {FIT_LABEL[fit]}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
