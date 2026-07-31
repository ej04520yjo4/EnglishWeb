import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  readdir,
  readFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCurriculumCatalog } from "../app/curriculum/catalog.ts";
import { parseCourseCsv } from "../app/curriculum/validation.ts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const dataDirectory = path.join(root, "public", "data");
const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};
const readRootFile = (relativePath) =>
  readFile(path.join(root, relativePath), "utf8");
const dataRelativePath = (url) =>
  `public/${url.replace(/^\//, "")}`;
const duplicates = (values) => {
  const seen = new Set();
  const repeated = new Set();
  values.forEach((value) => {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  });
  return [...repeated];
};

const catalog = validateCurriculumCatalog(
  JSON.parse(await readRootFile("public/data/course-catalog.json")),
);
const referencedDataPaths = new Set(["public/data/course-catalog.json"]);
const allCourseRows = new Map();
let bomSourceCount = 0;
let intentionalReviewSentenceCount = 0;

for (const entry of catalog.levels) {
  const sourcePaths = [
    entry.curriculumUrl,
    entry.patternExercisesUrl,
    entry.readingExercisesUrl,
  ].map(dataRelativePath);
  sourcePaths.forEach((sourcePath) => referencedDataPaths.add(sourcePath));
  assert(
    path.basename(entry.curriculumUrl) === entry.sourceVersion,
    `${entry.level} sourceVersion 與 curriculumUrl 檔名不一致。`,
  );

  const [csvText, patternText, readingText] = await Promise.all(
    sourcePaths.map(readRootFile),
  );
  sourcePaths.forEach((sourcePath, index) => {
    const text = [csvText, patternText, readingText][index];
    if (text.startsWith("\uFEFF")) bomSourceCount += 1;
  });
  const rows = parseCourseCsv(csvText);
  const patternData = JSON.parse(patternText);
  const readingData = JSON.parse(readingText);
  allCourseRows.set(entry.level, rows);

  assert(
    rows.length === entry.expectedOccurrences,
    `${entry.level} occurrence 數量與 catalog 不一致。`,
  );
  assert(
    new Set(rows.map((row) => row.unit_id)).size ===
      entry.expectedUnits,
    `${entry.level} unit 數量與 catalog 不一致。`,
  );
  assert(
    new Set(rows.map((row) => row.lesson_id)).size ===
      entry.expectedLessons,
    `${entry.level} lesson 數量與 catalog 不一致。`,
  );
  assert(
    duplicates(rows.map((row) => row.occurrence_id)).length === 0,
    `${entry.level} occurrence_id 有重複。`,
  );
  const lessonRows = [
    ...Map.groupBy(rows, (row) => row.lesson_id).values(),
  ];
  const lessonsBySentence = Map.groupBy(
    lessonRows,
    (lesson) => lesson[0].sentence,
  );
  lessonsBySentence.forEach((matchingLessons, sentence) => {
    if (matchingLessons.length < 2) return;
    const laterReviewLessons = matchingLessons.slice(1);
    const intentionalReview = laterReviewLessons.every((lesson) =>
      lesson.every((row) => row.is_new_content === "FALSE"),
    );
    assert(
      intentionalReview,
      `${entry.level} 有未標記為複習的重複核心句：${sentence}`,
    );
    if (intentionalReview) {
      intentionalReviewSentenceCount += laterReviewLessons.length;
    }
  });

  const lessonIds = new Set(rows.map((row) => row.lesson_id));
  const sentenceIds = new Set(rows.map((row) => row.sentence_id));
  const passageIds = new Set(rows.map((row) => row.passage_id));
  const patternIds = new Set(
    rows.map((row) => row.sentence_pattern_id),
  );
  patternData.patterns.forEach((pattern) => {
    assert(
      patternIds.has(pattern.id),
      `${entry.level} 句型 ${pattern.id} 沒有正式課程來源。`,
    );
    pattern.examples.forEach((example) => {
      assert(
        lessonIds.has(example.practiceLessonId),
        `${entry.level} 句型題 ${example.id} 指向不存在的課程。`,
      );
      assert(
        sentenceIds.has(example.sourceSentenceId),
        `${entry.level} 句型題 ${example.id} 指向不存在的句子。`,
      );
    });
  });
  readingData.recognition.forEach((exercise) => {
    assert(
      lessonIds.has(exercise.lessonId),
      `${entry.level} 閱讀辨識 ${exercise.id} 指向不存在的課程。`,
    );
  });
  readingData.textResponses.forEach((exercise) => {
    assert(
      lessonIds.has(exercise.lessonId),
      `${entry.level} 文字選答 ${exercise.id} 指向不存在的課程。`,
    );
  });
  readingData.passages.forEach((passage) => {
    assert(
      passageIds.has(passage.passageId),
      `${entry.level} 文章 ${passage.passageId} 沒有正式課程來源。`,
    );
  });
}

