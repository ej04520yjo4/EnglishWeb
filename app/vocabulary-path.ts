import {
  deriveVocabularyMasteryState,
  normalizeVocabularyEvidence,
  type GlobalVocabularyEvidence,
  type GlobalVocabularyProgress,
} from "./vocabulary-progress.ts";
import type {
  VocabularyMasteryTarget,
  VocabularyTargetsData,
} from "./vocabulary-targets.ts";

// The guided 3000-word path orders the existing target catalog into lessons.
// It stores no progress of its own: every status below is derived from the
// global vocabulary evidence, so it cannot create course or CEFR credit.
export const VOCABULARY_PATH_URL = "/data/vocabulary-path-v1.json";
export const VOCABULARY_PATH_SOURCE_VERSION = "vocabulary-path-v1";
export const VOCABULARY_PATH_LESSON_SIZE = 10;
export const VOCABULARY_PATH_STAGE_COUNT = 5;
export const VOCABULARY_PATH_LESSONS_PER_STAGE = 60;
export const VOCABULARY_PATH_REVIEW_LIMIT = 20;
const EXPOSURE_PREFIX = "vocabulary-path:";
// Days to wait before each later check of a word that already met its goal.
const MAINTENANCE_INTERVAL_DAYS = [3, 7, 21, 45];

export type VocabularyPathStep = "recognition" | "spelling" | "application";
export type VocabularyPathTask = {
  kind: "study" | VocabularyPathStep;
  lexemeId: string;
};
export type VocabularyPathLessonStatus =
  | "not-started"
  | "in-progress"
  | "learned"
  | "mastered";
export type VocabularyPathTheme = { id: string; titleZhTw: string };
export type VocabularyPathStage = {
  id: string;
  order: number;
  titleZhTw: string;
  summaryZhTw: string;
  lessonIds: string[];
};
export type VocabularyPathLesson = {
  id: string;
  stageId: string;
  order: number;
  themeId: string;
  titleZhTw: string;
  lexemeIds: string[];
};
export type VocabularyPathData = {
  schemaVersion: 1;
  sourceVersion: typeof VOCABULARY_PATH_SOURCE_VERSION;
  sourceRevision: string;
  status: "pilot_review_required";
  targetCount: number;
  lessonSize: number;
  themes: VocabularyPathTheme[];
  stages: VocabularyPathStage[];
  lessons: VocabularyPathLesson[];
};
export type VocabularyPathSummary = {
  startedCount: number;
  goalCount: number;
  dueLexemeIds: string[];
  lessonStatus: Map<string, VocabularyPathLessonStatus>;
  nextLesson: VocabularyPathLesson | null;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const lessonId = (order: number) =>
  `vocab-path-l${String(order).padStart(3, "0")}`;

export const validateVocabularyPath = (
  value: unknown,
  targets: VocabularyTargetsData,
) => {
  const errors: string[] = [];
  if (!isObject(value) || !Array.isArray(value.lessons) || !Array.isArray(value.stages) || !Array.isArray(value.themes)) {
    return { valid: false, errors: ["3000 字路線：資料格式不正確。"] };
  }
  if (value.schemaVersion !== 1 || value.sourceVersion !== VOCABULARY_PATH_SOURCE_VERSION) {
    errors.push("3000 字路線：來源版本不正確。");
  }
  if (typeof value.sourceRevision !== "string" || !/^[a-f0-9]{64}$/.test(value.sourceRevision)) {
    errors.push("3000 字路線：缺少合法內容雜湊。");
  }
  if (value.status !== "pilot_review_required") {
    errors.push("3000 字路線：不可宣稱已完成人工複核。");
  }
  if (value.targetCount !== targets.entries.length || value.lessonSize !== VOCABULARY_PATH_LESSON_SIZE) {
    errors.push("3000 字路線：目標字數或每課字數不正確。");
  }
  const expectedLessons = VOCABULARY_PATH_STAGE_COUNT * VOCABULARY_PATH_LESSONS_PER_STAGE;
  if (value.stages.length !== VOCABULARY_PATH_STAGE_COUNT || value.lessons.length !== expectedLessons) {
    errors.push(`3000 字路線：必須是 ${VOCABULARY_PATH_STAGE_COUNT} 階段、${expectedLessons} 課。`);
  }
  const themeIds = new Set(
    value.themes.flatMap((theme) =>
      isObject(theme) && isText(theme.id) && isText(theme.titleZhTw) ? [theme.id] : [],
    ),
  );
  if (themeIds.size !== value.themes.length) errors.push("3000 字路線：主題資料不正確或重複。");
  const targetIds = new Set(targets.entries.map((entry) => entry.lexemeId));
  const seenWords = new Set<string>();
  const stageByLesson = new Map<string, string>();
  value.stages.forEach((stage, index) => {
    if (
      !isObject(stage) ||
      stage.id !== `stage-${index + 1}` ||
      stage.order !== index + 1 ||
      !isText(stage.titleZhTw) ||
      !isText(stage.summaryZhTw) ||
      !Array.isArray(stage.lessonIds) ||
      stage.lessonIds.length !== VOCABULARY_PATH_LESSONS_PER_STAGE
    ) {
      errors.push(`3000 字路線：第 ${index + 1} 階段資料不正確。`);
      return;
    }
    for (const id of stage.lessonIds) stageByLesson.set(String(id), stage.id);
  });
  value.lessons.forEach((lesson, index) => {
    const label = `3000 字路線第 ${index + 1} 課`;
    if (!isObject(lesson) || !Array.isArray(lesson.lexemeIds)) {
      errors.push(`${label}：格式不正確。`);
      return;
    }
    if (lesson.id !== lessonId(index + 1) || lesson.order !== index + 1) {
      errors.push(`${label}：ID 或順序不正確。`);
    }
    if (stageByLesson.get(String(lesson.id)) !== lesson.stageId) {
      errors.push(`${label}：不屬於宣告的階段。`);
    }
    if (!themeIds.has(String(lesson.themeId)) || !isText(lesson.titleZhTw)) {
      errors.push(`${label}：主題或標題不正確。`);
    }
    if (lesson.lexemeIds.length !== VOCABULARY_PATH_LESSON_SIZE) {
      errors.push(`${label}：必須剛好 ${VOCABULARY_PATH_LESSON_SIZE} 個字。`);
    }
    for (const word of lesson.lexemeIds) {
      if (typeof word !== "string" || !targetIds.has(word)) {
        errors.push(`${label}：${String(word)} 不在 3000 字目標。`);
      } else if (seenWords.has(word)) {
        errors.push(`${label}：${word} 重複出現。`);
      } else {
        seenWords.add(word);
      }
    }
  });
  if (seenWords.size !== targetIds.size) {
    errors.push(`3000 字路線：只涵蓋 ${seenWords.size} / ${targetIds.size} 個目標字。`);
  }
  return { valid: errors.length === 0, errors };
};

export const parseVocabularyPath = (
  value: unknown,
  targets: VocabularyTargetsData,
): VocabularyPathData => {
  const report = validateVocabularyPath(value, targets);
  if (!report.valid) throw new Error(report.errors.join("\n"));
  return value as VocabularyPathData;
};

export const loadVocabularyPath = async (
  targets: VocabularyTargetsData,
  fetcher: typeof fetch = fetch,
) => {
  const response = await fetcher(VOCABULARY_PATH_URL, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`3000 字學習路線載入失敗（HTTP ${response.status}）。單字庫仍可使用。`);
  }
  return parseVocabularyPath(await response.json(), targets);
};

