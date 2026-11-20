// Shared types, defaults, and small helpers for the learning shell in
// page.tsx and its screen components. Moved out of page.tsx unchanged.
import type { KeyboardEvent } from "react";
import type { CourseUnit, LearningToken, Lesson } from "./course-data";
import { OFFICIAL_A1_SOURCE_VERSION } from "./a1-mvp-data";
import type { ReviewFamiliarity, ReviewScheduleItem } from "./learning-progress";
import { resolveCrossInputNavigation } from "./input-flow";
import { normalizeSentenceForComparison } from "./curriculum/sentence-words";
import type { CourseExerciseData } from "./a1-exercises";
import type {
  LevelLearningProgress,
  PassageLearningStats,
  PatternLearningStats,
  SentenceLearningStats,
} from "./curriculum/progress";
import type { CefrLevel, CourseCsvRow } from "./curriculum/types";
import type {
  VocabularyLearningStatus,
  VocabularyStatusFilter,
} from "./vocabulary-groups";
import { localDateKey } from "./local-date.ts";

export type Screen =
  | "home"
  | "map"
  | "alphabet"
  | "phonetics"
  | "vocabulary-library"
  | "conversation"
  | "related-vocabulary"
  | "reference-recognition"
  | "review"
  | "weakness"
  | "weakness-practice"
  | "daily-summary"
  | "progress"
  | "admin"
  | "settings"
  | "learning"
  | "assessment";
export type LearningStage =
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
export type Familiarity = ReviewFamiliarity;
export type Assessment = {
  kind: "unit" | "level";
  title: string;
  lessons: Lesson[];
  index: number;
  scores: number[];
  checked: boolean;
  lastScore: number;
};

export type ReviewItem = ReviewScheduleItem;

export type WeaknessPracticeSource = {
  occurrenceId: string;
  lexemeId: string;
  answer: string;
  prompt: string;
  lessonId: string;
  sentenceId: string;
  sentence: string;
  translation: string;
  level: CefrLevel;
};

export const emptySentenceStats = (): SentenceLearningStats => ({
  rebuildAttempts: 0,
  recognitionAttempts: 0,
  recognitionCorrect: 0,
  elapsedSeconds: 0,
});

export const emptyPatternStats = (): PatternLearningStats => ({
  transferAttempts: 0,
  transferCorrect: 0,
  uniqueVariationsCompleted: [],
  lastPracticedAt: "",
  nextReviewAt: "",
});

export const emptyPassageStats = (): PassageLearningStats => ({
  rebuildAttempts: 0,
  comprehensionAttempts: 0,
  comprehensionCorrect: 0,
  lastPracticedAt: "",
});

export type ProgressState = LevelLearningProgress;

export type SettingsState = {
  phonetic: "KK" | "IPA";
  autoplay: boolean;
  slowRate: number;
  showAdvancedPilots: boolean;
};

export const STORAGE = {
  progress: "yingju-progress-v1",
  settings: "yingju-settings-v1",
  courseRows: "yingju-course-rows-v3",
  a2CourseRows: "yingju-course-rows-a2-v1",
  b1CourseRows: "yingju-course-rows-b1-v1",
  b2CourseRows: "yingju-course-rows-b2-v1",
  lastVocabularyGroup: "yingju-last-vocabulary-group-v1",
  dailySession: "yingju-daily-session-v3",
  legacyDailySessions: ["yingju-daily-session-v2", "yingju-daily-session-v1"],
};

export const emptyRowsByLevel = (): Record<CefrLevel, CourseCsvRow[]> => ({
  A1: [],
  A2: [],
  B1: [],
  B2: [],
});

export const emptyStringsByLevel = (): Record<CefrLevel, string> => ({
  A1: "",
  A2: "",
  B1: "",
  B2: "",
});

export const emptyUnitsByLevel = (): Record<CefrLevel, CourseUnit[]> => ({
  A1: [],
  A2: [],
  B1: [],
  B2: [],
});

