import type { VocabularyTargetEntry } from "./vocabulary-targets.ts";

export const VOCABULARY_PHONETICS_URL = "/data/vocabulary-phonetics-v1.json";

export const VOCABULARY_PHONETICS_SOURCE = {
  sourceVersion: "cmudict-2025-10-24",
  sourceRevision: "74790861f652b15e4ac49015a90074ad62a27690",
  sourceFile: "cmudict.dict",
  sourceSha256:
    "81917843C7F44CE2B094AC63873C2C7A4CF802040792C455BA3CA406891C3D22",
  sourceSnapshotFile:
    "data-sources/vocabulary-3000/phonetics/cmudict-targets-v1.dict",
  sourceSnapshotSha256:
    "652E438BEF476D6203C87250B45AAFB03AE20417B430B587A0C0B63F2278B022",
  mappingId: "englishweb-arpabet-to-kk-v1",
} as const;

export type VocabularyPhoneticEntryStatus =
  | "derived_review_required"
  | "variant_review_required"
  | "source_missing";

export type VocabularyPhoneticVariant = {
  variantIndex: number;
  sourceEntry: string;
  arpabet: string;
  ipaCandidate: string;
  kkCandidate: string;
  candidateStatus: "derived_review_required";
  selectionStatus: "not_selected";
  syllableCount: number;
  stressSyllableIndexes: number[];
  syllabificationStatus: "heuristic_candidate";
  stressPlacementStatus: "heuristic_candidate";
  stressPlacementNote: string;
};

export type VocabularyPhoneticEntry = {
  lexemeId: string;
  lemma: string;
  status: VocabularyPhoneticEntryStatus;
  variants: VocabularyPhoneticVariant[];
};

export type VocabularyPhoneticsData = {
  schemaVersion: 1;
  sourceVersion: string;
  sourceRevision: string;
  sourceFile: string;
  sourceSha256: string;
  inputSourceFile: string;
  inputSourceSha256: string;
  sourceSnapshotFile: string;
  sourceSnapshotSha256: string;
  mappingId: string;
  mappingStatus: "derived_review_required";
  candidateStatus: "pilot_review_required";
  phoneticQaStatus: "candidate_only";
  audioStatus: "unchanged";
  stressPolicy: "monosyllables_unmarked; multisyllables_maximal_onset_candidate_with_r_l_coda_candidate";
  targetCount: number;
  missingCount: number;
  parsedSourceEntryCount: number;
  pronunciationVariantCount: number;
  entries: VocabularyPhoneticEntry[];
};

export type VocabularyPhoneticsValidationReport = {
  valid: boolean;
  errors: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const canonicalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑‒–—−]/g, "-");

const CMU_VOWEL_PHONES = new Set([
  "AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY", "OW",
  "OY", "UH", "UW",
]);
const CMU_PHONES = new Set([
  "AA", "AE", "AH", "AO", "AW", "AY", "B", "CH", "D", "DH", "EH", "ER",
  "EY", "F", "G", "HH", "IH", "IY", "JH", "K", "L", "M", "N", "NG", "OW",
  "OY", "P", "R", "S", "SH", "T", "TH", "UH", "UW", "V", "W", "Y", "Z", "ZH",
]);
const isArpabet = (value: string) =>
  value.split(" ").every((token) => {
    const match = token.match(/^([A-Z]{1,3})([012]?)$/);
    if (!match || !CMU_PHONES.has(match[1])) return false;
    return CMU_VOWEL_PHONES.has(match[1])
      ? match[2].length === 1
      : match[2].length === 0;
  });

const isCandidateString = (value: string) =>
  value.startsWith("/") && value.endsWith("/") && value.length > 2;

const sourceEntryBase = (value: string) => value.replace(/\(\d+\)$/, "");

const expectedSourceMatches = (value: Record<string, unknown>) =>
  value.sourceVersion === VOCABULARY_PHONETICS_SOURCE.sourceVersion &&
  value.sourceRevision === VOCABULARY_PHONETICS_SOURCE.sourceRevision &&
  value.sourceFile === VOCABULARY_PHONETICS_SOURCE.sourceFile &&
  value.sourceSha256 === VOCABULARY_PHONETICS_SOURCE.sourceSha256 &&
  value.sourceSnapshotFile === VOCABULARY_PHONETICS_SOURCE.sourceSnapshotFile &&
  value.sourceSnapshotSha256 === VOCABULARY_PHONETICS_SOURCE.sourceSnapshotSha256 &&
  ((value.inputSourceFile === VOCABULARY_PHONETICS_SOURCE.sourceFile &&
    value.inputSourceSha256 === VOCABULARY_PHONETICS_SOURCE.sourceSha256) ||
    (value.inputSourceFile === VOCABULARY_PHONETICS_SOURCE.sourceSnapshotFile &&
      value.inputSourceSha256 === VOCABULARY_PHONETICS_SOURCE.sourceSnapshotSha256)) &&
  value.mappingId === VOCABULARY_PHONETICS_SOURCE.mappingId;

