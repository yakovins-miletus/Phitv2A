# Fresko — Architecture Map

**Latest V2 · 8 · 11 · 2026**

Fresko is the public-facing PoC website. It is **read-only** against Heimdall, the CMS
backend in the sibling repo `Phitv2B-2`. The one exception is the contact form, which
POSTs.

Fresko contains **no CMS admin UI and no authentication code**. Content is managed in
Heimdall's own `admin-ui`, which lives in `Phitv2B-2` and is never exposed on Fresko's
origin — this repo's Nginx config `404`s `/api/v1/heimdall/` on purpose.

```
   ┌──────────────────────────┐         ┌───────────────────────────────┐
   │  Fresko  (this repo)     │         │  Heimdall  (Phitv2B-2)        │
   │  React 19 · Vite 8 SPA   │         │  FastAPI · SQLAlchemy · SQLite│
   │                          │         │                               │
   │  src/shared/api/client   │──GET───▶│  /api/v1/*   public, read-only│
   │   openapi-fetch          │──POST──▶│  /api/v1/contact-messages     │
   │   baseUrl=VITE_API_URL   │    ✗    │  /api/v1/heimdall/admin/*     │
   │                          │         │      ▲                        │
   └──────────────────────────┘         │      │ admin-ui (Heimdall's)  │
                                        └──────┴────────────────────────┘
```

---

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | React 19.2 |
| Build | Vite 8 (Rolldown), `npm run build` = `tsc -b && vite build` |
| Routing | TanStack Router 1.x, **file-based** (`src/routes/` → `src/routeTree.gen.ts`) |
| Server state | TanStack Query 5 |
| HTTP | `openapi-fetch` against generated types — **no axios, no raw fetch** |
| UI | MUI 7 + Emotion, `@phosphor-icons/react` |
| Motion / 3D | GSAP, `motion`, Lenis, three + `@react-three/fiber` + `drei` |
| Tests | Vitest (jsdom) + Testing Library + MSW |
| Client state | none — React `useState` + one context (`NavbarContext`) |

