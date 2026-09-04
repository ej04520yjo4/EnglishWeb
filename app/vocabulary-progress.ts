import type { CefrLevel } from "./curriculum/types.ts";
import { localDateKey } from "./local-date.ts";
import { canonicalizeLexemeId } from "./vocabulary-targets.ts";

export type VocabularyMasteryState = "unseen" | "exposed" | "receptive" | "active";

export type GlobalVocabularyEvidence = {
  firstSeenAt: string;
  lastSeenAt: string;
  exposureEvidenceIds: string[];
  recognitionCorrectEvidenceIds: string[];
  recognitionAttemptEvidenceIds: string[];
  spellingCorrectEvidenceIds: string[];
  spellingAttemptEvidenceIds: string[];
  applicationCorrectEvidenceIds: string[];
  applicationAttemptEvidenceIds: string[];
  evidenceStudyDates: Record<string, string>;
  studyDates: string[];
  sourceLevels: CefrLevel[];
};

export type GlobalVocabularyProgress = Record<string, GlobalVocabularyEvidence>;

export type VocabularyEvidenceKind =
  | "exposure"
  | "recognitionAttempt"
  | "recognitionCorrect"
  | "spellingAttempt"
  | "spellingCorrect"
  | "applicationAttempt"
  | "applicationCorrect";

export const canCreditSpellingCorrect = (input: {
  correct: boolean;
  answerRevealed: boolean;
  usedPaste: boolean;
}) => input.correct && !input.answerRevealed && !input.usedPaste;

export const canCreditApplicationCorrect = (input: {
  correct: boolean;
  answerRevealed: boolean;
  usedPaste: boolean;
}) => input.correct && !input.answerRevealed && !input.usedPaste;

const evidenceField: Record<
  VocabularyEvidenceKind,
  keyof Pick<
    GlobalVocabularyEvidence,
    | "exposureEvidenceIds"
    | "recognitionCorrectEvidenceIds"
    | "recognitionAttemptEvidenceIds"
    | "spellingCorrectEvidenceIds"
    | "spellingAttemptEvidenceIds"
    | "applicationCorrectEvidenceIds"
    | "applicationAttemptEvidenceIds"
  >
> = {
  exposure: "exposureEvidenceIds",
  recognitionAttempt: "recognitionAttemptEvidenceIds",
  recognitionCorrect: "recognitionCorrectEvidenceIds",
  spellingAttempt: "spellingAttemptEvidenceIds",
  spellingCorrect: "spellingCorrectEvidenceIds",
  applicationAttempt: "applicationAttemptEvidenceIds",
  applicationCorrect: "applicationCorrectEvidenceIds",
};

export const createEmptyVocabularyEvidence = (): GlobalVocabularyEvidence => ({
  firstSeenAt: "",
  lastSeenAt: "",
  exposureEvidenceIds: [],
  recognitionCorrectEvidenceIds: [],
  recognitionAttemptEvidenceIds: [],
  spellingCorrectEvidenceIds: [],
  spellingAttemptEvidenceIds: [],
  applicationCorrectEvidenceIds: [],
  applicationAttemptEvidenceIds: [],
  evidenceStudyDates: {},
  studyDates: [],
  sourceLevels: [],
});

export const normalizeVocabularyEvidence = (
  value: Partial<GlobalVocabularyEvidence> | undefined,
): GlobalVocabularyEvidence => {
  const empty = createEmptyVocabularyEvidence();
  return {
    ...empty,
    ...(value ?? {}),
    exposureEvidenceIds: value?.exposureEvidenceIds ?? [],
    recognitionCorrectEvidenceIds: value?.recognitionCorrectEvidenceIds ?? [],
    recognitionAttemptEvidenceIds: value?.recognitionAttemptEvidenceIds ?? [],
    spellingCorrectEvidenceIds: value?.spellingCorrectEvidenceIds ?? [],
    spellingAttemptEvidenceIds: value?.spellingAttemptEvidenceIds ?? [],
    applicationCorrectEvidenceIds: value?.applicationCorrectEvidenceIds ?? [],
    applicationAttemptEvidenceIds: value?.applicationAttemptEvidenceIds ?? [],
    evidenceStudyDates: value?.evidenceStudyDates ?? {},
    studyDates: value?.studyDates ?? [],
    sourceLevels: value?.sourceLevels ?? [],
  };
};

