#!/usr/bin/env bash
# Generate the self-signed cert Fresko's UAT nginx serves on :8443.
#
# Self-signed matches how phitopolis-revamp does UAT. Browsers will warn; that is
# accepted here. Swap for a real cert (certbot, or an ACM/ALB in front) before
# anything user-facing.
set -euo pipefail

HOST="${1:-uat.phitopolis.io}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ssl"

mkdir -p "$DIR"

if [[ -f "$DIR/cert.pem" && "${FORCE:-}" != "1" ]]; then
  echo "cert already exists at $DIR/cert.pem — re-run with FORCE=1 to replace"
  exit 0
fi

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$DIR/key.pem" \
  -out    "$DIR/cert.pem" \
  -subj   "/CN=$HOST" \
  -addext "subjectAltName=DNS:$HOST,DNS:localhost,IP:127.0.0.1"

# The private key must be readable by the container's nginx user and by nobody
# else. The runtime image is nginx-unprivileged, which runs as uid 101 — with a
# root-owned 0600 key, nginx fails at startup with an opaque
# "BIO_new_file() failed ... Permission denied" and the container crash-loops.
#
# Owning it as 101 keeps 0600 (no other account on this shared box can read it)
# while letting the one process that needs it in. The certificate is public, so
# it stays world-readable.
NGINX_UID=101
chmod 600 "$DIR/key.pem"
chmod 644 "$DIR/cert.pem"
if ! chown "$NGINX_UID:$NGINX_UID" "$DIR/key.pem" 2>/dev/null; then
  sudo chown "$NGINX_UID:$NGINX_UID" "$DIR/key.pem"
fi

echo "wrote $DIR/cert.pem and $DIR/key.pem for CN=$HOST (expires in 365 days)"
echo "key owned by uid $NGINX_UID (nginx-unprivileged), mode 600"
