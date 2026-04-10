# Base64 Utility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tiny Next.js Base64 utility app with Dockerized production deployment to a server via GitHub Actions and GHCR.

**Architecture:** A Next.js App Router application serves a single utility page and two small API routes for Base64 encode and decode operations. The app is containerized with a multi-stage Bun-based Docker build, then a GitHub Actions workflow builds, publishes, and deploys the image over SSH with `docker compose`.

**Tech Stack:** Next.js, React, TypeScript, Bun, Docker, Docker Compose, GitHub Actions, GHCR

---

## File Structure

- Create: `package.json` - project manifest with Bun-oriented scripts
- Create: `bun.lock` - Bun lockfile generated after dependency install
- Create: `tsconfig.json` - TypeScript configuration for Next.js
- Create: `next.config.ts` - Next.js configuration
- Create: `.gitignore` - ignore build output and local env files
- Create: `app/layout.tsx` - shared document shell and metadata
- Create: `app/page.tsx` - homepage UI for Base64 encode/decode
- Create: `app/globals.css` - page styling
- Create: `app/api/encode/route.ts` - POST endpoint for Base64 encoding
- Create: `app/api/decode/route.ts` - POST endpoint for Base64 decoding with validation
- Create: `lib/base64.ts` - shared encode/decode helpers and validation logic
- Create: `lib/build-info.ts` - helper for surfacing build metadata in the UI
- Create: `Dockerfile` - multi-stage production image build
- Create: `docker-compose.yml` - runtime definition for the deploy target
- Create: `.dockerignore` - reduce build context size
- Create: `.github/workflows/deploy.yml` - build, publish, and SSH deploy workflow
- Create: `.env.example` - documented environment values for local/server use
- Create: `README.md` - setup and deployment instructions
- Create: `tests/base64.test.ts` - focused helper tests run with Bun

### Task 1: Scaffold the Next.js project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create the project manifest**

```json
{
  "name": "base64-utility",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "bun test"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.9.0"
  },
  "packageManager": "bun@1.2.13"
}
```

- [ ] **Step 2: Create TypeScript and Next config**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 3: Create ignore rules**

```gitignore
.next
node_modules
.env
.env.local
dist
coverage
```

- [ ] **Step 4: Create the app shell**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base64 Utility",
  description: "Encode and decode text with a small deployable Next.js app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Create a temporary homepage placeholder**

```tsx
export default function HomePage() {
  return <main>Base64 Utility</main>;
}
```

- [ ] **Step 6: Add minimal global styles**

```css
:root {
  color-scheme: light;
  font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f6f2ea;
  color: #1d1b18;
}
```

- [ ] **Step 7: Install dependencies and generate the lockfile**

Run: `bun install`  
Expected: Bun installs dependencies and creates `bun.lock`.

- [ ] **Step 8: Commit the scaffold**

```bash
git init
git add package.json bun.lock tsconfig.json next.config.ts .gitignore app/layout.tsx app/page.tsx app/globals.css
git commit -m "feat: scaffold base64 utility app"
```

### Task 2: Add Base64 helper logic and tests

**Files:**
- Create: `lib/base64.ts`
- Create: `tests/base64.test.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
import { describe, expect, test } from "bun:test";
import { decodeBase64, encodeBase64 } from "../lib/base64";

describe("base64 helpers", () => {
  test("encodes utf-8 text to base64", () => {
    expect(encodeBase64("hello world")).toBe("aGVsbG8gd29ybGQ=");
  });

  test("decodes valid base64 to utf-8 text", () => {
    expect(decodeBase64("aGVsbG8gd29ybGQ=").value).toBe("hello world");
  });

  test("rejects invalid base64 input", () => {
    expect(decodeBase64("%%%").ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `bun test`  
Expected: FAIL with module resolution error because `lib/base64.ts` does not exist yet.

- [ ] **Step 3: Write the minimal helper implementation**

```ts
type DecodeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function encodeBase64(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}

