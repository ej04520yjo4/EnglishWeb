import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildCourseUnitsFromRows as buildA1Units,
  parseA1MvpCsv,
} from "../app/a1-mvp-data.ts";
import {
  validatePatternExerciseData,
  validateReadingExerciseData,
} from "../app/a1-exercises.ts";
import {
  canAccessLevel,
  createEmptyMultiLevelProgress,
  isLevelAssessmentEnabled,
  migrateProgressToV6,
  updateSelectedLevelProgress,
} from "../app/curriculum/progress.ts";
import {
  loadCurriculumCatalog,
  validateCurriculumCatalog,
} from "../app/curriculum/catalog.ts";
import {
  loadAvailableCourseLevels,
  loadCourseLevel,
} from "../app/curriculum/loader.ts";
import {
  buildCourseUnitsFromRows,
  findCrossLevelIdCollisions,
  parseCourseCsv,
  validateCourseRows,
} from "../app/curriculum/validation.ts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));

const a1Text = readText("public/data/a1-course-v3.csv");
const a2Text = readText("public/data/a2-course-v1.csv");
const a1Rows = parseA1MvpCsv(a1Text);
const a2Rows = parseCourseCsv(a2Text);
const catalogJson = readJson("public/data/course-catalog.json");
const a1Patterns = readJson("public/data/a1-pattern-exercises.json");
const a1Reading = readJson("public/data/a1-reading-exercises.json");
const a2Patterns = readJson("public/data/a2-pattern-exercises.json");
const a2Reading = readJson("public/data/a2-reading-exercises.json");

const response = (body, status = 200) =>
  new Response(
    typeof body === "string" ? body : JSON.stringify(body),
    {
      status,
      headers: {
        "content-type":
          typeof body === "string"
            ? "text/plain; charset=utf-8"
            : "application/json",
      },
    },
  );

const curriculumFetcher = async (url) => {
  const files = {
    "/data/course-catalog.json": catalogJson,
    "/data/a1-course-v3.csv": a1Text,
    "/data/a2-course-v1.csv": a2Text,
  };
  return url in files ? response(files[url]) : response("", 404);
};

test("keeps A1 at 8 units, 32 lessons, and 145 occurrences", () => {
  const units = buildA1Units(a1Rows);
  assert.equal(units.length, 8);
  assert.equal(
    units.flatMap((unit) => unit.lessons).length,
    32,
  );
  assert.equal(a1Rows.length, 145);
});

test("loads a catalog containing production A1, pilot A2, and disabled B levels", async () => {
  const catalog = validateCurriculumCatalog(catalogJson);
  assert.deepEqual(
    catalog.levels.map((entry) => [entry.level, entry.status]),
    [
      ["A1", "production"],
      ["A2", "pilot"],
      ["B1", "disabled"],
      ["B2", "disabled"],
    ],
  );
  const loaded = await loadCurriculumCatalog(curriculumFetcher);
  assert.equal(loaded.levels[1].prerequisiteLevel, "A1");
});

test("rejects a catalog with an out-of-order advanced prerequisite", () => {
  const invalid = structuredClone(catalogJson);
  invalid.levels.find((entry) => entry.level === "B2").prerequisiteLevel =
    "A2";
  assert.throws(
    () => validateCurriculumCatalog(invalid),
    /B2 的 prerequisiteLevel 必須是 B1/,
  );
});

test("loads the A2 pilot as 6 units and 24 lessons", async () => {
  const catalog = await loadCurriculumCatalog(curriculumFetcher);
  const level = await loadCourseLevel(
    catalog,
    "A2",
    curriculumFetcher,
  );
  assert.equal(level.units.length, 6);
  assert.equal(
    level.units.flatMap((unit) => unit.lessons).length,
    24,
  );
  assert.equal(level.rows.length, 146);
  assert.equal(level.status, "pilot");
});