export const emptyExercisesByLevel =
  (): Record<CefrLevel, CourseExerciseData | null> => ({
    A1: null,
    A2: null,
    B1: null,
    B2: null,
  });

export const emptyStatusesByLevel = (): Record<
  CefrLevel,
  "loading" | "ready" | "error"
> => ({
  A1: "loading",
  A2: "loading",
  B1: "loading",
  B2: "loading",
});

export const courseRowsStorageKey = (level: CefrLevel) => {
  if (level === "A1") return STORAGE.courseRows;
  if (level === "A2") return STORAGE.a2CourseRows;
  if (level === "B1") return STORAGE.b1CourseRows;
  return STORAGE.b2CourseRows;
};

export const defaultSettings: SettingsState = {
  phonetic: "KK",
  autoplay: true,
  slowRate: 0.85,
  showAdvancedPilots: false,
};

export const normalizeSettings = (value: unknown): SettingsState => {
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

export const navItems: { screen: Screen; label: string; icon: string }[] = [
  { screen: "home", label: "首頁", icon: "⌂" },
  { screen: "map", label: "課程地圖", icon: "◉" },
  { screen: "alphabet", label: "A–Z 基礎", icon: "Aa" },
  { screen: "phonetics", label: "KK 音標", icon: "KK" },
  { screen: "vocabulary-library", label: "3000 單字庫", icon: "▤" },
  { screen: "conversation", label: "對話練習", icon: "☏" },
  { screen: "related-vocabulary", label: "相關字詞", icon: "▦" },
  { screen: "review", label: "待複習", icon: "↻" },
  { screen: "weakness", label: "弱點中心", icon: "△" },
  { screen: "progress", label: "學習進度", icon: "▥" },
  { screen: "admin", label: "內容管理", icon: "≡" },
];

export const vocabularyStatusLabels: Record<
  VocabularyLearningStatus,
  string
> = {
  current: "本課單字",
  learned: "已學",
  "review-due": "待複習",
  "not-learned": "尚未正式學習",
};

export const vocabularyFilters: {
  id: VocabularyStatusFilter;
  label: string;
}[] = [
  { id: "all", label: "全部" },
  { id: "learned", label: "已學" },
  { id: "not-learned", label: "尚未正式學習" },
  { id: "review-due", label: "待複習" },
];

export const clean = (value: string) =>
  value
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();

export const cleanSentence = normalizeSentenceForComparison;

export const dateKey = () => localDateKey();
export const timestamp = () => Date.now();

export const addDays = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString();
};

export const saveFile = (content: BlobPart, name: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const activateButtonOnEnter = (
  event: KeyboardEvent<HTMLButtonElement>,
  action: () => void,
) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  if (event.repeat) return;
  action();
};

export const moveAcrossInputs = (
  event: KeyboardEvent<HTMLInputElement>,
  previous: HTMLInputElement | null,
  next: HTMLInputElement | null,
) => {
  const input = event.currentTarget;
  const selectionStart = input.selectionStart ?? 0;
  const selectionEnd = input.selectionEnd ?? selectionStart;
  const target = resolveCrossInputNavigation({
    key: event.key,
    valueLength: input.value.length,
    selectionStart,
    selectionEnd,
    hasPrevious: Boolean(previous),
    hasNext: Boolean(next),
  });
  if (!target) return false;

  event.preventDefault();
  if (target === "next-start" && next) {
    next.focus();
    next.setSelectionRange(0, 0);
    return true;
  }
  if (previous) {
    previous.focus();
    const end = previous.value.length;
    previous.setSelectionRange(end, end);
    return true;
  }
  return false;
};

export const EMPTY_TOKEN: LearningToken = {
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

export const EMPTY_LESSON: Lesson = {
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

export const EMPTY_UNIT: CourseUnit = {
  id: "",
  number: 0,
  title: "",
  description: "",
  accent: "#f47b5b",
  lessons: [],
};
