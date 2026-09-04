import { expect, Page, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const progressKey = "yingju-progress-v1";
const settingsKey = "yingju-settings-v1";
const dailySessionKey = "yingju-daily-session-v3";
const reviewDefinitions = {
  "a1-u1-l1-t01": { answer: "I", prompt: "我" },
  "a1-u1-l1-t02": { answer: "am", prompt: "是" },
  "a1-u1-l1-t03": { answer: "Amy", prompt: "Amy（人名）" },
  "a1-u1-l2-t01": { answer: "My", prompt: "我的" },
  "a1-u1-l2-t02": { answer: "name", prompt: "名字" },
  "a1-u1-l3-t01": { answer: "Nice", prompt: "用於表達「很高興」" },
} as const;
const dailyReviewQueueItem = (
  occurrenceId: keyof typeof reviewDefinitions,
  lexemeId: string,
  mode: "spelling" | "recognition" | "application",
) => ({
  id: `daily-review:${occurrenceId}:${mode}`,
  level: "A1",
  occurrenceId,
  lexemeId,
  mode,
});
const lessonsThroughUnit = (lastUnit: number) =>
  Array.from({ length: lastUnit }, (_, unitIndex) =>
    Array.from(
      { length: 4 },
      (_, lessonIndex) =>
        `a1-u${unitIndex + 1}-l${lessonIndex + 1}`,
    ),
  ).flat();

const progressFixture = (
  completedLessonIds: string[] = [],
  passedUnitIds: string[] = [],
) => ({
  schemaVersion: 3,
  completedLessonIds,
  passedUnitIds,
  levelPassed: false,
  totalAttempts: 0,
  correctAnswers: 0,
  totalSeconds: 0,
  pasteCount: 0,
  studyDates: [],
  reviewItems: {},
  lexemeProgress: {},
  senseProgress: {},
  sentencePatternProgress: {},
  tokenProgress: {},
  sentenceStats: {},
  patternStats: {},
  passageStats: {},
  tokenHintLevels: {},
  chunkHintLevels: {},
  patternHintLevels: {},
  reviewExerciseTypes: {},
});

const seedProgress = async (
  page: Page,
  completedLessonIds: string[] = [],
  passedUnitIds: string[] = [],
) => {
  const progress = progressFixture(
    completedLessonIds,
    passedUnitIds,
  );
  await page.addInitScript(
    ({ key, value }) =>
      localStorage.setItem(key, JSON.stringify(value)),
    { key: progressKey, value: progress },
  );
};

const seedDailyLearningFixture = async (
  page: Page,
  options: {
    weaknessLexemeIds?: string[];
    reviewOccurrenceIds?: Array<keyof typeof reviewDefinitions>;
    weaknessFocus?: "spelling" | "application";
    showAdvancedPilots?: boolean;
  } = {},
) => {
  const weaknessLexemeIds = options.weaknessLexemeIds ?? ["i"];
  const applicationWeakness = options.weaknessFocus === "application";
  const reviewOccurrenceIds =
    options.reviewOccurrenceIds ?? ["a1-u1-l1-t01"];
  const a1Progress = levelProgressFixture();
  a1Progress.reviewItems = Object.fromEntries(
    reviewOccurrenceIds.map((occurrenceId) => {
      const definition = reviewDefinitions[occurrenceId];
      return [occurrenceId, {
      tokenId: occurrenceId,
      answer: definition.answer,
      prompt: definition.prompt,
      familiarity: "不熟",
      dueAt: "2000-01-01T00:00:00.000Z",
      intervalDays: 1,
      successfulDays: 0,
      }];
    }),
  );
  const progress = {
    schemaVersion: 6,
    selectedLevel: "A1",
    passedLevelIds: [],
    levelProgress: {
      A1: a1Progress,
      A2: levelProgressFixture(),
      B1: levelProgressFixture(),
      B2: levelProgressFixture(),
    },
    vocabularyProgress: Object.fromEntries(
      weaknessLexemeIds.map((lexemeId) => [
        lexemeId,
        {
          firstSeenAt: "2026-08-19T01:00:00.000Z",
          lastSeenAt: "2026-08-19T01:00:00.000Z",
          exposureEvidenceIds: [],
          recognitionCorrectEvidenceIds: [],
          recognitionAttemptEvidenceIds: [],
          spellingCorrectEvidenceIds: [],
          spellingAttemptEvidenceIds: applicationWeakness
            ? []
            : [`seed-spelling-miss-${lexemeId}`],
          applicationCorrectEvidenceIds: [],
          applicationAttemptEvidenceIds: applicationWeakness
            ? [`seed-application-miss-${lexemeId}`]
            : [],
          evidenceStudyDates: {
            [applicationWeakness
              ? `seed-application-miss-${lexemeId}`
              : `seed-spelling-miss-${lexemeId}`]: "2026-08-19",
          },
          studyDates: ["2026-08-19"],
          sourceLevels: ["A1"],
        },
      ]),
    ),
  };
  await page.addInitScript(
    ({
      progressStorageKey,
      settingsStorageKey,
      progressValue,
      showAdvancedPilots,
    }) => {
      if (localStorage.getItem(progressStorageKey) === null) {
        localStorage.setItem(progressStorageKey, JSON.stringify(progressValue));
      }
      if (localStorage.getItem(settingsStorageKey) === null) {
        localStorage.setItem(
          settingsStorageKey,
          JSON.stringify({
            phonetic: "KK",
            autoplay: false,
            slowRate: 0.85,
            showAdvancedPilots,
          }),
        );
      }
    },
    {
      progressStorageKey: progressKey,
      settingsStorageKey: settingsKey,
      progressValue: progress,
      showAdvancedPilots: options.showAdvancedPilots ?? false,
    },
  );
};

const seedDailySessionRecord = async (
  page: Page,
  overrides: Record<string, unknown> = {},
) => {
  await page.addInitScript(
    ({ key, overrides }) => {
      if (localStorage.getItem(key) !== null) return;
      const now = new Date();
      const pad = (value: number) => String(value).padStart(2, "0");
      const localDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 3,
          localDate,
          level: "A1",
          startedAt: now.getTime(),
          lessonId: "a1-u1-l1",
          reviewCount: 0,
          reviewItems: [],
          completedReviewItemIds: [],
          reviewItemProgress: {},
          weaknessLexemeIds: [],
          completedWeaknessLexemeIds: [],
          completedSteps: [],
          beforeVocabulary: { exposed: 0, receptive: 0, active: 0 },
          activeStudySeconds: 0,
          activeStartedAt: null,
          ...overrides,
        }),
      );
    },
    { key: dailySessionKey, overrides },
  );
};

const levelProgressFixture = (
  completedLessonIds: string[] = [],
  passedUnitIds: string[] = [],
) => {
  const { schemaVersion, ...progress } = progressFixture(
    completedLessonIds,
    passedUnitIds,
  );
  if (schemaVersion !== 3) {
    throw new Error("測試用舊進度必須是 schema v3。");
  }
  return progress;
};

const multiLevelProgressFixture = (
  a1Completed: string[] = [],
  a2Completed: string[] = [],
  selectedLevel: "A1" | "A2" | "B1" | "B2" = "A2",
  a2PassedUnitIds: string[] = [],
  passedLevelIds: string[] = [],
) => ({
  schemaVersion: 5,
  selectedLevel,
  passedLevelIds,
  levelProgress: {
    A1: levelProgressFixture(a1Completed),
    A2: levelProgressFixture(a2Completed, a2PassedUnitIds),
    B1: levelProgressFixture(),
    B2: levelProgressFixture(),
  },
});

const seedA2Pilot = async (
  page: Page,
  a2Completed: string[] = [],
  a1Completed: string[] = [],
  selectedLevel: "A1" | "A2" | "B1" | "B2" = "A2",
  a2PassedUnitIds: string[] = [],
  passedLevelIds: string[] = [],
) => {
  const progress = multiLevelProgressFixture(
    a1Completed,
    a2Completed,
    selectedLevel,
    a2PassedUnitIds,
    passedLevelIds,
  );
  await page.addInitScript(
    ({ progressStorageKey, settingsStorageKey, progress }) => {
      if (localStorage.getItem(progressStorageKey) === null) {
        localStorage.setItem(
          progressStorageKey,
          JSON.stringify(progress),
        );
      }
      if (localStorage.getItem(settingsStorageKey) === null) {
        localStorage.setItem(
          settingsStorageKey,
          JSON.stringify({
            phonetic: "KK",
            autoplay: false,
            slowRate: 0.85,
            showA2Pilot: true,
          }),
        );
      }
    },
    {
      progressStorageKey: progressKey,
      settingsStorageKey: settingsKey,
      progress,
    },
  );
};

