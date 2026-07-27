import { expect, Page, test } from "@playwright/test";

const progressKey = "yingju-progress-v1";
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
  await expect(page.locator("#lesson-result-next")).toBeVisible();
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
        return value.completedLessonIds?.includes("a1-u1-l1");
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

test("completes the be-identification second-batch flow", async ({
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
    "She is Amy.",
    "He is Ben.",
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
