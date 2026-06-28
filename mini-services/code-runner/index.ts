import { spawn, execSync } from "child_process";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const PORT = 3005;
const MAX_OUTPUT_SIZE = 10 * 1024; // 10KB
const EXECUTION_TIMEOUT = 8000; // 8 seconds for compiled languages
const INTERPRETER_TIMEOUT = 5000; // 5 seconds for interpreted languages

type Language =
  | "javascript" | "typescript" | "python" | "ruby" | "bash"
  | "java" | "c" | "cpp" | "rust" | "go";

interface ExecuteRequest {
  code: string;
  language: string;
  stdin?: string;
}

interface ExecuteResponse {
  output: string;
  error: string | null;
  exitCode: number;
}

const SUPPORTED_LANGUAGES: Language[] = [
  "javascript", "typescript", "python", "ruby", "bash",
  "java", "c", "cpp", "rust", "go",
];

// Detect tool paths (works in both local sandbox and Docker deployment)
function findBin(name: string, ...fallbacks: string[]): string {
  // Check common PATH locations
  const pathDirs = (process.env.PATH || "").split(":");
  for (const dir of pathDirs) {
    const candidate = `${dir}/${name}`;
    try { if (require("fs").existsSync(candidate)) return candidate; } catch {}
  }
  // Return first fallback (caller handles if it doesn't exist)
  return fallbacks[0] || name;
}

const JAVAC = findBin("javac", join(process.env.HOME!, "jdk-21.0.11+10", "bin", "javac"));
const JAVA = findBin("java", join(process.env.HOME!, "jdk-21.0.11+10", "bin", "java"));
const RUSTC = findBin("rustc", join(process.env.HOME!, ".cargo", "bin", "rustc"));
const GO_BIN = findBin("go", join(process.env.HOME!, "go", "bin", "go"));
const RUBY_BIN = findBin("ruby", join(process.env.HOME!, ".local", "bin", "ruby"));

function truncateOutput(output: string): string {
  const buffer = Buffer.from(output, "utf-8");
  if (buffer.length <= MAX_OUTPUT_SIZE) {
    return output;
  }
  let truncated = buffer.subarray(0, MAX_OUTPUT_SIZE).toString("utf-8");
  truncated = truncated.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]*$/, "");
  return truncated + "\n... [output truncated: exceeded 10KB limit]";
}