const expectLevelHomeReady = async (
  page: Page,
  level: "A1" | "A2" | "B1" | "B2",
) => {
  await expect(
    page.getByText(`${level} 完成度`, { exact: true }),
  ).toBeVisible();
};

const openCurrentA2Map = async (page: Page) => {
  await expectLevelHomeReady(page, "A2");
  await page
    .getByRole("button", { name: "前往課程地圖", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A2 課程地圖" }),
  ).toBeVisible();
};

const openA2Lesson = async (
  page: Page,
  title: string,
) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
  await expectLevelHomeReady(page, "A2");
  await page.getByRole("button", {
    name: "前往課程地圖",
    exact: true,
  }).click();
  const a2Heading = page.getByRole("heading", {
    name: "A2 課程地圖",
  });
  await expect(a2Heading).toBeVisible();
  await expect(
    page.locator('[data-testid="level-selector-a2"]'),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: new RegExp(title) })
    .click();
  await page
    .getByRole("button", { name: /從中文提示與逐字輸入開始/ })
    .click();
  await expect(page.locator("#recall-answer-0")).toBeFocused();
};

const openRecommendedLesson = async (
  page: Page,
  expectedTitle?: string,
) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /開始這一課/ }).click();
  if (expectedTitle) {
    await expect(
      page.getByRole("heading", { name: expectedTitle }),
    ).toBeVisible();
  }
  await page
    .getByRole("button", { name: /從中文提示與逐字輸入開始/ })
    .click();
  await expect(page.locator("#recall-answer-0")).toBeFocused();
};

const answerRecallTokens = async (
  page: Page,
  answers: string[],
) => {
  for (const answer of answers) {
    const input = page.locator("#recall-answer-0");
    await input.fill(answer);
    await input.press("Enter");
    await expect(
      page.getByText("回答正確", { exact: true }),
    ).toBeVisible();
    await page.locator("#detail-next-button").click();
  }
};

const submitRebuild = async (page: Page, words: string[]) => {
  const fields = page.locator(".rebuild-field input");
  await expect(fields).toHaveCount(words.length);
  await expect(fields.first()).toBeFocused();
  for (let index = 0; index < words.length; index += 1) {
    await fields.nth(index).fill(words[index]);
  }
  await page
    .getByRole("button", { name: /檢查順序與拼字/ })
    .click();
};

const completeEnhancedStages = async (
  page: Page,
  transferAnswers: string[],
  expectResult = true,
) => {
  await page.locator("#recognition-option-correct").click();
  await page.locator("#recognition-check-button").click();
  await page.locator("#recognition-next-button").click();

  const transfer = page.locator("#pattern-transfer-answer");
  for (const answer of transferAnswers) {
    await expect(transfer).toBeFocused();
    await transfer.fill(answer);
    await transfer.press("Enter");
    await page.locator("#pattern-transfer-next-button").click();
  }

  await page.locator("#text-response-option-correct").click();
  await page.locator("#text-response-check-button").click();
  await page.locator("#text-response-next-button").click();
  if (expectResult) {
    await expect(page.locator("#lesson-result-next")).toBeVisible();
  }
};

const completeSpellingDailyReview = async (
  page: Page,
  answer: string,
) => {
  await expect(page.locator('[data-testid="daily-review-active"]')).toBeVisible();
  await page.locator('[data-testid="daily-review-input"]').fill(answer);
  await page.locator('[data-testid="daily-review-check"]').click();
  await page.locator('[data-testid="daily-review-next"]').click();
};

const pasteValue = async (
  page: Page,
  selector: string,
  value: string,
) => {
  const input = page.locator(selector);
  await input.fill(value);
  await input.dispatchEvent("paste", {
    bubbles: true,
    cancelable: true,
  });
};

const openDailyApplicationReview = async (page: Page) => {
  await page.goto("/");
  await expect(page.locator('[data-testid="daily-learning-plan"]')).toBeVisible();
  await page.locator('[data-testid="start-daily-learning"]').click();
  await expect(page.locator('[data-testid="daily-review-counter"]')).toHaveText(
    "今日複習 1 / 3",
  );

  await page.locator('[data-testid="daily-review-input"]').fill("I");
  await page.locator('[data-testid="daily-review-check"]').click();
  await page.locator('[data-testid="daily-review-next"]').click();
  await expect(page.locator('[data-testid="daily-review-counter"]')).toHaveText(
    "今日複習 2 / 3",
  );

  await page.getByRole("button", { name: "是", exact: true }).click();
  await page.locator('[data-testid="daily-review-next"]').click();
  await expect(page.locator('[data-testid="daily-review-counter"]')).toHaveText(
    "今日複習 3 / 3",
  );
  await expect(
    page.getByText("請輸入完整英文句子", { exact: true }),
  ).toBeVisible();
};

const expectNoDuplicateEvidenceIds = async (page: Page) => {
  const duplicates = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    const fields = [
      "exposureEvidenceIds",
      "recognitionAttemptEvidenceIds",
      "recognitionCorrectEvidenceIds",
      "spellingAttemptEvidenceIds",
      "spellingCorrectEvidenceIds",
      "applicationAttemptEvidenceIds",
      "applicationCorrectEvidenceIds",
    ];
    const duplicateIds: string[] = [];
    for (const [lexemeId, evidence] of Object.entries(
      value.vocabularyProgress ?? {},
    )) {
      const evidenceFields = evidence as Record<string, unknown>;
      for (const field of fields) {
        const fieldValue = evidenceFields[field];
        const ids = Array.isArray(fieldValue)
          ? fieldValue.filter((id): id is string => typeof id === "string")
          : [];
        const seen = new Set<string>();
        for (const id of ids) {
          if (seen.has(id)) duplicateIds.push(`${lexemeId}.${field}:${id}`);
          seen.add(id);
        }
      }
    }
    return duplicateIds;
  }, progressKey);
  expect(duplicates).toEqual([]);
};

const expectNoHorizontalOverflow = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          window.innerWidth,
      ),
    )
    .toBe(true);
};

const completePassage = async (
  page: Page,
  sentences: string[],
  questionCount: number,
) => {
  for (let index = 0; index < sentences.length; index += 1) {
    await page
      .locator(`#passage-sentence-${index}`)
      .fill(sentences[index]);
  }
  await page
    .getByRole("button", { name: "檢查整段文章" })
    .click();
  for (let question = 0; question < questionCount; question += 1) {
    await page.locator("#passage-answer-0").click();
    await page.locator("#passage-question-check-button").click();
    await page.locator("#passage-question-next-button").click();
  }
  await expect(page.locator("#lesson-result-next")).toBeVisible();
};

test("prevents held Enter from skipping a learning unit and keeps the task visually primary", async ({
  page,
}) => {
  await openRecommendedLesson(page, "我是誰");

  const prompt = page.locator('[data-testid="recall-primary-prompt"]');
  const input = page.locator("#recall-answer-0");
  const promptFontSize = await prompt.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  const inputFontSize = await input.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(promptFontSize).toBeGreaterThan(inputFontSize);

  await input.fill("I");
  await input.press("Enter");
  await expect(page.getByText("學習單位 1/3", { exact: true })).toBeVisible();
  await expect(page.getByText("回答正確", { exact: true })).toBeVisible();
  await expect(page.getByText("單字本體", { exact: true })).toHaveCount(0);
  await expect(page.getByText("句中用法", { exact: true })).toHaveCount(0);
  await expect(page.getByText("更多字詞資訊", { exact: true })).toBeVisible();

  const next = page.locator("#detail-next-button");
  await expect(next).toBeFocused();
  await next.dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    repeat: true,
    bubbles: true,
  });
  await expect(page.getByText("學習單位 1/3", { exact: true })).toBeVisible();

  await next.press("Enter");
  await expect(page.getByText("學習單位 2/3", { exact: true })).toBeVisible();
  await expect(page.locator("#recall-answer-0")).toBeFocused();
});

