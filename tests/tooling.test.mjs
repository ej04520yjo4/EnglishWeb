import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ESLint } from "eslint";

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
