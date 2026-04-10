"use client";

import { useState, useTransition } from "react";
import { getBuildInfo } from "@/lib/build-info";

type Mode = "encode" | "decode";

type ApiResponse = {
  result?: string;
  error?: string;
};

const build = getBuildInfo();

export default function HomePage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("Ready.");
  const [isPending, startTransition] = useTransition();

  function run(mode: Mode) {
    startTransition(async () => {
      setStatus(mode === "encode" ? "Encoding..." : "Decoding...");

      try {
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
      } catch {
        setOutput("");
        setStatus("Request failed.");
      }
    });
  }

  async function copyResult() {
    if (!output) {
      setStatus("Nothing to copy yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setStatus("Copied result.");
    } catch {
      setStatus("Clipboard write failed.");
    }
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
        <section className="panel">
          <label htmlFor="input">Input</label>
          <textarea
            id="input"
            rows={14}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste plain text or Base64 here."
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
