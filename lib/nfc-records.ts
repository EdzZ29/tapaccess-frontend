import type { CardDetail } from "./types";

/**
 * What can be written straight onto a card's NFC chip instead of the profile
 * link, and whether it fits.
 *
 * A record on the chip is handled by the phone itself, with no web page in
 * between: a Contact (vCard) record opens Android's "Add contact" screen, a
 * phone-number record offers to call. The catch is that the chip then holds
 * a fixed copy of the details (no updates, no analytics), and iPhones only
 * act on links and phone numbers, never on contact records.
 */

/** Usable NDEF memory of the common NFC card chips, in bytes. */
export const NFC_CHIPS = [
  { name: "NTAG213", bytes: 144 },
  { name: "NTAG215", bytes: 504 },
  { name: "NTAG216", bytes: 888 },
] as const;

/** Digits and a leading +, the form every dialer and contacts app accepts. */
export const dialable = (phone: string) => phone.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");

export interface ContactField {
  key: string;
  label: string;
  value: string;
  optional?: boolean;
}

/**
 * The values to type into NFC Tools' Contact record. The website is the
 * card's profile link, so the saved contact still leads to the live page.
 */
export function contactFields(card: CardDetail, profileUrl: string): ContactField[] {
  const p = card.profile;
  const fields: ContactField[] = [{ key: "name", label: "Name", value: p.businessName }];
  const phone = p.phone ?? p.whatsapp;
  if (phone) fields.push({ key: "phone", label: "Phone", value: dialable(phone) });
  if (p.email) fields.push({ key: "email", label: "Email", value: p.email });
  fields.push({ key: "website", label: "Website", value: profileUrl });
  if (p.address) fields.push({ key: "address", label: "Address", value: p.address.replace(/\s*\n\s*/g, ", "), optional: true });
  return fields;
}

const utf8Length = (s: string) => new TextEncoder().encode(s).length;

/** Roughly the vCard an NFC writer produces from these fields. */
function vcardBytes(fields: ContactField[]): number {
  const get = (key: string) => fields.find((f) => f.key === key)?.value;
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${get("name")};;;;`, `FN:${get("name")}`];
  if (get("phone")) lines.push(`TEL;TYPE=CELL:${get("phone")}`);
  if (get("email")) lines.push(`EMAIL;TYPE=INTERNET:${get("email")}`);
  if (get("website")) lines.push(`URL:${get("website")}`);
  if (get("address")) lines.push(`ADR;TYPE=WORK:;;${get("address")};;;;`);
  lines.push("END:VCARD");
  return utf8Length(lines.join("\r\n") + "\r\n");
}

/** NDEF message size: TLV wrapper + one short/long record + terminator. */
function ndefBytes(payload: number, typeLength: number): number {
  const record = 1 + 1 + (payload > 255 ? 4 : 1) + typeLength + payload;
  return 1 + (record > 254 ? 3 : 1) + record + 1;
}

/** "text/x-vCard" is the longest MIME type writers use, so the estimate errs on the safe side. */
export const contactRecordSize = (fields: ContactField[]) => ndefBytes(vcardBytes(fields), "text/x-vCard".length);

/** A URI record abbreviates "tel:" to a single prefix byte. */
export const phoneRecordSize = (phone: string) => ndefBytes(1 + utf8Length(dialable(phone)), 1);

export type ChipFit = "fits" | "tight" | "too-big";

/** Writers add a little of their own, so the last 10% counts as "tight". */
export const chipFit = (size: number, capacity: number): ChipFit =>
  size <= capacity * 0.9 ? "fits" : size <= capacity ? "tight" : "too-big";
