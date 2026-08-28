# Deploying Fresko on the shared EC2 instance

Three things run on one instance: **Fresko** (this repo — public, read-only), **Heimdall**
(FastAPI backend plus its own admin UI), and a **UAT site**. They share the box, not a
port: every app process binds loopback, and Nginx is the only thing listening publicly.

```
                    :443  nginx
                      │
   fresko.<domain> ───┤── /            → /var/www/fresko/dist        (static)
                      │   /api/        → 127.0.0.1:8000              (Heimdall)
                      │
   uat.<domain>    ───┤── /            → /var/www/uat/dist
                      │   /api/        → 127.0.0.1:8001              (UAT Heimdall)
                      │
   admin           ───┴── Tailscale only, never in a public server block
```

## Why the API is same-origin

`.env.production` sets `VITE_API_URL=/`. Every API call is therefore a relative request to
`/api/v1/...` on whatever host served the page.

This replaced `https://phitv2.phit.b.com`, a hostname that does not resolve. Because dev
points at `localhost:8000`, nothing surfaced until a production build was loaded — and
then blog, innovation hub, services, careers and contact all failed at once with
`ERR_NAME_NOT_RESOLVED`. Same-origin removes the class of bug: there is no hostname to go
stale, no CORS config to keep in sync, and no preflight.

`vite.config.ts` now fails the build if `VITE_API_URL` is empty or matches a placeholder
pattern, so the old value cannot come back silently.

> **Only use an absolute origin if Fresko is ever served from a different host than the
> API.** Heimdall would then also need a CORS allow-list, which it does not have today.

## The failure mode to know about

If the `location /api/` block is missing, requests fall through to the SPA fallback and
return **200 with `index.html` as the body**. The client dies inside `JSON.parse`, not at
the network layer, so the page just shows no data with no useful error.

You can reproduce it right now: `yarn preview` has no proxy, and
`curl -i localhost:4173/api/v1/services` returns `200` and HTML.

So after any Nginx change, check the API directly rather than eyeballing the page:

```bash
curl -si https://fresko.example.com/api/v1/services | head -1
```

That must be `200` with `content-type: application/json`. HTML means the proxy is not
matching.

## Install

