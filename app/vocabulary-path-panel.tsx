"use client";

import { useMemo, useState } from "react";
import { localDateKey } from "./local-date";
import type { VocabularyApplicationData, VocabularyApplicationQuestion } from "./vocabulary-application";
import { gradeVocabularyApplication } from "./vocabulary-application";
import { VocabularyApplicationPractice } from "./vocabulary-application-practice";
import type { VocabularyPracticeMode, VocabularyPracticeQuestion } from "./vocabulary-library";
import {
  RecognitionPractice,
  speakEnglish,
  SpellingPractice,
  useSpeechSupport,
  type VocabularyLibraryEntry,
  type VocabularyLibraryEvidenceInput,
} from "./vocabulary-library-panel";
import {
  buildVocabularyPathLessonTasks,
  buildVocabularyPathReviewTasks,
  summarizeVocabularyPath,
  VOCABULARY_PATH_REVIEW_LIMIT,
  type VocabularyPathData,
  type VocabularyPathLesson,
  type VocabularyPathLessonStatus,
  type VocabularyPathTask,
} from "./vocabulary-path";
import type { VocabularyPhoneticsData } from "./vocabulary-phonetics";
import type { GlobalVocabularyProgress } from "./vocabulary-progress";
import type { VocabularyTargetsData } from "./vocabulary-targets";

export type VocabularyPathSession = {
  title: string;
  tasks: VocabularyPathTask[];
};

const statusLabels: Record<VocabularyPathLessonStatus, string> = {
  "not-started": "尚未開始",
  "in-progress": "學習中",
  learned: "待隔天複習",
  mastered: "已達標",
};

export function VocabularyPathOverview({
  path,
  pathError,
  targets,
  progress,
  ready,
  onStart,
}: {
  path: VocabularyPathData | null;
  pathError: string;
  targets: VocabularyTargetsData | null;
  progress: GlobalVocabularyProgress;
  ready: boolean;
  onStart: (session: VocabularyPathSession) => void;
}) {
  const [chosenStage, setChosenStage] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const studyDate = localDateKey();
  const summary = useMemo(
    () => (path && targets ? summarizeVocabularyPath(path, targets, progress, studyDate) : null),
    [path, targets, progress, studyDate],
  );

  if (pathError) {
    return (
      <section className="section-card vocabulary-load-state" role="alert" data-testid="vocabulary-path-error">
        <strong>3000 字學習路線暫時無法載入</strong>
        <p>{pathError}</p>
      </section>
    );
  }
  if (!path || !targets || !summary) {
    return (
      <section className="section-card" role="status" data-testid="vocabulary-path-loading">
        正在載入 3000 字學習路線…
      </section>
    );
  }

  const next = summary.nextLesson;
  const dueCount = summary.dueLexemeIds.length;
  const stageId = chosenStage ?? next?.stageId ?? path.stages[0].id;
  const stage = path.stages.find((item) => item.id === stageId) ?? path.stages[0];
  const stageLessons = path.lessons.filter((lesson) => lesson.stageId === stage.id);
  const startLesson = (lesson: VocabularyPathLesson) => {
    const tasks = buildVocabularyPathLessonTasks(lesson, targets, progress, studyDate);
    if (!tasks.length) {
      setMessage(`第 ${lesson.order} 課今天的練習都完成了，隔天再回來複習。`);
      return;
    }
    setMessage("");
    onStart({ title: `第 ${lesson.order} 課・${lesson.titleZhTw}`, tasks });
  };
  const startReview = () => {
    const tasks = buildVocabularyPathReviewTasks(path, targets, progress, studyDate);
    if (!tasks.length) {
      setMessage("今天沒有需要複習的字。");
      return;
    }
    setMessage("");
    onStart({ title: "今日複習", tasks });
  };

  return (
    <section className="section-card vocabulary-path" data-testid="vocabulary-path">
      <div className="section-heading">
        <div>
          <span className="eyebrow">5 階段・300 課・每課 10 字</span>
          <h2>3000 字學習路線</h2>
          <p>由常用到進階排好順序。先認字，隔天再複習，主動目標字還要能拼寫並用在句子裡。</p>
        </div>
      </div>
      <div className="vocabulary-library-summary" aria-label="學習路線統計">
        <span className="status-pill" data-testid="vocabulary-path-started">已開始 {summary.startedCount} / {path.targetCount}</span>
        <span className="status-pill" data-testid="vocabulary-path-goal">已達標 {summary.goalCount} / {path.targetCount}</span>
        <span className="status-pill" data-testid="vocabulary-path-due">今日待複習 {dueCount} 字</span>
      </div>
      <div className="vocabulary-path-actions">
        {dueCount > 0 && (
          <button className="primary-button" data-testid="vocabulary-path-review" disabled={!ready} onClick={startReview}>
            開始複習（每輪最多 {VOCABULARY_PATH_REVIEW_LIMIT} 題）
          </button>
        )}
        {next ? (
          <button
            className={dueCount > 0 ? "secondary-button" : "primary-button"}
            data-testid="vocabulary-path-next"
            disabled={!ready}
            onClick={() => startLesson(next)}
          >
            學下一課：第 {next.order} 課・{next.titleZhTw}
          </button>
        ) : (
          <span className="status-pill" data-testid="vocabulary-path-finished">300 課都學過了</span>
        )}
      </div>
      {message && <p className="feedback" role="status" data-testid="vocabulary-path-message">{message}</p>}
      <p className="center-note">建議每天 1 課約 300 天學完；每天 2 課約 150 天學完。時間依複習量而定。</p>
      <details className="vocabulary-path-lessons" data-testid="vocabulary-path-lessons">
        <summary>查看全部 5 階段與 300 課</summary>
        <div className="vocabulary-path-stages" role="group" aria-label="選擇學習階段">
          {path.stages.map((item) => (
            <button
              key={item.id}
              className={`secondary-button ${item.id === stage.id ? "selected" : ""}`}
              aria-pressed={item.id === stage.id}
              data-testid={`vocabulary-path-stage-${item.order}`}
              onClick={() => setChosenStage(item.id)}
            >
              {item.titleZhTw}
            </button>
          ))}
        </div>
        <p>{stage.summaryZhTw}</p>
        <div className="vocabulary-path-lesson-grid">
          {stageLessons.map((lesson) => {
            const status = summary.lessonStatus.get(lesson.id) ?? "not-started";
            return (
              <button
                key={lesson.id}
                className={`vocabulary-path-lesson ${status}`}
                data-testid={`vocabulary-path-lesson-${lesson.order}`}
                disabled={!ready}
                onClick={() => startLesson(lesson)}
              >
                <strong>第 {lesson.order} 課・{lesson.titleZhTw}</strong>
                <small>{lesson.lexemeIds.slice(0, 4).join("、")}…</small>
                <span>{statusLabels[status]}</span>
              </button>
            );
          })}
        </div>
      </details>
    </section>
  );
}

