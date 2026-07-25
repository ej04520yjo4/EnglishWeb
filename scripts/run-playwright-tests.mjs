import { execFile, spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const serverEntry = path.join(
  root,
  "node_modules",
  "vinext",
  "dist",
  "cli.js",
);
const playwrightEntry = path.join(
  root,
  "node_modules",
  "@playwright",
  "test",
  "cli.js",
);
let serverOutput = "";

const server = spawn(
  process.execPath,
  [
    serverEntry,
    "dev",
    "--host",
    "127.0.0.1",
    "--port",
    "4173",
  ],
  {
    cwd: root,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  },
);

for (const stream of [server.stdout, server.stderr]) {
  stream.on("data", (chunk) => {
    serverOutput = `${serverOutput}${chunk}`.slice(-8_000);
  });
}

const stopServer = async () => {
  if (server.exitCode === null && process.platform === "win32") {
    await new Promise((resolve) => {
      execFile(
        "taskkill",
        ["/PID", String(server.pid), "/T", "/F"],
        { windowsHide: true },
        () => resolve(undefined),
      );
    });
  } else if (server.exitCode === null) {
    server.kill("SIGTERM");
  }
  server.stdout.destroy();
  server.stderr.destroy();
  server.unref();
};

const waitForServer = async () => {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`測試網站啟動失敗。\n${serverOutput}`);
    }
    try {
      const response = await fetch("http://localhost:4173/");
      await response.arrayBuffer();
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`測試網站啟動逾時。\n${serverOutput}`);
};

try {
  await waitForServer();
  const playwright = spawn(
    process.execPath,
    [playwrightEntry, "test", ...process.argv.slice(2)],
    {
      cwd: root,
      env: {
        ...process.env,
        PLAYWRIGHT_EXTERNAL_SERVER: "true",
      },
      windowsHide: true,
      stdio: "inherit",
    },
  );
  const exitCode = await new Promise((resolve, reject) => {
    playwright.once("error", reject);
    playwright.once("exit", (code) => resolve(code ?? 1));
  });
  process.exitCode = exitCode;
} finally {
  await stopServer();
}
