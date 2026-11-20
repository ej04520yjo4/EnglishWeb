import type * as React from "react";
import { advancedCoursePlans } from "../course-roadmap";
import { activateButtonOnEnter } from "../home-model";
import type { CourseUnit, Lesson } from "../course-data";
import type { LevelLearningProgress } from "../curriculum/progress";
import type { CurriculumCatalog, CefrLevel } from "../curriculum/types";

export type CourseMapScreenProps = {
  catalog: CurriculumCatalog | null;
  coursePercent: number;
  courseUnits: CourseUnit[];
  isLessonAvailable: (unit: CourseUnit, unitIndex: number, itemIndex: number) => boolean;
  isUnitAvailable: (unitIndex: number) => boolean;
  levelStatusLabel: "試行課程" | "正式課程";
  nextLesson: Lesson;
  progress: LevelLearningProgress;
  renderLevelSelector: () => React.JSX.Element;
  selectedLevel: CefrLevel;
  startAssessment: (kind: "unit" | "level", unit?: CourseUnit | undefined) => void;
  startLesson: (item: Lesson, sourceLevel?: CefrLevel) => void;
};

export function CourseMapScreen({
  catalog,
  coursePercent,
  courseUnits,
  isLessonAvailable,
  isUnitAvailable,
  levelStatusLabel,
  nextLesson,
  progress,
  renderLevelSelector,
  selectedLevel,
  startAssessment,
  startLesson,
}: CourseMapScreenProps) {
  return (
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
}
