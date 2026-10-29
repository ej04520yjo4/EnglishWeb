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

const priorA2Lessons = Array.from({ length: 7 }, (_, unitIndex) =>
  Array.from(
    { length: 4 },
    (_, lessonIndex) => `a2-u0${unitIndex + 1}-l0${lessonIndex + 1}`,
  ),
).flat();
const priorA2Units = Array.from(
  { length: 7 },
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
  recognitionStem?: string,
) => {
  await expectNoHorizontalOverflow(page);
  if (recognitionStem) {
    await expect(page.getByText(recognitionStem, { exact: true })).toBeVisible();
    await expect(
      page.getByText("請選出最符合英文句子的中文意思。", { exact: true }),
    ).toBeVisible();
  }
  await page.locator("#recognition-option-correct").click();
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

const readA2Evidence = async (page: Page) =>
  page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    const progress = value.levelProgress?.A2 ?? {};
    return {
      tokenProgress: progress.tokenProgress ?? {},
      lexemeProgress: progress.lexemeProgress ?? {},
      senseProgress: progress.senseProgress ?? {},
      sentencePatternProgress: progress.sentencePatternProgress ?? {},
      sentenceStats: progress.sentenceStats ?? {},
      patternStats: progress.patternStats ?? {},
      passageStats: progress.passageStats ?? {},
      reviewItems: progress.reviewItems ?? {},
      tokenHintLevels: progress.tokenHintLevels ?? {},
      chunkHintLevels: progress.chunkHintLevels ?? {},
      patternHintLevels: progress.patternHintLevels ?? {},
    };
  }, progressKey);

test("A2 QA preview exposes unit eight without passing the level", async ({
  page,
}) => {
  await seedA2(page, { showAdvancedPilots: true });
  await openA2Map(page);

  await expect(page.locator(".unit-card .lesson-row:not(.test-row)")).toHaveCount(32);
  await expect(page.getByRole("heading", { name: "問題與簡單解決方式" })).toBeVisible();
  for (const title of [
    "工作上的問題",
    "說明問題原因",
    "提出休息建議",
    "用行動解決問題",
  ]) {
    await expect(page.getByRole("button", { name: new RegExp(title) })).toBeEnabled();
  }
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
    .toEqual({ passedLevelIds: [], passedUnitIds: [], completedLessonIds: [] });
});

test("normal A2 progression keeps unit eight locked until unit seven passes", async ({
  page,
}) => {
  await seedA2(page, {
    completedA2: priorA2Lessons,
    passedA2: priorA2Units.slice(0, -1),
    passedLevelIds: ["A1"],
  });
  await openA2Map(page);
  await expect(page.getByRole("heading", { name: "問題與簡單解決方式" })).toBeVisible();
  await expect(page.getByRole("button", { name: /工作上的問題/ })).toBeDisabled();
});

