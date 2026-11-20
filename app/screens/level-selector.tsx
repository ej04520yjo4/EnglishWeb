import {
  catalogEntryForLevel,
  runtimeCatalogEntries,
} from "../curriculum/catalog";
import { canAccessLevel } from "../curriculum/progress";
import { CEFR_LEVELS } from "../curriculum/types";
import type { MultiLevelProgress } from "../curriculum/progress";
import type { CurriculumCatalog, CefrLevel } from "../curriculum/types";
import type { SettingsState } from "../home-model";

export type LevelSelectorProps = {
  catalog: CurriculumCatalog | null;
  levelSummary: (level: CefrLevel) => { unitCount: number; completed: number; total: number; accuracy: number; dueCount: number; status: string; };
  multiProgress: MultiLevelProgress;
  selectedLevel: CefrLevel;
  settings: SettingsState;
  switchLevel: (level: CefrLevel) => void;
};

export function LevelSelector({
  catalog,
  levelSummary,
  multiProgress,
  selectedLevel,
  settings,
  switchLevel,
}: LevelSelectorProps) {
  return (
    <section className="level-selector" aria-label="CEFR 程度選擇">
      {(catalog
        ? runtimeCatalogEntries(catalog).map((entry) => entry.level)
        : CEFR_LEVELS.filter((level) => level === "A1" || level === "A2")
      ).map((level) => {
        const summary = levelSummary(level);
        const entry = catalog
          ? catalogEntryForLevel(catalog, level)
          : null;
        const statusLabel =
          entry?.status === "production" ? "正式課程" : "試行課程";
        const locked = !canAccessLevel(
          level,
          multiProgress.passedLevelIds,
          settings.showAdvancedPilots,
          entry?.status,
        );
        return (
          <button
            key={level}
            className={`level-selector-button ${
              selectedLevel === level ? "active" : ""
            } ${locked ? "locked" : ""}`}
            type="button"
            data-testid={`level-selector-${level.toLowerCase()}`}
            aria-pressed={selectedLevel === level}
            aria-label={`${level} ${statusLabel}${
              locked ? "，尚未解鎖" : ""
            }`}
            onClick={() => switchLevel(level)}
          >
            <span>
              <strong>{level}</strong>
              <small>{statusLabel}</small>
            </span>
            <span className="level-selector-summary">
              {summary.completed}/{summary.total} 課・正確率{" "}
              {summary.accuracy}%・待複習 {summary.dueCount}
            </span>
            <span className="status-pill">
              {locked ? "鎖定" : summary.status}
            </span>
          </button>
        );
      })}
    </section>
  );
}
