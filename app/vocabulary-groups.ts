import type { AudioStatus } from "./course-data.ts";
import type { LevelLearningProgress } from "./curriculum/progress.ts";
import type { CourseCsvRow } from "./curriculum/types.ts";

export type VocabularyChunkDefinition = {
  id: string;
  text: string;
  translationZhTw: string;
  noteZhTw: string;
  lexemeIds: string[];
  qaStatus: string;
};

export type VocabularyGroupItemDefinition = {
  lexemeId: string;
  order: number;
  chunkIds: string[];
  canonicalTranslationZhTw?: string;
};

type CanonicalCourseVocabulary = {
  lemma?: string;
  answer?: string;
  prompt?: string;
};

export type VocabularyGroupDefinition = {
  id: string;
  titleZhTw: string;
  titleEn: string;
  descriptionZhTw: string;
  order: number;
  minimumLevel: string;
  triggerLexemeIds: string[];
  usageNotesZhTw: string[];
  items: VocabularyGroupItemDefinition[];
};

export type VocabularyGroupsData = {
  schemaVersion: 1;
  chunks: VocabularyChunkDefinition[];
  groups: VocabularyGroupDefinition[];
};

export type ReferenceVocabularyItem = {
  lexemeId: string;
  lemma: string;
  displayEnglish: string;
  translationZhTw: string;
  kkUs: string;
  ipaUs: string;
  usageNoteZhTw: string;
  audioMethod: string;
  audioStatus: AudioStatus;
  audioSource: string;
  license: string;
  minimumLevel: string;
  contentStatus: "reference_only";
  qaStatus: string;
};

export type ReferenceVocabularyData = {
  schemaVersion: 1;
  vocabulary: ReferenceVocabularyItem[];
};

export type ResolvedVocabularyItem = {
  lexemeId: string;
  order: number;
  lemma: string;
  displayEnglish: string;
  translationZhTw: string;
  searchAliases: string[];
  kkUs: string;
  ipaUs: string;
  usageNoteZhTw: string;
  audioMethod: string;
  audioStatus: AudioStatus;
  audioSource: string;
  license: string;
  minimumLevel: string;
  qaStatus: string;
  source: "course" | "reference";
  occurrenceIds: string[];
  chunks: VocabularyChunkDefinition[];
};

export type ResolvedVocabularyGroup = Omit<
  VocabularyGroupDefinition,
  "items"
> & {
  items: ResolvedVocabularyItem[];
};

export type VocabularyDataset = {
  schemaVersion: 1;
  groups: ResolvedVocabularyGroup[];
};

export type VocabularyValidationReport = {
  valid: boolean;
  errors: string[];
};

export type VocabularyLearningStatus =
  | "current"
  | "learned"
  | "review-due"
  | "not-learned";

export type VocabularyLearningState = {
  status: VocabularyLearningStatus;
  isLearned: boolean;
  isReviewDue: boolean;
};

export type VocabularyStatusFilter =
  | "all"
  | "learned"
  | "not-learned"
  | "review-due";

export type VocabularyCourseReturnContext = {
  lessonId: string;
  stage: "detail";
  tokenIndex: number;
};

const DAY_LEXEMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const TIME_LEXEMES = [
  "morning",
  "noon",
  "afternoon",
  "evening",
  "night",
];

const MONTH_LEXEMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const FAMILY_LEXEMES = [
  "family",
  "mother",
  "father",
  "parent",
  "brother",
  "sister",
  "wife",
  "husband",
  "son",
  "daughter",
];

const FORBIDDEN_PROGRESS_KEYS = new Set([
  "progress",
  "attempts",
  "correctAnswers",
  "completedLessonIds",
  "mastery",
  "reviewItems",
]);

const clean = (value: string | undefined) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const courseRowsForLexeme = (
  courseRows: CourseCsvRow[],
  lexemeId: string,
) => courseRows.filter((row) => clean(row.lexeme_id) === clean(lexemeId));