test("completes unit eight, passage comprehension, and persists progress", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await seedA2(page, {
    completedA2: priorA2Lessons,
    passedA2: priorA2Units,
    passedLevelIds: ["A1"],
  });
  await openA2Map(page);
  const a1Before = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    return value.levelProgress?.A1 ?? null;
  }, progressKey);

  const lessons = [
    {
      title: "工作上的問題",
      id: "a2-u08-l01",
      recall: ["I", "have", "a", "problem", "at", "work"],
      transfers: [
        "I have a problem at home.",
        "I have a problem at school.",
      ],
    },
    {
      title: "說明問題原因",
      id: "a2-u08-l02",
      recall: ["I", "am", "tired", "because", "I", "work", "at", "night"],
      transfers: [
        "I am tired because I clean at night.",
        "I am tired because I work on Saturday.",
      ],
      recognitionStem: "I am tired because I work at night.",
    },
    {
      title: "提出休息建議",
      id: "a2-u08-l03",
      recall: ["You", "should", "take", "a", "break"],
      transfers: ["I should take a break.", "We should take a break."],
    },
    {
      title: "用行動解決問題",
      id: "a2-u08-l04",
      recall: ["I", "am", "tired", "so", "I", "take", "a", "break"],
      transfers: [
        "I am tired, so I take a break at home.",
        "I am tired, so I take a break now.",
      ],
      passage: [
        "I have a problem at work.",
        "I am tired because I work at night.",
        "I am tired, so I take a break.",
        "I take a break at home.",
        "I have some water.",
      ],
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
      lesson.recognitionStem,
    );
    if (lesson.passage) await completePassage(page, lesson.passage, 4);
  }

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const progress = JSON.parse(localStorage.getItem(key) ?? "{}").levelProgress?.A2;
        return {
          lessons: (progress?.completedLessonIds ?? []).filter((id: string) =>
            id.startsWith("a2-u08-"),
          ),
          passageRebuildAttempts: progress?.passageStats?.["a2-u08-p01"]?.rebuildAttempts,
          comprehensionCorrect: progress?.passageStats?.["a2-u08-p01"]?.comprehensionCorrect,
        };
      }, progressKey),
    )
    .toEqual({
      lessons: ["a2-u08-l01", "a2-u08-l02", "a2-u08-l03", "a2-u08-l04"],
      passageRebuildAttempts: 1,
      comprehensionCorrect: 4,
    });

  const evidenceBeforeAssessment = await readA2Evidence(page);
  for (const field of [
    "tokenProgress",
    "lexemeProgress",
    "senseProgress",
    "sentencePatternProgress",
    "sentenceStats",
    "patternStats",
    "passageStats",
    "reviewItems",
    "tokenHintLevels",
    "chunkHintLevels",
    "patternHintLevels",
  ] as const) {
    expect(Object.keys(evidenceBeforeAssessment[field]).length).toBeGreaterThan(0);
  }

  await page.getByRole("button", { name: "回課程地圖", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A2 課程地圖" })).toBeVisible();
  const unitEight = page.locator(".road-unit").nth(7);
  await unitEight.locator("button.test-row").click();
  for (const [index, answer] of [
    "I have a problem at work.",
    "I am tired because I work at night.",
    "You should take a break.",
    "I am tired, so I take a break.",
  ].entries()) {
    const input = page.locator("textarea.answer-input");
    await expect(input).toBeFocused();
    await input.fill(answer);
    await input.press("Enter");
    await expect(page.getByText("本題正確率 100%", { exact: true })).toBeVisible();
    const next = page.getByRole("button", {
      name: index === 3 ? /查看測驗結果/ : /下一題/,
    });
    await expect(next).toBeFocused();
    await next.press("Enter");
  }
  await expect(page.getByRole("heading", { name: "A2 課程地圖" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return {
          passedLevelIds: value.passedLevelIds ?? [],
          passedUnitIds: value.levelProgress?.A2?.passedUnitIds ?? [],
          levelPassed: value.levelProgress?.A2?.levelPassed ?? false,
        };
      }, progressKey),
    )
    .toEqual({
      passedLevelIds: ["A1"],
      passedUnitIds: [...priorA2Units, "a2-u08"],
      levelPassed: false,
    });

  await page.reload();
  await expect(page.getByText("32 / 32", { exact: true })).toBeVisible();
  const evidenceAfterReload = await readA2Evidence(page);
  expect(evidenceAfterReload).toEqual(evidenceBeforeAssessment);
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const progress = JSON.parse(localStorage.getItem(key) ?? "{}").levelProgress?.A2;
        return progress?.completedLessonIds?.filter((id: string) => id.startsWith("a2-u08-"));
      }, progressKey),
    )
    .toEqual(["a2-u08-l01", "a2-u08-l02", "a2-u08-l03", "a2-u08-l04"]);

  await page.getByRole("button", { name: "前往課程地圖", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A2 課程地圖" })).toBeVisible();
  await page.getByTestId("level-selector-a1").click();
  await expect(page.getByRole("heading", { name: "A1 課程地圖" })).toBeVisible();
  const a1After = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    return value.levelProgress?.A1 ?? null;
  }, progressKey);
  expect(a1After).toEqual(a1Before);
  expect(await readA2Evidence(page)).toEqual(evidenceAfterReload);
});

test("unit eight map and learning surface have no horizontal overflow", async ({ page }) => {
  await seedA2(page, {
    completedA2: priorA2Lessons,
    passedA2: priorA2Units,
    passedLevelIds: ["A1"],
    showAdvancedPilots: true,
  });
  await openA2Map(page);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: /工作上的問題/ }).click();
  await page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }).click();
  await expectNoHorizontalOverflow(page);
});
