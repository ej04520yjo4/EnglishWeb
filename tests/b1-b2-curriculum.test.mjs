import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  validatePatternExerciseData,
  validateReadingExerciseData,
} from "../app/a1-exercises.ts";
import {
  createEmptyMultiLevelProgress,
  migrateProgressToV6,
  updateSelectedLevelProgress,
} from "../app/curriculum/progress.ts";
import { sentenceSpellingUnits } from "../app/curriculum/sentence-words.ts";
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

const rowsByLevel = {
  A1: parseCourseCsv(readText("public/data/a1-course-v3.csv")),
  A2: parseCourseCsv(readText("public/data/a2-course-v1.csv")),
  B1: parseCourseCsv(readText("public/data/b1-course-v1.csv")),
  B2: parseCourseCsv(readText("public/data/b2-course-v1.csv")),
};
const patternsByLevel = {
  B1: readJson("public/data/b1-pattern-exercises.json"),
  B2: readJson("public/data/b2-pattern-exercises.json"),
};
const readingByLevel = {
  B1: readJson("public/data/b1-reading-exercises.json"),
  B2: readJson("public/data/b2-reading-exercises.json"),
};
const expectedCounts = {
  B1: { units: 8, lessons: 32, occurrences: 249 },
  B2: { units: 8, lessons: 32, occurrences: 298 },
};

const prerequisiteRows = (level) =>
  level === "B1"
    ? [...rowsByLevel.A1, ...rowsByLevel.A2]
    : [...rowsByLevel.A1, ...rowsByLevel.A2, ...rowsByLevel.B1];

for (const level of ["B1", "B2"]) {
  test(`${level} builds eight units, 32 lessons, and the catalog occurrence count`, () => {
    const rows = rowsByLevel[level];
    const expected = expectedCounts[level];
    const report = validateCourseRows(rows, {
      expectedLevel: level,
      expectedUnits: expected.units,
      expectedLessons: expected.lessons,
      rejectProductionQaForPilot: true,
    });
    assert.equal(report.valid, true, report.validationErrors.join("\n"));
    assert.equal(rows.length, expected.occurrences);

    const units = buildCourseUnitsFromRows(
      rows,
      `${level.toLowerCase()}-course-v1.csv`,
    );
    assert.equal(units.length, expected.units);
    assert.deepEqual(
      units.map((unit) => unit.lessons.length),
      Array(expected.units).fill(4),
    );
  });

  test(`${level} keeps one spelling unit per answer and rebuilds every sentence`, () => {
    const rows = rowsByLevel[level];
    assert.ok(
      rows.every((row) =>
        /^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(row.answer),
      ),
    );

    const rowsBySentence = Map.groupBy(
      rows,
      (row) => row.sentence_id,
    );
    rowsBySentence.forEach((sentenceRows, sentenceId) => {
      const ordered = [...sentenceRows].sort(
        (a, b) => Number(a.token_order) - Number(b.token_order),
      );
      assert.deepEqual(
        ordered.map((row) => row.answer),
        sentenceSpellingUnits(ordered[0].sentence),
        sentenceId,
      );
    });
  });

  test(`${level} supplies complete transfer, recognition, response, and passage practice`, () => {
    const rows = rowsByLevel[level];
    const patterns = patternsByLevel[level];
    const reading = readingByLevel[level];
    const lessonIds = [...new Set(rows.map((row) => row.lesson_id))];

    assert.equal(patterns.patterns.length, 32);
    assert.equal(reading.recognition.length, 32);
    assert.equal(reading.textResponses.length, 32);
    assert.equal(reading.passages.length, 8);

    lessonIds.forEach((lessonId) => {
      assert.equal(
        patterns.patterns.flatMap((pattern) => pattern.examples).filter(
          (example) => example.practiceLessonId === lessonId,
        ).length,
        2,
        lessonId,
      );
      assert.equal(
        reading.recognition.filter(
          (exercise) => exercise.lessonId === lessonId,
        ).length,
        1,
        lessonId,
      );
      assert.equal(
        reading.textResponses.filter(
          (exercise) => exercise.lessonId === lessonId,
        ).length,
        1,
        lessonId,
      );
    });

    reading.passages.forEach((passage) => {
      assert.equal(passage.questions.length, 4, passage.passageId);
      assert.equal(
        new Set(passage.questions.map((question) => question.id)).size,
        4,
        passage.passageId,
      );
    });
  });

  test(`${level} exercise prerequisites and pattern slots pass the shared validators`, () => {
    const rows = rowsByLevel[level];
    const patterns = patternsByLevel[level];
    const reading = readingByLevel[level];
    const prerequisites = prerequisiteRows(level);

    const patternReport = validatePatternExerciseData(
      patterns,
      rows,
      level,
      prerequisites,
    );
    assert.equal(
      patternReport.valid,
      true,
      patternReport.errors.join("\n"),
    );

    const readingReport = validateReadingExerciseData(
      reading,
      rows,
      patterns,
      prerequisites,
    );
    assert.equal(
      readingReport.valid,
      true,
      readingReport.errors.join("\n"),
    );
  });

  test(`${level} remains explicitly pending human review`, () => {
    assert.ok(
      rowsByLevel[level].every(
        (row) => row.qa_status === "pilot_review_required",
      ),
    );
    assert.ok(
      patternsByLevel[level].patterns.every(
        (pattern) =>
          pattern.qaStatus === "pilot_review_required" &&
          pattern.examples.every(
            (example) =>
              example.qaStatus === "pilot_review_required",
          ),
      ),
    );
    assert.ok(
      [
        ...readingByLevel[level].recognition,
        ...readingByLevel[level].textResponses,
        ...readingByLevel[level].passages,
      ].every((exercise) => exercise.qaStatus === "pilot_review_required"),
    );
  });
}