const courseChunkDefinitions = (courseRows: CourseCsvRow[]) => {
  const chunks = new Map<string, VocabularyChunkDefinition>();
  for (const row of courseRows) {
    const id = row.chunk_id?.trim();
    if (!id || chunks.has(id)) continue;
    chunks.set(id, {
      id,
      text: row.chunk_text?.trim() ?? "",
      translationZhTw: row.chunk_translation?.trim() ?? "",
      noteZhTw: row.chunk_note?.trim() ?? "",
      lexemeIds: courseRows
        .filter((candidate) => candidate.chunk_id?.trim() === id)
        .map((candidate) => candidate.lexeme_id?.trim())
        .filter((value): value is string => Boolean(value)),
      qaStatus: row.qa_status?.trim() ?? "",
    });
  }
  return chunks;
};

const uniqueSearchAliases = (values: Array<string | undefined>) =>
  Array.from(
    new Set(
      values
        .map((value) => value?.trim() ?? "")
        .filter(Boolean),
    ),
  );

const canonicalTranslationAlternatives = (value: string) =>
  value
    .split(/[／/、]/)
    .map((part) => part.trim())
    .filter(Boolean);

const chunkTranslationAliases = (
  translationZhTw: string,
  canonicalTranslationZhTw: string,
) => {
  const alternatives = canonicalTranslationAlternatives(
    canonicalTranslationZhTw,
  );
  const matchedAlternative = alternatives.find((alternative) =>
    translationZhTw.includes(alternative),
  );
  if (!matchedAlternative || alternatives.length < 2) {
    return [translationZhTw];
  }
  const matchedIndex = translationZhTw.indexOf(matchedAlternative);
  const prefix = translationZhTw.slice(0, matchedIndex);
  const suffix = translationZhTw.slice(
    matchedIndex + matchedAlternative.length,
  );
  return [
    translationZhTw,
    ...alternatives.map(
      (alternative) => `${prefix}${alternative}${suffix}`,
    ),
  ];
};

const buildVocabularySearchAliases = ({
  canonical,
  formalRows,
  aliasRows,
  chunks,
}: {
  canonical: ReturnType<typeof resolveCanonicalVocabularyDisplay>;
  formalRows: CourseCsvRow[];
  aliasRows: CourseCsvRow[];
  chunks: VocabularyChunkDefinition[];
}) =>
  uniqueSearchAliases([
    canonical.lemma,
    canonical.displayEnglish,
    canonical.translationZhTw,
    ...formalRows.flatMap((row) => [
      row.answer,
      row.lemma,
      row.prompt,
      row.chunk_text,
      row.chunk_translation,
    ]),
    ...aliasRows.flatMap((row) => [
      row.answer,
      row.lemma,
      row.prompt,
      row.chunk_text,
      row.chunk_translation,
    ]),
    ...chunks.flatMap((item) => [
      item.text,
      ...chunkTranslationAliases(
        item.translationZhTw,
        canonical.translationZhTw,
      ),
    ]),
  ]);

const findForbiddenProgressKey = (
  value: unknown,
  path = "groups",
): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const match = findForbiddenProgressKey(value[index], `${path}[${index}]`);
      if (match) return match;
    }
    return undefined;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_PROGRESS_KEYS.has(key)) return `${path}.${key}`;
    const match = findForbiddenProgressKey(child, `${path}.${key}`);
    if (match) return match;
  }
  return undefined;
};

const sameSequence = (actual: string[], expected: string[]) =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index]);

export const resolveCanonicalVocabularyDisplay = (
  item: Pick<
    VocabularyGroupItemDefinition,
    "lexemeId" | "canonicalTranslationZhTw"
  >,
  formal: CanonicalCourseVocabulary | undefined,
  reference:
    | Pick<
        ReferenceVocabularyItem,
        "lemma" | "displayEnglish" | "translationZhTw"
      >
    | undefined,
) => {
  const lemma = (
    formal?.lemma ||
    reference?.lemma ||
    formal?.answer ||
    reference?.displayEnglish ||
    item.lexemeId
  ).trim();
  return {
    lemma,
    displayEnglish: lemma,
    translationZhTw:
      item.canonicalTranslationZhTw?.trim() ||
      formal?.prompt?.trim() ||
      reference?.translationZhTw?.trim() ||
      "",
  };
};

