import type {
  CefrLevel,
  CourseCsvRow,
  CurriculumCatalogEntry,
} from "./types";
import {
  COURSE_CSV_HEADERS,
  normalizeCourseRows,
  validateCourseRows,
} from "./validation.ts";

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

// The official rows always load from the course file, so local storage only
// needs the rows a learner edited. A full copy of a large course can fill the
// browser quota and block progress from saving.
export type StoredCourseDelta = Omit<StoredCourseData, "rows"> & {
  changedRows: CourseCsvRow[];
};

const sameCourseRow = (left: CourseCsvRow, right: CourseCsvRow) =>
  COURSE_CSV_HEADERS.every((header) => left[header] === right[header]);

export const createStoredCourseDelta = (
  entry: CurriculumCatalogEntry,
  rows: CourseCsvRow[],
  officialRows: CourseCsvRow[],
  sourceRevision: string,
  updatedAt = new Date().toISOString(),
): StoredCourseData | StoredCourseDelta => {
  const sameOrder =
    rows.length === officialRows.length &&
    rows.every(
      (row, index) => row.occurrence_id === officialRows[index].occurrence_id,
    );
  // A reordered import cannot be described by changed rows alone.
  if (!sameOrder) {
    return createStoredCourseData(entry, rows, sourceRevision, updatedAt);
  }
  return {
    level: entry.level,
    sourceVersion: entry.sourceVersion,
    sourceRevision,
    updatedAt,
    changedRows: rows.filter((row, index) => !sameCourseRow(row, officialRows[index])),
  };
};

const rowsFromStoredValue = (
  value: Partial<StoredCourseData & StoredCourseDelta>,
  officialRows: CourseCsvRow[],
) => {
  if (Array.isArray(value.rows)) return value.rows;
  if (!Array.isArray(value.changedRows)) return null;
  const changedById = new Map(
    value.changedRows.map((row) => [row.occurrence_id, row]),
  );
  const officialIds = new Set(officialRows.map((row) => row.occurrence_id));
  if (
    changedById.size !== value.changedRows.length ||
    [...changedById.keys()].some((id) => !officialIds.has(id))
  ) {
    return null;
  }
  return officialRows.map((row) => changedById.get(row.occurrence_id) ?? row);
};

export const restoreStoredCourseData = (
  serialized: string,
  entry: CurriculumCatalogEntry,
  officialRows: CourseCsvRow[],
  officialRevision: string,
): StoredCourseData | null => {
  const value = JSON.parse(serialized) as Partial<
    StoredCourseData & StoredCourseDelta
  >;
  const storedRows = rowsFromStoredValue(value, officialRows);
  if (
    value.level !== entry.level ||
    value.sourceVersion !== entry.sourceVersion ||
    value.sourceRevision !== officialRevision ||
    !value.updatedAt ||
    Number.isNaN(Date.parse(value.updatedAt)) ||
    !storedRows
  ) {
    return null;
  }
  const rows = normalizeCourseRows(storedRows);
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