export const normalizeGlobalVocabularyProgress = (
  value: unknown,
): GlobalVocabularyProgress => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([lexemeId, evidence]) => [
      canonicalizeLexemeId(lexemeId),
      normalizeVocabularyEvidence(
        evidence as Partial<GlobalVocabularyEvidence>,
      ),
    ]),
  );
};

const addUnique = (items: string[], value: string) =>
  items.includes(value) ? items : [...items, value];

export const recordGlobalVocabularyEvidence = (
  progress: GlobalVocabularyProgress,
  input: {
    lexemeIds: string[];
    kind: VocabularyEvidenceKind;
    evidenceId: string;
    studiedAt?: string;
    studyDate?: string;
    sourceLevel: CefrLevel;
  },
): GlobalVocabularyProgress => {
  const studiedAt = input.studiedAt ?? new Date().toISOString();
  const studyDate = input.studyDate ?? localDateKey(new Date(studiedAt));
  const field = evidenceField[input.kind];
  let changed = false;
  const next = { ...progress };
  [...new Set(input.lexemeIds.map(canonicalizeLexemeId).filter(Boolean))].forEach(
    (lexemeId) => {
      const current = normalizeVocabularyEvidence(progress[lexemeId]);
      if (current[field].includes(input.evidenceId)) return;
      changed = true;
      next[lexemeId] = {
        ...current,
        firstSeenAt: current.firstSeenAt || studiedAt,
        lastSeenAt: studiedAt,
        [field]: [...current[field], input.evidenceId],
        evidenceStudyDates: {
          ...current.evidenceStudyDates,
          [input.evidenceId]: studyDate,
        },
        studyDates: addUnique(current.studyDates, studyDate),
        sourceLevels: addUnique(
          current.sourceLevels,
          input.sourceLevel,
        ) as CefrLevel[],
      };
    },
  );
  return changed ? next : progress;
};

const distinctEvidenceDates = (
  evidence: GlobalVocabularyEvidence,
  ids: string[],
) =>
  new Set(ids.map((id) => evidence.evidenceStudyDates[id]).filter(Boolean));

export const deriveVocabularyMasteryState = (
  value: GlobalVocabularyEvidence | undefined,
): VocabularyMasteryState => {
  if (!value) return "unseen";
  const evidence = normalizeVocabularyEvidence(value);
  const hasEvidence = [
    evidence.exposureEvidenceIds,
    evidence.recognitionAttemptEvidenceIds,
    evidence.spellingAttemptEvidenceIds,
    evidence.applicationAttemptEvidenceIds,
  ].some((items) => items.length > 0);
  if (!hasEvidence) return "unseen";
  const receptive =
    evidence.recognitionCorrectEvidenceIds.length >= 2 &&
    distinctEvidenceDates(
      evidence,
      evidence.recognitionCorrectEvidenceIds,
    ).size >= 2;
  if (!receptive) return "exposed";
  const active =
    evidence.spellingCorrectEvidenceIds.length >= 2 &&
    distinctEvidenceDates(evidence, evidence.spellingCorrectEvidenceIds).size >= 2 &&
    evidence.applicationCorrectEvidenceIds.length >= 1;
  return active ? "active" : "receptive";
};

export const summarizeVocabularyProgress = (
  progress: GlobalVocabularyProgress,
  lexemeIds?: Iterable<string>,
) => {
  const ids = lexemeIds
    ? [...new Set([...lexemeIds].map(canonicalizeLexemeId))]
    : Object.keys(progress);
  const states = ids.map((lexemeId) =>
    deriveVocabularyMasteryState(progress[lexemeId]),
  );
  return {
    exposed: states.filter((state) => state !== "unseen").length,
    receptive: states.filter(
      (state) => state === "receptive" || state === "active",
    ).length,
    active: states.filter((state) => state === "active").length,
  };
};
