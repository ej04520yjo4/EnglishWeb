import { loadA1LegacyLevel } from "./a1-legacy-adapter.ts";
import {
  catalogEntryForLevel,
  loadCurriculumCatalog,
} from "./catalog.ts";
import type {
  CefrLevel,
  CurriculumCatalog,
  CurriculumCatalogEntry,
  LoadedCourseLevel,
} from "./types";
import {
  buildCourseUnitsFromRows,
  checksumCourseSource,
  parseCourseCsv,
  validateCourseRows,
} from "./validation.ts";

export type CurriculumLoadResult = {
  catalog: CurriculumCatalog;
  levels: Partial<Record<CefrLevel, LoadedCourseLevel>>;
  errors: Partial<Record<CefrLevel, string>>;
};

const loadCatalogCourseLevel = async (
  entry: CurriculumCatalogEntry,
  fetcher: typeof fetch,
): Promise<LoadedCourseLevel> => {
  const response = await fetcher(entry.curriculumUrl, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`${entry.level} 課程 CSV 載入失敗（${response.status}）。`);
  }
  const csvText = await response.text();
  const rows = parseCourseCsv(csvText);
  const report = validateCourseRows(rows, {
    expectedLevel: entry.level,
    expectedRows: entry.expectedOccurrences,
    expectedUnits: entry.expectedUnits,
    expectedLessons: entry.expectedLessons,
    sourceVersion: entry.sourceVersion,
    rejectProductionQaForPilot: entry.status === "pilot",
  });
  if (!report.valid) {
    throw new Error(report.validationErrors.join("\n"));
  }
  return {
    level: entry.level,
    status: entry.status,
    units: buildCourseUnitsFromRows(rows, entry.sourceVersion),
    rows,
    sourceVersion: entry.sourceVersion,
    sourceRevision: await checksumCourseSource(csvText),
  };
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
  return loadCatalogCourseLevel(entry, fetcher);
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
