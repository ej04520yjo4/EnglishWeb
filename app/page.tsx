"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CourseUnit, LearningToken, Lesson } from "./course-data";
import {
  A1CourseCsvRow,
  A1_V3_HEADERS,
  buildCourseUnitsFromRows,
  CourseValidationReport,
  createStoredA1CourseData,
  flattenCourseLessons,
  normalizeA1CourseRows,
  OFFICIAL_A1_SOURCE_VERSION,
  parseA1MvpCsv,
  restoreStoredA1CourseData,
  serializeA1MvpCsv,
  validateA1CourseRows,
} from "./a1-mvp-data";
import {
  recordLearningEntityAttempt,
  recordLearningEntityCompletion,
  reviewIntervalForToken,
  rescheduleCompletedReview,
  scheduleTokenReview,
  TokenLearningProgressMap,
  updateTokenLearningProgress,
} from "./learning-progress";
import { evaluateRebuildAttempt, RebuildStatus } from "./rebuild-flow";
import { recallIncorrectFeedback } from "./input-flow";
import { KkPhoneticEntry } from "./kk-phonetics";
import { wordAccuracy } from "./assessment-scoring";
import {
  canStartPassageRebuild,
  evaluatePassageRebuild,
  lessonsForPassage,
  PassageSentenceEvaluation,
} from "./passage-flow";
import {
  A1ExerciseData,
  CourseExerciseData,
  comprehensionForPassage,
  isPatternTransferCorrect,
  loadCourseExerciseData,
  patternExamplesForLesson,
  recognitionForLesson,
  textResponseForLesson,
  validatePatternExerciseData,
  validateReadingExerciseData,
} from "./a1-exercises";
import {
  addReviewExercise,
  HintLevel,
  nextHintLevel,
} from "./learning-adaptation";
import {
  canAccessLevel,
  createEmptyMultiLevelProgress,
  isLevelAssessmentEnabled,
  isLevelFormallyUnlocked,
  migrateProgressToV6,
  updateSelectedLevelProgress,
  type MultiLevelProgress,
} from "./curriculum/progress";
import {
  catalogEntryForLevel,
  loadCurriculumCatalog,
  runtimeCatalogEntries,
} from "./curriculum/catalog";
import { loadCourseLevel } from "./curriculum/loader";
import type {
  CefrLevel,
  CurriculumCatalog,
  CourseCsvRow,
} from "./curriculum/types";
import { CEFR_LEVELS } from "./curriculum/types";
import {
  COURSE_CSV_HEADERS,
  buildCourseUnitsFromRows as buildGenericCourseUnitsFromRows,
  normalizeCourseRows,
  parseCourseCsv,
  serializeCourseCsv,
  validateCourseRows,
} from "./curriculum/validation";
import {
  createStoredCourseData,
  restoreStoredCourseData,
} from "./curriculum/storage";
import {
  canShowVocabularyShortcut,
  createVocabularyCourseReturnContext,
  loadVocabularyDataset,
  type ResolvedVocabularyItem,
  type VocabularyCourseReturnContext,
  type VocabularyDataset,
  type VocabularyStatusFilter,
  vocabularyGroupForLexeme,
  withVocabularySearchAliases,
} from "./vocabulary-groups";
import {
  buildVocabularyTargetAliasIndex,
  canonicalizeLexemeId,
  loadVocabularyTargets,
  type VocabularyTargetsData,
} from "./vocabulary-targets.ts";
import {
  canCreditApplicationCorrect,
  canCreditSpellingCorrect,
  recordGlobalVocabularyEvidence,
  summarizeVocabularyProgress,
  type VocabularyEvidenceKind,
} from "./vocabulary-progress.ts";
import { buildVocabularyWeaknesses } from "./daily-learning.ts";
import {
  buildDailyReviewQueue,
  resolveDailyReviewSource,
  type DailyReviewQueueItem,
  type DailyReviewSource,
} from "./daily-review.ts";
import {
  checkpointDailyActiveSegment,
  createDailySession,
  isDailySessionCurrentDay,
  markDailyReviewCompleted,
  markDailyWeaknessCompleted,
  markDailySessionStep,
  nextDailySessionStep,
  pauseDailyActiveSegment,
  remainingDailyReviewItems,
  remainingDailyWeaknessLexemeIds,
  restoreDailySession,
  startDailyActiveSegment,
  updateDailyReviewItemProgress,
  type DailySessionState,
} from "./daily-session.ts";
import { localDateKey, studyDaysThisWeek } from "./local-date.ts";
import {
  recordReferenceRecognitionResult,
  type ReferenceRecognitionQuestion,
} from "./reference-vocabulary-practice.ts";
import { ReferenceRecognitionPractice } from "./reference-recognition-practice";
import {
  loadVocabularyLibrary,
  recordVocabularyLibraryPracticeResult,
  type VocabularyLibraryData,
} from "./vocabulary-library";
import {
  type VocabularyLibraryEvidenceInput,
  type VocabularyLibraryEntry as VocabularyLibraryPanelEntry,
} from "./vocabulary-library-panel";
import { recordVocabularyApplicationResult } from "./vocabulary-application";
import { useVocabularySupplements } from "./use-vocabulary-supplements";
import {
  readStorageItem,
  removeStorageItem,
  STORAGE_WRITE_FAILURE_MESSAGE,
  writeStorageItem,
} from "./browser-storage";