test("keeps A2 unit 1 unchanged while adding units 2 through 6", () => {
  const unitOneRows = a2Rows.filter((row) => row.unit_id === "a2-u01");
  assert.equal(unitOneRows.length, 25);
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify(unitOneRows))
      .digest("hex"),
    "0c06db4c35f30bd99dd8678bba6a09653d70cae02a92694037be32d736b145f8",
  );
  assert.deepEqual(
    [...new Set(a2Rows.map((row) => row.unit_id))],
    ["a2-u01", "a2-u02", "a2-u03", "a2-u04", "a2-u05", "a2-u06"],
  );
  assert.deepEqual(
    [...new Set(a2Rows.map((row) => row.unit_title))],
    [
      "昨天與明天",
      "旅行與交通",
      "購物與比較",
      "健康與建議",
      "工作與約會安排",
      "居家與日常家務",
    ],
  );
  const unitOnePatterns = a2Patterns.patterns.filter((pattern) =>
    pattern.examples.every((example) =>
      example.practiceLessonId.startsWith("a2-u01-"),
    ),
  );
  const unitOneReading = {
    recognition: a2Reading.recognition.filter((exercise) =>
      exercise.lessonId.startsWith("a2-u01-"),
    ),
    textResponses: a2Reading.textResponses.filter((exercise) =>
      exercise.lessonId.startsWith("a2-u01-"),
    ),
    passages: a2Reading.passages.filter(
      (passage) => passage.passageId === "a2-u01-p01",
    ),
  };
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify(unitOnePatterns))
      .digest("hex"),
    "9bbdfbf36d7f66635355faab3e5a8ace892e018a97b648f556a8eef991b672b3",
  );
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify(unitOneReading))
      .digest("hex"),
    "ac1619001b61819496aa50279cb8b2b64f3bf10d1291858e226ea7aa6f2397dd",
  );
});

test("preserves A2 units 1 through 5 rows and exercise objects byte-for-object", () => {
  const expected = {
    "a2-u01": {
      rows: "0c06db4c35f30bd99dd8678bba6a09653d70cae02a92694037be32d736b145f8",
      patterns: "9bbdfbf36d7f66635355faab3e5a8ace892e018a97b648f556a8eef991b672b3",
      reading: "ac1619001b61819496aa50279cb8b2b64f3bf10d1291858e226ea7aa6f2397dd",
    },
    "a2-u02": {
      rows: "cc5159671f5b8dc99890a6b4577ab02d55d179509a72e25e0262e34bb3dc5377",
      patterns: "19d441f1b6680709e9b689c5ecaa38ee682a65cdef288d053bb2791eeee897d3",
      reading: "33cab3657010591909cde3e7d9d2e743a67e35871b696c28408462fdb859bd8d",
    },
    "a2-u03": {
      rows: "2c21b5ffe4399c8822f6f8763f630e1dd638e90758dd77fed885b47b04963cc1",
      patterns: "0690758cc1805d89413b81959fbb1f8cecb1b5091c79d544baceb20234ed3449",
      reading: "d4e703ee511d9a72766b5e99711d803637eca5a3652f3bf2682aa97a64802184",
    },
    "a2-u04": {
      rows: "8f4bbc3c1ef4b9194d0fea1e6adb8162bf9305c4f20769407aa7a5caeeccb350",
      patterns: "82ae8e8761c2dce200a38f45bdd79bf985f406562c7b754527e0b35c41657f91",
      reading: "961d61c7232853608cb83b100a1cc68a7aec8584a42e243df8585655a9280370",
    },
    "a2-u05": {
      rows: "4c272824e2a65b98218ab86b10244229a07c0d2c12974ab6c0565e5811feabbc",
      patterns: "3c2680153681a5e3717f207ca15037b74aa7055c7890af73ecf91a792077c398",
      reading: "bbb17f8ef94693d9714011b2f07c4051c2eee131ff02a8d13a4ca4dd70dabcb3",
    },
  };
  const digest = (value) =>
    createHash("sha256").update(JSON.stringify(value)).digest("hex");
  Object.entries(expected).forEach(([unitId, hashes]) => {
    assert.equal(
      digest(a2Rows.filter((row) => row.unit_id === unitId)),
      hashes.rows,
      `${unitId} rows changed`,
    );
    assert.equal(
      digest(
        a2Patterns.patterns.filter((pattern) =>
          pattern.examples.every((example) =>
            example.practiceLessonId.startsWith(`${unitId}-`),
          ),
        ),
      ),
      hashes.patterns,
      `${unitId} pattern objects changed`,
    );
    assert.equal(
      digest({
        recognition: a2Reading.recognition.filter((exercise) =>
          exercise.lessonId.startsWith(`${unitId}-`),
        ),
        textResponses: a2Reading.textResponses.filter((exercise) =>
          exercise.lessonId.startsWith(`${unitId}-`),
        ),
        passages: a2Reading.passages.filter(
          (passage) => passage.passageId === `${unitId}-p01`,
        ),
      }),
      hashes.reading,
      `${unitId} reading objects changed`,
    );
  });
});

