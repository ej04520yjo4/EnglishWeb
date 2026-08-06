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

const canonicalRowLexeme = (row) => {
  const lemma = canonicalizeLexemeId(row.lemma || row.answer);
  return /^[a-z]+(?:['-][a-z]+)*$/.test(lemma)
    ? lemma
    : canonicalizeLexemeId(row.lexeme_id);
};

const TARGET_EXCLUDED_LEXEMES = new Set(["amy", "ben"]);
const isCountableCourseRow = (row) => {
  const sourceLexemeId = canonicalizeLexemeId(row.lexeme_id);
  const lemmaId = canonicalizeLexemeId(row.lemma || row.answer);
  return (
    !TARGET_EXCLUDED_LEXEMES.has(sourceLexemeId) &&
    !TARGET_EXCLUDED_LEXEMES.has(lemmaId)
  );
};

const summarizeRows = (rows) => ({
  occurrences: rows.length,
  uniqueLexemes: new Set(rows.map(canonicalRowLexeme)).size,
  rawLexemeIds: new Set(rows.map((row) => canonicalizeLexemeId(row.lexeme_id))).size,
  uniqueWordForms: new Set(rows.map((row) => row.answer.trim().toLowerCase())).size,
  uniqueSenses: new Set(rows.map((row) => row.sense_id).filter(Boolean)).size,
  uniqueChunks: new Set(rows.map((row) => row.chunk_id).filter(Boolean)).size,
});

export const buildVocabularyCoverageSnapshot = () => {
  const a1Rows = parseCourseCsv(readText("public/data/a1-course-v3.csv"));
  const a2Rows = parseCourseCsv(readText("public/data/a2-course-v1.csv"));
  const reference = JSON.parse(
    readText("public/data/reference-vocabulary-v1.json"),
  ).vocabulary;
  const targets = parseVocabularyTargets(
    JSON.parse(readText("public/data/vocabulary-targets-v1.json")),
  );
  const a1Lexemes = new Set(a1Rows.map(canonicalRowLexeme));
  const a2Lexemes = new Set(a2Rows.map(canonicalRowLexeme));
  const union = new Set([...a1Lexemes, ...a2Lexemes]);
  const countableA1Lexemes = new Set(
    a1Rows.filter(isCountableCourseRow).map(canonicalRowLexeme),
  );
  const countableA2Lexemes = new Set(
    a2Rows.filter(isCountableCourseRow).map(canonicalRowLexeme),
  );
  const countableUnion = new Set([
    ...countableA1Lexemes,
    ...countableA2Lexemes,
  ]);
  const excludedTargetLexemes = [...union].filter(
    (lexemeId) => !countableUnion.has(lexemeId),
  );
  const referenceIds = new Set(
    reference.map((item) => canonicalizeLexemeId(item.lexemeId)),
  );
  const lemmaByLexeme = new Map();
  const conflicts = new Set();
  for (const row of [...a1Rows, ...a2Rows]) {
    const lexemeId = canonicalizeLexemeId(row.lexeme_id);
    const lemma = canonicalizeLexemeId(row.lemma || row.answer);
    if (lemmaByLexeme.has(lexemeId) && lemmaByLexeme.get(lexemeId) !== lemma) {
      conflicts.add(lexemeId);
    }
    lemmaByLexeme.set(lexemeId, lemma);
  }
  const sourceLexemeLemmaMismatches = [...a1Rows, ...a2Rows]
    .filter((row) => {
      const answer = canonicalizeLexemeId(row.answer);
      const lemma = canonicalizeLexemeId(row.lemma || row.answer);
      return answer !== lemma && canonicalizeLexemeId(row.lexeme_id) === answer;
    })
    .map((row) => `${row.lexeme_id}->${row.lemma}`);
  return {
    A1: summarizeRows(a1Rows),
    A2: summarizeRows(a2Rows),
    unionUniqueLexemes: union.size,
    countableUnionUniqueLexemes: countableUnion.size,
    excludedTargetLexemes,
    overlappingLexemes: [...a1Lexemes].filter((id) => a2Lexemes.has(id)).length,
    referenceOnlyUniqueLexemes: [...referenceIds].filter((id) => !union.has(id)).length,
    targets: buildVocabularyCoverageReport(targets),
    invalidLexemeIds: targets.entries
      .map((entry) => entry.lexemeId)
      .filter((id) => !/^[a-z]+(?:['-][a-z]+)*$/.test(id)),
    lemmaLexemeConflicts: [...conflicts],
    sourceLexemeLemmaMismatches: [...new Set(sourceLexemeLemmaMismatches)],
  };
};

if (
  process.argv[1] &&
  path.basename(process.argv[1]) === path.basename(fileURLToPath(import.meta.url))
) {
  const report = buildVocabularyCoverageSnapshot();
  console.log("A1＋A2 vocabulary coverage report");
  console.log(JSON.stringify(report, null, 2));
}
