# Fresko — UAT image. Build stage produces dist/, runtime stage is the nginx
# that terminates TLS on :443 and proxies /api/ to the Heimdall container.
#
# ── WHY THE BUILD ARGS MATTER ───────────────────────────────────────────────────
# VITE_API_URL is baked into the bundle at BUILD time, not read at runtime. An
# image built without it inherits whatever .env.production holds, and there is no
# way to fix that with a runtime env var — you have to rebuild. This is the single
# most common reason a freshly built image serves a site whose every data-driven
# surface is empty.
#
# `/` is correct here: nginx serves the SPA and proxies /api/ on the same origin,
# so the browser never makes a cross-origin request and Heimdall needs no CORS
# entry. vite.config.ts's assertApiUrl plugin fails the build on a placeholder or
# a localhost value, so a wrong one stops here rather than shipping.

FROM node:22-alpine AS build

WORKDIR /app

# SETUP.md §2 builds with yarn; both lockfiles exist in the repo, so pin the one
# the runbook uses rather than letting the image pick.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ARG VITE_API_URL=/
ARG VITE_SITE_URL=https://uat.phitopolis.io
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SITE_URL=$VITE_SITE_URL

# Vite reads VITE_-prefixed vars from the process environment ahead of
# .env.production, so the ARGs above win without editing any file in the image.
# `yarn build` is `tsc -b && vite build` — it fails on any type error, on purpose.
RUN yarn build


FROM nginx:1.27-alpine AS runtime

# ── DO NOT ADD brotli_static HERE ───────────────────────────────────────────────
# deploy/nginx/fresko.conf (the bare-metal vhost) uses `brotli_static on;`. The
# official nginx image is NOT built with ngx_brotli, so that directive makes
# `nginx -t` fail, the container exits at startup, and the site is simply
# unreachable — which reads like a networking or DNS problem and is not one.
# fresko-uat.conf therefore uses gzip_static only, which IS compiled in.
# The build still emits .br files; they just go unserved on UAT. That is fine.
COPY deploy/nginx/fresko-uat.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /var/www/fresko/dist

EXPOSE 80 443

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- --no-check-certificate https://127.0.0.1/ >/dev/null || exit 1