const levelEntries = [...catalog.levels];
for (let index = 0; index < levelEntries.length; index += 1) {
  for (
    let otherIndex = index + 1;
    otherIndex < levelEntries.length;
    otherIndex += 1
  ) {
    const level = levelEntries[index].level;
    const otherLevel = levelEntries[otherIndex].level;
    const rows = allCourseRows.get(level);
    const otherRows = allCourseRows.get(otherLevel);
    for (const field of [
      "occurrence_id",
      "lesson_id",
      "sentence_id",
      "passage_id",
    ]) {
      const ids = new Set(rows.map((row) => row[field]));
      const collisions = [
        ...new Set(
          otherRows
            .map((row) => row[field])
            .filter((id) => ids.has(id)),
        ),
      ];
      assert(
        collisions.length === 0,
        `${level}/${otherLevel} 的 ${field} 發生碰撞：${collisions.join("、")}`,
      );
    }
  }
}

const publicDataFiles = (await readdir(dataDirectory))
  .map((fileName) => `public/data/${fileName}`)
  .sort();
const courseSourceFiles = publicDataFiles.filter((fileName) =>
  /(?:course-v\d+\.csv|pattern-exercises\.json|reading-exercises\.json)$/.test(
    fileName,
  ),
);
const orphanCourseSources = courseSourceFiles.filter(
  (fileName) => !referencedDataPaths.has(fileName),
);
assert(
  orphanCourseSources.length === 0,
  `發現 catalog 未引用的課程資料：${orphanCourseSources.join("、")}`,
);

const contentHashes = new Map();
for (const relativePath of publicDataFiles) {
  const content = await readFile(path.join(root, relativePath));
  const hash = createHash("sha256").update(content).digest("hex");
  const matching = contentHashes.get(hash) ?? [];
  matching.push(relativePath);
  contentHashes.set(hash, matching);
}
const duplicateFiles = [...contentHashes.values()].filter(
  (files) => files.length > 1,
);
assert(
  duplicateFiles.length === 0,
  `發現內容完全相同的多餘資料檔：${duplicateFiles
    .map((files) => files.join(" = "))
    .join("；")}`,
);

const generatorSource = await readRootFile(
  "scripts/create-b1-b2-curriculum.mjs",
);
for (const objectName of ["PROMPTS", "LEMMAS"]) {
  const block = new RegExp(
    `const ${objectName} = \\{([\\s\\S]*?)\\n\\};`,
  ).exec(generatorSource)?.[1];
  assert(Boolean(block), `找不到產生器中的 ${objectName}。`);
  if (block) {
    const keys = [
      ...block.matchAll(/^\s{2}([a-z][a-z0-9]*):/gm),
    ].map((match) => match[1]);
    const repeatedKeys = duplicates(keys);
    assert(
      repeatedKeys.length === 0,
      `${objectName} 有會互相覆蓋的重複鍵：${repeatedKeys.join("、")}`,
    );
  }
}

const trackedResult = spawnSync("git", ["ls-files"], {
  cwd: root,
  encoding: "utf8",
});
assert(
  trackedResult.status === 0,
  `無法讀取 Git 追蹤檔案：${trackedResult.stderr}`,
);
if (trackedResult.status === 0) {
  const generatedArtifacts = trackedResult.stdout
    .split(/\r?\n/)
    .filter((fileName) =>
      /(^|\/)(?:node_modules|dist|\.next|playwright-report|test-results)(?:\/|$)/.test(
        fileName,
      ),
    );
  assert(
    generatedArtifacts.length === 0,
    `Git 不可追蹤建置或測試產物：${generatedArtifacts.join("、")}`,
  );
}

if (errors.length > 0) {
  console.error(`Project data audit failed (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  const totalRows = [...allCourseRows.values()].reduce(
    (sum, rows) => sum + rows.length,
    0,
  );
  console.log(
    `Project data audit passed: ${catalog.levels.length} levels, ` +
      `${totalRows} occurrences, ${courseSourceFiles.length} catalog sources, ` +
      `0 orphan or duplicate data files, ${intentionalReviewSentenceCount} ` +
      `intentional review sentences, ${bomSourceCount} BOM-safe sources.`,
  );
}
