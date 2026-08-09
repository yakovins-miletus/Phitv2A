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
