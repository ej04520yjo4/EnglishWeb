// Builds the compact browser copies of the large vocabulary JSON files.
//
// The canonical files under public/data stay the reviewed source of truth and
// remain the input for every audit. The packed copies under public/data/packed
// are a lossless encoding (see app/packed-json.ts) that the browser downloads
// instead. `--check` fails when a packed copy is stale or does not restore to
// exactly the canonical content.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { packJson, unpackJson } from "../app/packed-json.ts";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");

export const PACKED_VOCABULARY_FILES = [
  "vocabulary-targets-v2.json",
  "vocabulary-library-v1.json",
  "vocabulary-phonetics-v1.json",
  "vocabulary-applications-v1.json",
];

const failures = [];
const summary = [];

for (const fileName of PACKED_VOCABULARY_FILES) {
  const sourcePath = path.join(root, "public", "data", fileName);
  const outputPath = path.join(root, "public", "data", "packed", fileName);
  const canonical = JSON.parse(await readFile(sourcePath, "utf8"));
  const rendered = `${JSON.stringify(packJson(canonical))}\n`;

  const restored = unpackJson(JSON.parse(rendered));
  if (
    !isDeepStrictEqual(restored, canonical) ||
    JSON.stringify(restored) !== JSON.stringify(canonical)
  ) {
    failures.push(`${fileName}: packed copy does not restore the canonical data`);
    continue;
  }

  if (checkOnly) {
    let existing = "";
    try {
      existing = await readFile(outputPath, "utf8");
    } catch {
      failures.push(`${fileName}: packed copy is missing; run npm run build:packed-vocabulary`);
      continue;
    }
    if (existing.replace(/\r\n/g, "\n") !== rendered) {
      failures.push(`${fileName}: packed copy is stale; run npm run build:packed-vocabulary`);
    }
  } else {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, rendered, "utf8");
  }

  const canonicalBytes = Buffer.byteLength(JSON.stringify(canonical, null, 2));
  summary.push(
    `${fileName} ${Math.round(canonicalBytes / 1024)}KB -> ${Math.round(
      Buffer.byteLength(rendered) / 1024,
    )}KB`,
  );
}

if (failures.length > 0) {
  console.error("Packed vocabulary check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `${checkOnly ? "Packed vocabulary check passed" : "Packed vocabulary built"}: ${summary.join("; ")}`,
);
