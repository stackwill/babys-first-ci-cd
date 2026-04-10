#!/usr/bin/env bash

set -euo pipefail

prompt() {
  local label="$1"
  local default_value="${2-}"
  local value=""

  if [[ -n "$default_value" ]]; then
    read -r -p "$label [$default_value]: " value
    printf '%s' "${value:-$default_value}"
    return
  fi

  while [[ -z "$value" ]]; do
    read -r -p "$label: " value
  done

  printf '%s' "$value"
}

prompt_secret() {
  local label="$1"
  local value=""

  while [[ -z "$value" ]]; do
    read -r -s -p "$label: " value
    printf '\n' >&2
  done

  printf '%s' "$value"
}

slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g'
}

infer_image_from_repo() {
  local repo_url="$1"

  if [[ "$repo_url" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
    printf 'ghcr.io/%s/%s:latest' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
    return
  fi

  printf ''
}

REMOTE_IP="$(prompt "Target host IP or name")"
SSH_USER="$(prompt "SSH user" "root")"
REPO_URL="$(prompt "GitHub repo URL (used to infer image name, optional)" "")"
INFERRED_IMAGE="$(infer_image_from_repo "$REPO_URL")"
IMAGE_REF="$(prompt "Container image reference" "${INFERRED_IMAGE:-ghcr.io/owner/app:latest}")"
DEFAULT_APP_NAME="$(basename "${IMAGE_REF%%:*}")"
APP_NAME="$(prompt "Deployment name" "$(slugify "$DEFAULT_APP_NAME")")"
HOST_PORT="$(prompt "Host port" "3000")"
CONTAINER_PORT="$(prompt "Container port" "3000")"
WATCH_INTERVAL="$(prompt "Watchtower poll interval in seconds" "300")"
PRIVATE_IMAGE="$(prompt "Private GHCR image? (yes/no)" "yes")"

REMOTE_HOME="$(ssh -o BatchMode=yes "${SSH_USER}@${REMOTE_IP}" "getent passwd '${SSH_USER}' | cut -d: -f6")"
if [[ -z "$REMOTE_HOME" ]]; then
  printf 'Unable to determine remote home directory for %s.\n' "$SSH_USER" >&2
  exit 1
fi

REMOTE_APP_DIR="/opt/${APP_NAME}"
REMOTE_DOCKER_CONFIG="${REMOTE_HOME}/.docker/config.json"

if [[ "$PRIVATE_IMAGE" == "yes" ]]; then
  GHCR_USERNAME="$(prompt "GHCR username")"
  GHCR_TOKEN="$(prompt_secret "GHCR read token")"

  ssh "${SSH_USER}@${REMOTE_IP}" "mkdir -p '${REMOTE_HOME}/.docker'"
  printf '%s' "$GHCR_TOKEN" | ssh "${SSH_USER}@${REMOTE_IP}" \
    "docker login ghcr.io -u '${GHCR_USERNAME}' --password-stdin"
fi

COMPOSE_FILE="$(mktemp)"
trap 'rm -f "$COMPOSE_FILE"' EXIT

cat >"$COMPOSE_FILE" <<EOF
services:
  app:
    image: ${IMAGE_REF}
    restart: unless-stopped
    ports:
      - "${HOST_PORT}:${CONTAINER_PORT}"
    labels:
      - com.centurylinklabs.watchtower.enable=true

  watchtower:
    image: ghcr.io/nicholas-fedor/watchtower:latest
    restart: unless-stopped
    command:
      - --label-enable
      - --interval
      - "${WATCH_INTERVAL}"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ${REMOTE_DOCKER_CONFIG}:/config.json:ro
EOF

ssh "${SSH_USER}@${REMOTE_IP}" "mkdir -p '${REMOTE_APP_DIR}'"
scp "$COMPOSE_FILE" "${SSH_USER}@${REMOTE_IP}:${REMOTE_APP_DIR}/docker-compose.yml"
ssh "${SSH_USER}@${REMOTE_IP}" \
  "cd '${REMOTE_APP_DIR}' && docker compose pull && docker compose up -d"

cat <<EOF

Bootstrap complete.
Host: ${REMOTE_IP}
Deploy directory: ${REMOTE_APP_DIR}
Image: ${IMAGE_REF}
Published repo: ${REPO_URL:-not recorded}

This host will now track updates for ${IMAGE_REF} with Watchtower.
EOF
