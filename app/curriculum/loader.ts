import { loadA1LegacyLevel } from "./a1-legacy-adapter";
import {
  catalogEntryForLevel,
  loadCurriculumCatalog,
} from "./catalog";
import type {
  CefrLevel,
  CurriculumCatalog,
  LoadedCourseLevel,
} from "./types";

export type CurriculumLoadResult = {
  catalog: CurriculumCatalog;
  levels: Partial<Record<CefrLevel, LoadedCourseLevel>>;
  errors: Partial<Record<CefrLevel, string>>;
};

export const loadCourseLevel = async (
  catalog: CurriculumCatalog,
  level: CefrLevel,
  fetcher: typeof fetch = fetch,
): Promise<LoadedCourseLevel> => {
  const entry = catalogEntryForLevel(catalog, level);
  if (level === "A1") {
    return loadA1LegacyLevel(entry, fetcher);
  }
  throw new Error("A2 課程載入器尚未完成。");
};

export const loadAvailableCourseLevels = async (
  fetcher: typeof fetch = fetch,
): Promise<CurriculumLoadResult> => {
  const catalog = await loadCurriculumCatalog(fetcher);
  const levels: Partial<Record<CefrLevel, LoadedCourseLevel>> = {};
  const errors: Partial<Record<CefrLevel, string>> = {};

  await Promise.all(
    catalog.levels.map(async (entry) => {
      try {
        levels[entry.level] = await loadCourseLevel(
          catalog,
          entry.level,
          fetcher,
        );
      } catch (error) {
        errors[entry.level] =
          error instanceof Error ? error.message : `${entry.level} 課程載入失敗。`;
      }
    }),
  );

  return { catalog, levels, errors };
};