test("moves across sentence boxes with arrows and empty Backspace", async ({
  page,
}) => {
  await openRecommendedLesson(page, "我是誰");
  await answerRecallTokens(page, ["I", "am", "Amy"]);

  const fields = page.locator(".rebuild-field input");
  await expect(fields).toHaveCount(3);
  await fields.nth(0).fill("I");
  await fields.nth(1).fill("am");

  await fields.nth(1).focus();
  await fields.nth(1).evaluate((element: HTMLInputElement) =>
    element.setSelectionRange(0, 0),
  );
  await fields.nth(1).press("ArrowLeft");
  await expect(fields.nth(0)).toBeFocused();

  await fields.nth(0).evaluate((element: HTMLInputElement) => {
    const end = element.value.length;
    element.setSelectionRange(end, end);
  });
  await fields.nth(0).press("ArrowRight");
  await expect(fields.nth(1)).toBeFocused();

  await fields.nth(1).fill("");
  await fields.nth(1).press("Backspace");
  await expect(fields.nth(0)).toBeFocused();
});

test("completes the original word and rebuild flow and persists it", async ({
  page,
}) => {
  await openRecommendedLesson(page, "我是誰");
  await answerRecallTokens(page, ["I", "am", "Amy"]);
  await submitRebuild(page, ["I", "am", "Amy"]);
  await expect(
    page.getByRole("heading", {
      name: "做得好！你已完成本課文字練習",
    }),
  ).toBeVisible();
  await expect(page.locator("#dictation-answer")).toHaveCount(0);

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(
          localStorage.getItem(key) ?? "{}",
        );
        return value.levelProgress?.A1?.completedLessonIds?.includes(
          "a1-u1-l1",
        );
      }, progressKey),
    )
    .toBe(true);
  await page.reload();
  await expect(page.getByText("1 / 32", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("completes have-possession recognition, two transfers, and text response", async ({
  page,
}) => {
  await seedProgress(
    page,
    lessonsThroughUnit(3),
    ["a1-u1", "a1-u2", "a1-u3"],
  );
  await openRecommendedLesson(page, "我有一顆蘋果");
  await answerRecallTokens(page, ["I", "have", "an", "apple"]);
  await submitRebuild(page, ["I", "have", "an", "apple"]);

  await expect(
    page.getByText("閱讀辨識・確認你理解完整句意"),
  ).toBeVisible();
  await page.locator("#recognition-option-correct").click();
  await page.locator("#recognition-check-button").click();
  await page.locator("#recognition-next-button").click();

  const transfer = page.locator("#pattern-transfer-answer");
  await expect(transfer).toBeFocused();
  await transfer.fill("I have a book.");
  await transfer.press("Enter");
  await page.locator("#pattern-transfer-next-button").click();
  await transfer.fill("I have a pen.");
  await transfer.press("Enter");
  await page.locator("#pattern-transfer-next-button").click();

  await page.locator("#text-response-option-correct").click();
  await page.locator("#text-response-check-button").click();
  await page.locator("#text-response-next-button").click();
  await expect(
    page.getByRole("heading", {
      name: "做得好！你已完成本課文字練習",
    }),
  ).toBeVisible();
  await expect(page.getByText("句型運用")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("completes the be-relationship second-batch flow", async ({
  page,
}) => {
  await seedProgress(
    page,
    [...lessonsThroughUnit(2), "a1-u3-l1"],
    ["a1-u1", "a1-u2"],
  );
  await openRecommendedLesson(page);
  await answerRecallTokens(page, ["He", "is", "my", "friend"]);
  await submitRebuild(page, ["He", "is", "my", "friend"]);
  await completeEnhancedStages(page, [
    "She is my friend.",
    "She is my wife.",
  ]);
  await expectNoHorizontalOverflow(page);
});

test("completes the action-at-time second-batch flow", async ({
  page,
}) => {
  await seedProgress(
    page,
    [
      ...lessonsThroughUnit(4),
      "a1-u5-l1",
      "a1-u5-l2",
      "a1-u5-l3",
    ],
    ["a1-u1", "a1-u2", "a1-u3", "a1-u4"],
  );
  await openRecommendedLesson(page);
  await answerRecallTokens(page, ["I", "watch", "TV", "at", "night"]);
  await submitRebuild(page, ["I", "watch", "TV", "at", "night"]);
  await completeEnhancedStages(page, [
    "I watch TV at seven.",
    "I play badminton at night.",
  ]);
  await expectNoHorizontalOverflow(page);
});

test("completes the be-location second-batch flow", async ({
  page,
}) => {
  await seedProgress(
    page,
    [...lessonsThroughUnit(6), "a1-u7-l1", "a1-u7-l2"],
    [
      "a1-u1",
      "a1-u2",
      "a1-u3",
      "a1-u4",
      "a1-u5",
      "a1-u6",
    ],
  );
  await openRecommendedLesson(page);
  await answerRecallTokens(page, [
    "The",
    "bathroom",
    "is",
    "on",
    "the",
    "left",
  ]);
  await submitRebuild(page, [
    "The",
    "bathroom",
    "is",
    "on",
    "the",
    "left",
  ]);
  await completeEnhancedStages(page, [
    "The store is on the left.",
    "The bathroom is near the station.",
  ]);
  await expectNoHorizontalOverflow(page);
});

test("requires the revealed pattern answer to be retyped before continuing", async ({
  page,
}) => {
  await seedProgress(
    page,
    lessonsThroughUnit(3),
    ["a1-u1", "a1-u2", "a1-u3"],
  );
  await openRecommendedLesson(page, "我有一顆蘋果");
  await answerRecallTokens(page, ["I", "have", "an", "apple"]);
  await submitRebuild(page, ["I", "have", "an", "apple"]);
  await page.locator("#recognition-option-correct").click();
  await page.locator("#recognition-check-button").click();
  await page.locator("#recognition-next-button").click();

  const transfer = page.locator("#pattern-transfer-answer");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await transfer.fill("I have an apple.");
    await transfer.press("Enter");
  }
  await expect(
    page.getByText(/正確答案是 I have a book/),
  ).toBeVisible();
  await expect(
    page.locator("#pattern-transfer-next-button"),
  ).toHaveCount(0);
  await transfer.fill("I have a book.");
  await transfer.press("Enter");
  await expect(
    page.locator("#pattern-transfer-next-button"),
  ).toBeVisible();
});

test("completes unit 8 passage rebuild and comprehension", async ({
  page,
}) => {
  await seedProgress(
    page,
    [...lessonsThroughUnit(7), "a1-u8-l1", "a1-u8-l2", "a1-u8-l3"],
    [
      "a1-u1",
      "a1-u2",
      "a1-u3",
      "a1-u4",
      "a1-u5",
      "a1-u6",
      "a1-u7",
    ],
  );
  await openRecommendedLesson(page, "搭公車上班");
  await answerRecallTokens(page, [
    "I",
    "go",
    "to",
    "work",
    "by",
    "bus",
  ]);
  await submitRebuild(page, [
    "I",
    "go",
    "to",
    "work",
    "by",
    "bus",
  ]);

  const sentences = [
    "I get up at seven.",
    "I eat breakfast at home.",
    "I go to work at eight.",
    "I go to work by bus.",
  ];
  for (let index = 0; index < sentences.length; index += 1) {
    await page.locator(`#passage-sentence-${index}`).fill(
      sentences[index],
    );
  }
  await page
    .getByRole("button", { name: "檢查整段文章" })
    .click();
  await expect(page.locator("#passage-answer-0")).toBeVisible();

  for (let question = 0; question < 3; question += 1) {
    await page.locator("#passage-answer-0").click();
    await page.locator("#passage-question-check-button").click();
    await page.locator("#passage-question-next-button").click();
  }
  await expect(
    page.getByRole("heading", {
      name: "做得好！你已完成本課文字練習",
    }),
  ).toBeVisible();
  await expect(page.getByText("短文理解")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("penalizes an extra word in the real unit assessment", async ({
  page,
}) => {
  await seedProgress(page, lessonsThroughUnit(1));
  await page.goto("/");
  await page
    .getByRole("button", { name: /開始單元測驗/ })
    .click();
  const answer = page.locator(".answer-input");
  await answer.fill("I am Amy today");
  await answer.press("Enter");
  await expect(page.getByText("本題正確率 75%")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("migrates v3 progress and keeps A2 locked until pilot QA is enabled", async ({
  page,
}) => {
  await seedProgress(page, ["a1-u1-l1"]);
  await page.goto("/");
  await expect(page.getByText("1 / 32", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(
          localStorage.getItem(key) ?? "{}",
        );
        return {
          schemaVersion: value.schemaVersion,
          completed: value.levelProgress?.A1
            ?.completedLessonIds?.length,
        };
      }, progressKey),
    )
    .toEqual({ schemaVersion: 6, completed: 1 });

  await page.getByRole("button", { name: "課程地圖" }).click();
  const a2Selector = page.locator(
    '[data-testid="level-selector-a2"]',
  );
  await expect(a2Selector).toHaveClass(/locked/);
  await a2Selector.click();
  await expect(
    page.getByText("A2 需先通過 A1 程度後正式解鎖。"),
  ).toBeVisible();
  await page.getByRole("button", { name: "設定" }).click();
  await page.locator('[data-testid="a2-pilot-toggle"]').check();
  await page.getByRole("button", { name: "課程地圖" }).click();
  await a2Selector.click();
  await expect(
    page.getByRole("heading", { name: "A2 課程地圖" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(
          localStorage.getItem(key) ?? "{}",
        );
        return value.passedLevelIds;
      }, progressKey),
    )
    .toEqual([]);
  await expectNoHorizontalOverflow(page);
});

test("completes the first A2 lesson and preserves both levels after reload", async ({
  page,
}) => {
  await seedA2Pilot(page, [], ["a1-u1-l1"]);
  await openA2Lesson(page, "昨晚做了什麼");
  await answerRecallTokens(page, [
    "I",
    "watched",
    "TV",
    "last",
    "night",
  ]);
  await submitRebuild(page, [
    "I",
    "watched",
    "TV",
    "last",
    "night",
  ]);
  await completeEnhancedStages(page, [
    "I watched TV at home.",
    "I watched TV at night.",
  ]);

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(
          localStorage.getItem(key) ?? "{}",
        );
        return {
          a1: value.levelProgress?.A1?.completedLessonIds,
          a2: value.levelProgress?.A2?.completedLessonIds,
        };
      }, progressKey),
    )
    .toEqual({
      a1: ["a1-u1-l1"],
      a2: ["a2-u01-l01"],
    });
  await page.reload();
  await expectLevelHomeReady(page, "A2");
  await expect(page.getByText("1 / 16", { exact: true })).toBeVisible();
  await page.getByRole("button", {
    name: "前往課程地圖",
    exact: true,
  }).click();
  await expect(
    page.getByRole("heading", { name: "A2 課程地圖" }),
  ).toBeVisible();
  await page.locator('[data-testid="level-selector-a1"]').click();
  await expect(
    page.getByRole("heading", { name: "A1 課程地圖" }),
  ).toBeVisible();
  await expect(page.getByText("1/32 課")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("completes the A2 passage rebuild and all three comprehension questions", async ({
  page,
}) => {
  await seedA2Pilot(page, [
    "a2-u01-l01",
    "a2-u01-l02",
    "a2-u01-l03",
  ]);
  await openA2Lesson(page, "提出邀請");
  await answerRecallTokens(page, [
    "Would",
    "you",
    "like",
    "to",
    "go",
    "with",
    "me",
  ]);
  await submitRebuild(page, [
    "Would",
    "you",
    "like",
    "to",
    "go",
    "with",
    "me",
  ]);
  await completeEnhancedStages(page, [
    "Would you like to play badminton?",
    "Would you like to go to the store?",
  ], false);

  const passageSentences = [
    "Yesterday, I went to the store.",
    "Last night, I watched TV at home.",
    "Tomorrow, I am going to play badminton.",
    "Would you like to go with me?",
  ];
  for (let index = 0; index < passageSentences.length; index += 1) {
    await page
      .locator(`#passage-sentence-${index}`)
      .fill(passageSentences[index]);
  }
  await page
    .getByRole("button", { name: "檢查整段文章" })
    .click();
  for (let question = 0; question < 3; question += 1) {
    await page.locator("#passage-answer-0").click();
    await page.locator("#passage-question-check-button").click();
    await page.locator("#passage-question-next-button").click();
  }
  await expect(
    page.getByRole("heading", {
      name: "做得好！你已完成本課文字練習",
    }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(
          localStorage.getItem(key) ?? "{}",
        );
        return value.levelProgress?.A2?.completedLessonIds?.includes(
          "a2-u01-l04",
        );
      }, progressKey),
    )
    .toBe(true);
  await expectNoHorizontalOverflow(page);
});

test("keeps formal A2 units sequential while QA preview exposes all pilot units", async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, settings, progress }) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(progress));
      }
      if (localStorage.getItem("yingju-settings-v1") === null) {
        localStorage.setItem("yingju-settings-v1", JSON.stringify(settings));
      }
    },
    {
      key: progressKey,
      settings: {
        phonetic: "KK",
        autoplay: false,
        slowRate: 0.85,
        showAdvancedPilots: false,
      },
      progress: multiLevelProgressFixture(
        [],
        [],
        "A2",
        [],
        ["A1"],
      ),
    },
  );
  await page.goto("/");
  await openCurrentA2Map(page);
  const travelLesson = page.getByRole("button", {
    name: /怎麼去車站/,
  });
  const shoppingLesson = page.getByRole("button", {
    name: /詢問價格/,
  });
  const healthLesson = page.getByRole("button", {
    name: /我頭痛/,
  });
  await expect(travelLesson).toBeDisabled();
  await expect(shoppingLesson).toBeDisabled();
  await expect(healthLesson).toBeDisabled();

  await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    value.levelProgress.A2.completedLessonIds = [
      "a2-u01-l01",
      "a2-u01-l02",
      "a2-u01-l03",
      "a2-u01-l04",
    ];
    value.levelProgress.A2.passedUnitIds = ["a2-u01"];
    localStorage.setItem(key, JSON.stringify(value));
  }, progressKey);
  await page.reload();
  await openCurrentA2Map(page);
  await expect(travelLesson).toBeEnabled();
  await expect(shoppingLesson).toBeDisabled();

  await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    value.levelProgress.A2.completedLessonIds.push(
      "a2-u02-l01",
      "a2-u02-l02",
      "a2-u02-l03",
      "a2-u02-l04",
    );
    value.levelProgress.A2.passedUnitIds.push("a2-u02");
    localStorage.setItem(key, JSON.stringify(value));
  }, progressKey);
  await page.reload();
  await openCurrentA2Map(page);
  await expect(shoppingLesson).toBeEnabled();
  await expect(healthLesson).toBeDisabled();

  await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    value.levelProgress.A2.completedLessonIds.push(
      "a2-u03-l01",
      "a2-u03-l02",
      "a2-u03-l03",
      "a2-u03-l04",
    );
    value.levelProgress.A2.passedUnitIds.push("a2-u03");
    localStorage.setItem(key, JSON.stringify(value));
  }, progressKey);
  await page.reload();
  await openCurrentA2Map(page);
  await expect(healthLesson).toBeEnabled();

  await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    value.levelProgress.A2.passedUnitIds = ["a2-u01"];
    localStorage.setItem(key, JSON.stringify(value));
  }, progressKey);
  await page.reload();
  await openCurrentA2Map(page);
  await expect(healthLesson).toBeDisabled();

  await page.getByRole("button", { name: "設定" }).click();
  await page.locator('[data-testid="a2-pilot-toggle"]').check();
  await page.getByRole("button", { name: "課程地圖" }).click();
  await expect(
    healthLesson,
  ).toBeEnabled();
  await expectNoHorizontalOverflow(page);
});

