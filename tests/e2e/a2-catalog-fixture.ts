import { readFileSync } from "node:fs";

const curriculumCatalog = JSON.parse(readFileSync(
  new URL("../../public/data/course-catalog.json", import.meta.url),
  "utf8",
)) as { levels: { level: string; expectedUnits: number; expectedLessons: number }[] };
const a2 = curriculumCatalog.levels.find((entry) => entry.level === "A2");
if (!a2 || !Number.isInteger(a2.expectedUnits) || !Number.isInteger(a2.expectedLessons)) {
  throw new Error("A2 browser fixtures require declared unit and lesson counts");
}

// Unit tests independently pin the actual curriculum totals at each checkpoint.
// Browser tests compare what the learner sees with the catalog, not a stale count.
export const a2LessonCount = a2.expectedLessons;
export const a2UnitIds = Array.from({ length: a2.expectedUnits }, (_, index) =>
  `a2-u${String(index + 1).padStart(2, "0")}`,
);
