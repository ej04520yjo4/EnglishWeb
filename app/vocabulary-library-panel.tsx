"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { VocabularyApplicationPractice } from "./vocabulary-application-practice";
import { gradeVocabularyApplication, type VocabularyApplicationQuestion } from "./vocabulary-application";
import type { VocabularyPhoneticsData } from "./vocabulary-phonetics";
import type {
  VocabularyLibraryEntry as SourceVocabularyLibraryEntry,
  VocabularyPracticeMode,
  VocabularyPracticeQuestion,
  VocabularyRecognitionQuestion,
  VocabularySpellingQuestion,
} from "./vocabulary-library";

export type VocabularyLibraryEntry = SourceVocabularyLibraryEntry & {
  targetLevel?: "A1" | "A2";
  masteryTarget?: "active" | "receptive";
  searchAliases?: string[];
};

export type VocabularyLibraryEvidenceInput = {
  entry: VocabularyLibraryEntry;
  question: VocabularyPracticeQuestion;
  kind: "recognition" | "spelling";
  correct: boolean;
  answerRevealed: boolean;
  usedPaste: boolean;
  answer: string;
} | {
  entry: VocabularyLibraryEntry;
  question: VocabularyApplicationQuestion;
  kind: "application";
  correct: boolean;
  answerRevealed: boolean;
  usedPaste: boolean;
  answer: string;
};

export type VocabularyLibraryPanelProps = {
  entries: VocabularyLibraryEntry[];
  loading: boolean;
  error: string;
  learnedCount?: number;
  applicationCount?: number;
  applicationError?: string;
  phonetics?: VocabularyPhoneticsData | null;
  phoneticError?: string;
  buildApplicationQuestion?: (entry: VocabularyLibraryEntry) => { question: VocabularyApplicationQuestion; sentence: string } | undefined;
  buildQuestion: (
    entry: VocabularyLibraryEntry,
    mode: VocabularyPracticeMode,
  ) => VocabularyPracticeQuestion | undefined;
  onEvidence?: (input: VocabularyLibraryEvidenceInput) => void;
};

type PracticeMode = "recognition" | "spelling";
type LibraryLevelFilter = "all" | "A1" | "A2";
type LibraryMasteryFilter = "all" | "active" | "receptive";
type PracticeState =
  | {
      mode: "recognition";
      entry: VocabularyLibraryEntry;
      question: VocabularyRecognitionQuestion;
    }
  | {
      mode: "spelling";
      entry: VocabularyLibraryEntry;
      question: VocabularySpellingQuestion;
    }
  | {
      mode: "application";
      entry: VocabularyLibraryEntry;
      question: VocabularyApplicationQuestion;
      sentence: string;
    };

const PAGE_SIZE = 50;

const clean = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const supportsSpeechPlayback = () =>
  typeof window !== "undefined" &&
  typeof window.speechSynthesis?.speak === "function" &&
  typeof SpeechSynthesisUtterance === "function";

const speak = (text: string) => {
  if (!supportsSpeechPlayback()) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
};

const subscribeToSpeechSupport = () => () => {};

const useSpeechSupport = () =>
  useSyncExternalStore(
    subscribeToSpeechSupport,
    supportsSpeechPlayback,
    () => false,
  );

