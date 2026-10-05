"use client";

import type { AnchorHTMLAttributes, ReactNode, Ref } from "react";
import { toast } from "sonner";
import type { ClickKind } from "@/lib/types";
import { detectDevice, vcardUrlFor } from "./device";
import { useTracking } from "./tracking";

interface ActionLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  kind: ClickKind;
  /** Button/item id, or the target name for contact & social actions. */
  trackId: string;
  children: ReactNode;
  ref?: Ref<HTMLAnchorElement>;
}

export const isVcardHref = (href: string) => /\/vcard(\?|$)/.test(href);

/**
 * Opens the phone's add-contact screen for the card's vCard, the way each
 * platform does it best, and tells the visitor the one step left to them.
 */
export function saveContact(href: string) {
  const device = detectDevice();
  if (device.inApp) {
    toast.info("Contact not opening? Tap ⋯ and choose “Open in browser”, then Save contact again.", { duration: 10_000 });
  } else if (device.android) {
    toast.success("Tap “Open” on the download to add the contact.", { duration: 8_000 });
  }
  window.location.assign(vcardUrlFor(href, device));
}

/**
 * Every outbound tap on a profile goes through here so it is counted once
 * and behaves consistently. External links open in a new tab; tel:, mailto:
 * and sms: hand off to the phone's apps; Save contact opens the add-contact
 * screen. In the editor preview every link opens in a new tab so the admin
 * can test it without leaving the editor.
 */
export function ActionLink({ href, kind, trackId, children, onClick, ...props }: ActionLinkProps) {
  const { preview, track } = useTracking();
  const external = /^https?:/i.test(href);
  const vcard = isVcardHref(href);
  return (
    <a
      href={href}
      target={(external || preview) && !vcard ? "_blank" : undefined}
      rel={external || preview ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        if (vcard && preview) {
          e.preventDefault();
          toast.info("Save contact opens the phone's add-contact screen on the live page");
          return;
        }
        track(kind, trackId);
        onClick?.(e);
        if (vcard && !e.defaultPrevented) {
          e.preventDefault();
          saveContact(href);
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}
