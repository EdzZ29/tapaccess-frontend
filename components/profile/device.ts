/**
 * What the visitor's phone can do with "Save contact" and "Call".
 *
 * Browsers never add a contact or place a call on their own; the best a web
 * page can do is open the phone's own screen for it, where the visitor
 * confirms with one tap. How to get there differs per platform:
 *
 * - iPhone / iPad (Safari): an inline vCard opens the "Create New Contact"
 *   card directly. As a download it would land in Files instead.
 * - Android (Chrome): the vCard downloads and "Open" adds it to Contacts.
 * - In-app browsers (Facebook, Instagram, Messenger, TikTok…) often can't
 *   open a vCard at all, so the visitor is told to open the page in their
 *   browser.
 */
export interface Device {
  ios: boolean;
  android: boolean;
  /** Can place a call (excludes tablets, which usually can't dial). */
  phone: boolean;
  /** A touch device where opening the contact screen right away makes sense. */
  mobile: boolean;
  inApp: boolean;
}

const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|Line\/|MicroMessenger|musical_ly|BytedanceWebview|TikTok|Snapchat|Twitter|LinkedInApp|Pinterest/i;

export function detectDevice(ua = typeof navigator === "undefined" ? "" : navigator.userAgent): Device {
  // iPadOS reports itself as a Mac; touch support gives it away.
  const iPadAsMac = /Macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;
  const ios = /iPhone|iPad|iPod/.test(ua) || iPadAsMac;
  const android = /Android/i.test(ua);
  const phone = /iPhone|iPod/.test(ua) || (android && /Mobile/i.test(ua));
  return { ios, android, phone, mobile: ios || android, inApp: IN_APP.test(ua) };
}

/** iOS shows an inline vCard as the add-contact card; everyone else downloads it. */
export const vcardUrlFor = (href: string, device: Device) => (device.ios ? `${href}${href.includes("?") ? "&" : "?"}inline=1` : href);
