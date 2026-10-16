import { expect, Page, test } from "@playwright/test";

const progressKey = "yingju-progress-v1";
const settingsKey = "yingju-settings-v1";

const levelProgressFixture = (
  completedLessonIds: string[] = [],
  passedUnitIds: string[] = [],
) => ({
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

const multiLevelProgressFixture = ({
  a2Completed = [],
  a2PassedUnitIds = [],
  selectedLevel = "A2",
  passedLevelIds = [],
}: {
  a2Completed?: string[];
  a2PassedUnitIds?: string[];
  selectedLevel?: "A1" | "A2" | "B1" | "B2";
  passedLevelIds?: string[];
} = {}) => ({
  schemaVersion: 5,
  selectedLevel,
  passedLevelIds,
  levelProgress: {
    A1: levelProgressFixture(),
    A2: levelProgressFixture(a2Completed, a2PassedUnitIds),
    B1: levelProgressFixture(),
    B2: levelProgressFixture(),
  },
});

const seedA2 = async (
  page: Page,
  options: {
    a2Completed?: string[];
    a2PassedUnitIds?: string[];
    passedLevelIds?: string[];
    showAdvancedPilots?: boolean;
  } = {},
) => {
  const progress = multiLevelProgressFixture(options);
  await page.addInitScript(
    ({ progressStorageKey, settingsStorageKey, progressValue, showAdvancedPilots }) => {
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

const openA2Map = async (page: Page) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "把英文從「看得懂」練成「寫得出來」" }),
  ).toBeVisible();
  await expect(page.getByText("A2 完成度", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "前往課程地圖", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A2 課程地圖" })).toBeVisible();
};

const openA2Lesson = async (page: Page, title: string) => {
  await openA2Map(page);
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await page
    .getByRole("button", { name: /從中文提示與逐字輸入開始/ })
    .click();
  await expect(page.locator("#recall-answer-0")).toBeFocused();
};

const answerRecallTokens = async (page: Page, answers: string[]) => {
  for (const answer of answers) {
    const input = page.locator("#recall-answer-0");
    await input.fill(answer);
    await input.press("Enter");
    await expect(page.getByText("回答正確", { exact: true })).toBeVisible();
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
  await page.getByRole("button", { name: /檢查順序與拼字/ }).click();
};

const completeEnhancedStages = async (
  page: Page,
  transferAnswers: string[],
  expectResult: boolean,
) => {
  await page.locator("#recognition-option-correct").click();
  await page.locator("#recognition-check-button").click();
  await page.locator("#recognition-next-button").click();

  const transfer = page.locator("#pattern-transfer-answer");
  for (const answer of transferAnswers) {
    await expect(transfer).toBeFocused();
    await transfer.fill(answer);
    await transfer.press("Enter");
    const nextButton = page.locator("#pattern-transfer-next-button");
    await expect(nextButton).toBeVisible();
    await nextButton.press("Enter");
  }

  await page.locator("#text-response-option-correct").click();
  await page.locator("#text-response-check-button").click();
  await page.locator("#text-response-next-button").click();
  if (expectResult) {
    await expect(page.locator("#lesson-result-next")).toBeVisible();
  }
};

const completePassage = async (
  page: Page,
  sentences: string[],
  questionCount: number,
) => {
  const fields = page.locator("[id^='passage-sentence-']");
  await expect(fields).toHaveCount(sentences.length);
  for (let index = 0; index < sentences.length; index += 1) {
    await fields.nth(index).fill(sentences[index]);
  }
  await page.getByRole("button", { name: "檢查整段文章" }).click();
  for (let question = 0; question < questionCount; question += 1) {
    await page.locator("#passage-answer-0").click();
    await page.locator("#passage-question-check-button").click();
    await page.locator("#passage-question-next-button").click();
  }
  await expect(page.locator("#lesson-result-next")).toBeVisible();
};

const priorA2Lessons = Array.from({ length: 5 }, (_, unitIndex) =>
  Array.from(
    { length: 4 },
    (_, lessonIndex) => `a2-u0${unitIndex + 1}-l0${lessonIndex + 1}`,
  ),
).flat();
const priorA2Units = Array.from(
  { length: 5 },
  (_, unitIndex) => `a2-u0${unitIndex + 1}`,
);

test("A2 QA preview shows all six units and 24 lessons without passing A2", async ({
  page,
}) => {
  await seedA2(page, { showAdvancedPilots: true });
  await openA2Map(page);

  await expect(page.locator(".unit-card .lesson-row:not(.test-row)")).toHaveCount(24);
  await expect(page.getByRole("button", { name: /平常的家務/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /必須洗碗/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /請求幫忙洗衣服/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /星期六打掃房子/ })).toBeEnabled();

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return {
          passedLevelIds: value.passedLevelIds ?? [],
          passedUnitIds: value.levelProgress?.A2?.passedUnitIds ?? [],
        };
      }, progressKey),
    )
    .toEqual({ passedLevelIds: [], passedUnitIds: [] });
});

test("normal A2 progression unlocks household unit six only after unit five", async ({
  page,
}) => {
  await seedA2(page, {
    a2Completed: priorA2Lessons,
    a2PassedUnitIds: priorA2Units,
    passedLevelIds: ["A1"],
  });
  await openA2Map(page);

  const firstLesson = page.getByRole("button", { name: /平常的家務/ });
  const secondLesson = page.getByRole("button", { name: /必須洗碗/ });
  await expect(firstLesson).toBeEnabled();
  await expect(secondLesson).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "居家與日常家務" }),
  ).toBeVisible();
});

