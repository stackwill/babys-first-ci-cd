# Base64 Utility App Design

## Goal

Build a very small Next.js application that is useful on its own and also serves as a realistic proof of the deployment pipeline. The app will let the user encode plain text to Base64 and decode Base64 back to plain text through a simple web UI backed by small server-side routes.

## Constraints

- Keep the project small and easy to understand.
- Use Next.js because that is closer to the sort of app that will actually be deployed later.
- Use Bun as the package manager and runtime for local development and container builds.
- Deploy automatically on every push to `main`.
- Build and push a Docker image in GitHub Actions, then deploy by SSH to the server and restart via `docker compose`.
- Avoid unnecessary services such as databases, auth, queues, or external APIs.

## Recommended Approach

Use a single Next.js App Router application with one main page and two small API routes:

- `POST /api/encode` accepts plain text and returns Base64 output.
- `POST /api/decode` accepts Base64 input and returns decoded plain text or a validation error.

The main page presents one textarea for input, one output panel, and actions for encode, decode, copy result, and clear. This keeps the app genuinely useful while staying small enough to focus on the infrastructure path.

## Alternatives Considered

### 1. Plain Bun server

This is smaller, but it is less representative of the kind of app likely to be deployed later.

### 2. Multi-tool pasteboard

This would be broadly useful, but it adds avoidable scope. One focused utility is enough to validate the deployment pipeline.

### 3. Entirely client-side Base64 tool

This is simpler, but it misses the point of validating a realistic application container with both frontend and backend behavior.

## Application Design

### Homepage

The homepage will contain:

- a title and short explanation
- an input textarea
- two primary actions: encode and decode
- an output panel
- copy and clear controls
- a compact status strip showing deploy metadata such as commit SHA and build time

The UI should feel like a small polished utility rather than a placeholder demo page.

### API Behavior

`/api/encode`:

- accepts JSON with a `text` field
- returns JSON containing Base64 output
- trims nothing automatically so the transform is predictable

`/api/decode`:

- accepts JSON with a `text` field
- validates the Base64 input
- returns decoded UTF-8 text on success
- returns a structured `400` error on invalid input

### Error Handling

- Empty input returns a clear validation message.
- Invalid Base64 decode requests return a friendly error.
- Frontend shows request errors inline without breaking page state.

## Deployment Design

### Container Build

Use a multi-stage Docker build:

- install dependencies with Bun
- build the Next.js app
- run the production server in a minimal runtime stage

### Compose Runtime

The server will run the app with `docker compose` and expose a single HTTP port. The compose file will be written so the server can pull from `ghcr.io` and restart the app with a single command.

### GitHub Actions Workflow

On every push to `main`:

1. check out the repository
2. install Bun
3. build the Docker image
4. push the image to `ghcr.io`
5. connect to the server over SSH
6. run `docker compose pull && docker compose up -d`

## Configuration

The repository will include example documentation for:

- `GHCR_USERNAME`
- `GHCR_TOKEN`
- `SSH_HOST`
- `SSH_PORT`
- `SSH_USER`
- `SSH_PRIVATE_KEY`

The app will also surface build metadata through environment variables embedded at build time so each deploy is visibly identifiable in the UI.

## Testing Scope

Keep testing minimal:

- one unit test for Base64 encode/decode helpers if a helper module is introduced
- one route-level test or smoke-style validation where reasonable
- manual verification that the page loads, encode works, decode works, and invalid decode shows an error

## Non-Goals

- user accounts
- persistence
- history of conversions
- rate limiting
- file upload
- sharing links

## Expected Outcome

The final result is a small but legitimate Next.js utility app that proves the full workflow:

- push code
- GitHub Actions builds and publishes an image
- server pulls the new image
- container restarts automatically
- the browser shows the updated utility page and current deploy metadata