test("keeps four ordered lessons per A2 unit and all structural IDs unique", () => {
  const units = buildCourseUnitsFromRows(
    a2Rows,
    "a2-course-v1.csv",
  );
  assert.deepEqual(
    units.map((unit) => unit.lessons.length),
    [4, 4, 4, 4, 4, 4],
  );
  assert.deepEqual(
    units.map((unit) => unit.number),
    [1, 2, 3, 4, 5, 6],
  );
  assert.equal(
    new Set(a2Rows.map((row) => row.lesson_id)).size,
    24,
  );
  assert.equal(
    new Set(a2Rows.map((row) => row.sentence_id)).size,
    24,
  );
  const occurrenceIds = a2Rows.map((row) => row.occurrence_id);
  assert.equal(new Set(occurrenceIds).size, occurrenceIds.length);
});

test("adds the four ordered work and appointment lessons in A2 unit 5", () => {
  const unitFiveRows = a2Rows.filter((row) => row.unit_id === "a2-u05");
  assert.equal(unitFiveRows.length, 27);
  assert.deepEqual(
    [...new Set(unitFiveRows.map((row) => row.lesson_id))],
    ["a2-u05-l01", "a2-u05-l02", "a2-u05-l03", "a2-u05-l04"],
  );
  assert.deepEqual(
    [...new Set(unitFiveRows.map((row) => row.sentence))],
    [
      "I am meeting my manager at ten tomorrow.",
      "Can we meet on Tuesday afternoon?",
      "I have a meeting at three.",
      "Can we move the meeting to Friday?",
    ],
  );
  assert.ok(
    unitFiveRows.every(
      (row) => row.qa_status === "pilot_review_required",
    ),
  );
});

test("adds the four ordered household lessons in A2 unit 6", () => {
  const unitSixRows = a2Rows.filter((row) => row.unit_id === "a2-u06");
  assert.equal(unitSixRows.length, 24);
  assert.deepEqual(
    [...new Set(unitSixRows.map((row) => row.lesson_id))],
    ["a2-u06-l01", "a2-u06-l02", "a2-u06-l03", "a2-u06-l04"],
  );
  assert.deepEqual(
    [...new Set(unitSixRows.map((row) => row.sentence))],
    [
      "I usually clean my room.",
      "I have to wash the dishes.",
      "Can you help me with the laundry?",
      "We clean the house on Saturday.",
    ],
  );
  const expectedNewLexemes = new Map([
    ["a2-u06-l01", ["usually", "clean", "room"]],
    ["a2-u06-l02", ["wash", "dish"]],
    ["a2-u06-l03", ["help", "laundry"]],
    ["a2-u06-l04", ["house", "saturday"]],
  ]);
  expectedNewLexemes.forEach((expected, lessonId) => {
    assert.deepEqual(
      unitSixRows
        .filter(
          (row) => row.lesson_id === lessonId && row.is_new_word === "TRUE",
        )
        .map((row) => row.lexeme_id),
      expected,
    );
  });
  assert.ok(
    unitSixRows.every(
      (row) => row.qa_status === "pilot_review_required",
    ),
  );
});

test("maps A2 inflected answers to dictionary-form lexemes", () => {
  const expected = new Map([
    ["bought", "buy"],
    ["leaves", "leave"],
    ["cheaper", "cheap"],
    ["larger", "large"],
  ]);
  expected.forEach((lexemeId, answer) => {
    const row = a2Rows.find(
      (candidate) => candidate.answer === answer,
    );
    assert.ok(row, `找不到 ${answer}`);
    assert.equal(row.lexeme_id, lexemeId);
    assert.equal(row.lemma, lexemeId);
  });
});

test("keeps every cross-level structural ID collision-free", () => {
  assert.deepEqual(findCrossLevelIdCollisions(a1Rows, a2Rows), []);
});

test("keeps every A2 answer to one word and rebuilds all core sentences", () => {
  assert.ok(
    a2Rows.every((row) =>
      /^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(row.answer),
    ),
  );
  const report = validateCourseRows(a2Rows, {
    expectedLevel: "A2",
    expectedUnits: 6,
    expectedLessons: 24,
    rejectProductionQaForPilot: true,
  });
  assert.equal(report.valid, true, report.validationErrors.join("\n"));
  const units = buildCourseUnitsFromRows(
    a2Rows,
    "a2-course-v1.csv",
  );
  units.flatMap((unit) => unit.lessons).forEach((lesson) => {
    const punctuation = lesson.sentence.match(/[.!?]$/)?.[0] ?? ".";
    assert.equal(
      `${lesson.tokens.map((token) => token.answer).join(" ")}${punctuation}`,
      lesson.sentence,
    );
  });
});

