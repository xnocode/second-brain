"use client";

import { useEffect, useCallback, useRef, useState } from "react";

// Languages that can run directly in the browser
const BROWSER_LANGUAGES = new Set(["javascript", "js", "typescript", "ts"]);
const PYODIDE_LANGUAGES = new Set(["python", "py"]);

// All languages that get a Run button
const RUNNABLE_LANGUAGES = new Set([
  "javascript", "js",
  "typescript", "ts",
  "python", "py",
  "bash", "sh",
  "ruby", "rb",
  "java",
  "c",
  "cpp", "c++",
  "rust", "rs",
  "go", "golang",
  "swift", "kt", "kotlin",
  "scala",
  "lua",
  "r",
  "php",
]);

// Languages that need the server API (local runner + remote fallbacks)
const SERVER_LANGUAGES = new Set([
  "bash", "sh", "ruby", "rb", "java", "c", "cpp", "c++",
  "rust", "rs", "go", "golang", "swift", "kt", "kotlin",
  "scala", "lua", "r", "php",
]);

// Languages that support stdin input
const STDIN_LANGUAGES = new Set([
  "python", "py",
  "bash", "sh", "ruby", "rb", "java", "c", "cpp", "c++",
  "rust", "rs", "go", "golang", "swift", "kt", "kotlin",
  "scala", "lua", "r", "php",
]);

// Display name for the language label
const LANG_DISPLAY: Record<string, string> = {
  js: "JavaScript",
  ts: "TypeScript",
  py: "Python",
  rb: "Ruby",
  rs: "Rust",
  sh: "Bash",
  cpp: "C++",
  c: "C",
  kt: "Kotlin",
  golang: "Go",
};

// Vivid color per language for the label badge
const LANG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  javascript: { bg: "rgba(247,223,30,0.18)", text: "#f7df1e", border: "rgba(247,223,30,0.4)" },
  js:         { bg: "rgba(247,223,30,0.18)", text: "#f7df1e", border: "rgba(247,223,30,0.4)" },
  typescript: { bg: "rgba(49,120,198,0.18)",  text: "#3b82f6", border: "rgba(49,120,198,0.4)" },
  ts:         { bg: "rgba(49,120,198,0.18)",  text: "#3b82f6", border: "rgba(49,120,198,0.4)" },
  python:     { bg: "rgba(55,118,171,0.18)",  text: "#60a5fa", border: "rgba(55,118,171,0.4)" },
  py:         { bg: "rgba(55,118,171,0.18)",  text: "#60a5fa", border: "rgba(55,118,171,0.4)" },
  java:       { bg: "rgba(238,76,44,0.18)",   text: "#f97316", border: "rgba(238,76,44,0.4)" },
  c:          { bg: "rgba(120,144,180,0.18)", text: "#94a3b8", border: "rgba(120,144,180,0.4)" },
  cpp:        { bg: "rgba(0,120,215,0.18)",   text: "#38bdf8", border: "rgba(0,120,215,0.4)" },
  "c++":      { bg: "rgba(0,120,215,0.18)",   text: "#38bdf8", border: "rgba(0,120,215,0.4)" },
  rust:       { bg: "rgba(222,165,132,0.18)", text: "#fb923c", border: "rgba(222,165,132,0.4)" },
  rs:         { bg: "rgba(222,165,132,0.18)", text: "#fb923c", border: "rgba(222,165,132,0.4)" },
  go:         { bg: "rgba(0,173,216,0.18)",   text: "#22d3ee", border: "rgba(0,173,216,0.4)" },
  golang:     { bg: "rgba(0,173,216,0.18)",   text: "#22d3ee", border: "rgba(0,173,216,0.4)" },
  ruby:       { bg: "rgba(204,52,45,0.18)",   text: "#ef4444", border: "rgba(204,52,45,0.4)" },
  rb:         { bg: "rgba(204,52,45,0.18)",   text: "#ef4444", border: "rgba(204,52,45,0.4)" },
  bash:       { bg: "rgba(59,130,246,0.18)",  text: "#60a5fa", border: "rgba(59,130,246,0.4)" },
  sh:         { bg: "rgba(59,130,246,0.18)",  text: "#60a5fa", border: "rgba(59,130,246,0.4)" },
  swift:      { bg: "rgba(240,81,56,0.18)",   text: "#f05138", border: "rgba(240,81,56,0.4)" },
  kotlin:     { bg: "rgba(127,82,242,0.18)",  text: "#a78bfa", border: "rgba(127,82,242,0.4)" },
  kt:         { bg: "rgba(127,82,242,0.18)",  text: "#a78bfa", border: "rgba(127,82,242,0.4)" },
  scala:      { bg: "rgba(220,50,47,0.18)",   text: "#f87171", border: "rgba(220,50,47,0.4)" },
  lua:        { bg: "rgba(0,0,200,0.18)",     text: "#818cf8", border: "rgba(0,0,200,0.4)" },
  r:          { bg: "rgba(39,64,199,0.18)",   text: "#6366f1", border: "rgba(39,64,199,0.4)" },
  php:        { bg: "rgba(119,123,180,0.18)", text: "#a5b4fc", border: "rgba(119,123,180,0.4)" },
};

