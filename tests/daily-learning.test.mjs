import assert from "node:assert/strict";
import test from "node:test";
import { buildVocabularyWeaknesses } from "../app/daily-learning.ts";
import { createEmptyVocabularyEvidence } from "../app/vocabulary-progress.ts";

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