test("validates A2 transfer lexemes, chunks, slots, and non-source variations", () => {
  const report = validatePatternExerciseData(
    a2Patterns,
    a2Rows,
    "A2",
    a1Rows,
  );
  assert.equal(report.valid, true, report.errors.join("\n"));
  const sourceById = new Map(
    a2Rows.map((row) => [row.sentence_id, row.sentence]),
  );
  a2Patterns.patterns.forEach((pattern) => {
    assert.equal(pattern.examples.length, 2);
    pattern.examples.forEach((example) => {
      assert.notEqual(
        example.sentence.toLowerCase(),
        sourceById.get(example.sourceSentenceId)?.toLowerCase(),
      );
      assert.ok(example.requiredLexemeIds.length > 0);
      if (example.practiceLessonId >= "a2-u02-l01") {
        assert.equal(example.qaStatus, "pilot_review_required");
        assert.equal(example.slotValues.length, pattern.slots.length);
      }
    });
  });
});

test("keeps A2 reading answers supported and distractors unique", () => {
  const report = validateReadingExerciseData(
    a2Reading,
    a2Rows,
    a2Patterns,
    a1Rows,
  );
  assert.equal(report.valid, true, report.errors.join("\n"));
  a2Reading.passages.forEach((passage) => {
    const sentenceById = new Map(
      passage.sentences.map((sentence) => [
        sentence.id,
        sentence.sentence.toLowerCase(),
      ]),
    );
    passage.questions.forEach((question) => {
      const evidenceIds =
        question.evidenceSentenceIds ?? [question.sourceSentenceId];
      assert.ok(
        evidenceIds.some((sentenceId) =>
          sentenceById
            .get(sentenceId)
            .includes(
              question.correctAnswer
                .replace(/[.!?]$/g, "")
                .toLowerCase(),
            ),
        ),
      );
      assert.equal(
        new Set(question.options).size,
        question.options.length,
      );
      assert.equal(
        question.options.filter(
          (option) => option === question.correctAnswer,
        ).length,
        1,
      );
    });
  });
});

test("validates passage option prerequisites without breaking A1 reading data", () => {
  const a1Report = validateReadingExerciseData(
    a1Reading,
    a1Rows,
    a1Patterns,
  );
  assert.equal(a1Report.valid, true, a1Report.errors.join("\n"));

  const a2Report = validateReadingExerciseData(
    a2Reading,
    a2Rows,
    a2Patterns,
    a1Rows,
  );
  assert.equal(a2Report.valid, true, a2Report.errors.join("\n"));
  a2Reading.passages
    .filter((passage) => /^a2-u0[2-6]-p01$/.test(passage.passageId))
    .forEach((passage) => {
      passage.questions.forEach((question) => {
        assert.equal(
          question.optionMetadata.length,
          question.options.length,
          `${question.id} 應為每個選項提供先備內容 metadata`,
        );
      });
    });
});

test("rejects a unit 3 passage option that introduces unit 4 lexeme more", () => {
  const invalid = structuredClone(a2Reading);
  const question = invalid.passages
    .find((passage) => passage.passageId === "a2-u03-p01")
    .questions.find((entry) => entry.id === "a2-u03-p01-q03");
  const optionIndex = question.options.indexOf("That one.");
  question.options[optionIndex] = "More water.";
  question.optionMetadata[optionIndex] = {
    text: "More water.",
    requiredLexemeIds: ["more", "water"],
    requiredChunkIds: ["more-water"],
  };

  const report = validateReadingExerciseData(
    invalid,
    a2Rows,
    a2Patterns,
    a1Rows,
  );
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some(
      (error) =>
        error.includes("a2-u03-p01-q03") &&
        error.includes("提前使用 lexeme") &&
        error.includes("more"),
    ),
    report.errors.join("\n"),
  );
});