export function decodeBase64(text: string): DecodeResult {
  if (text.length === 0) {
    return { ok: false, error: "Enter Base64 text to decode." };
  }

  const normalized = text.trim();

  if (!/^[A-Za-z0-9+/=]+$/.test(normalized) || normalized.length % 4 !== 0) {
    return { ok: false, error: "Enter valid Base64 text." };
  }

  try {
    const value = Buffer.from(normalized, "base64").toString("utf8");
    const roundTrip = Buffer.from(value, "utf8").toString("base64");

    if (roundTrip.replace(/=+$/, "") !== normalized.replace(/=+$/, "")) {
      return { ok: false, error: "Enter valid Base64 text." };
    }

    return { ok: true, value };
  } catch {
    return { ok: false, error: "Enter valid Base64 text." };
  }
}
```

- [ ] **Step 4: Run the tests to verify success**

Run: `bun test`  
Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit the helper logic**

```bash
git add lib/base64.ts tests/base64.test.ts
git commit -m "feat: add base64 helpers"
```

### Task 3: Build the API routes

**Files:**
- Create: `app/api/encode/route.ts`
- Create: `app/api/decode/route.ts`
- Modify: `lib/base64.ts`

- [ ] **Step 1: Add empty-input coverage for helper logic**

```ts
  test("rejects empty input", () => {
    expect(decodeBase64("").error).toBe("Enter Base64 text to decode.");
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun test tests/base64.test.ts`  
Expected: FAIL because the current test assumes `.error` exists without narrowing on the result type.

- [ ] **Step 3: Update the tests to narrow the decode result**

```ts
  test("rejects invalid base64 input", () => {
    const result = decodeBase64("%%%");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Enter valid Base64 text.");
    }
  });

  test("rejects empty input", () => {
    const result = decodeBase64("");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Enter Base64 text to decode.");
    }
  });
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test tests/base64.test.ts`  
Expected: PASS.

- [ ] **Step 5: Create the encode route**

```ts
import { NextResponse } from "next/server";
import { encodeBase64 } from "@/lib/base64";

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: unknown };

  if (typeof body.text !== "string" || body.text.length === 0) {
    return NextResponse.json(
      { error: "Enter text to encode." },
      { status: 400 },
    );
  }

  return NextResponse.json({ result: encodeBase64(body.text) });
}
```

- [ ] **Step 6: Create the decode route**

```ts
import { NextResponse } from "next/server";
import { decodeBase64 } from "@/lib/base64";

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: unknown };

  if (typeof body.text !== "string") {
    return NextResponse.json(
      { error: "Enter Base64 text to decode." },
      { status: 400 },
    );
  }

  const result = decodeBase64(body.text);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ result: result.value });
}
```

- [ ] **Step 7: Add the `@/` path alias**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 8: Run the app build to verify the routes compile**

Run: `bun run build`  
Expected: PASS with a successful Next.js production build.

- [ ] **Step 9: Commit the API routes**

```bash
git add app/api/encode/route.ts app/api/decode/route.ts tsconfig.json
git commit -m "feat: add base64 api routes"
```

### Task 4: Build the utility UI

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Create: `lib/build-info.ts`

- [ ] **Step 1: Add a build info helper**

```ts
export function getBuildInfo() {
  return {
    sha: process.env.NEXT_PUBLIC_GIT_SHA ?? "local",
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? "dev",
  };
}
```

- [ ] **Step 2: Replace the placeholder page with the utility UI**

```tsx
import { getBuildInfo } from "@/lib/build-info";

