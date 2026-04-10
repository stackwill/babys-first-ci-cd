# Production Bootstrap

Use `bootstrap-watchtower-host` from your local machine to configure a fresh Docker host that will track a GHCR image with Watchtower.

## Recommended host account model

Industry-standard practice is:

- use `root` or a provisioning account only for first-host bootstrap
- use a normal deploy/admin user for day-to-day access
- run the app under Docker as configured by the host, not by giving application shells broad system access

For this repo, bootstrapping over SSH as `root` is acceptable because the script only writes the Compose stack, optionally logs Docker into GHCR, and starts the containers. Day-to-day interactive use should still prefer a normal admin user.

## Preconditions

- SSH key auth already works to the target host
- Docker and `docker compose` are already installed on the host
- the GitHub Actions workflow has already pushed the image version you want the host to track

## Usage

```bash
bootstrap-watchtower-host
```

The script prompts for:

- target IP or hostname
- SSH user
- GitHub repo URL
- container image reference
- deployment name
- host port and container port
- Watchtower interval
- whether the image is private

If the image is private, the script also prompts for a GHCR username and read token, then runs `docker login ghcr.io` remotely before writing the Compose file.

## Important workflow rule

This script deploys the published image, not your local unpushed code. Push the repo first, wait for the image publish to complete, then run the bootstrap against the target host.
