import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseA1MvpCsv } from "../app/a1-mvp-data.ts";
import {
  buildVocabularyDataset,
} from "../app/vocabulary-groups.ts";
import {
  deriveVocabularyMasteryState,
  createEmptyVocabularyEvidence,
} from "../app/vocabulary-progress.ts";
import {
  buildReferenceRecognitionQueue,
  recordReferenceRecognitionResult,
  translationsShareSemanticPart,
} from "../app/reference-vocabulary-practice.ts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));

const a1Rows = parseA1MvpCsv(readText("public/data/a1-course-v3.csv"));
const dataset = buildVocabularyDataset(
  readJson("public/data/vocabulary-groups-v1.json"),
  readJson("public/data/reference-vocabulary-v1.json"),
  a1Rows,
);
const targets = readJson("public/data/vocabulary-targets-v1.json");

const referenceTargetIds = new Set(
  targets.entries
    .filter(
      (entry) =>
        entry.masteryTarget === "receptive" &&
        entry.sourceRefs.length > 0 &&
        entry.sourceRefs.every((source) => source.sourceType === "reference"),
    )
    .map((entry) => entry.lexemeId),
);

const questionFor = (groupId, progress = {}, studyDate = "2026-10-01") => {
  const [question] = buildReferenceRecognitionQueue({
    dataset,
    targets,
    progress,
    groupId,
    studyDate,
  });
  assert.ok(question, `expected a reference question in ${groupId}`);
  return question;
};

const questionForLexeme = (
  groupId,
  lexemeId,
  progress = {},
  studyDate = "2026-10-01",
) => {
  const question = buildReferenceRecognitionQueue({
    dataset,
    targets,
    progress,
    groupId,
    studyDate,
  }).find((candidate) => candidate.lexemeId === lexemeId);
  assert.ok(question, `expected ${lexemeId} in ${groupId}`);
  return question;
};

const record = (progress, input) =>
  recordReferenceRecognitionResult(progress, {
    dataset,
    targets,
    ...input,
  });

test("covers all 24 reference-only receptive targets in deterministic batches", () => {
  assert.equal(referenceTargetIds.size, 24);
  let progress = {};
  const seen = new Set();

  for (let day = 1; day <= 12 && seen.size < 24; day += 1) {
    const studyDate = `2026-10-${String(day).padStart(2, "0")}`;
    for (const group of dataset.groups) {
      const questions = buildReferenceRecognitionQueue({
        dataset,
        targets,
        progress,
        groupId: group.id,
        studyDate,
      });
      assert.ok(questions.length <= 5);
      for (const question of questions) {
        seen.add(question.lexemeId);
        progress = record(progress, {
          question,
          selectedAnswer: question.answer,
          studiedAt: `${studyDate}T09:00:00.000Z`,
          studyDate,
        });
      }
    }
  }

  assert.deepEqual([...seen].sort(), [...referenceTargetIds].sort());
});

test("queue is stable, bounded, and keeps the answer in a unique distributed option set", () => {
  const progress = {};
  const progressBefore = structuredClone(progress);
  const first = buildReferenceRecognitionQueue({
    dataset,
    targets,
    progress,
    groupId: "family-members",
    studyDate: "2026-10-01",
    limit: 50,
  });
  const second = buildReferenceRecognitionQueue({
    dataset,
    targets,
    progress,
    groupId: "family-members",
    studyDate: "2026-10-01",
    limit: 50,
  });

  assert.deepEqual(first, second);
  assert.ok(first.length <= 5);
  assert.ok(first.length > 0);
  const answerPositions = new Set();
  first.forEach((question) => {
    assert.equal(question.id.includes(question.lexemeId), true);
    assert.equal(question.id.includes(question.studyDate), true);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.ok(question.options.includes(question.answer));
    answerPositions.add(question.options.indexOf(question.answer));
    assert.equal(question.qaStatus, "reference_review_required");
  });
  for (const group of dataset.groups) {
    buildReferenceRecognitionQueue({
      dataset,
      targets,
      progress: {},
      groupId: group.id,
      studyDate: "2026-10-01",
      limit: 50,
    }).forEach((question) =>
      answerPositions.add(question.options.indexOf(question.answer)),
    );
  }
  assert.ok(answerPositions.size > 1, "答案位置不可全部固定在同一格");
  assert.deepEqual(progress, progressBefore);
});