export default function HomePage() {
  const build = getBuildInfo();

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Web utility</p>
        <h1>Base64 Utility</h1>
        <p className="lede">
          Encode plain text, decode Base64, and confirm exactly which deploy is
          live.
        </p>
        <dl className="build-strip">
          <div>
            <dt>Commit</dt>
            <dd>{build.sha}</dd>
          </div>
          <div>
            <dt>Built</dt>
            <dd>{build.builtAt}</dd>
          </div>
        </dl>
      </section>
      <section className="workspace">
        <form className="tool-form">
          <label htmlFor="input">Input</label>
          <textarea id="input" name="input" rows={14} />
          <div className="actions">
            <button type="button">Encode</button>
            <button type="button">Decode</button>
            <button type="button">Copy result</button>
            <button type="button">Clear</button>
          </div>
        </form>
        <section className="output-panel">
          <div className="output-header">
            <h2>Output</h2>
            <p>Results appear here.</p>
          </div>
          <pre className="output-box"></pre>
          <p className="status-message">Ready.</p>
        </section>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Convert the page to a client component with working interactions**

```tsx
"use client";

import { useState, useTransition } from "react";

type Mode = "encode" | "decode";

type ApiResponse = {
  result?: string;
  error?: string;
};

export default function HomePage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("Ready.");
  const [isPending, startTransition] = useTransition();

  async function run(mode: Mode) {
    startTransition(async () => {
      setStatus(mode === "encode" ? "Encoding..." : "Decoding...");

      const response = await fetch(`/api/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.result) {
        setOutput("");
        setStatus(payload.error ?? "Request failed.");
        return;
      }

      setOutput(payload.result);
      setStatus(mode === "encode" ? "Encoded." : "Decoded.");
    });
  }

  async function copyResult() {
    if (!output) {
      setStatus("Nothing to copy yet.");
      return;
    }

    await navigator.clipboard.writeText(output);
    setStatus("Copied result.");
  }

  function clearAll() {
    setInput("");
    setOutput("");
    setStatus("Cleared.");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Web utility</p>
        <h1>Base64 Utility</h1>
        <p className="lede">
          Encode plain text, decode Base64, and keep a visible record of the
          currently deployed build.
        </p>
      </section>
      <section className="workspace">
        <section className="panel">
          <label htmlFor="input">Input</label>
          <textarea
            id="input"
            rows={14}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="actions">
            <button type="button" onClick={() => run("encode")} disabled={isPending}>
              Encode
            </button>
            <button type="button" onClick={() => run("decode")} disabled={isPending}>
              Decode
            </button>
            <button type="button" onClick={copyResult}>
              Copy result
            </button>
            <button type="button" onClick={clearAll}>
              Clear
            </button>
          </div>
        </section>
        <section className="panel">
          <div className="output-header">
            <h2>Output</h2>
            <p>{status}</p>
          </div>
          <pre className="output-box">{output}</pre>
        </section>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Add complete page styles**

```css
:root {
  color-scheme: light;
  --bg: #efe6d7;
  --surface: #f9f4ec;
  --surface-strong: #fffaf3;
  --ink: #1f1a14;
  --muted: #6d6153;
  --accent: #ba5a31;
  --accent-strong: #8f3f1c;
  --border: #d7c7b3;
  font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(186, 90, 49, 0.18), transparent 32rem),
    linear-gradient(180deg, #f7efe2 0%, var(--bg) 100%);
  color: var(--ink);
}

.page-shell {
  width: min(1100px, calc(100vw - 2rem));
  margin: 0 auto;
  padding: clamp(2rem, 5vw, 4rem) 0 4rem;
}

.hero {
  margin-bottom: 2rem;
}

.eyebrow {
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent-strong);
  font-size: 0.8rem;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.5rem, 7vw, 5rem);
  line-height: 0.96;
}

.lede {
  max-width: 38rem;
  color: var(--muted);
  font-size: 1.05rem;
}

.workspace {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}

.panel {
  display: grid;
  gap: 0.85rem;
  padding: 1.25rem;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 88%, white);
  box-shadow: 0 1.2rem 3rem rgba(71, 49, 28, 0.08);
}

label,
.output-header h2 {
  font-weight: 600;
}

textarea,
.output-box {
  width: 100%;
  min-height: 22rem;
  padding: 1rem;
  border: 1px solid var(--border);
  background: var(--surface-strong);
  color: var(--ink);
  font: inherit;
}

.output-box {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

button {
  border: 1px solid transparent;
  padding: 0.8rem 1rem;
  font: inherit;
  cursor: pointer;
}

button:first-child,
button:nth-child(2) {
  background: var(--accent);
  color: #fff7f1;
}

button:nth-child(3),
button:nth-child(4) {
  background: transparent;
  border-color: var(--border);
  color: var(--ink);
}

button:disabled {
  opacity: 0.6;
  cursor: wait;
}

@media (max-width: 800px) {
  .workspace {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Add the build metadata strip back into the client page**

```tsx
const build = {
  sha: process.env.NEXT_PUBLIC_GIT_SHA ?? "local",
  builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? "dev",
};
```

```tsx
<dl className="build-strip">
  <div>
    <dt>Commit</dt>
    <dd>{build.sha}</dd>
  </div>
  <div>
    <dt>Built</dt>
    <dd>{build.builtAt}</dd>
  </div>
</dl>
```

```css
.build-strip {
  display: flex;
  gap: 1rem;
  margin: 1.25rem 0 0;
  padding: 0;
}

.build-strip div {
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--border);
  background: rgba(255, 250, 243, 0.75);
}

.build-strip dt {
  color: var(--muted);
  font-size: 0.8rem;
}

