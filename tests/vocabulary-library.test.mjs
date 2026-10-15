import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildVocabularyCoverageReport,
  loadVocabularyTargets,
  parseVocabularyTargets,
  validateVocabularyTargets,
} from "../app/vocabulary-targets.ts";
import {
  buildVocabularyLibraryPage,
  buildVocabularyLibraryPracticeQuestion,
  buildVocabularyLibraryPracticeQueue,
  entriesShareSemanticMeaning,
  maskSpellingAnswerInDefinition,
  parseVocabularyLibrary,
  recordVocabularyLibraryPracticeResult,
  searchVocabularyLibrary,
  validateVocabularyLibrary,
} from "../app/vocabulary-library.ts";
import { deriveVocabularyMasteryState } from "../app/vocabulary-progress.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const legacyTargets = readJson("public/data/vocabulary-targets-v1.json");

const sourceFor = (lexemeId) => ({
  sourceName: "Synthetic Open Lexicon",
  sourceVersion: "synthetic-1",
  sourceType: "open_lexicon",
  license: "CC BY-SA 4.0",
  reference: `${lexemeId}:entry`,
  attribution: "EnglishWeb test fixture",
});

const makeTargets = (specs) => ({
  schemaVersion: 1,
  status: "partial_review_required",
  completionLevel: "A2",
  goals: {
    totalLexemes: specs.length,
    activeLexemes: specs.filter((spec) => spec.masteryTarget === "active").length,
    receptiveLexemes: specs.filter((spec) => spec.masteryTarget === "receptive").length,
    a1Cumulative: { totalLexemes: specs.length, activeLexemes: 0, receptiveLexemes: 0 },
    a2Cumulative: { totalLexemes: specs.length, activeLexemes: 0, receptiveLexemes: 0 },
  },
  entries: specs.map((spec, index) => ({
    lexemeId: spec.lexemeId,
    lemma: spec.lexemeId,
    sourceLexemeIds: [spec.lexemeId],
    targetLevel: spec.targetLevel ?? "A1",
    masteryTarget: spec.masteryTarget ?? "receptive",
    curriculumPriority: index + 1,
    topics: [spec.topic ?? "fixture"],
    sourceRefs: [sourceFor(spec.lexemeId)],
    qaStatus: "pilot_review_required",
  })),
});

const makeLibrary = (targets, specs) => ({
  schemaVersion: 1,
  sourceVersion: "vocabulary-library-v1",
  entries: targets.entries.map((target) => {
    const spec = specs.find((candidate) => candidate.lexemeId === target.lexemeId);
    return {
      lexemeId: target.lexemeId,
      displayEnglish: target.lexemeId,
      translationZhTw: spec?.translationZhTw ?? `意思${target.lexemeId}`,
      partOfSpeech: "noun 名詞",
      definitionEn: spec?.definitionEn ?? `A test definition for ${target.lexemeId}.`,
      usageNoteZhTw: "僅供測試。",
      sourceRefs: structuredClone(target.sourceRefs),
      qaStatus: "pilot_review_required",
      phoneticStatus: "pending",
      audioStatus: "fallback",
      batchId: "vocab-batch-001",
      ...(spec?.meaningVariants ? { meaningVariants: spec.meaningVariants } : {}),
      ...(spec?.wordnetSynsetIds
        ? { wordnetSynsetIds: spec.wordnetSynsetIds }
        : {}),
    };
  }),
});

