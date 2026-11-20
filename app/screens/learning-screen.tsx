import type * as React from "react";
import type { KeyboardEvent } from "react";
import { activateButtonOnEnter, moveAcrossInputs } from "../home-model";
import { StatCard } from "../home-widgets";
import { canShowVocabularyShortcut } from "../vocabulary-groups";
import type {
  PassageComprehensionExercise,
  PassageComprehensionQuestion,
  PatternExample,
  ReadingRecognitionExercise,
  TextResponseExercise,
} from "../a1-exercises";
import type {
  AudioStatus,
  CourseUnit,
  LearningToken,
  Lesson,
} from "../course-data";
import type { LevelLearningProgress } from "../curriculum/progress";
import type { DailySessionState } from "../daily-session";
import type {
  Familiarity,
  LearningStage,
  Screen,
  SettingsState,
} from "../home-model";
import type { HintLevel } from "../learning-adaptation";
import type {
  ReviewFamiliarity,
  ReviewScheduleItem,
  TokenLearningProgressMap,
} from "../learning-progress";
import type { PassageSentenceEvaluation } from "../passage-flow";
import type { RebuildStatus } from "../rebuild-flow";
import type { VocabularyDataset } from "../vocabulary-groups";
import type { CefrLevel } from "../curriculum/types";

export type LearningScreenProps = {
  advanceFromDetail: () => void;
  afterLessonLabel: () => string;
  audioMessage: string;
  audioReplays: number;
  beginRecall: () => void;
  checkPassageComprehension: () => void;
  checkPassageRebuild: () => void;
  checkPatternTransfer: () => void;
  checkRebuild: () => void;
  checkRecall: () => void;
  checkRecognition: () => void;
  checkTextResponse: () => void;
  completeRevealedPassage: () => void;
  continueAfterLesson: () => void;
  continueAfterPatternTransfer: () => void;
  continueAfterRebuild: () => void;
  continueAfterRecognition: () => void;
  continueDailyAfterLesson: () => void;
  continuePassageComprehension: () => void;
  currentPassageQuestion: PassageComprehensionQuestion | undefined;
  currentPatternExample: PatternExample;
  currentToken: LearningToken;
  currentTokenHintLevel: HintLevel;
  currentTokenWords: string[];
  dailySession: DailySessionState | null;
  feedback: string;
  finishLesson: () => void;
  getToken: (_lessonItem: Lesson, token: LearningToken) => LearningToken;
  openRelatedVocabularyFromDetail: () => void;
  passageAnswer: string;
  passageAnswerRevealed: boolean;
  passageEvaluation: PassageSentenceEvaluation[];
  passageQuestionChecked: boolean;
  passageQuestionIndex: number;
  passageValues: string[];
  patternExampleIndex: number;
  patternTransferComplete: boolean;
  patternTransferRevealed: boolean;
  patternTransferValue: string;
  playSentenceAudio: (lessonItem: Lesson, rate?: number, countReplay?: boolean) => void;
  playTokenAudio: (token: LearningToken, rate?: number, countReplay?: boolean) => void;
  progress: LevelLearningProgress;
  rebuildAnswerRevealed: boolean;
  rebuildAttempts: number;
  rebuildStatus: RebuildStatus[];
  rebuildValues: string[];
  recallAnswerRevealed: boolean;
  recallInputs: React.RefObject<(HTMLInputElement | null)[]>;
  recallValues: string[];
  recognitionChecked: boolean;
  recognitionSelectedId: string;
  requestHint: () => void;
  selectedLesson: Lesson;
  selectedLevel: CefrLevel;
  selectedPassageComprehension: PassageComprehensionExercise | undefined;
  selectedPassageLessons: Lesson[];
  selectedPatternExamples: PatternExample[];
  selectedRecognition: ReadingRecognitionExercise | undefined;
  selectedTextResponse: TextResponseExercise | undefined;
  selectedTransferPatternId: string;
  selectedTransferPatternName: string;
  selectedUnit: CourseUnit;
  sentenceAudioAvailable: boolean;
  sessionPassageComprehensionAttempts: number;
  sessionPassageComprehensionCorrect: number;
  sessionRecognitionAttempts: number;
  sessionRecognitionCorrect: number;
  sessionTokenProgress: TokenLearningProgressMap;
  sessionTransferAttempts: number;
  sessionTransferCorrect: number;
  setPassageAnswer: React.Dispatch<React.SetStateAction<string>>;
  setPassageValues: React.Dispatch<React.SetStateAction<string[]>>;
  setPatternTransferUsedPaste: React.Dispatch<React.SetStateAction<boolean>>;
  setPatternTransferValue: React.Dispatch<React.SetStateAction<string>>;
  setRebuildUsedPaste: React.Dispatch<React.SetStateAction<boolean>>;
  setRebuildValues: React.Dispatch<React.SetStateAction<string[]>>;
  setRecallUsedPaste: React.Dispatch<React.SetStateAction<boolean>>;
  setRecallValues: React.Dispatch<React.SetStateAction<string[]>>;
  setRecognitionSelectedId: React.Dispatch<React.SetStateAction<string>>;
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  setTextResponseSelectedId: React.Dispatch<React.SetStateAction<string>>;
  settings: SettingsState;
  setToast: React.Dispatch<React.SetStateAction<string>>;
  stage: LearningStage;
  textResponseChecked: boolean;
  textResponseSelectedId: string;
  tokenAudioAvailable: boolean;
  tokenIndex: number;
  transferReviewSource: { unit: CourseUnit; id: string; number: number; title: string; sentence: string; translation: string; grammar: string; minutes: number; tokens: LearningToken[]; passageId: string; passageOrder: number; sentenceId: string; sentenceOrder: number; sentencePatternId: string; patternName: string; patternCefr: string; isNewSentencePattern: boolean; sentenceAudioSource: string; audioStatus: AudioStatus; sourceVersion: string; } | undefined;
  updateFamiliarity: (item: ReviewScheduleItem, familiarity: ReviewFamiliarity) => void;
  vocabularyDataset: VocabularyDataset | null;
};

