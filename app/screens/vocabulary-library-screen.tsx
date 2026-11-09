import { localDateKey } from "../local-date";
import { buildVocabularyApplicationQuestion } from "../vocabulary-application";
import { buildVocabularyLibraryPracticeQuestion } from "../vocabulary-library";
import { VocabularyLibraryPanel } from "../vocabulary-library-panel";
import { summarizeVocabularyProgress } from "../vocabulary-progress";
import type { MultiLevelProgress } from "../curriculum/progress";
import type { VocabularyApplicationData } from "../vocabulary-application";
import type { VocabularyLibraryData } from "../vocabulary-library";
import type {
  VocabularyLibraryEntry,
  VocabularyLibraryEvidenceInput,
} from "../vocabulary-library-panel";
import type { VocabularyPhoneticsData } from "../vocabulary-phonetics";
import type { VocabularyTargetsData } from "../vocabulary-targets";

export type VocabularyLibraryScreenProps = {
  multiProgress: MultiLevelProgress;
  recordVocabularyLibraryEvidence: (input: VocabularyLibraryEvidenceInput) => void;
  vocabularyLibrary: VocabularyLibraryData | null;
  vocabularyLibraryEntries: VocabularyLibraryEntry[];
  vocabularyLibraryError: string;
  vocabularyLibraryStatus: "ready" | "error" | "loading";
  vocabularySupplements: { applications: VocabularyApplicationData | null; applicationError: string; phonetics: VocabularyPhoneticsData | null; phoneticError: string; };
  vocabularyTargets: VocabularyTargetsData | null;
};

export function VocabularyLibraryScreen({
  multiProgress,
  recordVocabularyLibraryEvidence,
  vocabularyLibrary,
  vocabularyLibraryEntries,
  vocabularyLibraryError,
  vocabularyLibraryStatus,
  vocabularySupplements,
  vocabularyTargets,
}: VocabularyLibraryScreenProps) {
  return (
    <VocabularyLibraryPanel
      entries={vocabularyLibraryEntries}
      loading={vocabularyLibraryStatus === "loading"}
      error={vocabularyLibraryStatus === "error" ? vocabularyLibraryError : ""}
      applicationCount={vocabularySupplements.applications?.entries.length ?? 0}
      applicationError={vocabularySupplements.applicationError}
      phonetics={vocabularySupplements.phonetics}
      phoneticError={vocabularySupplements.phoneticError}
      buildApplicationQuestion={(entry) => {
        if (!vocabularySupplements.applications || !vocabularyTargets) return undefined;
        const data = vocabularySupplements.applications;
        const question = buildVocabularyApplicationQuestion(data, vocabularyTargets, entry.lexemeId, localDateKey());
        const source = data.entries.find((item) => item.lexemeId === entry.lexemeId);
        return question && source ? { question, sentence: source.sentence } : undefined;
      }}
      buildQuestion={(entry, mode) => {
        if (!vocabularyLibrary || !vocabularyTargets) return undefined;
        return buildVocabularyLibraryPracticeQuestion({
          library: vocabularyLibrary,
          targets: vocabularyTargets,
          lexemeId: entry.lexemeId,
          studyDate: localDateKey(),
          mode,
        });
      }}
      learnedCount={
        summarizeVocabularyProgress(
          multiProgress.vocabularyProgress,
          vocabularyLibraryEntries.map((entry) => entry.lexemeId),
        ).exposed
      }
      onEvidence={recordVocabularyLibraryEvidence}
    />
  );
}
