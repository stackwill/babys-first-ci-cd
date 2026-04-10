"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  const [mode, setMode] = useState<Mode>("encode");
  const [autoRun, setAutoRun] = useState(false);
  const [isPending, startTransition] = useTransition();
  const previousInput = useRef(input);

  function run(mode: Mode) {
    setMode(mode);

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

  useEffect(() => {
    if (!autoRun) {
      previousInput.current = input;
      return;
    }

    if (input === previousInput.current) {
      return;
    }

    previousInput.current = input;
    run(mode);
  }, [autoRun, input, mode]);

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
      <header>
        <h1>Base64 Encode / Decode</h1>
        <p>
          Plain text in, Base64 out. Base64 in, plain text out. Built as a
          small operational utility with visible deployment metadata.
        </p>
      </header>

      <hr />

      <table className="meta-table" aria-label="Deployment metadata">
        <tbody>
          <tr>
            <th scope="row">Commit</th>
            <td>{build.sha}</td>
          </tr>
          <tr>
            <th scope="row">Built</th>
            <td>{build.builtAt}</td>
          </tr>
          <tr>
            <th scope="row">Mode</th>
            <td>{mode}</td>
          </tr>
          <tr>
            <th scope="row">State</th>
            <td>{status}</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <section className="document-grid">
        <section>
          <h2>Input</h2>
          <p>Enter plain text to encode or Base64 text to decode.</p>
          <textarea
            id="input"
            rows={14}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste plain text or Base64 here."
          />
          <p className="controls">
            <button type="button" onClick={() => run("encode")} disabled={isPending}>
              Encode
            </button>{" "}
            <button type="button" onClick={() => run("decode")} disabled={isPending}>
              Decode
            </button>{" "}
            <button type="button" onClick={copyResult}>
              Copy result
            </button>{" "}
            <button type="button" onClick={clearAll}>
              Clear
            </button>
          </p>
          <p className="toggle-row">
            <label>
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(event) => setAutoRun(event.target.checked)}
              />{" "}
              Auto-run current mode while typing
            </label>
          </p>
        </section>

        <section>
          <h2>Output</h2>
          <p>Output updates after a successful request to the selected action.</p>
          <pre className="output-box">{output || "[no output]"}</pre>
        </section>
      </section>
    </main>
  );
}
