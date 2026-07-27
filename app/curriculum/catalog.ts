import type {
  CefrLevel,
  CurriculumCatalog,
  CurriculumCatalogEntry,
} from "./types";

export const COURSE_CATALOG_URL = "/data/course-catalog.json";

const isCatalogEntry = (
  value: Partial<CurriculumCatalogEntry>,
): value is CurriculumCatalogEntry =>
  (value.level === "A1" || value.level === "A2") &&
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
  );

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
    !levels.includes("A1") ||
    !levels.includes("A2")
  ) {
    throw new Error("課程目錄必須包含不重複的 A1 與 A2 設定。");
  }
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
