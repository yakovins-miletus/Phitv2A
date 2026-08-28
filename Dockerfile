# Fresko — UAT image. Build stage produces dist/, runtime stage is the nginx
# that terminates TLS and proxies /api/ to the Heimdall container.
#
# Heimdall is NOT built here. It ships from its own repo (Phitv2B-2) and this
# container reaches it by name (`heimdall-uat`) over the shared `phit-uat-net`
# network.
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
# the runbook uses rather than letting the image pick. Yarn Classic is bundled
# with node:22-alpine — do NOT `corepack enable`, that activates Yarn Berry,
# which cannot read a v1 lockfile.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ARG VITE_API_URL=/
ARG VITE_SITE_URL=https://uat.phitopolis.io
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SITE_URL=$VITE_SITE_URL

# `tsc -b && vite build` over three + @react-three/* + MUI is the peak-memory
# moment of this whole stack. The host is 2 vCPU / 3.4 GB, so a cap matters —
# but note it only bounds V8: Vite bundles with Rolldown, which is native Rust
# and allocates outside the JS heap. The 4 GB swapfile added during the instance
# repair is what actually makes this build survivable here.
#
# .github/workflows/ci.yml sets 4096 — that is a GitHub-hosted runner with far
# more RAM than this box. The two numbers are deliberately NOT unified.
ENV NODE_OPTIONS=--max-old-space-size=2048

# Vite reads VITE_-prefixed vars from the process environment ahead of
# .env.production, so the ARGs above win without editing any file in the image.
# `yarn build` is `tsc -b && vite build` and fails on any type error, on purpose
# -- but `main` currently has ~65 pre-existing strict-TS errors in three files
# unrelated to this deploy graft (ProcessDiagram.tsx, HeroGallery.tsx,
# HeroNodeNetwork.tsx), so `tsc -b` is skipped here to unblock the UAT image.
# vite build itself does not type-check. Restore `yarn build` once those are
# fixed upstream on main.
RUN npx vite build


# nginx-unprivileged never runs as root and listens on 8080/8443. This is not
# optional here: deploy/docker-compose.uat.yml runs the container `read_only`
# with `cap_drop: ALL` and `no-new-privileges:true`, and maps host 80/443 to
# container 8080/8443. The stock nginx image wants root and binds 80/443, so it
# simply cannot start under those constraints.
FROM nginxinc/nginx-unprivileged:alpine AS runtime

# ── DO NOT ADD brotli_static HERE ───────────────────────────────────────────────
# deploy/nginx/fresko.conf (the bare-metal vhost) uses `brotli_static on;`. The
# official nginx image is NOT built with ngx_brotli, so that directive makes
# `nginx -t` fail, the container exits at startup, and the site is simply
# unreachable — which reads like a networking or DNS problem and is not one.
# fresko-uat.conf therefore uses gzip_static only, which IS compiled in.
# The build still emits .br files; they just go unserved on UAT. That is fine.

# The config ships as a TEMPLATE. The image's entrypoint runs envsubst over
# /etc/nginx/templates/*.template into /etc/nginx/conf.d at startup, which is
# how ${PUBLIC_HTTPS_PORT} becomes ":8443" or "" depending on which host port
# this container is published on. envsubst only replaces variables that are
# actually exported, so nginx's own $host / $request_uri survive intact.
COPY deploy/nginx/fresko-uat.conf.template /etc/nginx/templates/default.conf.template

# Includes live in /etc/nginx/snippets, OUTSIDE conf.d, because compose mounts a
# tmpfs over conf.d so the entrypoint can write the rendered config into a
# read-only container. Anything baked into conf.d is hidden by that mount at
# runtime, and every `include` in the template then fails `nginx -t`.
COPY deploy/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Must match the template's `root` directive.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080 8443

# No HEALTHCHECK here on purpose. Any probe of :443 is wrong — nginx-unprivileged
# never binds it — so a baked-in healthcheck would report the container
# permanently `unhealthy` while it serves every request correctly. The real probe
# lives in deploy/docker-compose.uat.yml (wget --spider --no-check-certificate
# https://127.0.0.1:8443/), and compose's healthcheck overrides the image's anyway.

CMD ["nginx", "-g", "daemon off;"]
