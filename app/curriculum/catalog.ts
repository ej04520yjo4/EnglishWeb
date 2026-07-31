import type {
  CefrLevel,
  CurriculumCatalog,
  CurriculumCatalogEntry,
} from "./types";
import { CEFR_LEVELS } from "./types.ts";

export const COURSE_CATALOG_URL = "/data/course-catalog.json";

const isCatalogEntry = (
  value: Partial<CurriculumCatalogEntry>,
): value is CurriculumCatalogEntry =>
  CEFR_LEVELS.includes(value.level as CefrLevel) &&
  (value.status === "production" ||
    value.status === "pilot" ||
    value.status === "disabled") &&
  Boolean(
    value.title &&
      value.description &&
      value.sourceVersion &&
      value.curriculumUrl &&
      value.patternExercisesUrl &&
      value.readingExercisesUrl,
  ) &&
  typeof value.expectedUnits === "number" &&
  Number.isInteger(value.expectedUnits) &&
  value.expectedUnits > 0 &&
  typeof value.expectedLessons === "number" &&
  Number.isInteger(value.expectedLessons) &&
  value.expectedLessons > 0 &&
  typeof value.expectedOccurrences === "number" &&
  Number.isInteger(value.expectedOccurrences) &&
  value.expectedOccurrences > 0;

export const validateCurriculumCatalog = (
  value: Partial<CurriculumCatalog>,
): CurriculumCatalog => {
  if (value.schemaVersion !== 1 || !Array.isArray(value.levels)) {
    throw new Error("課程目錄格式錯誤。");
  }
  if (!value.levels.every(isCatalogEntry)) {
    throw new Error("課程目錄含有不完整的程度設定。");
  }
  const levels = value.levels.map((entry) => entry.level);
  if (
    new Set(levels).size !== levels.length ||
    levels.some((level, index) => level !== CEFR_LEVELS[index])
  ) {
    throw new Error(
      `課程目錄必須依序包含不重複的 ${CEFR_LEVELS.join("、")} 設定。`,
    );
  }
  value.levels.forEach((entry, index) => {
    const expectedPrerequisite =
      index === 0 ? undefined : CEFR_LEVELS[index - 1];
    if (entry.prerequisiteLevel !== expectedPrerequisite) {
      throw new Error(
        `${entry.level} 的 prerequisiteLevel 必須是 ${
          expectedPrerequisite ?? "空白"
        }。`,
      );
    }
  });
  return value as CurriculumCatalog;
};

export const loadCurriculumCatalog = async (
  fetcher: typeof fetch = fetch,
): Promise<CurriculumCatalog> => {
  const response = await fetcher(COURSE_CATALOG_URL, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`課程目錄載入失敗（${response.status}）。`);
  }
  return validateCurriculumCatalog(
    (await response.json()) as Partial<CurriculumCatalog>,
  );
};

export const catalogEntryForLevel = (
  catalog: CurriculumCatalog,
  level: CefrLevel,
) => {
  const entry = catalog.levels.find((item) => item.level === level);
  if (!entry) {
    throw new Error(`課程目錄找不到 ${level}。`);
  }
  return entry;
};

export const runtimeCatalogEntries = (catalog: CurriculumCatalog) =>
  catalog.levels.filter((entry) => entry.status !== "disabled");