export const validateVocabularyPhonetics = (
  value: unknown,
  expectedTargets?: readonly Pick<VocabularyTargetEntry, "lexemeId" | "lemma">[],
): VocabularyPhoneticsValidationReport => {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: ["詞彙發音資料必須是物件。"] };
  }
  if (value.schemaVersion !== 1) errors.push("詞彙發音 schemaVersion 必須是 1。");
  if (!expectedSourceMatches(value)) errors.push("詞彙發音來源或 mapping 不是固定的 CMUdict 版本。");
  if (value.mappingStatus !== "derived_review_required") {
    errors.push("KK mapping 必須標示 derived_review_required。");
  }
  if (value.candidateStatus !== "pilot_review_required") {
    errors.push("候選發音不可標示為已核准。");
  }
  if (value.phoneticQaStatus !== "candidate_only") {
    errors.push("phoneticQaStatus 必須維持 candidate_only。");
  }
  if (value.audioStatus !== "unchanged") {
    errors.push("發音候選不可改變既有音訊狀態。");
  }
  if (
    value.stressPolicy !==
    "monosyllables_unmarked; multisyllables_maximal_onset_candidate_with_r_l_coda_candidate"
  ) {
    errors.push("stressPolicy 必須明確標示候選音節起始音規則。");
  }
  if (value.targetCount !== 3000 || value.missingCount !== 0) {
    errors.push("詞彙發音資料必須包含完整 3000 筆且 missingCount 為 0。");
  }
  if (!Number.isInteger(value.parsedSourceEntryCount) || (value.parsedSourceEntryCount as number) < 1) {
    errors.push("parsedSourceEntryCount 必須是正整數。");
  }
  if (!Number.isInteger(value.pronunciationVariantCount) || (value.pronunciationVariantCount as number) < 3000) {
    errors.push("pronunciationVariantCount 必須至少是 3000。");
  }
  if (!Array.isArray(value.entries) || value.entries.length !== 3000) {
    errors.push("詞彙發音 entries 必須正好有 3000 筆。");
    return { valid: false, errors };
  }

  const ids = new Set<string>();
  const entries = value.entries as unknown[];
  let actualVariantCount = 0;
  entries.forEach((unknownEntry, entryIndex) => {
    const label = `第 ${entryIndex + 1} 筆發音`;
    if (!isRecord(unknownEntry)) {
      errors.push(`${label} 必須是物件。`);
      return;
    }
    const entry = unknownEntry;
    const lexemeId = typeof entry.lexemeId === "string" ? entry.lexemeId : "";
    const lemma = typeof entry.lemma === "string" ? entry.lemma : "";
    if (!lexemeId || canonicalize(lexemeId) !== lexemeId || ids.has(lexemeId)) {
      errors.push(`${label} lexemeId 必須 canonical 且唯一。`);
    }
    ids.add(lexemeId);
    if (!lemma || canonicalize(lemma) !== lexemeId) {
      errors.push(`${lexemeId || label} 的 lemma 必須對應 lexemeId。`);
    }
    if (
      entry.status !== "derived_review_required" &&
      entry.status !== "variant_review_required" &&
      entry.status !== "source_missing"
    ) {
      errors.push(`${lexemeId || label} 的 entry status 不正確。`);
    }
    if (!Array.isArray(entry.variants) || entry.variants.length === 0) {
      errors.push(`${lexemeId || label} 必須有至少一個 pronunciation variant。`);
      return;
    }
    const variants = entry.variants as unknown[];
    actualVariantCount += variants.length;
    const expectedStatus = variants.length > 1
      ? "variant_review_required"
      : "derived_review_required";
    if (entry.status !== "source_missing" && entry.status !== expectedStatus) {
      errors.push(`${lexemeId || label} 的 status 必須與 variant 數量一致。`);
    }
    const variantIndexes = new Set<number>();
    variants.forEach((unknownVariant, variantPosition) => {
      const variantLabel = `${lexemeId || label} variant ${variantPosition + 1}`;
      if (!isRecord(unknownVariant)) {
        errors.push(`${variantLabel} 必須是物件。`);
        return;
      }
      const variant = unknownVariant;
      const variantIndex = variant.variantIndex;
      if (
        !Number.isInteger(variantIndex) ||
        (variantIndex as number) !== variantPosition + 1 ||
        variantIndexes.has(variantIndex as number)
      ) {
        errors.push(`${variantLabel} variantIndex 必須從 1 連續排列。`);
      }
      variantIndexes.add(variantIndex as number);
      if (typeof variant.sourceEntry !== "string" || !variant.sourceEntry.trim()) {
        errors.push(`${variantLabel} 缺少 sourceEntry。`);
      } else if (sourceEntryBase(variant.sourceEntry).toLowerCase() !== canonicalize(lemma)) {
        errors.push(`${variantLabel} 的 sourceEntry 與 lemma 不一致。`);
      }
      if (typeof variant.arpabet !== "string" || !isArpabet(variant.arpabet)) {
        errors.push(`${variantLabel} 的 ARPAbet 格式不正確。`);
      }
      if (typeof variant.ipaCandidate !== "string" || !isCandidateString(variant.ipaCandidate)) {
        errors.push(`${variantLabel} 缺少 IPA candidate。`);
      }
      if (typeof variant.kkCandidate !== "string" || !isCandidateString(variant.kkCandidate)) {
        errors.push(`${variantLabel} 缺少 KK candidate。`);
      }
      if (!Number.isInteger(variant.syllableCount) || (variant.syllableCount as number) < 1) {
        errors.push(`${variantLabel} 的 syllableCount 必須是正整數。`);
      }
      if (
        !Array.isArray(variant.stressSyllableIndexes) ||
        variant.stressSyllableIndexes.some(
          (index): index is unknown => !Number.isInteger(index) || (index as number) < 1,
        )
      ) {
        errors.push(`${variantLabel} 的 stressSyllableIndexes 不正確。`);
      }
      if (variant.candidateStatus !== "derived_review_required") {
        errors.push(`${variantLabel} 不可標示為已核准。`);
      }
      if (variant.selectionStatus !== "not_selected") {
        errors.push(`${variantLabel} 不可將任何變體標記為權威選擇。`);
      }
      if (variant.syllabificationStatus !== "heuristic_candidate") {
        errors.push(`${variantLabel} 的音節切分必須標示 heuristic_candidate。`);
      }
      if (variant.stressPlacementStatus !== "heuristic_candidate") {
        errors.push(`${variantLabel} 的重音位置必須標示 heuristic_candidate。`);
      }
      if (typeof variant.stressPlacementNote !== "string" || !variant.stressPlacementNote.trim()) {
        errors.push(`${variantLabel} 缺少重音推導限制說明。`);
      }
    });
  });

  if (value.pronunciationVariantCount !== actualVariantCount) {
    errors.push(
      `pronunciationVariantCount 與實際 variants 不一致（${value.pronunciationVariantCount}／${actualVariantCount}）。`,
    );
  }

  if (expectedTargets) {
    const expectedIds = new Set(expectedTargets.map((target) => target.lexemeId));
    if (expectedIds.size !== expectedTargets.length || expectedIds.size !== ids.size) {
      errors.push("詞彙發音 entries 與 vocabulary targets 的 ID 集合不一致。");
    }
    ids.forEach((id) => {
      if (!expectedIds.has(id)) {
        errors.push(`${id} 不是正式 vocabulary target ID。`);
      }
    });
    expectedTargets.forEach((target) => {
      const actual = entries.find(
        (entry): entry is Record<string, unknown> =>
          isRecord(entry) && entry.lexemeId === target.lexemeId,
      );
      if (!actual || actual.lemma !== target.lemma) {
        errors.push(`${target.lexemeId} 的 lemma 與正式 vocabulary target 不一致。`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
};

export const parseVocabularyPhonetics = (
  value: unknown,
  expectedTargets?: readonly Pick<VocabularyTargetEntry, "lexemeId" | "lemma">[],
): VocabularyPhoneticsData => {
  const report = validateVocabularyPhonetics(value, expectedTargets);
  if (!report.valid) {
    throw new Error(`詞彙發音資料驗證失敗：\n${report.errors.join("\n")}`);
  }
  return value as VocabularyPhoneticsData;
};

export const loadVocabularyPhonetics = async (
  fetcher: typeof fetch = fetch,
  expectedTargets?: readonly Pick<VocabularyTargetEntry, "lexemeId" | "lemma">[],
): Promise<VocabularyPhoneticsData> => {
  const response = await fetcher(VOCABULARY_PHONETICS_URL, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`詞彙發音資料載入失敗（${response.status}）。`);
  }
  return parseVocabularyPhonetics(await response.json(), expectedTargets);
};

export const buildVocabularyPhoneticIndex = (data: VocabularyPhoneticsData) =>
  new Map(data.entries.map((entry) => [entry.lexemeId, entry] as const));
