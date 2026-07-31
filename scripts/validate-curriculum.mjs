import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  findCrossLevelIdCollisions,
  parseCourseCsv,
  validateCourseRows,
} from "../app/curriculum/validation.ts";
import {
  validatePatternExerciseData,
  validateReadingExerciseData,
} from "../app/a1-exercises.ts";
import { validateCurriculumCatalog } from "../app/curriculum/catalog.ts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const publicPath = (url) =>
  path.posix.join("public", url.replace(/^\/+/, ""));

const catalog = validateCurriculumCatalog(
  readJson("public/data/course-catalog.json"),
);
const rowsByLevel = new Map();
const summaries = [];
const errors = [];
let prerequisiteRows = [];

for (const entry of catalog.levels) {
  const rows = parseCourseCsv(
    readText(publicPath(entry.curriculumUrl)),
  );
  const patterns = readJson(publicPath(entry.patternExercisesUrl));
  const reading = readJson(publicPath(entry.readingExercisesUrl));
  const reports = [
    validateCourseRows(rows, {
      expectedLevel: entry.level,
      expectedRows: entry.expectedOccurrences,
      expectedUnits: entry.expectedUnits,
      expectedLessons: entry.expectedLessons,
      rejectProductionQaForPilot: entry.status === "pilot",
    }),
    validatePatternExerciseData(
      patterns,
      rows,
      entry.level,
      prerequisiteRows,
    ),
    validateReadingExerciseData(
      reading,
      rows,
      patterns,
      prerequisiteRows,
    ),
  ];
  reports.forEach((report) => {
    errors.push(
      ...(report.validationErrors ?? report.errors ?? []).map(
        (error) => `${entry.level}: ${error}`,
      ),
    );
  });

  for (const [previousLevel, previousRows] of rowsByLevel) {
    const collisions = findCrossLevelIdCollisions(
      previousRows,
      rows,
    );
    if (collisions.length) {
      errors.push(
        `${previousLevel}/${entry.level} ID 碰撞：${collisions.join("、")}`,
      );
    }
  }

  rowsByLevel.set(entry.level, rows);
  prerequisiteRows = [...prerequisiteRows, ...rows];
  summaries.push(
    `${entry.level} ${rows.length} occurrences, ` +
      `${new Set(rows.map((row) => row.unit_id)).size} units, ` +
      `${new Set(rows.map((row) => row.lesson_id)).size} lessons`,
  );
}

if (errors.length) {
  console.error("Curriculum validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Curriculum validation passed: ${summaries.join("; ")}.`);
}