test("accepts learned that and one in the unit 3 passage options", () => {
  const question = a2Reading.passages
    .find((passage) => passage.passageId === "a2-u03-p01")
    .questions.find((entry) => entry.id === "a2-u03-p01-q03");
  const option = question.optionMetadata.find(
    (entry) => entry.text === "That one.",
  );
  assert.deepEqual(option.requiredLexemeIds, ["that", "one"]);
  assert.deepEqual(option.requiredChunkIds, ["that-one"]);

  const report = validateReadingExerciseData(
    a2Reading,
    a2Rows,
    a2Patterns,
    a1Rows,
  );
  assert.equal(report.valid, true, report.errors.join("\n"));
});

test("keeps the final A2 passage wording and direct-answer forms", () => {
  const questionById = new Map(
    a2Reading.passages.flatMap((passage) =>
      passage.questions.map((question) => [question.id, question]),
    ),
  );
  assert.deepEqual(questionById.get("a2-u02-p01-q02").options, [
    "The bus.",
    "The train.",
    "A train ticket.",
    "The station.",
  ]);
  assert.equal(
    questionById.get("a2-u02-p01-q02").correctAnswer,
    "The bus.",
  );
  assert.deepEqual(questionById.get("a2-u03-p01-q03").options, [
    "A larger size.",
    "That one.",
    "A train ticket.",
    "This shirt.",
  ]);
  assert.equal(
    questionById.get("a2-u04-p01-q01").question,
    "這個人今天怎麼了？",
  );
  assert.equal(
    questionById.get("a2-u04-p01-q05").question,
    "根據第一句和第三句，這個人是因為什麼症狀要看醫生？",
  );
});

test("keeps A2 article prompts and contextual definite-article chunks consistent", () => {
  const articleRows = a2Rows.filter((row) => /^a$/i.test(row.answer));
  assert.ok(articleRows.length > 0);
  assert.ok(articleRows.every((row) => row.prompt === "一個"));
  assert.ok(
    articleRows.every((row) => row.note.includes("a 的核心功能是不定冠詞")),
  );

  const stationRows = a2Rows.filter(
    (row) => row.chunk_text.toLowerCase() === "the station",
  );
  assert.ok(stationRows.every((row) => row.chunk_translation === "特定的車站"));
  assert.ok(
    stationRows.every((row) =>
      row.chunk_note.includes("雙方知道的特定車站"),
    ),
  );

  const trainRows = a2Rows.filter(
    (row) => row.chunk_text === "The train",
  );
  assert.ok(
    trainRows.every((row) => row.chunk_translation === "特定班次的火車"),
  );
});

test("keeps A2 passage distractors semantically distinct", () => {
  const transportQuestion = a2Reading.passages
    .find((passage) => passage.passageId === "a2-u02-p01")
    .questions.find((question) => question.id === "a2-u02-p01-q02");
  assert.equal(transportQuestion.correctAnswer, "The bus.");
  assert.ok(!transportQuestion.options.includes("Take the bus."));

  const comparisonQuestion = a2Reading.passages
    .find((passage) => passage.passageId === "a2-u03-p01")
    .questions.find((question) => question.id === "a2-u03-p01-q02");
  assert.deepEqual(comparisonQuestion.options, [
    "This shirt.",
    "That one.",
    "That book.",
    "That shirt.",
  ]);
  assert.ok(!comparisonQuestion.options.includes("This one."));
});

test("keeps every new A2 lesson within the new-lexeme limit", () => {
  const newLessonIds = [
    ...new Set(
      a2Rows
        .filter((row) => row.unit_id !== "a2-u01")
        .map((row) => row.lesson_id),
    ),
  ];
  assert.equal(newLessonIds.length, 20);
  newLessonIds.forEach((lessonId) => {
    const newLexemes = new Set(
      a2Rows
        .filter(
          (row) =>
            row.lesson_id === lessonId &&
            row.is_new_word === "TRUE",
        )
        .map((row) => row.lexeme_id),
    );
    assert.ok(
      newLexemes.size <= 4,
      `${lessonId} 新 lexeme 過多：${[...newLexemes].join("、")}`,
    );
  });
});

test("gives all 20 new lessons recognition, two transfers, and text response", () => {
  const newLessonIds = [
    ...new Set(
      a2Rows
        .filter((row) => row.unit_id !== "a2-u01")
        .map((row) => row.lesson_id),
    ),
  ];
  newLessonIds.forEach((lessonId) => {
    assert.equal(
      a2Reading.recognition.filter(
        (exercise) => exercise.lessonId === lessonId,
      ).length,
      1,
    );
    assert.equal(
      a2Reading.textResponses.filter(
        (exercise) => exercise.lessonId === lessonId,
      ).length,
      1,
    );
    const examples = a2Patterns.patterns.flatMap(
      (pattern) => pattern.examples,
    );
    assert.equal(
      examples.filter(
        (example) => example.practiceLessonId === lessonId,
      ).length,
      2,
    );
  });
});

