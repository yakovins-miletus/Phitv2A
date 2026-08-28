# Security audit & rework — 11 August 2026

Covers **Fresko** (`Phitv2A`). Heimdall's findings, and the host/EC2 section for
whoever owns the instance, are in `Phitv2B-2/docs/SECURITY-AUDIT-2026-08-11.md`.

All work landed on the `uat-staging` branch. `main` was not touched.

---

## What was already right

Worth stating plainly, because it shaped where the effort went:

- **No XSS anywhere.** Zero `dangerouslySetInnerHTML`, `innerHTML`, `eval`,
  `new Function`, `document.write` or `insertAdjacentHTML` in `src/`. Blog and
  innovation bodies are split into paragraphs and rendered as React text nodes.
  The "plain text, no markup parsing" design holds.
- **All 5 `target="_blank"` links carry `rel="noopener noreferrer"`.** No raw
  `<a>` tags. Every dynamic `href` resolves to a module constant or a `mailto:`.
- **No secret was ever committed** — 95 commits scanned for AWS, GitHub, OpenAI,
  Google and PEM key formats. Zero hits. The only tracked env files contain
  `VITE_API_URL`, whose history shows the `phitv2.phit.b.com` → `/` migration.
- **Lockfile integrity is clean.** 478/478 `yarn.lock` entries carry an integrity
  hash and resolve to `registry.npmjs.org`. No git/file/link specifiers, no
  alternate registries, no typosquats.
- **No token storage.** No `localStorage`, `sessionStorage` or `document.cookie`
  anywhere in `src/`.

---

## The headline

**Every security header in both nginx configs was silently dropped.**

nginx's `add_header` is replace-not-merge across configuration levels: a
`location` that declares *any* `add_header` of its own discards every header
inherited from the server level. Every location in these configs sets
`Cache-Control` — so `X-Frame-Options`, `X-Content-Type-Options` and
`Referrer-Policy`, all declared at server level, applied to **no response the
site actually served**, including `index.html`.

Confirmed against the running stack rather than inferred:

```
$ curl -sI http://127.0.0.1:8081/
HTTP/1.1 200 OK
Cache-Control: no-cache          <- the only header that survived
```

`X-Frame-Options: DENY` was declared and never sent. The same defect was present
in `fresko.conf`, `fresko-uat.conf` and Heimdall's `admin.conf`.

### Fixed

`deploy/nginx/security-headers.conf`, included **inside every location block**.
Verified live:

```
$ curl -skI https://127.0.0.1:8443/
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
referrer-policy: strict-origin-when-cross-origin
content-security-policy: default-src 'self'; script-src 'self'; ...
x-robots-tag: noindex, nofollow
```

Also added:

- **CSP**, which the config previously declined on the grounds that Emotion
  inlines styles. That argument applies to `style-src`, not `script-src` — and
  given there are no HTML-injection sinks, a strict `script-src 'self'` costs
  nothing. `object-src 'none'` covers the `<object>` PDF embed; `base-uri 'self'`
  is load-bearing because `index.html` loads its module script by relative path.
- **HSTS**, in a *separate* include (`hsts.conf`) used only by `fresko.conf`.
  UAT must not send it: self-signed cert, non-default port, and HSTS is scoped to
  the host rather than the port — pinning `uat.phitopolis.io` from a `:8443`
  visit would break the `:443` site living there.
- **TLS protocol pinning** in `fresko.conf`, which had none and inherited
  whatever the host default was.

---

## Other findings

### High

**`@mui/lab@9.0.0-beta.6` pulled a complete second MUI runtime into production.**
It peer-depends on `@mui/material@^9` while the app pins `@mui/material@7`, so
the lockfile carried `@mui/system`, `@mui/utils`, `@mui/private-theming` and
`@mui/styled-engine` **twice** — at v7 and v9. The single consumer was
`<Masonry>`, which therefore read MUI 9's theming context that this app's v7
`ThemeProvider` never populates: it rendered against MUI 9 defaults, not the
theme. It was also the sole reason `npm ci` failed outright.

Replaced with CSS multi-column and the dependency removed. Trade-off recorded in
the code: CSS columns fill top-to-bottom per column rather than left-to-right.

**Two divergent lockfiles.** `yarn.lock` and `package-lock.json` disagreed on 14
package versions, and `netlify.toml` ran `npm run build` — so that target built a
dependency tree nobody had tested. `package-lock.json` deleted; yarn is canonical
everywhere.

### Medium