function PathStudyCard({
  entry,
  sentence,
  translation,
  note,
  kk,
  onSeen,
  onExit,
}: {
  entry: VocabularyLibraryEntry;
  sentence?: string;
  translation?: string;
  note?: string;
  kk?: string;
  onSeen: () => void;
  onExit: () => void;
}) {
  const speechSupported = useSpeechSupport();
  return (
    <section className="section-card vocabulary-library-practice vocabulary-path-card" data-testid="vocabulary-path-study">
      <button className="back-button" onClick={onExit}>← 離開本輪</button>
      <span className="eyebrow">認識新字・{entry.masteryTarget === "active" ? "主動目標（要會拼寫）" : "辨認目標（要看得懂）"}</span>
      <h2 data-testid="vocabulary-path-study-word">{entry.displayEnglish}</h2>
      <p className="vocabulary-path-meaning" data-testid="vocabulary-path-study-meaning">{entry.translationZhTw}</p>
      <p className="center-note">
        {entry.partOfSpeech}
        {kk ? `・KK 候選 ${kk}` : ""}
      </p>
      {sentence && (
        <div className="vocabulary-path-example">
          <p lang="en">{sentence}</p>
          <p>{translation}</p>
          {note && <small>{note}</small>}
        </div>
      )}
      <div className="vocabulary-path-actions">
        <button
          className="secondary-button"
          disabled={!speechSupported}
          aria-label={`播放 ${entry.displayEnglish} 的美式發音`}
          onClick={() => speakEnglish(entry.displayEnglish)}
        >
          ▶ 單字發音
        </button>
        {sentence && (
          <button
            className="secondary-button"
            disabled={!speechSupported}
            aria-label="播放例句發音"
            onClick={() => speakEnglish(sentence)}
          >
            ▶ 例句發音
          </button>
        )}
      </div>
      <button
        className="primary-button full-button"
        data-testid="vocabulary-path-study-next"
        autoFocus
        onKeyDown={(event) => { if (event.key === "Enter" && event.repeat) event.preventDefault(); }}
        onClick={onSeen}
      >
        看過了，下一個
      </button>
    </section>
  );
}