test("adds one supported passage per A2 unit", () => {
  assert.deepEqual(
    a2Reading.passages.map((passage) => passage.passageId),
    [
      "a2-u01-p01",
      "a2-u02-p01",
      "a2-u03-p01",
      "a2-u04-p01",
      "a2-u05-p01",
      "a2-u06-p01",
    ],
  );
  a2Reading.passages.forEach((passage) => {
    assert.ok(passage.sentences.length >= 4);
    assert.ok(passage.questions.length >= 3);
  });
  a2Reading.passages
    .filter((passage) => passage.passageId !== "a2-u01-p01")
    .forEach((passage) => {
      assert.equal(passage.qaStatus, "pilot_review_required");
      assert.ok(
        passage.questions.some(
          (question) =>
            (question.evidenceSentenceIds?.length ?? 0) >= 2,
        ),
      );
  });
});

test("builds the A2 unit 5 appointment passage with supported comprehension", () => {
  const passage = a2Reading.passages.find(
    (entry) => entry.passageId === "a2-u05-p01",
  );
  assert.ok(passage);
  assert.equal(passage.sentences.length, 4);
  assert.equal(passage.questions.length, 5);
  assert.deepEqual(
    passage.sentences.map((entry) => entry.sentence),
    [
      "I am meeting my manager at ten tomorrow.",
      "I have a meeting at three.",
      "Can we meet on Tuesday afternoon?",
      "Can we move the meeting to Friday?",
    ],
  );
  assert.deepEqual(
    passage.questions.map((entry) => entry.correctAnswer),
    ["My manager.", "At ten tomorrow.", "A meeting.", "Tuesday.", "Friday."],
  );
});

test("builds the A2 unit 6 household passage with supported comprehension", () => {
  const passage = a2Reading.passages.find(
    (entry) => entry.passageId === "a2-u06-p01",
  );
  assert.ok(passage);
  assert.equal(passage.sentences.length, 5);
  assert.equal(passage.questions.length, 4);
  assert.deepEqual(
    passage.sentences.map((entry) => entry.sentence),
    [
      "I usually clean my room on Saturday.",
      "I have to wash the dishes.",
      "Can you help me with the laundry?",
      "I can help you.",
      "We clean the house on Saturday.",
    ],
  );
  assert.deepEqual(
    passage.questions.map((entry) => entry.correctAnswer),
    ["On Saturday.", "The dishes.", "The laundry.", "I can help you."],
  );
});

test("keeps every newly added A2 row and exercise in pilot QA", () => {
  assert.ok(
    a2Rows
      .filter((row) => row.unit_id !== "a2-u01")
      .every((row) => row.qa_status === "pilot_review_required"),
  );
  assert.ok(
    a2Patterns.patterns
      .filter((pattern) =>
        pattern.examples.some((example) =>
          example.practiceLessonId.startsWith("a2-u0") &&
          !example.practiceLessonId.startsWith("a2-u01"),
        ),
      )
      .every((pattern) => pattern.qaStatus === "pilot_review_required"),
  );
});