test("completes all 12 new A2 lessons and three new passages", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await seedA2Pilot(page);
  const lessons = [
    {
      title: "怎麼去車站",
      recall: ["How", "can", "I", "get", "to", "the", "station"],
      transfers: [
        "How can I get to the store?",
        "How can I get to school?",
      ],
    },
    {
      title: "搭公車",
      recall: ["You", "can", "take", "the", "bus"],
      transfers: ["I can take the bus.", "She can take the bus."],
    },
    {
      title: "買火車票",
      recall: ["I", "bought", "a", "train", "ticket", "yesterday"],
      transfers: [
        "I bought a train ticket at seven.",
        "I bought a train ticket at eight.",
      ],
    },
    {
      title: "火車出發時間",
      recall: ["The", "train", "leaves", "at", "nine", "tomorrow", "morning"],
      transfers: [
        "The train leaves at seven tomorrow morning.",
        "The train leaves at eight tomorrow morning.",
      ],
      passage: [
        "I am going to the station tomorrow.",
        "I can take the bus.",
        "I bought a train ticket yesterday.",
        "The train leaves at nine tomorrow morning.",
      ],
      questions: 5,
    },
    {
      title: "詢問價格",
      recall: ["How", "much", "is", "this", "shirt"],
      transfers: [
        "How much is this book?",
        "How much is this apple?",
      ],
    },
    {
      title: "比較價格",
      recall: ["This", "shirt", "is", "cheaper", "than", "that", "one"],
      transfers: [
        "This book is cheaper than that one.",
        "This apple is cheaper than that one.",
      ],
    },
    {
      title: "詢問尺寸",
      recall: ["Do", "you", "have", "a", "larger", "size"],
      transfers: [
        "Do you have this shirt?",
        "Do you have that one?",
      ],
    },
    {
      title: "太貴了",
      recall: ["It", "is", "too", "expensive", "for", "me"],
      transfers: [
        "This shirt is too expensive for me.",
        "That one is too expensive for me.",
      ],
      passage: [
        "I want this shirt.",
        "This shirt is cheaper than that one.",
        "I want a larger size.",
        "It is too expensive for me.",
      ],
      questions: 4,
    },
    {
      title: "我頭痛",
      recall: ["I", "have", "a", "headache"],
      transfers: [
        "I have a headache today.",
        "I have a headache at night.",
      ],
    },
    {
      title: "多喝水",
      recall: ["You", "should", "drink", "more", "water"],
      transfers: [
        "You should drink water at home.",
        "You should drink more water at night.",
      ],
    },
    {
      title: "去看醫生",
      recall: ["I", "have", "to", "see", "a", "doctor", "tomorrow"],
      transfers: [
        "I have to see a doctor today.",
        "I have to see a doctor at eight.",
      ],
    },
    {
      title: "晚餐後吃藥",
      recall: ["Take", "this", "medicine", "after", "dinner"],
      transfers: [
        "Take this medicine after breakfast.",
        "Take this medicine at eight.",
      ],
      passage: [
        "I have a headache today.",
        "You should drink more water.",
        "I have to see a doctor tomorrow.",
        "Take this medicine after dinner.",
      ],
      questions: 5,
    },
  ];

  for (const lesson of lessons) {
    await openA2Lesson(page, lesson.title);
    await answerRecallTokens(page, lesson.recall);
    await submitRebuild(page, lesson.recall);
    await completeEnhancedStages(
      page,
      lesson.transfers,
      !lesson.passage,
    );
    if (lesson.passage) {
      await completePassage(
        page,
        lesson.passage,
        lesson.questions ?? 0,
      );
    }
    await expectNoHorizontalOverflow(page);
  }

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return {
          completed: value.levelProgress?.A2?.completedLessonIds?.filter(
            (lessonId: string) => !lessonId.startsWith("a2-u01-"),
          ).length,
          passages: Object.keys(
            value.levelProgress?.A2?.passageStats ?? {},
          ).filter((passageId) => passageId !== "a2-u01-p01").length,
        };
      }, progressKey),
    )
    .toEqual({ completed: 12, passages: 3 });

  await page.reload();
  await expectLevelHomeReady(page, "A2");
  await expect(page.getByText("12 / 16", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("finishing current A2 pilot content never marks A2 formally passed", async ({
  page,
}) => {
  const disabledLevelRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/data\/b[12]-/i.test(request.url())) {
      disabledLevelRequests.push(request.url());
    }
  });
  await seedA2Pilot(
    page,
    [],
    [],
    "A2",
    ["a2-u01", "a2-u02", "a2-u03", "a2-u04"],
  );
  await page.goto("/");
  await expectLevelHomeReady(page, "A2");
  await expect(
    page.getByRole("heading", {
      name: "你已完成目前的A2試行內容",
    }),
  ).toBeVisible();
  await page.getByRole("button", {
    name: "前往課程地圖",
    exact: true,
  }).click();
  await expect(
    page.getByRole("heading", { name: "A2 課程地圖" }),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="level-selector-a2"]'),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator('[data-testid="a2-pilot-completion"]'),
  ).toContainText("你已完成目前的A2試行內容");
  await expect(
    page.getByText("A2 程度總測驗", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('[data-testid="level-selector-b1"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="level-selector-b2"]')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return {
          passedLevelIds: value.passedLevelIds,
          levelPassed: value.levelProgress?.A2?.levelPassed,
        };
      }, progressKey),
    )
    .toEqual({ passedLevelIds: [], levelPassed: false });
  expect(disabledLevelRequests).toEqual([]);
});

