"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { toast } from "sonner";
import type { ClickKind } from "@/lib/types";
import { useTracking } from "./tracking";

interface ActionLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  kind: ClickKind;
  /** Button/item id, or the target name for contact & social actions. */
  trackId: string;
  children: ReactNode;
}

/**
 * Every outbound tap on a profile goes through here so it is counted once
 * and behaves consistently. External links open in a new tab; tel:, mailto:
 * and sms: hand off to the phone's apps. In the editor preview every link
 * opens in a new tab so the admin can test it without leaving the editor.
 */
export function ActionLink({ href, kind, trackId, children, onClick, ...props }: ActionLinkProps) {
  const { preview, track } = useTracking();
  const external = /^https?:/i.test(href);
  return (
    <a
      href={href}
      target={external || preview ? "_blank" : undefined}
      rel={external || preview ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        if (preview && href.endsWith("/vcard")) {
          e.preventDefault();
          toast.info("Save contact downloads a vCard on the live page");
          return;
        }
        track(kind, trackId);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