test("migrates schemaVersion 3 to 6 without changing A1 data", () => {
  const legacy = {
    schemaVersion: 3,
    completedLessonIds: ["a1-u1-l1"],
    passedUnitIds: ["a1-u1"],
    levelPassed: true,
    totalAttempts: 12,
    correctAnswers: 9,
    totalSeconds: 321,
    pasteCount: 2,
    studyDates: ["2026-07-27"],
    reviewItems: {
      "a1-u1-l1-t01": {
        tokenId: "a1-u1-l1-t01",
        answer: "I",
        prompt: "我",
        familiarity: "熟悉",
        dueAt: "2026-08-01T00:00:00.000Z",
        intervalDays: 5,
        successfulDays: 1,
      },
    },
    lexemeProgress: {},
    senseProgress: {},
    sentencePatternProgress: {},
    tokenProgress: {
      "a1-u1-l1-t01": {
        attempts: 2,
        hintsUsed: 1,
        answerRevealed: false,
        elapsedSeconds: 8,
        audioReplays: 1,
        usedPaste: false,
        correctAnswers: 1,
        lastAnsweredAt: "2026-07-27T00:00:00.000Z",
      },
    },
    sentenceStats: {},
    patternStats: {},
    passageStats: {},
    tokenHintLevels: {},
    chunkHintLevels: {},
    patternHintLevels: {},
    reviewExerciseTypes: {},
  };
  const migrated = migrateProgressToV6(legacy);
  assert.equal(migrated.schemaVersion, 6);
  assert.equal(migrated.selectedLevel, "A1");
  assert.deepEqual(
    migrated.levelProgress.A1.completedLessonIds,
    legacy.completedLessonIds,
  );
  assert.deepEqual(
    migrated.levelProgress.A1.passedUnitIds,
    legacy.passedUnitIds,
  );
  assert.deepEqual(
    migrated.levelProgress.A1.tokenProgress,
    legacy.tokenProgress,
  );
  assert.equal(
    migrated.levelProgress.A1.reviewItems["a1-u1-l1-t01"].dueAt,
    legacy.reviewItems["a1-u1-l1-t01"].dueAt,
  );
  assert.equal(migrated.levelProgress.A1.totalAttempts, 12);
  assert.deepEqual(migrated.passedLevelIds, ["A1"]);
  assert.deepEqual(
    migrated.levelProgress.A2.completedLessonIds,
    [],
  );
  assert.deepEqual(migrated.levelProgress.B1.completedLessonIds, []);
  assert.deepEqual(migrated.levelProgress.B2.completedLessonIds, []);
  assert.deepEqual(migrated.vocabularyProgress, {});
});

test("keeps A1 and A2 progress isolated and restorable", () => {
  const initial = createEmptyMultiLevelProgress();
  initial.levelProgress.A1.completedLessonIds = ["a1-u1-l1"];
  const selectedA2 = { ...initial, selectedLevel: "A2" };
  const updated = updateSelectedLevelProgress(
    selectedA2,
    (progress) => ({
      ...progress,
      completedLessonIds: ["a2-u01-l01"],
    }),
  );
  assert.deepEqual(updated.levelProgress.A1.completedLessonIds, [
    "a1-u1-l1",
  ]);
  assert.deepEqual(updated.levelProgress.A2.completedLessonIds, [
    "a2-u01-l01",
  ]);
  assert.deepEqual(
    migrateProgressToV6(JSON.parse(JSON.stringify(updated))),
    updated,
  );
});

test("enforces formal A2 unlock while allowing a non-mutating pilot entry", () => {
  const passedLevelIds = [];
  assert.equal(canAccessLevel("A2", passedLevelIds, false), false);
  assert.equal(canAccessLevel("A2", passedLevelIds, true), true);
  assert.deepEqual(passedLevelIds, []);
  assert.equal(canAccessLevel("A2", ["A1"], false), true);
  assert.equal(canAccessLevel("B1", ["A1"], false), false);
  assert.equal(canAccessLevel("B1", ["A2"], false), false);
  assert.equal(canAccessLevel("B1", ["A1", "A2"], false), true);
  assert.equal(canAccessLevel("B2", ["A1", "A2"], false), false);
  assert.equal(canAccessLevel("B2", ["B1"], false), false);
  assert.equal(
    canAccessLevel("B2", ["A1", "A2", "B1"], false),
    true,
  );
  assert.equal(canAccessLevel("B2", [], true), true);
  assert.equal(canAccessLevel("B1", ["A1", "A2"], true, "disabled"), false);
  assert.equal(canAccessLevel("B2", ["A1", "A2", "B1"], true, "disabled"), false);
  assert.equal(isLevelAssessmentEnabled("A1"), true);
  assert.equal(isLevelAssessmentEnabled("A2"), false);
  assert.equal(isLevelAssessmentEnabled("B1"), false);
  assert.equal(isLevelAssessmentEnabled("B2"), false);
});

test("isolates an A2 loading failure from a valid A1 level", async () => {
  const failedA2Fetcher = async (url) => {
    if (url === "/data/a2-course-v1.csv") {
      return response("", 500);
    }
    return curriculumFetcher(url);
  };
  const result = await loadAvailableCourseLevels(failedA2Fetcher);
  assert.equal(result.levels.A1.units.length, 8);
  assert.equal(result.levels.A2, undefined);
  assert.match(result.errors.A2, /A2 課程 CSV 載入失敗/);
});