export const validateVocabularyData = (
  groupData: VocabularyGroupsData,
  referenceData: ReferenceVocabularyData,
  courseRows: CourseCsvRow[],
): VocabularyValidationReport => {
  const errors: string[] = [];
  if (groupData?.schemaVersion !== 1 || !Array.isArray(groupData.groups)) {
    return {
      valid: false,
      errors: ["相關字詞主題資料格式不正確。"],
    };
  }
  if (
    referenceData?.schemaVersion !== 1 ||
    !Array.isArray(referenceData.vocabulary)
  ) {
    return {
      valid: false,
      errors: ["參考詞彙資料格式不正確。"],
    };
  }

  const forbiddenKey = findForbiddenProgressKey(groupData);
  if (forbiddenKey) {
    errors.push(`相關字詞資料不可保存學習進度：${forbiddenKey}`);
  }

  const groupIds = new Set<string>();
  const groupOrders = new Set<number>();
  const referenceByLexeme = new Map<string, ReferenceVocabularyItem>();
  const referenceIds = new Set<string>();
  const courseLexemeIds = new Set(
    courseRows.map((row) => clean(row.lexeme_id)).filter(Boolean),
  );
  const courseChunks = courseChunkDefinitions(courseRows);
  const groupChunks = new Map<string, VocabularyChunkDefinition>();

  for (const chunk of groupData.chunks ?? []) {
    if (!chunk.id?.trim() || groupChunks.has(chunk.id)) {
      errors.push(`相關語塊 ID 空白或重複：${chunk.id || "（空白）"}`);
      continue;
    }
    groupChunks.set(chunk.id, chunk);
    if (
      !chunk.text?.trim() ||
      !chunk.translationZhTw?.trim() ||
      !chunk.qaStatus?.trim()
    ) {
      errors.push(`相關語塊 ${chunk.id} 的英文、中文或 QA 狀態不可空白。`);
    }
  }

  for (const reference of referenceData.vocabulary) {
    const id = clean(reference.lexemeId);
    if (!id || referenceIds.has(id)) {
      errors.push(`參考詞彙 lexemeId 空白或重複：${reference.lexemeId || "（空白）"}`);
      continue;
    }
    referenceIds.add(id);
    referenceByLexeme.set(id, reference);
    if (!reference.displayEnglish?.trim() || !reference.translationZhTw?.trim()) {
      errors.push(`參考詞彙 ${reference.lexemeId} 的英文或中文不可空白。`);
    }
    if (!reference.kkUs?.trim() && !reference.ipaUs?.trim()) {
      errors.push(`參考詞彙 ${reference.lexemeId} 至少需要 KK 或 IPA。`);
    }
    if (!reference.qaStatus?.trim()) {
      errors.push(`參考詞彙 ${reference.lexemeId} 缺少 qaStatus。`);
    }
    if (
      reference.contentStatus !== "reference_only" ||
      ["ready", "production", "production_ready"].includes(
        clean(reference.qaStatus),
      )
    ) {
      errors.push(`參考詞彙 ${reference.lexemeId} 不可標成正式課程內容。`);
    }

    const formalRows = courseRowsForLexeme(courseRows, reference.lexemeId);
    if (formalRows.length) {
      const formal = formalRows[0];
      if (
        clean(formal.lemma || formal.answer) !== clean(reference.lemma) ||
        clean(formal.answer || formal.lemma) !==
          clean(reference.displayEnglish) ||
        clean(formal.prompt) !== clean(reference.translationZhTw)
      ) {
        errors.push(`正式課程與 reference 詞彙 ${reference.lexemeId} 有明顯衝突。`);
      }
    }
  }

  for (const group of groupData.groups) {
    if (!group.id?.trim() || groupIds.has(group.id)) {
      errors.push(`group ID 空白或重複：${group.id || "（空白）"}`);
    }
    groupIds.add(group.id);
    if (!Number.isInteger(group.order) || group.order < 1) {
      errors.push(`主題 ${group.id} 的 order 必須是正整數。`);
    }
    if (groupOrders.has(group.order)) {
      errors.push(`主題 order 不可重複：${group.order}`);
    }
    groupOrders.add(group.order);
    if (
      !group.titleZhTw?.trim() ||
      !group.titleEn?.trim() ||
      !group.descriptionZhTw?.trim()
    ) {
      errors.push(`主題 ${group.id} 的中英文標題與說明不可空白。`);
    }

    const itemIds = group.items.map((item) => clean(item.lexemeId));
    const duplicateItems = itemIds.filter(
      (id, index) => itemIds.indexOf(id) !== index,
    );
    if (duplicateItems.length) {
      errors.push(`主題 ${group.id} 有重複詞彙：${duplicateItems.join("、")}`);
    }
    const sortedOrders = group.items
      .map((item) => item.order)
      .sort((left, right) => left - right);
    if (
      sortedOrders.some((order, index) => order !== index + 1)
    ) {
      errors.push(`主題 ${group.id} 的 item order 必須從 1 連續排列。`);
    }
    for (const trigger of group.triggerLexemeIds) {
      if (!itemIds.includes(clean(trigger))) {
        errors.push(`主題 ${group.id} 的 triggerLexemeId ${trigger} 不存在於 items。`);
      }
    }
    for (const item of group.items) {
      const lexemeId = clean(item.lexemeId);
      const formalRows = courseRowsForLexeme(courseRows, lexemeId);
      const reference = referenceByLexeme.get(lexemeId);
      const formal = formalRows[0];
      if (!formalRows.length && !reference) {
        errors.push(`主題 ${group.id} 的詞彙 ${item.lexemeId} 無法解析。`);
      }
      if (
        "canonicalTranslationZhTw" in item &&
        !item.canonicalTranslationZhTw?.trim()
      ) {
        errors.push(
          `詞彙 ${item.lexemeId} 的 canonicalTranslationZhTw 不可空白。`,
        );
      }
      for (const chunkId of item.chunkIds) {
        if (!courseChunks.has(chunkId) && !groupChunks.has(chunkId)) {
          errors.push(`主題 ${group.id} 的語塊 ${chunkId} 不存在。`);
        }
      }
      const canonical = resolveCanonicalVocabularyDisplay(
        item,
        formal,
        reference,
      );
      const english = canonical.displayEnglish;
      const chinese = canonical.translationZhTw;
      const kk = formal?.kk_us || formal?.kk || reference?.kkUs;
      const ipa =
        formal?.ipa_standalone ||
        formal?.ipa_us ||
        formal?.ipa ||
        reference?.ipaUs;
      const qaStatus = formal?.qa_status || reference?.qaStatus;
      if (!english?.trim() || !chinese?.trim()) {
        errors.push(`詞彙 ${item.lexemeId} 的英文或中文不可空白。`);
      }
      if (!kk?.trim() && !ipa?.trim()) {
        errors.push(`詞彙 ${item.lexemeId} 至少需要 KK 或 IPA。`);
      }
      if (!qaStatus?.trim()) {
        errors.push(`詞彙 ${item.lexemeId} 缺少 qaStatus。`);
      }
    }

    if (
      group.id === "days-of-week" &&
      !sameSequence(itemIds, DAY_LEXEMES)
    ) {
      errors.push("星期主題必須依 Monday 到 Sunday 排列。");
    }
    if (
      group.id === "times-of-day" &&
      !sameSequence(itemIds, TIME_LEXEMES)
    ) {
      errors.push("一天的時段必須依 morning 到 night 排列。");
    }
    if (
      group.id === "months-of-year" &&
      !sameSequence(itemIds, MONTH_LEXEMES)
    ) {
      errors.push("月份主題必須依 January 到 December 排列。");
    }
    if (
      group.id === "family-members" &&
      !sameSequence(itemIds, FAMILY_LEXEMES)
    ) {
      errors.push("家庭成員主題的詞彙順序不正確。");
    }
  }

  for (const lexemeId of referenceIds) {
    if (courseLexemeIds.has(lexemeId)) {
      continue;
    }
    if (
      !groupData.groups.some((group) =>
        group.items.some((item) => clean(item.lexemeId) === lexemeId),
      )
    ) {
      errors.push(`reference 詞彙 ${lexemeId} 未被任何主題使用。`);
    }
  }

  return { valid: errors.length === 0, errors };
};

