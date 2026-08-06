import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCourseCsv } from "../app/curriculum/validation.ts";
import {
  canonicalizeLexemeId,
  validateVocabularyTargets,
} from "../app/vocabulary-targets.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));

const levels = [
  {
    level: "A1",
    version: "a1-course-v3.csv",
    rows: parseCourseCsv(readText("public/data/a1-course-v3.csv")),
  },
  {
    level: "A2",
    version: "a2-course-v1.csv",
    rows: parseCourseCsv(readText("public/data/a2-course-v1.csv")),
  },
];
const reference = readJson("public/data/reference-vocabulary-v1.json");
const groups = readJson("public/data/vocabulary-groups-v1.json");
const topicsByLexeme = new Map();
for (const group of groups.groups) {
  for (const item of group.items) {
    const id = canonicalizeLexemeId(item.lexemeId);
    topicsByLexeme.set(id, [
      ...new Set([...(topicsByLexeme.get(id) ?? []), group.id]),
    ]);
  }
}

const TARGET_EXCLUDED_LEXEMES = new Set(["amy", "ben"]);
const isExcludedTargetRow = (row) => {
  const sourceLexemeId = canonicalizeLexemeId(row.lexeme_id);
  const lemmaId = canonicalizeLexemeId(row.lemma || row.answer);
  return (
    TARGET_EXCLUDED_LEXEMES.has(sourceLexemeId) ||
    TARGET_EXCLUDED_LEXEMES.has(lemmaId)
  );
};

const entries = new Map();
for (const source of levels) {
  const countableRows = source.rows.filter((row) => !isExcludedTargetRow(row));
  const rowsByLexeme = Map.groupBy(countableRows, (row) => {
    const sourceLexemeId = canonicalizeLexemeId(row.lexeme_id);
    const lemmaId = canonicalizeLexemeId(row.lemma || row.answer);
    return /^[a-z]+(?:['-][a-z]+)*$/.test(lemmaId)
      ? lemmaId
      : sourceLexemeId;
  });
  for (const [lexemeId, rows] of rowsByLexeme) {
    if (!lexemeId) continue;
    const first = rows[0];
    const sourceLexemeIds = [
      ...new Set(rows.map((row) => canonicalizeLexemeId(row.lexeme_id))),
    ];
    const existing = entries.get(lexemeId);
    const sourceRef = {
      sourceName: `EnglishWeb ${source.level} curriculum`,
      sourceVersion: source.version,
      sourceType: "curriculum",
      license: first.license?.trim() || "pending",
      reference: first.occurrence_id,
    };
    if (existing) {
      existing.sourceRefs.push(sourceRef);
      existing.sourceLexemeIds = [
        ...new Set([...existing.sourceLexemeIds, ...sourceLexemeIds]),
      ];
      existing.topics = [
        ...new Set([...existing.topics, ...rows.map((row) => row.unit_title)]),
      ];
      continue;
    }
    entries.set(lexemeId, {
      lexemeId,
      lemma: (first.lemma || first.answer).trim(),
      sourceLexemeIds,
      targetLevel: source.level,
      masteryTarget: "active",
      curriculumPriority: 0,
      topics: [...new Set(rows.map((row) => row.unit_title).filter(Boolean))],
      sourceRefs: [sourceRef],
      qaStatus: "pilot_review_required",
    });
  }
}

for (const item of reference.vocabulary) {
  const sourceLexemeId = canonicalizeLexemeId(item.lexemeId);
  const lexemeId = canonicalizeLexemeId(item.lemma || item.lexemeId);
  if (entries.has(lexemeId)) {
    const existing = entries.get(lexemeId);
    existing.sourceLexemeIds = [
      ...new Set([...existing.sourceLexemeIds, sourceLexemeId]),
    ];
    continue;
  }
  entries.set(lexemeId, {
    lexemeId,
    lemma: item.lemma.trim(),
    sourceLexemeIds: [sourceLexemeId],
    targetLevel: item.minimumLevel === "A2" ? "A2" : "A1",
    masteryTarget: "receptive",
    curriculumPriority: 0,
    topics: topicsByLexeme.get(lexemeId) ?? ["related-vocabulary"],
    sourceRefs: [
      {
        sourceName: "EnglishWeb reference vocabulary",
        sourceVersion: "reference-vocabulary-v1.json",
        sourceType: "reference",
        license: item.license,
        reference: item.lexemeId,
      },
    ],
    qaStatus: "pilot_review_required",
  });
}

const orderedEntries = [...entries.values()];
orderedEntries.forEach((entry, index) => {
  entry.curriculumPriority = index + 1;
});

const data = {
  schemaVersion: 1,
  status: "partial_review_required",
  completionLevel: "A2",
  goals: {
    totalLexemes: 3000,
    activeLexemes: 1500,
    receptiveLexemes: 1500,
    a1Cumulative: {
      totalLexemes: 1200,
      activeLexemes: 700,
      receptiveLexemes: 500,
    },
    a2Cumulative: {
      totalLexemes: 3000,
      activeLexemes: 1500,
      receptiveLexemes: 1500,
    },
  },
  entries: orderedEntries,
};

const report = validateVocabularyTargets(data);
if (!report.valid) {
  throw new Error(report.errors.join("\n"));
}
const output = path.join(root, "public", "data", "vocabulary-targets-v1.json");
fs.writeFileSync(output, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(
  `Vocabulary target baseline created: ${orderedEntries.length} entries ` +
    `(${orderedEntries.filter((entry) => entry.masteryTarget === "active").length} active, ` +
    `${orderedEntries.filter((entry) => entry.masteryTarget === "receptive").length} receptive).`,
);
