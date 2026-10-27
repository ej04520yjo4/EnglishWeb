import { expect, type Page, test } from "@playwright/test";

const progressKey = "yingju-progress-v1";
const settingsKey = "yingju-settings-v1";

test.use({ actionTimeout: 15_000 });

type LevelProgress = {
  completedLessonIds: string[];
  passedUnitIds: string[];
  levelPassed: boolean;
  totalAttempts: number;
  correctAnswers: number;
  totalSeconds: number;
  pasteCount: number;
  studyDates: string[];
  reviewItems: Record<string, unknown>;
  lexemeProgress: Record<string, unknown>;
  senseProgress: Record<string, unknown>;
  sentencePatternProgress: Record<string, unknown>;
  tokenProgress: Record<string, unknown>;
  sentenceStats: Record<string, unknown>;
  patternStats: Record<string, unknown>;
  passageStats: Record<string, unknown>;
  tokenHintLevels: Record<string, unknown>;
  chunkHintLevels: Record<string, unknown>;
  patternHintLevels: Record<string, unknown>;
  reviewExerciseTypes: Record<string, unknown>;
};

const emptyLevelProgress = (
  completedLessonIds: string[] = [],
  passedUnitIds: string[] = [],
): LevelProgress => ({
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

const priorA2Lessons = Array.from({ length: 6 }, (_, unitIndex) =>
  Array.from(
    { length: 4 },
    (_, lessonIndex) => `a2-u0${unitIndex + 1}-l0${lessonIndex + 1}`,
  ),
).flat();
const priorA2Units = Array.from(
  { length: 6 },
  (_, unitIndex) => `a2-u0${unitIndex + 1}`,
);

const progressFixture = ({
  completedA2 = [],
  passedA2 = [],
  passedLevelIds = [],
  selectedLevel = "A2",
}: {
  completedA2?: string[];
  passedA2?: string[];
  passedLevelIds?: string[];
  selectedLevel?: "A1" | "A2" | "B1" | "B2";
} = {}) => ({
  schemaVersion: 5,
  selectedLevel,
  passedLevelIds,
  levelProgress: {
    A1: emptyLevelProgress(),
    A2: emptyLevelProgress(completedA2, passedA2),
    B1: emptyLevelProgress(),
    B2: emptyLevelProgress(),
  },
});

const seedA2 = async (
  page: Page,
  options: {
    completedA2?: string[];
    passedA2?: string[];
    passedLevelIds?: string[];
    showAdvancedPilots?: boolean;
  } = {},
) => {
  const progress = progressFixture(options);
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
  await expectNoHorizontalOverflow(page);
  await page.locator("#recognition-option-correct").click();
  await expectNoHorizontalOverflow(page);
  await page.locator("#recognition-check-button").click();
  await page.locator("#recognition-next-button").click();

  const transfer = page.locator("#pattern-transfer-answer");
  for (const answer of transferAnswers) {
    await expect(transfer).toBeFocused();
    await expectNoHorizontalOverflow(page);
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
  await expectNoHorizontalOverflow(page);
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
  await expectNoHorizontalOverflow(page);
};

const expectNoHorizontalOverflow = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    )
    .toBe(true);
};

test("A2 QA preview exposes unit seven without passing the level", async ({ page }) => {
  await seedA2(page, { showAdvancedPilots: true });
  await openA2Map(page);

  await expect(page.locator(".unit-card .lesson-row:not(.test-row)")).toHaveCount(28);
  await expect(page.getByRole("heading", { name: "經驗與生活改變" })).toBeVisible();
  await expect(page.getByRole("button", { name: /分享旅行經驗/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /詢問曾經去過的地方/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /描述生活改變/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /說說新的工作/ })).toBeEnabled();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return {
          passedLevelIds: value.passedLevelIds ?? [],
          passedUnitIds: value.levelProgress?.A2?.passedUnitIds ?? [],
          completedLessonIds: value.levelProgress?.A2?.completedLessonIds ?? [],
        };
      }, progressKey),
    )
    .toEqual({
      passedLevelIds: [],
      passedUnitIds: [],
      completedLessonIds: [],
    });
});

test("normal A2 progression keeps unit seven locked until unit six passes", async ({
  page,
}) => {
  await seedA2(page, {
    completedA2: priorA2Lessons,
    passedA2: priorA2Units.slice(0, -1),
    passedLevelIds: ["A1"],
  });
  await openA2Map(page);

  await expect(page.getByRole("heading", { name: "經驗與生活改變" })).toBeVisible();
  await expect(page.getByRole("button", { name: /分享旅行經驗/ })).toBeDisabled();
});

