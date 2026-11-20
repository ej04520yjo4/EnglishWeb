import type * as React from "react";
import { activateButtonOnEnter } from "../home-model";
import { StatCard } from "../home-widgets";
import { localDateKey } from "../local-date";
import type { Lesson } from "../course-data";
import type { VocabularyWeakness } from "../daily-learning";
import type { Screen } from "../home-model";

export type WeaknessScreenProps = {
  nextLesson: Lesson;
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  startLesson: (item: Lesson, sourceLevel?: "A2" | "A1" | "B1" | "B2") => void;
  startWeaknessPractice: (lexemeIds: string[], returnScreen?: "weakness" | "daily-summary") => void;
  vocabularyWeaknesses: VocabularyWeakness[];
};

export function WeaknessScreen({
  nextLesson,
  setScreen,
  startLesson,
  startWeaknessPractice,
  vocabularyWeaknesses,
}: WeaknessScreenProps) {

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
                      {item.lastSeenAt
                        ? "・最近 " + localDateKey(new Date(item.lastSeenAt))
                        : ""}
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
}
