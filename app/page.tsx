"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  alphabet,
  CourseUnit,
  LearningToken,
  Lesson,
} from "./course-data";
import { advancedCoursePlans } from "./course-roadmap";
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
  ReviewFamiliarity,
  ReviewScheduleItem,
  reviewIntervalForToken,
  scheduleTokenReview,
  TokenLearningProgressMap,
  updateTokenLearningProgress,
} from "./learning-progress";
import {
  evaluateRebuildAttempt,
  RebuildStatus,
} from "./rebuild-flow";
import { KkPhoneticEntry, kkPhoneticGroups } from "./kk-phonetics";
import { wordAccuracy } from "./assessment-scoring";
import {
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
  type LevelLearningProgress,
  type MultiLevelProgress,
  type PassageLearningStats,
  type PatternLearningStats,
  type SentenceLearningStats,
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
  type ResolvedVocabularyGroup,
  type ResolvedVocabularyItem,
  type VocabularyCourseReturnContext,
  type VocabularyDataset,
  type VocabularyLearningStatus,
  type VocabularyStatusFilter,
  resolveVocabularyGroupSelection,
  vocabularyGroupForLexeme,
  vocabularyItemMatchesSearch,
  vocabularyLearningState,
  vocabularyStatusMatchesFilter,
} from "./vocabulary-groups";
import {
  buildVocabularyTargetAliasIndex,
  buildVocabularyCoverageReport,
  canonicalizeLexemeId,
  loadVocabularyTargets,
  type VocabularyTargetsData,
} from "./vocabulary-targets.ts";
import {
  canCreditSpellingCorrect,
  recordGlobalVocabularyEvidence,
  summarizeVocabularyProgress,
  type VocabularyEvidenceKind,
} from "./vocabulary-progress.ts";
import { buildVocabularyWeaknesses } from "./daily-learning.ts";
import {
  createDailySession,
  markDailySessionStep,
  nextDailySessionStep,
  summarizeDailySession,
  type DailySessionState,
} from "./daily-session.ts";

type Screen =
  | "home"
  | "map"
  | "alphabet"
  | "phonetics"
  | "related-vocabulary"
  | "review"
  | "weakness"
  | "weakness-practice"
  | "daily-summary"
  | "progress"
  | "admin"
  | "settings"
  | "learning"
  | "assessment";
type LearningStage =
  | "intro"
  | "recall"
  | "detail"
  | "rebuild"
  | "reading-recognition"
  | "pattern-transfer"
  | "text-response"
  | "passage-rebuild"
  | "passage-comprehension"
  | "result";
type Familiarity = ReviewFamiliarity;
type Assessment = {
  kind: "unit" | "level";
  title: string;
  lessons: Lesson[];
  index: number;
  scores: number[];
  checked: boolean;
  lastScore: number;
};

type ReviewItem = ReviewScheduleItem;

type WeaknessPracticeSource = {
  lexemeId: string;
  answer: string;
  prompt: string;
  sentence: string;
  translation: string;
  level: CefrLevel;
};

const emptySentenceStats = (): SentenceLearningStats => ({
  rebuildAttempts: 0,
  recognitionAttempts: 0,
  recognitionCorrect: 0,
  elapsedSeconds: 0,
});

const emptyPatternStats = (): PatternLearningStats => ({
  transferAttempts: 0,
  transferCorrect: 0,
  uniqueVariationsCompleted: [],
  lastPracticedAt: "",
  nextReviewAt: "",
});

const emptyPassageStats = (): PassageLearningStats => ({
  rebuildAttempts: 0,
  comprehensionAttempts: 0,
  comprehensionCorrect: 0,
  lastPracticedAt: "",
});

type ProgressState = LevelLearningProgress;

type SettingsState = {
  phonetic: "KK" | "IPA";
  autoplay: boolean;
  slowRate: number;
  showAdvancedPilots: boolean;
};

const STORAGE = {
  progress: "yingju-progress-v1",
  settings: "yingju-settings-v1",
  courseRows: "yingju-course-rows-v3",
  a2CourseRows: "yingju-course-rows-a2-v1",
  b1CourseRows: "yingju-course-rows-b1-v1",
  b2CourseRows: "yingju-course-rows-b2-v1",
  lastVocabularyGroup: "yingju-last-vocabulary-group-v1",
};

const emptyRowsByLevel = (): Record<CefrLevel, CourseCsvRow[]> => ({
  A1: [],
  A2: [],
  B1: [],
  B2: [],
});

const emptyStringsByLevel = (): Record<CefrLevel, string> => ({
  A1: "",
  A2: "",
  B1: "",
  B2: "",
});

const emptyUnitsByLevel = (): Record<CefrLevel, CourseUnit[]> => ({
  A1: [],
  A2: [],
  B1: [],
  B2: [],
});

const emptyExercisesByLevel =
  (): Record<CefrLevel, CourseExerciseData | null> => ({
    A1: null,
    A2: null,
    B1: null,
    B2: null,
  });

const emptyStatusesByLevel = (): Record<
  CefrLevel,
  "loading" | "ready" | "error"
> => ({
  A1: "loading",
  A2: "loading",
  B1: "loading",
  B2: "loading",
});

const courseRowsStorageKey = (level: CefrLevel) => {
  if (level === "A1") return STORAGE.courseRows;
  if (level === "A2") return STORAGE.a2CourseRows;
  if (level === "B1") return STORAGE.b1CourseRows;
  return STORAGE.b2CourseRows;
};

const defaultSettings: SettingsState = {
  phonetic: "KK",
  autoplay: true,
  slowRate: 0.85,
  showAdvancedPilots: false,
};

const normalizeSettings = (value: unknown): SettingsState => {
  const saved =
    value && typeof value === "object"
      ? (value as Partial<SettingsState> & { showA2Pilot?: boolean })
      : {};
  return {
    phonetic: saved.phonetic === "IPA" ? "IPA" : "KK",
    autoplay: saved.autoplay ?? defaultSettings.autoplay,
    slowRate:
      typeof saved.slowRate === "number"
        ? saved.slowRate
        : defaultSettings.slowRate,
    showAdvancedPilots:
      saved.showAdvancedPilots ?? saved.showA2Pilot ?? false,
  };
};

const navItems: { screen: Screen; label: string; icon: string }[] = [
  { screen: "home", label: "首頁", icon: "⌂" },
  { screen: "map", label: "課程地圖", icon: "◉" },
  { screen: "alphabet", label: "A–Z 基礎", icon: "Aa" },
  { screen: "phonetics", label: "KK 音標", icon: "KK" },
  { screen: "related-vocabulary", label: "相關字詞", icon: "▦" },
  { screen: "review", label: "待複習", icon: "↻" },
  { screen: "weakness", label: "弱點中心", icon: "△" },
  { screen: "progress", label: "學習進度", icon: "▥" },
  { screen: "admin", label: "內容管理", icon: "≡" },
];

const vocabularyStatusLabels: Record<
  VocabularyLearningStatus,
  string
> = {
  current: "本課單字",
  learned: "已學",
  "review-due": "待複習",
  "not-learned": "尚未正式學習",
};

const vocabularyFilters: {
  id: VocabularyStatusFilter;
  label: string;
}[] = [
  { id: "all", label: "全部" },
  { id: "learned", label: "已學" },
  { id: "not-learned", label: "尚未正式學習" },
  { id: "review-due", label: "待複習" },
];

const clean = (value: string) =>
  value
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();

const cleanSentence = (value: string) => clean(value).replace(/[.!?。！？]+$/g, "");

const patternFor = (answer: string) =>
  answer
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z]/gi, "").length)
    .join("－");

const editDistance = (a: string, b: string) => {
  const rows = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length][b.length];
};

const dateKey = () => new Date().toISOString().slice(0, 10);
const timestamp = () => Date.now();

const addDays = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString();
};

const saveFile = (content: BlobPart, name: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const activateButtonOnEnter = (
  event: KeyboardEvent<HTMLButtonElement>,
  action: () => void,
) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  action();
};

const EMPTY_TOKEN: LearningToken = {
  id: "",
  tokenId: "",
  occurrenceId: "",
  answer: "",
  prompt: "",
  promptType: "meaning",
  partOfSpeech: "",
  dictionaryPos: "",
  contextPos: "",
  semanticRole: "",
  lexemeId: "",
  senseId: "",
  kk: "",
  ipa: "",
  ipaStandalone: "",
  ipaInSentence: "",
  syllables: "",
  stress: "",
  lemma: "",
  note: "",
  patternId: "",
  audioMethod: "",
  audioStatus: "pending",
  wordAudioSource: "",
  audioSource: "",
  license: "",
  isNewWord: false,
  isNewPattern: false,
  isNewCombination: false,
  isNewContent: false,
  qaStatus: "",
};

const EMPTY_LESSON: Lesson = {
  id: "",
  number: 0,
  title: "",
  sentence: "",
  translation: "",
  grammar: "",
  minutes: 0,
  tokens: [EMPTY_TOKEN],
  passageId: "",
  passageOrder: 0,
  sentenceId: "",
  sentenceOrder: 0,
  sentencePatternId: "",
  patternName: "",
  patternCefr: "",
  isNewSentencePattern: false,
  sentenceAudioSource: "",
  audioStatus: "pending",
  sourceVersion: OFFICIAL_A1_SOURCE_VERSION,
};

const EMPTY_UNIT: CourseUnit = {
  id: "",
  number: 0,
  title: "",
  description: "",
  accent: "#f47b5b",
  lessons: [],
};

function ProgressRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="progress-ring" style={{ "--progress": `${value * 3.6}deg` } as React.CSSProperties}>
      <div>
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

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
  const [usedPaste, setUsedPaste] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [audioMessage, setAudioMessage] = useState("");
  const [kkAudioMessage, setKkAudioMessage] = useState("");
  const [vocabularyDataset, setVocabularyDataset] =
    useState<VocabularyDataset | null>(null);
  const [vocabularyDataStatus, setVocabularyDataStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [vocabularyLoadError, setVocabularyLoadError] = useState("");
  const [vocabularyTargets, setVocabularyTargets] =
    useState<VocabularyTargetsData | null>(null);
  const [vocabularyTargetsError, setVocabularyTargetsError] = useState("");
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
    () => typeof window === "undefined" || "speechSynthesis" in window,
  );
  const recallInputs = useRef<Array<HTMLInputElement | null>>([]);
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
            lexemeId: canonical,
            answer: token.answer,
            prompt: token.prompt,
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
        },
      ),
    }));
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
        const storedRows = localStorage.getItem(STORAGE.courseRows);
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
              localStorage.removeItem(STORAGE.courseRows);
            }
          } catch {
            localStorage.removeItem(STORAGE.courseRows);
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
            const storedRows = localStorage.getItem(storageKey);
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
                  localStorage.removeItem(storageKey);
                }
              } catch {
                localStorage.removeItem(storageKey);
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
      const storedProgress = localStorage.getItem(STORAGE.progress);
      const storedSettings = localStorage.getItem(STORAGE.settings);
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
      } finally {
        setLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded || !progressStorageWritable) return;
    localStorage.setItem(
      STORAGE.progress,
      JSON.stringify(multiProgress),
    );
  }, [loaded, multiProgress, progressStorageWritable]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
  }, [loaded, settings]);

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
    localStorage.setItem(
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
          localStorage.getItem(STORAGE.lastVocabularyGroup) ?? "";
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
        localStorage.setItem(
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
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const allLessons = useMemo(
    () => flattenCourseLessons(courseUnits),
    [courseUnits],
  );

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
  const currentPassageQuestion =
    selectedPassageComprehension?.questions[passageQuestionIndex];
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
    if (!("speechSynthesis" in window)) {
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

  const scrollToRelatedLexeme = (lexemeId: string) => {
    if (!lexemeId) return;
    window.setTimeout(() => {
      document
        .getElementById(`related-word-${lexemeId}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 120);
  };

  const selectVocabularyGroup = (
    groupId: string,
    lexemeId = "",
  ) => {
    setActiveVocabularyGroupId(groupId);
    setOpenedVocabularyLexemeId(lexemeId);
    localStorage.setItem(STORAGE.lastVocabularyGroup, groupId);
    scrollToRelatedLexeme(lexemeId);
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

  const startLesson = (item: Lesson) => {
    if (courseDataStatus !== "ready" || !item.id) {
      setToast(
        courseDataStatus === "error"
          ? "正式課程資料載入失敗，請重新整理後再試。"
          : "正式課程資料準備中，請稍候一秒。",
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
    setUsedPaste(false);
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
    setUsedPaste(false);
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
    if (level === 1) setFeedback(`字母數：${patternFor(currentToken.answer)}`);
    if (level === 2) {
      setFeedback(`第一個字母：${currentToken.answer.trim()[0]}`);
      playTokenAudio(currentToken, 1, false);
    }
    if (level === 3) {
      setFeedback(`正確答案是 ${currentToken.answer}。請重新輸入一次。`);
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
          usedPaste,
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
          usedPaste,
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
        pasteCount: value.pasteCount + (usedPaste ? 1 : 0),
        tokenProgress: updateTokenLearningProgress(
          value.tokenProgress,
          currentToken.occurrenceId,
          {
            attemptDelta: 1,
            elapsedDelta: elapsed,
            usedPaste,
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
    setSessionTokenProgress((value) =>
      updateTokenLearningProgress(value, currentToken.occurrenceId, {
        attemptDelta: 1,
        elapsedDelta: elapsed,
        usedPaste,
        answerRevealed: nextAttempt >= 3,
      }),
    );
    setProgress((value) => ({
      ...value,
      totalAttempts: value.totalAttempts + 1,
      totalSeconds: value.totalSeconds + elapsed,
      pasteCount: value.pasteCount + (usedPaste ? 1 : 0),
      tokenProgress: updateTokenLearningProgress(
        value.tokenProgress,
        currentToken.occurrenceId,
        {
          attemptDelta: 1,
          elapsedDelta: elapsed,
          usedPaste,
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
    if (
      clean(recallAnswer).length > 1 &&
      editDistance(clean(recallAnswer), clean(currentToken.answer)) <= 2
    ) {
      setFeedback("拼字很接近，再檢查一次。");
    } else if (nextAttempt === 1) {
      setFeedback(`字母數：${patternFor(currentToken.answer)}`);
    } else if (nextAttempt === 2) {
      setFeedback(`第一個字母：${currentToken.answer.trim()[0]}`);
      playTokenAudio(currentToken, 1, false);
    } else {
      setFeedback(`正確答案是 ${currentToken.answer}。請重新輸入一次。`);
      setRecallAnswerRevealed(true);
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
      `rebuild:${selectedLesson.sentenceId}:${dateKey()}:${result.attempts}`;
    const rebuildLexemeIds = selectedLesson.tokens.map(
      (token) => token.lexemeId ?? token.tokenId ?? token.id,
    );
    recordVocabularyEvidence(
      rebuildLexemeIds,
      "applicationAttempt",
      rebuildEvidenceId,
    );
    if (result.correct) {
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
      setFeedback("順序與拼字都正確！完成格式如下：");
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
    const shouldStartPassageRebuild =
      selectedPassageLessons.length > 1 &&
      selectedPassageLessons.every(
        (lesson) =>
          lesson.id === selectedLesson.id ||
          progress.completedLessonIds.includes(lesson.id),
      );
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
    const nextAttempt = patternTransferAttempts + 1;
    const transferEvidenceId =
      `transfer:${currentPatternExample.id}:${dateKey()}:${nextAttempt}`;
    recordVocabularyEvidence(
      currentPatternExample.requiredLexemeIds,
      "applicationAttempt",
      transferEvidenceId,
    );
    if (credited) {
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

  const startWeaknessPractice = (
    lexemeIds: string[],
    returnScreen: "weakness" | "daily-summary" = "weakness",
  ) => {
    const queue = [...new Set(lexemeIds)].filter((lexemeId) =>
      vocabularyPracticeSources.has(lexemeId),
    );
    if (!queue.length) {
      if (returnScreen === "daily-summary" && dailySession) {
        const updated = markDailySessionStep(dailySession, "weakness");
        setDailySession(updated);
        setScreen("daily-summary");
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
    const nextStep = nextDailySessionStep(session);
    if (nextStep === "review") {
      setScreen("review");
      return;
    }
    if (nextStep === "lesson") {
      const lesson =
        allLessons.find((item) => item.id === session.lessonId) ?? nextLesson;
      startLesson(lesson);
      return;
    }
    if (nextStep === "weakness") {
      startWeaknessPractice(session.weaknessLexemeIds, "daily-summary");
      return;
    }
    setScreen("daily-summary");
  };

  const startDailyLearning = () => {
    const session = createDailySession({
      startedAt: timestamp(),
      lessonId: nextLesson.id,
      reviewCount: dueReviews.length,
      weaknessLexemeIds: vocabularyWeaknesses
        .slice(0, 3)
        .map((item) => item.lexemeId),
      beforeVocabulary: personalVocabularySummary,
    });
    setDailySession(session);
    goToDailySessionStep(session);
  };

  const completeDailyReview = () => {
    if (!dailySession) return;
    const updated = markDailySessionStep(dailySession, "review");
    setDailySession(updated);
    goToDailySessionStep(updated);
  };

  const continueDailyAfterLesson = () => {
    if (!dailySession || dailySession.lessonId !== selectedLesson.id) {
      continueAfterLesson();
      return;
    }
    const updated = markDailySessionStep(dailySession, "lesson");
    setDailySession(updated);
    goToDailySessionStep(updated);
  };

  const checkWeaknessPractice = () => {
    if (weaknessPracticeChecked) return;
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
        focus !== "拼寫" || !weaknessPracticeUsedPaste;
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
    if (weaknessPracticeIndex < weaknessPracticeQueue.length - 1) {
      setWeaknessPracticeIndex((value) => value + 1);
      resetWeaknessPractice();
      return;
    }
    if (weaknessPracticeReturnScreen === "daily-summary" && dailySession) {
      const updated = markDailySessionStep(dailySession, "weakness");
      setDailySession(updated);
      setScreen("daily-summary");
      return;
    }
    setScreen("weakness");
  };

  const finishDailySession = () => {
    setDailySession(null);
    setWeaknessPracticeQueue([]);
    setWeaknessPracticeIndex(0);
    resetWeaknessPractice();
    setScreen("home");
  };

  const renderHome = () => {
    const pendingUnitTest = courseUnits.find(
      (unit, index) =>
        isUnitAvailable(index) &&
        unit.lessons.every((item) => progress.completedLessonIds.includes(item.id)) &&
        !progress.passedUnitIds.includes(unit.id),
    );
    const pilotContentComplete =
      selectedLevel !== "A1" &&
      progress.passedUnitIds.length === courseUnits.length;
    const pendingLevelTest =
      selectedLevel === "A1" &&
      progress.passedUnitIds.length === courseUnits.length &&
      !progress.levelPassed;
    const nextUnit =
      pendingUnitTest ??
      courseUnits.find((unit) => unit.lessons.some((item) => item.id === nextLesson.id))!;
    const recommendation = pilotContentComplete
      ? {
          kicker: `${selectedLevel} 試行課程`,
          title: `你已完成目前的${selectedLevel}試行內容`,
          preview: `目前不會將 ${selectedLevel} 標記為完整通過；請先進行人工內容 QA。`,
          chips: [`${courseUnits.length} 個試行單元`, `${allLessons.length} 課`, "進度已保留"],
          action: () => setScreen("map"),
          buttonLabel: "查看課程地圖",
        }
      : pendingUnitTest
      ? {
          kicker: `下一個建議課程・單元 ${pendingUnitTest.number}`,
          title: `${pendingUnitTest.title}・單元測驗`,
          preview: "完成測驗後即可解鎖下一個單元。",
          chips: [`${pendingUnitTest.lessons.length} 個句子`, "約 8 分鐘", "通過門檻 80%"],
          action: () => startAssessment("unit", pendingUnitTest),
          buttonLabel: "開始單元測驗",
        }
      : pendingLevelTest
        ? {
            kicker: `下一個建議課程・${selectedLevel}`,
            title: `${selectedLevel} 程度總測驗`,
            preview: `完成總測驗，確認 ${selectedLevel} 的句子輸入能力。`,
            chips: [`${courseUnits.length} 個句子`, "約 15 分鐘", "通過門檻 85%"],
            action: () => startAssessment("level"),
            buttonLabel: "開始程度測驗",
          }
        : {
            kicker: `下一個建議課程・單元 ${nextUnit.number}`,
            title: nextLesson.title,
            preview: nextLesson.sentence,
            chips: [`${nextLesson.tokens.length} 個學習單位`, `約 ${nextLesson.minutes} 分鐘`, nextLesson.grammar],
            action: () => startLesson(nextLesson),
            buttonLabel: "開始這一課",
          };
    const todayMinutes =
      Math.max(1, nextLesson.minutes) +
      Math.min(dueReviews.length, 5) +
      Math.min(vocabularyWeaknesses.length, 3);
    const todayAction = dailySession
      ? () => goToDailySessionStep(dailySession)
      : startDailyLearning;
    const todayActionLabel = dailySession
      ? "繼續今日學習"
      : "開始今日學習";
    return (
      <div className="page-stack">
        <section className="welcome-row">
          <div>
            <span className="eyebrow">今天也前進一小步</span>
            <h1>把英文從「看得懂」練成「寫得出來」</h1>
            <p>先回想單字與語塊，再重組句子、辨識句意並練習換字。</p>
          </div>
          <ProgressRing
            value={coursePercent}
            label={`${selectedLevel} 完成度`}
          />
        </section>

        <section
          className="section-card"
          data-testid="daily-learning-plan"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">今日學習</span>
              <h2>今天照這個順序完成就好</h2>
            </div>
            <span className="status-pill">約 {todayMinutes} 分鐘</span>
          </div>
          <div className="three-grid">
            <StatCard
              label="① 待複習"
              value={dueReviews.length}
              note={dueReviews.length ? "先把到期內容喚回來" : "今天沒有到期內容"}
            />
            <StatCard
              label="② 今日課程"
              value={recommendation.title}
              note={recommendation.kicker}
            />
            <StatCard
              label="③ 弱點加強"
              value={Math.min(vocabularyWeaknesses.length, 3)}
              note={
                vocabularyWeaknesses.length
                  ? `優先：${vocabularyWeaknesses
                      .slice(0, 3)
                      .map((item) => item.lemma)
                      .join("、")}`
                  : "目前沒有明顯錯誤累積"
              }
            />
          </div>
          <div className="section-heading">
            <button
              className="primary-button detail-next-button"
              data-testid="start-daily-learning"
              onClick={todayAction}
              onKeyDown={(event) => activateButtonOnEnter(event, todayAction)}
              aria-keyshortcuts="Enter"
            >
              <span>{todayActionLabel}</span>
              <kbd>Enter</kbd>
            </button>
            <button
              className="text-button"
              onClick={() => setScreen("weakness")}
            >
              查看弱點中心 →
            </button>
          </div>
        </section>

        <section className="continue-card">
          <div className="continue-copy">
            <span className="lesson-kicker">{recommendation.kicker}</span>
            <h2>{recommendation.title}</h2>
            <p className="english-preview">{recommendation.preview}</p>
            <div className="chip-row">
              {recommendation.chips.map((chip) => <span className="chip" key={chip}>{chip}</span>)}
            </div>
          </div>
          <button
            className="primary-button big-button detail-next-button"
            onClick={recommendation.action}
            onKeyDown={(event) => activateButtonOnEnter(event, recommendation.action)}
            autoFocus
            aria-keyshortcuts="Enter"
            title={`按 Enter：${recommendation.buttonLabel}`}
          >
            <span className="play-dot">▶</span>
            <span>{recommendation.buttonLabel}</span>
            <kbd>Enter</kbd>
          </button>
        </section>

        <div className="three-grid">
          <StatCard label="已完成課程" value={`${completedCount} / ${allLessons.length}`} note="完成後不會再次鎖定" />
          <StatCard label="待複習內容" value={dueReviews.length} note="複習不會擋住新課程" />
          <StatCard label="本週學習" value={`${progress.studyDates.slice(-7).length} 天`} note="依自己的步調前進" />
        </div>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">目前進行中</span>
              <h2>單元 {nextUnit.number}・{nextUnit.title}</h2>
            </div>
            <button className="text-button" onClick={() => setScreen("map")}>查看完整路線 →</button>
          </div>
          <div className="unit-progress-list">
            {nextUnit.lessons.map((item, index) => {
              const done = progress.completedLessonIds.includes(item.id);
              const available = isLessonAvailable(nextUnit, nextUnit.number - 1, index);
              return (
                <button
                  className={`mini-lesson ${done ? "done" : available ? "active" : "locked"}`}
                  key={item.id}
                  disabled={!available && !done}
                  onClick={() => startLesson(item)}
                >
                  <span>{done ? "✓" : index + 1}</span>
                  <div><strong>{item.title}</strong><small>{done ? "可重新練習" : available ? "可以開始" : "尚未解鎖"}</small></div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  };

  const renderLevelSelector = () => (
    <section className="level-selector" aria-label="CEFR 程度選擇">
      {(catalog
        ? runtimeCatalogEntries(catalog).map((entry) => entry.level)
        : CEFR_LEVELS.filter((level) => level === "A1" || level === "A2")
      ).map((level) => {
        const summary = levelSummary(level);
        const entry = catalog
          ? catalogEntryForLevel(catalog, level)
          : null;
        const statusLabel =
          entry?.status === "production" ? "正式課程" : "試行課程";
        const locked = !canAccessLevel(
          level,
          multiProgress.passedLevelIds,
          settings.showAdvancedPilots,
          entry?.status,
        );
        return (
          <button
            key={level}
            className={`level-selector-button ${
              selectedLevel === level ? "active" : ""
            } ${locked ? "locked" : ""}`}
            type="button"
            data-testid={`level-selector-${level.toLowerCase()}`}
            aria-pressed={selectedLevel === level}
            aria-label={`${level} ${statusLabel}${
              locked ? "，尚未解鎖" : ""
            }`}
            onClick={() => switchLevel(level)}
          >
            <span>
              <strong>{level}</strong>
              <small>{statusLabel}</small>
            </span>
            <span className="level-selector-summary">
              {summary.completed}/{summary.total} 課・正確率{" "}
              {summary.accuracy}%・待複習 {summary.dueCount}
            </span>
            <span className="status-pill">
              {locked ? "鎖定" : summary.status}
            </span>
          </button>
        );
      })}
    </section>
  );

  const renderMap = () => (
    <div className="page-stack">
      {renderLevelSelector()}
      <section className="page-title">
        <div>
          <span className="eyebrow">循序解鎖，不混合難度</span>
          <h1>{selectedLevel} 課程地圖</h1>
          <p>完成一課才解鎖下一課；通過單元測驗後進入下一單元。</p>
        </div>
        <span className="level-pill">
          {selectedLevel}・{levelStatusLabel}・{coursePercent}%
        </span>
      </section>
      <div className="course-road">
        {courseUnits.map((unit, unitIndex) => {
          const unitAvailable = isUnitAvailable(unitIndex);
          const unitDone = unit.lessons.every((item) => progress.completedLessonIds.includes(item.id));
          const unitPassed = progress.passedUnitIds.includes(unit.id);
          return (
            <section className={`road-unit ${!unitAvailable ? "is-locked" : ""}`} key={unit.id}>
              <div className="road-marker" style={{ "--unit-accent": unit.accent } as React.CSSProperties}>
                <span>{unitPassed ? "✓" : unit.number}</span>
                {unitIndex < courseUnits.length - 1 && <i />}
              </div>
              <div className="unit-card">
                <div className="unit-card-head">
                  <div>
                    <span className="lesson-kicker">單元 {unit.number}</span>
                    <h2>{unit.title}</h2>
                    <p>{unit.description}</p>
                  </div>
                  <span className={`status-pill ${unitPassed ? "passed" : unitAvailable ? "current" : ""}`}>
                    {unitPassed ? "已通過" : unitAvailable ? (unitDone ? "等待測驗" : "學習中") : "尚未解鎖"}
                  </span>
                </div>
                <div className="lesson-list">
                  {unit.lessons.map((item, itemIndex) => {
                    const done = progress.completedLessonIds.includes(item.id);
                    const available = isLessonAvailable(unit, unitIndex, itemIndex);
                    return (
                      <button
                        key={item.id}
                        className={`lesson-row ${done ? "done" : available ? "available" : "locked"}`}
                        disabled={!available && !done}
                        autoFocus={available && !done && item.id === nextLesson.id}
                        aria-keyshortcuts="Enter"
                        onClick={() => startLesson(item)}
                        onKeyDown={(event) =>
                          activateButtonOnEnter(event, () => startLesson(item))
                        }
                      >
                        <span className="lesson-number">{done ? "✓" : item.number}</span>
                        <span><strong>{item.title}</strong><small>{item.sentence}</small></span>
                        <span className="row-action">{done ? "再練一次" : available ? "開始" : "鎖定"}</span>
                      </button>
                    );
                  })}
                  <button
                    className={`lesson-row test-row ${unitDone ? "available" : "locked"}`}
                    disabled={!unitDone}
                    autoFocus={unitDone && !unitPassed}
                    aria-keyshortcuts="Enter"
                    onClick={() => startAssessment("unit", unit)}
                    onKeyDown={(event) =>
                      activateButtonOnEnter(event, () => startAssessment("unit", unit))
                    }
                  >
                    <span className="lesson-number">◆</span>
                    <span><strong>單元測驗</strong><small>正確率達 80% 即通過</small></span>
                    <span className="row-action">{unitPassed ? "重新挑戰" : unitDone ? "開始測驗" : "完成 4 課後解鎖"}</span>
                  </button>
                </div>
              </div>
            </section>
          );
        })}
        {selectedLevel === "A1" ? (
          <section className="level-test-card">
            <span className="lesson-number">★</span>
            <div><strong>{selectedLevel} 程度總測驗</strong><small>通過門檻 85%，未通過可重新挑戰</small></div>
            <button
              className="secondary-button"
              disabled={progress.passedUnitIds.length < courseUnits.length}
              autoFocus={progress.passedUnitIds.length === courseUnits.length && !progress.levelPassed}
              aria-keyshortcuts="Enter"
              onClick={() => startAssessment("level")}
              onKeyDown={(event) =>
                activateButtonOnEnter(event, () => startAssessment("level"))
              }
            >
              {progress.levelPassed ? "重新挑戰" : "開始總測驗"}
            </button>
          </section>
        ) : (
          <section
            className="level-test-card"
            data-testid={`${selectedLevel.toLowerCase()}-pilot-completion`}
          >
            <span className="lesson-number">★</span>
            <div>
              <strong>
                {progress.passedUnitIds.length === courseUnits.length
                  ? `你已完成目前的${selectedLevel}試行內容`
                  : `${selectedLevel} 試行內容進行中`}
              </strong>
              <small>
                目前不提供 {selectedLevel} 程度總測驗；試行內容不會自動解鎖下一程度。
              </small>
            </div>
          </section>
        )}
      </div>
      {selectedLevel === "A1" && <section className="advanced-roadmap-section">
        <div className="advanced-roadmap-head">
          <div>
            <span className="eyebrow">A2–C2 後續課程藍圖</span>
            <h2>從日常溝通走向精準、流暢的進階表達</h2>
            <p>每個程度維持「預習 → 回想 → 重組 → 閱讀辨識 → 句型運用」，並逐步加長文本、減少中文提示。</p>
          </div>
          <span className="status-pill">A2 試行中；B1／B2 資料停用</span>
        </div>
        <div className="advanced-level-list">
          {advancedCoursePlans.map((plan) => {
            const catalogLevel = catalog?.levels.find(
              (entry) => entry.level === plan.code,
            );
            return (
              <details
                className="advanced-level-card"
                key={plan.code}
                style={{ "--level-accent": plan.accent } as React.CSSProperties}
                open={plan.code === "A2"}
              >
                <summary>
                  <span className="advanced-level-code">{plan.code}</span>
                  <span>
                    <strong>{plan.name}</strong>
                    <small>{plan.role}</small>
                  </span>
                  <span className="roadmap-status">
                    {catalogLevel?.status === "production"
                      ? "正式課程"
                      : catalogLevel?.status === "pilot"
                        ? "試行課程"
                        : catalogLevel?.status === "disabled"
                          ? "資料保留／未開放"
                          : "課程規劃"}
                  </span>
                </summary>
              <div className="advanced-level-content">
                <div className="can-do-note">
                  <small>程度完成後能做到</small>
                  <strong>{plan.canDo}</strong>
                </div>
                <div className="roadmap-spec-grid">
                  <span><small>課程規模</small><strong>{plan.lessonModel}</strong></span>
                  <span><small>句子長度</small><strong>{plan.sentenceWords}</strong></span>
                  <span><small>文章長度</small><strong>{plan.passageSentences}</strong></span>
                  <span><small>新舊比例</small><strong>{plan.knowledgeRatio}</strong></span>
                  <span><small>中文提示</small><strong>{plan.promptPolicy}</strong></span>
                  <span><small>音訊難度</small><strong>{plan.audioPolicy}</strong></span>
                </div>
                <div className="roadmap-subsection">
                  <small>文法與表達重點</small>
                  <div className="chip-row">
                    {plan.grammarFocus.map((item) => <span className="chip" key={item}>{item}</span>)}
                  </div>
                </div>
                <div className="roadmap-subsection">
                  <small>八個單元</small>
                  <ol className="planned-unit-grid">
                    {plan.units.map((unit) => <li key={unit}>{unit}</li>)}
                  </ol>
                </div>
                <div className="unlock-note">解鎖條件：{plan.unlock}</div>
              </div>
              </details>
            );
          })}
        </div>
        <p className="roadmap-source-note">
          程度能力依
          {" "}
          <a href="https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale" target="_blank" rel="noreferrer">
            歐洲理事會 CEFR 六級架構
          </a>
          {" "}
          規劃；實際英文詞彙、文法與台灣繁中提示仍需逐課人工審核。
        </p>
      </section>}
    </div>
  );

  const renderAlphabet = () => (
    <div className="page-stack">
      <section className="page-title">
        <div>
          <span className="eyebrow">隨時可以練習，不設前置門檻</span>
          <h1>A–Z 發音基礎</h1>
          <p>點選字母聽美式字母名稱；熟悉後可直接回到正式課程。</p>
        </div>
        <button className="secondary-button" onClick={() => speak("A B C D E F G", 0.85)}>▶ 播放一段</button>
      </section>
      <section className="alphabet-grid">
        {alphabet.map((entry) => (
          <button key={entry.letter} onClick={() => speak(entry.letter)}>
            <strong>{entry.letter}</strong>
            <span>{entry.letter.toLowerCase()}</span>
          </button>
        ))}
      </section>
    </div>
  );

  const renderPhonetics = () => (
    <div className="page-stack">
      <section className="page-title kk-page-title">
        <div>
          <span className="eyebrow">獨立練習，不與 A–Z 字母名稱混在一起</span>
          <h1>KK 音標發音</h1>
          <p>點播放鍵直接聽音標本身；例字只用來幫你理解，不會被朗讀。</p>
        </div>
        <div className="kk-summary">
          <strong>41</strong>
          <span>17 個母音・24 個子音</span>
        </div>
      </section>
      <section className="phonetic-guide">
        <div>
          <strong>怎麼使用？</strong>
          <span>先播放單獨音標並跟讀，再用畫面上的例字確認它會出現在哪裡。</span>
        </div>
        <small aria-live="polite">
          {kkAudioMessage || "使用可自由使用的預錄音標樣本，不使用單字語音代替。"}
        </small>
      </section>
      {kkPhoneticGroups.map((group) => (
        <section className="phonetic-section" key={group.id}>
          <div className="section-heading phonetic-section-heading">
            <div>
              <h2>{group.title}</h2>
              <small>{group.subtitle}</small>
            </div>
            <button
              className="secondary-button"
              onClick={() => playKkSequence(group.entries)}
            >
              ▶ 依序播放音標
            </button>
          </div>
          <div className="phonetic-grid">
            {group.entries.map((entry) => (
              <article className="phonetic-card" key={entry.symbol}>
                <div className="phonetic-card-top">
                  <strong>[{entry.symbol}]</strong>
                  <span>{group.id === "vowels" ? "母音" : "子音"}</span>
                </div>
                <div className="phonetic-example">
                  <span>例字</span>
                  <b>{entry.example}</b>
                  <small>{entry.translation}</small>
                </div>
                <p>{entry.tip}</p>
                <div className="phonetic-actions">
                  <button
                    onClick={() => playKkAudio(entry)}
                    aria-label={`播放 KK 音標 ${entry.symbol}`}
                  >
                    ▶ 音標
                  </button>
                  <button
                    onClick={() => playKkAudio(entry, 0.72)}
                    aria-label={`慢速播放 KK 音標 ${entry.symbol}`}
                  >
                    ◁ 慢速
                  </button>
                </div>
                <a
                  className="phonetic-source"
                  href={entry.sourcePage}
                  target="_blank"
                  rel="noreferrer"
                  title={`${entry.author}・${entry.license}`}
                >
                  錄音來源與授權
                </a>
              </article>
            ))}
          </div>
        </section>
      ))}
      <p className="phonetic-note">
        KK 符號用來記錄聲音，不等於英文字母名稱。p、t、k 等短促子音無法像母音一樣延長，
        因此部分開源錄音會搭配簡短載音讓聲音可辨認，但不會朗讀畫面上的例字。
      </p>
    </div>
  );

  const renderRelatedVocabulary = () => {
    if (vocabularyDataStatus === "loading") {
      return (
        <section
          className="section-card vocabulary-load-state"
          data-testid="vocabulary-loading"
        >
          <strong>正在載入相關字詞…</strong>
          <p>課程仍可正常使用，請稍候一秒。</p>
        </section>
      );
    }
    if (vocabularyDataStatus === "error" || !vocabularyDataset) {
      return (
        <section
          className="section-card vocabulary-load-state"
          data-testid="vocabulary-load-error"
        >
          <strong>相關字詞目前無法載入</strong>
          <p>這不會影響正式課程，請重新整理後再試。</p>
          {vocabularyLoadError && <small>{vocabularyLoadError}</small>}
          <button
            className="secondary-button"
            onClick={() => setScreen("home")}
          >
            返回首頁
          </button>
        </section>
      );
    }

    const a1Progress = multiProgress.levelProgress.A1;
    const stateForItem = (item: ResolvedVocabularyItem) =>
      vocabularyLearningState(
        item,
        a1Progress,
        relatedCurrentLexemeId,
      );
    const itemIsVisible = (
      group: ResolvedVocabularyGroup,
      item: ResolvedVocabularyItem,
      query = vocabularySearch,
      filter = vocabularyFilter,
    ) =>
      vocabularyItemMatchesSearch(group, item, query) &&
      vocabularyStatusMatchesFilter(
        stateForItem(item),
        filter,
      );
    const resolveSelection = (
      query: string,
      filter: VocabularyStatusFilter,
      activeGroupId = activeVocabularyGroupId,
    ) =>
      resolveVocabularyGroupSelection(
        vocabularyDataset.groups,
        activeGroupId,
        (group, item) => itemIsVisible(group, item, query, filter),
      );
    const { visibleGroups, activeGroup } = resolveSelection(
      vocabularySearch,
      vocabularyFilter,
    );
    const activeItems = activeGroup
      ? activeGroup.items.filter((item) =>
          itemIsVisible(activeGroup, item),
        )
      : [];
    const updateVocabularySearch = (query: string) => {
      setVocabularySearch(query);
      const nextGroup = resolveSelection(
        query,
        vocabularyFilter,
      ).activeGroup;
      if (
        nextGroup &&
        nextGroup.id !== activeVocabularyGroupId
      ) {
        selectVocabularyGroup(nextGroup.id);
      }
    };
    const updateVocabularyFilter = (
      filter: VocabularyStatusFilter,
    ) => {
      setVocabularyFilter(filter);
      const nextGroup = resolveSelection(
        vocabularySearch,
        filter,
      ).activeGroup;
      if (
        nextGroup &&
        nextGroup.id !== activeVocabularyGroupId
      ) {
        selectVocabularyGroup(nextGroup.id);
      }
    };

    return (
      <div
        className="page-stack related-vocabulary-page"
        data-testid="related-vocabulary-page"
      >
        <section className="page-title related-vocabulary-title">
          <div>
            <span className="eyebrow">依主題建立單字連結</span>
            <h1>相關字詞</h1>
            <p>把同類型的英文放在一起理解，建立單字之間的關聯。</p>
          </div>
          {vocabularyReturnContext && (
            <button
              className="secondary-button"
              onClick={returnFromRelatedVocabulary}
              data-testid="return-to-current-lesson"
            >
              ← 返回目前課程
            </button>
          )}
        </section>

        <section className="vocabulary-tools" aria-label="搜尋與篩選相關字詞">
          <label className="vocabulary-search">
            <span>搜尋字詞或主題</span>
            <input
              type="search"
              value={vocabularySearch}
              onChange={(event) =>
                updateVocabularySearch(event.target.value)
              }
              placeholder="例如：Saturday、星期六"
              aria-label="搜尋英文、中文、主題名稱或 lexeme ID"
            />
          </label>
          <div
            className="vocabulary-filter-row"
            role="group"
            aria-label="已學狀態篩選"
          >
            {vocabularyFilters.map((filter) => (
              <button
                key={filter.id}
                className={
                  vocabularyFilter === filter.id ? "active" : ""
                }
                aria-pressed={vocabularyFilter === filter.id}
                onClick={() => updateVocabularyFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="vocabulary-groups-title">
          <div className="section-heading vocabulary-section-heading">
            <div>
              <span className="eyebrow">主題分類</span>
              <h2 id="vocabulary-groups-title">選擇主題</h2>
            </div>
            <small>目前收錄 {vocabularyDataset.groups.length} 個主題</small>
          </div>
          <div
            className="vocabulary-group-grid"
            data-testid="vocabulary-group-grid"
          >
            {visibleGroups.map((group) => {
              const learnedCount = group.items.filter(
                (item) => stateForItem(item).isLearned,
              ).length;
              return (
                <button
                  className={`vocabulary-group-card ${
                    activeGroup?.id === group.id ? "active" : ""
                  }`}
                  key={group.id}
                  onClick={() => selectVocabularyGroup(group.id)}
                  aria-label={`進入${group.titleZhTw}主題`}
                  data-testid={`vocabulary-group-${group.id}`}
                >
                  <span className="vocabulary-group-icon">▦</span>
                  <span className="vocabulary-group-copy">
                    <strong>{group.titleZhTw}</strong>
                    <b>{group.titleEn}</b>
                    <small>{group.descriptionZhTw}</small>
                  </span>
                  <span className="vocabulary-group-counts">
                    <b>{group.items.length} 個字詞</b>
                    <small>已學 {learnedCount} 個</small>
                  </span>
                  <span className="vocabulary-group-action">
                    進入主題 →
                  </span>
                </button>
              );
            })}
          </div>
          {!visibleGroups.length && (
            <div
              className="section-card vocabulary-load-state"
              data-testid="vocabulary-global-empty"
            >
              <strong>找不到相關字詞</strong>
              <p>請調整搜尋文字或已學狀態篩選。</p>
            </div>
          )}
        </section>

        {activeGroup && (
          <section
            className="section-card vocabulary-topic-detail"
            aria-labelledby="vocabulary-topic-title"
            data-testid={`vocabulary-topic-${activeGroup.id}`}
          >
          <div className="vocabulary-topic-heading">
            <div>
              <span className="vocabulary-breadcrumb">
                相關字詞 &gt; {activeGroup.titleZhTw}
              </span>
              <h2 id="vocabulary-topic-title">
                {activeGroup.titleZhTw}
              </h2>
              <p>{activeGroup.titleEn}</p>
            </div>
            <span className="status-pill">
              {activeGroup.items.length} 個字詞
            </span>
          </div>

          <div
            className="vocabulary-word-list"
            data-testid="vocabulary-word-list"
          >
            {activeItems.map((item) => {
              const state = stateForItem(item);
              const audioAvailable =
                speechSupported ||
                (item.audioStatus === "ready" &&
                  Boolean(item.audioSource.trim()));
              return (
                <article
                  id={`related-word-${item.lexemeId}`}
                  className={`vocabulary-word-card ${
                    state.status === "current" ? "current" : ""
                  }`}
                  key={item.lexemeId}
                  data-testid={`vocabulary-word-${item.lexemeId}`}
                  aria-current={
                    state.status === "current" ? "true" : undefined
                  }
                >
                  <div className="vocabulary-word-top">
                    <div>
                      <span className="vocabulary-item-order">
                        {item.order}
                      </span>
                      <div>
                        <h3>{item.displayEnglish}</h3>
                        <p>{item.translationZhTw}</p>
                      </div>
                    </div>
                    <span
                      className={`vocabulary-status ${state.status}`}
                    >
                      {vocabularyStatusLabels[state.status]}
                    </span>
                  </div>
                  <button
                    className="secondary-button vocabulary-detail-toggle"
                    type="button"
                    data-testid={`open-vocabulary-${item.lexemeId}`}
                    aria-expanded={openedVocabularyLexemeId === item.lexemeId}
                    onClick={() => openVocabularyItem(activeGroup.id, item)}
                  >
                    {openedVocabularyLexemeId === item.lexemeId
                      ? "收合字詞詳情"
                      : "開啟字詞詳情"}
                  </button>
                  {openedVocabularyLexemeId === item.lexemeId && (
                    <div data-testid={`vocabulary-detail-${item.lexemeId}`}>
                  <div className="vocabulary-phonetics">
                    <span>
                      <small>KK</small>
                      <strong>{item.kkUs || "待補"}</strong>
                    </span>
                    <span>
                      <small>IPA</small>
                      <strong>{item.ipaUs || "待補"}</strong>
                    </span>
                    <span>
                      <small>資料來源</small>
                      <strong>
                        {item.source === "course"
                          ? "正式課程"
                          : "參考詞彙"}
                      </strong>
                    </span>
                  </div>
                  <div className="vocabulary-audio-actions">
                    <button
                      disabled={!audioAvailable}
                      onClick={() =>
                        playRelatedVocabularyAudio(item)
                      }
                      aria-label={`正常播放 ${item.displayEnglish} 的美式發音`}
                    >
                      ▶ 正常
                    </button>
                    <button
                      disabled={!audioAvailable}
                      onClick={() =>
                        playRelatedVocabularyAudio(
                          item,
                          settings.slowRate,
                        )
                      }
                      aria-label={`慢速播放 ${item.displayEnglish} 的美式發音`}
                    >
                      ◁ 慢速
                    </button>
                    <small>
                      {item.audioStatus === "ready" &&
                      item.audioSource.trim()
                        ? "使用已確認音訊"
                        : "使用瀏覽器語音備援"}
                    </small>
                  </div>
                  {item.chunks.length > 0 && (
                    <div className="vocabulary-chunks">
                      <small>常見語塊</small>
                      {item.chunks.map((chunk) => (
                        <div key={chunk.id}>
                          <strong>
                            {chunk.text}＝{chunk.translationZhTw}
                          </strong>
                          <span>{chunk.noteZhTw}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.usageNoteZhTw && (
                    <p className="vocabulary-item-note">
                      <strong>用法提醒</strong>
                      {item.usageNoteZhTw}
                    </p>
                  )}
                    </div>
                  )}
                </article>
              );
            })}
            {!activeItems.length && (
              <p className="vocabulary-empty">
                這個主題中沒有符合目前條件的字詞。
              </p>
            )}
          </div>

          <div className="vocabulary-usage-notes">
            <strong>用法提醒</strong>
            <ul>
              {activeGroup.usageNotesZhTw.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
          <p className="vocabulary-audio-message" aria-live="polite">
            {audioMessage ||
              "尚未有已確認音檔時，播放按鈕會使用瀏覽器美式語音備援。"}
          </p>
          </section>
        )}
      </div>
    );
  };

  const renderLearning = () => {
    if (stage === "intro") {
      return (
        <div className="learning-shell">
          <button className="back-button" onClick={() => setScreen("map")}>← 返回課程地圖</button>
          <section className="lesson-intro-card">
            <span className="level-pill">{selectedLevel}・單元 {selectedUnit.number}・第 {selectedLesson.number} 課</span>
            <h1>{selectedLesson.title}</h1>
            <p>{selectedLesson.translation}</p>
            <div className="intro-sentence">{selectedLesson.sentence}</div>
            <div className="intro-facts">
              <span><small>學習單位</small><strong>{selectedLesson.tokens.length}</strong></span>
              <span><small>文法重點</small><strong>{selectedLesson.grammar}</strong></span>
              <span><small>預估時間</small><strong>{selectedLesson.minutes} 分鐘</strong></span>
              {selectedLesson.sentencePatternId && (
                <span>
                  <small>本課句型</small>
                  <strong>{selectedLesson.patternName}</strong>
                </span>
              )}
            </div>
            {selectedLesson.sourceVersion && (
              <p className="data-source-note">
                使用 {selectedLesson.sourceVersion}・逐字輸入模式
              </p>
            )}
            <button
              className="primary-button big-button full-button detail-next-button"
              onClick={beginRecall}
              onKeyDown={(event) => activateButtonOnEnter(event, beginRecall)}
              autoFocus
              aria-keyshortcuts="Enter"
              title="按 Enter 開始"
            >
              <span>從中文提示與逐字輸入開始</span>
              <kbd>Enter</kbd>
            </button>
          </section>
        </div>
      );
    }

    if (stage === "result") {
      const tokenResults = selectedLesson.tokens.map(
        (token) => sessionTokenProgress[token.occurrenceId],
      );
      const sessionHints = tokenResults.reduce(
        (sum, item) => sum + (item?.hintsUsed ?? 0),
        0,
      );
      const wordCorrect = tokenResults.filter(
        (item) =>
          item &&
          item.correctAnswers > 0 &&
          !item.answerRevealed,
      ).length;
      const wordScore = selectedLesson.tokens.length
        ? Math.round(
            (wordCorrect / selectedLesson.tokens.length) * 100,
          )
        : 0;
      const sentenceScore = Math.max(
        0,
        100 -
          Math.max(0, rebuildAttempts - 1) * 30 -
          (rebuildAnswerRevealed ? 20 : 0),
      );
      const recognitionScore = sessionRecognitionAttempts
        ? Math.round(
            (sessionRecognitionCorrect /
              sessionRecognitionAttempts) *
              100,
          )
        : null;
      const transferScore = sessionTransferAttempts
        ? Math.round(
            (sessionTransferCorrect / sessionTransferAttempts) *
              100,
          )
        : null;
      const passageScore = sessionPassageComprehensionAttempts
        ? Math.round(
            (sessionPassageComprehensionCorrect /
              sessionPassageComprehensionAttempts) *
              100,
          )
        : null;
      const reviewNeeds = [
        ...selectedLesson.tokens
          .filter((token) => {
            const item = sessionTokenProgress[token.occurrenceId];
            return (
              (item?.attempts ?? 0) > 1 ||
              item?.answerRevealed
            );
          })
          .map((token) => token.answer),
        ...(recognitionScore !== null && recognitionScore < 100
          ? ["句意理解"]
          : []),
        ...(transferScore !== null && transferScore < 100
          ? [`句型：${selectedTransferPatternName}`]
          : []),
        ...(passageScore !== null && passageScore < 100
          ? ["短文理解"]
          : []),
      ];
      const dailyLessonPending =
        dailySession?.lessonId === selectedLesson.id &&
        !dailySession.completedSteps.includes("lesson");
      const resultNextAction = dailyLessonPending
        ? continueDailyAfterLesson
        : continueAfterLesson;
      const resultNextLabel = dailyLessonPending
        ? dailySession.weaknessLexemeIds.length > 0
          ? "完成今日課程，前往弱點加強 →"
          : "完成今日課程，查看今日總結 →"
        : afterLessonLabel();
      return (
        <div className="learning-shell">
          <section className="result-card">
            <div className="celebration">✓</div>
            <span className="eyebrow">課程完成</span>
            <h1>做得好！你已完成本課文字練習</h1>
            <p className="result-sentence">{selectedLesson.sentence}</p>
            <div className="result-skill-grid">
              <StatCard label="單字拼寫" value={`${wordScore}%`} />
              <StatCard label="句子語序" value={`${sentenceScore}%`} />
              <StatCard
                label="句意理解"
                value={
                  recognitionScore === null
                    ? "後續課程啟用"
                    : `${recognitionScore}%`
                }
              />
              <StatCard
                label="句型運用"
                value={
                  transferScore === null
                    ? "後續課程啟用"
                    : `${transferScore}%`
                }
              />
              <StatCard
                label="短文理解"
                value={
                  passageScore === null
                    ? "本課無短文"
                    : `${passageScore}%`
                }
              />
            </div>
            <div className="result-support-row">
              <span>使用提示：{sessionHints}</span>
              <span>輔助播放：{audioReplays}</span>
            </div>
            <section className="review-needs-card">
              <strong>建議複習</strong>
              <div className="chip-row">
                {(reviewNeeds.length
                  ? Array.from(new Set(reviewNeeds))
                  : ["目前沒有需要加強的項目"]
                ).map((item) => (
                  <span className="chip" key={item}>{item}</span>
                ))}
              </div>
            </section>
            <section className="familiarity-card">
              <div><strong>你對這句話的感覺如何？</strong><small>系統先建議，你仍可自行修改。</small></div>
              <div className="segmented">
                {(["熟悉", "不熟", "完全不會"] as Familiarity[]).map((value) => (
                  <button key={value} onClick={() => {
                    Object.values(progress.reviewItems)
                      .filter((item) =>
                        selectedLesson.tokens.some(
                          (token) => item.tokenId === token.occurrenceId,
                        ),
                      )
                      .forEach((item) => updateFamiliarity(item, value));
                    setToast(`已標記為「${value}」`);
                  }}>{value}</button>
                ))}
              </div>
            </section>
            <div className="button-row">
              <button className="secondary-button" onClick={() => setScreen("map")}>回課程地圖</button>
              <button
                id="lesson-result-next"
                className="primary-button detail-next-button"
                onClick={resultNextAction}
                onKeyDown={(event) =>
                  activateButtonOnEnter(event, resultNextAction)
                }
                aria-keyshortcuts="Enter"
                title={`按 Enter：${resultNextLabel}`}
              >
                <span>{resultNextLabel}</span>
                <kbd>Enter</kbd>
              </button>
            </div>
          </section>
        </div>
      );
    }

    const stageNumber =
      stage === "recall"
        ? 1
        : stage === "detail"
          ? 2
          : stage === "rebuild"
            ? 3
            : stage === "reading-recognition"
              ? 4
              : stage === "pattern-transfer"
                ? 5
                : stage === "text-response" ||
                    stage === "passage-rebuild"
                  ? 6
                  : 7;
    return (
      <div className="learning-shell">
        <div className="learning-top">
          <button className="back-button" onClick={() => setScreen("map")}>← 離開本階段</button>
          <span>
            {stage === "recall" || stage === "detail"
              ? `學習單位 ${tokenIndex + 1}/${selectedLesson.tokens.length}`
              : stage === "rebuild"
                ? "完整句子重組"
                : stage === "reading-recognition"
                  ? "閱讀辨識"
                  : stage === "pattern-transfer"
                    ? "句型換字"
                    : stage === "text-response"
                      ? "文字回答"
                      : stage === "passage-comprehension"
                        ? "短文閱讀理解"
                        : "整段文章重建"}
          </span>
        </div>
        <div className="stage-progress"><i style={{ width: `${(stageNumber / 7) * 100}%` }} /></div>

        {stage === "recall" && (
          <section className="exercise-card">
            <span className="eyebrow">依中文或文法提示，逐字輸入英文</span>
            <span className="hint-level-badge">
              提示 Level {currentTokenHintLevel}
            </span>
            {currentToken.promptType && (
              <span className={`prompt-type-badge ${currentToken.promptType}`}>
                {currentToken.promptType === "grammar"
                  ? "文法提示"
                  : currentToken.promptType === "context"
                    ? "語境提示"
                    : "中文提示"}
              </span>
            )}
            <h1 className="chinese-prompt">{currentToken.prompt}</h1>
            <div className="audio-row">
              <button
                className="audio-button"
                disabled={!tokenAudioAvailable}
                onClick={() => playTokenAudio(currentToken)}
              >
                ▶ 正常
              </button>
              <button
                className="audio-button"
                disabled={!tokenAudioAvailable}
                onClick={() => playTokenAudio(currentToken, settings.slowRate)}
              >
                ◁ 慢速
              </button>
              <small>
                {!tokenAudioAvailable
                  ? "此瀏覽器不支援語音播放，播放按鈕已停用。"
                  : audioMessage ||
                  (currentToken.audioStatus === "ready"
                    ? "使用課程音訊"
                    : "課程音訊待製作，目前使用瀏覽器美式語音")}
              </small>
            </div>
            <label className="field-label" htmlFor="recall-answer-0">英文答案</label>
            <div
              className={`recall-word-grid ${currentTokenWords.length > 1 ? "multiword" : ""}`}
              style={{ "--recall-word-count": currentTokenWords.length } as React.CSSProperties}
            >
              {currentTokenWords.map((word, index) => (
                <label className="recall-word-field" key={`${currentToken.id}-word-${index}`}>
                  {currentTokenWords.length > 1 && <span>第 {index + 1} 詞</span>}
                  <input
                    id={`recall-answer-${index}`}
                    ref={(element) => {
                      recallInputs.current[index] = element;
                    }}
                    className="answer-input recall-word-input"
                    value={recallValues[index] ?? ""}
                    aria-label={`第 ${index + 1} 個英文詞，共 ${currentTokenWords.length} 個`}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    onPaste={(event) => {
                      setUsedPaste(true);
                      const pastedWords = event.clipboardData.getData("text").trim().split(/\s+/).filter(Boolean);
                      if (pastedWords.length <= 1 || currentTokenWords.length === 1) return;
                      event.preventDefault();
                      setRecallValues((values) => {
                        const nextValues = [...values];
                        pastedWords.forEach((pastedWord, offset) => {
                          if (index + offset < currentTokenWords.length) {
                            nextValues[index + offset] = pastedWord;
                          }
                        });
                        return nextValues;
                      });
                      const nextIndex = Math.min(index + pastedWords.length, currentTokenWords.length - 1);
                      window.setTimeout(() => recallInputs.current[nextIndex]?.focus(), 0);
                    }}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value.includes(" ") && currentTokenWords.length > 1) {
                        const enteredWords = value.trim().split(/\s+/).filter(Boolean);
                        setRecallValues((values) => {
                          const nextValues = [...values];
                          enteredWords.forEach((enteredWord, offset) => {
                            if (index + offset < currentTokenWords.length) {
                              nextValues[index + offset] = enteredWord;
                            }
                          });
                          return nextValues;
                        });
                        const nextIndex = Math.min(index + enteredWords.length, currentTokenWords.length - 1);
                        window.setTimeout(() => recallInputs.current[nextIndex]?.focus(), 0);
                        return;
                      }
                      setRecallValues((values) => {
                        const nextValues = [...values];
                        nextValues[index] = value;
                        return nextValues;
                      });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") checkRecall();
                      if (event.key === "Backspace" && !recallValues[index] && index > 0) {
                        recallInputs.current[index - 1]?.focus();
                      }
                    }}
                    placeholder={
                      recallAnswerRevealed
                        ? word
                        : currentTokenWords.length > 1
                          ? `第 ${index + 1} 詞`
                          : "輸入你聽到、想到的英文"
                    }
                  />
                </label>
              ))}
            </div>
            {currentTokenWords.length > 1 && (
              <p className="chunk-input-note">
                這是一個 {currentTokenWords.length} 詞語塊，請每格輸入一個英文詞。
              </p>
            )}
            <div className={`feedback ${recallAnswerRevealed ? "warning" : ""}`} aria-live="polite">
              {feedback || "大小寫與頭尾空格會寬鬆判定，拼字仍需正確。"}
            </div>
            <div className="button-row">
              <button className="secondary-button" onClick={requestHint}>給我提示</button>
              <button className="primary-button" onClick={checkRecall}>檢查答案</button>
            </div>
          </section>
        )}

        {stage === "detail" && (
          <section className="detail-card">
            <div className="detail-head">
              <div>
                <span className="success-label">回答正確</span>
                <h1>{currentToken.answer}</h1>
                <p>{currentToken.prompt}</p>
              </div>
              <div className="audio-row">
                <button
                  className="audio-button"
                  disabled={!tokenAudioAvailable}
                  onClick={() => playTokenAudio(currentToken)}
                >
                  ▶ 正常
                </button>
                <button
                  className="audio-button"
                  disabled={!tokenAudioAvailable}
                  onClick={() => playTokenAudio(currentToken, settings.slowRate)}
                >
                  ◁ 慢速
                </button>
                {!tokenAudioAvailable && (
                  <small>此瀏覽器不支援語音播放，播放按鈕已停用。</small>
                )}
              </div>
            </div>
            <div className="detail-grid">
              <div className={settings.phonetic === "KK" ? "preferred-phonetic" : ""}>
                <small>KK 音標{settings.phonetic === "KK" ? "・預設" : ""}</small>
                <strong>{currentToken.kk}</strong>
              </div>
              <div className={settings.phonetic === "IPA" ? "preferred-phonetic" : ""}>
                <small>美式 IPA{settings.phonetic === "IPA" ? "・預設" : ""}</small>
                <strong>{currentToken.ipa}</strong>
              </div>
              <div><small>句中詞性</small><strong>{currentToken.contextPos || currentToken.partOfSpeech}</strong></div>
              {currentToken.dictionaryPos && (
                <div><small>字典詞性</small><strong>{currentToken.dictionaryPos}</strong></div>
              )}
              <div><small>音節</small><strong>{currentToken.syllables || "單音節／語塊"}</strong></div>
              <div><small>重音</small><strong>{currentToken.stress || "依語句自然重讀"}</strong></div>
              <div><small>原形或變化</small><strong>{currentToken.lemma || currentToken.answer}</strong></div>
              <div><small>單字本體</small><strong>{currentToken.lexemeId || currentToken.tokenId || currentToken.id}</strong></div>
              {currentToken.senseId && (
                <div><small>句中用法</small><strong>{currentToken.senseId}</strong></div>
              )}
              <div><small>學習單位</small><strong>單字 word</strong></div>
            </div>
            {currentToken.note && <div className="usage-note"><strong>用法提醒</strong><span>{currentToken.note}</span></div>}
            {currentToken.chunk &&
              selectedLesson.tokens[tokenIndex + 1]?.chunk?.id !== currentToken.chunk.id && (
                <div className="chunk-meaning-card">
                  <span>語塊整體理解</span>
                  <strong>{currentToken.chunk.text}＝{currentToken.chunk.translation}</strong>
                  <p>{currentToken.chunk.note}</p>
                </div>
              )}
            {selectedLevel === "A1" &&
              canShowVocabularyShortcut(
                vocabularyDataset,
                currentToken.lexemeId,
                stage,
                true,
              ) && (
                <div className="related-vocabulary-shortcut">
                  <div>
                    <strong>想一起比較同類字詞嗎？</strong>
                    <span>查看不會增加提示次數，也不會影響本課分數。</span>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={openRelatedVocabularyFromDetail}
                    aria-label={`查看 ${currentToken.answer} 的同類字詞`}
                    data-testid="open-related-vocabulary-from-detail"
                  >
                    查看同類字詞
                  </button>
                </div>
              )}
            <button
              id="detail-next-button"
              className="primary-button full-button detail-next-button"
              onClick={advanceFromDetail}
              onKeyDown={(event) => activateButtonOnEnter(event, advanceFromDetail)}
              aria-keyshortcuts="Enter"
              title="按 Enter 繼續"
            >
              <span>
                {tokenIndex < selectedLesson.tokens.length - 1 ? "下一個學習單位 →" : "進入完整句子重組 →"}
              </span>
              <kbd>Enter</kbd>
            </button>
          </section>
        )}

        {stage === "rebuild" && (
          <section className="exercise-card">
            <span className="eyebrow">依中文提示，照順序重組句子</span>
            <h1 className="chinese-prompt">{selectedLesson.translation}</h1>
            <p className="chunk-input-note">
              每格只輸入一個英文單字；按空白鍵換到下一格，最後一格按 Enter 檢查答案。
            </p>
            <div className="rebuild-grid">
              {selectedLesson.tokens.map((token, index) => (
                <label key={`${token.id}-${index}`} className={`rebuild-field ${rebuildStatus[index]}`}>
                  <span>第 {index + 1} 格</span>
                  <input
                    id={`rebuild-${index}`}
                    value={rebuildValues[index] ?? ""}
                    autoFocus={index === 0 && !rebuildAnswerRevealed}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    readOnly={rebuildAnswerRevealed}
                    onPaste={() => setUsedPaste(true)}
                    onChange={(event) => {
                      const values = [...rebuildValues];
                      values[index] = event.target.value;
                      setRebuildValues(values);
                    }}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                      if (rebuildAnswerRevealed) return;
                      if (event.key === " ") {
                        const enteredWordCount = (rebuildValues[index] ?? "")
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean).length;
                        const expectedWordCount = getToken(selectedLesson, token).answer
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean).length;
                        if (enteredWordCount === 0) {
                          event.preventDefault();
                          return;
                        }
                        if (enteredWordCount >= expectedWordCount) {
                          event.preventDefault();
                          document.getElementById(`rebuild-${index + 1}`)?.focus();
                          return;
                        }
                      }
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (index === selectedLesson.tokens.length - 1) {
                          checkRebuild();
                        } else {
                          document.getElementById(`rebuild-${index + 1}`)?.focus();
                        }
                      }
                    }}
                  />
                  <small>{rebuildStatus[index] === "correct" ? "正確" : rebuildStatus[index] === "order" ? "順序不對" : rebuildStatus[index] === "spelling" ? "檢查拼字" : rebuildStatus[index] === "missing" ? "尚未填寫" : rebuildStatus[index] === "revealed" ? "正確答案" : " "}</small>
                </label>
              ))}
            </div>
            <div className="feedback" aria-live="polite">{feedback}</div>
            {(rebuildAnswerRevealed ||
              rebuildStatus.every((status) => status === "correct")) && (
              <div className="correct-format">{selectedLesson.sentence}</div>
            )}
            <div className="button-row">
              <button
                className="secondary-button"
                disabled={!sentenceAudioAvailable}
                onClick={() => playSentenceAudio(selectedLesson)}
              >
                ▶ 聽完整句子
              </button>
              <button
                id={rebuildAnswerRevealed ? "rebuild-next-button" : undefined}
                key={rebuildAnswerRevealed ? "rebuild-next" : "rebuild-check"}
                className="primary-button detail-next-button"
                onClick={rebuildAnswerRevealed ? continueAfterRebuild : checkRebuild}
                onKeyDown={(event) =>
                  activateButtonOnEnter(
                    event,
                    rebuildAnswerRevealed ? continueAfterRebuild : checkRebuild,
                  )
                }
                aria-keyshortcuts="Enter"
              >
                <span>
                  {rebuildAnswerRevealed ? "下一步 →" : "檢查順序與拼字"}
                </span>
                {rebuildAnswerRevealed && <kbd>Enter</kbd>}
              </button>
            </div>
            {!sentenceAudioAvailable && (
              <small className="audio-unavailable-message">
                此瀏覽器不支援語音播放，完整句子播放按鈕已停用。
              </small>
            )}
          </section>
        )}

        {stage === "reading-recognition" && selectedRecognition && (
          <section className="exercise-card">
            <span className="eyebrow">閱讀辨識・確認你理解完整句意</span>
            <h1 className="chinese-prompt">{selectedRecognition.stem}</h1>
            <p className="exercise-instruction">
              {selectedRecognition.instruction}
            </p>
            <div className="exercise-choice-list">
              {selectedRecognition.options.map((option) => {
                const selected = recognitionSelectedId === option.id;
                const correct =
                  recognitionChecked &&
                  option.id === selectedRecognition.correctOptionId;
                const wrong =
                  recognitionChecked &&
                  selected &&
                  option.id !== selectedRecognition.correctOptionId;
                return (
                  <button
                    key={option.id}
                    id={`recognition-option-${option.id}`}
                    className={`exercise-choice ${
                      selected ? "selected" : ""
                    } ${correct ? "correct" : ""} ${
                      wrong ? "wrong" : ""
                    }`}
                    disabled={recognitionChecked}
                    onClick={() => setRecognitionSelectedId(option.id)}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>
            <div className="feedback" aria-live="polite">
              {feedback || "請選出最符合原句的意思。"}
            </div>
            <button
              id={
                recognitionChecked
                  ? "recognition-next-button"
                  : "recognition-check-button"
              }
              className="primary-button full-button detail-next-button"
              onClick={
                recognitionChecked
                  ? continueAfterRecognition
                  : checkRecognition
              }
              onKeyDown={(event) =>
                activateButtonOnEnter(
                  event,
                  recognitionChecked
                    ? continueAfterRecognition
                    : checkRecognition,
                )
              }
              aria-keyshortcuts="Enter"
            >
              <span>
                {recognitionChecked ? "下一步 →" : "檢查句意"}
              </span>
              {recognitionChecked && <kbd>Enter</kbd>}
            </button>
          </section>
        )}

        {stage === "pattern-transfer" && currentPatternExample && (
          <section className="exercise-card pattern-transfer-card">
            <span className="eyebrow">
              句型換字・第 {patternExampleIndex + 1}/
              {selectedPatternExamples.length} 題
            </span>
            <h1 className="chinese-prompt">
              {currentPatternExample.translation}
            </h1>
            <div className="pattern-hint-card">
              <span>
                提示 Level{" "}
                {progress.patternHintLevels[
                  selectedTransferPatternId
                ] ?? 1}
              </span>
              {(progress.patternHintLevels[
                selectedTransferPatternId
              ] ?? 1) === 1 && (
                <strong>{currentPatternExample.translation}</strong>
              )}
              {(progress.patternHintLevels[
                selectedTransferPatternId
              ] ?? 1) === 2 && (
                <strong>
                  關鍵詞：{currentPatternExample.hintKeywords}
                </strong>
              )}
              {(progress.patternHintLevels[
                selectedTransferPatternId
              ] ?? 1) === 3 && (
                <strong>{currentPatternExample.skeleton}</strong>
              )}
              {(progress.patternHintLevels[
                selectedTransferPatternId
              ] ?? 1) === 4 && (
                <strong>請依情境自行完成句子。</strong>
              )}
            </div>
            <label
              className="field-label"
              htmlFor="pattern-transfer-answer"
            >
              請使用相同句型輸入完整英文
            </label>
            <input
              id="pattern-transfer-answer"
              className="answer-input"
              value={patternTransferValue}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              readOnly={patternTransferComplete}
              onPaste={() => setUsedPaste(true)}
              onChange={(event) =>
                setPatternTransferValue(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                if (patternTransferComplete) {
                  continueAfterPatternTransfer();
                } else {
                  checkPatternTransfer();
                }
              }}
              placeholder={
                patternTransferRevealed
                  ? currentPatternExample.sentence
                  : "輸入完整英文句子"
              }
            />
            <div
              className={`feedback ${
                patternTransferRevealed ? "warning" : ""
              }`}
              aria-live="polite"
            >
              {feedback ||
                "保留原本句型，只使用已經學過的單字完成新句子。"}
            </div>
            <button
              id={
                patternTransferComplete
                  ? "pattern-transfer-next-button"
                  : "pattern-transfer-check-button"
              }
              className="primary-button full-button detail-next-button"
              onClick={
                patternTransferComplete
                  ? continueAfterPatternTransfer
                  : checkPatternTransfer
              }
              aria-keyshortcuts="Enter"
            >
              <span>
                {patternTransferComplete
                  ? "下一題 →"
                  : "檢查句型換字"}
              </span>
              {patternTransferComplete && <kbd>Enter</kbd>}
            </button>
          </section>
        )}

        {stage === "text-response" && selectedTextResponse && (
          <section className="exercise-card">
            <span className="eyebrow">文字回應・依情境選出完整回答</span>
            <h1 className="chinese-prompt">
              {selectedTextResponse.prompt}
            </h1>
            <div className="exercise-choice-list">
              {selectedTextResponse.options.map((option) => {
                const selected =
                  textResponseSelectedId === option.id;
                const correct =
                  textResponseChecked &&
                  option.id === selectedTextResponse.correctOptionId;
                const wrong =
                  textResponseChecked &&
                  selected &&
                  option.id !== selectedTextResponse.correctOptionId;
                return (
                  <button
                    key={option.id}
                    id={`text-response-option-${option.id}`}
                    className={`exercise-choice ${
                      selected ? "selected" : ""
                    } ${correct ? "correct" : ""} ${
                      wrong ? "wrong" : ""
                    }`}
                    disabled={textResponseChecked}
                    onClick={() => setTextResponseSelectedId(option.id)}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>
            <div className="feedback" aria-live="polite">
              {feedback || "閱讀情境後，選出最適合的英文回答。"}
            </div>
            <button
              id={
                textResponseChecked
                  ? "text-response-next-button"
                  : "text-response-check-button"
              }
              className="primary-button full-button detail-next-button"
              onClick={
                textResponseChecked ? finishLesson : checkTextResponse
              }
              onKeyDown={(event) =>
                activateButtonOnEnter(
                  event,
                  textResponseChecked
                    ? finishLesson
                    : checkTextResponse,
                )
              }
              aria-keyshortcuts="Enter"
            >
              <span>
                {textResponseChecked ? "完成課程 →" : "檢查文字回答"}
              </span>
              {textResponseChecked && <kbd>Enter</kbd>}
            </button>
          </section>
        )}

        {stage === "passage-rebuild" && (
          <section className="exercise-card passage-rebuild-card">
            <span className="eyebrow">依句子順序重建整段文章</span>
            <div className="passage-translation">
              {selectedPassageLessons.map((lesson) => (
                <p key={lesson.sentenceId}>{lesson.translation}</p>
              ))}
            </div>
            <div className="passage-input-list">
              {selectedPassageLessons.map((lesson, index) => {
                const evaluation = passageEvaluation[index];
                return (
                  <label
                    className={`passage-sentence-field ${
                      evaluation?.correct ? "correct" : evaluation ? "warning" : ""
                    }`}
                    key={lesson.sentenceId}
                  >
                    <span>第 {lesson.sentenceOrder} 句</span>
                    <textarea
                      id={`passage-sentence-${index}`}
                      className="answer-input sentence-input"
                      rows={2}
                      value={passageValues[index] ?? ""}
                      autoFocus={index === 0}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      readOnly={passageAnswerRevealed}
                      onChange={(event) => {
                        const values = [...passageValues];
                        values[index] = event.target.value;
                        setPassageValues(values);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" || event.shiftKey) return;
                        event.preventDefault();
                        if (index === selectedPassageLessons.length - 1) {
                          checkPassageRebuild();
                        } else {
                          document
                            .getElementById(`passage-sentence-${index + 1}`)
                            ?.focus();
                        }
                      }}
                      placeholder={`輸入第 ${lesson.sentenceOrder} 句英文`}
                    />
                    <small>{evaluation?.message ?? " "}</small>
                  </label>
                );
              })}
            </div>
            <div
              className={`feedback ${passageAnswerRevealed ? "warning" : ""}`}
              aria-live="polite"
            >
              {feedback || "逐句輸入英文；Enter 前往下一句，Shift+Enter 換行。"}
            </div>
            <button
              id={passageAnswerRevealed ? "passage-complete-button" : undefined}
              className="primary-button full-button"
              onClick={
                passageAnswerRevealed
                  ? completeRevealedPassage
                  : checkPassageRebuild
              }
            >
              {passageAnswerRevealed
                ? "我已閱讀，完成課程"
                : "檢查整段文章"}
            </button>
          </section>
        )}

        {stage === "passage-comprehension" &&
          selectedPassageComprehension &&
          currentPassageQuestion && (
            <section className="exercise-card">
              <span className="eyebrow">
                短文理解・第 {passageQuestionIndex + 1}/
                {selectedPassageComprehension.questions.length} 題
              </span>
              <div className="passage-reading-text">
                {selectedPassageLessons.map((lesson) => (
                  <p key={lesson.sentenceId}>{lesson.sentence}</p>
                ))}
              </div>
              <h1 className="chinese-prompt">
                {currentPassageQuestion.question}
              </h1>
              <div className="exercise-choice-list">
                {currentPassageQuestion.options.map((option, index) => {
                  const selected = passageAnswer === option;
                  const correct =
                    passageQuestionChecked &&
                    option === currentPassageQuestion.correctAnswer;
                  const wrong =
                    passageQuestionChecked &&
                    selected &&
                    option !== currentPassageQuestion.correctAnswer;
                  return (
                    <button
                      key={option}
                      id={`passage-answer-${index}`}
                      className={`exercise-choice ${
                        selected ? "selected" : ""
                      } ${correct ? "correct" : ""} ${
                        wrong ? "wrong" : ""
                      }`}
                      disabled={passageQuestionChecked}
                      onClick={() => setPassageAnswer(option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <div className="feedback" aria-live="polite">
                {feedback || "請根據上方短文選出答案。"}
              </div>
              <button
                id={
                  passageQuestionChecked
                    ? "passage-question-next-button"
                    : "passage-question-check-button"
                }
                className="primary-button full-button detail-next-button"
                onClick={
                  passageQuestionChecked
                    ? continuePassageComprehension
                    : checkPassageComprehension
                }
                onKeyDown={(event) =>
                  activateButtonOnEnter(
                    event,
                    passageQuestionChecked
                      ? continuePassageComprehension
                      : checkPassageComprehension,
                  )
                }
                aria-keyshortcuts="Enter"
              >
                <span>
                  {passageQuestionChecked
                    ? passageQuestionIndex >=
                      selectedPassageComprehension.questions.length - 1
                      ? "完成課程 →"
                      : "下一題 →"
                    : "檢查短文理解"}
                </span>
                {passageQuestionChecked && <kbd>Enter</kbd>}
              </button>
            </section>
          )}
      </div>
    );
  };

  const renderReview = () => (
    <div className="page-stack">
      <section className="page-title">
        <div>
          <span className="eyebrow">依作答表現安排，不阻擋新課程</span>
          <h1>待複習內容</h1>
          <p>錯誤較多、使用提示或花較久時間的內容會更早出現。</p>
        </div>
        <span className="level-pill">今天到期 {dueReviews.length} 項</span>
      </section>
      <div className="three-grid">
        <StatCard label="單字／語塊" value={Object.keys(progress.reviewItems).length} />
        <StatCard label="今天到期" value={dueReviews.length} />
        <StatCard label="已達精通條件" value={Object.values(progress.reviewItems).filter((item) => item.successfulDays >= 2).length} note="跨日成功兩次" />
      </div>
      <section className="section-card">
        <div className="section-heading"><h2>複習佇列</h2><small>熟悉度可由你自行調整</small></div>
        <div className="review-list">
          {(dueReviews.length ? dueReviews : Object.values(progress.reviewItems).slice(0, 8)).map((item) => (
            <article key={item.tokenId} className="review-row">
              <button className="round-audio" onClick={() => speak(item.answer)}>▶</button>
              <div><strong>{item.answer}</strong><small>{item.prompt}・下次間隔 {item.intervalDays} 天</small></div>
              <select value={item.familiarity} onChange={(event) => updateFamiliarity(item, event.target.value as Familiarity)}>
                <option>熟悉</option><option>不熟</option><option>完全不會</option>
              </select>
            </article>
          ))}
          {!Object.keys(progress.reviewItems).length && (
            <div className="empty-state">
              <strong>還沒有複習資料</strong>
              <span>完成第一課後，系統會依表現建立複習排程。</span>
              <button
                className="primary-button detail-next-button"
                onClick={() => startLesson(courseUnits[0].lessons[0])}
                onKeyDown={(event) =>
                  activateButtonOnEnter(event, () => startLesson(courseUnits[0].lessons[0]))
                }
                autoFocus
                aria-keyshortcuts="Enter"
                title="按 Enter 開始第一課"
              >
                <span>開始第一課</span>
                <kbd>Enter</kbd>
              </button>
            </div>
          )}
        </div>
        {dailySession && nextDailySessionStep(dailySession) === "review" && (
          <button
            className="primary-button full-button detail-next-button"
            data-testid="daily-review-complete"
            onClick={completeDailyReview}
            onKeyDown={(event) =>
              activateButtonOnEnter(event, completeDailyReview)
            }
            aria-keyshortcuts="Enter"
          >
            <span>完成今日複習，前往今日課程 →</span>
            <kbd>Enter</kbd>
          </button>
        )}
      </section>
    </div>
  );

  const renderWeakness = () => {
    const spellingCount = vocabularyWeaknesses.filter(
      (item) => item.focus === "拼寫",
    ).length;
    const recognitionCount = vocabularyWeaknesses.filter(
      (item) => item.focus === "辨認",
    ).length;
    const applicationCount = vocabularyWeaknesses.filter(
      (item) => item.focus === "運用",
    ).length;
    return (
      <div className="page-stack" data-testid="weakness-center">
        <section className="page-title">
          <div>
            <span className="eyebrow">依你的實際錯誤證據排序</span>
            <h1>弱點中心</h1>
            <p>只列出真的答錯過的核心詞彙；看過一次或單純打開單字卡不算弱點。</p>
          </div>
          <span className="level-pill">目前 {vocabularyWeaknesses.length} 個</span>
        </section>
        <div className="three-grid">
          <StatCard label="拼寫弱點" value={spellingCount} />
          <StatCard label="辨認弱點" value={recognitionCount} />
          <StatCard label="運用弱點" value={applicationCount} />
        </div>
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">優先處理錯誤最多的內容</span>
              <h2>最需要加強</h2>
            </div>
            <button className="text-button" onClick={() => setScreen("review")}>
              前往待複習 →
            </button>
          </div>
          {vocabularyWeaknesses.length ? (
            <div className="review-list" data-testid="weakness-list">
              {vocabularyWeaknesses.map((item, index) => (
                <article className="review-row" key={item.lexemeId}>
                  <span className="lesson-number">{index + 1}</span>
                  <div>
                    <strong>{item.lemma}</strong>
                    <small>
                      {item.focus}・答錯 {item.wrongAttempts} / 嘗試 {item.totalAttempts}
                      {item.lastSeenAt ? "・最近 " + item.lastSeenAt.slice(0, 10) : ""}
                    </small>
                  </div>
                  <div className="button-row">
                    <span className="status-pill">{item.focus}</span>
                    <button
                      className="secondary-button"
                      data-testid={`practice-weakness-${item.lexemeId}`}
                      onClick={() =>
                        startWeaknessPractice([item.lexemeId], "weakness")
                      }
                    >
                      立即加強
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state" data-testid="weakness-empty-state">
              <strong>目前沒有明顯弱點</strong>
              <span>完成更多辨認、拼寫與句型練習後，答錯過的內容會自動出現在這裡。</span>
              <button
                className="primary-button detail-next-button"
                onClick={() => startLesson(nextLesson)}
                onKeyDown={(event) =>
                  activateButtonOnEnter(event, () => startLesson(nextLesson))
                }
                aria-keyshortcuts="Enter"
              >
                <span>繼續下一課</span>
                <kbd>Enter</kbd>
              </button>
            </div>
          )}
        </section>
      </div>
    );
  };
  const renderWeaknessPractice = () => {
    const lexemeId = weaknessPracticeQueue[weaknessPracticeIndex] ?? "";
    const weakness = vocabularyWeaknesses.find(
      (item) => item.lexemeId === lexemeId,
    );
    const source = vocabularyPracticeSources.get(lexemeId);
    if (!lexemeId || !weakness || !source) {
      return (
        <div className="page-stack" data-testid="weakness-practice">
          <section className="section-card">
            <h1>目前沒有可直接練習的弱點</h1>
            <p>完成更多正式課程作答後，系統會建立可驗證的弱點練習。</p>
            <button
              className="secondary-button"
              onClick={() => setScreen("weakness")}
            >
              返回弱點中心
            </button>
          </section>
        </div>
      );
    }
    const recognitionOptions = recognitionOptionsForWeakness(source);
    const expected =
      weakness.focus === "拼寫"
        ? source.answer
        : weakness.focus === "運用"
          ? source.sentence
          : source.prompt;
    return (
      <div className="page-stack" data-testid="weakness-practice">
        <section className="page-title">
          <div>
            <span className="eyebrow">
              弱點加強・{weaknessPracticeIndex + 1}/{weaknessPracticeQueue.length}
            </span>
            <h1>{weakness.lemma}</h1>
            <p>
              目前優先加強「{weakness.focus}」。答錯不會影響課程完成或 CEFR 解鎖。
            </p>
          </div>
          <span className="level-pill">答錯 {weakness.wrongAttempts} 次</span>
        </section>
        <section className="exercise-card">
          {weakness.focus === "拼寫" && (
            <>
              <span className="eyebrow">看中文，自己拼出英文</span>
              <h2 className="chinese-prompt">{source.prompt}</h2>
              <button
                className="audio-button"
                onClick={() => speak(source.answer)}
              >
                ▶ 聽發音
              </button>
              <input
                className="answer-input"
                data-testid="weakness-practice-input"
                value={weaknessPracticeValue}
                readOnly={weaknessPracticeChecked}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                onPaste={() => setWeaknessPracticeUsedPaste(true)}
                onChange={(event) =>
                  setWeaknessPracticeValue(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !weaknessPracticeChecked) {
                    event.preventDefault();
                    checkWeaknessPractice();
                  }
                }}
                placeholder="輸入英文單字"
              />
            </>
          )}
          {weakness.focus === "辨認" && (
            <>
              <span className="eyebrow">看到英文，辨認課程中的中文意思</span>
              <h2 className="chinese-prompt">{source.answer}</h2>
              <div className="exercise-choice-list">
                {recognitionOptions.map((option) => (
                  <button
                    key={option}
                    className={`exercise-choice ${
                      weaknessPracticeValue === option ? "selected" : ""
                    }`}
                    disabled={weaknessPracticeChecked}
                    onClick={() => setWeaknessPracticeValue(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
          {weakness.focus === "運用" && (
            <>
              <span className="eyebrow">把弱點放回完整句子</span>
              <h2 className="chinese-prompt">{source.translation}</h2>
              <textarea
                className="answer-input sentence-input"
                data-testid="weakness-practice-input"
                rows={3}
                value={weaknessPracticeValue}
                readOnly={weaknessPracticeChecked}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                onPaste={() => setWeaknessPracticeUsedPaste(true)}
                onChange={(event) =>
                  setWeaknessPracticeValue(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !weaknessPracticeChecked
                  ) {
                    event.preventDefault();
                    checkWeaknessPractice();
                  }
                }}
                placeholder="輸入完整英文句子"
              />
            </>
          )}
          <div
            className={`feedback ${weaknessPracticeRevealed ? "warning" : ""}`}
            aria-live="polite"
          >
            {weaknessPracticeFeedback ||
              `針對「${weakness.focus}」重新作答；連續三次錯誤後才會顯示答案。`}
          </div>
          {weaknessPracticeRevealed && (
            <div className="correct-format">{expected}</div>
          )}
          <button
            className="primary-button full-button detail-next-button"
            data-testid="weakness-practice-action"
            onClick={
              weaknessPracticeChecked
                ? continueWeaknessPractice
                : checkWeaknessPractice
            }
            onKeyDown={(event) =>
              weaknessPracticeChecked
                ? activateButtonOnEnter(event, continueWeaknessPractice)
                : undefined
            }
            aria-keyshortcuts={weaknessPracticeChecked ? "Enter" : undefined}
          >
            <span>
              {weaknessPracticeChecked
                ? weaknessPracticeIndex < weaknessPracticeQueue.length - 1
                  ? "下一個弱點 →"
                  : weaknessPracticeReturnScreen === "daily-summary"
                    ? "查看今日總結 →"
                    : "完成這個弱點 →"
                : "檢查答案"}
            </span>
            {weaknessPracticeChecked && <kbd>Enter</kbd>}
          </button>
        </section>
      </div>
    );
  };

  const renderDailySummary = () => {
    if (!dailySession) {
      return (
        <div className="page-stack">
          <section className="section-card">
            <h1>今天尚未開始學習流程</h1>
            <button className="primary-button" onClick={startDailyLearning}>
              開始今日學習
            </button>
          </section>
        </div>
      );
    }
    const summary = summarizeDailySession(
      dailySession,
      personalVocabularySummary,
    );
    return (
      <div className="page-stack" data-testid="daily-learning-summary">
        <section className="result-card">
          <div className="celebration">✓</div>
          <span className="eyebrow">今日學習完成</span>
          <h1>今天的學習循環已經走完</h1>
          <p>複習、新課與弱點加強分開記錄，不會因完成今日流程而偽造課程或程度通過。</p>
          <div className="three-grid">
            <StatCard label="今日時間" value={`${summary.elapsedMinutes} 分鐘`} />
            <StatCard label="完成複習" value={summary.reviewCount} />
            <StatCard
              label="今日課程"
              value={summary.lessonCompleted ? "1 課" : "未完成"}
            />
            <StatCard label="弱點加強" value={summary.weaknessCount} />
            <StatCard
              label="新增接觸"
              value={`+${summary.exposedDelta}`}
            />
            <StatCard
              label="升級可辨認"
              value={`+${summary.receptiveDelta}`}
            />
            <StatCard
              label="升級可主動使用"
              value={`+${summary.activeDelta}`}
            />
          </div>
          <button
            className="primary-button full-button detail-next-button"
            data-testid="finish-daily-session"
            onClick={finishDailySession}
          >
            完成今天的學習
          </button>
        </section>
      </div>
    );
  };

  const renderProgress = () => {
    const vocabularyCoverage = vocabularyTargets
      ? buildVocabularyCoverageReport(vocabularyTargets)
      : null;
    const personalVocabulary = summarizeVocabularyProgress(
      multiProgress.vocabularyProgress,
      vocabularyTargets?.entries.map((entry) => entry.lexemeId),
    );
    const globalDueReviews = ["A1", "A2"].reduce(
      (count, level) =>
        count +
        Object.values(
          multiProgress.levelProgress[level as CefrLevel].reviewItems,
        ).filter((item) => new Date(item.dueAt).getTime() <= timestamp()).length,
      0,
    );
    const learnedSenseCount = new Set(
      ["A1", "A2"].flatMap((level) =>
        Object.entries(
          multiProgress.levelProgress[level as CefrLevel].senseProgress,
        )
          .filter(([, item]) => item.completedLessonIds.length > 0)
          .map(([senseId]) => senseId),
      ),
    ).size;
    const touchedChunkCount = new Set(
      ["A1", "A2"].flatMap((level) =>
        Object.keys(
          multiProgress.levelProgress[level as CefrLevel].chunkHintLevels,
        ),
      ),
    ).size;
    return (
    <div className="page-stack">
      <section className="page-title">
        <div><span className="eyebrow">{selectedLevel} 學習紀錄</span><h1>學習進度</h1><p>完成、通過與精通分開記錄，讓進度更真實。</p></div>
        <ProgressRing value={coursePercent} label="課程完成" />
      </section>
      <div className="three-grid">
        <StatCard label="作答正確率" value={`${accuracy}%`} note={`${progress.correctAnswers} / ${progress.totalAttempts} 次`} />
        <StatCard label="累積學習時間" value={`${Math.max(0, Math.round(progress.totalSeconds / 60))} 分`} />
        <StatCard label="使用貼上" value={`${progress.pasteCount} 次`} note="列為輔助紀錄，不算錯誤" />
      </div>
      <section
        className="section-card"
        data-testid="global-vocabulary-progress"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">A1＋A2 canonical lexeme</span>
            <h2>詞彙目標</h2>
          </div>
          <span className="status-pill">總目標 3000</span>
        </div>
        <div className="three-grid">
          <StatCard label="A1＋A2總目標" value="3000" />
          <StatCard label="主動核心目標" value="1500" />
          <StatCard label="延伸辨識目標" value="1500" />
        </div>
        {vocabularyCoverage ? (
          <>
            <div className="three-grid vocabulary-progress-grid">
              <StatCard
                label="目標清單已收錄"
                value={`${vocabularyCoverage.targetEntries} / 3000`}
              />
              <StatCard
                label="正式課程覆蓋"
                value={vocabularyCoverage.curriculumCovered}
              />
              <StatCard
                label="reference-only覆蓋"
                value={vocabularyCoverage.referenceOnlyCovered}
              />
              <StatCard
                label="清單尚未建立"
                value={vocabularyCoverage.missingEntries}
              />
              <StatCard label="接觸過" value={personalVocabulary.exposed} />
              <StatCard label="可以辨認" value={personalVocabulary.receptive} />
              <StatCard
                label="可以主動拼寫及運用"
                value={personalVocabulary.active}
              />
              <StatCard label="待複習" value={globalDueReviews} />
              <StatCard label="已學sense" value={learnedSenseCount} />
              <StatCard label="已接觸chunk" value={touchedChunkCount} />
            </div>
            {vocabularyTargets?.status === "partial_review_required" && (
              <p className="qa-note" data-testid="vocabulary-target-partial-note">
                3000詞彙清單仍在分批建置。目前數字代表已整理並納入待審基線的詞彙，尚未全部完成人工內容與來源審查。
              </p>
            )}
          </>
        ) : (
          <p className="qa-note" role="status">
            詞彙目標資料暫時無法載入。{vocabularyTargetsError}
          </p>
        )}
      </section>
      <section className="section-card">
        <div className="section-heading"><h2>各單元狀態</h2><span className="status-legend">完成 ≠ 通過 ≠ 精通</span></div>
        <div className="progress-table-wrap">
          <table className="data-table">
            <thead><tr><th>單元</th><th>已完成課程</th><th>單元測驗</th><th>完成度</th></tr></thead>
            <tbody>{courseUnits.map((unit) => {
              const done = unit.lessons.filter((item) => progress.completedLessonIds.includes(item.id)).length;
              return <tr key={unit.id}><td><strong>{unit.number}. {unit.title}</strong></td><td>{done} / {unit.lessons.length}</td><td>{progress.passedUnitIds.includes(unit.id) ? "已通過" : done === unit.lessons.length ? "可測驗" : "尚未解鎖"}</td><td><progress value={done} max={unit.lessons.length} /> {Math.round((done / unit.lessons.length) * 100)}%</td></tr>;
            })}</tbody>
          </table>
        </div>
      </section>
    </div>
    );
  };

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
      localStorage.removeItem(courseRowsStorageKey(selectedLevel));
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
    <div className="page-stack wide-page">
      {renderLevelSelector()}
      <section className="page-title">
        <div>
          <span className="eyebrow">內容資料與人工 QA</span>
          <h1>課程內容管理</h1>
          <p>表格修改先保存在草稿；只有完整驗證通過後才會套用。</p>
          <small>
            {levelStatusLabel}來源：public/data/{contentSourceVersion}
            ・revision {courseSourceRevision.slice(0, 12)}
            ・更新時間{" "}
            {courseRowsUpdatedAt
              ? new Date(courseRowsUpdatedAt).toLocaleString("zh-TW")
              : "載入中"}
          </small>
        </div>
        <div className="toolbar">
          <button className="primary-button" onClick={validateAndApplyCourseDraft}>驗證並套用</button>
          <button className="secondary-button" onClick={discardCourseDraft}>放棄草稿</button>
          <button className="secondary-button" onClick={restoreOfficialCourseData}>還原正式課程資料</button>
          <button className="secondary-button" onClick={exportContentXlsx}>匯出 Excel</button>
          <button className="secondary-button" onClick={exportContentCsv}>匯出 CSV</button>
          <button className="secondary-button" onClick={exportContentJson}>匯出 JSON</button>
          <label className="primary-button file-button">匯入修訂<input type="file" accept=".xlsx,.xls,.csv,.json" onChange={importContent} /></label>
        </div>
      </section>
      <div className="three-grid content-stats-grid">
        <StatCard
          label="單元／課程"
          value={`${contentStats.units}／${contentStats.lessons}`}
        />
        <StatCard
          label="句子／occurrence"
          value={`${contentStats.sentences}／${contentStats.occurrences}`}
        />
        <StatCard
          label="待人工 QA"
          value={contentStats.pendingQa}
          note={
            selectedLevel !== "A1"
              ? "試行內容不可標記為 production ready"
              : "依 qa_status 統計"
          }
        />
      </div>
      <section className="qa-note">
        <strong>給 GPT 檢查時可直接上傳匯出的資料表</strong>
        <span>請它逐列檢查台灣繁體中文翻譯、KK／IPA、詞性、語塊切分與 CEFR 難度；修正後再匯入本頁。</span>
      </section>
      {importReport && (
        <section className="qa-note" aria-live="polite">
          <strong>
            匯入結果：總列數 {importReport.totalRows}・成功列數{" "}
            {importReport.successfulRows}・失敗列數 {importReport.failedRows}
          </strong>
          <span>
            未匹配 ID：
            {importReport.unmatchedIds.length
              ? importReport.unmatchedIds.join("、")
              : "無"}
          </span>
          <span>
            驗證錯誤：
            {importReport.validationErrors.length
              ? importReport.validationErrors.join("｜")
              : "無"}
          </span>
        </section>
      )}
      <section className="section-card">
        <div className="filter-row">
          <input value={adminSearch} onChange={(event) => setAdminSearch(event.target.value)} placeholder="搜尋英文、中文或句子" />
          <select value={adminUnit} onChange={(event) => setAdminUnit(event.target.value)}>
            <option value="all">全部單元</option>
            {courseUnits.map((unit) => <option key={unit.id} value={unit.id}>單元 {unit.number}・{unit.title}</option>)}
          </select>
          <span>顯示 {filteredRows.length} 筆</span>
        </div>
        <div className="progress-table-wrap admin-table-wrap">
          <table className="data-table admin-table">
            <thead><tr><th>課程</th><th>類型</th><th>英文答案</th><th>繁中提示</th><th>詞性</th><th>KK</th><th>IPA</th><th>QA</th></tr></thead>
            <tbody>{filteredRows.map((row) => (
              <tr key={row.occurrence_id}>
                <td><strong>{row.lesson_title}</strong><small>{row.lesson_id}<br />順序 {row.token_order}</small></td>
                <td><span className="chip">{row.chunk_id ? "單字＋語塊" : "單字"}</span></td>
                <td><input value={row.answer} onChange={(event) => updateCourseDraftRow(row, { answer: event.target.value })} /></td>
                <td><input value={row.prompt} onChange={(event) => updateCourseDraftRow(row, { prompt: event.target.value })} /></td>
                <td><input value={row.context_pos} onChange={(event) => updateCourseDraftRow(row, { context_pos: event.target.value, partOfSpeech: event.target.value })} /></td>
                <td><input value={row.kk_us} onChange={(event) => updateCourseDraftRow(row, { kk_us: event.target.value, kk: event.target.value })} /></td>
                <td><input value={row.ipa_standalone} onChange={(event) => updateCourseDraftRow(row, { ipa_standalone: event.target.value, ipa_us: event.target.value, ipa: event.target.value })} /></td>
                <td><span className="qa-status">{row.qa_status || "待人工確認"}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </div>
  );

  const renderSettings = () => (
    <div className="page-stack">
      <section className="page-title"><div><span className="eyebrow">個人化與備份</span><h1>設定</h1><p>設定只儲存在這台瀏覽器，不需登入。</p></div></section>
      <div className="two-grid">
        <section className="section-card settings-card">
          <h2>發音與音標</h2>
          <label><span>預設音標</span><select value={settings.phonetic} onChange={(event) => setSettings({ ...settings, phonetic: event.target.value as "KK" | "IPA" })}><option>KK</option><option>IPA</option></select></label>
          <label className="switch-row"><span><strong>題目開始自動播放</strong><small>單字或語塊播放一次</small></span><input type="checkbox" checked={settings.autoplay} onChange={(event) => setSettings({ ...settings, autoplay: event.target.checked })} /></label>
          <label><span>慢速播放速度</span><select value={settings.slowRate} onChange={(event) => setSettings({ ...settings, slowRate: Number(event.target.value) })}><option value={0.75}>75%</option><option value={0.85}>85%（建議）</option><option value={0.9}>90%</option></select></label>
          <label className="switch-row">
            <span>
              <strong>顯示進階試行課程</strong>
              <small>
                顯示 A2 試行課程，僅供內容 QA，不會偽造程度通過
              </small>
            </span>
            <input
              data-testid="a2-pilot-toggle"
              type="checkbox"
              checked={settings.showAdvancedPilots}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  showAdvancedPilots: event.target.checked,
                })
              }
            />
          </label>
          <div className="source-note">
            <strong>進階程度解鎖狀態</strong>
            <span>
              {isLevelFormallyUnlocked(
                "A2",
                multiProgress.passedLevelIds,
              )
                ? "已通過 A1 程度測驗，A2 已正式解鎖。B1 與 B2 目前保留資料但未開放。"
                : settings.showAdvancedPilots
                  ? "目前開啟 QA 試用入口；正式解鎖條件仍不會被改寫。"
                  : "通過 A1 程度總測驗後正式解鎖。"}
            </span>
          </div>
          <div className="source-note"><strong>語音來源狀態</strong><span>資料結構已預留預先產生音檔與授權欄位；目前互動版在音檔缺少時使用裝置的免費美式語音備援。</span></div>
        </section>
        <section className="section-card settings-card">
          <h2>完整學習進度備份</h2>
          <p>包含完成課程、測驗、熟悉度、複習排程與偏好設定。</p>
          <button className="secondary-button full-button" onClick={exportProgress}>匯出進度備份</button>
          <label className="primary-button full-button file-button">匯入進度備份<input type="file" accept=".json" onChange={importProgress} /></label>
          <small>匯入會以備份內容取代目前進度，建議先匯出現有資料。</small>
        </section>
      </div>
    </div>
  );

  const renderAssessment = () => {
    if (!assessment) return null;
    const item = assessment.lessons[assessment.index];
    const finalScores = assessment.scores;
    return (
      <div className="learning-shell">
        <div className="learning-top"><button className="back-button" onClick={() => { setAssessment(null); setScreen("map"); }}>← 稍後再測</button><span>{assessment.title}・{assessment.index + 1}/{assessment.lessons.length}</span></div>
        <div className="stage-progress"><i style={{ width: `${((assessment.index + 1) / assessment.lessons.length) * 100}%` }} /></div>
        <section className="exercise-card">
          <span className="eyebrow">完整句子輸入測驗</span>
          <h1 className="chinese-prompt">{item.translation}</h1>
          <button className="audio-button centered-audio" onClick={() => speak(item.sentence)}>▶ 播放完整句子</button>
          <textarea
            key={item.id}
            className="answer-input sentence-input"
            rows={3}
            value={assessmentValue}
            disabled={assessment.checked}
            autoFocus={!assessment.checked}
            onChange={(event) => setAssessmentValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                checkAssessment();
              }
            }}
            spellCheck={false}
            autoComplete="off"
          />
          {assessment.checked && <div className={`assessment-result ${assessment.lastScore >= 80 ? "pass" : ""}`}><strong>本題正確率 {assessment.lastScore}%</strong><span>正確句子：{item.sentence}</span></div>}
          <button
            key={assessment.checked ? "assessment-next" : "assessment-submit"}
            className="primary-button full-button detail-next-button"
            onClick={assessment.checked ? nextAssessment : checkAssessment}
            onKeyDown={(event) =>
              activateButtonOnEnter(
                event,
                assessment.checked ? nextAssessment : checkAssessment,
              )
            }
            autoFocus={assessment.checked}
            aria-keyshortcuts="Enter"
            title={assessment.checked ? "按 Enter 繼續" : "在輸入框按 Enter 送出"}
          >
            <span>
              {assessment.checked
                ? (assessment.index === assessment.lessons.length - 1 ? "查看測驗結果" : "下一題 →")
                : "送出答案"}
            </span>
            <kbd>Enter</kbd>
          </button>
          {!!finalScores.length && <small className="center-note">目前平均 {Math.round(finalScores.reduce((sum, score) => sum + score, 0) / finalScores.length)}%</small>}
        </section>
      </div>
    );
  };

  const renderScreen = () => {
    if (screen === "related-vocabulary") {
      return renderRelatedVocabulary();
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
      <aside className="sidebar">
        <button className="brand" onClick={() => setScreen("home")} aria-label="回首頁">
          <span className="brand-mark">E</span>
          <span><strong>英句練習</strong><small>一句一句，真的記住</small></span>
        </button>
        <nav aria-label="主要導覽">
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
            >
              <span className="nav-icon">{item.icon}</span>{item.label}
              {item.screen === "review" && dueReviews.length > 0 && <b>{dueReviews.length}</b>}
              {item.screen === "weakness" && vocabularyWeaknesses.length > 0 && (
                <b>{vocabularyWeaknesses.length}</b>
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
          <div><span className="online-dot" /> 本機進度已儲存</div>
          <div className="top-actions">
            <span className="streak">◆ 本週 {progress.studyDates.slice(-7).length} 天</span>
            {dailySession && (
              <button
                data-testid="daily-session-resume"
                onClick={() => goToDailySessionStep(dailySession)}
              >
                今日學習進行中
              </button>
            )}
            <button onClick={() => setScreen("settings")} className={screen === "settings" ? "active" : ""}>設定</button>
          </div>
        </header>
        <div className="page-content">{renderScreen()}</div>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