test("shows a Traditional Chinese A2 error without breaking A1", async ({
  page,
}) => {
  await page.route("**/data/a2-course-v1.csv", (route) =>
    route.fulfill({
      status: 500,
      contentType: "text/plain",
      body: "simulated A2 failure",
    }),
  );
  await seedA2Pilot(page, [], [], "A1");
  await page.goto("/");
  await expectLevelHomeReady(page, "A1");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
  await page.getByRole("button", {
    name: "前往課程地圖",
    exact: true,
  }).click();
  await expect(
    page.getByRole("heading", { name: "A1 課程地圖" }),
  ).toBeVisible();
  await page.locator('[data-testid="level-selector-a2"]').click();
  await expect(
    page.locator('[data-testid="a2-load-error"]'),
  ).toContainText("A2 試行課程資料載入失敗");
  await page.locator('[data-testid="return-a1-from-error"]').click();
  await expect(
    page.getByRole("heading", { name: "A1 課程地圖" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("shows the daily learning plan and weakness center", async ({ page }) => {
  await page.goto("/");
  await expectLevelHomeReady(page, "A1");
  await expect(page.locator('[data-testid="daily-learning-plan"]')).toBeVisible();
  await expect(page.locator('[data-testid="start-daily-learning"]')).toBeVisible();
  await page.getByRole("button", { name: "前往弱點中心" }).click();
  await expect(page.locator('[data-testid="weakness-center"]')).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "弱點中心", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-testid="weakness-empty-state"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
test("keeps the Windows one-click launchers in the project root", async () => {
  const root = path.resolve(process.cwd());
  expect(
    fs.existsSync(path.join(root, "啟動英句練習.bat")),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(root, "更新並啟動英句練習.bat")),
  ).toBe(true);
});


test("daily learning v3 with zero due reviews goes directly to the lesson", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-testid="daily-learning-plan"]')).toBeVisible();
  await page.locator('[data-testid="start-daily-learning"]').click();
  await expect(
    page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }),
  ).toBeVisible();
  await expect(page.locator('[data-testid="daily-session-resume"]')).toBeVisible();
});

test("due reviews remain active when vocabulary target metadata cannot load", async ({ page }) => {
  await page.route("**/data/vocabulary-targets-v1.json", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "simulated vocabulary target failure" }),
    }),
  );
  await seedDailyLearningFixture(page);
  await page.goto("/");
  await page.locator('[data-testid="start-daily-learning"]').click();
  await expect(page.locator('[data-testid="daily-review-counter"]')).toHaveText(
    "今日複習 1 / 1",
  );
});

test("active daily review resumes at item three and records all three evidence modes", async ({ page }) => {
  await seedDailyLearningFixture(page, {
    reviewOccurrenceIds: [
      "a1-u1-l1-t01",
      "a1-u1-l1-t02",
      "a1-u1-l2-t01",
      "a1-u1-l2-t02",
      "a1-u1-l3-t01",
    ],
  });
  await page.goto("/");
  await page.locator('[data-testid="start-daily-learning"]').click();
  await expect(page.locator('[data-testid="daily-review-counter"]')).toHaveText(
    "今日複習 1 / 5",
  );
  await page.locator('[data-testid="daily-review-input"]').fill("I");
  await page.locator('[data-testid="daily-review-check"]').click();
  await page.locator('[data-testid="daily-review-next"]').click();
  await expect(page.locator('[data-testid="daily-review-counter"]')).toHaveText(
    "今日複習 2 / 5",
  );
  await page.getByRole("button", { name: "是", exact: true }).click();
  await page.locator('[data-testid="daily-review-next"]').click();
  await expect(page.locator('[data-testid="daily-review-counter"]')).toHaveText(
    "今日複習 3 / 5",
  );

  await page.reload();
  await expectLevelHomeReady(page, "A1");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(page.locator('[data-testid="daily-review-counter"]')).toHaveText(
    "今日複習 3 / 5",
  );
  await page.locator('[data-testid="daily-review-input"]').fill("My name is Ben.");
  await page.locator('[data-testid="daily-review-check"]').click();
  await page.locator('[data-testid="daily-review-next"]').click();
  await page.locator('[data-testid="daily-review-input"]').fill("name");
  await page.locator('[data-testid="daily-review-check"]').click();
  await page.locator('[data-testid="daily-review-next"]').click();
  await page
    .getByRole("button", { name: "用於表達「很高興」", exact: true })
    .click();
  await page.locator('[data-testid="daily-review-next"]').click();
  await expect(
    page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }),
  ).toBeVisible();
  const evidence = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return {
      spelling: value?.vocabularyProgress?.i?.spellingCorrectEvidenceIds ?? [],
      recognition:
        value?.vocabularyProgress?.be?.recognitionCorrectEvidenceIds ?? [],
      application:
        value?.vocabularyProgress?.my?.applicationCorrectEvidenceIds ?? [],
    };
  }, progressKey);
  expect(evidence.spelling).toHaveLength(1);
  expect(evidence.recognition).toHaveLength(1);
  expect(evidence.application).toHaveLength(1);
  await expectNoHorizontalOverflow(page);
});

