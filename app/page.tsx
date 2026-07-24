"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  allLessons,
  alphabet,
  courseUnits,
  CourseUnit,
  LearningToken,
  Lesson,
} from "./course-data";

type Screen =
  | "home"
  | "map"
  | "alphabet"
  | "review"
  | "progress"
  | "admin"
  | "settings"
  | "learning"
  | "assessment";
type LearningStage = "intro" | "recall" | "detail" | "rebuild" | "dictation" | "result";
type Familiarity = "熟悉" | "不熟" | "完全不會";
type Assessment = {
  kind: "unit" | "level";
  title: string;
  lessons: Lesson[];
  index: number;
  scores: number[];
  checked: boolean;
  lastScore: number;
};

type ReviewItem = {
  tokenId: string;
  answer: string;
  prompt: string;
  familiarity: Familiarity;
  dueAt: string;
  intervalDays: number;
  successfulDays: number;
};

type ProgressState = {
  completedLessonIds: string[];
  passedUnitIds: string[];
  levelPassed: boolean;
  totalAttempts: number;
  correctAnswers: number;
  totalSeconds: number;
  pasteCount: number;
  studyDates: string[];
  reviewItems: Record<string, ReviewItem>;
};

type SettingsState = {
  phonetic: "KK" | "IPA";
  autoplay: boolean;
  slowRate: number;
};

type TokenOverride = Pick<LearningToken, "answer" | "prompt" | "kk" | "ipa" | "partOfSpeech" | "note">;
type Overrides = Record<string, Partial<TokenOverride>>;

const STORAGE = {
  progress: "yingju-progress-v1",
  settings: "yingju-settings-v1",
  overrides: "yingju-content-overrides-v1",
};

const emptyProgress: ProgressState = {
  completedLessonIds: [],
  passedUnitIds: [],
  levelPassed: false,
  totalAttempts: 0,
  correctAnswers: 0,
  totalSeconds: 0,
  pasteCount: 0,
  studyDates: [],
  reviewItems: {},
};

const defaultSettings: SettingsState = {
  phonetic: "KK",
  autoplay: true,
  slowRate: 0.85,
};

