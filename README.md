# Base64 Utility

Small Next.js app for encoding and decoding Base64 text, built to validate a Docker-to-GHCR-to-server deployment path.

## Local development

```bash
bun install
bun run dev
```

## Required GitHub secrets

- `SSH_HOST`
- `SSH_PORT`
- `SSH_USER`
- `SSH_PRIVATE_KEY`

## Required server setup

1. Install Docker and Docker Compose.
2. Create `/opt/base64-utility`.
3. Copy `docker-compose.yml` to `/opt/base64-utility/docker-compose.yml`.
4. Run `docker login ghcr.io` on the server with a token that can read packages.
5. Add the GitHub Actions deploy key to the target user's `authorized_keys`.

## First deploy checklist

1. Create the GitHub repository.
2. Add the required repository secrets.
3. Push this project to `main`.
4. Confirm the `Deploy` workflow publishes `ghcr.io/stackwill/base64-utility:latest`.
5. Confirm the server updates after the SSH deploy step runs.
