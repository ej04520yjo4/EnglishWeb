import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCourseCsv } from "../app/curriculum/validation.ts";
import {
  canonicalizeLexemeId,
  parseVocabularyTargets,
} from "../app/vocabulary-targets.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const targets = parseVocabularyTargets(
  JSON.parse(readText("public/data/vocabulary-targets-v1.json")),
);
const a1Rows = parseCourseCsv(readText("public/data/a1-course-v3.csv"));
const a2Rows = parseCourseCsv(readText("public/data/a2-course-v1.csv"));
const reference = JSON.parse(
  readText("public/data/reference-vocabulary-v1.json"),
).vocabulary;

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};
const entryIds = new Set(targets.entries.map((entry) => entry.lexemeId));
const courseIds = new Set(
  [...a1Rows, ...a2Rows]
    .map((row) => canonicalizeLexemeId(row.lemma || row.lexeme_id)),
);
const referenceIds = new Set(
  reference.map((item) => canonicalizeLexemeId(item.lexemeId)),
);
for (const lexemeId of courseIds) {
  assert(entryIds.has(lexemeId), `正式課程 lexeme ${lexemeId} 未進入 baseline。`);
}
for (const lexemeId of referenceIds) {
  assert(entryIds.has(lexemeId), `reference lexeme ${lexemeId} 未進入 baseline。`);
}
targets.entries.forEach((entry) => {
  assert(
    !entry.sourceRefs.some((source) => /^b[12]-course/i.test(source.sourceVersion)),
    `${entry.lexemeId} 不可從 B1／B2 進入 A1＋A2 目標。`,
  );
  assert(
    !entry.lemma.includes(" ") && !entry.lexemeId.includes(" "),
    `${entry.lexemeId} 不可把 chunk 當成 lexeme。`,
  );
});
const aliases = targets.entries.flatMap((entry) => entry.sourceLexemeIds);
assert(
  new Set(aliases).size === aliases.length,
  "同一 sourceLexemeId 不可對應多個 canonical target。",
);

if (errors.length) {
  console.error(`Vocabulary target audit failed (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  const active = targets.entries.filter(
    (entry) => entry.masteryTarget === "active",
  ).length;
  console.log(
    `Vocabulary target audit passed: ${targets.entries.length} unique entries, ` +
      `${active} active, ${targets.entries.length - active} receptive, ` +
      `status ${targets.status}.`,
  );
}