const fixtureSpecs = [
  { lexemeId: "alpha", translationZhTw: "第一個", definitionEn: "the first item", masteryTarget: "active" },
  { lexemeId: "beta", translationZhTw: "第二個", definitionEn: "the second item" },
  { lexemeId: "gamma", translationZhTw: "第三個", definitionEn: "the third item" },
  { lexemeId: "evening", translationZhTw: "晚上／傍晚", meaningVariants: ["晚上", "傍晚"], wordnetSynsetIds: ["time-of-day"], definitionEn: "the later part of the day" },
  { lexemeId: "night", translationZhTw: "晚上／夜晚", meaningVariants: ["晚上", "夜晚"], wordnetSynsetIds: ["time-of-day"], definitionEn: "the dark part of the day" },
  { lexemeId: "morning", translationZhTw: "早上", wordnetSynsetIds: ["morning"], definitionEn: "the early part of the day" },
  { lexemeId: "noon", translationZhTw: "中午", wordnetSynsetIds: ["noon"], definitionEn: "the middle of the day" },
  { lexemeId: "afternoon", translationZhTw: "下午", wordnetSynsetIds: ["afternoon"], definitionEn: "the part of the day after noon" },
  { lexemeId: "parent", translationZhTw: "父母／家長", meaningVariants: ["父親", "母親"], wordnetSynsetIds: ["parent"], definitionEn: "a person's father or mother" },
  { lexemeId: "father", translationZhTw: "父親", wordnetSynsetIds: ["father"], definitionEn: "a male parent" },
  { lexemeId: "mother", translationZhTw: "母親", wordnetSynsetIds: ["mother"], definitionEn: "a female parent" },
];
const fixtureTargets = makeTargets(fixtureSpecs);
const fixtureLibrary = makeLibrary(fixtureTargets, fixtureSpecs);

const record = (progress, question, selectedAnswer, studyDate, options = {}) =>
  recordVocabularyLibraryPracticeResult(progress, {
    library: fixtureLibrary,
    targets: fixtureTargets,
    question,
    selectedAnswer,
    studyDate,
    studiedAt: `${studyDate}T10:00:00.000Z`,
    ...options,
  });

const makeStrictV2 = () => {
  const data = structuredClone(legacyTargets);
  data.schemaVersion = 2;
  data.status = "count_complete_review_required";
  let priority = data.entries.length + 1;
  let serial = 1;
  const serialWord = (value) => {
    let remainder = value;
    let suffix = "";
    while (remainder > 0) {
      remainder -= 1;
      suffix = String.fromCharCode(97 + (remainder % 26)) + suffix;
      remainder = Math.floor(remainder / 26);
    }
    return `vocab${suffix}`;
  };
  const append = (count, targetLevel, masteryTarget) => {
    for (let index = 0; index < count; index += 1) {
      const lexemeId = serialWord(serial);
      data.entries.push({
        lexemeId,
        lemma: lexemeId,
        sourceLexemeIds: [lexemeId],
        targetLevel,
        masteryTarget,
        curriculumPriority: priority,
        topics: ["synthetic-batch-001"],
        sourceRefs: [
          {
            sourceName: "Synthetic Open Lexicon",
            sourceVersion: "synthetic-1",
            sourceType: "open_lexicon",
            license: "CC BY-SA 4.0",
            reference: `${lexemeId}:entry`,
            artifactSha256: "a".repeat(64),
            attribution: "EnglishWeb test fixture",
          },
        ],
        qaStatus: "pilot_review_required",
      });
      priority += 1;
      serial += 1;
    }
  };
  append(634, "A1", "active");
  append(476, "A1", "receptive");
  append(758, "A2", "active");
  append(1000, "A2", "receptive");
  return data;
};

test("accepts the protected v1 catalog and validates the strict v2 3000 split", () => {
  assert.equal(validateVocabularyTargets(legacyTargets).valid, true);
  const v2 = makeStrictV2();
  const report = validateVocabularyTargets(v2);
  assert.deepEqual(report, { valid: true, errors: [] });
  assert.equal(JSON.stringify(v2.entries.slice(0, 132)), JSON.stringify(legacyTargets.entries));
  const coverage = buildVocabularyCoverageReport(v2);
  assert.deepEqual(
    {
      total: coverage.targetEntries,
      active: coverage.activeEntries,
      receptive: coverage.receptiveEntries,
      a1Active: coverage.a1ActiveEntries,
      a1Receptive: coverage.a1ReceptiveEntries,
      a2Active: coverage.a2StageActiveEntries,
      a2Receptive: coverage.a2StageReceptiveEntries,
    },
    { total: 3000, active: 1500, receptive: 1500, a1Active: 700, a1Receptive: 500, a2Active: 800, a2Receptive: 1000 },
  );
  const wrongStatus = structuredClone(v2);
  wrongStatus.status = "partial_review_required";
  assert.equal(validateVocabularyTargets(wrongStatus).valid, false);
  const wrongCount = structuredClone(v2);
  wrongCount.entries.at(-1).masteryTarget = "active";
  assert.equal(validateVocabularyTargets(wrongCount).valid, false);
});