const DEFAULT_COLOR = { bg: "rgba(161,161,170,0.12)", text: "#a1a1aa", border: "rgba(161,161,170,0.3)" };

/* ------------------------------------------------------------------ */
/*  Pyodide (Python in Browser with input() support)                   */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const globalThis: any;

interface PyodideInstance {
  runPython(code: string): unknown;
  runPythonAsync(code: string): Promise<unknown>;
}

let pyodideInstance: PyodideInstance | null = null;
let pyodideLoading: Promise<PyodideInstance> | null = null;

async function loadPyodide(): Promise<PyodideInstance> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) return pyodideLoading;

  pyodideLoading = (async () => {
    if (!globalThis.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        if (document.getElementById("pyodide-script")) {
          const check = setInterval(() => {
            if (globalThis.loadPyodide) { clearInterval(check); resolve(); }
          }, 100);
          setTimeout(() => { clearInterval(check); reject(new Error("Pyodide load timeout")); }, 60000);
          return;
        }
        const script = document.createElement("script");
        script.id = "pyodide-script";
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide script"));
        document.head.appendChild(script);
      });
    }
    const pyodide = await globalThis.loadPyodide() as PyodideInstance;
    pyodideInstance = pyodide;
    return pyodide;
  })();

  return pyodideLoading;
}