| Finding | Fix |
|---|---|
| **The careers form reported success on failure.** `setFormSubmitted(true)` sat outside any callback, so a failed POST still showed "Application Received!" — with Heimdall down, applications were lost silently, with no signal to the applicant or to us | Driven off `mutation.isSuccess`, as `ContactForm` already did. Added a visible error alert and a pending state |
| The same form validated only "is it non-empty" — no email format check, no length checks against the server's documented bounds | Shared `features/contact/validation.ts`, mirroring `ContactMessageIn` |
| **The honeypot trapped keyboard users.** `tabIndex={-1}` was set on `<TextField>`, which spreads unknown props onto its root `div`, not the `<input>` — so the input kept its default tab order. A keyboard user tabbing past "Message" landed on an invisible field 10,000px off-screen, inside an `aria-hidden` container (an ARIA violation in itself), typed into it, and had a genuine enquiry silently discarded | `inert` on the wrapper, `tabIndex` via `slotProps.htmlInput` |
| **`image_url` reached `<img src>` with zero validation** at six call sites, while body paragraphs beside it were gated | New `safeImageUrl()`, applied at all six |
| **The image regex allowed a query string.** `\S+` is greedy, so `https://evil.example/track?id=victim&x=.png` matched — the string still *ends* in `.png`. Bound to an `<img src>`, that sends every visitor's IP, User-Agent and Referer to an attacker-chosen host with arbitrary data attached | Query strings and fragments rejected, **on both sides of the twin** |
| `.dockerignore` excluded `deploy/.env` but not developer-local `.env` / `.env.local` | Narrowed to local files only. `.env.production` is deliberately *not* excluded — Vite needs it, and every `VITE_*` value is inlined into the client bundle, so it is public by definition |

### Contract drift — the finding behind the CI work

`src/shared/api/schema.d.ts` is **generated** from Heimdall's OpenAPI document and
committed. Nothing regenerated it, and it had drifted: Heimdall grew a second
honeypot field (`website_hp`) that Fresko's client never learned about.

Harmless in this instance — the field defaults to `""` — but it proves the two
repos can disagree silently, and a future *required* field would compile clean
here and fail at runtime.

---

## Tests: 242 passing

Added `tests/body-images.test.ts` (13) and `tests/careers-application.test.tsx`
(7), covering the regex bypasses and the validation the careers form lacked.

**Two tests were already failing on `main` before any of this work** — verified
by running them against the untouched checkout. Both pinned literal marketing
copy that `content.ts` had since renamed:

- `home-route.test.tsx` asserted `"Full-Stack Development"`, which the home page
  renders nowhere (the section was removed; the catalogue calls it "Software
  Development").
- `home-reduced-motion.test.tsx` asserted `"Elite Technical Talent"` and
  `"Prime Global Location"`, both renamed.

Fixed by reading from `CONTENT` rather than re-freezing prose — the approach the
test file's own comments already advocate after an earlier round of the same
drift. The assertion that matters (every pillar and differentiator is reachable
under reduced motion) is now expressed against the source of truth.

## CI added

There was none in either repo. Fresko's runs typecheck, lint, tests and build,
plus two contract jobs: every path the app calls must exist in `schema.d.ts`, and
every declared path must still be present. That is the gate that would have
caught `website_hp`.

---

## UAT deployment

```
EC2 ── 80 / 443 / 8055     phitopolis-revamp        ← untouched throughout
    ── 8080                fresko-uat → 301 :8443
    ── 8443                fresko-uat (TLS, self-signed)
                             /       → SPA
                             /api/   → heimdall-uat:8000
                             /api/v1/heimdall/ → 404
    ── 127.0.0.1:8081      heimdall admin UI (SSH tunnel)
    ── 127.0.0.1:8001      heimdall API (debugging, typegen)
```

Runs as `nginx-unprivileged` (non-root, hence the >1024 ports), `read_only`
rootfs, `cap_drop: ALL`, `no-new-privileges`, 256 MB cap, logs capped at 10 MB × 3.

**Deploying:** see the UAT section of `docs/deploy/ec2.md`. Heimdall first.

One thing to know: `deploy/ssl/key.pem` must be owned by **uid 101** (the nginx
user in the unprivileged image). A root-owned `0600` key makes nginx fail at
startup with an opaque `BIO_new_file() failed` and crash-loop. `make-cert.sh`
handles this.

## Accepted, not fixed

- **Self-signed TLS**, so browser warnings. `fresko.conf` is the real production
  config and expects a Let's Encrypt cert.
- **`.br` files are built and not served** — the nginx alpine images have no
  brotli module, and enabling `brotli_static` fails `nginx -t`. `gzip_static`
  covers it; both artifacts are on disk.
- **No DNS record.** `fresko.phitopolis.io` does not resolve; UAT rides
  `uat.phitopolis.io:8443`.
- **Third-party requests remain** on `/about` (`cdn.simpleicons.org`, WordPress
  images) and `/contact` (Google Maps embed). Documented, not removed — the maps
  iframe cannot be sandboxed without breaking it.