export const buildVocabularyPathExposureId = (
  studyDate: string,
  lexemeId: string,
) => `${EXPOSURE_PREFIX}${studyDate}:study:${lexemeId}`;

export const hasVocabularyPathExposure = (value?: GlobalVocabularyEvidence) =>
  Boolean(value?.exposureEvidenceIds?.some((id) => id.startsWith(EXPOSURE_PREFIX)));

export const meetsVocabularyPathGoal = (
  value: GlobalVocabularyEvidence | undefined,
  masteryTarget: VocabularyMasteryTarget,
) => {
  const state = deriveVocabularyMasteryState(value);
  return masteryTarget === "active"
    ? state === "active"
    : state === "receptive" || state === "active";
};

const distinctDates = (evidence: GlobalVocabularyEvidence, ids: string[]) =>
  new Set(ids.map((id) => evidence.evidenceStudyDates[id]).filter(Boolean));
const attemptedOn = (
  evidence: GlobalVocabularyEvidence,
  ids: string[],
  studyDate: string,
) => ids.some((id) => evidence.evidenceStudyDates[id] === studyDate);
const dayNumber = (studyDate: string) => {
  const [year, month, day] = studyDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
};

/**
 * The practice a started word still needs on this local date. Only the first
 * answer per word, date and mode counts, so a word already attempted today
 * waits for the next study date instead of being repeated for credit.
 */
export const vocabularyPathDueSteps = (
  value: GlobalVocabularyEvidence | undefined,
  masteryTarget: VocabularyMasteryTarget,
  studyDate: string,
): VocabularyPathStep[] => {
  const evidence = normalizeVocabularyEvidence(value);
  const recognitionToday = attemptedOn(evidence, evidence.recognitionAttemptEvidenceIds, studyDate);
  const spellingToday = attemptedOn(evidence, evidence.spellingAttemptEvidenceIds, studyDate);
  const applicationToday = attemptedOn(evidence, evidence.applicationAttemptEvidenceIds, studyDate);
  if (meetsVocabularyPathGoal(value, masteryTarget)) {
    const dates = [...new Set(evidence.studyDates)].sort();
    const interval = MAINTENANCE_INTERVAL_DAYS[dates.length - 2];
    if (interval === undefined) return [];
    if (dayNumber(studyDate) - dayNumber(dates[dates.length - 1]) < interval) return [];
    if (masteryTarget === "active") return spellingToday ? [] : ["spelling"];
    return recognitionToday ? [] : ["recognition"];
  }
  const steps: VocabularyPathStep[] = [];
  const recognitionDates = distinctDates(evidence, evidence.recognitionCorrectEvidenceIds);
  if (recognitionDates.size < 2 && !recognitionToday) steps.push("recognition");
  if (masteryTarget === "active") {
    const spellingDates = distinctDates(evidence, evidence.spellingCorrectEvidenceIds);
    if (spellingDates.size < 2 && !spellingToday) steps.push("spelling");
    const spelledEarlier = [...spellingDates].some((date) => date < studyDate);
    if (evidence.applicationCorrectEvidenceIds.length === 0 && spelledEarlier && !applicationToday) {
      steps.push("application");
    }
  }
  return steps;
};