async function executePythonInBrowser(
  code: string,
  stdin?: string,
): Promise<{ output: string; error: string | null; exitCode: number }> {
  const pyodide = await loadPyodide();

  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  const stdinLines = (stdin || "").split("\n");
  let stdinIndex = 0;

  // Intercept console.log/warn/error during Python execution
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  console.log = (...args: unknown[]) => { stdoutLines.push(args.map(String).join(" ")); };
  console.warn = (...args: unknown[]) => { stderrLines.push(args.map(String).join(" ")); };
  console.error = (...args: unknown[]) => { stderrLines.push(args.map(String).join(" ")); };

  try {
    // Override builtins.input to read from stdin lines
    // This allows Python's input() to work with the stdin textarea
    pyodide.runPython(`
import builtins
import sys
from io import StringIO

class _StdinReader(StringIO):
    def readline(self, size=-1):
        line = super().readline(size)
        sys.__stdout__.write(line)  # echo input
        return line

_original_input = builtins.input
def _patched_input(prompt=""):
    if prompt:
        sys.__stdout__.write(str(prompt))
    return _stdin_reader.readline().rstrip("\\n")

builtins.input = _patched_input
`);

    // Set up stdin from provided input
    const stdinContent = stdin || "";
    pyodide.runPython(`
_stdin_reader = _StdinReader(${JSON.stringify(stdinContent)})
sys.stdin = _stdin_reader
`);

    // Run user code
    pyodide.runPython(code);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const cleaned = errMsg
      .replace(/PythonError: Traceback \(most recent call last\):\n/, "")
      .replace(/^\s+File "<exec>", line \d+, in <module>\n/gm, "")
      .replace(/^\s+File "<exec>", line \d+\n/gm, "")
      .trim();

    return {
      output: stdoutLines.join("\n").trimEnd(),
      error: cleaned || errMsg,
      exitCode: 1,
    };
  } finally {
    // Restore everything
    try {
      pyodide.runPython(`
builtins.input = _original_input
sys.stdin = sys.__stdin__
`);
    } catch { /* ignore cleanup errors */ }
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  }

  return {
    output: stdoutLines.join("\n").trimEnd(),
    error: stderrLines.join("\n").trimEnd() || null,
    exitCode: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  In-Browser JS/TS Execution                                         */
/* ------------------------------------------------------------------ */

async function executeJSInBrowser(code: string): Promise<{ output: string; error: string | null; exitCode: number }> {
  const logs: string[] = [];
  let hasError = false;
  let errorMsg = "";

  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalTable = console.table;
  const originalClear = console.clear;

  const stringifyArg = (arg: unknown): string => {
    if (arg === undefined) return "undefined";
    if (arg === null) return "null";
    if (typeof arg === "string") return arg;
    if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
    if (typeof arg === "symbol") return arg.toString();
    if (typeof arg === "bigint") return arg.toString() + "n";
    if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ""}`;
    try {
      const seen = new WeakSet();
      return JSON.stringify(arg, (_key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[Circular]";
          seen.add(value);
        }
        return value;
      }, 2);
    } catch {
      return String(arg);
    }
  };

  const formatArgs = (args: unknown[]): string => args.map(stringifyArg).join(" ");

  console.log = (...args: unknown[]) => { logs.push(formatArgs(args)); };
  console.error = (...args: unknown[]) => { logs.push(formatArgs(args)); };
  console.warn = (...args: unknown[]) => { logs.push(formatArgs(args)); };
  console.info = (...args: unknown[]) => { logs.push(formatArgs(args)); };
  console.table = (data: unknown) => {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
      const keys = Object.keys(data[0]);
      const header = "| " + keys.join(" | ") + " |";
      const sep = "| " + keys.map(() => "---").join(" | ") + " |";
      const rows = data.map(row => "| " + keys.map(k => String((row as Record<string, unknown>)[k] ?? "")).join(" | ") + " |");
      logs.push(header, sep, ...rows);
    } else if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      const entries = Object.entries(data as Record<string, unknown>);
      const maxKeyLen = Math.max(...entries.map(([k]) => k.length));
      entries.forEach(([k, v]) => {
        logs.push(`${k.padEnd(maxKeyLen)} : ${stringifyArg(v)}`);
      });
    } else {
      logs.push(stringifyArg(data));
    }
  };
  console.clear = () => { logs.length = 0; };

  try {
    const wrappedCode = `(async () => {\n${code}\n})()`;
    const fn = new Function(wrappedCode);
    const result = fn();
    if (result instanceof Promise) await result;
  } catch (err: unknown) {
    hasError = true;
    errorMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    console.info = originalInfo;
    console.table = originalTable;
    console.clear = originalClear;
  }

  return {
    output: logs.join("\n"),
    error: hasError ? errorMsg : null,
    exitCode: hasError ? 1 : 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CodeBlockEnhancer() {
  const runningRef = useRef<string | null>(null);
  const [pyodideStatus, setPyodideStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    loadPyodide()
      .then(() => setPyodideStatus("ready"))
      .catch(() => setPyodideStatus("error"));
  }, []);

  const showOutput = useCallback((blockId: string, output: string, error?: string | null, exitCode?: number) => {
    const outputEl = document.getElementById(`output-${blockId}`);
    if (outputEl) {
      outputEl.style.display = "flex";
      if (error && (exitCode === undefined || exitCode !== 0)) {
        outputEl.innerHTML = `<div class="output-error">${esc(error)}</div>${output ? `<div class="output-stdout">${esc(output)}</div>` : ""}`;
      } else {
        outputEl.innerHTML = `<div class="output-stdout">${esc(output || "(no output)")}</div>`;
      }
    }
  }, []);

  const runCode = useCallback(async (code: string, language: string, blockId: string, stdin?: string) => {
    if (runningRef.current) return;
    runningRef.current = blockId;

    const outputEl = document.getElementById(`output-${blockId}`);
    const langLower = language.toLowerCase();
    const langLabel = LANG_DISPLAY[langLower] || language;

    const isBrowserLang = BROWSER_LANGUAGES.has(langLower);
    const isPyodideLang = PYODIDE_LANGUAGES.has(langLower);
    const isServerLang = SERVER_LANGUAGES.has(langLower);

    let envLabel = "";
    if (isBrowserLang) envLabel = " (Browser)";
    else if (isPyodideLang) envLabel = " (Pyodide)";
    else envLabel = "";

    if (outputEl) {
      outputEl.style.display = "flex";
      outputEl.innerHTML = `<span class="code-running-indicator"><span class="inline-block animate-spin mr-1.5">⟳</span> Running ${langLabel}${envLabel}…</span>`;
    }

    try {
      if (isBrowserLang) {
        const result = await executeJSInBrowser(code);
        showOutput(blockId, result.output, result.error, result.exitCode);
      } else if (isPyodideLang) {
        if (pyodideStatus === "error") {
          showOutput(blockId, "", "Failed to load Python runtime (Pyodide). Check your internet connection and try again.", 1);
          return;
        }
        if (pyodideStatus === "loading") {
          if (outputEl) {
            outputEl.innerHTML = `<span class="code-running-indicator"><span class="inline-block animate-spin mr-1.5">⟳</span> Loading Python runtime (Pyodide)… This may take a moment on first run.</span>`;
          }
          try { await loadPyodide(); } catch {
            showOutput(blockId, "", "Failed to load Python runtime. Please refresh the page and try again.", 1);
            return;
          }
        }
        const result = await executePythonInBrowser(code, stdin);
        showOutput(blockId, result.output, result.error, result.exitCode);
      } else if (isServerLang) {
        // Server languages: local runner + remote fallbacks
        const payload: { code: string; language: string; stdin?: string } = { code, language };
        if (stdin && stdin.trim()) payload.stdin = stdin;

        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        showOutput(blockId, data.output, data.error, data.exitCode);
      }
    } catch {
      if (outputEl) {
        outputEl.innerHTML = `<span class="output-error">Failed to execute code. Please try again.</span>`;
      }
    } finally {
      runningRef.current = null;
    }
  }, [showOutput, pyodideStatus]);

  const attachEnhancements = useCallback(() => {
    const container = document.getElementById("post-content");
    if (!container) return;

    container.querySelectorAll("pre").forEach((pre, idx) => {
      if (pre.getAttribute("data-code-enhanced")) return;
      pre.setAttribute("data-code-enhanced", "true");

      const figure = pre.closest("[data-rehype-pretty-code-figure]") || pre.parentElement;
      const codeEl = pre.querySelector("code");
      let lang = figure?.getAttribute("data-language") || pre.getAttribute("data-language") || "";
      if (!lang && codeEl) {
        const m = codeEl.className.match(/language-(\w[\w+]*)/);
        if (m) lang = m[1].toLowerCase();
      }

      const isRunnable = lang && RUNNABLE_LANGUAGES.has(lang.toLowerCase());
      const blockId = `cb-${idx}-${Date.now()}`;
      const langLower = lang.toLowerCase();
      const colors = LANG_COLORS[langLower] || (lang ? DEFAULT_COLOR : null);

      if (!figure) return;

      // Header bar
      const header = document.createElement("div");
      header.className = "code-block-header";

      // Language badge
      if (lang && colors) {
        const label = document.createElement("span");
        label.className = "code-lang-badge";
        label.style.background = colors.bg;
        label.style.color = colors.text;
        label.style.borderColor = colors.border;
        label.textContent = LANG_DISPLAY[langLower] || lang;
        header.appendChild(label);
      }

      // Environment tag
      if (lang && BROWSER_LANGUAGES.has(langLower)) {
        const tag = document.createElement("span");
        tag.className = "code-lang-badge";
        tag.style.background = "rgba(34,197,94,0.15)";
        tag.style.color = "#4ade80";
        tag.style.borderColor = "rgba(34,197,94,0.35)";
        tag.style.fontSize = "10px";
        tag.style.padding = "1px 6px";
        tag.textContent = "⚡ Browser";
        header.appendChild(tag);
      }
      if (lang && PYODIDE_LANGUAGES.has(langLower)) {
        const tag = document.createElement("span");
        tag.className = "code-lang-badge";
        tag.style.background = "rgba(55,118,171,0.15)";
        tag.style.color = "#60a5fa";
        tag.style.borderColor = "rgba(55,118,171,0.35)";
        tag.style.fontSize = "10px";
        tag.style.padding = "1px 6px";
        tag.textContent = "🐍 Pyodide";
        header.appendChild(tag);
      }

      // Spacer
      const spacer = document.createElement("div");
      spacer.style.flex = "1";
      header.appendChild(spacer);

      // Copy button
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "code-action-btn";
      copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy</span>`;
      copyBtn.addEventListener("click", async () => {
        const c = codeEl?.textContent || pre.textContent || "";
        try { await navigator.clipboard.writeText(c); } catch { /* fallback */ }
        const sp = copyBtn.querySelector("span");
        if (sp) { sp.textContent = "Copied!"; setTimeout(() => { if (sp) sp.textContent = "Copy"; }, 2000); }
      });
      header.appendChild(copyBtn);

      // Run button
      if (isRunnable) {
        const runBtn = document.createElement("button");
        runBtn.type = "button";
        runBtn.className = "code-action-btn code-action-run";
        runBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Run</span>`;
        runBtn.addEventListener("click", () => {
          const c = codeEl?.textContent || pre.textContent || "";
          const stdinEl = document.getElementById(`stdin-${blockId}`) as HTMLTextAreaElement | null;
          const s = stdinEl?.value || "";
          runCode(c, lang, blockId, s);
        });
        header.appendChild(runBtn);
      }

      figure.insertBefore(header, pre);
      figure.id = blockId;
      figure.style.position = "relative";

      const oldLabel = pre.querySelector(".code-lang-label");
      if (oldLabel) oldLabel.remove();

      // Stdin textarea for all languages that support it
      if (isRunnable && STDIN_LANGUAGES.has(langLower)) {
        const stdinWrapper = document.createElement("div");
        stdinWrapper.className = "code-stdin-wrapper";

        const stdinLabel = document.createElement("label");
        stdinLabel.className = "code-stdin-label";
        stdinLabel.setAttribute("for", `stdin-${blockId}`);
        stdinLabel.textContent = "Input (stdin)";
        stdinLabel.addEventListener("click", () => {
          const textarea = stdinWrapper.querySelector("textarea");
          if (textarea) textarea.focus();
        });

        const stdinTextarea = document.createElement("textarea");
        stdinTextarea.id = `stdin-${blockId}`;
        stdinTextarea.className = "code-stdin-input";
        stdinTextarea.placeholder = "Enter input here, press Run to execute...";
        stdinTextarea.rows = 2;
        stdinTextarea.spellcheck = false;

        stdinWrapper.appendChild(stdinLabel);
        stdinWrapper.appendChild(stdinTextarea);
        figure.appendChild(stdinWrapper);
      }

      // Output panel
      if (isRunnable) {
        const output = document.createElement("div");
        output.id = `output-${blockId}`;
        output.className = "code-output";
        output.style.display = "none";
        figure.appendChild(output);
      }
    });
  }, [runCode]);

  useEffect(() => {
    const timer = setTimeout(attachEnhancements, 200);
    const container = document.getElementById("post-content");
    if (!container) return;
    const obs = new MutationObserver(() => attachEnhancements());
    obs.observe(container, { childList: true, subtree: true });
    return () => { clearTimeout(timer); obs.disconnect(); };
  }, [attachEnhancements]);

  // Wiki link clicks
  useEffect(() => {
    const handler = (e: Event) => {
      const wl = (e.target as HTMLElement).closest?.("[data-wiki-link]");
      if (wl) { e.preventDefault(); window.dispatchEvent(new CustomEvent("navigate-post", { detail: { slug: wl.getAttribute("data-wiki-link") } })); }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return null;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}