test("completes unit seven, passage comprehension, and persists progress", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await seedA2(page, {
    completedA2: priorA2Lessons,
    passedA2: priorA2Units,
    passedLevelIds: ["A1"],
  });

  await openA2Map(page);
  await expect(page.getByRole("button", { name: /分享旅行經驗/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /詢問曾經去過的地方/ })).toBeDisabled();
  const a1BeforeLessons = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    return value.levelProgress?.A1 ?? null;
  }, progressKey);

  const lessons = [
    {
      title: "分享旅行經驗",
      id: "a2-u07-l01",
      recall: ["I", "have", "been", "to", "Taiwan"],
      transfers: [
        "We have been to Taiwan.",
        "I have been to that store.",
      ],
    },
    {
      title: "詢問曾經去過的地方",
      id: "a2-u07-l02",
      recall: ["Have", "you", "been", "to", "Taiwan", "before"],
      transfers: [
        "Have you been to that store before?",
        "Have you been to this station before?",
      ],
    },
    {
      title: "描述生活改變",
      id: "a2-u07-l03",
      recall: ["My", "life", "is", "different", "now"],
      transfers: [
        "My room is different now.",
        "My house is different now.",
      ],
    },
    {
      title: "說說新的工作",
      id: "a2-u07-l04",
      recall: ["I", "have", "a", "new", "job", "now"],
      transfers: [
        "I have a new book now.",
        "I have a new bag now.",
      ],
      passage: [
        "Have you been to Taiwan before?",
        "I have been to Taiwan.",
        "I have a new job now.",
        "My life is different now.",
        "I go to work by train.",
        "I usually clean my room on Saturday.",
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
          lessons: (progress?.completedLessonIds ?? []).filter((id: string) =>
            id.startsWith("a2-u07-"),
          ),
          passageRebuildAttempts: progress?.passageStats?.["a2-u07-p01"]
            ?.rebuildAttempts,
          comprehensionCorrect: progress?.passageStats?.["a2-u07-p01"]
            ?.comprehensionCorrect,
        };
      }, progressKey),
    )
    .toEqual({
      lessons: [
        "a2-u07-l01",
        "a2-u07-l02",
        "a2-u07-l03",
        "a2-u07-l04",
      ],
      passageRebuildAttempts: 1,
      comprehensionCorrect: 4,
    });

  const a2EvidenceBeforeReload = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    const progress = value.levelProgress?.A2 ?? {};
    return {
      tokenProgress: progress.tokenProgress ?? {},
      sentenceStats: progress.sentenceStats ?? {},
      patternStats: progress.patternStats ?? {},
      passageStats: progress.passageStats ?? {},
      reviewItems: progress.reviewItems ?? {},
      tokenHintLevels: progress.tokenHintLevels ?? {},
      chunkHintLevels: progress.chunkHintLevels ?? {},
      patternHintLevels: progress.patternHintLevels ?? {},
    };
  }, progressKey);

  await page.reload();
  await expect(page.getByText("28 / 28", { exact: true })).toBeVisible();
  const a2EvidenceAfterReload = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    const progress = value.levelProgress?.A2 ?? {};
    return {
      tokenProgress: progress.tokenProgress ?? {},
      sentenceStats: progress.sentenceStats ?? {},
      patternStats: progress.patternStats ?? {},
      passageStats: progress.passageStats ?? {},
      reviewItems: progress.reviewItems ?? {},
      tokenHintLevels: progress.tokenHintLevels ?? {},
      chunkHintLevels: progress.chunkHintLevels ?? {},
      patternHintLevels: progress.patternHintLevels ?? {},
    };
  }, progressKey);
  expect(a2EvidenceAfterReload).toEqual(a2EvidenceBeforeReload);
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return value.levelProgress?.A2?.completedLessonIds?.filter((id: string) =>
          id.startsWith("a2-u07-"),
        );
      }, progressKey),
    )
    .toEqual([
      "a2-u07-l01",
      "a2-u07-l02",
      "a2-u07-l03",
      "a2-u07-l04",
    ]);

  await page.getByRole("button", { name: "前往課程地圖", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A2 課程地圖" })).toBeVisible();
  await page.getByTestId("level-selector-a1").click();
  await expect(page.getByRole("heading", { name: "A1 課程地圖" })).toBeVisible();
  const a1AfterSwitch = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    return value.levelProgress?.A1 ?? null;
  }, progressKey);
  expect(a1AfterSwitch).toEqual(a1BeforeLessons);
});

test("unit seven map and learning surface have no horizontal overflow", async ({
  page,
}) => {
  await seedA2(page, {
    completedA2: priorA2Lessons,
    passedA2: priorA2Units,
    passedLevelIds: ["A1"],
    showAdvancedPilots: true,
  });
  await openA2Map(page);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
    .toBe(true);

  await page.getByRole("button", { name: /分享旅行經驗/ }).click();
  await page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }).click();
  await expectNoHorizontalOverflow(page);
});
