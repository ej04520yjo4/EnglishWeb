import type { CourseCsvRow, CefrLevel } from "./curriculum/types.ts";

export type VocabularyMasteryTarget = "active" | "receptive";
export type VocabularyTargetLevel = Extract<CefrLevel, "A1" | "A2">;

export type VocabularyTargetSourceRef = {
  sourceName: string;
  sourceVersion: string;
  sourceType: "curriculum" | "reference";
  license: string;
  reference: string;
};

export type VocabularyTargetEntry = {
  lexemeId: string;
  lemma: string;
  sourceLexemeIds: string[];
  targetLevel: VocabularyTargetLevel;
  masteryTarget: VocabularyMasteryTarget;
  curriculumPriority: number;
  topics: string[];
  sourceRefs: VocabularyTargetSourceRef[];
  qaStatus: string;
};

export type VocabularyTargetGoals = {
  totalLexemes: number;
  activeLexemes: number;
  receptiveLexemes: number;
  a1Cumulative: {
    totalLexemes: number;
    activeLexemes: number;
    receptiveLexemes: number;
  };
  a2Cumulative: {
    totalLexemes: number;
    activeLexemes: number;
    receptiveLexemes: number;
  };
};

export type VocabularyTargetsData = {
  schemaVersion: 1;
  status: "partial_review_required" | "complete";
  completionLevel: "A2";
  goals: VocabularyTargetGoals;
  entries: VocabularyTargetEntry[];
};

export type VocabularyTargetValidationReport = {
  valid: boolean;
  errors: string[];
};

export type VocabularyCoverageReport = {
  targetEntries: number;
  activeEntries: number;
  receptiveEntries: number;
  curriculumCovered: number;
  referenceOnlyCovered: number;
  missingEntries: number;
  byLevel: Record<VocabularyTargetLevel, number>;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const canonicalizeLexemeId = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑‒–—−]/g, "-");

export const isSingleLexemeWord = (value: string) =>
  /^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(value.trim());

