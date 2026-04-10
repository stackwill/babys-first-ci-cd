# Base64 Utility

Small Next.js app for encoding and decoding Base64 text, built to validate a Docker-to-GHCR-to-server deployment path with Watchtower handling server-side updates.

## Local development

```bash
bun install
bun run dev
```

## GitHub Actions

The workflow only builds and publishes the container image to GHCR. It does not SSH into your server.

## Required server setup

1. Install Docker and Docker Compose.
2. Create `/opt/base64-utility`.
3. Copy `docker-compose.yml` to `/opt/base64-utility/docker-compose.yml`.
4. Run `docker login ghcr.io` on the server with a token that can read packages.
5. Start the stack once with `docker compose up -d`.

## How updates happen

1. Push to `main`.
2. GitHub Actions builds and pushes `ghcr.io/stackwill/base64-utility:latest`.
3. Watchtower running on the server notices the new image.
4. Watchtower pulls it and restarts the `app` container automatically.

## First deploy checklist

1. Create the GitHub repository.
2. Push this project to `main`.
3. Copy `docker-compose.yml` to `/opt/base64-utility/docker-compose.yml` on the server.
4. Run `docker login ghcr.io` on the server.
5. Start the stack with `cd /opt/base64-utility && docker compose up -d`.
6. Confirm the `Publish` workflow publishes `ghcr.io/stackwill/base64-utility:latest`.
7. Wait for Watchtower to pull the update and restart the app.