test("keeps semantic variants out of distractors without losing all 24 questions", () => {
  const times = buildReferenceRecognitionQueue({
    dataset,
    targets,
    progress: {},
    groupId: "times-of-day",
    studyDate: "2026-10-01",
    limit: 50,
  });
  const evening = times.find((question) => question.lexemeId === "evening");
  assert.ok(evening);
  assert.equal(evening.options.length, 4);
  assert.ok(
    evening.options
      .filter((option) => option !== evening.answer)
      .every((option) => !translationsShareSemanticPart(evening.answer, option)),
  );

  const family = buildReferenceRecognitionQueue({
    dataset,
    targets,
    progress: {},
    groupId: "family-members",
    studyDate: "2026-10-01",
    limit: 50,
  });
  const parent = family.find((question) => question.lexemeId === "parent");
  assert.ok(parent);
  assert.equal(parent.options.includes("爸爸／父親"), false);
  assert.equal(parent.options.includes("媽媽／母親"), false);
  for (const lexemeId of ["parent", "father"]) {
    const question = family.find((candidate) => candidate.lexemeId === lexemeId);
    assert.ok(question);
    assert.equal(question.options.length, 4);
    assert.ok(
      question.options
        .filter((option) => option !== question.answer)
        .every((option) => !translationsShareSemanticPart(question.answer, option)),
    );
  }
});

test("same-day submissions are deduplicated and a wrong first answer cannot be repaired", () => {
  const question = questionFor("days-of-week");
  const wrong = record({}, {
    question,
    selectedAnswer: question.options.find((option) => option !== question.answer),
    studiedAt: "2026-10-01T09:00:00.000Z",
    studyDate: "2026-10-01",
  });
  assert.equal(wrong[question.lexemeId].recognitionAttemptEvidenceIds.length, 1);
  assert.equal(wrong[question.lexemeId].recognitionCorrectEvidenceIds.length, 0);

  const sameDayCorrect = record(wrong, {
    question,
    selectedAnswer: question.answer,
    studiedAt: "2026-10-01T10:00:00.000Z",
    studyDate: "2026-10-01",
  });
  assert.deepEqual(sameDayCorrect, wrong);

  const nextDayQuestion = questionForLexeme(
    "days-of-week",
    question.lexemeId,
    wrong,
    "2026-10-02",
  );
  const nextDayCorrect = record(wrong, {
    question: nextDayQuestion,
    selectedAnswer: question.answer,
    studiedAt: "2026-10-02T09:00:00.000Z",
    studyDate: "2026-10-02",
  });
  assert.equal(
    nextDayCorrect[question.lexemeId].recognitionCorrectEvidenceIds.length,
    1,
  );
});

test("partly learned words keep curriculum priority ahead of later unseen words", () => {
  const question = questionFor("days-of-week");
  const progress = recordReferenceRecognitionResult({}, {
    dataset,
    targets,
    question,
    selectedAnswer: question.answer,
    studiedAt: "2026-10-01T09:00:00.000Z",
    studyDate: "2026-10-01",
  });
  const nextDay = questionFor("days-of-week", progress, "2026-10-02");
  assert.equal(nextDay.lexemeId, question.lexemeId);
});