export const buildVocabularyDataset = (
  groupData: VocabularyGroupsData,
  referenceData: ReferenceVocabularyData,
  courseRows: CourseCsvRow[],
  aliasCourseRows: CourseCsvRow[] = [],
): VocabularyDataset => {
  const report = validateVocabularyData(groupData, referenceData, courseRows);
  if (!report.valid) {
    throw new Error(
      `相關字詞資料驗證失敗：\n${report.errors.join("\n")}`,
    );
  }
  const references = new Map(
    referenceData.vocabulary.map((item) => [clean(item.lexemeId), item]),
  );
  const courseChunks = courseChunkDefinitions(courseRows);
  const groupChunks = new Map(
    groupData.chunks.map((chunk) => [chunk.id, chunk]),
  );

  return {
    schemaVersion: 1,
    groups: [...groupData.groups]
      .sort((left, right) => left.order - right.order)
      .map((group) => ({
        ...group,
        items: [...group.items]
          .sort((left, right) => left.order - right.order)
          .map((item) => {
            const formalRows = courseRowsForLexeme(
              courseRows,
              item.lexemeId,
            );
            const formal = formalRows[0];
            const reference = references.get(clean(item.lexemeId));
            const source = formal ? "course" : "reference";
            const canonical = resolveCanonicalVocabularyDisplay(
              item,
              formal,
              reference,
            );
            const chunks = item.chunkIds.map(
              (chunkId) =>
                courseChunks.get(chunkId) ??
                groupChunks.get(chunkId)!,
            );
            const aliasRows = courseRowsForLexeme(
              aliasCourseRows,
              item.lexemeId,
            );
            return {
              lexemeId: item.lexemeId,
              order: item.order,
              lemma: canonical.lemma,
              displayEnglish: canonical.displayEnglish,
              translationZhTw: canonical.translationZhTw,
              searchAliases: buildVocabularySearchAliases({
                canonical,
                formalRows,
                aliasRows,
                chunks,
              }),
              kkUs: formal
                ? formal.kk_us || formal.kk || ""
                : reference?.kkUs || "",
              ipaUs: formal
                ? formal.ipa_standalone ||
                  formal.ipa_us ||
                  formal.ipa ||
                  ""
                : reference?.ipaUs || "",
              usageNoteZhTw: formal
                ? formal.note || ""
                : reference?.usageNoteZhTw || "",
              audioMethod: formal
                ? formal.audio_method || ""
                : reference?.audioMethod || "",
              audioStatus: (formal
                ? formal.audio_status || "pending"
                : reference?.audioStatus || "pending") as AudioStatus,
              audioSource: formal
                ? formal.word_audio_source ||
                  formal.audio_source ||
                  ""
                : reference?.audioSource || "",
              license: formal
                ? formal.license || ""
                : reference?.license || "",
              minimumLevel: group.minimumLevel,
              qaStatus: formal
                ? formal.qa_status || ""
                : reference?.qaStatus || "",
              source,
              occurrenceIds: formalRows
                .map((row) => row.occurrence_id?.trim())
                .filter((value): value is string => Boolean(value)),
              chunks,
            };
          }),
      })),
  };
};