test("A1, A2, B1, and B2 keep all stable structural IDs collision-free", () => {
  const levels = ["A1", "A2", "B1", "B2"];
  levels.forEach((level, index) => {
    levels.slice(index + 1).forEach((otherLevel) => {
      assert.deepEqual(
        findCrossLevelIdCollisions(
          rowsByLevel[level],
          rowsByLevel[otherLevel],
        ),
        [],
        `${level}/${otherLevel}`,
      );
    });
  });
});

test("B1 and B2 keep inflected nouns and contextual homographs in the correct part of speech", () => {
  const rows = [...rowsByLevel.B1, ...rowsByLevel.B2];
  const expectPos = (sentence, answer, expected) => {
    const row = rows.find(
      (candidate) =>
        candidate.sentence === sentence &&
        candidate.answer.toLowerCase() === answer,
    );
    assert.ok(row, `${sentence} 找不到 ${answer}`);
    assert.equal(row.context_pos, expected, `${sentence} / ${answer}`);
  };

  for (const noun of [
    "years",
    "friends",
    "results",
    "problems",
    "experts",
    "businesses",
    "questions",
    "companies",
    "governments",
    "policies",
    "residents",
    "communities",
  ]) {
    const matchingRows = rows.filter(
      (row) => row.answer.toLowerCase() === noun,
    );
    assert.ok(matchingRows.length > 0, `找不到名詞 ${noun}`);
    assert.ok(
      matchingRows.every((row) => row.context_pos === "noun 名詞"),
      noun,
    );
  }

  expectPos(
    "Although I understand your concern, I support the change.",
    "support",
    "verb 動詞",
  );
  expectPos(
    "The report claims that public support has increased recently.",
    "support",
    "noun 名詞",
  );
  expectPos(
    "Governments should ensure that progress benefits the whole community.",
    "benefits",
    "verb 動詞",
  );
  expectPos(
    "In my view, the proposal offers several practical benefits.",
    "benefits",
    "noun 名詞",
  );
  expectPos(
    "If we had more time, we could compare the results carefully.",
    "more",
    "determiner 限定詞",
  );
  expectPos(
    "Policies are more effective when residents understand their purpose.",
    "more",
    "adverb 副詞",
  );
});