test("loads only the v2 runtime target URL without silently falling back to v1", async () => {
  const v2 = makeStrictV2();
  const requested = [];
  const loaded = await loadVocabularyTargets(async (url) => {
    requested.push(url);
    return new Response(JSON.stringify(v2), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  assert.deepEqual(requested, ["/data/vocabulary-targets-v2.json"]);
  assert.equal(loaded.schemaVersion, 2);
  await assert.rejects(
    () =>
      loadVocabularyTargets(async () =>
        new Response(JSON.stringify(legacyTargets), { status: 200 }),
      ),
    /schemaVersion 2/,
  );
  await assert.rejects(
    () =>
      loadVocabularyTargets(async (url) => {
        requested.push(url);
        return new Response("missing", { status: 404 });
      }),
    /載入失敗/,
  );
  assert.equal(requested.at(-1), "/data/vocabulary-targets-v2.json");
});

test("validates an exact library-to-target join and rejects source tampering", () => {
  assert.deepEqual(validateVocabularyLibrary(fixtureLibrary, fixtureTargets), {
    valid: true,
    errors: [],
  });
  assert.doesNotThrow(() => parseVocabularyLibrary(fixtureLibrary, fixtureTargets));
  const tampered = structuredClone(fixtureLibrary);
  tampered.entries[0].sourceRefs[0].reference = "different:source";
  assert.equal(validateVocabularyLibrary(tampered, fixtureTargets).valid, false);
  assert.throws(() => parseVocabularyLibrary(tampered, fixtureTargets), /sourceRefs|來源/);
  const missing = structuredClone(fixtureLibrary);
  missing.entries.pop();
  assert.equal(validateVocabularyLibrary(missing, fixtureTargets).valid, false);
  const claimedAudio = structuredClone(fixtureLibrary);
  claimedAudio.entries[0].phoneticStatus = "reviewed";
  claimedAudio.entries[0].audioStatus = "ready";
  assert.equal(validateVocabularyLibrary(claimedAudio, fixtureTargets).valid, false);
});

test("searches normalized English, Chinese, definition and source metadata and paginates deterministically", () => {
  assert.deepEqual(
    searchVocabularyLibrary(fixtureLibrary, fixtureTargets, "  EVENING  ").map((item) => item.entry.lexemeId),
    ["evening"],
  );
  assert.deepEqual(
    searchVocabularyLibrary(fixtureLibrary, fixtureTargets, "父親").map((item) => item.entry.lexemeId),
    ["parent", "father"],
  );
  assert.deepEqual(
    searchVocabularyLibrary(fixtureLibrary, fixtureTargets, "later   part").map((item) => item.entry.lexemeId),
    ["evening"],
  );
  assert.deepEqual(
    searchVocabularyLibrary(fixtureLibrary, fixtureTargets, "synthetic-1").map((item) => item.entry.lexemeId),
    fixtureSpecs.map((spec) => spec.lexemeId),
  );
  const page = buildVocabularyLibraryPage({
    library: fixtureLibrary,
    targets: fixtureTargets,
    page: 99,
    pageSize: 3,
  });
  assert.equal(page.page, 4);
  assert.equal(page.totalPages, 4);
  assert.equal(page.entries.length, 2);
  assert.equal(page.entries[0].entry.lexemeId, "father");
});

test("builds stable recognition choices and excludes shared Chinese meaning and WordNet synsets", () => {
  const before = structuredClone({});
  const first = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress: before,
    studyDate: "2026-10-15",
    mode: "recognition",
    limit: 5,
  });
  const second = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress: before,
    studyDate: "2026-10-15",
    mode: "recognition",
    limit: 5,
  });
  assert.equal(first.length, 5);
  assert.deepEqual(first, second);
  assert.deepEqual(before, {});
  assert.ok(new Set(first.map((question) => question.options.indexOf(question.answer))).size > 1);
  for (const question of first) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.ok(question.options.includes(question.answer));
  }
  const evening = first.find((question) => question.lexemeId === "evening");
  assert.ok(evening);
  assert.ok(!evening.options.includes("晚上／夜晚"));
  const parentSpecs = [
    fixtureSpecs.find((spec) => spec.lexemeId === "parent"),
    fixtureSpecs.find((spec) => spec.lexemeId === "father"),
    fixtureSpecs.find((spec) => spec.lexemeId === "mother"),
    ...fixtureSpecs.filter((spec) => !["parent", "father", "mother"].includes(spec.lexemeId)),
  ];
  const parentTargets = makeTargets(parentSpecs);
  const parentLibrary = makeLibrary(parentTargets, parentSpecs);
  const parent = buildVocabularyLibraryPracticeQueue({
    library: parentLibrary,
    targets: parentTargets,
    progress: {},
    studyDate: "2026-10-15",
    mode: "recognition",
    limit: 5,
  }).find((question) => question.lexemeId === "parent");
  assert.ok(parent);
  assert.ok(!parent.options.includes("父親"));
  assert.ok(!parent.options.includes("母親"));
  assert.equal(
    entriesShareSemanticMeaning(fixtureLibrary.entries[3], fixtureLibrary.entries[4]),
    true,
  );
});

