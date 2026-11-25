import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseVocabularyTargets } from "../app/vocabulary-targets.ts";
import {
  parseVocabularyPath,
  VOCABULARY_PATH_LESSON_SIZE as LESSON_SIZE,
  VOCABULARY_PATH_LESSONS_PER_STAGE as STAGE_LESSONS,
  VOCABULARY_PATH_SOURCE_VERSION,
} from "../app/vocabulary-path.ts";

// Orders the 3000 existing targets into the guided path. The themes file only
// groups words; it never adds, removes or relabels a target.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const json = (name) => JSON.parse(read(name));
const outputName = "public/data/vocabulary-path-v1.json";
const targets = parseVocabularyTargets(json("public/data/vocabulary-targets-v2.json"));
const library = new Map(json("public/data/vocabulary-library-v1.json").entries.map((entry) => [entry.lexemeId, entry]));
const themeSource = json("data-sources/vocabulary-3000/path-themes.json");

const stages = [
  ["第 1 階段：生活核心字", "最常見的基礎字，先能看懂、聽懂日常短句。"],
  ["第 2 階段：日常擴充字", "補齊購物、交通、工作與社交的常用字。"],
  ["第 3 階段：學校與職場字", "能讀懂公告、簡單文章與工作訊息。"],
  ["第 4 階段：進階表達字", "能描述想法、比較差異與說明原因。"],
  ["第 5 階段：主題補強字", "補足各主題較少見但實用的字，完成 3000 字。"],
];
const fallbackTheme = (lexemeId) => {
  const pos = library.get(lexemeId).partOfSpeech;
  if (pos.startsWith("noun")) return themeSource.fallbackThemes.noun;
  if (pos.startsWith("verb")) return themeSource.fallbackThemes.verb;
  if (pos.startsWith("adjective")) return themeSource.fallbackThemes.adjective;
  return themeSource.fallbackThemes.other;
};
const themeByLexeme = new Map();
const targetIds = new Set(targets.entries.map((entry) => entry.lexemeId));
for (const theme of themeSource.themes) {
  for (const lexemeId of theme.lexemeIds ?? []) {
    if (!targetIds.has(lexemeId)) throw new Error(`主題 ${theme.id} 的 ${lexemeId} 不在 3000 字目標。`);
    if (themeByLexeme.has(lexemeId)) throw new Error(`${lexemeId} 同時屬於多個主題。`);
    themeByLexeme.set(lexemeId, theme.id);
  }
}
const themeOf = (lexemeId) => themeByLexeme.get(lexemeId) ?? fallbackTheme(lexemeId);
const themeTitles = new Map(themeSource.themes.map((theme) => [theme.id, theme.titleZhTw]));

// Practical everyday words were appended after the frequency list. Spread them
// through the first three stages so a learner meets "spoon" before "hypothesis".
const isSupplement = (entry) =>
  entry.curriculumPriority > 132 && !entry.sourceRefs.some((source) => source.sourceType === "frequency");
const supplements = targets.entries.filter(isSupplement).sort((a, b) => a.curriculumPriority - b.curriculumPriority);
const pulledRank = new Map(supplements.map((entry, index) => [
  entry.lexemeId,
  140 + (index * 1260) / Math.max(1, supplements.length - 1),
]));
// Basic concrete words rank low in a general corpus but belong near the start.
for (const lexemeId of themeSource.earlyLexemeIds) {
  if (!targetIds.has(lexemeId)) throw new Error(`提前學習清單的 ${lexemeId} 不在 3000 字目標。`);
}
const earlyRank = new Map(themeSource.earlyLexemeIds.map((lexemeId, index) => [
  lexemeId,
  140 + (index * 1040) / Math.max(1, themeSource.earlyLexemeIds.length - 1),
]));
const rankOf = (entry) => Math.min(
  entry.curriculumPriority,
  earlyRank.get(entry.lexemeId) ?? Infinity,
  pulledRank.get(entry.lexemeId) ?? Infinity,
);
const ordered = [...targets.entries].sort((a, b) =>
  rankOf(a) - rankOf(b) || a.curriculumPriority - b.curriculumPriority,
);
const position = new Map(ordered.map((entry, index) => [entry.lexemeId, index]));

