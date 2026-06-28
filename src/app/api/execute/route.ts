import { NextRequest, NextResponse } from "next/server";

const CODE_RUNNER_URL = process.env.CODE_RUNNER_URL || "http://127.0.0.1:3005/execute";

// Piston API — free public code execution service (works in live/production)
const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

// Default runtime versions for Piston (widely available)
const PISTON_DEFAULTS: Record<string, { language: string; version: string }> = {
  python:    { language: "python",       version: "3.10.0" },
  bash:      { language: "bash",         version: "5.1.0" },
  ruby:      { language: "ruby",         version: "3.2.0" },
  java:      { language: "java",         version: "15.0.2" },
  c:         { language: "c",            version: "10.2.0" },
  cpp:       { language: "c++",          version: "10.2.0" },
  rust:      { language: "rust",         version: "1.68.2" },
  go:        { language: "go",           version: "1.19.0" },
  php:       { language: "php",          version: "8.2.3" },
  kotlin:    { language: "kotlin",       version: "1.8.0" },
  swift:     { language: "swift",        version: "5.5.3" },
  lua:       { language: "lua",          version: "5.4.4" },
  r:         { language: "r",            version: "4.2.0" },
  scala:     { language: "scala",        version: "3.2.2" },
};

// Languages that run directly in the browser (JS/TS) — won't reach this API
const BROWSER_LANGUAGES = new Set(["javascript", "js", "typescript", "ts"]);

// All languages with server-side run button support
const SUPPORTED_LANGUAGES = new Set([
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

// Map aliases to canonical names
function normalizeLang(lang: string): string {
  const l = lang.toLowerCase().trim();
  switch (l) {
    case "py": return "python";
    case "sh": return "bash";
    case "rb": return "ruby";
    case "c++": case "cpp": return "cpp";
    case "rs": return "rust";
    case "golang": return "go";
    case "kt": return "kotlin";
    default: return l;
  }
}

// Cache Piston runtime versions to avoid repeated lookups
let pistonRuntimesCache: { language: string; version: string; aliases: string[] }[] | null = null;
let pistonRuntimesPromise: Promise<typeof pistonRuntimesCache> | null = null;

async function getPistonRuntimes() {
  if (pistonRuntimesCache) return pistonRuntimesCache;
  if (pistonRuntimesPromise) return pistonRuntimesPromise;

  pistonRuntimesPromise = (async () => {
    try {
      const res = await fetch("https://emkc.org/api/v2/piston/runtimes", {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      pistonRuntimesCache = data;
      return data;
    } catch {
      return null;
    }
  })();

  return pistonRuntimesPromise;
}

async function findPistonRuntime(language: string): Promise<{ language: string; version: string } | null> {
  // Check hardcoded defaults first
  const default_ = PISTON_DEFAULTS[language];
  if (default_) return default_;

  // Try to look up from Piston API
  const runtimes = await getPistonRuntimes();
  if (!runtimes) return null;

  const match = runtimes.find(
    (r) => r.language === language && (r.aliases || []).includes(language)
  ) || runtimes.find(
    (r) => r.language === language
  );

  if (match) {
    return { language: match.language, version: match.version };
  }

  return null;
}

async function executeViaPiston(code: string, language: string, stdin?: string) {
  const runtime = await findPistonRuntime(language);
  if (!runtime) {
    return {
      output: "",
      error: `Language '${language}' is not available on the remote execution service.`,
      exitCode: -1,
    };
  }

  const body: Record<string, unknown> = {
    language: runtime.language,
    version: runtime.version,
    files: [{ content: code }],
  };

  if (stdin && stdin.trim()) {
    body.stdin = stdin;
  }

  try {
    const res = await fetch(PISTON_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000), // 15s timeout for remote execution
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        output: "",
        error: `Remote execution service returned ${res.status}: ${text.slice(0, 200)}`,
        exitCode: -1,
      };
    }

    const data = await res.json();

    return {
      output: data.run?.stdout || "",
      error: data.run?.stderr || null,
      exitCode: data.run?.code ?? (data.run?.signal ? -1 : 0),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      output: "",
      error: `Remote execution service unavailable: ${msg}`,
      exitCode: -1,
    };
  }
}

async function executeViaLocalRunner(code: string, language: string, stdin?: string) {
  try {
    const res = await fetch(CODE_RUNNER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, stdin: stdin || undefined }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();
    return data;
  } catch {
    return null; // Local runner not available
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language, stdin } = body;

    if (typeof code !== "string" || typeof language !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'code' or 'language' field", output: "", exitCode: -1 },
        { status: 400 }
      );
    }

    const normalizedLang = normalizeLang(language);

    // JS/TS should be handled client-side in the browser
    if (BROWSER_LANGUAGES.has(normalizedLang)) {
      return NextResponse.json({
        output: "",
        error: "JavaScript/TypeScript runs directly in your browser. No server execution needed.",
        exitCode: 0,
      });
    }

    if (!SUPPORTED_LANGUAGES.has(normalizedLang)) {
      return NextResponse.json({
        error: `Unsupported language: '${language}'. Supported server-side: Python, Ruby, Bash, Java, C, C++, Rust, Go, PHP, Kotlin, Swift, Lua, R, Scala`,
        output: "",
        exitCode: -1,
      });
    }

    if (code.trim().length === 0) {
      return NextResponse.json({ error: "Code cannot be empty", output: "", exitCode: -1 });
    }

    // Strategy: Try local code-runner first, fall back to Piston API
    // 1. Try local code-runner (available in development)
    const localResult = await executeViaLocalRunner(code, normalizedLang, stdin);

    if (localResult && localResult.exitCode !== undefined) {
      // Local runner responded successfully
      return NextResponse.json(localResult);
    }

    // 2. Fall back to Piston API (works in live/production)
    const pistonResult = await executeViaPiston(code, normalizedLang, stdin);
    return NextResponse.json(pistonResult);

  } catch (error) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { output: "", error: "Failed to execute code. Please try again.", exitCode: -1 },
      { status: 200 }
    );
  }
}