.build-strip dd {
  margin: 0.25rem 0 0;
  font-weight: 600;
}
```

- [ ] **Step 6: Run the app build to verify the UI compiles**

Run: `bun run build`  
Expected: PASS with a successful production build.

- [ ] **Step 7: Commit the utility UI**

```bash
git add app/page.tsx app/globals.css lib/build-info.ts
git commit -m "feat: build base64 utility interface"
```

### Task 5: Containerize the app

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `.env.example`

- [ ] **Step 1: Create the Docker ignore file**

```dockerignore
.git
.github
.next
node_modules
README.md
docs
```

- [ ] **Step 2: Create the production Dockerfile**

```Dockerfile
FROM oven/bun:1.2.13 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.2.13 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_GIT_SHA=local
ARG NEXT_PUBLIC_BUILD_TIME=dev
ENV NEXT_PUBLIC_GIT_SHA=$NEXT_PUBLIC_GIT_SHA
ENV NEXT_PUBLIC_BUILD_TIME=$NEXT_PUBLIC_BUILD_TIME
RUN bun run build

FROM oven/bun:1.2.13 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["bun", "run", "server.js"]
```

- [ ] **Step 3: Add the example environment file**

```env
NEXT_PUBLIC_GIT_SHA=local
NEXT_PUBLIC_BUILD_TIME=dev
```

- [ ] **Step 4: Build the Docker image locally**

Run: `docker build -t base64-utility:local --build-arg NEXT_PUBLIC_GIT_SHA=local --build-arg NEXT_PUBLIC_BUILD_TIME=dev .`  
Expected: PASS with a build that exposes port `3000`.

- [ ] **Step 5: Commit the container setup**

```bash
git add Dockerfile .dockerignore .env.example
git commit -m "feat: add container build"
```

### Task 6: Add compose runtime and deployment workflow

**Files:**
- Create: `docker-compose.yml`
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`

- [ ] **Step 1: Create the compose file**

```yaml
services:
  app:
    image: ghcr.io/your-user/base64-utility:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
```

- [ ] **Step 2: Create the deploy workflow**

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.2.13"

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ secrets.GHCR_USERNAME }}
          password: ${{ secrets.GHCR_TOKEN }}

      - name: Build and push image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ secrets.GHCR_USERNAME }}/base64-utility:latest
            ghcr.io/${{ secrets.GHCR_USERNAME }}/base64-utility:${{ github.sha }}
          build-args: |
            NEXT_PUBLIC_GIT_SHA=${{ github.sha }}
            NEXT_PUBLIC_BUILD_TIME=${{ github.event.head_commit.timestamp }}

      - name: Configure SSH key
        run: |
          mkdir -p ~/.ssh
          printf '%s\n' "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -p "${{ secrets.SSH_PORT }}" "${{ secrets.SSH_HOST }}" >> ~/.ssh/known_hosts

      - name: Deploy over SSH
        run: |
          ssh -p "${{ secrets.SSH_PORT }}" "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}" \
            "cd /opt/base64-utility && docker compose pull && docker compose up -d"
```

- [ ] **Step 3: Write the README**

```md
# Base64 Utility

Small Next.js app for encoding and decoding Base64 text, built to validate a Docker-to-GHCR-to-server deployment path.

## Local development

```bash
bun install
bun run dev
```

## Required GitHub secrets

- `GHCR_USERNAME`
- `GHCR_TOKEN`
- `SSH_HOST`
- `SSH_PORT`
- `SSH_USER`
- `SSH_PRIVATE_KEY`

## Server setup

1. Install Docker and Docker Compose.
2. Create `/opt/base64-utility`.
3. Place `docker-compose.yml` in that directory.
4. Run `docker login ghcr.io`.
5. Push to `main` to trigger deploy.
```

- [ ] **Step 4: Validate the workflow syntax and app build**

Run: `bun run build`  
Expected: PASS.

Run: `docker compose config`  
Expected: PASS with normalized compose output.

- [ ] **Step 5: Commit deployment support**

```bash
git add docker-compose.yml .github/workflows/deploy.yml README.md
git commit -m "feat: add automated deployment pipeline"
```

### Task 7: Final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run the full local verification**

Run: `bun test && bun run build && docker compose config`  
Expected: PASS for all commands.

- [ ] **Step 2: Add any missing notes discovered during verification**

```md
## First deploy checklist

1. Create the GitHub repository.
2. Add the required repository secrets.
3. Copy `docker-compose.yml` to `/opt/base64-utility` on the server.
4. Run `docker login ghcr.io` on the server.
5. Push `main`.
```

- [ ] **Step 3: Commit the verification notes**

```bash
git add README.md
git commit -m "docs: add first deploy checklist"
```

## Self-Review

- Spec coverage: the plan covers the Next.js app, Base64 utility behavior, build metadata, Docker packaging, GitHub Actions deployment, and minimal testing.
- Placeholder scan: no `TODO` or deferred implementation markers remain.
- Type consistency: helper signatures, API route payloads, and build metadata names are consistent across tasks.
