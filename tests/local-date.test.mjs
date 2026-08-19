import assert from "node:assert/strict";
import test from "node:test";
import { localDateKey, studyDaysThisWeek } from "../app/local-date.ts";
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

test("counts unique study dates in the current Monday-Sunday week", () => {
  withTaipeiTimeZone(() => {
    const today = new Date("2026-08-19T04:00:00.000Z");
    assert.equal(
      studyDaysThisWeek(
        [
          "2026-08-16",
          "2026-08-17",
          "2026-08-18",
          "2026-08-19",
          "2026-08-19",
          "2026-08-24",
        ],
        today,
      ),
      3,
    );
  });
});

test("includes both Monday and Sunday boundaries", () => {
  withTaipeiTimeZone(() => {
    const sunday = new Date("2026-08-23T04:00:00.000Z");
    assert.equal(
      studyDaysThisWeek(
        ["2026-08-16", "2026-08-17", "2026-08-23", "2026-08-24"],
        sunday,
      ),
      2,
    );
  });
});

test("uses the Taiwan Monday even while UTC is still Sunday", () => {
  withTaipeiTimeZone(() => {
    const taiwanMonday = new Date("2026-08-16T16:30:00.000Z");
    assert.equal(localDateKey(taiwanMonday), "2026-08-17");
    assert.equal(
      studyDaysThisWeek(
        ["2026-08-16", "2026-08-17", "2026-08-23", "2026-08-24"],
        taiwanMonday,
      ),
      2,
    );
  });
});
