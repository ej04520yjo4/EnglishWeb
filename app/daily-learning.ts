import type { GlobalVocabularyProgress } from "./vocabulary-progress.ts";
import { normalizeVocabularyEvidence } from "./vocabulary-progress.ts";
import type { VocabularyTargetsData } from "./vocabulary-targets.ts";

export type VocabularyWeaknessFocus = "辨認" | "拼寫" | "運用";

export type VocabularyWeakness = {
  lexemeId: string;
  lemma: string;
  focus: VocabularyWeaknessFocus;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  score: number;
  lastSeenAt: string;
};

const incorrectCount = (attempts: string[], correct: string[]) =>
  Math.max(0, attempts.length - correct.length);

export const buildVocabularyWeaknesses = (
  progress: GlobalVocabularyProgress,
  targets: VocabularyTargetsData | null,
  limit = 12,
): VocabularyWeakness[] => {
  if (!targets || limit <= 0) return [];
  const targetIndex = new Map(
    targets.entries.map((entry) => [entry.lexemeId, entry]),
  );

  return Object.entries(progress)
    .flatMap(([lexemeId, rawEvidence]) => {
      const target = targetIndex.get(lexemeId);
      if (!target) return [];
      const evidence = normalizeVocabularyEvidence(rawEvidence);
      const recognitionWrong = incorrectCount(
        evidence.recognitionAttemptEvidenceIds,
        evidence.recognitionCorrectEvidenceIds,
      );
      const spellingWrong = incorrectCount(
        evidence.spellingAttemptEvidenceIds,
        evidence.spellingCorrectEvidenceIds,
      );
      const applicationWrong = incorrectCount(
        evidence.applicationAttemptEvidenceIds,
        evidence.applicationCorrectEvidenceIds,
      );
      const wrongAttempts =
        recognitionWrong + spellingWrong + applicationWrong;
      if (wrongAttempts <= 0) return [];

      const totalAttempts =
        evidence.recognitionAttemptEvidenceIds.length +
        evidence.spellingAttemptEvidenceIds.length +
        evidence.applicationAttemptEvidenceIds.length;
      const correctAttempts =
        evidence.recognitionCorrectEvidenceIds.length +
        evidence.spellingCorrectEvidenceIds.length +
        evidence.applicationCorrectEvidenceIds.length;
      const focusScores: Array<[VocabularyWeaknessFocus, number]> = [
        ["拼寫", spellingWrong],
        ["運用", applicationWrong],
        ["辨認", recognitionWrong],
      ];
      focusScores.sort((left, right) => right[1] - left[1]);
      const focus = focusScores[0][0];
      const score =
        spellingWrong * 4 +
        applicationWrong * 3 +
        recognitionWrong * 2 +
        Math.min(totalAttempts, 5);

      return [
        {
          lexemeId,
          lemma: target.lemma,
          focus,
          totalAttempts,
          correctAttempts,
          wrongAttempts,
          score,
          lastSeenAt: evidence.lastSeenAt,
        },
      ];
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.wrongAttempts !== left.wrongAttempts) {
        return right.wrongAttempts - left.wrongAttempts;
      }
      return right.lastSeenAt.localeCompare(left.lastSeenAt);
    })
    .slice(0, limit);
};