export const loadVocabularyDataset = async (
  courseRows: CourseCsvRow[],
  fetcher: typeof fetch = fetch,
  aliasCourseRows: CourseCsvRow[] = [],
): Promise<VocabularyDataset> => {
  const [groupsResponse, referenceResponse] = await Promise.all([
    fetcher("/data/vocabulary-groups-v1.json"),
    fetcher("/data/reference-vocabulary-v1.json"),
  ]);
  if (!groupsResponse.ok || !referenceResponse.ok) {
    throw new Error("相關字詞資料暫時無法載入。");
  }
  return buildVocabularyDataset(
    (await groupsResponse.json()) as VocabularyGroupsData,
    (await referenceResponse.json()) as ReferenceVocabularyData,
    courseRows,
    aliasCourseRows,
  );
};

export const vocabularyGroupForLexeme = (
  dataset: VocabularyDataset | null,
  lexemeId: string | undefined,
) =>
  dataset?.groups.find((group) =>
    group.triggerLexemeIds.some(
      (trigger) => clean(trigger) === clean(lexemeId),
    ),
  );

export const canShowVocabularyShortcut = (
  dataset: VocabularyDataset | null,
  lexemeId: string | undefined,
  stage: string,
  answerCorrect: boolean,
) =>
  answerCorrect &&
  stage === "detail" &&
  Boolean(vocabularyGroupForLexeme(dataset, lexemeId));