test("two clean dates become receptive without inventing active evidence", () => {
  const question = questionFor("family-members");
  let progress = {};
  for (const date of ["2026-10-01", "2026-10-02"]) {
    const datedQuestion = questionForLexeme(
      "family-members",
      question.lexemeId,
      progress,
      date,
    );
    progress = record(progress, {
      question: datedQuestion,
      selectedAnswer: datedQuestion.answer,
      studiedAt: `${date}T09:00:00.000Z`,
      studyDate: date,
    });
  }

  const evidence = progress[question.lexemeId];
  assert.equal(deriveVocabularyMasteryState(evidence), "receptive");
  assert.equal(evidence.exposureEvidenceIds.length, 0);
  assert.equal(evidence.spellingAttemptEvidenceIds.length, 0);
  assert.equal(evidence.applicationAttemptEvidenceIds.length, 0);
  assert.equal(evidence.applicationCorrectEvidenceIds.length, 0);
});

test("a receptive word can return on a later day, after unfinished words", () => {
  const first = questionFor("days-of-week", {}, "2026-10-01");
  let progress = {};
  for (const date of ["2026-10-01", "2026-10-02"]) {
    const datedQuestion = questionForLexeme(
      "days-of-week",
      first.lexemeId,
      progress,
      date,
    );
    progress = record(progress, {
      question: datedQuestion,
      selectedAnswer: datedQuestion.answer,
      studiedAt: `${date}T09:00:00.000Z`,
      studyDate: date,
    });
  }
  assert.equal(deriveVocabularyMasteryState(progress[first.lexemeId]), "receptive");

  const queue = buildReferenceRecognitionQueue({
    dataset,
    targets,
    progress,
    groupId: "days-of-week",
    studyDate: "2026-10-03",
    limit: 5,
  });
  assert.ok(queue.some((question) => question.lexemeId === first.lexemeId));
  assert.notEqual(queue[0].lexemeId, first.lexemeId);
  assert.ok(
    queue.findIndex((question) => question.lexemeId === first.lexemeId) > 0,
  );
});

test("source, QA, taught-content, and insufficient-option guards fail closed", () => {
  const times = buildReferenceRecognitionQueue({
    dataset,
    targets,
    progress: {},
    groupId: "times-of-day",
    studyDate: "2026-10-01",
    limit: 50,
  });
  assert.ok(times.every((question) => !["morning", "afternoon"].includes(question.lexemeId)));

  const badQaDataset = structuredClone(dataset);
  const days = badQaDataset.groups.find((group) => group.id === "days-of-week");
  days.items = days.items.map((item) =>
    item.lexemeId === "wednesday"
      ? { ...item, qaStatus: "pilot_review_required" }
      : item,
  );
  assert.ok(
    !buildReferenceRecognitionQueue({
      dataset: badQaDataset,
      targets,
      progress: {},
      groupId: "days-of-week",
      studyDate: "2026-10-01",
      limit: 50,
    }).some((question) => question.lexemeId === "wednesday"),
  );

  const badSourceTargets = structuredClone(targets);
  badSourceTargets.entries.find((entry) => entry.lexemeId === "wednesday").sourceRefs = [
    {
      sourceName: "future course",
      sourceVersion: "future-v1",
      sourceType: "curriculum",
      license: "pending",
      reference: "future-1",
    },
  ];
  assert.ok(
    !buildReferenceRecognitionQueue({
      dataset,
      targets: badSourceTargets,
      progress: {},
      groupId: "days-of-week",
      studyDate: "2026-10-01",
      limit: 50,
    }).some((question) => question.lexemeId === "wednesday"),
  );

  const tooSmallDataset = structuredClone(dataset);
  tooSmallDataset.groups = [
    {
      ...tooSmallDataset.groups.find((group) => group.id === "days-of-week"),
      items: tooSmallDataset.groups
        .find((group) => group.id === "days-of-week")
        .items.slice(0, 3),
    },
  ];
  assert.deepEqual(
    buildReferenceRecognitionQueue({
      dataset: tooSmallDataset,
      targets,
      progress: {},
      groupId: "days-of-week",
      studyDate: "2026-10-01",
    }),
    [],
  );
  assert.deepEqual(
    buildReferenceRecognitionQueue({
      dataset,
      targets,
      progress: {},
      groupId: "missing-group",
      studyDate: "2026-10-01",
    }),
    [],
  );
});

