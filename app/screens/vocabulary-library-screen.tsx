import { useState } from "react";
import { localDateKey } from "../local-date";
import { buildVocabularyApplicationQuestion } from "../vocabulary-application";
import { buildVocabularyLibraryPracticeQuestion } from "../vocabulary-library";
import { VocabularyLibraryPanel } from "../vocabulary-library-panel";
import {
  VocabularyPathOverview,
  VocabularyPathSessionView,
  type VocabularyPathSession,
} from "../vocabulary-path-panel";
import { summarizeVocabularyProgress } from "../vocabulary-progress";
import type { MultiLevelProgress } from "../curriculum/progress";
import type { VocabularyApplicationData } from "../vocabulary-application";
import type { VocabularyLibraryData, VocabularyPracticeMode } from "../vocabulary-library";
import type {
  VocabularyLibraryEntry,
  VocabularyLibraryEvidenceInput,
} from "../vocabulary-library-panel";
import type { VocabularyPathData } from "../vocabulary-path";
import type { VocabularyPhoneticsData } from "../vocabulary-phonetics";
import type { VocabularyTargetsData } from "../vocabulary-targets";

export type VocabularyLibraryScreenProps = {
  multiProgress: MultiLevelProgress;
  recordVocabularyLibraryEvidence: (input: VocabularyLibraryEvidenceInput) => void;
  recordVocabularyPathExposure: (entry: VocabularyLibraryEntry) => void;
  vocabularyLibrary: VocabularyLibraryData | null;
  vocabularyLibraryEntries: VocabularyLibraryEntry[];
  vocabularyLibraryError: string;
  vocabularyLibraryStatus: "ready" | "error" | "loading";
  vocabularySupplements: { applications: VocabularyApplicationData | null; applicationError: string; phonetics: VocabularyPhoneticsData | null; phoneticError: string; path: VocabularyPathData | null; pathError: string; };
  vocabularyTargets: VocabularyTargetsData | null;
};

export function VocabularyLibraryScreen({
  multiProgress,
  recordVocabularyLibraryEvidence,
  recordVocabularyPathExposure,
  vocabularyLibrary,
  vocabularyLibraryEntries,
  vocabularyLibraryError,
  vocabularyLibraryStatus,
  vocabularySupplements,
  vocabularyTargets,
}: VocabularyLibraryScreenProps) {
  const [pathSession, setPathSession] = useState<VocabularyPathSession | null>(null);
  const buildApplicationQuestion = (entry: VocabularyLibraryEntry) => {
    if (!vocabularySupplements.applications || !vocabularyTargets) return undefined;
    const data = vocabularySupplements.applications;
    const question = buildVocabularyApplicationQuestion(data, vocabularyTargets, entry.lexemeId, localDateKey());
    const source = data.entries.find((item) => item.lexemeId === entry.lexemeId);
    return question && source ? { question, sentence: source.sentence } : undefined;
  };
  const buildQuestion = (entry: VocabularyLibraryEntry, mode: VocabularyPracticeMode) => {
    if (!vocabularyLibrary || !vocabularyTargets) return undefined;
    return buildVocabularyLibraryPracticeQuestion({
      library: vocabularyLibrary,
      targets: vocabularyTargets,
      lexemeId: entry.lexemeId,
      studyDate: localDateKey(),
      mode,
    });
  };

  if (pathSession) {
    return (
      <VocabularyPathSessionView
        session={pathSession}
        entries={vocabularyLibraryEntries}
        applications={vocabularySupplements.applications}
        phonetics={vocabularySupplements.phonetics}
        buildQuestion={buildQuestion}
        buildApplicationQuestion={buildApplicationQuestion}
        onEvidence={recordVocabularyLibraryEvidence}
        onExposure={recordVocabularyPathExposure}
        onExit={() => setPathSession(null)}
      />
    );
  }

  return (
    <VocabularyLibraryPanel
      pathSlot={
        <VocabularyPathOverview
          path={vocabularySupplements.path}
          pathError={vocabularySupplements.pathError}
          targets={vocabularyTargets}
          progress={multiProgress.vocabularyProgress}
          ready={vocabularyLibraryStatus === "ready" && Boolean(vocabularyLibrary) && vocabularyLibraryEntries.length > 0}
          onStart={setPathSession}
        />
      }
      entries={vocabularyLibraryEntries}
      loading={vocabularyLibraryStatus === "loading"}
      error={vocabularyLibraryStatus === "error" ? vocabularyLibraryError : ""}
      applicationCount={vocabularySupplements.applications?.entries.length ?? 0}
      applicationError={vocabularySupplements.applicationError}
      phonetics={vocabularySupplements.phonetics}
      phoneticError={vocabularySupplements.phoneticError}
      buildApplicationQuestion={buildApplicationQuestion}
      buildQuestion={buildQuestion}
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
