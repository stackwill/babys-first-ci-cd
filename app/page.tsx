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
      <header className="masthead">
        <p className="eyebrow">Internal Utility Index</p>
        <h1>Base64 Encode / Decode</h1>
        <p className="lede">
          Plain text in, Base64 out. Base64 in, plain text out. Built as a
          small operational utility with visible deployment metadata.
        </p>
      </header>

      <section className="status-table" aria-label="Deployment metadata">
        <div className="status-row">
          <span className="status-label">Commit</span>
          <span className="status-value">{build.sha}</span>
        </div>
        <div className="status-row">
          <span className="status-label">Built</span>
          <span className="status-value">{build.builtAt}</span>
        </div>
        <div className="status-row">
          <span className="status-label">State</span>
          <span className="status-value">{status}</span>
        </div>
      </section>

      <section className="workspace">
        <section className="panel">
          <h2>Source Text</h2>
          <p className="panel-note">
            Enter plain text to encode or Base64 text to decode.
          </p>
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
          <h2>Result</h2>
          <p className="panel-note">
            Output updates after a successful request to the selected action.
          </p>
          <label htmlFor="output">Output</label>
          <pre className="output-box">{output}</pre>
        </section>
      </section>
    </main>
  );
}
