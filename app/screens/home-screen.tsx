import type * as React from "react";
import { activateButtonOnEnter } from "../home-model";
import { ProgressRing, StatCard } from "../home-widgets";
import type {
  AudioStatus,
  CourseUnit,
  LearningToken,
  Lesson,
} from "../course-data";
import type { LevelLearningProgress } from "../curriculum/progress";
import type { VocabularyWeakness } from "../daily-learning";
import type { DailySessionState } from "../daily-session";
import type { Screen } from "../home-model";
import type { ReviewScheduleItem } from "../learning-progress";
import type { CefrLevel } from "../curriculum/types";

export type HomeScreenProps = {
  allLessons: { unit: CourseUnit; id: string; number: number; title: string; sentence: string; translation: string; grammar: string; minutes: number; tokens: LearningToken[]; passageId: string; passageOrder: number; sentenceId: string; sentenceOrder: number; sentencePatternId: string; patternName: string; patternCefr: string; isNewSentencePattern: boolean; sentenceAudioSource: string; audioStatus: AudioStatus; sourceVersion: string; }[];
  completedCount: number;
  coursePercent: number;
  courseUnits: CourseUnit[];
  dailySession: DailySessionState | null;
  dueReviews: ReviewScheduleItem[];
  focusOnMountWithoutScroll: (node: HTMLElement | null) => void;
  goToDailySessionStep: (session: DailySessionState) => void;
  isLessonAvailable: (unit: CourseUnit, unitIndex: number, itemIndex: number) => boolean;
  isUnitAvailable: (unitIndex: number) => boolean;
  nextLesson: Lesson;
  progress: LevelLearningProgress;
  selectedLevel: CefrLevel;
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  startAssessment: (kind: "unit" | "level", unit?: CourseUnit | undefined) => void;
  startDailyLearning: () => void;
  startLesson: (item: Lesson, sourceLevel?: CefrLevel) => void;
  vocabularyWeaknesses: VocabularyWeakness[];
  weeklyStudyDays: number;
};

export function HomeScreen({
  allLessons,
  completedCount,
  coursePercent,
  courseUnits,
  dailySession,
  dueReviews,
  focusOnMountWithoutScroll,
  goToDailySessionStep,
  isLessonAvailable,
  isUnitAvailable,
  nextLesson,
  progress,
  selectedLevel,
  setScreen,
  startAssessment,
  startDailyLearning,
  startLesson,
  vocabularyWeaknesses,
  weeklyStudyDays,
}: HomeScreenProps) {

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
            ref={focusOnMountWithoutScroll}
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
          <StatCard
            label="本週學習"
            value={`${weeklyStudyDays} 天`}
            note="依自己的步調前進"
            testId="home-weekly-study-days"
          />
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
}