test("completes all four A2 household lessons, passage comprehension, and reload persistence", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await seedA2(page, {
    a2Completed: priorA2Lessons,
    a2PassedUnitIds: priorA2Units,
    passedLevelIds: ["A1"],
  });

  const lessons = [
    {
      title: "平常的家務",
      recall: ["I", "usually", "clean", "my", "room"],
      transfers: [
        "I usually clean the room.",
        "We usually clean the room.",
      ],
    },
    {
      title: "必須洗碗",
      recall: ["I", "have", "to", "wash", "the", "dishes"],
      transfers: [
        "I have to clean the room.",
        "We have to wash the dishes.",
      ],
    },
    {
      title: "請求幫忙洗衣服",
      recall: ["Can", "you", "help", "me", "with", "the", "laundry"],
      transfers: [
        "Can you help me with the dishes?",
        "Can you help me with my laundry?",
      ],
    },
    {
      title: "星期六打掃房子",
      recall: ["We", "clean", "the", "house", "on", "Saturday"],
      transfers: [
        "I clean the room on Saturday.",
        "We clean the house on Friday.",
      ],
      passage: [
        "I usually clean my room on Saturday.",
        "I have to wash the dishes.",
        "Can you help me with the laundry?",
        "I can help you.",
        "We clean the house on Saturday.",
      ],
    },
  ];

  for (const lesson of lessons) {
    await openA2Lesson(page, lesson.title);
    await answerRecallTokens(page, lesson.recall);
    await submitRebuild(page, lesson.recall);
    await completeEnhancedStages(page, lesson.transfers, !lesson.passage);
    if (lesson.passage) {
      await completePassage(page, lesson.passage, 4);
    }
  }

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        const progress = value.levelProgress?.A2;
        return {
          householdLessons: (progress?.completedLessonIds ?? []).filter(
            (id: string) => id.startsWith("a2-u06-"),
          ),
          passageRebuildAttempts: progress?.passageStats?.["a2-u06-p01"]
            ?.rebuildAttempts,
          comprehensionCorrect: progress?.passageStats?.["a2-u06-p01"]
            ?.comprehensionCorrect,
        };
      }, progressKey),
    )
    .toEqual({
      householdLessons: [
        "a2-u06-l01",
        "a2-u06-l02",
        "a2-u06-l03",
        "a2-u06-l04",
      ],
      passageRebuildAttempts: 1,
      comprehensionCorrect: 4,
    });

  await page.reload();
  await expect(page.getByText("24 / 24", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return value.levelProgress?.A2?.completedLessonIds?.filter(
          (id: string) => id.startsWith("a2-u06-"),
        );
      }, progressKey),
    )
    .toEqual([
      "a2-u06-l01",
      "a2-u06-l02",
      "a2-u06-l03",
      "a2-u06-l04",
    ]);
});