```bash
sudo cp deploy/nginx/fresko.conf /etc/nginx/sites-available/fresko.conf
sudo ln -sf /etc/nginx/sites-available/fresko.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

`brotli_static` needs `libnginx-mod-http-brotli`; without it nginx fails `-t` on that
directive. On Amazon Linux / Ubuntu:

```bash
sudo apt-get install -y libnginx-mod-http-brotli
```

If you cannot install it, delete the `brotli_static on;` line — `gzip_static on;` alone
still serves the `.gz` files the build emits. Do not leave both off: the build spends time
producing `.br` and `.gz` for every asset, and nothing serves them by default.

## Build and ship

```bash
yarn install --frozen-lockfile
yarn build
sudo rsync -a --delete dist/ /var/www/fresko/dist/
```

`--delete` matters: `dist/` holds content-hashed filenames, so without it every old chunk
accumulates forever.

## What this deployment does not carry over

`vercel.json` and `netlify.toml` both encode the correct caching policy, and **neither
applies on EC2**. The Nginx config reproduces them:

| Path | Cache-Control | Why |
|---|---|---|
| `/assets/*` | `max-age=31536000, immutable` | content-hashed |
| `/images/`, `/videos/`, `/logos/`, `/pdfs/` | `max-age=604800` | not hashed; 7 days |
| `/index.html` | `no-cache` | or a deploy never reaches anyone |
| `/api/*` | `no-store` | Heimdall owns freshness |

Vercel Analytics and Speed Insights are gated to `*.vercel.app` in `routes/__root.tsx`.
They fetch `/_vercel/insights/script.js`, which exists only on Vercel's edge — unGated,
they 404 twice on every page load here. Set `VITE_ANALYTICS=on` to force them.

## Checklist

- [ ] `curl -si https://<host>/api/v1/services | head -1` → `200`, `application/json`
- [ ] `curl -sI https://<host>/assets/<hashed>.js | grep -i 'content-encoding'` → `br`
- [ ] `curl -sI https://<host>/index.html | grep -i cache-control` → `no-cache`
- [ ] `curl -si https://<host>/api/v1/heimdall/admin/posts | head -1` → `404`
- [ ] A deep link (`https://<host>/blog/<slug>`) loads directly, not just via in-app nav
- [ ] Browser console is clean on `/` — no 404s, no SVG attribute errors

---

# UAT — the containerised variant

Everything above describes the host-Nginx target. **UAT is deployed differently**,
because the box already has a tenant.

`phitopolis-revamp` runs a Docker Compose stack that owns **80, 443 and 8055**, and it
is out of scope to modify. Host Nginx is installed but `inactive`/`disabled` — the
ports belong to containers. So UAT mirrors that pattern instead of competing with it:
Fresko builds into an `nginx:alpine` image and publishes on **8080/8443**.

```
EC2 ── 80 / 443 / 8055    phitopolis-revamp        ← untouched
    ── 8080               fresko-uat  → 301 to :8443
    ── 8443               fresko-uat  (TLS, self-signed)
                             /       → /usr/share/nginx/html
                             /api/   → heimdall-uat:8000
                             /api/v1/heimdall/ → 404
    ── 127.0.0.1:8081     heimdall-admin-ui        (Phitv2B-2, SSH tunnel only)
    ── 127.0.0.1:8001     heimdall-uat direct      (debugging, typegen)

    docker network: phit-uat-net  (external, shared by both repos' compose files)
```

Heimdall ships from **`Phitv2B-2`**, not from here. The two repos deploy independently
and meet on `phit-uat-net`; neither needs a filesystem path into the other. **Bring
Heimdall up first** — see `Phitv2B-2/deploy/README.md`.

## Deploy

```bash
docker network create phit-uat-net
```

```bash
cd deploy && ./make-cert.sh uat.phitopolis.io && cp .env.sample .env
```

```bash
docker compose -f docker-compose.uat.yml up -d --build
```

## What changed from `fresko.conf`, and why

`deploy/nginx/fresko-uat.conf` keeps the API-before-fallback ordering, the
`/api/v1/heimdall/ → 404` block, every cache rule and the security headers. Four
things differ:

| | `fresko.conf` (host) | `fresko-uat.conf` (container) |
|---|---|---|
| `root` | `/var/www/fresko/dist` | `/usr/share/nginx/html` |
| Upstream | `upstream heimdall { 127.0.0.1:8000 }` | `resolver 127.0.0.11` + `set $heimdall_upstream heimdall-uat:8000` |
| Brotli | `brotli_static on` | **removed** — `nginx:alpine` has no brotli module and would fail `nginx -t` |
| Redirect | `https://$host` | `https://$host:8443` |

The variable-upstream trick is borrowed from `phitopolis-revamp/deploy/nginx.conf`. With
a static `upstream` block, Nginx refuses to start if the name does not resolve — so a
stopped Heimdall would take Fresko down with it. Resolving per-request turns that into a
502 on `/api/` while the site itself still serves.

## UAT checklist

Self-signed cert, so `-k` throughout. Substitute the host you pointed the cert at.

- [ ] `curl -s http://127.0.0.1:8001/health` → `ok`
- [ ] `curl -sk https://<host>:8443/api/v1/services | head -c 40` → JSON, **not** `<!doctype html>`
- [ ] `curl -sk -o /dev/null -w '%{http_code}\n' https://<host>:8443/api/v1/heimdall/admin/stats` → `404`
- [ ] `curl -skI https://<host>:8443/index.html | grep -i cache-control` → `no-cache`
- [ ] `curl -skI https://<host>:8443/blog/<slug> | head -1` → `200` (deep link serves the shell)
- [ ] `curl -skI https://uat.phitopolis.io/ | head -1` → `200` — **the revamp stack must be unaffected**
- [ ] Draft created in the admin UI is absent from `/blog`; publishing it makes it appear

## Switching who owns 80/443

The AWS security group only allows 80/443, so `uat.phitopolis.io:8443` is not
reachable from a browser even though Fresko serves it correctly on the box. To
demo Fresko at the clean `https://uat.phitopolis.io`, hand it the standard ports:

```bash
cd deploy && ./switch-443.sh fresko
```

```bash
cd deploy && ./switch-443.sh revamp
```

```bash
cd deploy && ./switch-443.sh status
```

`status` reads live Docker state rather than a stored flag, so it cannot drift.

The script does **not** modify the phitopolis-revamp repository, image or config
— it stops and starts that container and republishes Fresko's host ports, which
is why it is reversible in both directions.

**One consequence of `fresko` mode:** stopping the revamp web container also
takes `directus.phitopolis.io` down, because that hostname is proxied through the
same nginx. Directus itself keeps running and stays reachable on `:8055`; only
the hostname goes away until you switch back.

Because the container always listens on 8080/8443 internally (nginx-unprivileged
cannot bind a privileged port), only the host-side mapping changes. The
HTTP→HTTPS redirect is rendered from a template at container start via
`${PUBLIC_HTTPS_PORT}`, so it targets `https://host` in 443 mode and
`https://host:8443` otherwise. Those two settings must always change together —
the script is what keeps them in step.

## Known UAT limitations

- **No dedicated DNS record.** `fresko.phitopolis.io` does not resolve. Fresko
  rides `uat.phitopolis.io`, either on `:8443` (needs a security-group rule) or
  on 443 via the switch above.
- **Self-signed TLS** — browser warnings, same as the existing revamp UAT.
- **`.br` files are built and not served** (no brotli module). `gzip_static` covers it;
  the checklist item above that expects `content-encoding: br` applies to the host
  target only.
- **Heimdall has no authentication.** The admin surface is unreachable from the internet
  by port binding alone. That is a placement guarantee, not an access control.