export const validateVocabularyTargets = (
  value: unknown,
): VocabularyTargetValidationReport => {
  const errors: string[] = [];
  if (!isObject(value)) {
    return { valid: false, errors: ["詞彙目標資料必須是物件。"] };
  }
  if (value.schemaVersion !== 1) errors.push("詞彙目標 schemaVersion 必須是 1。");
  if (
    value.status !== "partial_review_required" &&
    value.status !== "complete"
  ) {
    errors.push("詞彙目標 status 不正確。");
  }
  if (value.completionLevel !== "A2") {
    errors.push("詞彙目標 completionLevel 必須是 A2。");
  }
  if (!isObject(value.goals) || !Array.isArray(value.entries)) {
    errors.push("詞彙目標缺少 goals 或 entries。");
    return { valid: false, errors };
  }

  const goals = value.goals as Record<string, unknown>;
  if (
    goals.totalLexemes !== 3000 ||
    goals.activeLexemes !== 1500 ||
    goals.receptiveLexemes !== 1500
  ) {
    errors.push("A1＋A2 目標必須是 3000，且 active／receptive 各 1500。");
  }
  const a1Goal = goals.a1Cumulative as Record<string, unknown> | undefined;
  const a2Goal = goals.a2Cumulative as Record<string, unknown> | undefined;
  if (
    !a1Goal ||
    a1Goal.totalLexemes !== 1200 ||
    a1Goal.activeLexemes !== 700 ||
    a1Goal.receptiveLexemes !== 500
  ) {
    errors.push("A1 累計目標必須是 1200（active 700、receptive 500）。");
  }
  if (
    !a2Goal ||
    a2Goal.totalLexemes !== 3000 ||
    a2Goal.activeLexemes !== 1500 ||
    a2Goal.receptiveLexemes !== 1500
  ) {
    errors.push("A2 累計目標必須是 3000（active／receptive 各 1500）。");
  }

  const ids = new Set<string>();
  const sourceAliasOwners = new Map<string, string>();
  const priorities: number[] = [];
  let activeCount = 0;
  let receptiveCount = 0;
  let a1ActiveCount = 0;
  let a1ReceptiveCount = 0;
  (value.entries as unknown[]).forEach((unknownEntry, index) => {
    if (!isObject(unknownEntry)) {
      errors.push(`第 ${index + 1} 筆詞彙目標不是物件。`);
      return;
    }
    const entry = unknownEntry as Partial<VocabularyTargetEntry>;
    const lexemeId = canonicalizeLexemeId(entry.lexemeId ?? "");
    if (!lexemeId || ids.has(lexemeId)) {
      errors.push(`lexemeId 空白或重複：${entry.lexemeId || "（空白）"}。`);
    }
    ids.add(lexemeId);
    if (entry.lexemeId !== lexemeId) {
      errors.push(`${entry.lexemeId || "（空白）"} 不是 canonical lexemeId。`);
    }
    if (!isSingleLexemeWord(entry.lemma ?? "")) {
      errors.push(`${lexemeId || `第 ${index + 1} 筆`} 的 lemma 必須是一個英文詞。`);
    } else if (canonicalizeLexemeId(entry.lemma ?? "") !== lexemeId) {
      errors.push(`${lexemeId} 的 lemma 與 canonical lexemeId 不一致。`);
    }
    if (
      !Array.isArray(entry.sourceLexemeIds) ||
      entry.sourceLexemeIds.length === 0 ||
      entry.sourceLexemeIds.some((id) => !canonicalizeLexemeId(id))
    ) {
      errors.push(`${lexemeId} 缺少有效的 sourceLexemeIds。`);
    } else {
      entry.sourceLexemeIds.forEach((sourceLexemeId) => {
        const alias = canonicalizeLexemeId(sourceLexemeId);
        const owner = sourceAliasOwners.get(alias);
        if (owner && owner !== lexemeId) {
          errors.push(`sourceLexemeId ${alias} 同時對應 ${owner} 與 ${lexemeId}。`);
        } else {
          sourceAliasOwners.set(alias, lexemeId);
        }
      });
    }
    if (entry.targetLevel !== "A1" && entry.targetLevel !== "A2") {
      errors.push(`${lexemeId} 的 targetLevel 只能是 A1 或 A2。`);
    }
    if (entry.masteryTarget === "active") {
      activeCount += 1;
      if (entry.targetLevel === "A1") a1ActiveCount += 1;
    } else if (entry.masteryTarget === "receptive") {
      receptiveCount += 1;
      if (entry.targetLevel === "A1") a1ReceptiveCount += 1;
    } else {
      errors.push(`${lexemeId} 的 masteryTarget 不正確。`);
    }
    if (!Number.isInteger(entry.curriculumPriority) || entry.curriculumPriority! < 1) {
      errors.push(`${lexemeId} 的 curriculumPriority 必須是正整數。`);
    } else {
      priorities.push(entry.curriculumPriority!);
    }
    if (!Array.isArray(entry.topics) || entry.topics.length === 0) {
      errors.push(`${lexemeId} 至少需要一個 topic。`);
    }
    if (!entry.qaStatus?.trim()) errors.push(`${lexemeId} 缺少 qaStatus。`);
    if (!Array.isArray(entry.sourceRefs) || entry.sourceRefs.length === 0) {
      errors.push(`${lexemeId} 缺少來源與授權。`);
    } else {
      entry.sourceRefs.forEach((source, sourceIndex) => {
        if (
          !source?.sourceName?.trim() ||
          !source.sourceVersion?.trim() ||
          !source.license?.trim() ||
          !source.reference?.trim() ||
          (source.sourceType !== "curriculum" && source.sourceType !== "reference")
        ) {
          errors.push(`${lexemeId} 的第 ${sourceIndex + 1} 個 sourceRef 不完整。`);
        }
      });
    }
  });

  const sortedPriorities = [...priorities].sort((left, right) => left - right);
  if (
    new Set(sortedPriorities).size !== sortedPriorities.length ||
    sortedPriorities.some((priority, index) => priority !== index + 1)
  ) {
    errors.push("curriculumPriority 必須唯一，並從 1 連續排列。");
  }

  if (value.status === "complete") {
    const a1Total = a1ActiveCount + a1ReceptiveCount;
    if (value.entries.length !== 3000) errors.push("complete 清單必須正好有 3000 個 lexeme。");
    if (activeCount !== 1500) errors.push("complete 清單必須正好有 1500 個 active lexeme。");
    if (receptiveCount !== 1500) errors.push("complete 清單必須正好有 1500 個 receptive lexeme。");
    if (a1Total !== 1200) errors.push("complete 清單的 A1 累計必須正好有 1200 個 lexeme。");
    if (a1ActiveCount !== 700) errors.push("complete 清單的 A1 active 必須正好有 700 個 lexeme。");
    if (a1ReceptiveCount !== 500) errors.push("complete 清單的 A1 receptive 必須正好有 500 個 lexeme。");

    const reviewedStatuses = new Set([
      "reviewed",
      "human_reviewed",
      "approved",
      "production_ready",
    ]);
    (value.entries as VocabularyTargetEntry[]).forEach((entry) => {
      if (!reviewedStatuses.has(entry.qaStatus.trim().toLowerCase())) {
        errors.push(`${entry.lexemeId} 在 complete 清單中必須完成人工 QA。`);
      }
      entry.sourceRefs.forEach((source) => {
        const license = source.license.trim().toLowerCase();
        if (!license || ["pending", "unknown", "tbd"].includes(license)) {
          errors.push(`${entry.lexemeId} 在 complete 清單中不可使用待確認授權。`);
        }
      });
    });
  }
  return { valid: errors.length === 0, errors };
};

