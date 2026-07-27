import { loadA1CourseData } from "../a1-mvp-data.ts";
import type { CurriculumCatalogEntry, LoadedCourseLevel } from "./types";

export const loadA1LegacyLevel = async (
  entry: CurriculumCatalogEntry,
  fetcher: typeof fetch = fetch,
): Promise<LoadedCourseLevel> => {
  if (entry.level !== "A1") {
    throw new Error("A1 相容載入器只能處理 A1 課程。");
  }
  const loaded = await loadA1CourseData(fetcher);
  return {
    level: "A1",
    status: entry.status,
    units: loaded.courseUnits,
    rows: loaded.rows,
    sourceVersion: entry.sourceVersion,
    sourceRevision: loaded.sourceRevision,
  };
};
