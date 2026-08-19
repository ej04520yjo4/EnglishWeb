import assert from "node:assert/strict";
import test from "node:test";
import { buildVocabularyWeaknesses } from "../app/daily-learning.ts";
import { createEmptyVocabularyEvidence } from "../app/vocabulary-progress.ts";
import {
  createDailySession,
  markDailyWeaknessCompleted,
  markDailySessionStep,
  nextDailySessionStep,
  remainingDailyWeaknessLexemeIds,
  restoreDailySession,
  summarizeDailySession,
} from "../app/daily-session.ts";

const targets = {
  schemaVersion: 1,
  status: "partial_review_required",
  completionLevel: "A2",
  goals: {
    totalLexemes: 3000,
    activeLexemes: 1500,
    receptiveLexemes: 1500,
    a1Cumulative: { totalLexemes: 1200, activeLexemes: 700, receptiveLexemes: 500 },
    a2Cumulative: { totalLexemes: 3000, activeLexemes: 1500, receptiveLexemes: 1500 },
  },
  entries: [
    {
      lexemeId: "because",
      lemma: "because",
      sourceLexemeIds: ["because"],
      targetLevel: "A2",
      masteryTarget: "active",
      curriculumPriority: 1,
      topics: ["test"],
      sourceRefs: [],
      qaStatus: "pilot_review_required",
    },
    {
      lexemeId: "water",
      lemma: "water",
      sourceLexemeIds: ["water"],
      targetLevel: "A1",
      masteryTarget: "active",
      curriculumPriority: 2,
      topics: ["test"],
      sourceRefs: [],
      qaStatus: "pilot_review_required",
    },
  ],
};

test("weakness ranking prioritizes repeated spelling errors", () => {
  const because = createEmptyVocabularyEvidence();
  because.lastSeenAt = "2026-08-07T01:00:00.000Z";
  because.recognitionAttemptEvidenceIds = ["r1", "r2"];
  because.recognitionCorrectEvidenceIds = ["r1"];
  because.spellingAttemptEvidenceIds = ["s1", "s2", "s3"];
  because.spellingCorrectEvidenceIds = ["s1"];
  because.applicationAttemptEvidenceIds = ["a1"];

  const weaknesses = buildVocabularyWeaknesses(
    { because },
    targets,
  );

  assert.equal(weaknesses.length, 1);
  assert.equal(weaknesses[0].lexemeId, "because");
  assert.equal(weaknesses[0].focus, "拼寫");
  assert.equal(weaknesses[0].wrongAttempts, 4);
  assert.equal(weaknesses[0].totalAttempts, 6);
});

test("weakness center ignores correct-only and non-target evidence", () => {
  const water = createEmptyVocabularyEvidence();
  water.recognitionAttemptEvidenceIds = ["r1", "r2"];
  water.recognitionCorrectEvidenceIds = ["r1", "r2"];
  water.spellingAttemptEvidenceIds = ["s1"];
  water.spellingCorrectEvidenceIds = ["s1"];
  water.applicationAttemptEvidenceIds = ["a1"];
  water.applicationCorrectEvidenceIds = ["a1"];

  const unknown = createEmptyVocabularyEvidence();
  unknown.spellingAttemptEvidenceIds = ["s2"];

  assert.deepEqual(
    buildVocabularyWeaknesses({ water, unknown }, targets),
    [],
  );
});


