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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));

const a1Rows = parseCourseCsv(readText("public/data/a1-course-v3.csv"));
const a2Rows = parseCourseCsv(readText("public/data/a2-course-v1.csv"));
const a2Patterns = readJson("public/data/a2-pattern-exercises.json");
const a2Reading = readJson("public/data/a2-reading-exercises.json");

const reports = [
  validateCourseRows(a2Rows, {
    expectedLevel: "A2",
    expectedUnits: 1,
    expectedLessons: 4,
    rejectProductionQaForPilot: true,
  }),
  validatePatternExerciseData(a2Patterns, a2Rows, "A2", a1Rows),
  validateReadingExerciseData(a2Reading, a2Rows, a2Patterns, a1Rows),
];
const collisions = findCrossLevelIdCollisions(a1Rows, a2Rows);
const errors = reports.flatMap(
  (report) => report.validationErrors ?? report.errors ?? [],
);
if (collisions.length) {
  errors.push(`A1/A2 ID 碰撞：${collisions.join("、")}`);
}

if (errors.length) {
  console.error("Curriculum validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(
    `Curriculum validation passed: A1 ${a1Rows.length} occurrences; A2 ${a2Rows.length} occurrences, 1 unit, 4 lessons.`,
  );
}