test("[PR1] daily application typed by hand records an attempt and clean correct evidence", async ({
  page,
}) => {
  await seedDailyLearningFixture(page, {
    weaknessLexemeIds: [],
    reviewOccurrenceIds: [
      "a1-u1-l1-t01",
      "a1-u1-l1-t02",
      "a1-u1-l2-t01",
    ],
  });
  await openDailyApplicationReview(page);

  await page.locator('[data-testid="daily-review-input"]').fill("My name is Ben.");
  await page.locator('[data-testid="daily-review-check"]').click();
  await expect(page.locator('[data-testid="daily-review-next"]')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        const progress = value.vocabularyProgress?.my ?? {};
        const attempts = Array.isArray(progress.applicationAttemptEvidenceIds)
          ? progress.applicationAttemptEvidenceIds.filter((id: unknown) =>
              typeof id === "string" && id.startsWith("daily-review:"),
            )
          : [];
        const correct = Array.isArray(progress.applicationCorrectEvidenceIds)
          ? progress.applicationCorrectEvidenceIds.filter((id: unknown) =>
              typeof id === "string" && id.startsWith("daily-review:"),
            )
          : [];
        return { attempts: attempts.length, correct: correct.length };
      }, progressKey),
    )
    .toEqual({ attempts: 1, correct: 1 });
  await expectNoDuplicateEvidenceIds(page);
});

test("[PR1] daily application paste state survives F5 and does not create clean correct evidence", async ({
  page,
}) => {
  await seedDailyLearningFixture(page, {
    weaknessLexemeIds: [],
    reviewOccurrenceIds: [
      "a1-u1-l1-t01",
      "a1-u1-l1-t02",
      "a1-u1-l2-t01",
    ],
  });
  await openDailyApplicationReview(page);

  const reviewItemId = "daily-review:a1-u1-l2-t01:application";
  await pasteValue(
    page,
    '[data-testid="daily-review-input"]',
    "My name is Ben.",
  );
  await expect
    .poll(() =>
      page.evaluate(
        ({ key, itemId }) => {
          const value = JSON.parse(localStorage.getItem(key) ?? "{}");
          return value.reviewItemProgress?.[itemId]?.usedPaste ?? false;
        },
        { key: dailySessionKey, itemId: reviewItemId },
      ),
    )
    .toBe(true);

  await page.reload();
  await expectLevelHomeReady(page, "A1");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(page.locator('[data-testid="daily-review-counter"]')).toHaveText(
    "今日複習 3 / 3",
  );
  await expect(page.getByText("請輸入完整英文句子", { exact: true })).toBeVisible();

  // The answer remains editable after reload; this verifies that the persisted
  // paste flag, rather than the current DOM event, controls attribution.
  await page.locator('[data-testid="daily-review-input"]').fill("My name is Ben.");
  await page.locator('[data-testid="daily-review-check"]').click();
  await expect(page.locator('[data-testid="daily-review-next"]')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        ({ progressStorageKey, sessionStorageKey, itemId }) => {
          const progress = JSON.parse(
            localStorage.getItem(progressStorageKey) ?? "{}",
          );
          const session = JSON.parse(
            localStorage.getItem(sessionStorageKey) ?? "{}",
          );
          const lexeme = progress.vocabularyProgress?.my ?? {};
          const dailyAttempts = Array.isArray(
            lexeme.applicationAttemptEvidenceIds,
          )
            ? lexeme.applicationAttemptEvidenceIds.filter((id: unknown) =>
                typeof id === "string" && id.startsWith("daily-review:"),
              )
            : [];
          const dailyCorrect = Array.isArray(
            lexeme.applicationCorrectEvidenceIds,
          )
            ? lexeme.applicationCorrectEvidenceIds.filter((id: unknown) =>
                typeof id === "string" && id.startsWith("daily-review:"),
              )
            : [];
          return {
            attempts: dailyAttempts.length,
            correct: dailyCorrect.length,
            usedPaste: session.reviewItemProgress?.[itemId]?.usedPaste ?? false,
            completed:
              session.completedReviewItemIds?.includes(itemId) ?? false,
          };
        },
        {
          progressStorageKey: progressKey,
          sessionStorageKey: dailySessionKey,
          itemId: reviewItemId,
        },
      ),
    )
    .toEqual({ attempts: 1, correct: 0, usedPaste: true, completed: true });
  await expectNoDuplicateEvidenceIds(page);
});

test("[PR1] weakness application paste completes without clean evidence or course completion", async ({
  page,
}) => {
  await seedDailyLearningFixture(page, {
    weaknessLexemeIds: ["my"],
    reviewOccurrenceIds: [],
    weaknessFocus: "application",
  });
  await page.goto("/");
  await expectLevelHomeReady(page, "A1");
  await page.getByRole("button", { name: "前往弱點中心", exact: true }).click();
  await expect(page.locator('[data-testid="weakness-center"]')).toBeVisible();
  const completedBefore = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    return value.levelProgress?.A1?.completedLessonIds ?? [];
  }, progressKey);

  await page.locator('[data-testid="practice-weakness-my"]').click();
  await expect(page.locator('[data-testid="weakness-practice"]')).toBeVisible();
  await expect(page.getByText("目前優先加強「運用」", { exact: false })).toBeVisible();
  await pasteValue(
    page,
    '[data-testid="weakness-practice-input"]',
    "My name is Ben.",
  );
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await expect(page.locator('[data-testid="weakness-practice-action"]')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        ({ key, completedBefore }) => {
          const value = JSON.parse(localStorage.getItem(key) ?? "{}");
          const progress = value.vocabularyProgress?.my ?? {};
          const attempts = Array.isArray(progress.applicationAttemptEvidenceIds)
            ? progress.applicationAttemptEvidenceIds.filter((id: unknown) =>
                typeof id === "string" && id.startsWith("weakness:application:"),
              )
            : [];
          const correct = Array.isArray(progress.applicationCorrectEvidenceIds)
            ? progress.applicationCorrectEvidenceIds.filter((id: unknown) =>
                typeof id === "string" && id.startsWith("weakness:application:"),
              )
            : [];
          const completed = value.levelProgress?.A1?.completedLessonIds ?? [];
          return {
            attempts: attempts.length,
            correct: correct.length,
            courseCompleted: JSON.stringify(completed) !==
              JSON.stringify(completedBefore),
          };
        },
        { key: progressKey, completedBefore },
      ),
    )
    .toEqual({ attempts: 1, correct: 0, courseCompleted: false });
  await expectNoDuplicateEvidenceIds(page);
});