test("B1 and B2 preserve canonical verb and proper-name lemmas", () => {
  const rows = [...rowsByLevel.B1, ...rowsByLevel.B2];
  const canonicalVerbs = { am: "be", is: "be", are: "be", was: "be", were: "be", been: "be", has: "have", had: "have" };
  for (const row of rows) {
    const lemma = canonicalVerbs[row.answer.toLowerCase()];
    if (lemma) {
      assert.equal(row.lemma, lemma, row.occurrence_id);
      assert.equal(row.lexeme_id, lemma, row.occurrence_id);
    }
  }
  for (const [answer, lemma] of [["I", "I"], ["me", "I"], ["English", "English"], ["Friday", "Friday"]]) {
    const matching = rows.filter((row) => row.answer === answer);
    assert.ok(matching.length > 0, answer);
    assert.ok(matching.every((row) => row.lemma === lemma), answer);
  }
});

test("all 64 retained passage questions use content-specific wording", () => {
  const questions = Object.values(readingByLevel).flatMap((reading) =>
    reading.passages.flatMap((passage) => passage.questions));
  assert.equal(questions.length, 64);
  for (const question of questions) {
    assert.ok(question.question.trim(), question.id);
    assert.doesNotMatch(question.question, /第\s*\d+\s*句提到的重點是什麼/, question.id);
    assert.equal(question.options.filter((text) => text === question.correctAnswer).length, 1, question.id);
  }
  const comparison = questions.find((question) => question.id === "b2-u02-p01-q01");
  assert.equal(comparison.question, "文中提到，這個方案與另一個相比有什麼優點？");
  assert.equal(comparison.correctAnswer, "More flexible");
  const travel = questions.find((question) => question.id === "b1-u01-p01-q02");
  assert.match(travel.question, /從未/);
});

test("corrected transfer examples retain the source grammatical construction", () => {
  const requiredConstructions = [
    ["B1", "b1-u03-l04-pattern", /\bthat helps\b/],
    ["B1", "b1-u04-l03-pattern", /\bwho helped\b/],
    ["B1", "b1-u06-l01-pattern", /\buse\b.+\bto organize\b/],
    ["B2", "b2-u03-l01-pattern", /\bwas completed\b.+\bthan (?:the manager )?expected\b/],
  ];
  for (const [level, patternId, construction] of requiredConstructions) {
    const pattern = patternsByLevel[level].patterns.find((entry) => entry.id === patternId);
    assert.equal(pattern.examples.length, 2, patternId);
    for (const example of pattern.examples) assert.match(example.sentence, construction, example.id);
  }
  const comparisonPattern = patternsByLevel.B2.patterns.find((entry) => entry.id === "b2-u03-l01-pattern");
  assert.equal(comparisonPattern.examples[1].sentence, "The report was completed earlier than the manager expected.");
});

test("B1 and B2 progress remain isolated and schema 4 data migrates without loss", () => {
  const progress = createEmptyMultiLevelProgress();
  progress.selectedLevel = "B1";
  const afterB1 = updateSelectedLevelProgress(progress, (current) => ({
    ...current,
    completedLessonIds: ["b1-u01-l01"],
  }));
  const afterB2 = updateSelectedLevelProgress(
    { ...afterB1, selectedLevel: "B2" },
    (current) => ({
      ...current,
      completedLessonIds: ["b2-u01-l01"],
    }),
  );

  assert.deepEqual(afterB2.levelProgress.B1.completedLessonIds, [
    "b1-u01-l01",
  ]);
  assert.deepEqual(afterB2.levelProgress.B2.completedLessonIds, [
    "b2-u01-l01",
  ]);
  assert.deepEqual(afterB2.levelProgress.A1.completedLessonIds, []);
  assert.deepEqual(afterB2.levelProgress.A2.completedLessonIds, []);

  const legacyV4 = {
    ...afterB2,
    schemaVersion: 4,
  };
  delete legacyV4.levelProgress.B1;
  delete legacyV4.levelProgress.B2;
  const migrated = migrateProgressToV6(legacyV4);
  assert.equal(migrated.schemaVersion, 6);
  assert.deepEqual(migrated.levelProgress.B1.completedLessonIds, []);
  assert.deepEqual(migrated.levelProgress.B2.completedLessonIds, []);
});