const navItems: { screen: Screen; label: string; icon: string }[] = [
  { screen: "home", label: "首頁", icon: "⌂" },
  { screen: "map", label: "課程地圖", icon: "◉" },
  { screen: "alphabet", label: "A–Z 基礎", icon: "Aa" },
  { screen: "review", label: "待複習", icon: "↻" },
  { screen: "progress", label: "學習進度", icon: "▥" },
  { screen: "admin", label: "內容管理", icon: "≡" },
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

const wordAccuracy = (given: string, expected: string) => {
  const actualWords = cleanSentence(given).split(" ").filter(Boolean);
  const expectedWords = cleanSentence(expected).split(" ").filter(Boolean);
  const correct = expectedWords.filter((word, index) => actualWords[index] === word).length;
  return expectedWords.length ? Math.round((correct / expectedWords.length) * 100) : 0;
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

const csvEscape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

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
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(courseUnits[0].lessons[0]);
  const [stage, setStage] = useState<LearningStage>("intro");
  const [tokenIndex, setTokenIndex] = useState(0);
  const [recallValues, setRecallValues] = useState<string[]>([""]);
  const [recallAttempts, setRecallAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rebuildValues, setRebuildValues] = useState<string[]>([]);
  const [rebuildStatus, setRebuildStatus] = useState<string[]>([]);
  const [dictationValue, setDictationValue] = useState("");
  const [dictationAttempts, setDictationAttempts] = useState(0);
  const [audioReplays, setAudioReplays] = useState(0);
  const [usedPaste, setUsedPaste] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [audioMessage, setAudioMessage] = useState("");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentValue, setAssessmentValue] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminUnit, setAdminUnit] = useState("all");
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);
  const recallInputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedProgress = localStorage.getItem(STORAGE.progress);
        const storedSettings = localStorage.getItem(STORAGE.settings);
        const storedOverrides = localStorage.getItem(STORAGE.overrides);
        if (storedProgress) setProgress({ ...emptyProgress, ...JSON.parse(storedProgress) });
        if (storedSettings) setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
        if (storedOverrides) setOverrides(JSON.parse(storedOverrides));
      } catch {
        setToast("部分舊資料無法讀取，已使用安全的預設值。");
      } finally {
        setLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE.progress, JSON.stringify(progress));
  }, [loaded, progress]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
  }, [loaded, settings]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE.overrides, JSON.stringify(overrides));
  }, [loaded, overrides]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedUnit = useMemo(
    () => courseUnits.find((unit) => unit.lessons.some((item) => item.id === selectedLesson.id))!,
    [selectedLesson],
  );

  const completedCount = progress.completedLessonIds.length;
  const coursePercent = Math.round((completedCount / allLessons.length) * 100);
  const dueReviews = Object.values(progress.reviewItems).filter(
    (item) => new Date(item.dueAt).getTime() <= timestamp(),
  );
  const accuracy = progress.totalAttempts
    ? Math.round((progress.correctAnswers / progress.totalAttempts) * 100)
    : 0;

  const getToken = (lessonItem: Lesson, token: LearningToken) => ({
    ...token,
    ...(overrides[`${lessonItem.id}:${token.id}`] ?? {}),
  });

  const currentToken = getToken(selectedLesson, selectedLesson.tokens[tokenIndex]);
  const currentTokenWords = currentToken.answer.trim().split(/\s+/).filter(Boolean);
  const recallAnswer = recallValues.join(" ");

  const isUnitAvailable = (unitIndex: number) =>
    unitIndex === 0 || progress.passedUnitIds.includes(courseUnits[unitIndex - 1].id);

  const isLessonAvailable = (unit: CourseUnit, unitIndex: number, itemIndex: number) =>
    isUnitAvailable(unitIndex) &&
    (itemIndex === 0 || progress.completedLessonIds.includes(unit.lessons[itemIndex - 1].id));

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
    return allLessons[allLessons.length - 1];
  })();

  const speak = (text: string, rate = 1, countReplay = true) => {
    if (!("speechSynthesis" in window)) {
      setAudioMessage("這台裝置暫時無法播放語音。");
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

  useEffect(() => {
    if (screen !== "learning" || !settings.autoplay || stage !== "recall") return;
    const timer = window.setTimeout(() => speak(currentToken.answer, 1, false), 120);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, stage, tokenIndex, selectedLesson.id]);

  const startLesson = (item: Lesson) => {
    setSelectedLesson(item);
    setStage("intro");
    setTokenIndex(0);
    setRecallValues(
      Array(getToken(item, item.tokens[0]).answer.trim().split(/\s+/).filter(Boolean).length).fill(""),
    );
    setRecallAttempts(0);
    setHintLevel(0);
    setAnswerRevealed(false);
    setFeedback("");
    setRebuildValues(item.tokens.map(() => ""));
    setRebuildStatus(item.tokens.map(() => ""));
    setDictationValue("");
    setDictationAttempts(0);
    setAudioReplays(0);
    setUsedPaste(false);
    setStartedAt(timestamp());
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
    setAnswerRevealed(false);
    setFeedback("");
    setStartedAt(timestamp());
  };

  const advanceFromDetail = () => {
    if (tokenIndex < selectedLesson.tokens.length - 1) {
      const nextIndex = tokenIndex + 1;
      resetRecallForNext(selectedLesson.tokens[nextIndex]);
      setTokenIndex(nextIndex);
      setStage("recall");
      window.setTimeout(() => recallInputs.current[0]?.focus(), 0);
    } else {
      setRebuildValues(selectedLesson.tokens.map(() => ""));
      setRebuildStatus(selectedLesson.tokens.map(() => ""));
      setStage("rebuild");
    }
  };

  const requestHint = () => {
    const level = Math.min(3, hintLevel + 1);
    setHintLevel(level);
    if (level === 1) setFeedback(`字母數：${patternFor(currentToken.answer)}`);
    if (level === 2) {
      setFeedback(`第一個字母：${currentToken.answer.trim()[0]}`);
      speak(currentToken.answer, 1, false);
    }
    if (level === 3) {
      setFeedback(`正確答案是 ${currentToken.answer}。請重新輸入一次。`);
      setAnswerRevealed(true);
    }
  };

  const checkRecall = () => {
    const accepted = [currentToken.answer, ...(currentToken.accepted ?? [])].map(clean);
    const isCorrect = accepted.includes(clean(recallAnswer));
    const elapsed = Math.round((timestamp() - startedAt) / 1000);
    if (isCorrect) {
      setProgress((value) => ({
        ...value,
        totalAttempts: value.totalAttempts + (answerRevealed ? 0 : 1),
        correctAnswers: value.correctAnswers + (answerRevealed ? 0 : 1),
        totalSeconds: value.totalSeconds + elapsed,
        pasteCount: value.pasteCount + (usedPaste ? 1 : 0),
      }));
      setFeedback("");
      setStage("detail");
      return;
    }
    if (answerRevealed) {
      setFeedback(`請輸入本課目標答案：${currentToken.answer}`);
      return;
    }
    const nextAttempt = recallAttempts + 1;
    setRecallAttempts(nextAttempt);
    setProgress((value) => ({
      ...value,
      totalAttempts: value.totalAttempts + 1,
      totalSeconds: value.totalSeconds + elapsed,
      pasteCount: value.pasteCount + (usedPaste ? 1 : 0),
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
      speak(currentToken.answer, 1, false);
    } else {
      setFeedback(`正確答案是 ${currentToken.answer}。請重新輸入一次。`);
      setAnswerRevealed(true);
    }
    setStartedAt(timestamp());
  };

  const checkRebuild = () => {
    const answers = selectedLesson.tokens.map((token) => clean(getToken(selectedLesson, token).answer));
    const values = rebuildValues.map(clean);
    const statuses = values.map((value, index) => {
      if (value === answers[index]) return "correct";
      if (answers.includes(value)) return "order";
      return value ? "spelling" : "missing";
    });
    setRebuildStatus(statuses);
    if (statuses.every((status) => status === "correct")) {
      setFeedback("順序與拼字都正確！完成格式如下：");
      window.setTimeout(() => setStage("dictation"), 850);
    } else {
      const labels = { order: "順序不對", spelling: "檢查拼字", missing: "尚未填寫", correct: "正確" };
      setFeedback(statuses.map((status, index) => `第 ${index + 1} 格：${labels[status as keyof typeof labels]}`).join("；"));
    }
  };

  const sentenceDifference = () => {
    const actual = cleanSentence(dictationValue).split(" ").filter(Boolean);
    const expected = cleanSentence(selectedLesson.sentence).split(" ").filter(Boolean);
    const index = expected.findIndex((word, wordIndex) => actual[wordIndex] !== word);
    if (index < 0 && actual.length !== expected.length) return `句子應有 ${expected.length} 個單字。`;
    if (index < 0) return "";
    if (!actual[index]) return `第 ${index + 1} 個位置缺少單字。`;
    return `第 ${index + 1} 個位置需要再檢查（你輸入：${actual[index]}）。`;
  };

  const finishLesson = () => {
    const interval = answerRevealed || recallAttempts >= 2 ? 1 : recallAttempts ? 1 : 3;
    const today = dateKey();
    setProgress((value) => {
      const reviewItems = { ...value.reviewItems };
      selectedLesson.tokens.forEach((token) => {
        const resolved = getToken(selectedLesson, token);
        reviewItems[`${selectedLesson.id}:${token.id}`] = {
          tokenId: `${selectedLesson.id}:${token.id}`,
          answer: resolved.answer,
          prompt: resolved.prompt,
          familiarity: interval === 3 ? "熟悉" : "不熟",
          dueAt: addDays(interval),
          intervalDays: interval,
          successfulDays: 0,
        };
      });
      return {
        ...value,
        completedLessonIds: Array.from(new Set([...value.completedLessonIds, selectedLesson.id])),
        studyDates: Array.from(new Set([...value.studyDates, today])),
        reviewItems,
      };
    });
    speak(selectedLesson.sentence, 1, false);
    setStage("result");
  };

  const checkDictation = () => {
    if (cleanSentence(dictationValue) === cleanSentence(selectedLesson.sentence)) {
      setProgress((value) => ({
        ...value,
        totalAttempts: value.totalAttempts + 1,
        correctAnswers: value.correctAnswers + 1,
      }));
      finishLesson();
      return;
    }
    const attempt = dictationAttempts + 1;
    setDictationAttempts(attempt);
    setProgress((value) => ({ ...value, totalAttempts: value.totalAttempts + 1 }));
    if (attempt === 1) setFeedback(sentenceDifference());
    if (attempt === 2) {
      const initials = selectedLesson.sentence
        .replace(/[.!?]/g, "")
        .split(" ")
        .map((word) => `${word[0]}${"＿".repeat(Math.max(1, word.length - 1))}`)
        .join(" ");
      setFeedback(`開頭字母提示：${initials}`);
    }
    if (attempt >= 3) {
      setFeedback(`正確答案是 ${selectedLesson.sentence} 請重新輸入完整句子。`);
      setAnswerRevealed(true);
    }
  };

  const startAssessment = (kind: "unit" | "level", unit?: CourseUnit) => {
    const lessons =
      kind === "unit"
        ? unit!.lessons
        : courseUnits.map((courseUnit) => courseUnit.lessons[courseUnit.lessons.length - 1]);
    setAssessment({
      kind,
      title: kind === "unit" ? `${unit!.title}・單元測驗` : "A1 程度總測驗",
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
        levelPassed: assessment.kind === "level" ? true : value.levelPassed,
      }));
    }
    setToast(finalScore >= passMark ? `通過！本次正確率 ${finalScore}%` : `本次 ${finalScore}%，可隨時重新挑戰。`);
    setAssessment(null);
    setScreen("map");
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

  const contentRows = useMemo(
    () =>
      courseUnits.flatMap((unit) =>
        unit.lessons.flatMap((item) =>
          item.tokens.map((token, index) => ({
            level: "A1",
            unit_id: unit.id,
            unit_title: unit.title,
            lesson_id: item.id,
            lesson_title: item.title,
            sentence: item.sentence,
            translation: item.translation,
            grammar: item.grammar,
            token_order: index + 1,
            token_id: token.id,
            type: token.answer.includes(" ") ? "chunk" : "word",
            ...getToken(item, token),
            qa_status: "待人工確認",
          })),
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides],
  );

  const filteredRows = contentRows.filter((row) => {
    const matchesUnit = adminUnit === "all" || row.unit_id === adminUnit;
    const keyword = clean(adminSearch);
    return (
      matchesUnit &&
      (!keyword ||
        clean(`${row.answer} ${row.prompt} ${row.sentence} ${row.translation}`).includes(keyword))
    );
  });

  const exportContentCsv = () => {
    const headers = Object.keys(contentRows[0]).filter((key) => !["accepted"].includes(key));
    const csv = [
      headers.map(csvEscape).join(","),
      ...contentRows.map((row) =>
        headers.map((key) => csvEscape(row[key as keyof typeof row] ?? "")).join(","),
      ),
    ].join("\r\n");
    saveFile(`\uFEFF${csv}`, "A1課程內容_QA.csv", "text/csv;charset=utf-8");
  };

  const exportContentXlsx = async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(contentRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "A1課程內容");
    XLSX.writeFile(workbook, "A1課程內容_QA.xlsx");
  };

  const exportContentJson = () => {
    saveFile(
      JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), courseUnits, overrides }, null, 2),
      "A1課程內容.json",
      "application/json",
    );
  };

  const importContent = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      let rows: Record<string, unknown>[] = [];
      if (file.name.toLowerCase().endsWith(".json")) {
        const value = JSON.parse(await file.text());
        if (value.overrides) {
          setOverrides(value.overrides);
          setToast("JSON 課程修訂已匯入。");
          return;
        }
        rows = Array.isArray(value) ? value : [];
      } else {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      }
      const next = { ...overrides };
      rows.forEach((row) => {
        const lessonId = String(row.lesson_id ?? "");
        const tokenId = String(row.token_id ?? "");
        if (!lessonId || !tokenId) return;
        next[`${lessonId}:${tokenId}`] = {
          answer: String(row.answer ?? ""),
          prompt: String(row.prompt ?? ""),
          kk: String(row.kk ?? ""),
          ipa: String(row.ipa ?? ""),
          partOfSpeech: String(row.partOfSpeech ?? row.part_of_speech ?? ""),
          note: String(row.note ?? ""),
        };
      });
      setOverrides(next);
      setToast(`已匯入 ${rows.length} 筆課程資料。`);
    } catch {
      setToast("匯入失敗，請確認欄位名稱與檔案格式。");
    } finally {
      event.target.value = "";
    }
  };

  const exportProgress = () => {
    saveFile(
      JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), progress, settings }, null, 2),
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
      setProgress({ ...emptyProgress, ...value.progress });
      if (value.settings) setSettings({ ...defaultSettings, ...value.settings });
      setToast("完整學習進度已還原。");
    } catch {
      setToast("這不是有效的學習進度備份檔。");
    } finally {
      event.target.value = "";
    }
  };

  const renderHome = () => {
    const nextUnit = courseUnits.find((unit) => unit.lessons.some((item) => item.id === nextLesson.id))!;
    return (
      <div className="page-stack">
        <section className="welcome-row">
          <div>
            <span className="eyebrow">今天也前進一小步</span>
            <h1>把英文從「看得懂」練成「說得出來」</h1>
            <p>先回想單字與語塊，再重組、聽寫完整句子。</p>
          </div>
          <ProgressRing value={coursePercent} label="A1 完成度" />
        </section>

        <section className="continue-card">
          <div className="continue-copy">
            <span className="lesson-kicker">下一個建議課程・單元 {nextUnit.number}</span>
            <h2>{nextLesson.title}</h2>
            <p className="english-preview">{nextLesson.sentence}</p>
            <div className="chip-row">
              <span className="chip">{nextLesson.tokens.length} 個學習單位</span>
              <span className="chip">約 {nextLesson.minutes} 分鐘</span>
              <span className="chip">{nextLesson.grammar}</span>
            </div>
          </div>
          <button className="primary-button big-button" onClick={() => startLesson(nextLesson)}>
            <span className="play-dot">▶</span>
            開始這一課
          </button>
        </section>

        <div className="three-grid">
          <StatCard label="已完成課程" value={`${completedCount} / 32`} note="完成後不會再次鎖定" />
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

  const renderMap = () => (
    <div className="page-stack">
      <section className="page-title">
        <div>
          <span className="eyebrow">循序解鎖，不混合難度</span>
          <h1>A1 課程地圖</h1>
          <p>完成一課才解鎖下一課；通過單元測驗後進入下一單元。</p>
        </div>
        <span className="level-pill">A1 初學・{coursePercent}%</span>
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
                        onClick={() => startLesson(item)}
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
                    onClick={() => startAssessment("unit", unit)}
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
        <section className="level-test-card">
          <span className="lesson-number">★</span>
          <div><strong>A1 程度總測驗</strong><small>通過門檻 85%，未通過可重新挑戰</small></div>
          <button
            className="secondary-button"
            disabled={progress.passedUnitIds.length < courseUnits.length}
            onClick={() => startAssessment("level")}
          >
            {progress.levelPassed ? "重新挑戰" : "開始總測驗"}
          </button>
        </section>
      </div>
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
        {alphabet.map((letter) => (
          <button key={letter} onClick={() => speak(letter)}>
            <strong>{letter}</strong>
            <span>{letter.toLowerCase()}</span>
            <small>點一下聽發音</small>
          </button>
        ))}
      </section>
    </div>
  );

  const renderLearning = () => {
    if (stage === "intro") {
      return (
        <div className="learning-shell">
          <button className="back-button" onClick={() => setScreen("map")}>← 返回課程地圖</button>
          <section className="lesson-intro-card">
            <span className="level-pill">A1・單元 {selectedUnit.number}・第 {selectedLesson.number} 課</span>
            <h1>{selectedLesson.title}</h1>
            <p>{selectedLesson.translation}</p>
            <div className="intro-sentence">{selectedLesson.sentence}</div>
            <div className="intro-facts">
              <span><small>學習單位</small><strong>{selectedLesson.tokens.length}</strong></span>
              <span><small>文法重點</small><strong>{selectedLesson.grammar}</strong></span>
              <span><small>預估時間</small><strong>{selectedLesson.minutes} 分鐘</strong></span>
            </div>
            <button
              className="primary-button big-button full-button detail-next-button"
              onClick={beginRecall}
              autoFocus
              aria-keyshortcuts="Enter"
              title="按 Enter 開始"
            >
              <span>▶ 從發音與中文提示開始</span>
              <kbd>Enter</kbd>
            </button>
          </section>
        </div>
      );
    }

    if (stage === "result") {
      const score = Math.max(0, 100 - recallAttempts * 8 - hintLevel * 5 - dictationAttempts * 7);
      return (
        <div className="learning-shell">
          <section className="result-card">
            <div className="celebration">✓</div>
            <span className="eyebrow">課程完成</span>
            <h1>做得好！你已經重建整個句子</h1>
            <p className="result-sentence">{selectedLesson.sentence}</p>
            <div className="three-grid">
              <StatCard label="本次正確率" value={`${score}%`} />
              <StatCard label="使用提示" value={hintLevel} />
              <StatCard label="額外播放" value={audioReplays} />
            </div>
            <section className="familiarity-card">
              <div><strong>你對這句話的感覺如何？</strong><small>系統先建議，你仍可自行修改。</small></div>
              <div className="segmented">
                {(["熟悉", "不熟", "完全不會"] as Familiarity[]).map((value) => (
                  <button key={value} onClick={() => {
                    Object.values(progress.reviewItems)
                      .filter((item) => selectedLesson.tokens.some((token) => item.tokenId === `${selectedLesson.id}:${token.id}`))
                      .forEach((item) => updateFamiliarity(item, value));
                    setToast(`已標記為「${value}」`);
                  }}>{value}</button>
                ))}
              </div>
            </section>
            <div className="button-row">
              <button className="secondary-button" onClick={() => setScreen("map")}>回課程地圖</button>
              <button className="primary-button" onClick={() => startLesson(nextLesson)}>前往下一課 →</button>
            </div>
          </section>
        </div>
      );
    }

    const stageNumber = stage === "recall" || stage === "detail" ? 2 : stage === "rebuild" ? 4 : 5;
    return (
      <div className="learning-shell">
        <div className="learning-top">
          <button className="back-button" onClick={() => setScreen("map")}>← 離開本階段</button>
          <span>{stage === "recall" || stage === "detail" ? `學習單位 ${tokenIndex + 1}/${selectedLesson.tokens.length}` : stage === "rebuild" ? "完整句子重組" : "完整句子聽寫"}</span>
        </div>
        <div className="stage-progress"><i style={{ width: `${(stageNumber / 6) * 100}%` }} /></div>

        {stage === "recall" && (
          <section className="exercise-card">
            <span className="eyebrow">聽發音，依中文提示輸入英文</span>
            <h1 className="chinese-prompt">{currentToken.prompt}</h1>
            <div className="audio-row">
              <button className="audio-button" onClick={() => speak(currentToken.answer)}>▶ 正常</button>
              <button className="audio-button" onClick={() => speak(currentToken.answer, settings.slowRate)}>◁ 慢速</button>
              <small>{audioMessage || "題目開始時會自動播放一次"}</small>
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
                      answerRevealed
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
            <div className={`feedback ${answerRevealed ? "warning" : ""}`} aria-live="polite">
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
                <button className="audio-button" onClick={() => speak(currentToken.answer)}>▶ 正常</button>
                <button className="audio-button" onClick={() => speak(currentToken.answer, settings.slowRate)}>◁ 慢速</button>
              </div>
            </div>
            <div className="detail-grid">
              <div><small>{settings.phonetic} 音標</small><strong>{settings.phonetic === "KK" ? currentToken.kk : currentToken.ipa}</strong></div>
              <div><small>詞性</small><strong>{currentToken.partOfSpeech}</strong></div>
              <div><small>音節</small><strong>{currentToken.syllables || "單音節／語塊"}</strong></div>
              <div><small>重音</small><strong>{currentToken.stress || "依語句自然重讀"}</strong></div>
              <div><small>原形或變化</small><strong>{currentToken.lemma || currentToken.answer}</strong></div>
              <div><small>學習單位</small><strong>{currentToken.answer.includes(" ") ? "語塊 chunk" : "單字 word"}</strong></div>
            </div>
            {currentToken.note && <div className="usage-note"><strong>用法提醒</strong><span>{currentToken.note}</span></div>}
            <button
              className="primary-button full-button detail-next-button"
              onClick={advanceFromDetail}
              autoFocus
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
              輸入完成後按空白鍵可換格；語塊中的空格會保留在同一格。最後一格按 Enter 檢查答案。
            </p>
            <div className="rebuild-grid">
              {selectedLesson.tokens.map((token, index) => (
                <label key={`${token.id}-${index}`} className={`rebuild-field ${rebuildStatus[index]}`}>
                  <span>第 {index + 1} 格</span>
                  <input
                    id={`rebuild-${index}`}
                    value={rebuildValues[index] ?? ""}
                    autoFocus={index === 0}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    onPaste={() => setUsedPaste(true)}
                    onChange={(event) => {
                      const values = [...rebuildValues];
                      values[index] = event.target.value;
                      setRebuildValues(values);
                    }}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
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
                  <small>{rebuildStatus[index] === "correct" ? "正確" : rebuildStatus[index] === "order" ? "順序不對" : rebuildStatus[index] === "spelling" ? "檢查拼字" : rebuildStatus[index] === "missing" ? "尚未填寫" : " "}</small>
                </label>
              ))}
            </div>
            <div className="feedback" aria-live="polite">{feedback}</div>
            {rebuildStatus.every((status) => status === "correct") && <div className="correct-format">{selectedLesson.sentence}</div>}
            <div className="button-row">
              <button className="secondary-button" onClick={() => speak(selectedLesson.sentence)}>▶ 聽完整句子</button>
              <button className="primary-button" onClick={checkRebuild}>檢查順序與拼字</button>
            </div>
          </section>
        )}

        {stage === "dictation" && (
          <section className="exercise-card">
            <span className="eyebrow">隱藏英文，聽完整句子後輸入</span>
            <h1 className="chinese-prompt">{selectedLesson.translation}</h1>
            <div className="audio-row">
              <button className="audio-button" onClick={() => speak(selectedLesson.sentence)}>▶ 正常</button>
              <button className="audio-button" onClick={() => speak(selectedLesson.sentence, settings.slowRate)}>◁ 慢速</button>
            </div>
            <label className="field-label" htmlFor="dictation-answer">完整英文句子</label>
            <textarea
              id="dictation-answer"
              className="answer-input sentence-input"
              rows={3}
              value={dictationValue}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onPaste={() => setUsedPaste(true)}
              onChange={(event) => setDictationValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  checkDictation();
                }
              }}
              placeholder={answerRevealed ? selectedLesson.sentence : "輸入完整英文；Enter 檢查，Shift+Enter 換行"}
            />
            <div className={`feedback ${answerRevealed ? "warning" : ""}`} aria-live="polite">
              {feedback || "第一次錯誤會指出位置，第二次增加開頭字母提示。"}
            </div>
            <button className="primary-button full-button" onClick={checkDictation}>檢查完整句子</button>
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
            <div className="empty-state"><strong>還沒有複習資料</strong><span>完成第一課後，系統會依表現建立複習排程。</span><button className="primary-button" onClick={() => startLesson(courseUnits[0].lessons[0])}>開始第一課</button></div>
          )}
        </div>
      </section>
    </div>
  );

  const renderProgress = () => (
    <div className="page-stack">
      <section className="page-title">
        <div><span className="eyebrow">A1 學習紀錄</span><h1>學習進度</h1><p>完成、通過與精通分開記錄，讓進度更真實。</p></div>
        <ProgressRing value={coursePercent} label="課程完成" />
      </section>
      <div className="three-grid">
        <StatCard label="作答正確率" value={`${accuracy}%`} note={`${progress.correctAnswers} / ${progress.totalAttempts} 次`} />
        <StatCard label="累積學習時間" value={`${Math.max(0, Math.round(progress.totalSeconds / 60))} 分`} />
        <StatCard label="使用貼上" value={`${progress.pasteCount} 次`} note="列為輔助紀錄，不算錯誤" />
      </div>
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

  const updateOverride = (row: (typeof contentRows)[number], field: keyof TokenOverride, value: string) => {
    const key = `${row.lesson_id}:${row.token_id}`;
    setOverrides((current) => ({ ...current, [key]: { ...current[key], [field]: value } }));
  };

  const renderAdmin = () => (
    <div className="page-stack wide-page">
      <section className="page-title">
        <div><span className="eyebrow">內容資料與人工 QA</span><h1>課程內容管理</h1><p>修改後保留穩定 ID，既有學習進度不會遺失。</p></div>
        <div className="toolbar">
          <button className="secondary-button" onClick={exportContentXlsx}>匯出 Excel</button>
          <button className="secondary-button" onClick={exportContentCsv}>匯出 CSV</button>
          <button className="secondary-button" onClick={exportContentJson}>匯出 JSON</button>
          <label className="primary-button file-button">匯入修訂<input type="file" accept=".xlsx,.xls,.csv,.json" onChange={importContent} /></label>
        </div>
      </section>
      <section className="qa-note">
        <strong>給 GPT 檢查時可直接上傳匯出的資料表</strong>
        <span>請它逐列檢查台灣繁體中文翻譯、KK／IPA、詞性、語塊切分與 CEFR 難度；修正後再匯入本頁。</span>
      </section>
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
            <tbody>{filteredRows.slice(0, 120).map((row) => (
              <tr key={`${row.lesson_id}:${row.token_id}`}>
                <td><strong>{row.lesson_title}</strong><small>{row.lesson_id}<br />順序 {row.token_order}</small></td>
                <td><span className="chip">{row.type === "chunk" ? "語塊" : "單字"}</span></td>
                <td><input value={row.answer} onChange={(event) => updateOverride(row, "answer", event.target.value)} /></td>
                <td><input value={row.prompt} onChange={(event) => updateOverride(row, "prompt", event.target.value)} /></td>
                <td><input value={row.partOfSpeech} onChange={(event) => updateOverride(row, "partOfSpeech", event.target.value)} /></td>
                <td><input value={row.kk} onChange={(event) => updateOverride(row, "kk", event.target.value)} /></td>
                <td><input value={row.ipa} onChange={(event) => updateOverride(row, "ipa", event.target.value)} /></td>
                <td><span className="qa-status">待人工確認</span></td>
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
          <textarea className="answer-input sentence-input" rows={3} value={assessmentValue} disabled={assessment.checked} onChange={(event) => setAssessmentValue(event.target.value)} spellCheck={false} autoComplete="off" />
          {assessment.checked && <div className={`assessment-result ${assessment.lastScore >= 80 ? "pass" : ""}`}><strong>本題正確率 {assessment.lastScore}%</strong><span>正確句子：{item.sentence}</span></div>}
          <button className="primary-button full-button" onClick={assessment.checked ? nextAssessment : checkAssessment}>{assessment.checked ? (assessment.index === assessment.lessons.length - 1 ? "查看測驗結果" : "下一題 →") : "送出答案"}</button>
          {!!finalScores.length && <small className="center-note">目前平均 {Math.round(finalScores.reduce((sum, score) => sum + score, 0) / finalScores.length)}%</small>}
        </section>
      </div>
    );
  };

  const renderScreen = () => {
    if (screen === "home") return renderHome();
    if (screen === "map") return renderMap();
    if (screen === "alphabet") return renderAlphabet();
    if (screen === "review") return renderReview();
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
            <button key={item.screen} className={screen === item.screen ? "active" : ""} onClick={() => setScreen(item.screen)}>
              <span className="nav-icon">{item.icon}</span>{item.label}
              {item.screen === "review" && dueReviews.length > 0 && <b>{dueReviews.length}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div><span>A1</span><strong>{coursePercent}%</strong></div>
          <progress value={coursePercent} max={100} />
          <small>目前程度・初學</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><span className="online-dot" /> 本機進度已儲存</div>
          <div className="top-actions">
            <span className="streak">◆ 本週 {progress.studyDates.slice(-7).length} 天</span>
            <button onClick={() => setScreen("settings")} className={screen === "settings" ? "active" : ""}>設定</button>
          </div>
        </header>
        <div className="page-content">{renderScreen()}</div>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
