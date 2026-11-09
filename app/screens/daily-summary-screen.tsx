import { summarizeDailySession } from "../daily-session";
import { activateButtonOnEnter } from "../home-model";
import { StatCard } from "../home-widgets";
import type { DailySessionState } from "../daily-session";

export type DailySummaryScreenProps = {
  dailySession: DailySessionState | null;
  finishDailySession: () => void;
  personalVocabularySummary: { exposed: number; receptive: number; active: number; };
  startDailyLearning: () => void;
};

export function DailySummaryScreen({
  dailySession,
  finishDailySession,
  personalVocabularySummary,
  startDailyLearning,
}: DailySummaryScreenProps) {

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
            onKeyDown={(event) => activateButtonOnEnter(event, finishDailySession)}
            autoFocus
            aria-keyshortcuts="Enter"
          >
            完成今天的學習
          </button>
        </section>
      </div>
    );
}
