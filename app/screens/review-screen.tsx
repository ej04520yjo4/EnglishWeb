import type * as React from "react";
import {
  buildDailyRecognitionOptions,
  resolveDailyReviewSource,
} from "../daily-review";
import {
  nextDailySessionStep,
  remainingDailyReviewItems,
  updateDailyReviewItemProgress,
} from "../daily-session";
import { activateButtonOnEnter } from "../home-model";
import { StatCard } from "../home-widgets";
import type { CourseUnit, Lesson } from "../course-data";
import type { LevelLearningProgress } from "../curriculum/progress";
import type { DailyReviewSource } from "../daily-review";
import type { DailySessionState } from "../daily-session";
import type { Familiarity } from "../home-model";
import type {
  ReviewFamiliarity,
  ReviewScheduleItem,
} from "../learning-progress";
import type { CefrLevel } from "../curriculum/types";

export type ReviewScreenProps = {
  checkDailyReview: (selectedOption?: string | undefined) => void;
  commitDailySession: (next: DailySessionState | null, persistImmediately?: boolean) => void;
  continueDailyReview: () => void;
  courseUnits: CourseUnit[];
  dailyReviewFeedback: string;
  dailyReviewResultItemId: string;
  dailyReviewSources: DailyReviewSource[];
  dailyReviewValue: string;
  dailySession: DailySessionState | null;
  dailySessionRef: React.RefObject<DailySessionState | null>;
  discardDailySession: (message: string) => void;
  dueReviews: ReviewScheduleItem[];
  ensureCurrentDailySession: (session: DailySessionState) => boolean;
  leaveDailyReview: () => void;
  progress: LevelLearningProgress;
  setDailyReviewValue: React.Dispatch<React.SetStateAction<string>>;
  speak: (text: string, rate?: number, countReplay?: boolean) => void;
  speechSupported: boolean;
  startLesson: (item: Lesson, sourceLevel?: CefrLevel) => void;
  updateFamiliarity: (item: ReviewScheduleItem, familiarity: ReviewFamiliarity) => void;
};