TypeScript is strict beyond the default: `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.

## 2. Directory map

```
src/
├── app/            bootstrap — main, providers, router, queryClient
├── routes/         TanStack file-based routes (URL space lives here)
├── features/       vertical slices: about blog contact hero home
│                   innovation services team
│                     └─ api.ts (query options) · components/ · fallback.ts
├── shared/
│   ├── api/        client.ts · errors.ts · keys.ts · schema.d.ts (generated)
│   ├── components/ AppShell, TopNavMegaDrawer, SiteFooter, Section, Reveal, …
│   ├── motion/     easing, scroll speed, device tier, pointer hooks
│   ├── theme/      MUI theme, palette, glass tokens, fonts
│   ├── content.ts       marketing copy (static)
│   ├── careersData.ts   job listings (static)
│   └── bodyImages.ts    ⚠ twinned with Heimdall — see §5
├── assets/fonts/   self-hosted Inter · Outfit · Space Grotesk (woff2)
└── routeTree.gen.ts     generated — do not edit
```

## 3. Routes

| URL | File | Data source |
|---|---|---|
| `/` | `index.tsx` | static + 3D hero |
| `/about` | `about.tsx` | static (`CONTENT`) |
| `/services` | `services.tsx` | **Heimdall** `/services` + in-file fallback |
| `/careers/` · `/careers/$jobId` | `careers.*.tsx` | static (`careersData.ts`) |
| `/blog/` | `blog.index.tsx` | **Heimdall** `/blog-posts` (paged, searchable) |
| `/blog/$slug` | `blog.$slug.tsx` | **Heimdall** `/blog-posts/{slug}` |
| `/innovation-hub/` | `innovation-hub.index.tsx` | static "coming soon" — **no API call** |
| `/innovation-hub/$slug` | `innovation-hub.$slug.tsx` | **Heimdall** `/innovation-posts/{slug}` |
| `/contact` | `contact.tsx` | POST `/contact-messages` |

Root (`__root.tsx`) renders `AppShell` + `<Outlet/>` and owns the not-found component.

**Fallback policy:** every CMS-backed marketing page ships a static fallback
(`features/*/fallback.ts`, `FALLBACK_SERVICES` in `services.tsx`). A marketing page must
never degrade to a spinner or an error card if Heimdall is unreachable.

## 4. The Heimdall contract

One client, one place: **`src/shared/api/client.ts`**.

```ts
export const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL });
```

There is no other HTTP call in `src/`. Types come from
**`src/shared/api/schema.d.ts`, which is generated** — do not hand-edit it:

```bash
npm run typegen   # reads http://127.0.0.1:8000/openapi.json from a running Heimdall
```

| Endpoint | Method | Called from |
|---|---|---|
| `/api/v1/services` | GET | `features/services/api.ts` |
| `/api/v1/team` | GET | `features/team/api.ts` — *defined, no route consumes it yet* |
| `/api/v1/blog-posts` | GET | `features/blog/api.ts` (`limit`,`offset`,`category`,`q`,`sort`) |
| `/api/v1/blog-posts/{slug}` | GET | `features/blog/api.ts` |
| `/api/v1/innovation-posts[/{slug}]` | GET | `features/innovation/api.ts` |
| `/api/v1/contact-messages` | POST | `features/contact/api.ts` |
| `/api/v1/heimdall/admin/*` | — | **never.** `404` at Nginx |

**Auth: none, by design.** No tokens, no cookies, no `credentials`. Heimdall's public
routes are open; its admin routes are protected by network placement only. The contact
form's spam control is a honeypot field (`company_website`), not auth.

**Errors** are RFC 7807. `src/shared/api/errors.ts` unwraps openapi-fetch's
`{data,error}` union into data-or-throw and normalises everything to `ApiError`.

**Caching.** Global default is `staleTime: 30s`, no refetch on focus. Blog and innovation
queries deliberately override that to `staleTime: 0` + `refetchOnWindowFocus: true`,
because editors change content live in the CMS and expect to see it.

## 5. Twinned invariants ⚠

These are duplicated implementations across two repos with no shared package. Changing
one side silently breaks the other — there is no compiler or test that catches it.

| Invariant | Fresko | Heimdall |
|---|---|---|
| Body-image paragraphs | `src/shared/bodyImages.ts` | `app/features/blog/body_images.py` |
| Slugify | `src/features/blog/fallback.ts` | server-side slugify |
| Problem envelope | `src/shared/api/errors.ts` | `app/core/errors.py` |

**Body images:** post bodies are plain text, not markup. A paragraph that is *entirely* an
image path renders as an image. Both sides implement the same regex:

```
^(?:/(?!/)|https://)\S+\.(?:png|jpe?g|webp|gif|avif)$
```

Heimdall uses it to backfill a null `image_url` for list thumbnails; Fresko uses it to
render the body.

> **Heimdall hosts no files.** It has no upload endpoint and no static mount. Paths like
> `/images/blog/<slug>/01.png` are bare strings in the database, and **Fresko serves them
> out of `public/`**. A post referencing an image Fresko does not have shows a broken
> image, and nothing in the CMS will warn you.

## 6. Environments

| Var | Dev | Prod / UAT |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | `/` |
| `VITE_ANALYTICS` | unset | `on` forces Vercel analytics off `*.vercel.app` |

`VITE_API_URL=/` is same-origin **on purpose**: Nginx serves the SPA and proxies `/api/`
to Heimdall on one host, so there is no hostname to go stale, no CORS to keep in sync and
no preflight. This replaced `https://phitv2.phit.b.com`, which did not resolve.

`vite.config.ts` runs an `assertApiUrl()` plugin that **fails the production build** if
the value is empty or matches a placeholder pattern — which includes `localhost`. That
guard exists so the stale-hostname bug cannot come back silently.

Vite inlines `import.meta.env` at build time. Changing the API URL means **rebuilding**,
not restarting.

## 7. Deployment targets

| Target | Config | Status |
|---|---|---|
| **UAT (Docker)** | `Dockerfile`, `deploy/docker-compose.uat.yml`, `deploy/nginx/fresko-uat.conf` | **current** — see `docs/deploy/ec2.md` |
| EC2 host Nginx | `deploy/nginx/fresko.conf` | designed, not deployed |
| Netlify | `netlify.toml` | legacy |
| Vercel | `vercel.json` | legacy |

The one thing that must not be got wrong, in every target: **`location /api/` must be
matched before the SPA fallback.** Otherwise API calls fall through to `index.html` and
return `200` with an HTML body — the client then dies inside `JSON.parse` rather than at
the network layer. `npm run preview` reproduces this exactly, since it has no proxy.

## 8. Known gaps

- `/innovation-hub/` renders "coming soon". The API client and the detail route exist,
  but Heimdall's `innovation_posts` table is empty and has no seeder or admin CRUD — so
  there is nothing to list.
- `features/team/api.ts` is wired to a live endpoint that no route renders.
- Careers is entirely static (`careersData.ts`); Heimdall has no careers endpoint, so
  job listings require a code change and a redeploy.
- `VITE_ANALYTICS` is read in `routes/__root.tsx` but is not declared in
  `src/vite-env.d.ts`.
- Both `yarn.lock` and `package-lock.json` are committed. The Docker build uses
  `npm ci`; `yarn` is not installed on the deploy host.