test("builds the same validated question for a direct card as for the queue", () => {
  const queued = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress: {},
    studyDate: "2026-10-15",
    mode: "recognition",
    limit: 5,
  }).find((question) => question.lexemeId === "alpha");
  const direct = buildVocabularyLibraryPracticeQuestion({
    library: fixtureLibrary,
    targets: fixtureTargets,
    lexemeId: "alpha",
    studyDate: "2026-10-15",
    mode: "recognition",
  });
  assert.ok(queued);
  assert.deepEqual(direct, queued);
  assert.equal(direct?.options.includes("其他意思"), false);
  assert.equal(new Set(direct?.options).size, 4);
});

test("a direct card outside the first five cannot gain same-day clean credit twice", () => {
  const queue = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress: {},
    studyDate: "2026-10-15",
    mode: "recognition",
    limit: 5,
  });
  const direct = buildVocabularyLibraryPracticeQuestion({
    library: fixtureLibrary,
    targets: fixtureTargets,
    lexemeId: "parent",
    studyDate: "2026-10-15",
    mode: "recognition",
  });
  assert.ok(direct);
  assert.equal(queue.some((question) => question.lexemeId === "parent"), false);
  const wrong = direct.options.find((option) => option !== direct.answer);
  assert.ok(wrong);
  let progress = record({}, direct, wrong, "2026-10-15");
  const afterWrong = progress;
  progress = record(progress, direct, direct.answer, "2026-10-15");
  assert.strictEqual(progress, afterWrong);
  assert.equal(progress.parent.recognitionAttemptEvidenceIds.length, 1);
  assert.equal(progress.parent.recognitionCorrectEvidenceIds.length, 0);
});

test("fails closed when a question cannot obtain three distinct safe distractors", () => {
  const smallTargets = makeTargets(fixtureSpecs.slice(0, 3));
  const smallLibrary = makeLibrary(smallTargets, fixtureSpecs.slice(0, 3));
  assert.deepEqual(
    buildVocabularyLibraryPracticeQueue({
      library: smallLibrary,
      targets: smallTargets,
      progress: {},
      studyDate: "2026-10-15",
      mode: "recognition",
    }),
    [],
  );
  const qaFailure = structuredClone(fixtureLibrary);
  qaFailure.entries[0].qaStatus = "human_reviewed";
  assert.deepEqual(
    buildVocabularyLibraryPracticeQueue({
      library: qaFailure,
      targets: fixtureTargets,
      progress: {},
      studyDate: "2026-10-15",
      mode: "recognition",
    }),
    [],
  );
});

