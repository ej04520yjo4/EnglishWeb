import type * as React from "react";
import { vocabularyFilters, vocabularyStatusLabels } from "../home-model";
import { localDateKey } from "../local-date";
import { buildReferenceRecognitionQueue } from "../reference-vocabulary-practice";
import {
  resolveVocabularyGroupSelection,
  vocabularyItemMatchesSearch,
  vocabularyLearningState,
  vocabularyStatusMatchesFilter,
} from "../vocabulary-groups";
import { deriveVocabularyMasteryState } from "../vocabulary-progress";
import type { MultiLevelProgress } from "../curriculum/progress";
import type { Screen, SettingsState } from "../home-model";
import type { ReferenceRecognitionQuestion } from "../reference-vocabulary-practice";
import type {
  ResolvedVocabularyGroup,
  ResolvedVocabularyItem,
  VocabularyCourseReturnContext,
  VocabularyDataset,
  VocabularyStatusFilter,
} from "../vocabulary-groups";
import type { VocabularyTargetsData } from "../vocabulary-targets";

export type RelatedVocabularyScreenProps = {
  activeVocabularyGroupId: string;
  audioMessage: string;
  loaded: boolean;
  multiProgress: MultiLevelProgress;
  openedVocabularyLexemeId: string;
  openVocabularyItem: (groupId: string, item: ResolvedVocabularyItem) => void;
  playRelatedVocabularyAudio: (item: ResolvedVocabularyItem, rate?: number) => void;
  progressStorageWritable: boolean;
  relatedCurrentLexemeId: string;
  returnFromRelatedVocabulary: () => void;
  searchableVocabularyDataset: VocabularyDataset | null;
  selectVocabularyGroup: (groupId: string, lexemeId?: string) => void;
  setReferenceRecognitionSession: React.Dispatch<React.SetStateAction<{ title: string; questions: ReferenceRecognitionQuestion[]; } | null>>;
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  settings: SettingsState;
  setVocabularyFilter: React.Dispatch<React.SetStateAction<VocabularyStatusFilter>>;
  setVocabularySearch: React.Dispatch<React.SetStateAction<string>>;
  speechSupported: boolean;
  vocabularyDataset: VocabularyDataset | null;
  vocabularyDataStatus: "loading" | "ready" | "error";
  vocabularyFilter: VocabularyStatusFilter;
  vocabularyLoadError: string;
  vocabularyReturnContext: VocabularyCourseReturnContext | null;
  vocabularySearch: string;
  vocabularyTargets: VocabularyTargetsData | null;
};