const masteryIndex = (targets: VocabularyTargetsData) =>
  new Map(targets.entries.map((entry) => [entry.lexemeId, entry.masteryTarget]));

export const summarizeVocabularyPath = (
  path: VocabularyPathData,
  targets: VocabularyTargetsData,
  progress: GlobalVocabularyProgress,
  studyDate: string,
): VocabularyPathSummary => {
  const mastery = masteryIndex(targets);
  const lessonStatus = new Map<string, VocabularyPathLessonStatus>();
  const dueLexemeIds: string[] = [];
  let startedCount = 0;
  let goalCount = 0;
  let nextLesson: VocabularyPathLesson | null = null;
  for (const lesson of path.lessons) {
    let seen = 0;
    let goals = 0;
    let firstPass = 0;
    for (const id of lesson.lexemeIds) {
      const value = progress[id];
      const target = mastery.get(id) as VocabularyMasteryTarget;
      const started = hasVocabularyPathExposure(value);
      const meets = meetsVocabularyPathGoal(value, target);
      if (started || meets) {
        seen += 1;
        startedCount += 1;
      }
      if (meets) {
        goals += 1;
        goalCount += 1;
      }
      if (started) {
        const evidence = normalizeVocabularyEvidence(value);
        const practiced =
          evidence.recognitionAttemptEvidenceIds.length > 0 &&
          (target !== "active" || evidence.spellingAttemptEvidenceIds.length > 0);
        if (meets || practiced) firstPass += 1;
        if (vocabularyPathDueSteps(value, target, studyDate).length > 0) dueLexemeIds.push(id);
      } else if (meets) {
        firstPass += 1;
      }
    }
    const size = lesson.lexemeIds.length;
    const status: VocabularyPathLessonStatus =
      goals === size ? "mastered" : firstPass === size ? "learned" : seen > 0 ? "in-progress" : "not-started";
    lessonStatus.set(lesson.id, status);
    if (!nextLesson && (status === "not-started" || status === "in-progress")) nextLesson = lesson;
  }
  return { startedCount, goalCount, dueLexemeIds, lessonStatus, nextLesson };
};

/** Study cards first, then recognition, spelling and sentence practice. */
export const buildVocabularyPathLessonTasks = (
  lesson: VocabularyPathLesson,
  targets: VocabularyTargetsData,
  progress: GlobalVocabularyProgress,
  studyDate: string,
): VocabularyPathTask[] => {
  const mastery = masteryIndex(targets);
  const groups: Record<VocabularyPathTask["kind"], VocabularyPathTask[]> = {
    study: [], recognition: [], spelling: [], application: [],
  };
  for (const lexemeId of lesson.lexemeIds) {
    const value = progress[lexemeId];
    const target = mastery.get(lexemeId) as VocabularyMasteryTarget;
    if (meetsVocabularyPathGoal(value, target) && !hasVocabularyPathExposure(value)) continue;
    if (!hasVocabularyPathExposure(value)) groups.study.push({ kind: "study", lexemeId });
    for (const kind of vocabularyPathDueSteps(value, target, studyDate)) {
      groups[kind].push({ kind, lexemeId });
    }
  }
  return [...groups.study, ...groups.recognition, ...groups.spelling, ...groups.application];
};

/** Unfinished words come first; words that met their goal follow as later checks. */
export const buildVocabularyPathReviewTasks = (
  path: VocabularyPathData,
  targets: VocabularyTargetsData,
  progress: GlobalVocabularyProgress,
  studyDate: string,
  limit = VOCABULARY_PATH_REVIEW_LIMIT,
): VocabularyPathTask[] => {
  const mastery = masteryIndex(targets);
  const learning: VocabularyPathTask[] = [];
  const maintenance: VocabularyPathTask[] = [];
  for (const lesson of path.lessons) {
    for (const lexemeId of lesson.lexemeIds) {
      const value = progress[lexemeId];
      if (!hasVocabularyPathExposure(value)) continue;
      const target = mastery.get(lexemeId) as VocabularyMasteryTarget;
      const bucket = meetsVocabularyPathGoal(value, target) ? maintenance : learning;
      for (const kind of vocabularyPathDueSteps(value, target, studyDate)) {
        bucket.push({ kind, lexemeId });
      }
    }
  }
  return [...learning, ...maintenance].slice(0, Math.max(0, limit));
};