export const createVocabularyCourseReturnContext = (
  lessonId: string,
  tokenIndex: number,
): VocabularyCourseReturnContext => ({
  lessonId,
  stage: "detail",
  tokenIndex,
});

export const normalizeVocabularySearch = (value: string) => clean(value);

export const vocabularyItemMatchesSearch = (
  group: ResolvedVocabularyGroup,
  item: ResolvedVocabularyItem,
  query: string,
) => {
  const normalized = normalizeVocabularySearch(query);
  if (!normalized) return true;
  return [
    group.titleZhTw,
    group.titleEn,
    item.displayEnglish,
    item.translationZhTw,
    item.lexemeId,
    ...item.searchAliases,
  ].some((value) => clean(value).includes(normalized));
};

export const resolveVocabularyGroupSelection = (
  groups: ResolvedVocabularyGroup[],
  activeGroupId: string,
  itemIsVisible: (
    group: ResolvedVocabularyGroup,
    item: ResolvedVocabularyItem,
  ) => boolean,
) => {
  const visibleGroups = groups.filter((group) =>
    group.items.some((item) => itemIsVisible(group, item)),
  );
  const activeGroup =
    visibleGroups.find((group) => group.id === activeGroupId) ??
    visibleGroups[0] ??
    null;
  return { visibleGroups, activeGroup };
};

export const vocabularyLearningState = (
  item: Pick<ResolvedVocabularyItem, "lexemeId" | "occurrenceIds">,
  progress: Pick<LevelLearningProgress, "lexemeProgress" | "reviewItems">,
  currentLexemeId?: string,
  now = new Date(),
): VocabularyLearningState => {
  const isLearned = Boolean(
    progress.lexemeProgress[item.lexemeId]?.completedLessonIds.length,
  );
  const occurrenceIds = new Set(item.occurrenceIds);
  const isReviewDue = Object.entries(progress.reviewItems).some(
    ([occurrenceId, review]) =>
      (occurrenceIds.has(occurrenceId) ||
        occurrenceIds.has(review.tokenId)) &&
      new Date(review.dueAt).getTime() <= now.getTime(),
  );
  const isCurrent = clean(item.lexemeId) === clean(currentLexemeId);
  return {
    isLearned,
    isReviewDue,
    status: isCurrent
      ? "current"
      : isReviewDue
        ? "review-due"
        : isLearned
          ? "learned"
          : "not-learned",
  };
};

export const vocabularyStatusMatchesFilter = (
  state: VocabularyLearningState,
  filter: VocabularyStatusFilter,
) => {
  if (filter === "all") return true;
  if (filter === "learned") return state.isLearned;
  if (filter === "review-due") return state.isReviewDue;
  return !state.isLearned && !state.isReviewDue;
};