export function RelatedVocabularyScreen({
  activeVocabularyGroupId,
  audioMessage,
  loaded,
  multiProgress,
  openedVocabularyLexemeId,
  openVocabularyItem,
  playRelatedVocabularyAudio,
  progressStorageWritable,
  relatedCurrentLexemeId,
  returnFromRelatedVocabulary,
  searchableVocabularyDataset,
  selectVocabularyGroup,
  setReferenceRecognitionSession,
  setScreen,
  settings,
  setVocabularyFilter,
  setVocabularySearch,
  speechSupported,
  vocabularyDataset,
  vocabularyDataStatus,
  vocabularyFilter,
  vocabularyLoadError,
  vocabularyReturnContext,
  vocabularySearch,
  vocabularyTargets,
}: RelatedVocabularyScreenProps) {

    if (vocabularyDataStatus === "loading") {
      return (
        <section
          className="section-card vocabulary-load-state"
          data-testid="vocabulary-loading"
        >
          <strong>正在載入相關字詞…</strong>
          <p>課程仍可正常使用，請稍候一秒。</p>
        </section>
      );
    }
    if (vocabularyDataStatus === "error" || !vocabularyDataset || !searchableVocabularyDataset) {
      return (
        <section
          className="section-card vocabulary-load-state"
          data-testid="vocabulary-load-error"
        >
          <strong>相關字詞目前無法載入</strong>
          <p>這不會影響正式課程，請重新整理後再試。</p>
          {vocabularyLoadError && <small>{vocabularyLoadError}</small>}
          <button
            className="secondary-button"
            onClick={() => setScreen("home")}
          >
            返回首頁
          </button>
        </section>
      );
    }

    const a1Progress = multiProgress.levelProgress.A1;
    const stateForItem = (item: ResolvedVocabularyItem) =>
      vocabularyLearningState(
        item,
        a1Progress,
        relatedCurrentLexemeId,
      );
    const itemIsVisible = (
      group: ResolvedVocabularyGroup,
      item: ResolvedVocabularyItem,
      query = vocabularySearch,
      filter = vocabularyFilter,
    ) =>
      vocabularyItemMatchesSearch(group, item, query) &&
      vocabularyStatusMatchesFilter(
        stateForItem(item),
        filter,
      );
    const resolveSelection = (
      query: string,
      filter: VocabularyStatusFilter,
      activeGroupId = activeVocabularyGroupId,
    ) =>
      resolveVocabularyGroupSelection(
        searchableVocabularyDataset.groups,
        activeGroupId,
        (group, item) => itemIsVisible(group, item, query, filter),
      );
    const { visibleGroups, activeGroup } = resolveSelection(
      vocabularySearch,
      vocabularyFilter,
    );
    const activeItems = activeGroup
      ? activeGroup.items.filter((item) =>
          itemIsVisible(activeGroup, item),
        )
      : [];
    const matchingItemCount = visibleGroups.reduce(
      (count, group) => count + group.items.filter((item) => itemIsVisible(group, item)).length,
      0,
    );
    const referenceQueue = activeGroup && vocabularyTargets
      ? buildReferenceRecognitionQueue({
          dataset: vocabularyDataset,
          targets: vocabularyTargets,
          progress: multiProgress.vocabularyProgress,
          groupId: activeGroup.id,
          studyDate: localDateKey(),
        })
      : [];
    const updateVocabularySearch = (query: string) => {
      setVocabularySearch(query);
      const nextGroup = resolveSelection(
        query,
        vocabularyFilter,
      ).activeGroup;
      if (
        nextGroup &&
        nextGroup.id !== activeVocabularyGroupId
      ) {
        selectVocabularyGroup(nextGroup.id);
      }
    };
    const updateVocabularyFilter = (
      filter: VocabularyStatusFilter,
    ) => {
      setVocabularyFilter(filter);
      const nextGroup = resolveSelection(
        vocabularySearch,
        filter,
      ).activeGroup;
      if (
        nextGroup &&
        nextGroup.id !== activeVocabularyGroupId
      ) {
        selectVocabularyGroup(nextGroup.id);
      }
    };

    return (
      <div
        className="page-stack related-vocabulary-page"
        data-testid="related-vocabulary-page"
      >
        <section className="page-title related-vocabulary-title">
          <div>
            <span className="eyebrow">依主題建立單字連結</span>
            <h1>相關字詞</h1>
            <p>把同類型的英文放在一起理解，建立單字之間的關聯。</p>
          </div>
          {vocabularyReturnContext && (
            <button
              className="secondary-button"
              onClick={returnFromRelatedVocabulary}
              data-testid="return-to-current-lesson"
            >
              ← 返回目前課程
            </button>
          )}
        </section>

        <section className="vocabulary-tools" aria-label="搜尋與篩選相關字詞">
          <label className="vocabulary-search">
            <span>搜尋字詞或主題</span>
            <input
              type="search"
              value={vocabularySearch}
              onChange={(event) =>
                updateVocabularySearch(event.target.value)
              }
              placeholder="例如：Saturday、星期六"
              aria-label="搜尋英文、中文、主題名稱或 lexeme ID"
              aria-controls="vocabulary-search-results"
              aria-describedby="vocabulary-search-summary"
            />
          </label>
          <div
            className="vocabulary-filter-row"
            role="group"
            aria-label="已學狀態篩選"
          >
            {vocabularyFilters.map((filter) => (
              <button
                key={filter.id}
                className={
                  vocabularyFilter === filter.id ? "active" : ""
                }
                aria-pressed={vocabularyFilter === filter.id}
                onClick={() => updateVocabularyFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <p
          id="vocabulary-search-summary"
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-testid="vocabulary-search-summary"
        >
          {activeGroup
            ? `找到 ${visibleGroups.length} 個主題、${matchingItemCount} 個符合的字詞。目前顯示${activeGroup.titleZhTw}：${activeItems.length} 個字詞。`
            : "找不到相關字詞，請調整搜尋文字或已學狀態篩選。"}
        </p>

        <section id="vocabulary-search-results" aria-labelledby="vocabulary-groups-title">
          <div className="section-heading vocabulary-section-heading">
            <div>
              <span className="eyebrow">主題分類</span>
              <h2 id="vocabulary-groups-title">選擇主題</h2>
            </div>
            <small>目前收錄 {vocabularyDataset.groups.length} 個主題</small>
          </div>
          <div
            className="vocabulary-group-grid"
            data-testid="vocabulary-group-grid"
          >
            {visibleGroups.map((group) => {
              const learnedCount = group.items.filter(
                (item) => stateForItem(item).isLearned,
              ).length;
              return (
                <button
                  className={`vocabulary-group-card ${
                    activeGroup?.id === group.id ? "active" : ""
                  }`}
                  key={group.id}
                  onClick={() => selectVocabularyGroup(group.id)}
                  aria-label={`進入${group.titleZhTw}主題`}
                  aria-pressed={activeGroup?.id === group.id}
                  aria-describedby={`vocabulary-group-info-${group.id}`}
                  data-testid={`vocabulary-group-${group.id}`}
                >
                  <span className="vocabulary-group-icon">▦</span>
                  <span className="vocabulary-group-copy">
                    <strong>{group.titleZhTw}</strong>
                    <b>{group.titleEn}</b>
                    <small>{group.descriptionZhTw}</small>
                  </span>
                  <span className="vocabulary-group-counts" id={`vocabulary-group-info-${group.id}`}>
                    <b>{group.items.length} 個字詞</b>
                    <small>已學 {learnedCount} 個</small>
                  </span>
                  <span className="vocabulary-group-action">
                    進入主題 →
                  </span>
                </button>
              );
            })}
          </div>
          {!visibleGroups.length && (
            <div
              className="section-card vocabulary-load-state"
              data-testid="vocabulary-global-empty"
            >
              <strong>找不到相關字詞</strong>
              <p>請調整搜尋文字或已學狀態篩選。</p>
            </div>
          )}
        </section>

        {activeGroup && (
          <section
            className="section-card vocabulary-topic-detail"
            aria-labelledby="vocabulary-topic-title"
            data-testid={`vocabulary-topic-${activeGroup.id}`}
          >
          <div className="vocabulary-topic-heading">
            <div>
              <span className="vocabulary-breadcrumb">
                相關字詞 &gt; {activeGroup.titleZhTw}
              </span>
              <h2 id="vocabulary-topic-title">
                {activeGroup.titleZhTw}
              </h2>
              <p>{activeGroup.titleEn}</p>
            </div>
            <span className="status-pill">
              {activeGroup.items.length} 個字詞
            </span>
          </div>

          <div className="reference-practice-entry">
            <p>延伸單字也能練習辨認。每輪最多 5 字，跨日答對才累積熟悉度；不影響正式課程進度。</p>
            <button className="primary-button" data-testid="start-reference-recognition"
              disabled={!loaded || !progressStorageWritable || referenceQueue.length === 0}
              onClick={() => {
                setReferenceRecognitionSession({ title: activeGroup.titleZhTw, questions: referenceQueue });
                setScreen("reference-recognition");
              }}>
              練習延伸單字辨認
            </button>
            <small role="status">
              {!loaded || !progressStorageWritable
                ? "本機進度尚未就緒或處於保護模式，暫時無法開始辨認練習。"
                : !vocabularyTargets
                ? "詞彙目標尚未載入，辨認練習暫時無法開始。"
                : referenceQueue.length > 0
                  ? `本輪 ${referenceQueue.length} 字（依整個主題安排，不受搜尋篩選影響）。內容仍待人工複核。`
                  : "本主題今天沒有尚未作答的延伸單字；可換個主題，或隔天再來練習。"}
            </small>
          </div>

          <div
            className="vocabulary-word-list"
            data-testid="vocabulary-word-list"
          >
            {activeItems.map((item) => {
              const state = stateForItem(item);
              const audioAvailable =
                speechSupported ||
                (item.audioStatus === "ready" &&
                  Boolean(item.audioSource.trim()));
              return (
                <article
                  id={`related-word-${item.lexemeId}`}
                  className={`vocabulary-word-card ${
                    state.status === "current" ? "current" : ""
                  }`}
                  key={item.lexemeId}
                  data-testid={`vocabulary-word-${item.lexemeId}`}
                  tabIndex={-1}
                  aria-labelledby={`vocabulary-word-title-${item.lexemeId}`}
                  aria-current={
                    state.status === "current" ? "true" : undefined
                  }
                >
                  <div className="vocabulary-word-top">
                    <div>
                      <span className="vocabulary-item-order">
                        {item.order}
                      </span>
                      <div>
                        <h3 id={`vocabulary-word-title-${item.lexemeId}`} lang="en-US">{item.displayEnglish}</h3>
                        <p>{item.translationZhTw}</p>
                        {item.source === "reference" &&
                          multiProgress.vocabularyProgress[item.lexemeId]?.recognitionAttemptEvidenceIds.length > 0 && (
                          <small data-testid={`reference-mastery-${item.lexemeId}`}>
                            {deriveVocabularyMasteryState(multiProgress.vocabularyProgress[item.lexemeId]) === "receptive"
                              ? "詞彙辨認：已跨日答對，可繼續複習"
                              : "詞彙辨認：練習中，需不同日期答對兩次"}
                          </small>
                        )}
                      </div>
                    </div>
                    <span
                      className={`vocabulary-status ${state.status}`}
                    >
                      {vocabularyStatusLabels[state.status]}
                    </span>
                  </div>
                  <button
                    className="secondary-button vocabulary-detail-toggle"
                    type="button"
                    data-testid={`open-vocabulary-${item.lexemeId}`}
                    aria-expanded={openedVocabularyLexemeId === item.lexemeId}
                    aria-controls={`vocabulary-detail-${item.lexemeId}`}
                    aria-label={`${openedVocabularyLexemeId === item.lexemeId ? "收合字詞詳情" : "開啟字詞詳情"}：${item.displayEnglish}`}
                    onClick={() => openVocabularyItem(activeGroup.id, item)}
                  >
                    {openedVocabularyLexemeId === item.lexemeId
                      ? "收合字詞詳情"
                      : "開啟字詞詳情"}
                  </button>
                    <div
                      id={`vocabulary-detail-${item.lexemeId}`}
                      data-testid={`vocabulary-detail-${item.lexemeId}`}
                      role="region"
                      aria-labelledby={`vocabulary-word-title-${item.lexemeId}`}
                      hidden={openedVocabularyLexemeId !== item.lexemeId}
                    >
                  <div className="vocabulary-phonetics">
                    <span>
                      <small>KK</small>
                      <strong>{item.kkUs || "待補"}</strong>
                    </span>
                    <span>
                      <small>IPA</small>
                      <strong>{item.ipaUs || "待補"}</strong>
                    </span>
                    <span>
                      <small>資料來源</small>
                      <strong>
                        {item.source === "course"
                          ? "正式課程"
                          : "參考詞彙"}
                      </strong>
                    </span>
                  </div>
                  <div className="vocabulary-audio-actions">
                    <button
                      disabled={!audioAvailable}
                      onClick={() =>
                        playRelatedVocabularyAudio(item)
                      }
                      aria-label={`正常播放 ${item.displayEnglish} 的美式發音`}
                    >
                      ▶ 正常
                    </button>
                    <button
                      disabled={!audioAvailable}
                      onClick={() =>
                        playRelatedVocabularyAudio(
                          item,
                          settings.slowRate,
                        )
                      }
                      aria-label={`慢速播放 ${item.displayEnglish} 的美式發音`}
                    >
                      ◁ 慢速
                    </button>
                    <small>
                      {item.audioStatus === "ready" &&
                      item.audioSource.trim()
                        ? "使用已確認音訊"
                        : "使用瀏覽器語音備援"}
                    </small>
                  </div>
                  {item.chunks.length > 0 && (
                    <div className="vocabulary-chunks">
                      <small>常見語塊</small>
                      {item.chunks.map((chunk) => (
                        <div key={chunk.id}>
                          <strong>
                            {chunk.text}＝{chunk.translationZhTw}
                          </strong>
                          <span>{chunk.noteZhTw}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.usageNoteZhTw && (
                    <p className="vocabulary-item-note">
                      <strong>用法提醒</strong>
                      {item.usageNoteZhTw}
                    </p>
                  )}
                    </div>
                </article>
              );
            })}
            {!activeItems.length && (
              <p className="vocabulary-empty">
                這個主題中沒有符合目前條件的字詞。
              </p>
            )}
          </div>

          <div className="vocabulary-usage-notes">
            <strong>用法提醒</strong>
            <ul>
              {activeGroup.usageNotesZhTw.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
          <p className="vocabulary-audio-message" aria-live="polite">
            {audioMessage ||
              "尚未有已確認音檔時，播放按鈕會使用瀏覽器美式語音備援。"}
          </p>
          </section>
        )}
      </div>
    );
}