test("[PR1] pattern transfer paste is isolated from the next hand-typed example", async ({
  page,
}) => {
  await seedProgress(
    page,
    lessonsThroughUnit(3),
    ["a1-u1", "a1-u2", "a1-u3"],
  );
  await openRecommendedLesson(page, "我有一顆蘋果");
  await answerRecallTokens(page, ["I", "have", "an", "apple"]);
  await submitRebuild(page, ["I", "have", "an", "apple"]);
  await page.locator("#recognition-option-correct").click();
  await page.locator("#recognition-check-button").click();
  await page.locator("#recognition-next-button").click();

  const transfer = page.locator("#pattern-transfer-answer");
  await pasteValue(page, "#pattern-transfer-answer", "I have a book.");
  await transfer.press("Enter");
  await expect(page.locator("#pattern-transfer-next-button")).toBeVisible();
  await page.locator("#pattern-transfer-next-button").click();
  await expect(transfer).toBeFocused();

  await transfer.fill("I have a pen.");
  await transfer.press("Enter");
  await expect(page.locator("#pattern-transfer-next-button")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        const evidenceFor = (lexemeId: string, field: string) => {
          const progress = value.vocabularyProgress?.[lexemeId] ?? {};
          const ids = progress[field];
          return Array.isArray(ids)
            ? ids.filter(
                (id: unknown) =>
                  typeof id === "string" && id.startsWith("transfer:"),
              )
            : [];
        };
        const bookCorrect = evidenceFor("book", "applicationCorrectEvidenceIds");
        const penCorrect = evidenceFor("pen", "applicationCorrectEvidenceIds");
        return {
          attempts: evidenceFor("i", "applicationAttemptEvidenceIds").length,
          firstExampleCorrect: bookCorrect.some((id: string) =>
            id.includes("have-possession-book"),
          ),
          secondExampleCorrect: penCorrect.some((id: string) =>
            id.includes("have-possession-pen"),
          ),
        };
      }, progressKey),
    )
    .toEqual({
      attempts: 2,
      firstExampleCorrect: false,
      secondExampleCorrect: true,
    });
  await expectNoDuplicateEvidenceIds(page);
});

test("[PR1] pasted sentence rebuild records an attempt without clean evidence and survives reload", async ({
  page,
}) => {
  await openRecommendedLesson(page, "我是誰");
  await answerRecallTokens(page, ["I", "am", "Amy"]);

  const words = ["I", "am", "Amy"];
  const fields = page.locator(".rebuild-field input");
  await expect(fields).toHaveCount(words.length);
  await expect(fields.first()).toBeFocused();
  for (let index = 0; index < words.length; index += 1) {
    const field = fields.nth(index);
    await field.fill(words[index]);
    await field.dispatchEvent("paste", {
      bubbles: true,
      cancelable: true,
    });
  }
  await page.getByRole("button", { name: /檢查順序與拼字/ }).click();
  await expect(
    page.getByRole("heading", { name: "做得好！你已完成本課文字練習" }),
  ).toBeVisible();

  const expectedEvidence = {
    attempts: 1,
    correct: 0,
    rebuildAttempts: 1,
    completed: true,
  };
  const readRebuildEvidence = () =>
    page.evaluate((key) => {
      const value = JSON.parse(localStorage.getItem(key) ?? "{}");
      const progress = value.vocabularyProgress?.i ?? {};
      const attempts = Array.isArray(progress.applicationAttemptEvidenceIds)
        ? progress.applicationAttemptEvidenceIds.filter((id: unknown) =>
            typeof id === "string" && id.startsWith("rebuild:"),
          )
        : [];
      const correct = Array.isArray(progress.applicationCorrectEvidenceIds)
        ? progress.applicationCorrectEvidenceIds.filter((id: unknown) =>
            typeof id === "string" && id.startsWith("rebuild:"),
          )
        : [];
      return {
        attempts: attempts.length,
        correct: correct.length,
        rebuildAttempts:
          value.levelProgress?.A1?.sentenceStats?.["a1-u1-l1-p01-s01"]
            ?.rebuildAttempts ?? 0,
        completed:
          value.levelProgress?.A1?.completedLessonIds?.includes("a1-u1-l1") ??
          false,
      };
    }, progressKey);
  await expect.poll(readRebuildEvidence).toEqual(expectedEvidence);
  await expectNoDuplicateEvidenceIds(page);

  await page.reload();
  await expectLevelHomeReady(page, "A1");
  await expect.poll(readRebuildEvidence).toEqual(expectedEvidence);
  await expectNoDuplicateEvidenceIds(page);
});

test("revealed spelling must be retyped and never creates clean spelling evidence", async ({ page }) => {
  await seedDailyLearningFixture(page);
  await page.goto("/");
  await page.locator('[data-testid="start-daily-learning"]').click();
  const input = page.locator('[data-testid="daily-review-input"]');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await input.fill("x");
    await page.locator('[data-testid="daily-review-check"]').click();
  }
  await expect(
    page.locator('[data-testid="daily-review-revealed-answer"]'),
  ).toHaveText("I");
  await input.fill("I");
  await page.locator('[data-testid="daily-review-check"]').click();
  await expect(page.locator('[data-testid="daily-review-next"]')).toBeVisible();
  const spellingCorrect = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return value?.vocabularyProgress?.i?.spellingCorrectEvidenceIds ?? [];
  }, progressKey);
  expect(spellingCorrect).toEqual([]);
});

test("leaving an active daily review keeps it unfinished", async ({ page }) => {
  await seedDailyLearningFixture(page);
  await page.goto("/");
  await page.locator('[data-testid="start-daily-learning"]').click();
  await page.locator('[data-testid="leave-daily-review"]').click();
  await expectLevelHomeReady(page, "A1");
  const completedSteps = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return value?.completedSteps ?? [];
  }, dailySessionKey);
  expect(completedSteps).not.toContain("review");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(page.locator('[data-testid="daily-review-counter"]')).toHaveText(
    "今日複習 1 / 1",
  );
});

test("an open daily session expires after local midnight without changing progress", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-19T15:50:00.000Z"));
  await seedDailyLearningFixture(page, { reviewOccurrenceIds: [] });
  await seedDailySessionRecord(page);
  await page.goto("/");
  await expect(page.locator('[data-testid="daily-session-resume"]')).toBeVisible();
  const before = await page.evaluate((key) => localStorage.getItem(key), progressKey);
  await page.clock.setFixedTime(new Date("2026-08-19T16:10:00.000Z"));
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(
    page.getByText(
      "日期已變更，昨天的今日學習已結束，請重新開始今天的學習。",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.locator('[data-testid="daily-session-resume"]')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), dailySessionKey))
    .toBeNull();
  const after = await page.evaluate((key) => localStorage.getItem(key), progressKey);
  expect(after).toBe(before);
  await expectLevelHomeReady(page, "A1");
});

test("daily summary counts two active five-minute segments but excludes a ten-hour reload gap", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-19T00:00:00.000Z"));
  await seedDailyLearningFixture(page);
  const item = dailyReviewQueueItem("a1-u1-l1-t01", "i", "spelling");
  await seedDailySessionRecord(page, {
    reviewCount: 1,
    reviewItems: [item],
    completedSteps: ["lesson"],
  });
  await page.goto("/");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await page.clock.setFixedTime(new Date("2026-08-19T00:05:00.000Z"));
  await page.reload();
  await expectLevelHomeReady(page, "A1");
  await page.clock.setFixedTime(new Date("2026-08-19T10:05:00.000Z"));
  await page.locator('[data-testid="daily-session-resume"]').click();
  await page.clock.setFixedTime(new Date("2026-08-19T10:10:00.000Z"));
  await page.locator('[data-testid="daily-review-input"]').fill("I");
  await page.locator('[data-testid="daily-review-check"]').click();
  await page.locator('[data-testid="daily-review-next"]').click();
  await expect(page.locator('[data-testid="daily-learning-summary"]')).toBeVisible();
  await expect(
    page.locator('[data-testid="daily-learning-summary"] .stat-card').filter({
      hasText: "今日時間",
    }),
  ).toContainText("10 分鐘");
});

test("active lesson and weakness transitions preserve the latest time checkpoint", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-19T00:00:00.000Z"));
  await seedDailyLearningFixture(page, {
    reviewOccurrenceIds: [],
    weaknessLexemeIds: ["i", "be"],
  });
  await seedDailySessionRecord(page, {
    completedSteps: ["review"],
    weaknessLexemeIds: ["i", "be"],
  });
  await page.goto("/");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await page
    .getByRole("button", { name: /從中文提示與逐字輸入開始/ })
    .click();
  await answerRecallTokens(page, ["I", "am", "Amy"]);
  await submitRebuild(page, ["I", "am", "Amy"]);
  await expect(page.locator("#lesson-result-next")).toBeVisible();

  await page.clock.setFixedTime(new Date("2026-08-19T00:05:00.000Z"));
  await page.locator("#lesson-result-next").click();
  await expect(page.getByText("弱點加強・1/2", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "null");
        return {
          seconds: value?.activeStudySeconds ?? 0,
          activeStartedAt: value?.activeStartedAt ?? null,
        };
      }, dailySessionKey),
    )
    .toEqual({
      seconds: 300,
      activeStartedAt: new Date("2026-08-19T00:05:00.000Z").getTime(),
    });

  await page.locator('[data-testid="weakness-practice-input"]').fill("I");
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await page.clock.setFixedTime(new Date("2026-08-19T00:06:00.000Z"));
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await expect(page.getByText("弱點加強・2/2", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "null");
        return {
          seconds: value?.activeStudySeconds ?? 0,
          activeStartedAt: value?.activeStartedAt ?? null,
          completed: value?.completedWeaknessLexemeIds ?? [],
        };
      }, dailySessionKey),
    )
    .toEqual({
      seconds: 360,
      activeStartedAt: new Date("2026-08-19T00:06:00.000Z").getTime(),
      completed: ["i"],
    });
});

