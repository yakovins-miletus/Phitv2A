#!/usr/bin/env bash
#
# Hand ports 80/443 to Fresko, or give them back to phitopolis-revamp.
#
#   ./switch-443.sh status     what is on 80/443 right now
#   ./switch-443.sh fresko     Fresko takes 80/443   (revamp web stops)
#   ./switch-443.sh revamp     revamp takes 80/443   (Fresko drops to 8080/8443)
#
# ── What this does and does not touch ────────────────────────────────────────
#
# It does NOT modify the phitopolis-revamp repository, its image, or its config.
# It only stops and starts that container — the same thing `docker compose stop`
# would do — and republishes Fresko's host ports. Reversible in both directions,
# and `status` reads live docker state rather than a stored flag, so it cannot
# drift out of sync with reality.
#
# ── Known consequence of `fresko` mode ───────────────────────────────────────
#
# Stopping the revamp web container also takes down **directus.phitopolis.io**,
# because that hostname is proxied through the same nginx. The Directus service
# itself keeps running and stays reachable on :8055 — only the pretty hostname
# goes away until you switch back.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

COMPOSE="docker compose -f docker-compose.uat.yml"
REVAMP_WEB="phitopolis-website"
FRESKO="phit-uat-fresko"
ENV_FILE=".env"

c_ok=$'\033[32m'; c_warn=$'\033[33m'; c_off=$'\033[0m'

die() { echo "error: $*" >&2; exit 1; }

# Persist the mode into deploy/.env so a later plain `docker compose up -d`
# keeps the current mode instead of silently reverting to the 8443 defaults.
set_env() {
  local key=$1 val=$2
  touch "$ENV_FILE"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$val" >> "$ENV_FILE"
  fi
}

fresko_host_https_port() {
  docker inspect "$FRESKO" \
    --format '{{range $p, $conf := .NetworkSettings.Ports}}{{if eq $p "8443/tcp"}}{{(index $conf 0).HostPort}}{{end}}{{end}}' \
    2>/dev/null || true
}

revamp_running() {
  [ "$(docker inspect -f '{{.State.Running}}' "$REVAMP_WEB" 2>/dev/null || echo false)" = "true" ]
}

status() {
  local fp; fp="$(fresko_host_https_port)"
  echo "port 443 holder:"
  if revamp_running; then
    echo "  ${c_ok}revamp${c_off}  (phitopolis-website)  -> https://uat.phitopolis.io"
  elif [ "$fp" = "443" ]; then
    echo "  ${c_ok}fresko${c_off}  (phit-uat-fresko)     -> https://uat.phitopolis.io"
  else
    echo "  ${c_warn}nobody${c_off} — neither container is publishing 443"
  fi
  echo
  echo "fresko published on: ${fp:-not running}"
  echo "revamp web running : $(revamp_running && echo yes || echo no)"
  echo
  docker ps --format '  {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'phit|revamp|website|directus' || true
}

wait_healthy() {
  local name=$1 url=$2
  for _ in $(seq 1 30); do
    if curl -sk -o /dev/null --max-time 3 "$url"; then echo "  $name responding"; return 0; fi
    sleep 1
  done
  die "$name did not come up at $url — check: docker logs $name"
}

to_fresko() {
  if [ "$(fresko_host_https_port)" = "443" ] && ! revamp_running; then
    echo "already in fresko mode"; return 0
  fi

  echo "==> stopping revamp web (frees 80/443; directus.phitopolis.io goes with it)"
  docker stop "$REVAMP_WEB" >/dev/null 2>&1 || echo "  (was not running)"

  echo "==> republishing Fresko on 80/443"
  set_env FRESKO_HTTP_PORT 80
  set_env FRESKO_HTTPS_PORT 443
  # Empty, so the HTTP->HTTPS redirect targets https://host with no port.
  set_env PUBLIC_HTTPS_PORT ""
  $COMPOSE up -d >/dev/null

  wait_healthy "$FRESKO" https://127.0.0.1:443/
  echo
  echo "${c_ok}fresko now owns 80/443${c_off}  ->  https://uat.phitopolis.io"
  echo "revert with: ./switch-443.sh revamp"
}

to_revamp() {
  if revamp_running && [ "$(fresko_host_https_port)" != "443" ]; then
    echo "already in revamp mode"; return 0
  fi

  echo "==> moving Fresko back to 8080/8443 (frees 80/443)"
  set_env FRESKO_HTTP_PORT 8080
  set_env FRESKO_HTTPS_PORT 8443
  set_env PUBLIC_HTTPS_PORT ":8443"
  $COMPOSE up -d >/dev/null

  echo "==> starting revamp web"
  docker start "$REVAMP_WEB" >/dev/null
  wait_healthy "$REVAMP_WEB" https://127.0.0.1:443/

  echo
  echo "${c_ok}revamp now owns 80/443${c_off}  ->  https://uat.phitopolis.io"
  echo "fresko is on :8443 (blocked by the security group unless you open it)"
}

case "${1:-status}" in
  status) status ;;
  fresko) to_fresko; echo; status ;;
  revamp) to_revamp; echo; status ;;
  *) die "usage: $0 [status|fresko|revamp]" ;;
esac