function runCommand(command: string, args: string[], timeout: number, stdin?: string): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeout);

    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/.cargo/bin:${process.env.HOME}/.local/bin:${process.env.HOME}/go/bin:${process.env.PATH}`,
      },
    });

    // Write stdin if provided
    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();

    child.stdout.on("data", (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });

    child.on("close", (code: number | null) => {
      clearTimeout(timeoutId);
      resolve({
        stdout: truncateOutput(stdout),
        stderr: truncateOutput(stderr),
        exitCode: timedOut ? -1 : (code ?? 1),
        timedOut,
      });
    });

    child.on("error", (err: Error) => {
      clearTimeout(timeoutId);
      resolve({ stdout: "", stderr: `Failed to start: ${err.message}`, exitCode: -1, timedOut: false });
    });
  });
}

async function executeInterpreted(language: Language, code: string, stdin?: string): Promise<ExecuteResponse> {
  let command: string;
  const args: string[] = [];
  const timeout = INTERPRETER_TIMEOUT;

  switch (language) {
    case "javascript":
      command = "bun"; args.push("--eval", code); break;
    case "typescript":
      command = "bun"; args.push("--eval", code); break;
    case "python":
      command = "python3"; args.push("-c", code); break;
    case "ruby":
      command = RUBY_BIN; args.push("-e", code); break;
    case "bash":
      command = "bash"; args.push("-c", code); break;
    default:
      return { output: "", error: `Not an interpreted language: ${language}`, exitCode: -1 };
  }

  const result = await runCommand(command, args, timeout, stdin);
  let error: string | null = result.stderr || null;
  if (result.timedOut) {
    error = (error ? error + "\n" : "") + `Execution timed out after ${timeout / 1000} seconds`;
  }
  return { output: result.stdout, error, exitCode: result.exitCode };
}

async function executeCompiled(language: Language, code: string, stdin?: string): Promise<ExecuteResponse> {
  const workDir = mkdtempSync(join(tmpdir(), "code-runner-"));

  try {
    let compileCmd: string;
    let compileArgs: string[];
    let runCmd: string;
    let runArgs: string[];
    let outputFile: string;

    switch (language) {
      case "java": {
        // Java: write Main.java, compile, run Main class
        const javaFile = join(workDir, "Main.java");
        // If code doesn't have a class declaration, wrap it
        if (!code.includes("class ")) {
          code = `public class Main {\n  public static void main(String[] args) {\n${code.split("\n").map(l => "    " + l).join("\n")}\n  }\n}\n`;
        } else {
          // Rename the class to Main
          code = code.replace(/public\s+class\s+\w+/, "public class Main");
        }
        writeFileSync(javaFile, code);

        // Compile
        const compileResult = await runCommand(JAVAC, [javaFile], EXECUTION_TIMEOUT); // no stdin for compile
        if (compileResult.exitCode !== 0) {
          return { output: compileResult.stdout, error: compileResult.stderr, exitCode: compileResult.exitCode };
        }

        // Run
        const runResult = await runCommand(JAVA, ["-cp", workDir, "Main"], EXECUTION_TIMEOUT, stdin);
        let error: string | null = runResult.stderr || null;
        if (runResult.timedOut) {
          error = (error ? error + "\n" : "") + "Execution timed out after 8 seconds";
        }
        return { output: runResult.stdout, error, exitCode: runResult.exitCode };
      }

      case "c": {
        const srcFile = join(workDir, "main.c");
        outputFile = join(workDir, "main");
        writeFileSync(srcFile, code);

        const compileResult = await runCommand("gcc", [srcFile, "-o", outputFile, "-lm"], EXECUTION_TIMEOUT);
        if (compileResult.exitCode !== 0) {
          return { output: compileResult.stdout, error: compileResult.stderr, exitCode: compileResult.exitCode };
        }

        const runResult = await runCommand(outputFile, [], EXECUTION_TIMEOUT, stdin);
        let error: string | null = runResult.stderr || null;
        if (runResult.timedOut) error = (error ? error + "\n" : "") + "Execution timed out after 8 seconds";
        return { output: runResult.stdout, error, exitCode: runResult.exitCode };
      }

      case "cpp": {
        const srcFile = join(workDir, "main.cpp");
        outputFile = join(workDir, "main");
        writeFileSync(srcFile, code);

        const compileResult = await runCommand("g++", [srcFile, "-o", outputFile, "-std=c++20"], EXECUTION_TIMEOUT);
        if (compileResult.exitCode !== 0) {
          return { output: compileResult.stdout, error: compileResult.stderr, exitCode: compileResult.exitCode };
        }

        const runResult = await runCommand(outputFile, [], EXECUTION_TIMEOUT, stdin);
        let error: string | null = runResult.stderr || null;
        if (runResult.timedOut) error = (error ? error + "\n" : "") + "Execution timed out after 8 seconds";
        return { output: runResult.stdout, error, exitCode: runResult.exitCode };
      }

      case "rust": {
        const srcFile = join(workDir, "main.rs");
        outputFile = join(workDir, "main");
        writeFileSync(srcFile, code);

        const compileResult = await runCommand(RUSTC, [srcFile, "-o", outputFile], EXECUTION_TIMEOUT);
        if (compileResult.exitCode !== 0) {
          return { output: compileResult.stdout, error: compileResult.stderr, exitCode: compileResult.exitCode };
        }

        const runResult = await runCommand(outputFile, [], EXECUTION_TIMEOUT, stdin);
        let error: string | null = runResult.stderr || null;
        if (runResult.timedOut) error = (error ? error + "\n" : "") + "Execution timed out after 8 seconds";
        return { output: runResult.stdout, error, exitCode: runResult.exitCode };
      }

      case "go": {
        const srcFile = join(workDir, "main.go");
        writeFileSync(srcFile, code);

        // go run handles compile + execute in one step
        const runResult = await runCommand(GO_BIN, ["run", srcFile], EXECUTION_TIMEOUT, stdin);
        let error: string | null = runResult.stderr || null;
        if (runResult.timedOut) error = (error ? error + "\n" : "") + "Execution timed out after 8 seconds";
        return { output: runResult.stdout, error, exitCode: runResult.exitCode };
      }

      default:
        return { output: "", error: `Not a compiled language: ${language}`, exitCode: -1 };
    }
  } finally {
    // Cleanup temp directory
    try { rmSync(workDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

const COMPILED_LANGUAGES = new Set(["java", "c", "cpp", "rust", "go"]);

function jsonResponse(data: unknown, status = 200, origin = "*"): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    const origin = req.headers.get("origin") || "*";

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname !== "/execute") {
      return jsonResponse({ error: "Not found. Use POST /execute." }, 404, origin);
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed. Use POST." }, 405, origin);
    }

    let body: ExecuteRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, origin);
    }

    const { code, language, stdin } = body;

    if (typeof code !== "string" || typeof language !== "string") {
      return jsonResponse(
        { error: "Missing or invalid 'code' or 'language' field" },
        400,
        origin
      );
    }

    const normalizedLang = language.toLowerCase().replace("++", "pp") as Language;

    if (!SUPPORTED_LANGUAGES.includes(normalizedLang)) {
      return jsonResponse(
        {
          error: `Unsupported language: '${language}'. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`,
        },
        400,
        origin
      );
    }

    if (code.trim().length === 0) {
      return jsonResponse({ error: "Code cannot be empty" }, 400, origin);
    }

    try {
      let result: ExecuteResponse;
      if (COMPILED_LANGUAGES.has(normalizedLang)) {
        result = await executeCompiled(normalizedLang, code, stdin);
      } else {
        result = await executeInterpreted(normalizedLang, code, stdin);
      }
      return jsonResponse(result, 200, origin);
    } catch (err: any) {
      return jsonResponse(
        { error: `Internal server error: ${err.message}` },
        500,
        origin
      );
    }
  },
});

console.log(`[code-runner] Service running on port ${PORT}`);
console.log(`[code-runner] POST /execute - Execute code snippets`);
console.log(`[code-runner] Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`);
console.log(`[code-runner] Compiled: java, c, cpp, rust, go | Interpreted: js, ts, python, ruby, bash`);