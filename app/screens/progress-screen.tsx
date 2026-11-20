import { timestamp } from "../home-model";
import { ProgressRing, StatCard } from "../home-widgets";
import { summarizeVocabularyProgress } from "../vocabulary-progress";
import { buildVocabularyCoverageReport } from "../vocabulary-targets";
import type { CourseUnit } from "../course-data";
import type {
  LevelLearningProgress,
  MultiLevelProgress,
} from "../curriculum/progress";
import type { CefrLevel } from "../curriculum/types";
import type { VocabularyTargetsData } from "../vocabulary-targets";

export type ProgressScreenProps = {
  accuracy: number;
  coursePercent: number;
  courseUnits: CourseUnit[];
  multiProgress: MultiLevelProgress;
  progress: LevelLearningProgress;
  selectedLevel: CefrLevel;
  vocabularyTargets: VocabularyTargetsData | null;
  vocabularyTargetsError: string;
};

export function ProgressScreen({
  accuracy,
  coursePercent,
  courseUnits,
  multiProgress,
  progress,
  selectedLevel,
  vocabularyTargets,
  vocabularyTargetsError,
}: ProgressScreenProps) {

    const vocabularyCoverage = vocabularyTargets
      ? buildVocabularyCoverageReport(vocabularyTargets)
      : null;
    const personalVocabulary = summarizeVocabularyProgress(
      multiProgress.vocabularyProgress,
      vocabularyTargets?.entries.map((entry) => entry.lexemeId),
    );
    const globalDueReviews = ["A1", "A2"].reduce(
      (count, level) =>
        count +
        Object.values(
          multiProgress.levelProgress[level as CefrLevel].reviewItems,
        ).filter((item) => new Date(item.dueAt).getTime() <= timestamp()).length,
      0,
    );
    const learnedSenseCount = new Set(
      ["A1", "A2"].flatMap((level) =>
        Object.entries(
          multiProgress.levelProgress[level as CefrLevel].senseProgress,
        )
          .filter(([, item]) => item.completedLessonIds.length > 0)
          .map(([senseId]) => senseId),
      ),
    ).size;
    const touchedChunkCount = new Set(
      ["A1", "A2"].flatMap((level) =>
        Object.keys(
          multiProgress.levelProgress[level as CefrLevel].chunkHintLevels,
        ),
      ),
    ).size;
    return (
    <div className="page-stack">
      <section className="page-title">
        <div><span className="eyebrow">{selectedLevel} 學習紀錄</span><h1>學習進度</h1><p>完成、通過與精通分開記錄，讓進度更真實。</p></div>
        <ProgressRing value={coursePercent} label="課程完成" />
      </section>
      <div className="three-grid">
        <StatCard label="作答正確率" value={`${accuracy}%`} note={`${progress.correctAnswers} / ${progress.totalAttempts} 次`} />
        <StatCard label="累積學習時間" value={`${Math.max(0, Math.round(progress.totalSeconds / 60))} 分`} />
        <StatCard label="使用貼上" value={`${progress.pasteCount} 次`} note="列為輔助紀錄，不算錯誤" />
      </div>
      <section
        className="section-card"
        data-testid="global-vocabulary-progress"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">A1＋A2 canonical lexeme</span>
            <h2>詞彙目標</h2>
          </div>
          <span className="status-pill">總目標 3000</span>
        </div>
        <div className="three-grid">
          <StatCard label="A1＋A2總目標" value="3000" />
          <StatCard label="主動核心目標" value="1500" />
          <StatCard label="延伸辨識目標" value="1500" />
        </div>
        {vocabularyCoverage ? (
          <>
            <div className="three-grid vocabulary-progress-grid">
              <StatCard
                label="目標清單已收錄"
                value={`${vocabularyCoverage.targetEntries} / 3000`}
              />
              <StatCard
                label="正式課程覆蓋"
                value={vocabularyCoverage.curriculumCovered}
              />
              <StatCard
                label="reference-only覆蓋"
                value={vocabularyCoverage.referenceOnlyCovered}
              />
              <StatCard
                label="獨立單字庫新增"
                value={vocabularyCoverage.externalLibraryCovered}
              />
              <StatCard
                label="清單尚未建立"
                value={vocabularyCoverage.missingEntries}
              />
              <StatCard label="接觸過" value={personalVocabulary.exposed} />
              <StatCard label="可以辨認" value={personalVocabulary.receptive} />
              <StatCard
                label="可以主動拼寫及運用"
                value={personalVocabulary.active}
              />
              <StatCard label="待複習" value={globalDueReviews} />
              <StatCard label="已學sense" value={learnedSenseCount} />
              <StatCard label="已接觸chunk" value={touchedChunkCount} />
            </div>
            {(vocabularyTargets?.status === "partial_review_required" ||
              vocabularyTargets?.status === "count_complete_review_required") && (
              <p className="qa-note" data-testid="vocabulary-target-partial-note">
                {vocabularyTargets.status === "count_complete_review_required"
                  ? "3000詞彙清單已完成收錄數量，但內容與來源仍待人工審查。"
                  : "3000詞彙清單仍在分批建置。目前數字代表已整理並納入待審基線的詞彙，尚未全部完成人工內容與來源審查。"}
              </p>
            )}
          </>
        ) : (
          <p className="qa-note" role="status">
            詞彙目標資料暫時無法載入。{vocabularyTargetsError}
          </p>
        )}
      </section>
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
}