function PathQuestion({
  task,
  entry,
  buildQuestion,
  buildApplicationQuestion,
  onEvidence,
  onNext,
  onExit,
}: {
  task: VocabularyPathTask;
  entry: VocabularyLibraryEntry;
  buildQuestion: (entry: VocabularyLibraryEntry, mode: VocabularyPracticeMode) => VocabularyPracticeQuestion | undefined;
  buildApplicationQuestion: (entry: VocabularyLibraryEntry) => { question: VocabularyApplicationQuestion; sentence: string } | undefined;
  onEvidence: (input: VocabularyLibraryEvidenceInput) => void;
  onNext: () => void;
  onExit: () => void;
}) {
  // Built once per step so a re-render cannot reshuffle or replace the question.
  const [built] = useState(() => {
    if (task.kind === "application") return buildApplicationQuestion(entry);
    if (task.kind === "recognition" || task.kind === "spelling") return buildQuestion(entry, task.kind);
    return undefined;
  });
  const labels = { backLabel: "← 離開本輪", nextLabel: "下一步", onNext };
  if (built && "sentence" in built && task.kind === "application") {
    const { question, sentence } = built;
    return (
      <VocabularyApplicationPractice
        {...labels}
        question={question}
        sentence={sentence}
        onExit={onExit}
        onAnswer={(answer, usedPaste, answerRevealed) => onEvidence({
          entry, question, kind: "application", answer, usedPaste, answerRevealed,
          correct: gradeVocabularyApplication(answer, sentence),
        })}
      />
    );
  }
  if (built && "mode" in built && built.mode === "recognition") {
    return <RecognitionPractice {...labels} enableNumberKeys entry={entry} question={built} onEvidence={onEvidence} onExit={onExit} />;
  }
  if (built && "mode" in built && built.mode === "spelling") {
    return <SpellingPractice {...labels} entry={entry} question={built} onEvidence={onEvidence} onExit={onExit} />;
  }
  return (
    <section className="section-card vocabulary-library-practice" role="alert" data-testid="vocabulary-path-unavailable">
      <p>{entry.displayEnglish} 目前無法建立這個練習，尚未變更進度。</p>
      <button className="primary-button full-button" autoFocus onClick={onNext}>略過，下一步</button>
    </section>
  );
}

export function VocabularyPathSessionView({
  session,
  entries,
  applications,
  phonetics,
  buildQuestion,
  buildApplicationQuestion,
  onEvidence,
  onExposure,
  onExit,
}: {
  session: VocabularyPathSession;
  entries: VocabularyLibraryEntry[];
  applications: VocabularyApplicationData | null;
  phonetics: VocabularyPhoneticsData | null;
  buildQuestion: (entry: VocabularyLibraryEntry, mode: VocabularyPracticeMode) => VocabularyPracticeQuestion | undefined;
  buildApplicationQuestion: (entry: VocabularyLibraryEntry) => { question: VocabularyApplicationQuestion; sentence: string } | undefined;
  onEvidence: (input: VocabularyLibraryEvidenceInput) => void;
  onExposure: (entry: VocabularyLibraryEntry) => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const entryById = useMemo(() => new Map(entries.map((entry) => [entry.lexemeId, entry])), [entries]);
  const applicationById = useMemo(
    () => new Map(applications?.entries.map((entry) => [entry.lexemeId, entry]) ?? []),
    [applications],
  );
  const phoneticById = useMemo(
    () => new Map(phonetics?.entries.map((entry) => [entry.lexemeId, entry]) ?? []),
    [phonetics],
  );
  const total = session.tasks.length;
  const next = () => setIndex((value) => value + 1);

  if (index >= total) {
    return (
      <section className="section-card vocabulary-library-practice" data-testid="vocabulary-path-complete">
        <span className="eyebrow">{session.title}</span>
        <h2>本輪完成</h2>
        <p>共完成 {total} 個步驟。同一個字要在不同日期再答對，才會累積成「已達標」。</p>
        <button className="primary-button full-button" autoFocus data-testid="vocabulary-path-return" onClick={onExit}>
          回到學習路線
        </button>
      </section>
    );
  }

  const task = session.tasks[index];
  const entry = entryById.get(task.lexemeId);
  const application = applicationById.get(task.lexemeId);
  return (
    <div className="page-stack vocabulary-path-session" data-testid="vocabulary-path-session">
      <div className="vocabulary-path-session-head">
        <strong>{session.title}</strong>
        <span data-testid="vocabulary-path-session-progress">第 {index + 1} / {total} 步</span>
      </div>
      <progress max={total} value={index} aria-label="本輪進度" />
      {!entry ? (
        <section className="section-card" role="alert">
          <p>找不到這個單字的資料，尚未變更進度。</p>
          <button className="primary-button full-button" onClick={next}>略過，下一步</button>
        </section>
      ) : task.kind === "study" ? (
        <PathStudyCard
          key={`${index}-${task.lexemeId}`}
          entry={entry}
          sentence={application?.sentence}
          translation={application?.translationZhTw}
          note={application?.noteZhTw}
          kk={phoneticById.get(task.lexemeId)?.variants[0]?.kkCandidate}
          onSeen={() => { onExposure(entry); next(); }}
          onExit={onExit}
        />
      ) : (
        <PathQuestion
          key={`${index}-${task.kind}-${task.lexemeId}`}
          task={task}
          entry={entry}
          buildQuestion={buildQuestion}
          buildApplicationQuestion={buildApplicationQuestion}
          onEvidence={onEvidence}
          onNext={next}
          onExit={onExit}
        />
      )}
    </div>
  );
}