export function ReviewScreen({
  checkDailyReview,
  commitDailySession,
  continueDailyReview,
  courseUnits,
  dailyReviewFeedback,
  dailyReviewResultItemId,
  dailyReviewSources,
  dailyReviewValue,
  dailySession,
  dailySessionRef,
  discardDailySession,
  dueReviews,
  ensureCurrentDailySession,
  leaveDailyReview,
  progress,
  setDailyReviewValue,
  speak,
  speechSupported,
  startLesson,
  updateFamiliarity,
}: ReviewScreenProps) {

    const dailyReviewSession =
      dailySession &&
      (nextDailySessionStep(dailySession) === "review" ||
        Boolean(dailyReviewResultItemId))
        ? dailySession
        : null;
    if (dailyReviewSession) {
      const remaining = remainingDailyReviewItems(dailyReviewSession);
      const item = dailyReviewResultItemId
        ? dailyReviewSession.reviewItems.find(
            (candidate) => candidate.id === dailyReviewResultItemId,
          ) ?? remaining[0]
        : remaining[0];
      const source = item
        ? resolveDailyReviewSource(item, dailyReviewSources)
        : null;
      if (!item || !source) {
        return (
          <div className="page-stack" data-testid="daily-review-active">
            <section className="section-card">
              <h1>今日複習內容已更新</h1>
              <p>正式課程來源已變更，請重新開始今天的學習。</p>
              <button
                className="primary-button"
                onClick={() =>
                  discardDailySession(
                    "今日複習的正式課程來源已更新，請重新開始今天的學習。",
                  )
                }
              >
                返回首頁
              </button>
            </section>
          </div>
        );
      }
      const itemProgress = dailyReviewSession.reviewItemProgress[item.id] ?? {
        attempts: 0,
        answerRevealed: false,
        usedPaste: false,
      };
      const resultVisible = dailyReviewResultItemId === item.id;
      const displayIndex = resultVisible
        ? dailyReviewSession.completedReviewItemIds.length
        : dailyReviewSession.completedReviewItemIds.length + 1;
      const recognitionOptions = buildDailyRecognitionOptions(
        source,
        dailyReviewSources,
      );
      const markPasteUsed = () => {
        const current = dailySessionRef.current;
        if (!current || !ensureCurrentDailySession(current)) return;
        commitDailySession(
          updateDailyReviewItemProgress(current, item.id, { usedPaste: true }),
          true,
        );
      };
      return (
        <div className="page-stack" data-testid="daily-review-active">
          <section className="page-title">
            <div>
              <span className="eyebrow">先主動回想，再進入今日課程</span>
              <h1
                data-testid="daily-review-counter"
              >
                今日複習 {displayIndex} / {dailyReviewSession.reviewItems.length}
              </h1>
              <p>每次只做一題；已完成的題目重新整理後不會重做。</p>
            </div>
            <button
              className="secondary-button"
              data-testid="leave-daily-review"
              onClick={leaveDailyReview}
            >
              離開今日學習
            </button>
          </section>
          <section className="exercise-card recall-card" key={item.id}>
            {item.mode === "spelling" && (
              <>
                <span className="eyebrow">看中文，拼出英文</span>
                <h2
                  className="chinese-prompt recall-primary-prompt"
                  data-testid="daily-review-prompt"
                >
                  {source.prompt}
                </h2>
                <label className="field-label" htmlFor="daily-review-input">
                  你的英文答案
                </label>
                <input
                  id="daily-review-input"
                  className="answer-input"
                  data-testid="daily-review-input"
                  value={dailyReviewValue}
                  readOnly={resultVisible}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onPaste={markPasteUsed}
                  onChange={(event) => setDailyReviewValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.repeat &&
                      !resultVisible
                    ) {
                      event.preventDefault();
                      checkDailyReview();
                    }
                  }}
                  placeholder="輸入英文單字"
                />
                <button
                  className="audio-button"
                  onClick={() => speak(source.answer, 1, false)}
                  disabled={!speechSupported}
                >
                  ▶ 聽發音
                </button>
              </>
            )}
            {item.mode === "recognition" && (
              <>
                <span className="eyebrow">看到英文，選出正確意思</span>
                <h2
                  className="chinese-prompt recall-primary-prompt"
                  data-testid="daily-review-prompt"
                >
                  {source.answer}
                </h2>
                <div className="exercise-choice-list">
                  {recognitionOptions.map((option, index) => (
                    <button
                      key={option}
                      className={`exercise-choice ${
                        dailyReviewValue === option ? "selected" : ""
                      }`}
                      data-testid="daily-review-option"
                      disabled={resultVisible}
                      autoFocus={index === 0 && !resultVisible}
                      onClick={() => checkDailyReview(option)}
                      onKeyDown={(event) =>
                        activateButtonOnEnter(event, () => checkDailyReview(option))
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
            {item.mode === "application" && (
              <>
                <span className="eyebrow">把單字用回正式課程句子</span>
                <h2
                  className="chinese-prompt recall-primary-prompt"
                  data-testid="daily-review-prompt"
                >
                  {source.translation}
                </h2>
                <label className="field-label" htmlFor="daily-review-input">
                  請輸入完整英文句子
                </label>
                <textarea
                  id="daily-review-input"
                  className="answer-input sentence-input"
                  data-testid="daily-review-input"
                  rows={3}
                  value={dailyReviewValue}
                  readOnly={resultVisible}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onPaste={markPasteUsed}
                  onChange={(event) => setDailyReviewValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.repeat &&
                      !resultVisible
                    ) {
                      event.preventDefault();
                      checkDailyReview();
                    }
                  }}
                  placeholder="輸入完整英文句子"
                />
              </>
            )}
            <div
              className={`feedback ${
                itemProgress.answerRevealed ? "warning" : ""
              }`}
              data-testid="daily-review-feedback"
              aria-live="polite"
            >
              {dailyReviewFeedback ||
                (item.mode === "recognition"
                  ? "請選出課程中對應的繁體中文意思。"
                  : "答錯後會逐步提供提示；第三次才顯示答案。")}
            </div>
            {itemProgress.answerRevealed && !resultVisible && (
              <div
                className="correct-format"
                data-testid="daily-review-revealed-answer"
              >
                {item.mode === "spelling" ? source.answer : source.sentence}
              </div>
            )}
            {item.mode !== "recognition" && !resultVisible && (
              <button
                className="primary-button full-button"
                data-testid="daily-review-check"
                onClick={() => checkDailyReview()}
                onKeyDown={(event) =>
                  activateButtonOnEnter(event, () => checkDailyReview())
                }
              >
                檢查答案
              </button>
            )}
            {resultVisible && (
              <button
                className="primary-button full-button detail-next-button"
                data-testid="daily-review-next"
                onClick={continueDailyReview}
                onKeyDown={(event) =>
                  activateButtonOnEnter(event, continueDailyReview)
                }
                autoFocus
                aria-keyshortcuts="Enter"
              >
                <span>
                  {remaining.length > 0
                    ? "下一題 →"
                    : "前往今日課程 →"}
                </span>
                <kbd>Enter</kbd>
              </button>
            )}
          </section>
        </div>
      );
    }
    return (
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
      </section>
    </div>
    );
}