export const parseVocabularyTargets = (value: unknown): VocabularyTargetsData => {
  const report = validateVocabularyTargets(value);
  if (!report.valid) {
    throw new Error(`詞彙目標資料驗證失敗：\n${report.errors.join("\n")}`);
  }
  return value as VocabularyTargetsData;
};

export const loadVocabularyTargets = async (
  fetcher: typeof fetch = fetch,
): Promise<VocabularyTargetsData> => {
  const response = await fetcher("/data/vocabulary-targets-v1.json", {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`詞彙目標資料載入失敗（${response.status}）。`);
  }
  return parseVocabularyTargets(await response.json());
};

export const buildVocabularyTargetIndex = (data: VocabularyTargetsData) =>
  new Map(data.entries.map((entry) => [entry.lexemeId, entry]));

export const buildVocabularyTargetLevelIndexes = (
  data: VocabularyTargetsData,
) => ({
  A1: new Map(
    data.entries
      .filter((entry) => entry.targetLevel === "A1")
      .map((entry) => [entry.lexemeId, entry]),
  ),
  A2: new Map(
    data.entries
      .filter((entry) => entry.targetLevel === "A2")
      .map((entry) => [entry.lexemeId, entry]),
  ),
});

export const buildVocabularyTargetAliasIndex = (data: VocabularyTargetsData) =>
  new Map(
    data.entries.flatMap((entry) =>
      entry.sourceLexemeIds.map((sourceLexemeId) => [
        canonicalizeLexemeId(sourceLexemeId),
        entry.lexemeId,
      ] as const),
    ),
  );

export const buildVocabularyCoverageReport = (
  data: VocabularyTargetsData,
): VocabularyCoverageReport => {
  const activeEntries = data.entries.filter(
    (entry) => entry.masteryTarget === "active",
  ).length;
  const curriculumCovered = data.entries.filter((entry) =>
    entry.sourceRefs.some((source) => source.sourceType === "curriculum"),
  ).length;
  const referenceOnlyCovered = data.entries.filter(
    (entry) =>
      !entry.sourceRefs.some((source) => source.sourceType === "curriculum") &&
      entry.sourceRefs.some((source) => source.sourceType === "reference"),
  ).length;
  return {
    targetEntries: data.entries.length,
    activeEntries,
    receptiveEntries: data.entries.length - activeEntries,
    curriculumCovered,
    referenceOnlyCovered,
    missingEntries: Math.max(0, data.goals.totalLexemes - data.entries.length),
    byLevel: {
      A1: data.entries.filter((entry) => entry.targetLevel === "A1").length,
      A2: data.entries.filter((entry) => entry.targetLevel === "A2").length,
    },
  };
};

export const uniqueCanonicalLexemes = (rows: CourseCsvRow[]) =>
  new Set(
    rows
      .map((row) => canonicalizeLexemeId(row.lexeme_id ?? ""))
      .filter(Boolean),
  );