test("daily session follows review, lesson, weakness, then summary", () => {
  let session = createDailySession({
    startedAt: 1_000,
    level: "A1",
    lessonId: "a1-u1-l1",
    reviewCount: 4,
    weaknessLexemeIds: ["i", "be", "name"],
    beforeVocabulary: { exposed: 10, receptive: 4, active: 2 },
  });
  assert.equal(session.version, 2);
  assert.equal(session.level, "A1");
  assert.match(session.localDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(nextDailySessionStep(session), "review");
  session = markDailySessionStep(session, "review");
  assert.equal(nextDailySessionStep(session), "lesson");
  session = markDailySessionStep(session, "lesson");
  assert.equal(nextDailySessionStep(session), "weakness");
  for (const lexemeId of session.weaknessLexemeIds) {
    session = markDailyWeaknessCompleted(session, lexemeId);
  }
  assert.equal(nextDailySessionStep(session), "summary");
});

test("restores only an unfinished session from the same local day", () => {
  let session = createDailySession({
    startedAt: Date.parse("2026-08-20T02:00:00.000Z"),
    localDate: "2026-08-20",
    level: "A1",
    lessonId: "a1-u1-l1",
    reviewCount: 2,
    weaknessLexemeIds: ["i"],
    beforeVocabulary: { exposed: 1, receptive: 0, active: 0 },
  });
  session = markDailySessionStep(session, "review");
  const serialized = JSON.stringify(session);
  assert.deepEqual(
    restoreDailySession(serialized, "2026-08-20"),
    session,
  );
  assert.equal(restoreDailySession(serialized, "2026-08-21"), null);
  assert.equal(restoreDailySession("not-json", "2026-08-20"), null);
});

test("restoring a session does not create or duplicate learning evidence", () => {
  const session = markDailySessionStep(
    createDailySession({
      localDate: "2026-08-20",
      level: "A1",
      lessonId: "a1-u1-l1",
      reviewCount: 1,
      weaknessLexemeIds: ["i"],
      beforeVocabulary: { exposed: 3, receptive: 1, active: 0 },
    }),
    "review",
  );
  const progressBefore = {
    vocabularyProgress: {
      i: { spellingAttemptEvidenceIds: ["s1"] },
    },
    completedLessonIds: [],
    passedUnitIds: [],
  };
  const restored = restoreDailySession(
    JSON.stringify(session),
    "2026-08-20",
  );
  assert.ok(restored);
  assert.deepEqual(progressBefore, {
    vocabularyProgress: {
      i: { spellingAttemptEvidenceIds: ["s1"] },
    },
    completedLessonIds: [],
    passedUnitIds: [],
  });
});

test("daily session skips empty review and weakness stages", () => {
  let session = createDailySession({
    level: "A1",
    lessonId: "a1-u1-l1",
    reviewCount: 0,
    weaknessLexemeIds: [],
    beforeVocabulary: { exposed: 0, receptive: 0, active: 0 },
  });
  assert.equal(nextDailySessionStep(session), "lesson");
  session = markDailySessionStep(session, "lesson");
  assert.equal(nextDailySessionStep(session), "summary");
});

test("daily session keeps only three unique weakness targets", () => {
  const session = createDailySession({
    level: "A1",
    lessonId: "a1-u1-l1",
    reviewCount: 0,
    weaknessLexemeIds: ["i", "i", "be", "name", "water"],
    beforeVocabulary: { exposed: 0, receptive: 0, active: 0 },
  });
  assert.deepEqual(session.weaknessLexemeIds, ["i", "be", "name"]);
});

test("daily summary reports non-negative mastery gains", () => {
  let session = createDailySession({
    startedAt: 0,
    level: "A1",
    lessonId: "a1-u1-l1",
    reviewCount: 2,
    weaknessLexemeIds: ["i"],
    beforeVocabulary: { exposed: 10, receptive: 6, active: 3 },
  });
  session = markDailySessionStep(session, "review");
  session = markDailySessionStep(session, "lesson");
  session = markDailyWeaknessCompleted(session, "i");
  const summary = summarizeDailySession(
    session,
    { exposed: 12, receptive: 7, active: 2 },
    120_000,
  );
  assert.equal(summary.reviewCount, 2);
  assert.equal(summary.lessonCompleted, true);
  assert.equal(summary.weaknessCount, 1);
  assert.equal(summary.exposedDelta, 2);
  assert.equal(summary.receptiveDelta, 1);
  assert.equal(summary.activeDelta, 0);
  assert.equal(summary.complete, true);
});

test("restores an A1 daily session independently from a selected A2 UI", () => {
  const selectedLevel = "A2";
  const session = createDailySession({
    localDate: "2026-08-20",
    level: "A1",
    lessonId: "a1-u1-l1",
    reviewCount: 0,
    weaknessLexemeIds: [],
    beforeVocabulary: { exposed: 0, receptive: 0, active: 0 },
  });
  const restored = restoreDailySession(JSON.stringify(session), "2026-08-20");
  assert.equal(selectedLevel, "A2");
  assert.equal(restored?.level, "A1");
  assert.equal(restored?.lessonId, "a1-u1-l1");
});

test("restores weakness practice from the first unfinished lexeme", () => {
  let session = createDailySession({
    localDate: "2026-08-20",
    level: "A1",
    lessonId: "a1-u1-l1",
    reviewCount: 0,
    weaknessLexemeIds: ["i", "be", "name"],
    beforeVocabulary: { exposed: 0, receptive: 0, active: 0 },
  });
  session = markDailySessionStep(session, "lesson");
  session = markDailyWeaknessCompleted(session, "i");
  const restored = restoreDailySession(
    JSON.stringify(session),
    "2026-08-20",
  );
  assert.ok(restored);
  assert.deepEqual(restored.completedWeaknessLexemeIds, ["i"]);
  assert.deepEqual(remainingDailyWeaknessLexemeIds(restored), ["be", "name"]);
  assert.equal(nextDailySessionStep(restored), "weakness");

  const afterBe = markDailyWeaknessCompleted(restored, "be");
  const afterName = markDailyWeaknessCompleted(afterBe, "name");
  assert.deepEqual(afterName.completedWeaknessLexemeIds, ["i", "be", "name"]);
  assert.equal(nextDailySessionStep(afterName), "summary");
});

test("sanitizes duplicate and unknown completed weakness IDs", () => {
  const session = createDailySession({
    localDate: "2026-08-20",
    level: "A1",
    lessonId: "a1-u1-l1",
    reviewCount: 0,
    weaknessLexemeIds: ["i", "be", "name"],
    beforeVocabulary: { exposed: 0, receptive: 0, active: 0 },
  });
  const restored = restoreDailySession(
    JSON.stringify({
      ...session,
      completedWeaknessLexemeIds: ["i", "i", "unknown"],
      completedSteps: ["lesson", "weakness"],
    }),
    "2026-08-20",
  );
  assert.ok(restored);
  assert.deepEqual(restored.completedWeaknessLexemeIds, ["i"]);
  assert.deepEqual(restored.completedSteps, ["lesson"]);
  assert.deepEqual(remainingDailyWeaknessLexemeIds(restored), ["be", "name"]);
});

test("rejects legacy daily session v1 instead of guessing its level", () => {
  assert.equal(
    restoreDailySession(
      JSON.stringify({
        version: 1,
        localDate: "2026-08-20",
        startedAt: 1,
        lessonId: "a1-u1-l1",
        reviewCount: 0,
        weaknessLexemeIds: [],
        completedSteps: [],
        beforeVocabulary: { exposed: 0, receptive: 0, active: 0 },
      }),
      "2026-08-20",
    ),
    null,
  );
});