test("records recognition only once per lexeme and day, with cross-day receptive credit", () => {
  const recognitionQueue = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress: {},
    studyDate: "2026-10-15",
    mode: "recognition",
    limit: 11,
  });
  const alpha = recognitionQueue.find((question) => question.lexemeId === "alpha");
  const beta = recognitionQueue.find((question) => question.lexemeId === "beta");
  assert.ok(alpha && beta);
  const wrong = alpha.options.find((option) => option !== alpha.answer);
  assert.ok(wrong);
  let progress = record({}, alpha, wrong, "2026-10-15");
  assert.equal(progress.alpha.recognitionAttemptEvidenceIds.length, 1);
  assert.equal(progress.alpha.recognitionCorrectEvidenceIds.length, 0);
  const afterWrongFirst = progress;
  progress = record(progress, alpha, alpha.answer, "2026-10-15");
  assert.strictEqual(progress, afterWrongFirst);
  assert.equal(
    buildVocabularyLibraryPracticeQueue({
      library: fixtureLibrary,
      targets: fixtureTargets,
      progress,
      studyDate: "2026-10-15",
      mode: "recognition",
      limit: 11,
    }).some((question) => question.lexemeId === "alpha"),
    false,
  );
  const alphaNextDay = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress,
    studyDate: "2026-10-16",
    mode: "recognition",
    limit: 11,
  }).find((question) => question.lexemeId === "alpha");
  assert.ok(alphaNextDay);
  progress = record(progress, alphaNextDay, alphaNextDay.answer, "2026-10-16");
  assert.equal(progress.alpha.recognitionCorrectEvidenceIds.length, 1);
  assert.equal(progress.alpha.spellingAttemptEvidenceIds.length, 0);
  assert.equal(progress.alpha.applicationAttemptEvidenceIds.length, 0);

  const betaDayOne = record(progress, beta, beta.answer, "2026-10-15");
  const betaDayTwo = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress: betaDayOne,
    studyDate: "2026-10-16",
    mode: "recognition",
    limit: 11,
  }).find((question) => question.lexemeId === "beta");
  assert.ok(betaDayTwo);
  progress = record(betaDayOne, betaDayTwo, betaDayTwo.answer, "2026-10-16");
  assert.equal(deriveVocabularyMasteryState(progress.beta), "receptive");
  assert.throws(
    () =>
      recordVocabularyLibraryPracticeResult(progress, {
        library: fixtureLibrary,
        targets: fixtureTargets,
        question: betaDayTwo,
        selectedAnswer: "not-an-option",
        studyDate: "2026-10-17",
        studiedAt: "2026-10-17T10:00:00.000Z",
      }),
    /來源|日期|選項/,
  );
});

test("keeps recognition options source-stable after earlier same-day attempts", () => {
  let progress = {};
  const firstQueue = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress,
    studyDate: "2026-10-15",
    mode: "recognition",
    limit: 2,
  });
  assert.ok(firstQueue[0]);
  progress = record(progress, firstQueue[0], firstQueue[0].answer, "2026-10-15");

  const secondQueue = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress,
    studyDate: "2026-10-15",
    mode: "recognition",
    limit: 2,
  });
  assert.ok(secondQueue[0]);
  assert.notEqual(secondQueue[0].lexemeId, firstQueue[0].lexemeId);
  assert.doesNotThrow(() => {
    progress = record(progress, secondQueue[0], secondQueue[0].answer, "2026-10-15");
  });
  assert.equal(progress[secondQueue[0].lexemeId].recognitionCorrectEvidenceIds.length, 1);
});