function RecognitionPractice({
  entry,
  question,
  onEvidence,
  onExit,
}: {
  entry: VocabularyLibraryEntry;
  question: VocabularyRecognitionQuestion;
  onEvidence?: VocabularyLibraryPanelProps["onEvidence"];
  onExit: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const speechSupported = useSpeechSupport();
  const correct = clean(selected) === clean(question.answer);

  const check = () => {
    if (checked || !selected) return;
    setChecked(true);
    onEvidence?.({
      entry,
      question,
      kind: "recognition",
      correct,
      answerRevealed: false,
      usedPaste: false,
      answer: selected,
    });
  };

  return (
    <section
      className="section-card vocabulary-library-practice"
      data-testid="vocabulary-library-recognition-practice"
    >
      <button className="back-button" onClick={onExit}>
        ← 返回 3000 單字庫
      </button>
      <span className="eyebrow">新單字辨認</span>
      <h2 data-testid="vocabulary-library-recognition-word">
        {entry.displayEnglish}
      </h2>
      <p>請選出這個單字的繁體中文意思。</p>
      <button
        className="secondary-button"
        onClick={() => speak(entry.displayEnglish)}
        disabled={!speechSupported}
        aria-label={`播放 ${entry.displayEnglish} 的美式發音`}
      >
        ▶ 播放發音
      </button>
      {!speechSupported && (
        <p className="feedback warning" role="status">
          此瀏覽器不支援語音播放
        </p>
      )}
      <div className="exercise-choice-list" role="group" aria-label="單字意思選項">
        {question.options.map((option) => (
          <button
            key={option}
            className={`exercise-choice ${selected === option ? "selected" : ""} ${checked && option === question.answer ? "correct" : ""}`}
            data-testid="vocabulary-library-recognition-option"
            aria-pressed={selected === option}
            disabled={checked}
            onClick={() => setSelected(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {checked && (
        <p
          className={`feedback ${correct ? "" : "warning"}`}
          role="status"
          data-testid="vocabulary-library-recognition-feedback"
        >
          {correct ? "答對了！" : "答案已揭示："}
          {entry.displayEnglish}＝{question.answer}
        </p>
      )}
      {!checked ? (
        <button
          className="primary-button full-button"
          data-testid="vocabulary-library-recognition-check"
          onKeyDown={(event) => { if (event.key === "Enter" && event.repeat) event.preventDefault(); }}
          disabled={!selected}
          onClick={check}
        >
          確認答案
        </button>
      ) : (
        <button
          className="primary-button full-button"
          data-testid="vocabulary-library-recognition-next"
          autoFocus
          onClick={onExit}
        >
          返回單字庫
        </button>
      )}
    </section>
  );
}

function SpellingPractice({
  entry,
  question,
  onEvidence,
  onExit,
}: {
  entry: VocabularyLibraryEntry;
  question: VocabularySpellingQuestion;
  onEvidence?: VocabularyLibraryPanelProps["onEvidence"];
  onExit: () => void;
}) {
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [usedPaste, setUsedPaste] = useState(false);
  const correct = clean(value) === clean(entry.displayEnglish);

  const check = () => {
    if (checked || !value.trim()) return;
    const nextAttempts = attempts + 1;
    // A revealed answer still requires a final correct retype. The evidence
    // callback receives answerRevealed=true so progress can reject clean
    // spelling credit while the UI can finish the exercise.
    const isCorrect = correct;
    setAttempts(nextAttempts);
    onEvidence?.({
      entry,
      question,
      kind: "spelling",
      correct: isCorrect,
      answerRevealed: revealed,
      usedPaste,
      answer: value,
    });
    if (isCorrect) {
      setChecked(true);
      return;
    }
    if (nextAttempts >= 3) {
      setRevealed(true);
      setValue("");
    }
  };

  const retypeCorrect = correct && revealed;

  return (
    <section
      className="section-card vocabulary-library-practice"
      data-testid="vocabulary-library-spelling-practice"
    >
      <button className="back-button" onClick={onExit}>
        ← 返回 3000 單字庫
      </button>
      <span className="eyebrow">新單字拼字</span>
      <h2 data-testid="vocabulary-library-spelling-word">{entry.translationZhTw}</h2>
      <p>請輸入英文單字；連續答錯三次後會顯示答案，仍須重新輸入才能完成。</p>
      <p
        className="vocabulary-library-definition"
        data-testid="vocabulary-library-spelling-definition"
      >
        {question.definitionEn}
      </p>
      <input
        className="answer-input"
        data-testid="vocabulary-library-spelling-input"
        autoFocus
        value={value}
        disabled={checked}
        onChange={(event) => setValue(event.target.value)}
        onPaste={() => setUsedPaste(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.repeat) {
            event.preventDefault();
            check();
          }
        }}
        aria-label="輸入英文單字"
        autoComplete="off"
        spellCheck={false}
      />
      {revealed && !checked && (
        <p className="feedback warning" role="status" data-testid="vocabulary-library-spelling-revealed">
          正確答案：{entry.displayEnglish}。請重新輸入後再繼續。
        </p>
      )}
      {checked && (
        <p className="feedback" role="status" data-testid="vocabulary-library-spelling-feedback">
          已完成這個單字的拼字練習。
        </p>
      )}
      {!checked ? (
        <button
          className="primary-button full-button"
          data-testid="vocabulary-library-spelling-check"
          onKeyDown={(event) => { if (event.key === "Enter" && event.repeat) event.preventDefault(); }}
          disabled={!value.trim() || (revealed && !retypeCorrect)}
          onClick={check}
        >
          {revealed ? "重新輸入並完成" : "檢查拼字"}
        </button>
      ) : (
        <button className="primary-button full-button" autoFocus onClick={onExit}>
          返回單字庫
        </button>
      )}
    </section>
  );
}

export function VocabularyLibraryPanel({
  entries,
  loading,
  error,
  learnedCount = 0,
  applicationCount = 0,
  applicationError = "",
  buildApplicationQuestion,
  phonetics = null,
  phoneticError = "",
  buildQuestion,
  onEvidence,
}: VocabularyLibraryPanelProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState<LibraryLevelFilter>("all");
  const [masteryFilter, setMasteryFilter] =
    useState<LibraryMasteryFilter>("all");
  const [practice, setPractice] = useState<PracticeState | null>(null);
  const [practiceError, setPracticeError] = useState("");

  const normalizedQuery = clean(query);
  const phoneticsByLexeme = useMemo(() => new Map(phonetics?.entries.map((entry) => [entry.lexemeId, entry]) ?? []), [phonetics]);
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (levelFilter !== "all" && entry.targetLevel !== levelFilter) {
        return false;
      }
      if (
        masteryFilter !== "all" &&
        entry.masteryTarget !== masteryFilter
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      return [
        entry.lexemeId,
        entry.displayEnglish,
        entry.translationZhTw,
        entry.partOfSpeech,
        entry.definitionEn,
        entry.usageNoteZhTw,
        entry.batchId,
        ...(entry.searchAliases ?? []),
      ].some((value) => clean(value).includes(normalizedQuery));
    });
  }, [entries, levelFilter, masteryFilter, normalizedQuery]);
  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageEntries = filteredEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const startPractice = (
    entry: VocabularyLibraryEntry,
    mode: PracticeMode,
  ) => {
    const question = buildQuestion(entry, mode);
    if (
      !question ||
      (mode === "recognition" && question.mode !== "recognition") ||
      (mode === "spelling" && question.mode !== "spelling")
    ) {
      setPracticeError("這筆單字目前無法建立安全的練習題，尚未變更進度。");
      return;
    }
    setPracticeError("");
    if (mode === "recognition" && question.mode === "recognition") {
      setPractice({ mode, entry, question });
    } else if (mode === "spelling" && question.mode === "spelling") {
      setPractice({ mode, entry, question });
    }
  };

  if (practice) {
    if (practice.mode === "application") return <VocabularyApplicationPractice question={practice.question} sentence={practice.sentence}
      onExit={() => setPractice(null)} onAnswer={(answer, usedPaste, answerRevealed) => onEvidence?.({ entry: practice.entry, question: practice.question, kind: "application", correct: gradeVocabularyApplication(answer, practice.sentence), answer, usedPaste, answerRevealed })} />;
    return practice.mode === "recognition" ? (
      <RecognitionPractice
        entry={practice.entry}
        question={practice.question}
        onEvidence={onEvidence}
        onExit={() => setPractice(null)}
      />
    ) : (
      <SpellingPractice
        entry={practice.entry}
        question={practice.question}
        onEvidence={onEvidence}
        onExit={() => setPractice(null)}
      />
    );
  }

  return (
    <div className="page-stack vocabulary-library-page" data-testid="vocabulary-library">
      <section className="page-title">
        <div>
        <span className="eyebrow">A1＋A2 詞彙目標（候選程度）</span>
          <h1>3000 單字庫</h1>
          <p>依序查看、搜尋與練習目前已整理的單字目標；瀏覽不會改變學習進度。</p>
        </div>
        <div className="vocabulary-library-summary" aria-label="單字庫統計">
          <span className="status-pill" data-testid="vocabulary-library-total">已整理目標 {entries.length}</span>
          <span className="status-pill" data-testid="vocabulary-library-learned">已開始學習 {learnedCount}</span>
          <span className="status-pill" data-testid="vocabulary-library-application-coverage">情境句 {applicationCount} / {entries.length}</span>
          <span className="status-pill" data-testid="vocabulary-library-phonetic-coverage">KK 候選 {phonetics?.entries.length ?? 0} / {entries.length}</span>
        </div>
      </section>
      <p className="qa-note" data-testid="vocabulary-library-disclaimer">
        3000 是目前收錄量，不代表已學會；A1／A2 是候選規劃，非官方 CEFR 認證。內容仍待人工複核。{" "}
        <a href="/licenses/vocabulary-3000/README.md" target="_blank" rel="noreferrer">
          查看來源與授權
        </a>
      </p>

      {loading && (
        <section className="section-card" role="status" data-testid="vocabulary-library-loading">
          正在載入 3000 單字資料…
        </section>
      )}
      {error && (
        <section className="section-card vocabulary-load-state" role="alert" data-testid="vocabulary-library-error">
          <strong>3000 單字資料暫時無法載入</strong>
          <p>{error}</p>
        </section>
      )}
      {practiceError && (
        <section className="section-card vocabulary-load-state" role="alert">
          {practiceError}
        </section>
      )}
      {applicationError && <p className="feedback warning" role="alert">{applicationError}</p>}
      {phoneticError && <p className="feedback warning" role="alert">{phoneticError}</p>}
      {!loading && !error && (
        <>
          <section className="section-card vocabulary-library-tools" aria-label="搜尋 3000 單字">
            <label className="vocabulary-search">
              <span>搜尋英文、中文或 lexeme ID</span>
              <input
                type="search"
                data-testid="vocabulary-library-search"
                aria-label="搜尋 3000 單字"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="例如：book、書、lexeme ID"
              />
            </label>
            <div className="vocabulary-library-filter-row">
              <label>
                <span>候選程度</span>
                <select
                  data-testid="vocabulary-library-level-filter"
                  aria-label="候選程度篩選"
                  value={levelFilter}
                  onChange={(event) => {
                    setLevelFilter(event.target.value as LibraryLevelFilter);
                    setPage(1);
                  }}
                >
                  <option value="all">全部</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                </select>
              </label>
              <label>
                <span>學習目標</span>
                <select
                  data-testid="vocabulary-library-mastery-filter"
                  aria-label="學習目標篩選"
                  value={masteryFilter}
                  onChange={(event) => {
                    setMasteryFilter(event.target.value as LibraryMasteryFilter);
                    setPage(1);
                  }}
                >
                  <option value="all">全部</option>
                  <option value="active">主動目標</option>
                  <option value="receptive">辨認目標</option>
                </select>
              </label>
            </div>
            <p className="center-note" data-testid="vocabulary-library-count">
              目前顯示 {filteredEntries.length} / {entries.length} 筆；每頁 {PAGE_SIZE} 筆。
            </p>
          </section>
          {!filteredEntries.length ? (
            <section className="section-card" role="status" data-testid="vocabulary-library-no-results">
              找不到符合的單字，請調整搜尋文字。
            </section>
          ) : (
            <>
              <div className="vocabulary-library-grid" data-testid="vocabulary-library-list">
                {pageEntries.map((entry) => (
                  <article
                    className="section-card vocabulary-library-entry"
                    key={entry.lexemeId}
                    data-testid={`vocabulary-library-entry-${entry.lexemeId}`}
                  >
                    <div className="vocabulary-library-entry-heading">
                      <div>
                        <span className="eyebrow">候選程度 {entry.targetLevel ?? "A1／A2"}・{entry.masteryTarget === "active" ? "主動目標" : "辨認目標"}</span>
                        <h2>{entry.displayEnglish}</h2>
                        <p>{entry.translationZhTw}</p>
                      </div>
                      <span className="status-pill">{entry.partOfSpeech || "單字"}</span>
                    </div>
                    <p className="vocabulary-library-definition">{entry.definitionEn}</p>
                    {phoneticsByLexeme.get(entry.lexemeId) && <details className="vocabulary-library-phonetics" data-testid={`vocabulary-library-phonetics-${entry.lexemeId}`}>
                      <summary>KK／美式 IPA 候選（{phoneticsByLexeme.get(entry.lexemeId)?.variants.length} 種）</summary>
                      <p>來自 CMUdict 的美式音位轉寫，仍待複核；音節邊界與重音位置為推算候選，多音詞未自動選定詞性或語境。不是音標本身的錄音。</p>
                      {phoneticsByLexeme.get(entry.lexemeId)?.variants.map((variant) => <div key={variant.variantIndex}>
                        <p><strong>候選 {variant.variantIndex}　KK {variant.kkCandidate}</strong><br />美式 IPA {variant.ipaCandidate}</p>
                        <small>來源音位：{variant.arpabet}</small>
                      </div>)}
                      <a href="https://github.com/cmusphinx/cmudict/tree/74790861f652b15e4ac49015a90074ad62a27690" target="_blank" rel="noreferrer">CMUdict 來源</a>{" · "}<a href="/licenses/vocabulary-3000/cmudict-license.txt" target="_blank" rel="noreferrer">授權通知</a>
                    </details>}
                    <small>{entry.usageNoteZhTw}</small>
                    <div className="vocabulary-library-actions">
                      <button className="secondary-button" data-testid={`vocabulary-library-apply-${entry.lexemeId}`}
                        disabled={!buildApplicationQuestion || applicationCount === 0}
                        onClick={() => {
                          const result = buildApplicationQuestion?.(entry);
                          if (!result) { setPracticeError("這個單字的句子應用尚未備妥，辨認與拼字仍可練習。"); return; }
                          setPracticeError("");
                          setPractice({ mode: "application", entry, ...result });
                        }}>練習句子應用</button>
                      <button
                        className="secondary-button"
                        data-testid={`vocabulary-library-recognize-${entry.lexemeId}`}
                        onClick={() => startPractice(entry, "recognition")}
                      >
                        練習辨認
                      </button>
                      <button
                        className="secondary-button"
                        data-testid={`vocabulary-library-spell-${entry.lexemeId}`}
                        onClick={() => startPractice(entry, "spelling")}
                      >
                        練習拼字
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <nav className="vocabulary-library-pagination" aria-label="單字庫分頁">
                <button
                  className="secondary-button"
                  data-testid="vocabulary-library-first-page"
                  disabled={currentPage === 1}
                  onClick={() => setPage(1)}
                >
                  第一頁
                </button>
                <button
                  className="secondary-button"
                  data-testid="vocabulary-library-previous-page"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  上一頁
                </button>
                <span data-testid="vocabulary-library-page">
                  第 {currentPage} / {pageCount} 頁
                </span>
                <button
                  className="secondary-button"
                  data-testid="vocabulary-library-next-page"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                >
                  下一頁
                </button>
                <button
                  className="secondary-button"
                  data-testid="vocabulary-library-last-page"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(pageCount)}
                >
                  最後一頁
                </button>
              </nav>
            </>
          )}
        </>
      )}
    </div>
  );
}
