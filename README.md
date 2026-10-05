# TapAccess Web

Next.js 16 (App Router) + React 19 + Tailwind CSS 4. The admin dashboard and
the public NFC profile pages for [TapAccess](../README.md). All data comes
from the [TapAccess API](../tapaccess-backend/).

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3001  (the API must be running on :4000)
```

| Variable | Exposed to browser | Purpose |
|---|:---:|---|
| `API_URL` | no | Where the Next.js server and the `/api` + `/uploads` rewrites reach the API |
| `INTERNAL_API_KEY` | no | **Required in production.** Must match the API's `INTERNAL_API_KEY`; lets the API trust the visitor IP forwarded by the Save contact / tracking route handlers |
| `SESSION_COOKIE_NAME` | no | Must match the API's `COOKIE_NAME` (default `tapaccess_session`) |
| `NEXT_PUBLIC_SITE_URL` | yes | Public base URL. Card URLs are `<SITE_URL>/c/<slug>`, so **set your final domain before writing any NFC tags** |

No secret is ever prefixed `NEXT_PUBLIC_`. The admin session cookie is
HttpOnly and set by the API through the same-origin `/api` rewrite, so
JavaScript never sees it.

## Routes

| Route | Rendering | |
|---|---|---|
| `/` | static | Neutral landing page (does not link to the dashboard) |
| `/c/[slug]` | dynamic SSR, `no-store` | Public profile; `loading`, `error`, not-found and unavailable states; Open Graph + theme-colour metadata |
| `/login` | client | Admin sign-in; `?next=` is restricted to `/admin…` paths |
| `/admin` | client | Overview: stat tiles, visits over time, top and recent cards |
| `/admin/cards` | client | Search, filter by status/package, sort, paginate, row actions |
| `/admin/cards/new` | client | Create a card (live slug availability, package picker) |
| `/admin/cards/[id]` | client | NFC setup (URL, QR, NFC Tools steps), details, analytics |
| `/admin/cards/[id]/edit` | client | Visual editor with live phone preview |
| `/admin/settings` | client | Display name, change password |

`proxy.ts` redirects signed-out visitors from `/admin/*` to `/login`. This is
only a UX shortcut: the API verifies the session on every request.

## Layout

```
app/                     routes (see above)
components/
  profile/               public card renderer, shared by /c/[slug] and the editor preview
    profile-view.tsx       hero, quick actions, Save contact / Share
    profile-sections.tsx   about, buttons, contact, hours, services, products, promotions, gallery…
    theme.ts               theme → CSS variables and button styles
    tracking.tsx           visit/click beacons (no cookies, no storage)
  admin/                 dashboard shell, charts, card actions, packages, editor/
  ui/                    button, fields, dialog, confirm, menu, badges, feedback
lib/
  api.ts                 browser API client (same-origin /api)
  server-api.ts          server-only public profile fetch
  plans.ts               package rules (mirror of the API's)
  constants.ts, types.ts, fonts.ts, utils.ts
```

Profile pages use container queries rather than viewport breakpoints, so the
editor's 375px phone frame renders exactly like a real phone.

Images are uploaded already resized WebP, so profiles use plain `<img>` with
lazy loading instead of `next/image`. That avoids per-storage-host image
configuration and the Vercel image-optimization quota.