test("daily learning restores the correct lesson and weakness steps after reload", async ({ page }) => {
  await seedDailyLearningFixture(page);
  await page.goto("/");
  await expect(page.locator('[data-testid="daily-learning-plan"]')).toBeVisible();
  await page.locator('[data-testid="start-daily-learning"]').click();
  await completeSpellingDailyReview(page, "I");
  await expect(
    page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "null");
        return value?.completedSteps ?? [];
      }, dailySessionKey),
    )
    .toContain("review");

  await page.reload();
  await expectLevelHomeReady(page, "A1");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(
    page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /從中文提示與逐字輸入開始/ })
    .click();
  await answerRecallTokens(page, ["I", "am", "Amy"]);
  await submitRebuild(page, ["I", "am", "Amy"]);
  await expect(page.locator("#lesson-result-next")).toBeVisible();
  await page.locator("#lesson-result-next").click();
  await expect(page.locator('[data-testid="weakness-practice"]')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "null");
        return value?.completedSteps ?? [];
      }, dailySessionKey),
    )
    .toContain("lesson");

  await page.reload();
  await expectLevelHomeReady(page, "A1");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(page.locator('[data-testid="weakness-practice"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.locator('[data-testid="weakness-practice-input"]').fill("I");
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await expect(
    page.getByText("這次答對了，已記錄為有效的弱點練習。", { exact: true }),
  ).toBeVisible();
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await expect(page.locator('[data-testid="daily-learning-summary"]')).toBeVisible();
  await page.locator('[data-testid="finish-daily-session"]').click();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), dailySessionKey))
    .toBeNull();
});

test("daily learning restores its original A1 lesson after switching to A2", async ({ page }) => {
  await seedDailyLearningFixture(page, { showAdvancedPilots: true });
  await page.goto("/");
  await expectLevelHomeReady(page, "A1");
  await page.locator('[data-testid="start-daily-learning"]').click();
  await completeSpellingDailyReview(page, "I");
  await expect(
    page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "前往課程地圖", exact: true }).click();
  await page.locator('[data-testid="level-selector-a2"]').click();
  await expect(
    page.getByRole("heading", { name: "A2 課程地圖" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "null");
        return value?.selectedLevel;
      }, progressKey),
    )
    .toBe("A2");

  await page.reload();
  await expectLevelHomeReady(page, "A2");
  const beforeResumeProgress = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return {
      levelProgress: value?.levelProgress,
      passedLevelIds: value?.passedLevelIds,
      vocabularyProgress: value?.vocabularyProgress,
    };
  }, progressKey);
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(
    page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }),
  ).toBeVisible();
  await expect(page.getByText("A1・單元 1・第 1 課", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "null");
        return {
          selectedLevel: value?.selectedLevel,
          levelProgress: value?.levelProgress,
          passedLevelIds: value?.passedLevelIds,
          vocabularyProgress: value?.vocabularyProgress,
        };
      }, progressKey),
    )
    .toEqual({
      selectedLevel: "A1",
      ...beforeResumeProgress,
    });
});

test("daily learning clears a missing lesson instead of opening another course", async ({ page }) => {
  await seedDailyLearningFixture(page);
  await seedDailySessionRecord(page, { lessonId: "a1-u99-l99" });
  await page.goto("/");
  await expectLevelHomeReady(page, "A1");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(
    page.getByText("今日學習內容已更新，已重新建立今日學習流程。", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('[data-testid="daily-session-resume"]')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), dailySessionKey))
    .toBeNull();
  await expectLevelHomeReady(page, "A1");
});

test("daily weakness practice resumes at the first unfinished lexeme after reload", async ({ page }) => {
  await seedDailyLearningFixture(page, {
    weaknessLexemeIds: ["i", "be", "name"],
  });
  await seedDailySessionRecord(page, {
    weaknessLexemeIds: ["i", "be", "name"],
    completedSteps: ["lesson"],
  });
  await page.goto("/");
  await expectLevelHomeReady(page, "A1");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(page.getByText("弱點加強・1/3", { exact: true })).toBeVisible();
  await page.locator('[data-testid="weakness-practice-input"]').fill("I");
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "null");
        return value?.completedWeaknessLexemeIds ?? [];
      }, dailySessionKey),
    )
    .toEqual(["i"]);
  await expect(page.getByText("弱點加強・2/3", { exact: true })).toBeVisible();

  await page.reload();
  await expectLevelHomeReady(page, "A1");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(page.getByText("弱點加強・2/3", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "be", exact: true })).toBeVisible();
  await page.locator('[data-testid="weakness-practice-input"]').fill("am");
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "null");
        return value?.completedWeaknessLexemeIds ?? [];
      }, dailySessionKey),
    )
    .toEqual(["i", "be"]);
  await expect(page.getByText("弱點加強・3/3", { exact: true })).toBeVisible();

  await page.reload();
  await expectLevelHomeReady(page, "A1");
  await page.locator('[data-testid="daily-session-resume"]').click();
  await expect(page.getByText("弱點加強・3/3", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "name", exact: true })).toBeVisible();
});

test("daily learning expires a session saved on a previous local day", async ({ page }) => {
  await page.addInitScript(
    ({ key }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 3,
          localDate: "2000-01-01",
          level: "A1",
          startedAt: 946684800000,
          lessonId: "a1-u1-l1",
          reviewCount: 0,
          reviewItems: [],
          completedReviewItemIds: [],
          reviewItemProgress: {},
          weaknessLexemeIds: ["i"],
          completedWeaknessLexemeIds: [],
          completedSteps: ["review"],
          beforeVocabulary: { exposed: 0, receptive: 0, active: 0 },
          activeStudySeconds: 120,
          activeStartedAt: null,
        }),
      );
    },
    { key: dailySessionKey },
  );
  await page.goto("/");
  await expectLevelHomeReady(page, "A1");
  await expect(page.locator('[data-testid="daily-session-resume"]')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), dailySessionKey))
    .toBeNull();
});

test("shows the same true Monday-Sunday study count on home and top bar", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-19T04:00:00.000Z"));
  const progress = {
    ...progressFixture(),
    studyDates: [
      "2026-07-01",
      "2026-08-16",
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-19",
      "2026-08-24",
    ],
  };
  await page.addInitScript(
    ({ key, progress }) =>
      localStorage.setItem(key, JSON.stringify(progress)),
    { key: progressKey, progress },
  );
  await page.goto("/");
  await expectLevelHomeReady(page, "A1");
  await expect(page.locator('[data-testid="home-weekly-study-days"]')).toContainText("3 天");
  await expect(page.locator('[data-testid="topbar-weekly-study-days"]')).toHaveText("◆ 本週 3 天");
});

test("weakness center opens focused spelling practice after a real mistake", async ({ page }) => {
  await openRecommendedLesson(page, "我是誰");
  const input = page.locator("#recall-answer-0");
  await input.fill("you");
  await input.press("Enter");
  await page.getByRole("button", { name: "前往弱點中心" }).click();
  await expect(page.locator('[data-testid="weakness-center"]')).toBeVisible();
  await page.locator('[data-testid="practice-weakness-i"]').click();
  await expect(page.locator('[data-testid="weakness-practice"]')).toBeVisible();
  const practiceInput = page.locator('[data-testid="weakness-practice-input"]');
  await practiceInput.fill("I");
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await expect(page.getByText("這次答對了，已記錄為有效的弱點練習。", { exact: true })).toBeVisible();
  await page.locator('[data-testid="weakness-practice-action"]').click();
  await expect(page.locator('[data-testid="weakness-center"]')).toBeVisible();
});