import {
  type Screen,
  type LearningStage,
  type Familiarity,
  type Assessment,
  type ReviewItem,
  type WeaknessPracticeSource,
  emptySentenceStats,
  emptyPatternStats,
  emptyPassageStats,
  type ProgressState,
  type SettingsState,
  STORAGE,
  emptyRowsByLevel,
  emptyStringsByLevel,
  emptyUnitsByLevel,
  emptyExercisesByLevel,
  emptyStatusesByLevel,
  courseRowsStorageKey,
  defaultSettings,
  normalizeSettings,
  navItems,
  clean,
  cleanSentence,
  dateKey,
  timestamp,
  addDays,
  saveFile,
  EMPTY_TOKEN,
  EMPTY_LESSON,
  EMPTY_UNIT,
} from "./home-model";
import { ConversationScreen } from "./screens/conversation-screen";
import { LearningScreen } from "./screens/learning-screen";
import { HomeScreen } from "./screens/home-screen";
import { RelatedVocabularyScreen } from "./screens/related-vocabulary-screen";
import { WeaknessPracticeScreen } from "./screens/weakness-practice-screen";
import { ReviewScreen } from "./screens/review-screen";
import { CourseMapScreen } from "./screens/course-map-screen";
import { LevelSelector } from "./screens/level-selector";
import { VocabularyLibraryScreen } from "./screens/vocabulary-library-screen";
import { AssessmentScreen } from "./screens/assessment-screen";
import { WeaknessScreen } from "./screens/weakness-screen";
import { DailySummaryScreen } from "./screens/daily-summary-screen";
import { ProgressScreen } from "./screens/progress-screen";
import { ContentAdminScreen } from "./screens/content-admin-screen";
import { SettingsScreen } from "./screens/settings-screen";
import { PhoneticsScreen } from "./screens/phonetics-screen";
import { AlphabetScreen } from "./screens/alphabet-screen";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [multiProgress, setMultiProgress] = useState<MultiLevelProgress>(
    createEmptyMultiLevelProgress,
  );
  const progress =
    multiProgress.levelProgress[multiProgress.selectedLevel];
  const setProgress = (
    update:
      | ProgressState
      | ((current: ProgressState) => ProgressState),
  ) => {
    setMultiProgress((current) =>
      updateSelectedLevelProgress(current, update),
    );
  };
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const selectedLevel = multiProgress.selectedLevel;
  const [catalog, setCatalog] = useState<CurriculumCatalog | null>(null);
  const [courseRowsByLevel, setCourseRowsByLevel] = useState<
    Record<CefrLevel, CourseCsvRow[]>
  >(emptyRowsByLevel);
  const [courseDraftRowsByLevel, setCourseDraftRowsByLevel] = useState<
    Record<CefrLevel, CourseCsvRow[]>
  >(emptyRowsByLevel);
  const [officialCourseRowsByLevel, setOfficialCourseRowsByLevel] =
    useState<Record<CefrLevel, CourseCsvRow[]>>(emptyRowsByLevel);
  const [courseSourceRevisionByLevel, setCourseSourceRevisionByLevel] =
    useState<Record<CefrLevel, string>>(emptyStringsByLevel);
  const [courseRowsUpdatedAtByLevel, setCourseRowsUpdatedAtByLevel] =
    useState<Record<CefrLevel, string>>(emptyStringsByLevel);
  const [courseUnitsByLevel, setCourseUnitsByLevel] = useState<
    Record<CefrLevel, CourseUnit[]>
  >(emptyUnitsByLevel);
  const [exerciseDataByLevel, setExerciseDataByLevel] = useState<
    Record<CefrLevel, CourseExerciseData | null>
  >(emptyExercisesByLevel);
  const [courseDataStatusByLevel, setCourseDataStatusByLevel] = useState<
    Record<CefrLevel, "loading" | "ready" | "error">
  >(emptyStatusesByLevel);
  const [courseLoadErrors, setCourseLoadErrors] = useState<
    Partial<Record<CefrLevel, string>>
  >({});
  const courseRows = courseRowsByLevel[selectedLevel] as A1CourseCsvRow[];
  const courseDraftRows =
    courseDraftRowsByLevel[selectedLevel] as A1CourseCsvRow[];
  const officialCourseRows =
    officialCourseRowsByLevel[selectedLevel] as A1CourseCsvRow[];
  const courseSourceRevision =
    courseSourceRevisionByLevel[selectedLevel];
  const courseRowsUpdatedAt =
    courseRowsUpdatedAtByLevel[selectedLevel];
  const courseUnits = courseUnitsByLevel[selectedLevel];
  const exerciseData = exerciseDataByLevel[
    selectedLevel
  ] as A1ExerciseData | null;
  const courseDataStatus = courseDataStatusByLevel[selectedLevel];
  const conversationSourceRows = useMemo(
    () => [
      ...(courseRowsByLevel.A1 as A1CourseCsvRow[]),
      ...(courseRowsByLevel.A2 as A1CourseCsvRow[]),
    ],
    [courseRowsByLevel.A1, courseRowsByLevel.A2],
  );
  const conversationCompletedLessonIds = useMemo(
    () => Array.from(new Set([
      ...multiProgress.levelProgress.A1.completedLessonIds,
      ...multiProgress.levelProgress.A2.completedLessonIds,
    ])),
    [
      multiProgress.levelProgress.A1.completedLessonIds,
      multiProgress.levelProgress.A2.completedLessonIds,
    ],
  );
  const conversationA2Unlocked = isLevelFormallyUnlocked(
    "A2",
    multiProgress.passedLevelIds,
  );
  const setCourseRows = (rows: A1CourseCsvRow[]) =>
    setCourseRowsByLevel((current) => ({
      ...current,
      [selectedLevel]: rows,
    }));
  const setCourseDraftRows = (
    update:
      | A1CourseCsvRow[]
      | ((rows: A1CourseCsvRow[]) => A1CourseCsvRow[]),
  ) =>
    setCourseDraftRowsByLevel((current) => {
      const rows = current[selectedLevel] as A1CourseCsvRow[];
      return {
        ...current,
        [selectedLevel]:
          typeof update === "function" ? update(rows) : update,
      };
    });
  const setCourseRowsUpdatedAt = (value: string) =>
    setCourseRowsUpdatedAtByLevel((current) => ({
      ...current,
      [selectedLevel]: value,
    }));
  const setCourseUnits = (units: CourseUnit[]) =>
    setCourseUnitsByLevel((current) => ({
      ...current,
      [selectedLevel]: units,
    }));
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(EMPTY_LESSON);
  const [stage, setStage] = useState<LearningStage>("intro");
  const [tokenIndex, setTokenIndex] = useState(0);
  const [recallValues, setRecallValues] = useState<string[]>([""]);
  const [recallAttempts, setRecallAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [recallAnswerRevealed, setRecallAnswerRevealed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rebuildValues, setRebuildValues] = useState<string[]>([]);
  const [rebuildStatus, setRebuildStatus] = useState<RebuildStatus[]>([]);
  const [rebuildAttempts, setRebuildAttempts] = useState(0);
  const [rebuildAnswerRevealed, setRebuildAnswerRevealed] = useState(false);
  const [recognitionSelectedId, setRecognitionSelectedId] = useState("");
  const [recognitionChecked, setRecognitionChecked] = useState(false);
  const [patternExampleIndex, setPatternExampleIndex] = useState(0);
  const [patternTransferValue, setPatternTransferValue] = useState("");
  const [patternTransferAttempts, setPatternTransferAttempts] = useState(0);
  const [patternTransferRevealed, setPatternTransferRevealed] =
    useState(false);
  const [patternTransferComplete, setPatternTransferComplete] =
    useState(false);
  const [textResponseSelectedId, setTextResponseSelectedId] = useState("");
  const [textResponseChecked, setTextResponseChecked] = useState(false);
  const [audioReplays, setAudioReplays] = useState(0);
  const [recallUsedPaste, setRecallUsedPaste] = useState(false);
  const [rebuildUsedPaste, setRebuildUsedPaste] = useState(false);
  const [patternTransferUsedPaste, setPatternTransferUsedPaste] =
    useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [audioMessage, setAudioMessage] = useState("");
  const [kkAudioMessage, setKkAudioMessage] = useState("");
  const [vocabularyDataset, setVocabularyDataset] =
    useState<VocabularyDataset | null>(null);
  const searchableVocabularyDataset = useMemo(
    () => vocabularyDataset
      ? withVocabularySearchAliases(
          vocabularyDataset,
          courseDataStatusByLevel.A2 === "ready" ? courseRowsByLevel.A2 : [],
        )
      : null,
    [vocabularyDataset, courseDataStatusByLevel.A2, courseRowsByLevel.A2],
  );
  const [vocabularyDataStatus, setVocabularyDataStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [vocabularyLoadError, setVocabularyLoadError] = useState("");
  const [vocabularyTargets, setVocabularyTargets] =
    useState<VocabularyTargetsData | null>(null);
  const [vocabularyTargetsError, setVocabularyTargetsError] = useState("");
  const [vocabularyLibrary, setVocabularyLibrary] =
    useState<VocabularyLibraryData | null>(null);
  const [vocabularyLibraryStatus, setVocabularyLibraryStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [vocabularyLibraryError, setVocabularyLibraryError] = useState("");
  const vocabularySupplements = useVocabularySupplements(screen === "vocabulary-library", vocabularyTargets);
  const [referenceRecognitionSession, setReferenceRecognitionSession] = useState<{
    title: string;
    questions: ReferenceRecognitionQuestion[];
  } | null>(null);
  const [vocabularySearch, setVocabularySearch] = useState("");
  const [vocabularyFilter, setVocabularyFilter] =
    useState<VocabularyStatusFilter>("all");
  const [activeVocabularyGroupId, setActiveVocabularyGroupId] =
    useState("");
  const [relatedCurrentLexemeId, setRelatedCurrentLexemeId] =
    useState("");
  const [openedVocabularyLexemeId, setOpenedVocabularyLexemeId] =
    useState("");
  const [vocabularyReturnContext, setVocabularyReturnContext] =
    useState<VocabularyCourseReturnContext | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentValue, setAssessmentValue] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminUnit, setAdminUnit] = useState("all");
  const [importReport, setImportReport] =
    useState<CourseValidationReport | null>(null);
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [progressStorageWritable, setProgressStorageWritable] =
    useState(true);
  const storageWarningShownRef = useRef(false);
  const [storageWriteFailed, setStorageWriteFailed] = useState(false);
  const mainNavRef = useRef<HTMLElement>(null);
  // Like autoFocus, but keeps the page where it is: on phones the home
  // action sits far below the fold and autoFocus scrolled past the plan.
  const focusOnMountWithoutScroll = useCallback(
    (node: HTMLElement | null) => {
      node?.focus({ preventScroll: true });
    },
    [],
  );
  // Storage failures must never unmount the app: warn once, keep the
  // in-memory state, and retry on the next change.
  const storageWriteFailedRef = useRef(false);
  const persistStorageItem = useCallback((key: string, value: string) => {
    const failed = !writeStorageItem(key, value).ok;
    // Persistence runs inside effects, so status updates are queued instead
    // of rendering synchronously from the calling effect.
    if (failed !== storageWriteFailedRef.current) {
      storageWriteFailedRef.current = failed;
      queueMicrotask(() => setStorageWriteFailed(failed));
    }
    if (!failed) {
      storageWarningShownRef.current = false;
      return true;
    }
    if (!storageWarningShownRef.current) {
      storageWarningShownRef.current = true;
      queueMicrotask(() => setToast(STORAGE_WRITE_FAILURE_MESSAGE));
    }
    return false;
  }, []);
  const [passageValues, setPassageValues] = useState<string[]>([]);
  const [passageEvaluation, setPassageEvaluation] =
    useState<PassageSentenceEvaluation[]>([]);
  const [passageAttempts, setPassageAttempts] = useState(0);
  const [passageAnswerRevealed, setPassageAnswerRevealed] = useState(false);
  const [passageQuestionIndex, setPassageQuestionIndex] = useState(0);
  const [passageAnswer, setPassageAnswer] = useState("");
  const [passageQuestionChecked, setPassageQuestionChecked] =
    useState(false);
  const [sessionRecognitionAttempts, setSessionRecognitionAttempts] =
    useState(0);
  const [sessionRecognitionCorrect, setSessionRecognitionCorrect] =
    useState(0);
  const [sessionTransferAttempts, setSessionTransferAttempts] =
    useState(0);
  const [sessionTransferCorrect, setSessionTransferCorrect] = useState(0);
  const [sessionPassageComprehensionAttempts, setSessionPassageComprehensionAttempts] =
    useState(0);
  const [sessionPassageComprehensionCorrect, setSessionPassageComprehensionCorrect] =
    useState(0);
  const [sessionTokenProgress, setSessionTokenProgress] =
    useState<TokenLearningProgressMap>({});
  const [dailySession, setDailySession] =
    useState<DailySessionState | null>(null);
  const dailySessionRef = useRef<DailySessionState | null>(null);
  const dailyLastCheckpointRef = useRef(0);
  const [dailyReviewValue, setDailyReviewValue] = useState("");
  const [dailyReviewFeedback, setDailyReviewFeedback] = useState("");
  const [dailyReviewResultItemId, setDailyReviewResultItemId] = useState("");
  const [weaknessPracticeQueue, setWeaknessPracticeQueue] =
    useState<string[]>([]);
  const [weaknessPracticeIndex, setWeaknessPracticeIndex] = useState(0);
  const [weaknessPracticeValue, setWeaknessPracticeValue] = useState("");
  const [weaknessPracticeChecked, setWeaknessPracticeChecked] =
    useState(false);
  const [weaknessPracticeAttempts, setWeaknessPracticeAttempts] =
    useState(0);
  const [weaknessPracticeRevealed, setWeaknessPracticeRevealed] =
    useState(false);
  const [weaknessPracticeUsedPaste, setWeaknessPracticeUsedPaste] =
    useState(false);
  const [weaknessPracticeFeedback, setWeaknessPracticeFeedback] =
    useState("");
  const [weaknessPracticeStartedAt, setWeaknessPracticeStartedAt] =
    useState(0);
  const [weaknessPracticeReturnScreen, setWeaknessPracticeReturnScreen] =
    useState<"weakness" | "daily-summary">("weakness");
  const [speechSupported, setSpeechSupported] = useState(
    () =>
      typeof window === "undefined" ||
      (typeof window.speechSynthesis?.speak === "function" &&
        typeof SpeechSynthesisUtterance === "function"),
  );
  const commitDailySession = useCallback(
    (next: DailySessionState | null, persistImmediately = false) => {
      dailySessionRef.current = next;
      setDailySession(next);
      if (!persistImmediately || typeof window === "undefined") return;
      if (next) {
        persistStorageItem(STORAGE.dailySession, JSON.stringify(next));
      } else {
        removeStorageItem(STORAGE.dailySession);
      }
    },
    [persistStorageItem],
  );
  const clearDailySession = useCallback(
    (message = "") => {
      commitDailySession(null, true);
      STORAGE.legacyDailySessions.forEach((key) => removeStorageItem(key));
      setDailyReviewValue("");
      setDailyReviewFeedback("");
      setDailyReviewResultItemId("");
      setWeaknessPracticeQueue([]);
      setWeaknessPracticeIndex(0);
      setWeaknessPracticeValue("");
      setWeaknessPracticeChecked(false);
      setWeaknessPracticeAttempts(0);
      setWeaknessPracticeRevealed(false);
      setWeaknessPracticeUsedPaste(false);
      setWeaknessPracticeFeedback("");
      setScreen("home");
      if (message) setToast(message);
    },
    [commitDailySession],
  );
  const dailyFlowIsActive = Boolean(
    dailySession &&
      ((screen === "review" && nextDailySessionStep(dailySession) === "review") ||
        (screen === "learning" &&
          dailySession.level === selectedLevel &&
          dailySession.lessonId === selectedLesson.id) ||
        (screen === "weakness-practice" &&
          weaknessPracticeReturnScreen === "daily-summary")),
  );
  const recallInputs = useRef<Array<HTMLInputElement | null>>([]);
  const pageContentRef = useRef<HTMLDivElement | null>(null);
  const pageFocusRouteRef = useRef<string | null>(null);
  const kkAudioRef = useRef<HTMLAudioElement | null>(null);
  const kkPlaybackToken = useRef(0);
  const targetLexemeAliasIndex = useMemo(
    () =>
      vocabularyTargets
        ? buildVocabularyTargetAliasIndex(vocabularyTargets)
        : new Map<string, string>(),
    [vocabularyTargets],
  );
  const curriculumLexemeAliasIndex = useMemo(() => {
    const aliases = new Map<string, string>();
    CEFR_LEVELS.forEach((level) => {
      courseRowsByLevel[level].forEach((row) => {
        const source = canonicalizeLexemeId(row.lexeme_id);
        const lemma = canonicalizeLexemeId(row.lemma || row.lexeme_id);
        if (source && lemma) aliases.set(source, lemma);
      });
    });
    return aliases;
  }, [courseRowsByLevel]);
  const vocabularyPracticeSources = useMemo(() => {
    const sources = new Map<string, WeaknessPracticeSource>();
    const targetIds = new Set(
      vocabularyTargets?.entries.map((entry) => entry.lexemeId) ?? [],
    );
    (["A1", "A2"] as CefrLevel[]).forEach((level) => {
      flattenCourseLessons(courseUnitsByLevel[level]).forEach((lesson) => {
        lesson.tokens.forEach((token) => {
          const sourceId = canonicalizeLexemeId(
            token.lexemeId ?? token.tokenId ?? token.id,
          );
          const canonical =
            targetLexemeAliasIndex.get(sourceId) ??
            curriculumLexemeAliasIndex.get(sourceId) ??
            sourceId;
          if (!canonical || !targetIds.has(canonical) || sources.has(canonical)) {
            return;
          }
          sources.set(canonical, {
            occurrenceId: token.occurrenceId,
            lexemeId: canonical,
            answer: token.answer,
            prompt: token.prompt,
            lessonId: lesson.id,
            sentenceId: lesson.sentenceId,
            sentence: lesson.sentence,
            translation: lesson.translation,
            level,
          });
        });
      });
    });
    return sources;
  }, [
    courseUnitsByLevel,
    curriculumLexemeAliasIndex,
    targetLexemeAliasIndex,
    vocabularyTargets,
  ]);
  const dailyReviewSources = useMemo<DailyReviewSource[]>(() => {
    return (["A1", "A2"] as CefrLevel[]).flatMap((level) =>
      flattenCourseLessons(courseUnitsByLevel[level]).flatMap((lesson) =>
        lesson.tokens.flatMap((token) => {
          const sourceId = canonicalizeLexemeId(
            token.lexemeId ?? token.tokenId ?? token.id,
          );
          const lexemeId =
            targetLexemeAliasIndex.get(sourceId) ??
            curriculumLexemeAliasIndex.get(sourceId) ??
            sourceId;
          if (!lexemeId) return [];
          return [{
            occurrenceId: token.occurrenceId,
            lexemeId,
            level,
            answer: token.answer,
            prompt: token.prompt,
            lessonId: lesson.id,
            sentenceId: lesson.sentenceId,
            sentence: lesson.sentence,
            translation: lesson.translation,
          }];
        }),
      ),
    );
  }, [
    courseUnitsByLevel,
    curriculumLexemeAliasIndex,
    targetLexemeAliasIndex,
  ]);

  const recordVocabularyEvidence = (
    lexemeIds: string[],
    kind: VocabularyEvidenceKind,
    evidenceId: string,
    sourceLevel: CefrLevel = selectedLevel,
    studiedAt = new Date().toISOString(),
  ) => {
    const canonicalLexemeIds = lexemeIds.map(
      (lexemeId) => {
        const source = canonicalizeLexemeId(lexemeId);
        return (
          targetLexemeAliasIndex.get(source) ??
          curriculumLexemeAliasIndex.get(source) ??
          source
        );
      },
    );
    setMultiProgress((current) => ({
      ...current,
      vocabularyProgress: recordGlobalVocabularyEvidence(
        current.vocabularyProgress,
        {
          lexemeIds: canonicalLexemeIds,
          kind,
          evidenceId,
          sourceLevel,
          studiedAt,
          studyDate: localDateKey(new Date(studiedAt)),
        },
      ),
    }));
  };

  const recordVocabularyLibraryEvidence = (
    input: VocabularyLibraryEvidenceInput,
  ) => {
    if (!vocabularyLibrary || !vocabularyTargets) return;
    if (input.kind === "application") {
      if (!vocabularySupplements.applications) throw new Error("句子應用來源尚未載入，未變更進度。");
      const data = vocabularySupplements.applications;
      const studiedAt = new Date().toISOString();
      // Revalidate synchronously so the practice UI cannot report completion on
      // an expired/tampered question; then update against the newest progress.
      recordVocabularyApplicationResult({}, data, vocabularyTargets, input.question, input.answer, { studiedAt, usedPaste: input.usedPaste, answerRevealed: input.answerRevealed });
      setMultiProgress((current) => ({ ...current, vocabularyProgress: recordVocabularyApplicationResult(current.vocabularyProgress, data, vocabularyTargets, input.question, input.answer, { studiedAt, usedPaste: input.usedPaste, answerRevealed: input.answerRevealed }) }));
      return;
    }
    const expectedMode =
      input.kind === "recognition" ? "recognition" : "spelling";
    if (input.question.mode !== expectedMode) {
      setToast("3000 單字練習模式與題目不一致，未變更進度。");
      return;
    }
    const studiedAt = new Date().toISOString();
    const studyDate = localDateKey(new Date(studiedAt));
    setMultiProgress((current) => {
      try {
        return {
          ...current,
          vocabularyProgress: recordVocabularyLibraryPracticeResult(
            current.vocabularyProgress,
            {
              library: vocabularyLibrary,
              targets: vocabularyTargets,
              question: input.question,
              selectedAnswer: input.answer,
              studiedAt,
              studyDate,
              usedPaste: input.usedPaste,
              answerRevealed: input.answerRevealed,
            },
          ),
        };
      } catch (error) {
        setToast(
          error instanceof Error
            ? error.message
            : "3000 單字作答紀錄失敗，未變更進度。",
        );
        return current;
      }
    });
  };

  useEffect(() => {
    let active = true;
    const loadLevels = async () => {
      try {
        const nextCatalog = await loadCurriculumCatalog();
        const a1Entry = catalogEntryForLevel(nextCatalog, "A1");
        const a1Level = await loadCourseLevel(nextCatalog, "A1");
        const a1Exercises = await loadCourseExerciseData(
          a1Entry.patternExercisesUrl,
          a1Entry.readingExercisesUrl,
        );
        const a1PatternReport = validatePatternExerciseData(
          a1Exercises.patterns,
          a1Level.rows,
        );
        const a1ReadingReport = validateReadingExerciseData(
          a1Exercises.reading,
          a1Level.rows,
          a1Exercises.patterns,
        );
        if (!a1PatternReport.valid || !a1ReadingReport.valid) {
          throw new Error(
            [
              ...a1PatternReport.errors,
              ...a1ReadingReport.errors,
            ].join("\n"),
          );
        }

        let a1Rows = a1Level.rows as A1CourseCsvRow[];
        let a1Units = a1Level.units;
        let a1UpdatedAt = new Date().toISOString();
        const storedRows = readStorageItem(STORAGE.courseRows);
        if (storedRows) {
          try {
            const restored = restoreStoredA1CourseData(
              storedRows,
              a1Rows,
              a1Level.sourceRevision,
            );
            if (restored) {
              a1Rows = restored.rows;
              a1Units = buildCourseUnitsFromRows(restored.rows);
              a1UpdatedAt = restored.updatedAt;
            } else {
              removeStorageItem(STORAGE.courseRows);
            }
          } catch {
            removeStorageItem(STORAGE.courseRows);
          }
        }
        if (!active) return;
        setCatalog(nextCatalog);
        setOfficialCourseRowsByLevel((current) => ({
          ...current,
          A1: a1Level.rows,
        }));
        setCourseSourceRevisionByLevel((current) => ({
          ...current,
          A1: a1Level.sourceRevision,
        }));
        setCourseRowsUpdatedAtByLevel((current) => ({
          ...current,
          A1: a1UpdatedAt,
        }));
        setCourseRowsByLevel((current) => ({ ...current, A1: a1Rows }));
        setCourseDraftRowsByLevel((current) => ({
          ...current,
          A1: a1Rows,
        }));
        setCourseUnitsByLevel((current) => ({
          ...current,
          A1: a1Units,
        }));
        setExerciseDataByLevel((current) => ({
          ...current,
          A1: a1Exercises,
        }));
        setSelectedLesson(a1Units[0]?.lessons[0] ?? EMPTY_LESSON);
        setCourseDataStatusByLevel((current) => ({
          ...current,
          A1: "ready",
        }));

        let prerequisiteRows: CourseCsvRow[] = [...a1Level.rows];
        let prerequisiteReady = true;
        const advancedEntries = runtimeCatalogEntries(nextCatalog).filter(
          (entry) => entry.level !== "A1",
        );
        for (const entry of advancedEntries) {
          const level = entry.level;
          if (!prerequisiteReady) {
            const message = `${level} 的前置程度資料尚未成功載入。`;
            setCourseLoadErrors((current) => ({
              ...current,
              [level]: message,
            }));
            setCourseDataStatusByLevel((current) => ({
              ...current,
              [level]: "error",
            }));
            continue;
          }
          try {
            const loadedLevel = await loadCourseLevel(
              nextCatalog,
              level,
            );
            const exercises = await loadCourseExerciseData(
              entry.patternExercisesUrl,
              entry.readingExercisesUrl,
            );
            let rows = loadedLevel.rows;
            let units = loadedLevel.units;
            let updatedAt = new Date().toISOString();
            const storageKey = courseRowsStorageKey(level);
            const storedRows = readStorageItem(storageKey);
            if (storedRows) {
              try {
                const restored = restoreStoredCourseData(
                  storedRows,
                  entry,
                  loadedLevel.rows,
                  loadedLevel.sourceRevision,
                );
                if (restored) {
                  rows = restored.rows;
                  units = buildGenericCourseUnitsFromRows(
                    restored.rows,
                    entry.sourceVersion,
                  );
                  updatedAt = restored.updatedAt;
                } else {
                  removeStorageItem(storageKey);
                }
              } catch {
                removeStorageItem(storageKey);
              }
            }
            const patternReport = validatePatternExerciseData(
              exercises.patterns,
              rows,
              level,
              prerequisiteRows,
            );
            const readingReport = validateReadingExerciseData(
              exercises.reading,
              rows,
              exercises.patterns,
              prerequisiteRows,
            );
            if (!patternReport.valid || !readingReport.valid) {
              throw new Error(
                [
                  ...patternReport.errors,
                  ...readingReport.errors,
                ].join("\n"),
              );
            }
            if (!active) return;
            setOfficialCourseRowsByLevel((current) => ({
              ...current,
              [level]: loadedLevel.rows,
            }));
            setCourseSourceRevisionByLevel((current) => ({
              ...current,
              [level]: loadedLevel.sourceRevision,
            }));
            setCourseRowsUpdatedAtByLevel((current) => ({
              ...current,
              [level]: updatedAt,
            }));
            setCourseRowsByLevel((current) => ({
              ...current,
              [level]: rows,
            }));
            setCourseDraftRowsByLevel((current) => ({
              ...current,
              [level]: rows,
            }));
            setCourseUnitsByLevel((current) => ({
              ...current,
              [level]: units,
            }));
            setExerciseDataByLevel((current) => ({
              ...current,
              [level]: exercises,
            }));
            setCourseDataStatusByLevel((current) => ({
              ...current,
              [level]: "ready",
            }));
            prerequisiteRows = [
              ...prerequisiteRows,
              ...loadedLevel.rows,
            ];
          } catch (error) {
            if (!active) return;
            prerequisiteReady = false;
            const message =
              error instanceof Error
                ? error.message
                : `${level} 試行課程資料載入失敗。`;
            setCourseLoadErrors((current) => ({
              ...current,
              [level]: message,
            }));
            setCourseDataStatusByLevel((current) => ({
              ...current,
              [level]: "error",
            }));
          }
        }
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error
            ? error.message
            : "A1 正式課程資料載入失敗。";
        setCourseLoadErrors((current) => ({
          ...current,
          A1: message,
        }));
        setCourseDataStatusByLevel((current) => ({
          ...current,
          A1: "error",
        }));
        setToast("A1 正式課程資料暫時無法載入，請重新整理後再試。");
      }
    };
    void loadLevels();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedProgress = readStorageItem(STORAGE.progress);
      const storedSettings = readStorageItem(STORAGE.settings);
      const storedDailySession = readStorageItem(STORAGE.dailySession);
      try {
        if (storedProgress) {
          setMultiProgress(
            migrateProgressToV6(JSON.parse(storedProgress)),
          );
        }
      } catch {
        setProgressStorageWritable(false);
        setToast(
          "進度遷移失敗，已進入安全 A1 模式；原始本機進度未被覆蓋。",
        );
      }
      try {
        if (storedSettings) {
          setSettings(normalizeSettings(JSON.parse(storedSettings)));
        }
      } catch {
        setToast("偏好設定無法讀取，已使用安全的預設值。");
      }
      if (storedDailySession) {
        const restoredSession = restoreDailySession(
          storedDailySession,
          localDateKey(),
        );
        if (restoredSession) {
          commitDailySession(restoredSession);
        } else {
          removeStorageItem(STORAGE.dailySession);
        }
      }
      STORAGE.legacyDailySessions.forEach((key) => removeStorageItem(key));
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [commitDailySession]);

  useEffect(() => {
    if (!loaded || !progressStorageWritable) return;
    persistStorageItem(
      STORAGE.progress,
      JSON.stringify(multiProgress),
    );
  }, [loaded, multiProgress, persistStorageItem, progressStorageWritable]);

  useEffect(() => {
    if (!loaded) return;
    persistStorageItem(STORAGE.settings, JSON.stringify(settings));
  }, [loaded, persistStorageItem, settings]);

  useEffect(() => {
    if (!loaded) return;
    if (dailySession) {
      persistStorageItem(STORAGE.dailySession, JSON.stringify(dailySession));
      return;
    }
    removeStorageItem(STORAGE.dailySession);
  }, [dailySession, loaded, persistStorageItem]);

  useEffect(() => {
    if (!loaded) return;
    const syncActivity = (shouldStart: boolean) => {
      const current = dailySessionRef.current;
      if (!current) return;
      if (!isDailySessionCurrentDay(current)) {
        clearDailySession(
          "日期已變更，昨天的今日學習已結束，請重新開始今天的學習。",
        );
        return;
      }
      const next = shouldStart
        ? startDailyActiveSegment(current, timestamp())
        : pauseDailyActiveSegment(current, timestamp());
      if (next !== current) commitDailySession(next, !shouldStart);
    };
    const handleVisibilityChange = () =>
      syncActivity(
        document.visibilityState === "visible" && dailyFlowIsActive,
      );
    const handlePageHide = () => syncActivity(false);
    const handleBeforeUnload = () => syncActivity(false);
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    const current = new Date();
    const nextMidnight = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + 1,
    ).getTime();
    const midnightTimer = window.setTimeout(() => {
      const session = dailySessionRef.current;
      if (session && !isDailySessionCurrentDay(session)) {
        clearDailySession(
          "日期已變更，昨天的今日學習已結束，請重新開始今天的學習。",
        );
      }
    }, Math.max(0, nextMidnight - timestamp()) + 50);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.clearTimeout(midnightTimer);
      if (dailyFlowIsActive) syncActivity(false);
    };
  }, [
    clearDailySession,
    commitDailySession,
    dailyFlowIsActive,
    dailySession?.localDate,
    loaded,
  ]);

  useEffect(() => {
    if (!loaded) return;
    const checkpointActivity = (event: Event) => {
      const current = dailySessionRef.current;
      if (!current) return;
      if (!isDailySessionCurrentDay(current)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        clearDailySession(
          "日期已變更，昨天的今日學習已結束，請重新開始今天的學習。",
        );
        return;
      }
      if (!dailyFlowIsActive || document.visibilityState !== "visible") return;
      const now = timestamp();
      if (now - dailyLastCheckpointRef.current < 15_000) return;
      dailyLastCheckpointRef.current = now;
      const next = checkpointDailyActiveSegment(current, now);
      if (next !== current) commitDailySession(next, true);
    };
    document.addEventListener("pointerdown", checkpointActivity, true);
    document.addEventListener("keydown", checkpointActivity, true);
    return () => {
      document.removeEventListener("pointerdown", checkpointActivity, true);
      document.removeEventListener("keydown", checkpointActivity, true);
    };
  }, [
    clearDailySession,
    commitDailySession,
    dailyFlowIsActive,
    loaded,
  ]);

  useEffect(() => {
    if (
      !loaded ||
      canAccessLevel(
        multiProgress.selectedLevel,
        multiProgress.passedLevelIds,
        settings.showAdvancedPilots,
        catalog?.levels.find(
          (entry) => entry.level === multiProgress.selectedLevel,
        )?.status,
      )
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      setMultiProgress((current) => ({
        ...current,
        selectedLevel: "A1",
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    loaded,
    multiProgress.passedLevelIds,
    multiProgress.selectedLevel,
    settings.showAdvancedPilots,
    catalog,
  ]);

  useEffect(() => {
    const a1Rows = courseRowsByLevel.A1 as A1CourseCsvRow[];
    const a1Revision = courseSourceRevisionByLevel.A1;
    const a1UpdatedAt = courseRowsUpdatedAtByLevel.A1;
    if (
      !loaded ||
      courseDataStatusByLevel.A1 !== "ready" ||
      a1Rows.length === 0 ||
      !a1Revision ||
      !a1UpdatedAt
    ) {
      return;
    }
    persistStorageItem(
      STORAGE.courseRows,
      JSON.stringify(
        createStoredA1CourseData(
          a1Rows,
          a1Revision,
          a1UpdatedAt,
        ),
      ),
    );
  }, [
    persistStorageItem,
    courseDataStatusByLevel.A1,
    courseRowsByLevel.A1,
    courseRowsUpdatedAtByLevel.A1,
    courseSourceRevisionByLevel.A1,
    loaded,
  ]);

  useEffect(() => {
    const a1Rows = courseRowsByLevel.A1;
    if (
      courseDataStatusByLevel.A1 !== "ready" ||
      a1Rows.length === 0
    ) {
      return;
    }
    let active = true;
    loadVocabularyDataset(a1Rows)
      .then((dataset) => {
        if (!active) return;
        const storedGroupId =
          readStorageItem(STORAGE.lastVocabularyGroup) ?? "";
        const initialGroupId = dataset.groups.some(
          (group) => group.id === storedGroupId,
        )
          ? storedGroupId
          : dataset.groups[0]?.id ?? "";
        setVocabularyDataset(dataset);
        setActiveVocabularyGroupId((current) =>
          dataset.groups.some((group) => group.id === current)
            ? current
            : initialGroupId,
        );
        setVocabularyLoadError("");
        setVocabularyDataStatus("ready");
      })
      .catch((error) => {
        if (!active) return;
        setVocabularyDataset(null);
        setVocabularyLoadError(
          error instanceof Error
            ? error.message
            : "相關字詞資料暫時無法載入。",
        );
        setVocabularyDataStatus("error");
      });
    return () => {
      active = false;
    };
  }, [courseDataStatusByLevel.A1, courseRowsByLevel.A1]);

  useEffect(() => {
    if (
      screen !== "related-vocabulary" ||
      !vocabularyReturnContext ||
      !relatedCurrentLexemeId ||
      vocabularyDataStatus !== "ready"
    ) return;
    const frame = window.requestAnimationFrame(() => {
      const card = document.getElementById(`related-word-${relatedCurrentLexemeId}`);
      card?.focus({ preventScroll: true });
      card?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [screen, vocabularyReturnContext, relatedCurrentLexemeId, vocabularyDataStatus]);

  useEffect(() => {
    const route = `${selectedLevel}:${screen}`;
    const frame = window.requestAnimationFrame(() => {
      const content = pageContentRef.current;
      if (!content) return;
      const routeChanged = pageFocusRouteRef.current !== route;
      pageFocusRouteRef.current = route;
      const active = document.activeElement;
      // Keep input autofocus and the course-to-vocabulary card shortcut.
      if (active !== content && content.contains(active)) return;
      // Late data loading must not steal focus after the learner moves away.
      if (!routeChanged && active !== content) return;
      const target = content.querySelector<HTMLElement>("h1") ?? content;
      target.tabIndex = -1;
      target.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [screen, selectedLevel, courseDataStatus, vocabularyDataStatus]);

  useEffect(() => {
    let active = true;
    loadVocabularyTargets()
      .then((data) => {
        if (!active) return;
        setVocabularyTargets(data);
        setVocabularyTargetsError("");
      })
      .catch((error) => {
        if (!active) return;
        setVocabularyTargets(null);
        setVocabularyTargetsError(
          error instanceof Error ? error.message : "詞彙目標資料暫時無法載入。",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (screen !== "vocabulary-library") return;
    let active = true;
    if (vocabularyLibrary) {
      return () => {
        active = false;
      };
    }
    if (!vocabularyTargets) {
      const targetStateTimer = window.setTimeout(() => {
        if (!active) return;
        setVocabularyLibraryStatus(vocabularyTargetsError ? "error" : "loading");
        setVocabularyLibraryError(vocabularyTargetsError);
      }, 0);
      return () => {
        active = false;
        window.clearTimeout(targetStateTimer);
      };
    }

    const controller = new AbortController();
    const loadTimer = window.setTimeout(() => {
      if (!active) return;
      setVocabularyLibraryStatus("loading");
      setVocabularyLibraryError("");
      loadVocabularyLibrary(vocabularyTargets, (input, init) =>
        fetch(input, { ...init, signal: controller.signal }),
      )
        .then((data) => {
          if (!active) return;
          setVocabularyLibrary(data);
          setVocabularyLibraryStatus("ready");
        })
        .catch((error: unknown) => {
          if (!active) return;
          setVocabularyLibrary(null);
          setVocabularyLibraryStatus("error");
          setVocabularyLibraryError(
            error instanceof Error
              ? error.message
              : "3000 單字資料驗證失敗。",
          );
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadTimer);
      controller.abort();
    };
  }, [screen, vocabularyLibrary, vocabularyTargets, vocabularyTargetsError]);

  useEffect(() => {
    if (!loaded || !catalog) return;
    catalog.levels
      .filter((entry) => entry.level !== "A1")
      .forEach((entry) => {
        const level = entry.level;
        if (
          courseDataStatusByLevel[level] !== "ready" ||
          courseRowsByLevel[level].length === 0 ||
          !courseSourceRevisionByLevel[level] ||
          !courseRowsUpdatedAtByLevel[level]
        ) {
          return;
        }
        persistStorageItem(
          courseRowsStorageKey(level),
          JSON.stringify(
            createStoredCourseData(
              entry,
              courseRowsByLevel[level],
              courseSourceRevisionByLevel[level],
              courseRowsUpdatedAtByLevel[level],
            ),
          ),
        );
      });
  }, [
    persistStorageItem,
    catalog,
    courseDataStatusByLevel,
    courseRowsByLevel,
    courseRowsUpdatedAtByLevel,
    courseSourceRevisionByLevel,
    loaded,
  ]);

  useEffect(() => {
    const units = courseUnitsByLevel[selectedLevel];
    if (
      courseDataStatusByLevel[selectedLevel] !== "ready" ||
      units.length === 0
    ) {
      return;
    }
    const lessonExists = units.some((unit) =>
      unit.lessons.some((lesson) => lesson.id === selectedLesson.id),
    );
    if (!lessonExists) {
      const timer = window.setTimeout(() => {
        setSelectedLesson(units[0].lessons[0] ?? EMPTY_LESSON);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [
    courseDataStatusByLevel,
    courseUnitsByLevel,
    selectedLesson.id,
    selectedLevel,
  ]);

  useEffect(() => {
    // Phones show the navigation as one horizontal row; keep the current
    // destination in view without moving the page vertically.
    const nav = mainNavRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const current = nav.querySelector<HTMLElement>("[aria-current=\"page\"]");
    if (!current) return;
    const left = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, left) });
  }, [screen]);

  useEffect(() => {
    if (!toast) return;
    // Storage warnings ask the learner to act, so they stay readable longer.
    const timer = window.setTimeout(
      () => setToast(""),
      toast === STORAGE_WRITE_FAILURE_MESSAGE ? 9000 : 2600,
    );
    return () => window.clearTimeout(timer);
  }, [toast]);

  const allLessons = useMemo(
    () => flattenCourseLessons(courseUnits),
    [courseUnits],
  );

  const vocabularyLibraryEntries = useMemo<VocabularyLibraryPanelEntry[]>(() => {
    if (!vocabularyLibrary || !vocabularyTargets) return [];
    const targetById = new Map(
      vocabularyTargets.entries.map((target) => [target.lexemeId, target]),
    );
    return vocabularyLibrary.entries.flatMap((entry) => {
      const target = targetById.get(entry.lexemeId);
      if (!target) return [];
      return [{
        entry: {
          ...entry,
          targetLevel: target.targetLevel,
          masteryTarget: target.masteryTarget,
          searchAliases: [
            ...target.topics,
            target.targetLevel,
            target.masteryTarget,
            entry.sourceSenseId ?? "",
            entry.wordnetSynsetId ?? "",
            ...(entry.meaningVariants ?? []),
            ...(entry.wordnetSynsetIds ?? []),
            ...entry.sourceRefs.flatMap((source) => [
              source.sourceName,
              source.sourceVersion,
              source.sourceType,
              source.license,
              source.reference,
              source.attribution ?? "",
            ]),
          ],
        },
        priority: target.curriculumPriority,
      }];
    }).sort((left, right) => left.priority - right.priority)
      .map((item) => item.entry);
  }, [vocabularyLibrary, vocabularyTargets]);

  const selectedUnit = useMemo(
    () =>
      courseUnits.find((unit) =>
        unit.lessons.some((item) => item.id === selectedLesson.id),
      ) ??
      courseUnits[0] ??
      EMPTY_UNIT,
    [courseUnits, selectedLesson.id],
  );

  const completedCount = progress.completedLessonIds.length;
  const coursePercent = allLessons.length
    ? Math.round((completedCount / allLessons.length) * 100)
    : 0;
  const dueReviews = Object.values(progress.reviewItems).filter(
    (item) => new Date(item.dueAt).getTime() <= timestamp(),
  );
  const vocabularyWeaknesses = useMemo(
    () =>
      buildVocabularyWeaknesses(
        multiProgress.vocabularyProgress,
        vocabularyTargets,
      ),
    [multiProgress.vocabularyProgress, vocabularyTargets],
  );
  const personalVocabularySummary = useMemo(
    () =>
      summarizeVocabularyProgress(
        multiProgress.vocabularyProgress,
        vocabularyTargets?.entries.map((entry) => entry.lexemeId),
      ),
    [multiProgress.vocabularyProgress, vocabularyTargets],
  );
  const accuracy = progress.totalAttempts
    ? Math.round((progress.correctAnswers / progress.totalAttempts) * 100)
    : 0;
  const weeklyStudyDays = studyDaysThisWeek(progress.studyDates);

  const getToken = (_lessonItem: Lesson, token: LearningToken) => token;

  const currentToken = getToken(
    selectedLesson,
    selectedLesson.tokens[tokenIndex] ?? EMPTY_TOKEN,
  );
  const basePassageLessons = useMemo(
    () => lessonsForPassage(allLessons, selectedLesson.passageId),
    [allLessons, selectedLesson.passageId],
  );
  const selectedPassageComprehension = exerciseData
    ? comprehensionForPassage(
        exerciseData.reading,
        selectedLesson.passageId,
      )
    : undefined;
  const selectedPassageLessons = useMemo(() => {
    const customSentences = selectedPassageComprehension?.sentences;
    if (!customSentences?.length) {
      return basePassageLessons;
    }
    return [...customSentences]
      .sort((left, right) => left.order - right.order)
      .map((sentence, index) => ({
        ...(basePassageLessons[index] ?? selectedLesson),
        id:
          basePassageLessons[index]?.id ??
          `${selectedLesson.id}-passage-${index + 1}`,
        sentenceId: sentence.id,
        sentenceOrder: sentence.order,
        sentence: sentence.sentence,
        translation: sentence.translation,
      }));
  }, [
    basePassageLessons,
    selectedLesson,
    selectedPassageComprehension,
  ]);
  const selectedRecognition = exerciseData
    ? recognitionForLesson(exerciseData.reading, selectedLesson.id)
    : undefined;
  const selectedPatternExamples = exerciseData
    ? patternExamplesForLesson(
        exerciseData.patterns,
        selectedLesson.id,
      )
    : [];
  const selectedTransferPatternId =
    selectedPatternExamples[0]?.sentencePatternId ??
    selectedLesson.sentencePatternId;
  const selectedTransferPatternName =
    allLessons.find(
      (lesson) =>
        lesson.sentencePatternId === selectedTransferPatternId,
    )?.patternName ?? selectedTransferPatternId;
  const selectedTextResponse = exerciseData
    ? textResponseForLesson(exerciseData.reading, selectedLesson.id)
    : undefined;
  const currentPatternExample =
    selectedPatternExamples[patternExampleIndex];
  const transferReviewSource = currentPatternExample
    ? allLessons.find((lesson) =>
        lesson.sentenceId === currentPatternExample.sourceSentenceId &&
        lesson.id !== selectedLesson.id,
      )
    : undefined;
  const currentPassageQuestion =
    selectedPassageComprehension?.questions[passageQuestionIndex];
  const choiceStageFocusId = screen !== "learning"
    ? ""
    : stage === "reading-recognition" && selectedRecognition
      ? recognitionChecked
        ? "recognition-next-button"
        : `recognition-option-${selectedRecognition.options[0]?.id}`
      : stage === "text-response" && selectedTextResponse
        ? textResponseChecked
          ? "text-response-next-button"
          : `text-response-option-${selectedTextResponse.options[0]?.id}`
        : stage === "passage-comprehension" && currentPassageQuestion
          ? passageQuestionChecked
            ? "passage-question-next-button"
            : "passage-answer-0"
          : "";
  useEffect(() => {
    if (!choiceStageFocusId) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(choiceStageFocusId)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [choiceStageFocusId]);
  const currentTokenHintLevel =
    progress.tokenHintLevels[currentToken.occurrenceId] ?? 1;
  const currentTokenWords = currentToken.answer.trim().split(/\s+/).filter(Boolean);
  const recallAnswer = recallValues.join(" ");
  const tokenAudioAvailable =
    speechSupported ||
    (currentToken.audioStatus === "ready" && Boolean(currentToken.wordAudioSource?.trim()));
  const sentenceAudioAvailable =
    speechSupported ||
    (selectedLesson.audioStatus === "ready" && Boolean(selectedLesson.sentenceAudioSource?.trim()));
  const selectedCatalogEntry = catalog
    ? catalogEntryForLevel(catalog, selectedLevel)
    : null;

  const isPilotQaPreview =
    selectedCatalogEntry?.status === "pilot" &&
    settings.showAdvancedPilots;
  const isUnitAvailable = (unitIndex: number) =>
    isPilotQaPreview ||
    unitIndex === 0 ||
    progress.passedUnitIds.includes(courseUnits[unitIndex - 1].id);

  const isLessonAvailable = (unit: CourseUnit, unitIndex: number, itemIndex: number) =>
    isPilotQaPreview ||
    (isUnitAvailable(unitIndex) &&
      (itemIndex === 0 ||
        progress.completedLessonIds.includes(
          unit.lessons[itemIndex - 1].id,
        )));

  const nextLesson = (() => {
    for (let unitIndex = 0; unitIndex < courseUnits.length; unitIndex += 1) {
      const unit = courseUnits[unitIndex];
      for (let itemIndex = 0; itemIndex < unit.lessons.length; itemIndex += 1) {
        const item = unit.lessons[itemIndex];
        if (
          !progress.completedLessonIds.includes(item.id) &&
          isLessonAvailable(unit, unitIndex, itemIndex)
        ) {
          return item;
        }
      }
    }
    return allLessons[allLessons.length - 1] ?? EMPTY_LESSON;
  })();

  const levelStatusLabel =
    selectedCatalogEntry?.status === "pilot" ? "試行課程" : "正式課程";
  const switchLevel = (level: CefrLevel) => {
    if (
      !canAccessLevel(
        level,
        multiProgress.passedLevelIds,
        settings.showAdvancedPilots,
        catalog?.levels.find((entry) => entry.level === level)?.status,
      )
    ) {
      const entry = catalog
        ? catalogEntryForLevel(catalog, level)
        : null;
      setToast(
        entry?.prerequisiteLevel
          ? `${level} 需先通過 ${entry.prerequisiteLevel} 程度後正式解鎖。`
          : `${level} 尚未解鎖。`,
      );
      return;
    }
    setMultiProgress((current) => ({
      ...current,
      selectedLevel: level,
    }));
    setAdminUnit("all");
    setImportReport(null);
    const units = courseUnitsByLevel[level];
    setSelectedLesson(units[0]?.lessons[0] ?? EMPTY_LESSON);
  };

  const levelSummary = (level: CefrLevel) => {
    const levelUnits = courseUnitsByLevel[level];
    const levelLessons = flattenCourseLessons(levelUnits);
    const levelProgress = multiProgress.levelProgress[level];
    const dueCount = Object.values(levelProgress.reviewItems).filter(
      (item) => new Date(item.dueAt).getTime() <= timestamp(),
    ).length;
    const levelAccuracy = levelProgress.totalAttempts
      ? Math.round(
          (levelProgress.correctAnswers /
            levelProgress.totalAttempts) *
            100,
        )
      : 0;
    return {
      unitCount: levelUnits.length,
      completed: levelProgress.completedLessonIds.length,
      total: levelLessons.length,
      accuracy: levelAccuracy,
      dueCount,
      status:
        level !== "A1" &&
        !isLevelFormallyUnlocked(
          level,
          multiProgress.passedLevelIds,
        )
          ? settings.showAdvancedPilots
            ? "QA 試用"
            : "尚未解鎖"
          : level !== "A1" &&
              levelUnits.length > 0 &&
              levelProgress.passedUnitIds.length === levelUnits.length
            ? "已完成目前試行內容"
          : levelProgress.levelPassed
            ? "已通過"
            : level !== "A1"
              ? "試行中"
              : "學習中",
    };
  };

  const speak = (text: string, rate = 1, countReplay = true) => {
    if (
      typeof window === "undefined" ||
      typeof window.speechSynthesis?.speak !== "function" ||
      typeof SpeechSynthesisUtterance !== "function"
    ) {
      setSpeechSupported(false);
      setAudioMessage("此瀏覽器不支援語音播放，請改用最新版 Chrome。");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[.!?]/g, ""));
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((item) => item.lang === "en-US") ?? voices.find((item) => item.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    utterance.lang = "en-US";
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
    if (countReplay) setAudioReplays((value) => value + 1);
    setAudioMessage(rate < 1 ? "正在播放慢速發音" : "正在播放美式發音");
  };

  const playAudio = (
    text: string,
    audioStatus: LearningToken["audioStatus"] | Lesson["audioStatus"],
    source: string | undefined,
    rate = 1,
    countReplay = true,
  ) => {
    if (audioStatus === "ready" && source?.trim()) {
      const audio = new Audio(source);
      audio.playbackRate = rate;
      audio.play()
        .then(() => {
          if (countReplay) setAudioReplays((value) => value + 1);
          setAudioMessage(rate < 1 ? "正在播放慢速課程音訊" : "正在播放課程音訊");
        })
        .catch(() => speak(text, rate, countReplay));
      return;
    }
    speak(text, rate, countReplay);
  };

  const playTokenAudio = (
    token: LearningToken,
    rate = 1,
    countReplay = true,
  ) => {
    if (countReplay && token.occurrenceId) {
      setSessionTokenProgress((value) =>
        updateTokenLearningProgress(value, token.occurrenceId, {
          audioReplayDelta: 1,
        }),
      );
      setProgress((value) => ({
        ...value,
        tokenProgress: updateTokenLearningProgress(
          value.tokenProgress,
          token.occurrenceId,
          { audioReplayDelta: 1 },
        ),
      }));
    }
    playAudio(
      token.answer,
      token.audioStatus,
      token.wordAudioSource,
      rate,
      countReplay,
    );
  };

  const playSentenceAudio = (lessonItem: Lesson, rate = 1, countReplay = true) =>
    playAudio(
      lessonItem.sentence,
      lessonItem.audioStatus,
      lessonItem.sentenceAudioSource,
      rate,
      countReplay,
    );

  const selectVocabularyGroup = (
    groupId: string,
    lexemeId = "",
  ) => {
    setActiveVocabularyGroupId(groupId);
    setOpenedVocabularyLexemeId(lexemeId);
    writeStorageItem(STORAGE.lastVocabularyGroup, groupId);
  };

  const openVocabularyItem = (
    groupId: string,
    item: ResolvedVocabularyItem,
  ) => {
    const opening = openedVocabularyLexemeId !== item.lexemeId;
    setOpenedVocabularyLexemeId(opening ? item.lexemeId : "");
    if (opening) {
      recordVocabularyEvidence(
        [item.lexemeId],
        "exposure",
        `reference:${groupId}:${item.lexemeId}:${dateKey()}`,
        "A1",
      );
    }
  };

  const openRelatedVocabularyFromNavigation = () => {
    setVocabularyReturnContext(null);
    setRelatedCurrentLexemeId("");
    setScreen("related-vocabulary");
  };

  const openRelatedVocabularyFromDetail = () => {
    const lexemeId = currentToken.lexemeId;
    const group = vocabularyGroupForLexeme(
      vocabularyDataset,
      lexemeId,
    );
    if (
      selectedLevel !== "A1" ||
      !group ||
      !canShowVocabularyShortcut(
        vocabularyDataset,
        lexemeId,
        stage,
        true,
      )
    ) {
      return;
    }
    setVocabularyReturnContext(
      createVocabularyCourseReturnContext(
        selectedLesson.id,
        tokenIndex,
      ),
    );
    setRelatedCurrentLexemeId(lexemeId);
    setVocabularySearch("");
    setVocabularyFilter("all");
    setScreen("related-vocabulary");
    selectVocabularyGroup(group.id, lexemeId);
  };

  const returnFromRelatedVocabulary = () => {
    if (!vocabularyReturnContext) return;
    const lesson = flattenCourseLessons(
      courseUnitsByLevel.A1,
    ).find(
      (item) => item.id === vocabularyReturnContext.lessonId,
    );
    if (!lesson) {
      setToast("找不到原本課程，已返回 A1 課程地圖。");
      setMultiProgress((current) => ({
        ...current,
        selectedLevel: "A1",
      }));
      setScreen("map");
      setVocabularyReturnContext(null);
      setRelatedCurrentLexemeId("");
      return;
    }
    setMultiProgress((current) => ({
      ...current,
      selectedLevel: "A1",
    }));
    setSelectedLesson(lesson);
    setTokenIndex(vocabularyReturnContext.tokenIndex);
    setStage("detail");
    setScreen("learning");
    setVocabularyReturnContext(null);
    setRelatedCurrentLexemeId("");
    window.setTimeout(
      () => document.getElementById("detail-next-button")?.focus(),
      80,
    );
  };

  const playRelatedVocabularyAudio = (
    item: ResolvedVocabularyItem,
    rate = 1,
  ) =>
    playAudio(
      item.displayEnglish,
      item.audioStatus,
      item.audioSource,
      rate,
      false,
    );

  const playKkAudioFile = (
    entry: KkPhoneticEntry,
    rate: number,
    playbackToken: number,
    onFinished?: () => void,
  ) => {
    if (kkAudioRef.current) {
      kkAudioRef.current.onended = null;
      kkAudioRef.current.onerror = null;
      kkAudioRef.current.pause();
    }

    const audio = new Audio(entry.audioSrc);
    kkAudioRef.current = audio;
    audio.preload = "auto";
    audio.playbackRate = rate;
    audio.onplay = () => {
      if (playbackToken !== kkPlaybackToken.current) return;
      setKkAudioMessage(
        rate < 1
          ? `正在慢速播放 [${entry.symbol}] 音標`
          : `正在播放 [${entry.symbol}] 音標`,
      );
    };
    audio.onended = () => {
      if (playbackToken !== kkPlaybackToken.current) return;
      onFinished?.();
    };
    audio.onerror = () => {
      if (playbackToken !== kkPlaybackToken.current) return;
      setKkAudioMessage(`[${entry.symbol}] 音標載入失敗，請檢查網路後再試。`);
    };
    audio.play().catch(() => {
      if (playbackToken !== kkPlaybackToken.current) return;
      setKkAudioMessage(`[${entry.symbol}] 音標無法播放，請改用最新版 Chrome。`);
    });
  };

  const playKkAudio = (entry: KkPhoneticEntry, rate = 1) => {
    const playbackToken = kkPlaybackToken.current + 1;
    kkPlaybackToken.current = playbackToken;
    playKkAudioFile(entry, rate, playbackToken);
  };

  const playKkSequence = (entries: KkPhoneticEntry[]) => {
    const playbackToken = kkPlaybackToken.current + 1;
    kkPlaybackToken.current = playbackToken;
    const playAt = (index: number) => {
      if (playbackToken !== kkPlaybackToken.current) return;
      if (index >= entries.length) {
        setKkAudioMessage("本組音標播放完成。");
        return;
      }
      playKkAudioFile(entries[index], 1, playbackToken, () => playAt(index + 1));
    };
    playAt(0);
  };

  useEffect(() => {
    if (screen === "phonetics") return;
    kkPlaybackToken.current += 1;
    if (kkAudioRef.current) {
      kkAudioRef.current.onended = null;
      kkAudioRef.current.onerror = null;
      kkAudioRef.current.pause();
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== "learning" || !settings.autoplay || stage !== "recall") return;
    const timer = window.setTimeout(() => playTokenAudio(currentToken, 1, false), 120);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, stage, tokenIndex, selectedLesson.id]);

  const startLesson = (
    item: Lesson,
    sourceLevel: CefrLevel = selectedLevel,
  ) => {
    const sourceStatus = courseDataStatusByLevel[sourceLevel];
    if (sourceStatus !== "ready" || !item.id) {
      setToast(
        sourceStatus === "error"
          ? `${sourceLevel} 課程資料載入失敗，請重新整理後再試。`
          : `${sourceLevel} 課程資料準備中，請稍候一秒。`,
      );
      return;
    }
    setSelectedLesson(item);
    setStage("intro");
    setTokenIndex(0);
    setRecallValues(
      Array(
        getToken(item, item.tokens[0]).answer
          .trim()
          .split(/\s+/)
          .filter(Boolean).length,
      ).fill(""),
    );
    setRecallAttempts(0);
    setHintLevel(0);
    setRecallAnswerRevealed(false);
    setFeedback("");
    setRebuildValues(item.tokens.map(() => ""));
    setRebuildStatus(item.tokens.map(() => ""));
    setRecognitionSelectedId("");
    setRecognitionChecked(false);
    setPatternExampleIndex(0);
    setPatternTransferValue("");
    setPatternTransferAttempts(0);
    setPatternTransferRevealed(false);
    setPatternTransferComplete(false);
    setTextResponseSelectedId("");
    setTextResponseChecked(false);
    setAudioReplays(0);
    setRecallUsedPaste(false);
    setRebuildUsedPaste(false);
    setPatternTransferUsedPaste(false);
    setStartedAt(timestamp());
    setRebuildAttempts(0);
    setRebuildAnswerRevealed(false);
    setPassageValues([]);
    setPassageEvaluation([]);
    setPassageAttempts(0);
    setPassageAnswerRevealed(false);
    setPassageQuestionIndex(0);
    setPassageAnswer("");
    setPassageQuestionChecked(false);
    setSessionRecognitionAttempts(0);
    setSessionRecognitionCorrect(0);
    setSessionTransferAttempts(0);
    setSessionTransferCorrect(0);
    setSessionPassageComprehensionAttempts(0);
    setSessionPassageComprehensionCorrect(0);
    setSessionTokenProgress({});
    setScreen("learning");
  };

  const beginRecall = () => {
    setStage("recall");
    setStartedAt(timestamp());
    window.setTimeout(() => recallInputs.current[0]?.focus(), 0);
  };

  const resetRecallForNext = (nextToken: LearningToken) => {
    setRecallValues(
      Array(getToken(selectedLesson, nextToken).answer.trim().split(/\s+/).filter(Boolean).length).fill(""),
    );
    setRecallAttempts(0);
    setHintLevel(0);
    setRecallAnswerRevealed(false);
    setFeedback("");
    setStartedAt(timestamp());
    setRecallUsedPaste(false);
  };

  const advanceFromDetail = () => {
    if (tokenIndex < selectedLesson.tokens.length - 1) {
      const nextIndex = tokenIndex + 1;
      resetRecallForNext(selectedLesson.tokens[nextIndex]);
      setTokenIndex(nextIndex);
      setStage("recall");
      window.setTimeout(() => recallInputs.current[0]?.focus(), 0);
    } else {
      setRecallAnswerRevealed(false);
      setRebuildValues(selectedLesson.tokens.map(() => ""));
      setRebuildStatus(selectedLesson.tokens.map(() => ""));
      setRebuildAttempts(0);
      setRebuildAnswerRevealed(false);
      setRebuildUsedPaste(false);
      setStartedAt(timestamp());
      setStage("rebuild");
    }
  };

  const requestHint = () => {
    if (hintLevel >= 3) return;
    const level = Math.min(3, hintLevel + 1);
    setHintLevel(level);
    setSessionTokenProgress((value) =>
      updateTokenLearningProgress(value, currentToken.occurrenceId, {
        hintDelta: 1,
        answerRevealed: level === 3,
      }),
    );
    setProgress((value) => ({
      ...value,
      tokenProgress: updateTokenLearningProgress(
        value.tokenProgress,
        currentToken.occurrenceId,
        {
          hintDelta: 1,
          answerRevealed: level === 3,
        },
      ),
    }));
    const hint = recallIncorrectFeedback("", currentToken.answer, level);
    setFeedback(hint.message);
    if (hint.replayAudio) {
      playTokenAudio(currentToken, 1, false);
    }
    if (hint.revealAnswer) {
      setRecallAnswerRevealed(true);
    }
  };

  const checkRecall = () => {
    const accepted = [currentToken.answer, ...(currentToken.accepted ?? [])].map(clean);
    const isCorrect = accepted.includes(clean(recallAnswer));
    const elapsed = Math.round((timestamp() - startedAt) / 1000);
    const spellingEvidenceId =
      `spelling:${currentToken.occurrenceId}:${dateKey()}:${recallAttempts + 1}`;
    const lexemeId =
      currentToken.lexemeId ?? currentToken.tokenId ?? currentToken.id;
    recordVocabularyEvidence(
      [lexemeId],
      "spellingAttempt",
      spellingEvidenceId,
    );
    if (isCorrect) {
      if (
        canCreditSpellingCorrect({
          correct: true,
          answerRevealed: recallAnswerRevealed,
          usedPaste: recallUsedPaste,
        })
      ) {
        recordVocabularyEvidence(
          [lexemeId],
          "spellingCorrect",
          spellingEvidenceId,
        );
      }
      setSessionTokenProgress((value) =>
        updateTokenLearningProgress(value, currentToken.occurrenceId, {
          attemptDelta: 1,
          elapsedDelta: elapsed,
          usedPaste: recallUsedPaste,
          answerRevealed: recallAnswerRevealed,
          correctDelta: recallAnswerRevealed ? 0 : 1,
        }),
      );
      setProgress((value) => ({
        ...value,
        totalAttempts: value.totalAttempts + 1,
        correctAnswers:
          value.correctAnswers + (recallAnswerRevealed ? 0 : 1),
        totalSeconds: value.totalSeconds + elapsed,
        pasteCount: value.pasteCount + (recallUsedPaste ? 1 : 0),
        tokenProgress: updateTokenLearningProgress(
          value.tokenProgress,
          currentToken.occurrenceId,
          {
            attemptDelta: 1,
            elapsedDelta: elapsed,
            usedPaste: recallUsedPaste,
            answerRevealed: recallAnswerRevealed,
            correctDelta: recallAnswerRevealed ? 0 : 1,
          },
        ),
        lexemeProgress: recordLearningEntityAttempt(
          value.lexemeProgress,
          currentToken.lexemeId ?? currentToken.tokenId ?? currentToken.id,
          selectedLesson.id,
          true,
        ),
        senseProgress: recordLearningEntityAttempt(
          value.senseProgress,
          currentToken.senseId,
          selectedLesson.id,
          true,
        ),
      }));
      setFeedback("");
      setStage("detail");
      recordVocabularyEvidence(
        [lexemeId],
        "exposure",
        `course:${currentToken.occurrenceId}:${dateKey()}`,
      );
      window.setTimeout(
        () => document.getElementById("detail-next-button")?.focus(),
        80,
      );
      return;
    }
    if (recallAnswerRevealed) {
      setFeedback(`請輸入本課目標答案：${currentToken.answer}`);
      return;
    }
    const nextAttempt = recallAttempts + 1;
    setRecallAttempts(nextAttempt);
    setHintLevel((level) => Math.max(level, Math.min(3, nextAttempt)));
    setSessionTokenProgress((value) =>
      updateTokenLearningProgress(value, currentToken.occurrenceId, {
        attemptDelta: 1,
        hintDelta: 1,
        elapsedDelta: elapsed,
        usedPaste: recallUsedPaste,
        answerRevealed: nextAttempt >= 3,
      }),
    );
    setProgress((value) => ({
      ...value,
      totalAttempts: value.totalAttempts + 1,
      totalSeconds: value.totalSeconds + elapsed,
      pasteCount: value.pasteCount + (recallUsedPaste ? 1 : 0),
      tokenProgress: updateTokenLearningProgress(
        value.tokenProgress,
        currentToken.occurrenceId,
        {
          attemptDelta: 1,
          hintDelta: 1,
          elapsedDelta: elapsed,
          usedPaste: recallUsedPaste,
          answerRevealed: nextAttempt >= 3,
        },
      ),
      lexemeProgress: recordLearningEntityAttempt(
        value.lexemeProgress,
        currentToken.lexemeId ?? currentToken.tokenId ?? currentToken.id,
        selectedLesson.id,
        false,
      ),
      senseProgress: recordLearningEntityAttempt(
        value.senseProgress,
        currentToken.senseId,
        selectedLesson.id,
        false,
      ),
      reviewExerciseTypes: {
        ...value.reviewExerciseTypes,
        [currentToken.occurrenceId]: addReviewExercise(
          value.reviewExerciseTypes[currentToken.occurrenceId],
          "spelling",
        ),
      },
    }));
    const incorrectFeedback = recallIncorrectFeedback(
      recallAnswer,
      currentToken.answer,
      nextAttempt,
    );
    setFeedback(incorrectFeedback.message);
    if (incorrectFeedback.revealAnswer) {
      setRecallAnswerRevealed(true);
    }
    if (incorrectFeedback.replayAudio) {
      playTokenAudio(currentToken, 1, false);
    }
    setStartedAt(timestamp());
  };

  const checkRebuild = () => {
    const answers = selectedLesson.tokens.map(
      (token) => getToken(selectedLesson, token).answer,
    );
    const result = evaluateRebuildAttempt(
      rebuildValues,
      answers,
      rebuildAttempts,
    );
    setRebuildAttempts(result.attempts);
    setRebuildStatus(result.statuses);
    const rebuildEvidenceId =
      `rebuild:${selectedLesson.sentenceId}:${dateKey()}:${startedAt}:${result.attempts}`;
    const rebuildLexemeIds = selectedLesson.tokens.map(
      (token) => token.lexemeId ?? token.tokenId ?? token.id,
    );
    recordVocabularyEvidence(
      rebuildLexemeIds,
      "applicationAttempt",
      rebuildEvidenceId,
    );
    const creditApplicationCorrect = canCreditApplicationCorrect({
      correct: result.correct,
      answerRevealed: rebuildAnswerRevealed,
      usedPaste: rebuildUsedPaste,
    });
    if (creditApplicationCorrect) {
      recordVocabularyEvidence(
        rebuildLexemeIds,
        "applicationCorrect",
        rebuildEvidenceId,
      );
    }
    const elapsed = Math.max(
      0,
      Math.round((timestamp() - startedAt) / 1000),
    );
    setProgress((value) => {
      const sentenceStats =
        value.sentenceStats[selectedLesson.sentenceId] ??
        emptySentenceStats();
      return {
        ...value,
        totalAttempts: value.totalAttempts + 1,
        correctAnswers:
          value.correctAnswers + (result.correct ? 1 : 0),
        sentenceStats: {
          ...value.sentenceStats,
          [selectedLesson.sentenceId]: {
            ...sentenceStats,
            rebuildAttempts: sentenceStats.rebuildAttempts + 1,
            elapsedSeconds: sentenceStats.elapsedSeconds + elapsed,
          },
        },
        reviewExerciseTypes: result.correct
          ? value.reviewExerciseTypes
          : {
              ...value.reviewExerciseTypes,
              [selectedLesson.sentencePatternId]: addReviewExercise(
                value.reviewExerciseTypes[
                  selectedLesson.sentencePatternId
                ],
                "word-order",
              ),
            },
      };
    });
    if (result.correct) {
      setFeedback(
        creditApplicationCorrect
          ? "順序與拼字都正確！完成格式如下："
          : "答案正確，但使用貼上不會記為主動運用證據。",
      );
      window.setTimeout(() => {
        setFeedback("");
        setRecallAnswerRevealed(false);
        continueAfterRebuild();
      }, 850);
      return;
    }
    if (result.revealed) {
      setRebuildValues(result.displayValues);
      setRebuildAnswerRevealed(true);
      setFeedback(
        `已嘗試 3 次，正確答案已放入各格。請閱讀「${selectedLesson.sentence}」後按下一步。`,
      );
      window.setTimeout(
        () => document.getElementById("rebuild-next-button")?.focus(),
        80,
      );
      return;
    }
    const labels = {
      "": "",
      order: "順序不對",
      spelling: "檢查拼字",
      missing: "尚未填寫",
      correct: "正確",
      revealed: "正確答案",
    };
    setFeedback(
      `第 ${result.attempts} 次未通過，還可以再試 ${3 - result.attempts} 次。` +
      result.statuses
        .map((status, index) => `第 ${index + 1} 格：${labels[status]}`)
        .join("；"),
    );
  };

  const finishLesson = () => {
    const today = dateKey();
    const shouldStartPassageRebuild = canStartPassageRebuild({
      displaySentenceCount: selectedPassageLessons.length,
      basePassageLessons,
      customSentences: selectedPassageComprehension?.sentences ?? [],
      currentLessonId: selectedLesson.id,
      completedLessonIds: progress.completedLessonIds,
      formalLessons: allLessons,
    });
    setProgress((value) => {
      const reviewItems = { ...value.reviewItems };
      let lexemeProgress = value.lexemeProgress;
      let senseProgress = value.senseProgress;
      const tokenHintLevels = { ...value.tokenHintLevels };
      const chunkHintLevels = { ...value.chunkHintLevels };
      const patternTokenHintLevels: HintLevel[] = [];
      selectedLesson.tokens.forEach((token) => {
        const resolved = getToken(selectedLesson, token);
        const tokenPerformance =
          sessionTokenProgress[resolved.occurrenceId] ??
          value.tokenProgress[resolved.occurrenceId];
        const interval = reviewIntervalForToken(tokenPerformance);
        reviewItems[resolved.occurrenceId] = scheduleTokenReview(
          reviewItems[resolved.occurrenceId],
          {
            tokenId: resolved.occurrenceId,
            answer: resolved.answer,
            prompt: resolved.prompt,
          },
          interval,
        );
        const nextTokenHintLevel = nextHintLevel(
          tokenHintLevels[resolved.occurrenceId] ?? 1,
          tokenPerformance,
        );
        tokenHintLevels[resolved.occurrenceId] = nextTokenHintLevel;
        patternTokenHintLevels.push(nextTokenHintLevel);
        if (resolved.chunk?.id) {
          chunkHintLevels[resolved.chunk.id] = nextHintLevel(
            chunkHintLevels[resolved.chunk.id] ?? 1,
            tokenPerformance,
          );
        }
        lexemeProgress = recordLearningEntityCompletion(
          lexemeProgress,
          resolved.lexemeId ?? resolved.tokenId ?? resolved.id,
          selectedLesson.id,
        );
        senseProgress = recordLearningEntityCompletion(
          senseProgress,
          resolved.senseId,
          selectedLesson.id,
        );
      });
      return {
        ...value,
        completedLessonIds: shouldStartPassageRebuild
          ? value.completedLessonIds
          : Array.from(
              new Set([
                ...value.completedLessonIds,
                selectedLesson.id,
              ]),
            ),
        studyDates: shouldStartPassageRebuild
          ? value.studyDates
          : Array.from(new Set([...value.studyDates, today])),
        reviewItems,
        lexemeProgress,
        senseProgress,
        sentencePatternProgress: recordLearningEntityCompletion(
          value.sentencePatternProgress,
          selectedLesson.sentencePatternId,
          selectedLesson.id,
        ),
        tokenHintLevels,
        chunkHintLevels,
        patternHintLevels: {
          ...value.patternHintLevels,
          [selectedLesson.sentencePatternId]:
            patternTokenHintLevels.length > 0
              ? (Math.min(...patternTokenHintLevels) as HintLevel)
              : 1,
        },
      };
    });
    playSentenceAudio(selectedLesson, 1, false);
    if (shouldStartPassageRebuild) {
      setPassageValues(selectedPassageLessons.map(() => ""));
      setPassageEvaluation([]);
      setPassageAttempts(0);
      setPassageAnswerRevealed(false);
      setFeedback("");
      setStage("passage-rebuild");
    } else {
      setStage("result");
      window.setTimeout(
        () => document.getElementById("lesson-result-next")?.focus(),
        80,
      );
    }
  };

  const continueAfterRebuild = () => {
    setFeedback("");
    setRecallAnswerRevealed(false);
    if (selectedRecognition) {
      setRecognitionSelectedId("");
      setRecognitionChecked(false);
      setStartedAt(timestamp());
      setStage("reading-recognition");
      return;
    }
    finishLesson();
  };

  const checkRecognition = () => {
    if (!selectedRecognition || !recognitionSelectedId) {
      setFeedback("請先選擇一個答案。");
      return;
    }
    if (recognitionChecked) return;
    const correct =
      recognitionSelectedId === selectedRecognition.correctOptionId;
    const recognitionEvidenceId =
      `recognition:${selectedRecognition.id}:${dateKey()}`;
    recordVocabularyEvidence(
      selectedRecognition.requiredLexemeIds,
      "recognitionAttempt",
      recognitionEvidenceId,
    );
    if (correct) {
      recordVocabularyEvidence(
        selectedRecognition.requiredLexemeIds,
        "recognitionCorrect",
        recognitionEvidenceId,
      );
    }
    const elapsed = Math.max(
      0,
      Math.round((timestamp() - startedAt) / 1000),
    );
    setRecognitionChecked(true);
    setSessionRecognitionAttempts((value) => value + 1);
    setSessionRecognitionCorrect((value) => value + (correct ? 1 : 0));
    setProgress((value) => {
      const sentenceStats =
        value.sentenceStats[selectedRecognition.sentenceId] ??
        emptySentenceStats();
      return {
        ...value,
        totalAttempts: value.totalAttempts + 1,
        correctAnswers:
          value.correctAnswers + (correct ? 1 : 0),
        sentenceStats: {
          ...value.sentenceStats,
          [selectedRecognition.sentenceId]: {
            ...sentenceStats,
            recognitionAttempts:
              sentenceStats.recognitionAttempts + 1,
            recognitionCorrect:
              sentenceStats.recognitionCorrect + (correct ? 1 : 0),
            elapsedSeconds: sentenceStats.elapsedSeconds + elapsed,
          },
        },
        reviewExerciseTypes: correct
          ? value.reviewExerciseTypes
          : {
              ...value.reviewExerciseTypes,
              [selectedRecognition.sentencePatternId]: addReviewExercise(
                value.reviewExerciseTypes[
                  selectedRecognition.sentencePatternId
                ],
                "meaning",
              ),
            },
      };
    });
    setFeedback(
      correct
        ? "句意判斷正確！"
        : `這句話的正確意思是「${
            selectedRecognition.options.find(
              (option) =>
                option.id === selectedRecognition.correctOptionId,
            )?.text ?? ""
          }」`,
    );
  };

  const continueAfterRecognition = () => {
    setFeedback("");
    if (selectedPatternExamples.length > 0) {
      setPatternExampleIndex(0);
      setPatternTransferValue("");
      setPatternTransferAttempts(0);
      setPatternTransferRevealed(false);
      setPatternTransferComplete(false);
      setPatternTransferUsedPaste(false);
      setStartedAt(timestamp());
      setStage("pattern-transfer");
      window.setTimeout(
        () =>
          document
            .getElementById("pattern-transfer-answer")
            ?.focus(),
        80,
      );
      return;
    }
    if (selectedTextResponse) {
      setTextResponseSelectedId("");
      setTextResponseChecked(false);
      setStage("text-response");
      return;
    }
    finishLesson();
  };

  const checkPatternTransfer = () => {
    if (!currentPatternExample || patternTransferComplete) return;
    const correct = isPatternTransferCorrect(
      patternTransferValue,
      currentPatternExample,
    );
    const credited = correct && !patternTransferRevealed;
    const creditApplicationCorrect = canCreditApplicationCorrect({
      correct,
      answerRevealed: patternTransferRevealed,
      usedPaste: patternTransferUsedPaste,
    });
    const nextAttempt = patternTransferAttempts + 1;
    const transferEvidenceId =
      `transfer:${currentPatternExample.id}:${dateKey()}:${startedAt}:${nextAttempt}`;
    recordVocabularyEvidence(
      currentPatternExample.requiredLexemeIds,
      "applicationAttempt",
      transferEvidenceId,
    );
    if (creditApplicationCorrect) {
      recordVocabularyEvidence(
        currentPatternExample.requiredLexemeIds,
        "applicationCorrect",
        transferEvidenceId,
      );
    }
    setPatternTransferAttempts(nextAttempt);
    setSessionTransferAttempts((value) => value + 1);
    setSessionTransferCorrect(
      (value) => value + (credited ? 1 : 0),
    );
    setProgress((value) => {
      const patternStats =
        value.patternStats[selectedTransferPatternId] ??
        emptyPatternStats();
      const currentHintLevel =
        value.patternHintLevels[selectedTransferPatternId] ?? 1;
      const updatedHintLevel = (
        credited
          ? Math.min(4, currentHintLevel + 1)
          : Math.max(1, currentHintLevel - 1)
      ) as HintLevel;
      return {
        ...value,
        totalAttempts: value.totalAttempts + 1,
        correctAnswers:
          value.correctAnswers + (credited ? 1 : 0),
        patternStats: {
          ...value.patternStats,
          [selectedTransferPatternId]: {
            ...patternStats,
            transferAttempts: patternStats.transferAttempts + 1,
            transferCorrect:
              patternStats.transferCorrect + (credited ? 1 : 0),
            uniqueVariationsCompleted: correct
              ? Array.from(
                  new Set([
                    ...patternStats.uniqueVariationsCompleted,
                    currentPatternExample.id,
                  ]),
                )
              : patternStats.uniqueVariationsCompleted,
            lastPracticedAt: new Date().toISOString(),
            nextReviewAt: addDays(credited ? 3 : 1),
          },
        },
        reviewExerciseTypes: correct
          ? value.reviewExerciseTypes
          : {
              ...value.reviewExerciseTypes,
              [selectedTransferPatternId]: addReviewExercise(
                value.reviewExerciseTypes[
                  selectedTransferPatternId
                ],
                "pattern-transfer",
              ),
            },
        patternHintLevels: {
          ...value.patternHintLevels,
          [selectedTransferPatternId]: updatedHintLevel,
        },
      };
    });
    if (correct) {
      setPatternTransferComplete(true);
      setFeedback(
        patternTransferRevealed
          ? "已重新輸入正確答案，現在可以繼續。"
          : patternTransferUsedPaste
            ? "答案正確，但使用貼上不會記為主動運用證據。"
          : "句型換字正確！",
      );
      return;
    }
    if (nextAttempt >= 3) {
      setPatternTransferRevealed(true);
      setFeedback(
        `正確答案是 ${currentPatternExample.sentence}，請重新輸入一次。`,
      );
      return;
    }
    setFeedback(
      `第 ${nextAttempt} 次尚未正確，請保持句型不變，只替換名詞片語。`,
    );
  };

  const continueAfterPatternTransfer = () => {
    if (
      patternExampleIndex <
      selectedPatternExamples.length - 1
    ) {
      setPatternExampleIndex((value) => value + 1);
      setPatternTransferValue("");
      setPatternTransferAttempts(0);
      setPatternTransferRevealed(false);
      setPatternTransferComplete(false);
      setPatternTransferUsedPaste(false);
      setFeedback("");
      setStartedAt(timestamp());
      window.setTimeout(
        () =>
          document
            .getElementById("pattern-transfer-answer")
            ?.focus(),
        80,
      );
      return;
    }
    if (selectedTextResponse) {
      setTextResponseSelectedId("");
      setTextResponseChecked(false);
      setFeedback("");
      setStage("text-response");
      return;
    }
    finishLesson();
  };

  const checkTextResponse = () => {
    if (!selectedTextResponse || !textResponseSelectedId) {
      setFeedback("請先選擇一個文字答案。");
      return;
    }
    if (textResponseChecked) return;
    const correct =
      textResponseSelectedId ===
      selectedTextResponse.correctOptionId;
    setTextResponseChecked(true);
    setProgress((value) => ({
      ...value,
      totalAttempts: value.totalAttempts + 1,
      correctAnswers:
        value.correctAnswers + (correct ? 1 : 0),
      reviewExerciseTypes: correct
        ? value.reviewExerciseTypes
        : {
            ...value.reviewExerciseTypes,
            [selectedTextResponse.sentencePatternId]: addReviewExercise(
              value.reviewExerciseTypes[
                selectedTextResponse.sentencePatternId
              ],
              "meaning",
            ),
          },
    }));
    setFeedback(
      correct
        ? "文字回答正確！"
        : `正確回答是「${
            selectedTextResponse.options.find(
              (option) =>
                option.id ===
                selectedTextResponse.correctOptionId,
            )?.text ?? ""
          }」`,
    );
  };

  const checkPassageRebuild = () => {
    const evaluation = evaluatePassageRebuild(
      passageValues,
      selectedPassageLessons,
    );
    const allCorrect = evaluation.every((item) => item.correct);
    const attempt = passageAttempts + 1;
    setPassageAttempts(attempt);
    setPassageEvaluation(evaluation);
    setProgress((value) => {
      const passageStats =
        value.passageStats[selectedLesson.passageId] ??
        emptyPassageStats();
      return {
        ...value,
        totalAttempts:
          value.totalAttempts + selectedPassageLessons.length,
        correctAnswers:
          value.correctAnswers +
          evaluation.filter((item) => item.correct).length,
        passageStats: {
          ...value.passageStats,
          [selectedLesson.passageId]: {
            ...passageStats,
            rebuildAttempts: passageStats.rebuildAttempts + 1,
            lastPracticedAt: new Date().toISOString(),
          },
        },
        reviewExerciseTypes: allCorrect
          ? value.reviewExerciseTypes
          : {
              ...value.reviewExerciseTypes,
              [selectedLesson.passageId]: addReviewExercise(
                value.reviewExerciseTypes[selectedLesson.passageId],
                "word-order",
              ),
            },
      };
    });

    if (allCorrect) {
      setFeedback("整段文章的句子與順序都正確！");
      speak(
        selectedPassageLessons.map((lesson) => lesson.sentence).join(" "),
        1,
        false,
      );
      window.setTimeout(() => {
        beginPassageComprehension();
      }, 850);
      return;
    }

    if (attempt >= 3) {
      const revealedValues = selectedPassageLessons.map(
        (lesson) => lesson.sentence,
      );
      setPassageValues(revealedValues);
      setPassageEvaluation(
        selectedPassageLessons.map((lesson) => ({
          sentenceId: lesson.sentenceId,
          correct: true,
          message: "已顯示正確句子",
          expected: lesson.sentence,
        })),
      );
      setPassageAnswerRevealed(true);
      setFeedback("已嘗試 3 次，正確文章已顯示。請閱讀後自行完成課程。");
      window.setTimeout(() => {
        document.getElementById("passage-complete-button")?.focus();
      }, 80);
      return;
    }

    setFeedback(
      `第 ${attempt} 次未通過，請依每句下方提示修正。`,
    );
  };

  const markLessonCompletedAfterPassage = () => {
    const today = dateKey();
    setProgress((value) => ({
      ...value,
      completedLessonIds: Array.from(
        new Set([...value.completedLessonIds, selectedLesson.id]),
      ),
      studyDates: Array.from(new Set([...value.studyDates, today])),
    }));
  };

  const beginPassageComprehension = () => {
    if (
      selectedPassageComprehension &&
      selectedPassageComprehension.questions.length > 0
    ) {
      setPassageQuestionIndex(0);
      setPassageAnswer("");
      setPassageQuestionChecked(false);
      setFeedback("");
      setStage("passage-comprehension");
      return;
    }
    markLessonCompletedAfterPassage();
    setStage("result");
    window.setTimeout(
      () => document.getElementById("lesson-result-next")?.focus(),
      80,
    );
  };

  const completeRevealedPassage = () => {
    beginPassageComprehension();
  };

  const checkPassageComprehension = () => {
    if (!currentPassageQuestion || !passageAnswer) {
      setFeedback("請先選擇一個答案。");
      return;
    }
    if (passageQuestionChecked) return;
    const correct =
      cleanSentence(passageAnswer) ===
      cleanSentence(currentPassageQuestion.correctAnswer);
    setPassageQuestionChecked(true);
    setSessionPassageComprehensionAttempts((value) => value + 1);
    setSessionPassageComprehensionCorrect(
      (value) => value + (correct ? 1 : 0),
    );
    setProgress((value) => {
      const passageStats =
        value.passageStats[selectedLesson.passageId] ??
        emptyPassageStats();
      return {
        ...value,
        totalAttempts: value.totalAttempts + 1,
        correctAnswers:
          value.correctAnswers + (correct ? 1 : 0),
        passageStats: {
          ...value.passageStats,
          [selectedLesson.passageId]: {
            ...passageStats,
            comprehensionAttempts:
              passageStats.comprehensionAttempts + 1,
            comprehensionCorrect:
              passageStats.comprehensionCorrect +
              (correct ? 1 : 0),
            lastPracticedAt: new Date().toISOString(),
          },
        },
        reviewExerciseTypes: correct
          ? value.reviewExerciseTypes
          : {
              ...value.reviewExerciseTypes,
              [selectedLesson.passageId]: addReviewExercise(
                value.reviewExerciseTypes[selectedLesson.passageId],
                "passage-comprehension",
              ),
            },
      };
    });
    setFeedback(
      correct
        ? "短文理解正確！"
        : `正確答案是 ${currentPassageQuestion.correctAnswer}`,
    );
  };

  const continuePassageComprehension = () => {
    if (
      !selectedPassageComprehension ||
      passageQuestionIndex >=
        selectedPassageComprehension.questions.length - 1
    ) {
      markLessonCompletedAfterPassage();
      setStage("result");
      window.setTimeout(
        () => document.getElementById("lesson-result-next")?.focus(),
        80,
      );
      return;
    }
    setPassageQuestionIndex((value) => value + 1);
    setPassageAnswer("");
    setPassageQuestionChecked(false);
    setFeedback("");
  };

  const startAssessment = (kind: "unit" | "level", unit?: CourseUnit) => {
    if (kind === "level" && !isLevelAssessmentEnabled(selectedLevel)) {
      setToast(`你已完成目前的${selectedLevel}試行內容。`);
      setScreen("map");
      return;
    }
    const lessons =
      kind === "unit"
        ? unit!.lessons
        : courseUnits.map((courseUnit) => courseUnit.lessons[courseUnit.lessons.length - 1]);
    setAssessment({
      kind,
      title:
        kind === "unit"
          ? `${unit!.title}・單元測驗`
          : `${selectedLevel} 程度總測驗`,
      lessons,
      index: 0,
      scores: [],
      checked: false,
      lastScore: 0,
    });
    setAssessmentValue("");
    setScreen("assessment");
  };

  const checkAssessment = () => {
    if (!assessment) return;
    const score = wordAccuracy(assessmentValue, assessment.lessons[assessment.index].sentence);
    setAssessment({ ...assessment, checked: true, lastScore: score });
  };

  const nextAssessment = () => {
    if (!assessment) return;
    const scores = [...assessment.scores, assessment.lastScore];
    if (assessment.index < assessment.lessons.length - 1) {
      setAssessment({ ...assessment, index: assessment.index + 1, scores, checked: false, lastScore: 0 });
      setAssessmentValue("");
      return;
    }
    const finalScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const passMark = assessment.kind === "unit" ? 80 : 85;
    if (finalScore >= passMark) {
      setProgress((value) => ({
        ...value,
        passedUnitIds:
          assessment.kind === "unit"
            ? Array.from(
                new Set([
                  ...value.passedUnitIds,
                  courseUnits.find((unit) => unit.lessons[0].id === assessment.lessons[0].id)!.id,
                ]),
              )
            : value.passedUnitIds,
        levelPassed:
          assessment.kind === "level" &&
          isLevelAssessmentEnabled(selectedLevel)
            ? true
            : value.levelPassed,
      }));
      if (
        assessment.kind === "level" &&
        isLevelAssessmentEnabled(selectedLevel)
      ) {
        setMultiProgress((value) => ({
          ...value,
          passedLevelIds: Array.from(
            new Set([...value.passedLevelIds, selectedLevel]),
          ),
        }));
      }
    }
    setToast(finalScore >= passMark ? `通過！本次正確率 ${finalScore}%` : `本次 ${finalScore}%，可隨時重新挑戰。`);
    setAssessment(null);
    setScreen("map");
  };

  const continueAfterLesson = () => {
    const unitIndex = courseUnits.findIndex((unit) => unit.id === selectedUnit.id);
    const lessonIndex = selectedUnit.lessons.findIndex((item) => item.id === selectedLesson.id);
    if (lessonIndex < selectedUnit.lessons.length - 1) {
      startLesson(selectedUnit.lessons[lessonIndex + 1]);
      return;
    }
    if (!progress.passedUnitIds.includes(selectedUnit.id)) {
      startAssessment("unit", selectedUnit);
      return;
    }
    if (unitIndex < courseUnits.length - 1) {
      startLesson(courseUnits[unitIndex + 1].lessons[0]);
      return;
    }
    if (!isLevelAssessmentEnabled(selectedLevel)) {
      setToast(`你已完成目前的${selectedLevel}試行內容。`);
      setScreen("map");
      return;
    }
    if (!progress.levelPassed) {
      startAssessment("level");
      return;
    }
    setScreen("map");
  };

  const afterLessonLabel = () => {
    const unitIndex = courseUnits.findIndex((unit) => unit.id === selectedUnit.id);
    const lessonIndex = selectedUnit.lessons.findIndex((item) => item.id === selectedLesson.id);
    if (lessonIndex < selectedUnit.lessons.length - 1) return "前往下一課 →";
    if (!progress.passedUnitIds.includes(selectedUnit.id)) return "進入單元測驗 →";
    if (unitIndex < courseUnits.length - 1) return "前往下一單元 →";
    if (!isLevelAssessmentEnabled(selectedLevel)) return "回課程地圖";
    if (!progress.levelPassed) return `進入 ${selectedLevel} 程度測驗 →`;
    return "回課程地圖";
  };

  const updateFamiliarity = (item: ReviewItem, familiarity: Familiarity) => {
    const days = familiarity === "熟悉" ? Math.min(60, Math.max(3, item.intervalDays * 2)) : familiarity === "不熟" ? 1 : 0;
    setProgress((value) => ({
      ...value,
      reviewItems: {
        ...value.reviewItems,
        [item.tokenId]: {
          ...item,
          familiarity,
          intervalDays: days,
          dueAt: addDays(days),
          successfulDays: familiarity === "熟悉" ? item.successfulDays + 1 : 0,
        },
      },
    }));
  };

  const applyCourseRows = (
    rows: A1CourseCsvRow[],
    updatedAt = new Date().toISOString(),
  ) => {
    const sourceVersion =
      selectedCatalogEntry?.sourceVersion ??
      OFFICIAL_A1_SOURCE_VERSION;
    const units =
      selectedLevel === "A1"
        ? buildCourseUnitsFromRows(rows)
        : buildGenericCourseUnitsFromRows(rows, sourceVersion);
    setCourseRows(rows);
    setCourseDraftRows(rows);
    setCourseRowsUpdatedAt(updatedAt);
    setCourseUnits(units);
    setSelectedLesson((current) => {
      const lessons = flattenCourseLessons(units);
      return (
        lessons.find((lesson) => lesson.id === current.id) ??
        lessons[0] ??
        EMPTY_LESSON
      );
    });
  };

  const contentRows = courseRows;
  const contentSourceVersion =
    selectedCatalogEntry?.sourceVersion ??
    OFFICIAL_A1_SOURCE_VERSION;

  const filteredRows = courseDraftRows.filter((row) => {
    const matchesUnit = adminUnit === "all" || row.unit_id === adminUnit;
    const keyword = clean(adminSearch);
    return (
      matchesUnit &&
      (!keyword ||
        clean(`${row.answer} ${row.prompt} ${row.sentence} ${row.translation}`).includes(keyword))
    );
  });

  const exportContentCsv = () => {
    saveFile(
      selectedLevel === "A1"
        ? serializeA1MvpCsv(contentRows)
        : serializeCourseCsv(contentRows),
      contentSourceVersion,
      "text/csv;charset=utf-8",
    );
  };

  const exportContentXlsx = async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(contentRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `${selectedLevel}課程內容`,
    );
    XLSX.writeFile(
      workbook,
      contentSourceVersion.replace(/\.csv$/i, ".xlsx"),
    );
  };

  const exportContentJson = () => {
    saveFile(
      JSON.stringify(
        {
          schemaVersion: selectedLevel === "A1" ? 3 : 1,
          level: selectedLevel,
          sourceVersion: contentSourceVersion,
          exportedAt: new Date().toISOString(),
          headers:
            selectedLevel === "A1"
              ? A1_V3_HEADERS
              : COURSE_CSV_HEADERS,
          rows: contentRows,
        },
        null,
        2,
      ),
      contentSourceVersion.replace(/\.csv$/i, ".json"),
      "application/json",
    );
  };

  const validateSelectedCourseRows = (
    rows: A1CourseCsvRow[],
    referenceRows: A1CourseCsvRow[],
  ): CourseValidationReport => {
    if (selectedLevel === "A1") {
      return validateA1CourseRows(
        rows,
        referenceRows.map((row) => row.occurrence_id),
        referenceRows,
      );
    }

    const base = validateCourseRows(rows, {
      expectedLevel: selectedLevel,
      expectedRows: referenceRows.length,
      expectedUnits: new Set(referenceRows.map((row) => row.unit_id)).size,
      expectedLessons: new Set(referenceRows.map((row) => row.lesson_id)).size,
      rejectProductionQaForPilot:
        selectedCatalogEntry?.status === "pilot",
    });
    const expectedIds = new Set(
      referenceRows.map((row) => row.occurrence_id),
    );
    const importedIds = new Set(rows.map((row) => row.occurrence_id));
    const unmatchedIds = rows
      .map((row) => row.occurrence_id)
      .filter((id) => !expectedIds.has(id));
    const missingIds = Array.from(expectedIds).filter(
      (id) => !importedIds.has(id),
    );
    const changedIdentityErrors = rows.flatMap((row) => {
      const reference = referenceRows.find(
        (item) => item.occurrence_id === row.occurrence_id,
      );
      if (
        !reference ||
        reference.answer.toLowerCase() === row.answer.toLowerCase()
      ) {
        return [];
      }
      const unchanged = [
        "token_id",
        "lexeme_id",
        "sense_id",
        "lemma",
        "kk_us",
        "ipa_standalone",
        "chunk_text",
      ].filter((field) => reference[field] === row[field]);
      return unchanged.length
        ? [
            `${row.occurrence_id} 的 answer 已改變，但相關識別、音標或語塊欄位尚未完整同步。`,
          ]
        : [];
    });
    const exercises = exerciseDataByLevel[selectedLevel];
    const selectedLevelIndex = CEFR_LEVELS.indexOf(selectedLevel);
    const prerequisiteRows = CEFR_LEVELS.slice(
      0,
      selectedLevelIndex,
    ).flatMap((level) => officialCourseRowsByLevel[level]);
    const patternReport = exercises
      ? validatePatternExerciseData(
          exercises.patterns,
          rows,
          selectedLevel,
          prerequisiteRows,
        )
      : {
          valid: false,
          errors: [`${selectedLevel} 句型練習資料尚未載入。`],
        };
    const readingReport = exercises
      ? validateReadingExerciseData(
          exercises.reading,
          rows,
          exercises.patterns,
          prerequisiteRows,
        )
      : {
          valid: false,
          errors: [`${selectedLevel} 閱讀練習資料尚未載入。`],
        };
    const validationErrors = [
      ...base.validationErrors,
      ...(missingIds.length
        ? [`缺少正式 occurrence_id：${missingIds.join("、")}`]
        : []),
      ...changedIdentityErrors,
      ...patternReport.errors,
      ...readingReport.errors,
    ];
    const valid =
      validationErrors.length === 0 &&
      unmatchedIds.length === 0 &&
      base.valid;
    return {
      totalRows: rows.length,
      successfulRows: valid ? rows.length : base.successfulRows,
      failedRows: valid
        ? 0
        : Math.max(1, base.failedRows || rows.length),
      unmatchedIds: Array.from(new Set(unmatchedIds)),
      validationErrors: Array.from(new Set(validationErrors)),
      valid,
    };
  };

  const importContent = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      let rows: Record<string, unknown>[] = [];
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".json")) {
        const value = JSON.parse(await file.text());
        rows = Array.isArray(value) ? value : value.rows ?? [];
      } else if (lowerName.endsWith(".csv")) {
        rows =
          selectedLevel === "A1"
            ? parseA1MvpCsv(await file.text())
            : parseCourseCsv(await file.text());
      } else {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        rows = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]],
          { defval: "", raw: false },
        );
      }
      const normalizedRows =
        selectedLevel === "A1"
          ? normalizeA1CourseRows(rows)
          : normalizeCourseRows(rows);
      const report = validateSelectedCourseRows(
        normalizedRows,
        courseRows,
      );
      setImportReport(report);
      if (!report.valid) {
        setToast(
          `匯入未套用：總列數 ${report.totalRows}、成功 ${report.successfulRows}、失敗 ${report.failedRows}。`,
        );
        return;
      }
      applyCourseRows(normalizedRows);
      setToast(
        `匯入成功：總列數 ${report.totalRows}、成功 ${report.successfulRows}、失敗 ${report.failedRows}。`,
      );
    } catch (error) {
      const report: CourseValidationReport = {
        totalRows: 0,
        successfulRows: 0,
        failedRows: 0,
        unmatchedIds: [],
        validationErrors: [
          error instanceof Error ? error.message : "檔案格式無法讀取。",
        ],
        valid: false,
      };
      setImportReport(report);
      setToast("匯入失敗，請查看驗證錯誤。");
    } finally {
      event.target.value = "";
    }
  };

  const exportProgress = () => {
    saveFile(
      JSON.stringify(
        {
          schemaVersion: 6,
          exportedAt: new Date().toISOString(),
          progress: multiProgress,
          settings,
        },
        null,
        2,
      ),
      "英句練習_完整學習進度.json",
      "application/json",
    );
  };

  const importProgress = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      if (!value.progress) throw new Error("missing progress");
      setMultiProgress(migrateProgressToV6(value.progress));
      setProgressStorageWritable(true);
      if (value.settings) setSettings(normalizeSettings(value.settings));
      setToast("完整學習進度已還原。");
    } catch {
      setToast("這不是有效的學習進度備份檔。");
    } finally {
      event.target.value = "";
    }
  };

  const resetWeaknessPractice = () => {
    setWeaknessPracticeValue("");
    setWeaknessPracticeChecked(false);
    setWeaknessPracticeAttempts(0);
    setWeaknessPracticeRevealed(false);
    setWeaknessPracticeUsedPaste(false);
    setWeaknessPracticeFeedback("");
  };

  const discardDailySession = (message: string) => {
    clearDailySession(message);
  };

  const ensureCurrentDailySession = (session: DailySessionState) => {
    if (isDailySessionCurrentDay(session)) return true;
    discardDailySession(
      "日期已變更，昨天的今日學習已結束，請重新開始今天的學習。",
    );
    return false;
  };

  const startWeaknessPractice = (
    lexemeIds: string[],
    returnScreen: "weakness" | "daily-summary" = "weakness",
  ) => {
    const queue = [...new Set(lexemeIds)].filter((lexemeId) =>
      vocabularyPracticeSources.has(lexemeId),
    );
    if (!queue.length) {
      if (returnScreen === "daily-summary" && dailySession) {
        discardDailySession(
          "今日學習內容已更新，已重新建立今日學習流程。",
        );
      } else {
        setToast("目前找不到這個弱點可使用的正式課程例句。");
      }
      return;
    }
    setWeaknessPracticeQueue(queue);
    setWeaknessPracticeIndex(0);
    setWeaknessPracticeReturnScreen(returnScreen);
    setWeaknessPracticeStartedAt(timestamp());
    resetWeaknessPractice();
    setScreen("weakness-practice");
  };

  const recognitionOptionsForWeakness = (
    source: WeaknessPracticeSource,
  ) => {
    const distractors = Array.from(vocabularyPracticeSources.values())
      .filter(
        (item) =>
          item.lexemeId !== source.lexemeId &&
          item.prompt &&
          item.prompt !== source.prompt,
      )
      .map((item) => item.prompt)
      .filter((item, index, values) => values.indexOf(item) === index)
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 3);
    const options = [source.prompt, ...distractors];
    if (options.length <= 1) return options;
    const offset =
      [...source.lexemeId].reduce(
        (sum, character) => sum + character.charCodeAt(0),
        0,
      ) % options.length;
    return [...options.slice(offset), ...options.slice(0, offset)];
  };

  const goToDailySessionStep = (session: DailySessionState) => {
    if (!ensureCurrentDailySession(session)) return;
    if (!catalog) {
      setToast("課程資料準備中，請稍候一秒。");
      return;
    }
    const entry = catalog.levels.find((item) => item.level === session.level);
    if (
      !entry ||
      entry.status === "disabled" ||
      !canAccessLevel(
        session.level,
        multiProgress.passedLevelIds,
        settings.showAdvancedPilots,
        entry.status,
      )
    ) {
      discardDailySession(
        "今日學習的程度目前無法使用，已重新建立今日學習流程。",
      );
      return;
    }
    if (courseDataStatusByLevel[session.level] !== "ready") {
      setToast(
        courseDataStatusByLevel[session.level] === "error"
          ? `${session.level} 課程資料載入失敗，請重新整理後再試。`
          : `${session.level} 課程資料準備中，請稍候一秒。`,
      );
      return;
    }
    const sessionLesson = flattenCourseLessons(
      courseUnitsByLevel[session.level],
    ).find((item) => item.id === session.lessonId);
    if (!sessionLesson) {
      discardDailySession(
        "今日學習內容已更新，已重新建立今日學習流程。",
      );
      return;
    }
    setMultiProgress((current) => ({
      ...current,
      selectedLevel: session.level,
    }));
    setSelectedLesson(sessionLesson);
    const nextStep = nextDailySessionStep(session);
    if (nextStep === "review") {
      setScreen("review");
      return;
    }
    if (nextStep === "lesson") {
      startLesson(sessionLesson, session.level);
      return;
    }
    if (nextStep === "weakness") {
      const remaining = remainingDailyWeaknessLexemeIds(session);
      if (
        remaining.some(
          (lexemeId) => !vocabularyPracticeSources.has(lexemeId),
        )
      ) {
        discardDailySession(
          "今日學習內容已更新，已重新建立今日學習流程。",
        );
        return;
      }
      startWeaknessPractice(remaining, "daily-summary");
      return;
    }
    setScreen("daily-summary");
  };

  const startDailyLearning = () => {
    const reviewItems = buildDailyReviewQueue({
      dueReviews,
      vocabularyProgress: multiProgress.vocabularyProgress,
      vocabularyTargets,
      sources: dailyReviewSources,
    });
    const session = createDailySession({
      startedAt: timestamp(),
      level: selectedLevel,
      lessonId: nextLesson.id,
      reviewItems,
      weaknessLexemeIds: vocabularyWeaknesses
        .slice(0, 3)
        .map((item) => item.lexemeId)
        .filter((lexemeId) => vocabularyPracticeSources.has(lexemeId)),
      beforeVocabulary: personalVocabularySummary,
    });
    commitDailySession(session, true);
    goToDailySessionStep(session);
  };

  const recordDailyReviewAttempt = (
    session: DailySessionState,
    item: DailyReviewQueueItem,
    attempt: number,
    correct: boolean,
    creditCorrect: boolean,
  ) => {
    const evidenceId =
      `daily-review:${session.localDate}:${item.id}:${attempt}`;
    const attemptKind: VocabularyEvidenceKind =
      item.mode === "spelling"
        ? "spellingAttempt"
        : item.mode === "recognition"
          ? "recognitionAttempt"
          : "applicationAttempt";
    const correctKind: VocabularyEvidenceKind =
      item.mode === "spelling"
        ? "spellingCorrect"
        : item.mode === "recognition"
          ? "recognitionCorrect"
          : "applicationCorrect";
    const studiedAt = new Date().toISOString();
    setMultiProgress((current) => {
      let vocabularyProgress = recordGlobalVocabularyEvidence(
        current.vocabularyProgress,
        {
          lexemeIds: [item.lexemeId],
          kind: attemptKind,
          evidenceId,
          sourceLevel: item.level,
          studiedAt,
          studyDate: session.localDate,
        },
      );
      if (correct && creditCorrect) {
        vocabularyProgress = recordGlobalVocabularyEvidence(
          vocabularyProgress,
          {
            lexemeIds: [item.lexemeId],
            kind: correctKind,
            evidenceId,
            sourceLevel: item.level,
            studiedAt,
            studyDate: session.localDate,
          },
        );
      }
      return { ...current, vocabularyProgress };
    });
  };

  const rescheduleDailyReview = (
    item: DailyReviewQueueItem,
    source: DailyReviewSource,
    successful: boolean,
  ) => {
    setMultiProgress((current) => {
      const levelProgress = current.levelProgress[item.level];
      const existing = levelProgress.reviewItems[item.occurrenceId];
      if (!existing) return current;
      return {
        ...current,
        levelProgress: {
          ...current.levelProgress,
          [item.level]: {
            ...levelProgress,
            reviewItems: {
              ...levelProgress.reviewItems,
              [item.occurrenceId]: rescheduleCompletedReview(
                {
                  ...existing,
                  answer: source.answer,
                  prompt: source.prompt,
                },
                successful,
              ),
            },
          },
        },
      };
    });
  };

  const completeDailyReviewItem = (
    session: DailySessionState,
    item: DailyReviewQueueItem,
    source: DailyReviewSource,
    successful: boolean,
    feedbackMessage: string,
  ) => {
    const updated = markDailyReviewCompleted(session, item.id);
    rescheduleDailyReview(item, source, successful);
    commitDailySession(updated, true);
    setDailyReviewResultItemId(item.id);
    setDailyReviewFeedback(feedbackMessage);
  };

  const checkDailyReview = (selectedOption?: string) => {
    const session = dailySessionRef.current;
    if (!session || !ensureCurrentDailySession(session)) return;
    const item = remainingDailyReviewItems(session)[0];
    if (!item) {
      goToDailySessionStep(session);
      return;
    }
    const source = resolveDailyReviewSource(item, dailyReviewSources);
    if (!source) {
      discardDailySession(
        "今日複習的正式課程來源已更新，請重新開始今天的學習。",
      );
      return;
    }
    const currentProgress = session.reviewItemProgress[item.id] ?? {
      attempts: 0,
      answerRevealed: false,
      usedPaste: false,
    };
    const submittedValue = selectedOption ?? dailyReviewValue;
    if (!submittedValue.trim()) {
      setDailyReviewFeedback("請先作答。");
      return;
    }
    const nextAttempt = currentProgress.attempts + 1;
    const correct =
      item.mode === "spelling"
        ? clean(submittedValue) === clean(source.answer)
        : item.mode === "recognition"
          ? submittedValue === source.prompt.trim().replace(/\s+/g, " ")
          : cleanSentence(submittedValue) === cleanSentence(source.sentence);
    const progressUpdated = updateDailyReviewItemProgress(
      session,
      item.id,
      { attempts: nextAttempt },
    );
    const creditCorrect =
      item.mode === "spelling"
        ? canCreditSpellingCorrect({
            correct,
            answerRevealed: currentProgress.answerRevealed,
            usedPaste: currentProgress.usedPaste,
          })
        : item.mode === "application"
          ? canCreditApplicationCorrect({
              correct,
              answerRevealed: currentProgress.answerRevealed,
              usedPaste: currentProgress.usedPaste,
            })
          : correct && !currentProgress.answerRevealed;
    recordDailyReviewAttempt(
      session,
      item,
      nextAttempt,
      correct,
      creditCorrect,
    );

    if (item.mode === "recognition") {
      setDailyReviewValue(submittedValue);
      completeDailyReviewItem(
        progressUpdated,
        item,
        source,
        correct,
        correct
          ? "答對了，已記錄這次辨認練習。"
          : `這次答案是「${source.prompt}」，明天會更早再複習。`,
      );
      return;
    }
    if (correct) {
      completeDailyReviewItem(
        progressUpdated,
        item,
        source,
        creditCorrect,
        creditCorrect
          ? "答對了，已記錄這次主動作答。"
          : currentProgress.usedPaste
            ? item.mode === "application"
              ? "答案正確，但使用貼上不會記為主動運用證據。"
              : "答案正確，但使用貼上不會記為乾淨的拼寫證據。"
            : item.mode === "application"
              ? "已正確重新輸入；揭示過答案，所以不計入主動運用證據。"
              : "已正確重新輸入；揭示過答案，所以不計入乾淨正確證據。",
      );
      return;
    }
    const revealAnswer = nextAttempt >= 3;
    const updated = updateDailyReviewItemProgress(
      progressUpdated,
      item.id,
      { answerRevealed: revealAnswer },
    );
    commitDailySession(updated, true);
    if (item.mode === "spelling") {
      const hint = recallIncorrectFeedback(
        submittedValue,
        source.answer,
        nextAttempt,
      );
      setDailyReviewFeedback(hint.message);
      if (hint.replayAudio) speak(source.answer, 1, false);
    } else {
      setDailyReviewFeedback(
        revealAnswer
          ? `正確答案是 ${source.sentence}。請重新輸入一次。`
          : nextAttempt === 1
            ? "句子還不完全正確，再聽一次提示後重試。"
            : `提示：英文句子共有 ${source.sentence.split(/\s+/).length} 個單字。`,
      );
    }
  };

  const continueDailyReview = () => {
    const session = dailySessionRef.current;
    if (!session || !ensureCurrentDailySession(session)) return;
    setDailyReviewValue("");
    setDailyReviewFeedback("");
    setDailyReviewResultItemId("");
    goToDailySessionStep(session);
  };

  const leaveDailyReview = () => {
    const session = dailySessionRef.current;
    if (!session || !ensureCurrentDailySession(session)) return;
    setDailyReviewValue("");
    setDailyReviewFeedback("");
    setDailyReviewResultItemId("");
    setScreen("home");
  };

  const continueDailyAfterLesson = () => {
    const session = dailySessionRef.current;
    if (
      !session ||
      session.level !== selectedLevel ||
      session.lessonId !== selectedLesson.id
    ) {
      continueAfterLesson();
      return;
    }
    if (!ensureCurrentDailySession(session)) return;
    const updated = markDailySessionStep(session, "lesson");
    commitDailySession(updated, true);
    goToDailySessionStep(updated);
  };

  const checkWeaknessPractice = () => {
    if (weaknessPracticeChecked) return;
    if (weaknessPracticeReturnScreen === "daily-summary") {
      const session = dailySessionRef.current;
      if (!session || !ensureCurrentDailySession(session)) return;
    }
    const lexemeId = weaknessPracticeQueue[weaknessPracticeIndex];
    const source = vocabularyPracticeSources.get(lexemeId);
    const weakness = vocabularyWeaknesses.find(
      (item) => item.lexemeId === lexemeId,
    );
    if (!source || !weakness) {
      setWeaknessPracticeFeedback("目前找不到可驗證的弱點資料。");
      return;
    }
    if (!weaknessPracticeValue.trim()) {
      setWeaknessPracticeFeedback("請先作答。");
      return;
    }
    const nextAttempt = weaknessPracticeAttempts + 1;
    const focus = weakness.focus;
    const correct =
      focus === "拼寫"
        ? clean(weaknessPracticeValue) === clean(source.answer)
        : focus === "運用"
          ? cleanSentence(weaknessPracticeValue) ===
            cleanSentence(source.sentence)
          : weaknessPracticeValue === source.prompt;
    const kindPrefix =
      focus === "拼寫"
        ? "spelling"
        : focus === "運用"
          ? "application"
          : "recognition";
    const evidenceId =
      `weakness:${kindPrefix}:${lexemeId}:${weaknessPracticeStartedAt}:${nextAttempt}`;
    const attemptKind: VocabularyEvidenceKind =
      focus === "拼寫"
        ? "spellingAttempt"
        : focus === "運用"
          ? "applicationAttempt"
          : "recognitionAttempt";
    const correctKind: VocabularyEvidenceKind =
      focus === "拼寫"
        ? "spellingCorrect"
        : focus === "運用"
          ? "applicationCorrect"
          : "recognitionCorrect";
    recordVocabularyEvidence(
      [lexemeId],
      attemptKind,
      evidenceId,
      source.level,
    );
    setWeaknessPracticeAttempts(nextAttempt);
    if (correct) {
      const cleanCredit =
        focus === "拼寫"
          ? canCreditSpellingCorrect({
              correct,
              answerRevealed: weaknessPracticeRevealed,
              usedPaste: weaknessPracticeUsedPaste,
            })
          : focus === "運用"
            ? canCreditApplicationCorrect({
                correct,
                answerRevealed: weaknessPracticeRevealed,
                usedPaste: weaknessPracticeUsedPaste,
              })
            : true;
      if (cleanCredit) {
        recordVocabularyEvidence(
          [lexemeId],
          correctKind,
          evidenceId,
          source.level,
        );
      }
      setWeaknessPracticeChecked(true);
      setWeaknessPracticeFeedback(
        cleanCredit
          ? "這次答對了，已記錄為有效的弱點練習。"
          : focus === "運用"
            ? "答案正確，但使用貼上不會記為主動運用證據。"
            : "答案正確，但使用貼上不會記為乾淨的拼寫證據。",
      );
      return;
    }
    if (nextAttempt >= 3) {
      setWeaknessPracticeRevealed(true);
      setWeaknessPracticeChecked(true);
      const expected =
        focus === "拼寫"
          ? source.answer
          : focus === "運用"
            ? source.sentence
            : source.prompt;
      setWeaknessPracticeFeedback(
        `已嘗試 3 次，正確答案是「${expected}」。這次不計入正確熟練證據。`,
      );
      return;
    }
    setWeaknessPracticeFeedback(
      `第 ${nextAttempt} 次還沒答對，再試一次。`,
    );
  };

  const continueWeaknessPractice = () => {
    if (weaknessPracticeReturnScreen === "daily-summary") {
      const session = dailySessionRef.current;
      if (!session || !ensureCurrentDailySession(session)) return;
      const lexemeId = weaknessPracticeQueue[weaknessPracticeIndex];
      const updated = markDailyWeaknessCompleted(session, lexemeId);
      commitDailySession(updated, true);
      const remaining = remainingDailyWeaknessLexemeIds(updated);
      if (remaining.length === 0) {
        setWeaknessPracticeQueue([]);
        setWeaknessPracticeIndex(0);
        resetWeaknessPractice();
        setScreen("daily-summary");
        return;
      }
      if (
        remaining.some(
          (remainingLexemeId) =>
            !vocabularyPracticeSources.has(remainingLexemeId),
        )
      ) {
        discardDailySession(
          "今日學習內容已更新，已重新建立今日學習流程。",
        );
        return;
      }
      setWeaknessPracticeQueue(remaining);
      setWeaknessPracticeIndex(0);
      setWeaknessPracticeStartedAt(timestamp());
      resetWeaknessPractice();
      return;
    }
    if (weaknessPracticeIndex < weaknessPracticeQueue.length - 1) {
      setWeaknessPracticeIndex((value) => value + 1);
      resetWeaknessPractice();
      return;
    }
    setScreen("weakness");
  };

  const finishDailySession = () => {
    const session = dailySessionRef.current;
    if (session && !ensureCurrentDailySession(session)) return;
    commitDailySession(null, true);
    setWeaknessPracticeQueue([]);
    setWeaknessPracticeIndex(0);
    resetWeaknessPractice();
    setScreen("home");
  };

  const renderConversation = () => (
    <ConversationScreen
      conversationA2Unlocked={conversationA2Unlocked}
      conversationCompletedLessonIds={conversationCompletedLessonIds}
      conversationSourceRows={conversationSourceRows}
      setScreen={setScreen}
      settings={settings}
      speak={speak}
      speechSupported={speechSupported}
    />
  );

  const renderHome = () => (
    <HomeScreen
      allLessons={allLessons}
      completedCount={completedCount}
      coursePercent={coursePercent}
      courseUnits={courseUnits}
      dailySession={dailySession}
      dueReviews={dueReviews}
      focusOnMountWithoutScroll={focusOnMountWithoutScroll}
      goToDailySessionStep={goToDailySessionStep}
      isLessonAvailable={isLessonAvailable}
      isUnitAvailable={isUnitAvailable}
      nextLesson={nextLesson}
      progress={progress}
      selectedLevel={selectedLevel}
      setScreen={setScreen}
      startAssessment={startAssessment}
      startDailyLearning={startDailyLearning}
      startLesson={startLesson}
      vocabularyWeaknesses={vocabularyWeaknesses}
      weeklyStudyDays={weeklyStudyDays}
    />
  );

  const renderLevelSelector = () => (
    <LevelSelector
      catalog={catalog}
      levelSummary={levelSummary}
      multiProgress={multiProgress}
      selectedLevel={selectedLevel}
      settings={settings}
      switchLevel={switchLevel}
    />
  );

  const renderMap = () => (
    <CourseMapScreen
      catalog={catalog}
      coursePercent={coursePercent}
      courseUnits={courseUnits}
      isLessonAvailable={isLessonAvailable}
      isUnitAvailable={isUnitAvailable}
      levelStatusLabel={levelStatusLabel}
      nextLesson={nextLesson}
      progress={progress}
      renderLevelSelector={renderLevelSelector}
      selectedLevel={selectedLevel}
      startAssessment={startAssessment}
      startLesson={startLesson}
    />
  );

  const renderAlphabet = () => (
    <AlphabetScreen
      speak={speak}
    />
  );

  const renderPhonetics = () => (
    <PhoneticsScreen
      kkAudioMessage={kkAudioMessage}
      playKkAudio={playKkAudio}
      playKkSequence={playKkSequence}
    />
  );

  const renderRelatedVocabulary = () => (
    <RelatedVocabularyScreen
      activeVocabularyGroupId={activeVocabularyGroupId}
      audioMessage={audioMessage}
      loaded={loaded}
      multiProgress={multiProgress}
      openedVocabularyLexemeId={openedVocabularyLexemeId}
      openVocabularyItem={openVocabularyItem}
      playRelatedVocabularyAudio={playRelatedVocabularyAudio}
      progressStorageWritable={progressStorageWritable}
      relatedCurrentLexemeId={relatedCurrentLexemeId}
      returnFromRelatedVocabulary={returnFromRelatedVocabulary}
      searchableVocabularyDataset={searchableVocabularyDataset}
      selectVocabularyGroup={selectVocabularyGroup}
      setReferenceRecognitionSession={setReferenceRecognitionSession}
      setScreen={setScreen}
      settings={settings}
      setVocabularyFilter={setVocabularyFilter}
      setVocabularySearch={setVocabularySearch}
      speechSupported={speechSupported}
      vocabularyDataset={vocabularyDataset}
      vocabularyDataStatus={vocabularyDataStatus}
      vocabularyFilter={vocabularyFilter}
      vocabularyLoadError={vocabularyLoadError}
      vocabularyReturnContext={vocabularyReturnContext}
      vocabularySearch={vocabularySearch}
      vocabularyTargets={vocabularyTargets}
    />
  );

  const renderLearning = () => (
    <LearningScreen
      advanceFromDetail={advanceFromDetail}
      afterLessonLabel={afterLessonLabel}
      audioMessage={audioMessage}
      audioReplays={audioReplays}
      beginRecall={beginRecall}
      checkPassageComprehension={checkPassageComprehension}
      checkPassageRebuild={checkPassageRebuild}
      checkPatternTransfer={checkPatternTransfer}
      checkRebuild={checkRebuild}
      checkRecall={checkRecall}
      checkRecognition={checkRecognition}
      checkTextResponse={checkTextResponse}
      completeRevealedPassage={completeRevealedPassage}
      continueAfterLesson={continueAfterLesson}
      continueAfterPatternTransfer={continueAfterPatternTransfer}
      continueAfterRebuild={continueAfterRebuild}
      continueAfterRecognition={continueAfterRecognition}
      continueDailyAfterLesson={continueDailyAfterLesson}
      continuePassageComprehension={continuePassageComprehension}
      currentPassageQuestion={currentPassageQuestion}
      currentPatternExample={currentPatternExample}
      currentToken={currentToken}
      currentTokenHintLevel={currentTokenHintLevel}
      currentTokenWords={currentTokenWords}
      dailySession={dailySession}
      feedback={feedback}
      finishLesson={finishLesson}
      getToken={getToken}
      openRelatedVocabularyFromDetail={openRelatedVocabularyFromDetail}
      passageAnswer={passageAnswer}
      passageAnswerRevealed={passageAnswerRevealed}
      passageEvaluation={passageEvaluation}
      passageQuestionChecked={passageQuestionChecked}
      passageQuestionIndex={passageQuestionIndex}
      passageValues={passageValues}
      patternExampleIndex={patternExampleIndex}
      patternTransferComplete={patternTransferComplete}
      patternTransferRevealed={patternTransferRevealed}
      patternTransferValue={patternTransferValue}
      playSentenceAudio={playSentenceAudio}
      playTokenAudio={playTokenAudio}
      progress={progress}
      rebuildAnswerRevealed={rebuildAnswerRevealed}
      rebuildAttempts={rebuildAttempts}
      rebuildStatus={rebuildStatus}
      rebuildValues={rebuildValues}
      recallAnswerRevealed={recallAnswerRevealed}
      recallInputs={recallInputs}
      recallValues={recallValues}
      recognitionChecked={recognitionChecked}
      recognitionSelectedId={recognitionSelectedId}
      requestHint={requestHint}
      selectedLesson={selectedLesson}
      selectedLevel={selectedLevel}
      selectedPassageComprehension={selectedPassageComprehension}
      selectedPassageLessons={selectedPassageLessons}
      selectedPatternExamples={selectedPatternExamples}
      selectedRecognition={selectedRecognition}
      selectedTextResponse={selectedTextResponse}
      selectedTransferPatternId={selectedTransferPatternId}
      selectedTransferPatternName={selectedTransferPatternName}
      selectedUnit={selectedUnit}
      sentenceAudioAvailable={sentenceAudioAvailable}
      sessionPassageComprehensionAttempts={sessionPassageComprehensionAttempts}
      sessionPassageComprehensionCorrect={sessionPassageComprehensionCorrect}
      sessionRecognitionAttempts={sessionRecognitionAttempts}
      sessionRecognitionCorrect={sessionRecognitionCorrect}
      sessionTokenProgress={sessionTokenProgress}
      sessionTransferAttempts={sessionTransferAttempts}
      sessionTransferCorrect={sessionTransferCorrect}
      setPassageAnswer={setPassageAnswer}
      setPassageValues={setPassageValues}
      setPatternTransferUsedPaste={setPatternTransferUsedPaste}
      setPatternTransferValue={setPatternTransferValue}
      setRebuildUsedPaste={setRebuildUsedPaste}
      setRebuildValues={setRebuildValues}
      setRecallUsedPaste={setRecallUsedPaste}
      setRecallValues={setRecallValues}
      setRecognitionSelectedId={setRecognitionSelectedId}
      setScreen={setScreen}
      setTextResponseSelectedId={setTextResponseSelectedId}
      settings={settings}
      setToast={setToast}
      stage={stage}
      textResponseChecked={textResponseChecked}
      textResponseSelectedId={textResponseSelectedId}
      tokenAudioAvailable={tokenAudioAvailable}
      tokenIndex={tokenIndex}
      transferReviewSource={transferReviewSource}
      updateFamiliarity={updateFamiliarity}
      vocabularyDataset={vocabularyDataset}
    />
  );

  const renderReview = () => (
    <ReviewScreen
      checkDailyReview={checkDailyReview}
      commitDailySession={commitDailySession}
      continueDailyReview={continueDailyReview}
      courseUnits={courseUnits}
      dailyReviewFeedback={dailyReviewFeedback}
      dailyReviewResultItemId={dailyReviewResultItemId}
      dailyReviewSources={dailyReviewSources}
      dailyReviewValue={dailyReviewValue}
      dailySession={dailySession}
      dailySessionRef={dailySessionRef}
      discardDailySession={discardDailySession}
      dueReviews={dueReviews}
      ensureCurrentDailySession={ensureCurrentDailySession}
      leaveDailyReview={leaveDailyReview}
      progress={progress}
      setDailyReviewValue={setDailyReviewValue}
      speak={speak}
      speechSupported={speechSupported}
      startLesson={startLesson}
      updateFamiliarity={updateFamiliarity}
    />
  );

  const renderWeakness = () => (
    <WeaknessScreen
      nextLesson={nextLesson}
      setScreen={setScreen}
      startLesson={startLesson}
      startWeaknessPractice={startWeaknessPractice}
      vocabularyWeaknesses={vocabularyWeaknesses}
    />
  );
  const renderWeaknessPractice = () => (
    <WeaknessPracticeScreen
      checkWeaknessPractice={checkWeaknessPractice}
      continueWeaknessPractice={continueWeaknessPractice}
      dailySession={dailySession}
      recognitionOptionsForWeakness={recognitionOptionsForWeakness}
      setScreen={setScreen}
      setWeaknessPracticeUsedPaste={setWeaknessPracticeUsedPaste}
      setWeaknessPracticeValue={setWeaknessPracticeValue}
      speak={speak}
      vocabularyPracticeSources={vocabularyPracticeSources}
      vocabularyWeaknesses={vocabularyWeaknesses}
      weaknessPracticeChecked={weaknessPracticeChecked}
      weaknessPracticeFeedback={weaknessPracticeFeedback}
      weaknessPracticeIndex={weaknessPracticeIndex}
      weaknessPracticeQueue={weaknessPracticeQueue}
      weaknessPracticeReturnScreen={weaknessPracticeReturnScreen}
      weaknessPracticeRevealed={weaknessPracticeRevealed}
      weaknessPracticeValue={weaknessPracticeValue}
    />
  );

  const renderDailySummary = () => (
    <DailySummaryScreen
      dailySession={dailySession}
      finishDailySession={finishDailySession}
      personalVocabularySummary={personalVocabularySummary}
      startDailyLearning={startDailyLearning}
    />
  );

  const renderProgress = () => (
    <ProgressScreen
      accuracy={accuracy}
      coursePercent={coursePercent}
      courseUnits={courseUnits}
      multiProgress={multiProgress}
      progress={progress}
      selectedLevel={selectedLevel}
      vocabularyTargets={vocabularyTargets}
      vocabularyTargetsError={vocabularyTargetsError}
    />
  );

  const updateCourseDraftRow = (
    row: A1CourseCsvRow,
    updates: Record<string, string>,
  ) => {
    setCourseDraftRows((rows) =>
      rows.map((item) =>
        item.occurrence_id === row.occurrence_id
          ? { ...item, ...updates }
          : item,
      ),
    );
  };

  const validateAndApplyCourseDraft = () => {
    const report = validateSelectedCourseRows(
      courseDraftRows,
      courseRows,
    );
    setImportReport(report);
    if (!report.valid) {
      setToast(
        `草稿未套用：成功 ${report.successfulRows} 列、失敗 ${report.failedRows} 列。`,
      );
      return;
    }
    applyCourseRows(courseDraftRows);
    setToast(`草稿驗證通過，已套用 ${report.successfulRows} 列。`);
  };

  const discardCourseDraft = () => {
    setCourseDraftRows(courseRows);
    setImportReport(null);
    setToast("已放棄尚未套用的草稿。");
  };

  const restoreOfficialCourseData = () => {
    if (!officialCourseRows.length) return;
    applyCourseRows(officialCourseRows);
    setImportReport(null);
    if (selectedLevel !== "A1") {
      removeStorageItem(courseRowsStorageKey(selectedLevel));
    }
    setToast(
      `已還原 public/data/${contentSourceVersion} ${
        selectedLevel === "A1" ? "正式" : "試行"
      }課程資料。`,
    );
  };

  const contentStats = {
    units: new Set(contentRows.map((row) => row.unit_id)).size,
    lessons: new Set(contentRows.map((row) => row.lesson_id)).size,
    sentences: new Set(contentRows.map((row) => row.sentence_id)).size,
    occurrences: contentRows.length,
    pendingQa: contentRows.filter((row) =>
      ["pilot_review_required", "machine_checked"].includes(
        row.qa_status,
      ),
    ).length,
  };

  const renderAdmin = () => (
    <ContentAdminScreen
      adminSearch={adminSearch}
      adminUnit={adminUnit}
      contentSourceVersion={contentSourceVersion}
      contentStats={contentStats}
      courseRowsUpdatedAt={courseRowsUpdatedAt}
      courseSourceRevision={courseSourceRevision}
      courseUnits={courseUnits}
      discardCourseDraft={discardCourseDraft}
      exportContentCsv={exportContentCsv}
      exportContentJson={exportContentJson}
      exportContentXlsx={exportContentXlsx}
      filteredRows={filteredRows}
      importContent={importContent}
      importReport={importReport}
      levelStatusLabel={levelStatusLabel}
      renderLevelSelector={renderLevelSelector}
      restoreOfficialCourseData={restoreOfficialCourseData}
      selectedLevel={selectedLevel}
      setAdminSearch={setAdminSearch}
      setAdminUnit={setAdminUnit}
      updateCourseDraftRow={updateCourseDraftRow}
      validateAndApplyCourseDraft={validateAndApplyCourseDraft}
    />
  );

  const renderSettings = () => (
    <SettingsScreen
      exportProgress={exportProgress}
      importProgress={importProgress}
      multiProgress={multiProgress}
      setSettings={setSettings}
      settings={settings}
    />
  );

  const renderAssessment = () => (
    <AssessmentScreen
      assessment={assessment}
      assessmentValue={assessmentValue}
      checkAssessment={checkAssessment}
      nextAssessment={nextAssessment}
      setAssessment={setAssessment}
      setAssessmentValue={setAssessmentValue}
      setScreen={setScreen}
      speak={speak}
    />
  );

  const renderVocabularyLibrary = () => (
    <VocabularyLibraryScreen
      multiProgress={multiProgress}
      recordVocabularyLibraryEvidence={recordVocabularyLibraryEvidence}
      vocabularyLibrary={vocabularyLibrary}
      vocabularyLibraryEntries={vocabularyLibraryEntries}
      vocabularyLibraryError={vocabularyLibraryError}
      vocabularyLibraryStatus={vocabularyLibraryStatus}
      vocabularySupplements={vocabularySupplements}
      vocabularyTargets={vocabularyTargets}
    />
  );

  const renderScreen = () => {
    if (screen === "reference-recognition" && referenceRecognitionSession && vocabularyDataset && vocabularyTargets) {
      return <ReferenceRecognitionPractice
        title={referenceRecognitionSession.title}
        questions={referenceRecognitionSession.questions}
        onExit={() => setScreen("related-vocabulary")}
        onAnswer={(question, selectedAnswer) => {
          const studiedAt = new Date().toISOString();
          setMultiProgress((current) => ({
            ...current,
            vocabularyProgress: recordReferenceRecognitionResult(current.vocabularyProgress, {
              dataset: vocabularyDataset, targets: vocabularyTargets,
              question, selectedAnswer, studiedAt, studyDate: localDateKey(new Date(studiedAt)),
            }),
          }));
        }}
      />;
    }
    if (screen === "related-vocabulary") {
      return renderRelatedVocabulary();
    }
    if (screen === "vocabulary-library") {
      return renderVocabularyLibrary();
    }
    if (screen === "conversation") {
      return renderConversation();
    }
    if (courseDataStatus === "loading") {
      return (
        <section className="section-card">
          <strong>
            {selectedLevel === "A1"
              ? "正在載入 A1 正式課程資料…"
              : `正在載入 ${selectedLevel} 試行課程資料…`}
          </strong>
        </section>
      );
    }
    if (courseDataStatus === "error") {
      return (
        <section
          className="section-card"
          data-testid={`${selectedLevel.toLowerCase()}-load-error`}
        >
          <strong>
            {selectedLevel} {levelStatusLabel}資料載入失敗
          </strong>
          <p>請重新整理頁面後再試。</p>
          {courseLoadErrors[selectedLevel] && (
            <small>{courseLoadErrors[selectedLevel]}</small>
          )}
          {selectedLevel !== "A1" && (
            <button
              className="secondary-button"
              data-testid="return-a1-from-error"
              onClick={() => switchLevel("A1")}
            >
              返回 A1 正式課程
            </button>
          )}
        </section>
      );
    }
    if (screen === "home") return renderHome();
    if (screen === "map") return renderMap();
    if (screen === "alphabet") return renderAlphabet();
    if (screen === "phonetics") return renderPhonetics();
    if (screen === "review") return renderReview();
    if (screen === "weakness") return renderWeakness();
    if (screen === "weakness-practice") return renderWeaknessPractice();
    if (screen === "daily-summary") return renderDailySummary();
    if (screen === "progress") return renderProgress();
    if (screen === "admin") return renderAdmin();
    if (screen === "settings") return renderSettings();
    if (screen === "learning") return renderLearning();
    if (screen === "assessment") return renderAssessment();
    return renderHome();
  };

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          pageContentRef.current?.focus();
        }}
      >
        跳到主要內容
      </a>
      <aside className="sidebar">
        <button className="brand" onClick={() => setScreen("home")} aria-label="回首頁">
          <span className="brand-mark">E</span>
          <span><strong>英句練習</strong><small>一句一句，真的記住</small></span>
        </button>
        <nav aria-label="主要導覽" ref={mainNavRef}>
          {navItems.map((item) => (
            <button
              key={item.screen}
              className={screen === item.screen ? "active" : ""}
              onClick={() =>
                item.screen === "related-vocabulary"
                  ? openRelatedVocabularyFromNavigation()
                  : setScreen(item.screen)
              }
              aria-label={`前往${item.label}`}
              aria-current={screen === item.screen ? "page" : undefined}
              aria-describedby={item.screen === "review"
                ? "review-count-description"
                : item.screen === "weakness" ? "weakness-count-description" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}
              {item.screen === "review" && (
                <>
                  {dueReviews.length > 0 && <b aria-hidden="true">{dueReviews.length}</b>}
                  <span id="review-count-description" className="visually-hidden">
                    {dueReviews.length} 項待複習內容
                  </span>
                </>
              )}
              {item.screen === "weakness" && (
                <span id="weakness-count-description" className="visually-hidden">
                  {vocabularyWeaknesses.length} 個待加強單字
                </span>
              )}
              {item.screen === "weakness" && vocabularyWeaknesses.length > 0 && (
                <b aria-hidden="true">{vocabularyWeaknesses.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div><span>{selectedLevel}</span><strong>{coursePercent}%</strong></div>
          <progress value={coursePercent} max={100} />
          <small>目前程度・{levelStatusLabel}</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div data-testid="storage-status">
            <span
              className={`online-dot${storageWriteFailed ? " storage-warning" : ""}`}
            />{" "}
            {storageWriteFailed ? "本機進度未能儲存" : "本機進度已儲存"}
          </div>
          <div className="top-actions">
            <span
              className="streak"
              data-testid="topbar-weekly-study-days"
            >
              ◆ 本週 {weeklyStudyDays} 天
            </span>
            {dailySession && (
              <button
                data-testid="daily-session-resume"
                onClick={() => goToDailySessionStep(dailySession)}
              >
                今日學習進行中
              </button>
            )}
            <button
              onClick={() => setScreen("settings")}
              className={screen === "settings" ? "active" : ""}
              aria-current={screen === "settings" ? "page" : undefined}
            >設定</button>
          </div>
        </header>
        <div
          className="page-content"
          id="main-content"
          ref={pageContentRef}
          tabIndex={-1}
          role="region"
          aria-label="主要內容"
        >
          {renderScreen()}
        </div>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
