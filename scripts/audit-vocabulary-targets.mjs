import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCourseCsv } from "../app/curriculum/validation.ts";
import {
  buildVocabularyCoverageReport,
  canonicalizeLexemeId,
  parseVocabularyTargets,
} from "../app/vocabulary-targets.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const targets = parseVocabularyTargets(
  JSON.parse(readText("public/data/vocabulary-targets-v2.json")),
);
const legacyTargets = JSON.parse(
  readText("public/data/vocabulary-targets-v1.json"),
);
const a1Rows = parseCourseCsv(readText("public/data/a1-course-v3.csv"));
const a2Rows = parseCourseCsv(readText("public/data/a2-course-v1.csv"));
const rowsByVersion = new Map([
  ["a1-course-v3.csv", a1Rows],
  ["a2-course-v1.csv", a2Rows],
]);
const reference = JSON.parse(
  readText("public/data/reference-vocabulary-v1.json"),
).vocabulary;

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};
const entryIds = new Set(targets.entries.map((entry) => entry.lexemeId));
const TARGET_EXCLUDED_LEXEMES = new Set(["amy", "ben"]);
const isCountableCourseRow = (row) => {
  const sourceLexemeId = canonicalizeLexemeId(row.lexeme_id);
  const lemmaId = canonicalizeLexemeId(row.lemma || row.answer);
  return (
    !TARGET_EXCLUDED_LEXEMES.has(sourceLexemeId) &&
    !TARGET_EXCLUDED_LEXEMES.has(lemmaId)
  );
};
const allCourseRows = [...a1Rows, ...a2Rows];
const courseIds = new Set(
  allCourseRows
    .filter(isCountableCourseRow)
    .map((row) => canonicalizeLexemeId(row.lemma || row.lexeme_id)),
);
const excludedCourseIds = new Set(
  allCourseRows
    .filter((row) => !isCountableCourseRow(row))
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
for (const lexemeId of excludedCourseIds) {
  assert(
    !entryIds.has(lexemeId),
    `課程人名 ${lexemeId} 不可計入 3000 一般詞彙目標。`,
  );
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

const coverage = buildVocabularyCoverageReport(targets);
assert(targets.schemaVersion === 2, "runtime target catalog 必須使用 schemaVersion 2。");
assert(
  targets.status === "count_complete_review_required",
  "3000 詞彙目標在人工 QA 完成前必須維持 count_complete_review_required。",
);
assert(coverage.countComplete, "3000 詞彙目標的 active／receptive 分配尚未達標。\n");
assert(!coverage.humanReviewComplete, "不可在未人工複核時宣稱詞彙庫已完成 QA。");
assert(targets.entries.length === 3000, "runtime target catalog 必須有 3000 筆。" );
assert(coverage.a1ActiveEntries === 700, "A1 active 目標必須是 700 筆。" );
assert(coverage.a1ReceptiveEntries === 500, "A1 receptive 目標必須是 500 筆。" );
assert(coverage.a2StageActiveEntries === 800, "A2 stage active 必須是 800 筆。" );
assert(coverage.a2StageReceptiveEntries === 1000, "A2 stage receptive 必須是 1000 筆。" );
assert(
  JSON.stringify(targets.entries.slice(0, legacyTargets.entries.length)) ===
    JSON.stringify(legacyTargets.entries),
  "runtime v2 前 132 筆必須保留 v1 既有 target objects。",
);
for (const entry of targets.entries) {
  for (const source of entry.sourceRefs) {
    if (source.sourceType === "curriculum") {
      const rows = rowsByVersion.get(source.sourceVersion);
      assert(
        Boolean(rows),
        `${entry.lexemeId} 的 curriculum sourceVersion 不存在：${source.sourceVersion}。`,
      );
      if (rows) {
        const row = rows.find((candidate) => candidate.occurrence_id === source.reference);
        assert(
          Boolean(row),
          `${entry.lexemeId} 的 curriculum occurrence 不存在：${source.reference}。`,
        );
        if (row) {
          assert(
            canonicalizeLexemeId(row.lemma || row.lexeme_id) === entry.lexemeId,
            `${entry.lexemeId} 的 curriculum source 指向不同 lexeme：${source.reference}。`,
          );
        }
      }
    } else if (source.sourceType === "reference") {
      assert(
        referenceIds.has(canonicalizeLexemeId(source.reference)),
        `${entry.lexemeId} 的 reference source 不存在：${source.reference}。`,
      );
    } else {
      assert(
        ["reference", "open_lexicon", "frequency", "original_content"].includes(
          source.sourceType,
        ),
        `${entry.lexemeId} 使用未允許的外部 sourceType：${source.sourceType}。`,
      );
      if (source.artifactSha256 !== undefined) {
        assert(
          /^[a-f0-9]{64}$/i.test(source.artifactSha256),
          `${entry.lexemeId} 的 artifactSha256 格式不正確。`,
        );
      }
    }
  }
}

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
