import { NextRequest, NextResponse } from "next/server";

const CODE_RUNNER_URL = process.env.CODE_RUNNER_URL || "http://127.0.0.1:3005/execute";

// Languages that run directly in the browser — won't reach this API
const BROWSER_LANGUAGES = new Set(["javascript", "js", "typescript", "ts", "python", "py"]);

const SUPPORTED_LANGUAGES = new Set([
  "bash", "sh", "ruby", "rb", "java", "c", "cpp", "c++",
  "rust", "rs", "go", "golang", "swift", "kt", "kotlin",
  "scala", "lua", "r", "php",
]);

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

/* ------------------------------------------------------------------ */
/*  Remote Execution APIs (fallbacks for live/production)              */
/* ------------------------------------------------------------------ */

// Multiple Piston-compatible API endpoints to try
const PISTON_ENDPOINTS = [
  "https://emkc.org/api/v2/piston/execute",
  "https://piston.code-forge.org/api/v2/execute",
];

// Default runtime versions for Piston-compatible APIs
const PISTON_DEFAULTS: Record<string, { language: string; version: string }> = {
  python:  { language: "python",  version: "3.10.0" },
  bash:    { language: "bash",    version: "5.1.0" },
  ruby:    { language: "ruby",    version: "3.2.0" },
  java:    { language: "java",    version: "15.0.2" },
  c:       { language: "c",       version: "10.2.0" },
  cpp:     { language: "c++",     version: "10.2.0" },
  rust:    { language: "rust",    version: "1.68.2" },
  go:      { language: "go",      version: "1.19.0" },
  php:     { language: "php",     version: "8.2.3" },
  kotlin:  { language: "kotlin",  version: "1.8.0" },
  swift:   { language: "swift",   version: "5.5.3" },
  lua:     { language: "lua",     version: "5.4.4" },
  r:       { language: "r",       version: "4.2.0" },
  scala:   { language: "scala",   version: "3.2.2" },
};

// Glot.io API — free, no auth, supports many languages
const GLOT_LANG_MAP: Record<string, { language: string; version: string }> = {
  python: { language: "python", version: "3.10.0" },
  ruby:   { language: "ruby",   version: "3.2.0" },
  java:   { language: "java",   version: "15.0.2" },
  c:      { language: "c",      version: "10.2.0" },
  cpp:    { language: "c++",    version: "10.2.0" },
  rust:   { language: "rust",   version: "1.68.2" },
  go:     { language: "go",     version: "1.19.0" },
  php:    { language: "php",    version: "8.2.3" },
  lua:    { language: "lua",    version: "5.4.4" },
  r:      { language: "r",      version: "4.2.0" },
  scala:  { language: "scala",  version: "3.2.2" },
  bash:   { language: "bash",   version: "5.1.0" },
  kotlin: { language: "kotlin", version: "1.8.0" },
  swift:  { language: "swift",  version: "5.5.3" },
};

async function executeViaLocalRunner(code: string, language: string, stdin?: string) {
  try {
    const res = await fetch(CODE_RUNNER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, stdin: stdin || undefined }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return { ok: true, data };
  } catch {
    return { ok: false, data: null };
  }
}

async function executeViaPiston(code: string, language: string, stdin?: string) {
  const runtime = PISTON_DEFAULTS[language];
  if (!runtime) return null;

  const body: Record<string, unknown> = {
    language: runtime.language,
    version: runtime.version,
    files: [{ content: code }],
  };
  if (stdin && stdin.trim()) body.stdin = stdin;

  // Try each Piston endpoint
  for (const url of PISTON_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });

      if (res.status === 401 || res.status === 403) continue; // Auth required, try next

      if (!res.ok) continue;

      const data = await res.json();
      return {
        output: data.run?.stdout || "",
        error: data.run?.stderr || null,
        exitCode: data.run?.code ?? (data.run?.signal ? -1 : 0),
      };
    } catch {
      continue; // Network error, try next
    }
  }

  return null;
}

async function executeViaGlot(code: string, language: string, stdin?: string) {
  const runtime = GLOT_LANG_MAP[language];
  if (!runtime) return null;

  try {
    const res = await fetch(
      `https://api.glot.io/languages/${runtime.language}/${runtime.version}/run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${process.env.GLOT_API_KEY || ""}`,
        },
        body: JSON.stringify({
          files: [{ name: "main", content: code }],
          stdin: stdin || "",
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return {
      output: data.stdout || "",
      error: data.stderr || data.error || null,
      exitCode: data.code || 0,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main Handler                                                       */
/* ------------------------------------------------------------------ */

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

    if (BROWSER_LANGUAGES.has(normalizedLang)) {
      return NextResponse.json({
        output: "",
        error: `${normalizedLang === "python" ? "Python" : "JavaScript/TypeScript"} runs directly in your browser. No server execution needed.`,
        exitCode: 0,
      });
    }

    if (!SUPPORTED_LANGUAGES.has(normalizedLang)) {
      return NextResponse.json({
        error: `Unsupported language: '${language}'. Supported: Bash, Ruby, Java, C, C++, Rust, Go, PHP, Kotlin, Swift, Lua, R, Scala`,
        output: "",
        exitCode: -1,
      });
    }

    if (code.trim().length === 0) {
      return NextResponse.json({ error: "Code cannot be empty", output: "", exitCode: -1 });
    }

    // Strategy: Local runner → Piston API → Glot API → clear error message

    // 1. Try local code-runner (development)
    const localResult = await executeViaLocalRunner(code, normalizedLang, stdin);
    if (localResult.ok && localResult.data) {
      return NextResponse.json(localResult.data);
    }

    // 2. Try Piston-compatible APIs (free, no auth)
    const pistonResult = await executeViaPiston(code, normalizedLang, stdin);
    if (pistonResult) {
      return NextResponse.json(pistonResult);
    }

    // 3. Try Glot.io API
    const glotResult = await executeViaGlot(code, normalizedLang, stdin);
    if (glotResult) {
      return NextResponse.json(glotResult);
    }

    // 4. All failed — helpful error message
    const langDisplay = language.charAt(0).toUpperCase() + language.slice(1);
    return NextResponse.json({
      output: "",
      error: `${langDisplay} could not be executed right now. The remote code execution services may be temporarily unavailable.\n\nTip: JavaScript, TypeScript, and Python run directly in your browser and always work. For ${langDisplay}, try again in a moment or run locally with \`bun run dev\`.`,
      exitCode: -1,
    });

  } catch (error) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { output: "", error: "Failed to execute code. Please try again.", exitCode: -1 },
      { status: 200 }
    );
  }
}