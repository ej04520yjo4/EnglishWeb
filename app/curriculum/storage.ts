import type {
  CefrLevel,
  CourseCsvRow,
  CurriculumCatalogEntry,
} from "./types";
import {
  normalizeCourseRows,
  validateCourseRows,
} from "./validation";

export type StoredCourseData = {
  level: CefrLevel;
  sourceVersion: string;
  sourceRevision: string;
  updatedAt: string;
  rows: CourseCsvRow[];
};

export const createStoredCourseData = (
  entry: CurriculumCatalogEntry,
  rows: CourseCsvRow[],
  sourceRevision: string,
  updatedAt = new Date().toISOString(),
): StoredCourseData => ({
  level: entry.level,
  sourceVersion: entry.sourceVersion,
  sourceRevision,
  updatedAt,
  rows,
});

export const restoreStoredCourseData = (
  serialized: string,
  entry: CurriculumCatalogEntry,
  officialRows: CourseCsvRow[],
  officialRevision: string,
): StoredCourseData | null => {
  const value = JSON.parse(serialized) as Partial<StoredCourseData>;
  if (
    value.level !== entry.level ||
    value.sourceVersion !== entry.sourceVersion ||
    value.sourceRevision !== officialRevision ||
    !value.updatedAt ||
    Number.isNaN(Date.parse(value.updatedAt)) ||
    !Array.isArray(value.rows)
  ) {
    return null;
  }
  const rows = normalizeCourseRows(value.rows);
  const report = validateCourseRows(rows, {
    expectedLevel: entry.level,
    expectedRows: officialRows.length,
    expectedUnits: new Set(officialRows.map((row) => row.unit_id)).size,
    expectedLessons: new Set(officialRows.map((row) => row.lesson_id)).size,
    rejectProductionQaForPilot: entry.status === "pilot",
  });
  if (!report.valid) return null;
  const officialIds = new Set(
    officialRows.map((row) => row.occurrence_id),
  );
  if (
    rows.some((row) => !officialIds.has(row.occurrence_id)) ||
    rows.length !== officialIds.size
  ) {
    return null;
  }
  return {
    level: entry.level,
    sourceVersion: entry.sourceVersion,
    sourceRevision: officialRevision,
    updatedAt: value.updatedAt,
    rows,
  };
};