export function LearningScreen({
  advanceFromDetail,
  afterLessonLabel,
  audioMessage,
  audioReplays,
  beginRecall,
  checkPassageComprehension,
  checkPassageRebuild,
  checkPatternTransfer,
  checkRebuild,
  checkRecall,
  checkRecognition,
  checkTextResponse,
  completeRevealedPassage,
  continueAfterLesson,
  continueAfterPatternTransfer,
  continueAfterRebuild,
  continueAfterRecognition,
  continueDailyAfterLesson,
  continuePassageComprehension,
  currentPassageQuestion,
  currentPatternExample,
  currentToken,
  currentTokenHintLevel,
  currentTokenWords,
  dailySession,
  feedback,
  finishLesson,
  getToken,
  openRelatedVocabularyFromDetail,
  passageAnswer,
  passageAnswerRevealed,
  passageEvaluation,
  passageQuestionChecked,
  passageQuestionIndex,
  passageValues,
  patternExampleIndex,
  patternTransferComplete,
  patternTransferRevealed,
  patternTransferValue,
  playSentenceAudio,
  playTokenAudio,
  progress,
  rebuildAnswerRevealed,
  rebuildAttempts,
  rebuildStatus,
  rebuildValues,
  recallAnswerRevealed,
  recallInputs,
  recallValues,
  recognitionChecked,
  recognitionSelectedId,
  requestHint,
  selectedLesson,
  selectedLevel,
  selectedPassageComprehension,
  selectedPassageLessons,
  selectedPatternExamples,
  selectedRecognition,
  selectedTextResponse,
  selectedTransferPatternId,
  selectedTransferPatternName,
  selectedUnit,
  sentenceAudioAvailable,
  sessionPassageComprehensionAttempts,
  sessionPassageComprehensionCorrect,
  sessionRecognitionAttempts,
  sessionRecognitionCorrect,
  sessionTokenProgress,
  sessionTransferAttempts,
  sessionTransferCorrect,
  setPassageAnswer,
  setPassageValues,
  setPatternTransferUsedPaste,
  setPatternTransferValue,
  setRebuildUsedPaste,
  setRebuildValues,
  setRecallUsedPaste,
  setRecallValues,
  setRecognitionSelectedId,
  setScreen,
  setTextResponseSelectedId,
  settings,
  setToast,
  stage,
  textResponseChecked,
  textResponseSelectedId,
  tokenAudioAvailable,
  tokenIndex,
  transferReviewSource,
  updateFamiliarity,
  vocabularyDataset,
}: LearningScreenProps) {

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
            <p className="data-source-note">
              逐字輸入模式：依中文提示，一格寫一個英文字
            </p>
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
        dailySession?.level === selectedLevel &&
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

    const activeExerciseQaStatus = stage === "reading-recognition"
      ? selectedRecognition?.qaStatus
      : stage === "pattern-transfer"
        ? currentPatternExample?.qaStatus
        : stage === "text-response"
          ? selectedTextResponse?.qaStatus
          : undefined;
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
        {selectedLevel === "A1" && activeExerciseQaStatus === "pilot_review_required" && (
          <p className="exercise-instruction" data-testid="a1-exercise-trial-notice">
            新增練習試行中，英文與中文內容仍待人工複核。
          </p>
        )}

        {stage === "recall" && (
          <section className="exercise-card recall-card">
            <span className="eyebrow">輸入練習</span>
            <h1 className="recall-task-title">把下面提示寫成英文</h1>
            <h2
              className="chinese-prompt recall-primary-prompt"
              data-testid="recall-primary-prompt"
            >
              {currentToken.prompt}
            </h2>
            <p className="recall-task-meta">
              {currentToken.promptType === "grammar"
                ? "文法提示"
                : currentToken.promptType === "context"
                  ? "語境提示"
                  : "中文提示"}
              ・提示 Level {currentTokenHintLevel}
            </p>
            <label
              className="field-label recall-answer-label"
              htmlFor="recall-answer-0"
            >
              你的英文答案
            </label>
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
                      setRecallUsedPaste(true);
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
                      const previous =
                        index > 0 ? recallInputs.current[index - 1] : null;
                      const next =
                        index < currentTokenWords.length - 1
                          ? recallInputs.current[index + 1]
                          : null;
                      if (moveAcrossInputs(event, previous, next)) return;
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (event.repeat) return;
                        checkRecall();
                      }
                    }}
                    placeholder={
                      recallAnswerRevealed
                        ? word
                        : currentTokenWords.length > 1
                          ? `第 ${index + 1} 詞`
                          : "輸入英文"
                    }
                  />
                </label>
              ))}
            </div>
            <div className="audio-row recall-audio-row">
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
                  ? "此瀏覽器不支援語音播放。"
                  : audioMessage ||
                    (currentToken.audioStatus === "ready"
                      ? "播放課程音訊"
                      : "目前使用瀏覽器美式語音")}
              </small>
            </div>
            {currentTokenWords.length > 1 && (
              <p className="chunk-input-note">
                這是一個 {currentTokenWords.length} 詞語塊，請每格輸入一個英文詞。
              </p>
            )}
            <div className={`feedback ${recallAnswerRevealed ? "warning" : ""}`} aria-live="polite">
              {feedback || "拼字要正確；大小寫不影響判定。"}
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
            <div className="detail-essential" data-testid="detail-essential">
              <div className="detail-essential-item preferred-phonetic">
                <small>
                  {settings.phonetic === "KK" ? "KK 音標" : "美式 IPA"}
                </small>
                <strong>
                  {settings.phonetic === "KK" ? currentToken.kk : currentToken.ipa}
                </strong>
              </div>
              <div className="detail-essential-item">
                <small>句中詞性</small>
                <strong>{currentToken.contextPos || currentToken.partOfSpeech}</strong>
              </div>
            </div>
            <details className="detail-more">
              <summary>更多字詞資訊</summary>
              <div className="detail-grid detail-grid-secondary">
                <div>
                  <small>
                    {settings.phonetic === "KK" ? "美式 IPA" : "KK 音標"}
                  </small>
                  <strong>
                    {settings.phonetic === "KK" ? currentToken.ipa : currentToken.kk}
                  </strong>
                </div>
                {currentToken.dictionaryPos && (
                  <div>
                    <small>字典詞性</small>
                    <strong>{currentToken.dictionaryPos}</strong>
                  </div>
                )}
                <div>
                  <small>音節</small>
                  <strong>{currentToken.syllables || "單音節／語塊"}</strong>
                </div>
                <div>
                  <small>重音</small>
                  <strong>{currentToken.stress || "依語句自然重讀"}</strong>
                </div>
                <div>
                  <small>原形／變化</small>
                  <strong>{currentToken.lemma || currentToken.answer}</strong>
                </div>
              </div>
            </details>
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
              每格只輸入一個英文單字；空白鍵／→ 前往下一格，← 回上一格，最後一格按 Enter 檢查。
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
                    onPaste={() => setRebuildUsedPaste(true)}
                    onChange={(event) => {
                      const values = [...rebuildValues];
                      values[index] = event.target.value;
                      setRebuildValues(values);
                    }}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                      if (rebuildAnswerRevealed) return;
                      const previous =
                        index > 0
                          ? (document.getElementById(
                              `rebuild-${index - 1}`,
                            ) as HTMLInputElement | null)
                          : null;
                      const next =
                        index < selectedLesson.tokens.length - 1
                          ? (document.getElementById(
                              `rebuild-${index + 1}`,
                            ) as HTMLInputElement | null)
                          : null;
                      if (moveAcrossInputs(event, previous, next)) return;
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
                        if (event.repeat) return;
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
                    aria-pressed={selected}
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
            {transferReviewSource && (
              <p className="exercise-instruction" data-testid="pattern-review-context">
                複習已學句型：{selectedTransferPatternName}。參考句：
                <span lang="en-US">{transferReviewSource.sentence}</span>
              </p>
            )}
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
              {transferReviewSource
                ? "請使用上方複習句型輸入完整英文"
                : "請使用相同句型輸入完整英文"}
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
              onPaste={() => setPatternTransferUsedPaste(true)}
              onChange={(event) =>
                setPatternTransferValue(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.repeat) return;
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
                    aria-pressed={selected}
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
                        if (event.key !== "Enter" || event.shiftKey || event.repeat) return;
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
                      aria-pressed={selected}
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
}
