import type { CourseUnit } from "../course-data";

export type CefrLevel = "A1" | "A2";

export type LevelStatus = "production" | "pilot" | "disabled";

export type CurriculumCatalogEntry = {
  level: CefrLevel;
  status: LevelStatus;
  title: string;
  description: string;
  sourceVersion: string;
  prerequisiteLevel?: CefrLevel;
  curriculumUrl: string;
  patternExercisesUrl: string;
  readingExercisesUrl: string;
};

export type CurriculumCatalog = {
  schemaVersion: 1;
  levels: CurriculumCatalogEntry[];
};

export type CourseCsvRow = Record<string, string>;

export type LoadedCourseLevel = {
  level: CefrLevel;
  status: LevelStatus;
  units: CourseUnit[];
  rows: CourseCsvRow[];
  sourceVersion: string;
  sourceRevision: string;
};

export type CourseValidationReport = {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  unmatchedIds: string[];
  validationErrors: string[];
  valid: boolean;
};
