import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ESLint } from "eslint";

test("Node type declarations match the supported runtime major", async () => {
  const [manifest, lock] = await Promise.all(
    ["package.json", "package-lock.json"].map(async (path) =>
      JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8")),
    ),
  );
  const minimum = /^>=(\d+)\.\d+\.\d+$/.exec(manifest.engines.node);
  const declarationVersion = manifest.devDependencies["@types/node"];
  assert.ok(minimum, "engines.node must state the minimum supported runtime version");
  assert.match(declarationVersion, /^\d+\.\d+\.\d+$/);
  assert.equal(declarationVersion.split(".")[0], minimum[1]);
  assert.equal(lock.packages["node_modules/@types/node"].version, declarationVersion);
});

test("lint excludes generated artifacts while retaining application and test source", async () => {
  const eslint = new ESLint({ cwd: fileURLToPath(new URL("../", import.meta.url)) });

  for (const path of [
    "dist/client/assets/generated.js",
    ".vinext/generated.js",
    ".wrangler/tmp/bundle/generated.js",
    "playwright-report/trace/assets/generated.js",
    "test-results/trace/generated.js",
    "coverage/generated.js",
  ]) {
    assert.equal(await eslint.isPathIgnored(path), true, path);
  }

  for (const path of [
    "app/page.tsx",
    "app/vocabulary-groups.ts",
    "tests/e2e/related-vocabulary.spec.ts",
    "tests/tooling.test.mjs",
    "scripts/run-playwright-tests.mjs",
  ]) {
    assert.equal(await eslint.isPathIgnored(path), false, path);
  }
});
