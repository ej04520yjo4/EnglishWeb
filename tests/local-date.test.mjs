import assert from "node:assert/strict";
import test from "node:test";
import { localDateKey } from "../app/local-date.ts";
import {
  deriveVocabularyMasteryState,
  recordGlobalVocabularyEvidence,
} from "../app/vocabulary-progress.ts";

const withTaipeiTimeZone = (run) => {
  const previous = process.env.TZ;
  process.env.TZ = "Asia/Taipei";
  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
};

test("uses the Taiwan local calendar day instead of the UTC date", () => {
  withTaipeiTimeZone(() => {
    assert.equal(
      localDateKey(new Date("2026-08-19T22:00:00.000Z")),
      "2026-08-20",
    );
  });
});

test("maps early and late Taiwan times to the same local day", () => {
  withTaipeiTimeZone(() => {
    assert.equal(
      localDateKey(new Date("2026-08-19T17:00:00.000Z")),
      "2026-08-20",
    );
    assert.equal(
      localDateKey(new Date("2026-08-20T15:00:00.000Z")),
      "2026-08-20",
    );
  });
});

test("counts two Taiwan local calendar days as cross-date evidence", () => {
  withTaipeiTimeZone(() => {
    const firstAt = "2026-08-20T15:30:00.000Z";
    const secondAt = "2026-08-20T16:30:00.000Z";
    let progress = {};
    for (const [evidenceId, studiedAt] of [
      ["recognition-1", firstAt],
      ["recognition-2", secondAt],
    ]) {
      for (const kind of ["recognitionAttempt", "recognitionCorrect"]) {
        progress = recordGlobalVocabularyEvidence(progress, {
          lexemeIds: ["apple"],
          kind,
          evidenceId,
          studiedAt,
          studyDate: localDateKey(new Date(studiedAt)),
          sourceLevel: "A1",
        });
      }
    }
    assert.deepEqual(progress.apple.studyDates, ["2026-08-20", "2026-08-21"]);
    assert.equal(deriveVocabularyMasteryState(progress.apple), "receptive");

    process.env.TZ = "UTC";
    assert.deepEqual(progress.apple.studyDates, ["2026-08-20", "2026-08-21"]);
    assert.equal(deriveVocabularyMasteryState(progress.apple), "receptive");
  });
});
