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
/*  Judge0 CE — Public instance (free, NO auth required)               */
/*  https://ce.judge0.com — community-hosted, supports all major      */
/*  compiled and interpreted languages                                 */
/* ------------------------------------------------------------------ */

const JUDGE0_LANG_IDS: Record<string, number> = {
  bash: 46, sh: 46,
  c: 50,
  cpp: 54, "c++": 54,
  java: 62,
  ruby: 72,
  rust: 73,
  go: 60, golang: 60,
  swift: 83,
  kotlin: 78,
  scala: 81,
  lua: 82,
  r: 80,
  php: 68,
};

const JUDGE0_PUBLIC_URL = "https://ce.judge0.com";

async function executeViaJudge0Public(
  code: string,
  language: string,
  stdin?: string,
): Promise<{ output: string; error: string | null; exitCode: number } | null> {
  const langId = JUDGE0_LANG_IDS[language];
  if (!langId) return null;

  try {
    const submitRes = await fetch(
      `${JUDGE0_PUBLIC_URL}/submissions?base64_encoded=false&wait=true&fields=stdout,stderr,exit_code,compile_output,status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: langId,
          stdin: stdin || "",
        }),
        signal: AbortSignal.timeout(25000),
      },
    );

    if (!submitRes.ok) return null;

    const data = await submitRes.json();

    const stdout = data.stdout || "";
    const stderr = data.stderr || "";
    const compileOutput = data.compile_output || "";
    const statusId = data.status?.id;

    // Status IDs: 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit, 6 = Compilation Error, etc.
    const isAccepted = statusId === 3 || statusId === 4;
    const isCompError = statusId === 6;
    const hasError = isCompError || !!stderr || (statusId && statusId > 4);

    return {
      output: stdout.trimEnd(),
      error: hasError
        ? (isCompError ? compileOutput.trimEnd() : stderr.trimEnd()) || `Judge0 status: ${data.status?.description || statusId}`
        : null,
      exitCode: isAccepted ? (data.exit_code ?? 0) : 1,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Judge0 CE — RapidAPI (more reliable, needs JUDGE0_API_KEY)         */
/*  Falls back to this if public instance is down                      */
/* ------------------------------------------------------------------ */

const JUDGE0_RAPID_HOST = process.env.JUDGE0_HOST || "https://judge0-ce.p.rapidapi.com";

async function executeViaJudge0RapidAPI(
  code: string,
  language: string,
  stdin?: string,
): Promise<{ output: string; error: string | null; exitCode: number } | null> {
  const apiKey = process.env.JUDGE0_API_KEY;
  if (!apiKey) return null;

  const langId = JUDGE0_LANG_IDS[language];
  if (!langId) return null;

  try {
    const submitRes = await fetch(
      `${JUDGE0_RAPID_HOST}/submissions?base64_encoded=false&wait=true&fields=stdout,stderr,exit_code,compile_output,status,token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": new URL(JUDGE0_RAPID_HOST).host,
        },
        body: JSON.stringify({
          source_code: code,
          language_id: langId,
          stdin: stdin || "",
        }),
        signal: AbortSignal.timeout(25000),
      },
    );

    if (!submitRes.ok) return null;

    const data = await submitRes.json();

    const stdout = data.stdout || "";
    const stderr = data.stderr || "";
    const compileOutput = data.compile_output || "";
    const statusId = data.status?.id;

    const isAccepted = statusId === 3 || statusId === 4;
    const isCompError = statusId === 6;
    const hasError = isCompError || !!stderr || (statusId && statusId > 4);

    return {
      output: stdout.trimEnd(),
      error: hasError
        ? (isCompError ? compileOutput.trimEnd() : stderr.trimEnd()) || `Judge0 status: ${data.status?.description || statusId}`
        : null,
      exitCode: isAccepted ? (data.exit_code ?? 0) : 1,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Local code-runner (development only)                                */
/* ------------------------------------------------------------------ */

async function executeViaLocalRunner(
  code: string,
  language: string,
  stdin?: string,
) {
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
        { status: 400 },
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

    const langDisplay = language.charAt(0).toUpperCase() + language.slice(1);

    // 1. Try local code-runner (development with `bun run dev`)
    const localResult = await executeViaLocalRunner(code, normalizedLang, stdin);
    if (localResult.ok && localResult.data) {
      return NextResponse.json(localResult.data);
    }

    // 2. Try Judge0 CE public instance (free, NO auth — works on live/Vercel out of the box)
    const publicResult = await executeViaJudge0Public(code, normalizedLang, stdin);
    if (publicResult) {
      return NextResponse.json(publicResult);
    }

    // 3. Try Judge0 CE via RapidAPI (more reliable, needs JUDGE0_API_KEY env var)
    const rapidResult = await executeViaJudge0RapidAPI(code, normalizedLang, stdin);
    if (rapidResult) {
      return NextResponse.json(rapidResult);
    }

    // 4. All backends failed
    return NextResponse.json({
      output: "",
      error:
        `${langDisplay} execution failed — all remote code execution services are currently unavailable.\n\n` +
        `JavaScript, TypeScript, and Python always work in the browser — no setup needed.\n\n` +
        `For better reliability, you can add a Judge0 CE API key via RapidAPI (free, 100 runs/day):\n` +
        `1. Go to rapidapi.com → sign up (free)\n` +
        `2. Subscribe to "Judge0 CE" (free tier)\n` +
        `3. Add JUDGE0_API_KEY to your Vercel environment variables\n` +
        `4. Redeploy`,
      exitCode: -1,
    });
  } catch (error) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { output: "", error: "Failed to execute code. Please try again.", exitCode: -1 },
      { status: 200 },
    );
  }
}