test("spelling exposes no answer field and never creates clean credit from paste or reveal", () => {
  let progress = {};
  const q1 = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress,
    studyDate: "2026-10-15",
    mode: "spelling",
    limit: 1,
  })[0];
  assert.ok(q1);
  assert.equal("answer" in q1, false);
  progress = record(progress, q1, "wrong", "2026-10-15");
  const sameDay = progress;
  progress = record(progress, q1, "alpha", "2026-10-15");
  assert.strictEqual(progress, sameDay);
  const q2 = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress,
    studyDate: "2026-10-16",
    mode: "spelling",
    limit: 1,
  })[0];
  assert.ok(q2);
  progress = record(progress, q2, "alpha", "2026-10-16", { usedPaste: true });
  assert.equal(progress.alpha.spellingAttemptEvidenceIds.length, 2);
  assert.equal(progress.alpha.spellingCorrectEvidenceIds.length, 0);
  const q3 = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress,
    studyDate: "2026-10-17",
    mode: "spelling",
    limit: 1,
  })[0];
  assert.ok(q3);
  progress = record(progress, q3, "alpha", "2026-10-17", { answerRevealed: true });
  assert.equal(progress.alpha.spellingAttemptEvidenceIds.length, 3);
  assert.equal(progress.alpha.spellingCorrectEvidenceIds.length, 0);
  assert.equal(progress.alpha.applicationCorrectEvidenceIds.length, 0);
  const q4 = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress,
    studyDate: "2026-10-18",
    mode: "spelling",
    limit: 1,
  })[0];
  assert.ok(q4);
  progress = record(progress, q4, "alpha", "2026-10-18");
  assert.equal(progress.alpha.spellingCorrectEvidenceIds.length, 1);
});

test("masks only the complete spelling answer, including apostrophes and hyphens", () => {
  assert.equal(
    maskSpellingAnswerInDefinition("The hero saw he.", "he"),
    "The hero saw ____.",
  );
  assert.equal(
    maskSpellingAnswerInDefinition("A test, testing, and contest.", "test"),
    "A ____, testing, and contest.",
  );
  assert.equal(
    maskSpellingAnswerInDefinition("I can't stay.", "can't"),
    "I ____ stay.",
  );
  assert.equal(
    maskSpellingAnswerInDefinition("A mother-in-law arrived.", "mother-in-law"),
    "A ____ arrived.",
  );
});

test("masks a real library definition when building a spelling question", () => {
  const targets = parseVocabularyTargets(readJson("public/data/vocabulary-targets-v2.json"));
  const library = parseVocabularyLibrary(
    readJson("public/data/vocabulary-library-v1.json"),
    targets,
  );
  const question = buildVocabularyLibraryPracticeQuestion({
    library,
    targets,
    lexemeId: "know",
    studyDate: "2026-10-15",
    mode: "spelling",
  });
  assert.ok(question);
  assert.equal(question.definitionEn, "____ how to do or perform something");
  assert.doesNotMatch(question.definitionEn, /\bknow\b/i);
  assert.equal("answer" in question, false);
});

test("revalidates source, option, date and timestamp before recording", () => {
  const question = buildVocabularyLibraryPracticeQueue({
    library: fixtureLibrary,
    targets: fixtureTargets,
    progress: {},
    studyDate: "2026-10-15",
    mode: "recognition",
    limit: 1,
  })[0];
  assert.ok(question);
  const changed = structuredClone(question);
  changed.answer = "篡改答案";
  assert.throws(
    () => record({}, changed, changed.answer, "2026-10-15"),
    /來源資料/,
  );
  const changedOption = structuredClone(question);
  changedOption.options[0] = "篡改選項";
  assert.throws(
    () => record({}, changedOption, changedOption.options[0], "2026-10-15"),
    /來源資料/,
  );
  assert.throws(
    () => record({}, question, question.answer, "2026-10-16"),
    /日期/,
  );
  assert.throws(
    () =>
      recordVocabularyLibraryPracticeResult({}, {
        library: fixtureLibrary,
        targets: fixtureTargets,
        question,
        selectedAnswer: question.answer,
        studyDate: "2026-10-15",
        studiedAt: "not-a-real-time",
      }),
    /時間/,
  );
  assert.throws(
    () =>
      recordVocabularyLibraryPracticeResult({}, {
        library: fixtureLibrary,
        targets: fixtureTargets,
        question,
        selectedAnswer: question.answer,
        studyDate: "2026-10-15",
        studiedAt: "2026-02-30T10:00:00.000Z",
      }),
    /日期不存在/,
  );
  const invalidQuestion = structuredClone(question);
  invalidQuestion.id = "vocabulary-library:2026-10-15:recognition:other";
  assert.throws(
    () => record({}, invalidQuestion, invalidQuestion.answer, "2026-10-15"),
    /來源資料/,
  );
});