const lessons = [];
const outputStages = stages.map(([titleZhTw, summaryZhTw], stageIndex) => {
  const stageId = `stage-${stageIndex + 1}`;
  const band = ordered.slice(stageIndex * STAGE_LESSONS * LESSON_SIZE, (stageIndex + 1) * STAGE_LESSONS * LESSON_SIZE);
  const byTheme = new Map();
  for (const entry of band) {
    const themeId = themeOf(entry.lexemeId);
    byTheme.set(themeId, [...(byTheme.get(themeId) ?? []), entry.lexemeId]);
  }
  const chunks = [];
  const leftovers = [];
  for (const [themeId, words] of byTheme) {
    const whole = words.length - (words.length % LESSON_SIZE);
    for (let index = 0; index < whole; index += LESSON_SIZE) {
      chunks.push({ themeId, lexemeIds: words.slice(index, index + LESSON_SIZE) });
    }
    leftovers.push(...words.slice(whole));
  }
  leftovers.sort((a, b) => position.get(a) - position.get(b));
  for (let index = 0; index < leftovers.length; index += LESSON_SIZE) {
    chunks.push({ themeId: themeSource.mixedTheme.id, lexemeIds: leftovers.slice(index, index + LESSON_SIZE) });
  }
  const meanPosition = (chunk) =>
    chunk.lexemeIds.reduce((sum, id) => sum + position.get(id), 0) / chunk.lexemeIds.length;
  chunks.sort((a, b) => meanPosition(a) - meanPosition(b) || a.lexemeIds[0].localeCompare(b.lexemeIds[0]));
  const counters = new Map();
  const totals = new Map();
  for (const chunk of chunks) totals.set(chunk.themeId, (totals.get(chunk.themeId) ?? 0) + 1);
  const lessonIds = chunks.map((chunk) => {
    const order = lessons.length + 1;
    const id = `vocab-path-l${String(order).padStart(3, "0")}`;
    const count = (counters.get(chunk.themeId) ?? 0) + 1;
    counters.set(chunk.themeId, count);
    const title = themeTitles.get(chunk.themeId) ?? themeSource.mixedTheme.titleZhTw;
    lessons.push({
      id, stageId, order, themeId: chunk.themeId,
      titleZhTw: totals.get(chunk.themeId) > 1 ? `${title} ${count}` : title,
      lexemeIds: chunk.lexemeIds,
    });
    return id;
  });
  return { id: stageId, order: stageIndex + 1, titleZhTw, summaryZhTw, lessonIds };
});

const themes = [
  ...themeSource.themes.map(({ id, titleZhTw }) => ({ id, titleZhTw })),
  themeSource.mixedTheme,
];
const sourceRevision = crypto.createHash("sha256")
  .update(JSON.stringify({ themes, stages: outputStages, lessons }))
  .digest("hex");
const data = parseVocabularyPath({
  schemaVersion: 1,
  sourceVersion: VOCABULARY_PATH_SOURCE_VERSION,
  sourceRevision,
  status: "pilot_review_required",
  targetCount: targets.entries.length,
  lessonSize: LESSON_SIZE,
  themes,
  stages: outputStages,
  lessons,
}, targets);

// One record per line keeps later word moves readable in a diff.
const list = (items) => items.map((item) => `    ${JSON.stringify(item)}`).join(",\n");
const content = `{
  "schemaVersion": ${data.schemaVersion},
  "sourceVersion": ${JSON.stringify(data.sourceVersion)},
  "sourceRevision": ${JSON.stringify(data.sourceRevision)},
  "status": ${JSON.stringify(data.status)},
  "targetCount": ${data.targetCount},
  "lessonSize": ${data.lessonSize},
  "themes": [
${list(data.themes)}
  ],
  "stages": [
${list(data.stages)}
  ],
  "lessons": [
${list(data.lessons)}
  ]
}
`;
if (process.argv.includes("--check")) {
  if (read(outputName).replace(/\r\n/g, "\n") !== content) {
    throw new Error("3000 字路線與產生器輸出不同。請執行 npm run build:vocabulary-path。");
  }
} else {
  fs.writeFileSync(path.join(root, outputName), content);
}
console.log(`Vocabulary path ${process.argv.includes("--check") ? "verified" : "generated"}: ${data.stages.length} stages, ${data.lessons.length} lessons, ${data.targetCount} canonical targets. Human review remains pending.`);