test("same-day cross-group questions share one recognition submission", () => {
  const family = dataset.groups.find((group) => group.id === "family-members");
  const duplicateDataset = structuredClone(dataset);
  duplicateDataset.groups.push({
    ...family,
    id: "family-members-copy",
  });
  const first = questionFor("family-members", {}, "2026-10-01");
  const duplicate = buildReferenceRecognitionQueue({
    dataset: duplicateDataset,
    targets,
    progress: {},
    groupId: "family-members-copy",
    studyDate: "2026-10-01",
  }).find((question) => question.lexemeId === first.lexemeId);
  assert.ok(duplicate);

  const progress = record({}, {
    question: first,
    selectedAnswer: first.answer,
    studiedAt: "2026-10-01T09:00:00.000Z",
    studyDate: "2026-10-01",
  });
  assert.ok(
    !buildReferenceRecognitionQueue({
      dataset: duplicateDataset,
      targets,
      progress,
      groupId: "family-members-copy",
      studyDate: "2026-10-01",
    }).some((question) => question.lexemeId === duplicate.lexemeId),
  );
});

test("rejects mismatched study dates and invalid studiedAt without mutating progress", () => {
  const question = questionFor("days-of-week", {}, "2026-10-01");
  const progress = {};
  assert.throws(
    () =>
      record(progress, {
        question,
        selectedAnswer: question.answer,
        studiedAt: "2026-10-01T09:00:00.000Z",
        studyDate: "2026-10-02",
      }),
    /題目日期已變更/,
  );
  assert.throws(
    () =>
      record(progress, {
        question,
        selectedAnswer: question.answer,
        studiedAt: "not-a-date",
        studyDate: "2026-10-01",
      }),
    /作答時間格式不正確/,
  );
  assert.deepEqual(progress, {});
});

test("rejects impossible calendar dates", () => {
  assert.throws(
    () =>
      buildReferenceRecognitionQueue({
        dataset,
        targets,
        progress: {},
        groupId: "days-of-week",
        studyDate: "2026-02-30",
      }),
    /日期不存在/,
  );
  assert.throws(
    () =>
      buildReferenceRecognitionQueue({
        dataset,
        targets,
        progress: {},
        groupId: "days-of-week",
        studyDate: "2026-13-01",
      }),
    /日期不存在/,
  );
});

test("rechecks formal, nonexistent, and tampered questions against the source", () => {
  const question = questionFor("days-of-week");
  const baseInput = {
    selectedAnswer: question.answer,
    studiedAt: "2026-10-01T09:00:00.000Z",
    studyDate: "2026-10-01",
  };

  assert.throws(
    () =>
      record({}, {
        ...baseInput,
        question: {
          ...question,
          lexemeId: "monday",
          id: question.id.replace("wednesday", "monday"),
        },
      }),
    /不是合法的待複核資料/,
  );
  assert.throws(
    () =>
      record({}, {
        ...baseInput,
        question: {
          ...question,
          lexemeId: "not-a-real-reference-word",
          id: question.id.replace("wednesday", "not-a-real-reference-word"),
        },
      }),
    /不是合法的待複核資料/,
  );
  assert.throws(
    () =>
      record({}, {
        ...baseInput,
        question: { ...question, answer: "被竄改的答案" },
      }),
    /不是合法的待複核資料/,
  );
});

test("rejects invalid options and leaves the input progress untouched", () => {
  const question = questionFor("days-of-week");
  const progress = {
    [question.lexemeId]: createEmptyVocabularyEvidence(),
  };
  const before = structuredClone(progress);
  assert.throws(
    () =>
      record(progress, {
        question,
        selectedAnswer: "不是本題選項",
        studyDate: "2026-10-01",
        studiedAt: "2026-10-01T09:00:00.000Z",
      }),
    /不是本題選項/,
  );
  assert.deepEqual(progress, before);
});

