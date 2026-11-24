import { expect, type Page, test } from "@playwright/test";
import { a2LessonCount } from "./a2-catalog-fixture";
import { readFileSync } from "node:fs";

const readFixture = <T>(name: string): T =>
  JSON.parse(readFileSync(new URL(`../../public/data/${name}`, import.meta.url), "utf8")) as T;
const a2Patterns = readFixture<{
  patterns: { examples: { practiceLessonId: string; sentence: string }[] }[];
}>("a2-pattern-exercises.json");
const a2Reading = readFixture<{
  recognition: { lessonId: string; stem: string }[];
  passages: { passageId: string; sentences: { sentence: string }[]; questions: { correctAnswer: string }[] }[];
}>("a2-reading-exercises.json");

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

const priorA2Lessons = Array.from({ length: 8 }, (_, unitIndex) =>
  Array.from(
    { length: 4 },
    (_, lessonIndex) => `a2-u0${unitIndex + 1}-l0${lessonIndex + 1}`,
  ),
).flat();
const priorA2Units = Array.from(
  { length: 8 },
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
  answers: number | string[],
) => {
  const fields = page.locator("[id^='passage-sentence-']");
  await expect(fields).toHaveCount(sentences.length);
  await expectNoHorizontalOverflow(page);
  for (let index = 0; index < sentences.length; index += 1) {
    await fields.nth(index).fill(sentences[index]);
  }
  await page.getByRole("button", { name: "檢查整段文章" }).click();
  const choices = typeof answers === "number" ? Array<string | null>(answers).fill(null) : answers;
  for (const choice of choices) {
    await (choice === null
      ? page.locator("#passage-answer-0")
      : page.getByRole("button", { name: choice, exact: true })
    ).click();
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

test("A2 QA preview exposes unit nine without passing the level", async ({
  page,
}) => {
  await seedA2(page, { showAdvancedPilots: true });
  await openA2Map(page);

  await expect(page.locator(".unit-card .lesson-row:not(.test-row)")).toHaveCount(a2LessonCount);
  await expect(page.getByRole("heading", { name: "社交、邀請與回應" })).toBeVisible();
  await expect(page.getByRole("button", { name: /回信開頭表達感謝/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /在電話中找人/ })).toBeEnabled();
  for (const title of [
    "邀請一起吃晚餐",
    "熱情接受邀請",
    "禮貌婉拒與說明原因",
    "提出替代安排",
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

test("normal A2 progression keeps unit nine locked until unit eight passes", async ({
  page,
}) => {
  await seedA2(page, {
    completedA2: priorA2Lessons,
    passedA2: priorA2Units.slice(0, -1),
    passedLevelIds: ["A1"],
  });
  await openA2Map(page);
  await expect(page.getByRole("heading", { name: "社交、邀請與回應" })).toBeVisible();
  await expect(page.getByRole("button", { name: /邀請一起吃晚餐/ })).toBeDisabled();
});

test("completes unit nine, passage comprehension, and persists progress", async ({
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
      title: "邀請一起吃晚餐",
      id: "a2-u09-l01",
      recall: ["Would", "you", "like", "to", "have", "dinner", "with", "me"],
      transfers: [
        "Would you like to watch TV with me?",
        "Would you like to have breakfast with me?",
      ],
    },
    {
      title: "熱情接受邀請",
      id: "a2-u09-l02",
      recall: ["I", "would", "love", "to", "have", "dinner", "with", "you"],
      transfers: [
        "I would love to watch TV with you.",
        "I would love to have breakfast with you.",
      ],
      recognitionStem: "I would love to have dinner with you.",
    },
    {
      title: "禮貌婉拒與說明原因",
      id: "a2-u09-l03",
      recall: ["I", "am", "sorry", "but", "I", "have", "to", "work"],
      transfers: ["I am sorry, but I have to clean my room.", "I am sorry, but I have to wash the dishes."],
    },
    {
      title: "提出替代安排",
      id: "a2-u09-l04",
      recall: ["Can", "we", "meet", "on", "Saturday", "instead"],
      transfers: [
        "Can we meet on Tuesday instead?",
        "Can we meet tomorrow instead?",
      ],
      passage: [
        "Would you like to have dinner with me on Friday?",
        "I am sorry, but I have to work on Friday.",
        "Can we meet on Saturday instead?",
        "I would love to have dinner with you.",
        "Can we meet at seven?",
        "I can meet at seven on Saturday.",
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
            id.startsWith("a2-u09-"),
          ),
          passageRebuildAttempts: progress?.passageStats?.["a2-u09-p01"]?.rebuildAttempts,
          comprehensionCorrect: progress?.passageStats?.["a2-u09-p01"]?.comprehensionCorrect,
        };
      }, progressKey),
    )
    .toEqual({
      lessons: ["a2-u09-l01", "a2-u09-l02", "a2-u09-l03", "a2-u09-l04"],
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
  const unitNine = page.locator(".road-unit").nth(8);
  await unitNine.locator("button.test-row").click();
  for (const [index, answer] of [
    "Would you like to have dinner with me?",
    "I would love to have dinner with you.",
    "I am sorry, but I have to work.",
    "Can we meet on Saturday instead?",
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
      passedUnitIds: [...priorA2Units, "a2-u09"],
      levelPassed: false,
    });

  await page.reload();
  await expect(page.getByText(`36 / ${a2LessonCount}`, { exact: true })).toBeVisible();
  const evidenceAfterReload = await readA2Evidence(page);
  expect(evidenceAfterReload).toEqual(evidenceBeforeAssessment);
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const progress = JSON.parse(localStorage.getItem(key) ?? "{}").levelProgress?.A2;
        return progress?.completedLessonIds?.filter((id: string) => id.startsWith("a2-u09-"));
      }, progressKey),
    )
    .toEqual(["a2-u09-l01", "a2-u09-l02", "a2-u09-l03", "a2-u09-l04"]);

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

test("unit nine map and learning surface have no horizontal overflow", async ({ page }) => {
  await seedA2(page, {
    completedA2: priorA2Lessons,
    passedA2: priorA2Units,
    passedLevelIds: ["A1"],
    showAdvancedPilots: true,
  });
  await openA2Map(page);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: /邀請一起吃晚餐/ }).click();
  await page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }).click();
  await expectNoHorizontalOverflow(page);
});

const priorCapstoneLessons = [
  ...priorA2Lessons, "a2-u09-l01", "a2-u09-l02", "a2-u09-l03", "a2-u09-l04",
];
const priorCapstoneUnits = [...priorA2Units, "a2-u09"];

test("normal capstone entry requires passing unit nine, not just completing its lessons", async ({ page }) => {
  await seedA2(page, {
    completedA2: priorCapstoneLessons,
    passedA2: priorA2Units,
    passedLevelIds: ["A1"],
  });
  await openA2Map(page);
  await expect(page.getByRole("heading", { name: "綜合郵件、行程與生活故事" })).toBeVisible();
  await expect(page.getByRole("button", { name: /回信開頭表達感謝/ })).toBeDisabled();
  await expectNoHorizontalOverflow(page);
});

test("completes the capstone and unlocks applied phone lessons, not B1", async ({ page }) => {
  test.setTimeout(240_000);
  await seedA2(page, {
    completedA2: priorCapstoneLessons,
    passedA2: priorCapstoneUnits,
    passedLevelIds: ["A1"],
  });
  await openA2Map(page);
  await expect(page.getByRole("button", { name: /在電話中找人/ })).toBeDisabled();
  const lessons = [
    { title: "回信開頭表達感謝", sentence: "Thank you for the email.",
      transfers: ["Thank you for the ticket.", "Thank you for dinner."] },
    { title: "讀懂出發時刻", sentence: "The bus leaves at ten on Saturday.",
      transfers: ["The bus leaves at nine on Friday.", "The train leaves at eight on Tuesday."] },
    { title: "確認見面地點", sentence: "I can meet you at the station.",
      transfers: ["I can meet you at school.", "I can meet you at the store."] },
    { title: "回顧行程的變化", sentence: "I missed the bus, so I took the train.",
      transfers: ["I missed the train, so I took the bus.", "I missed the bus, so I went home."] },
  ];
  for (const [index, lesson] of lessons.entries()) {
    await openA2Lesson(page, lesson.title);
    await expectNoHorizontalOverflow(page);
    const words = lesson.sentence.match(/[A-Za-z]+/g) ?? [];
    await answerRecallTokens(page, words);
    await submitRebuild(page, words);
    await completeEnhancedStages(page, lesson.transfers, index !== 3, lesson.sentence);
  }
  await completePassage(page, [
    lessons[0].sentence, lessons[1].sentence, lessons[2].sentence,
    "Would you like to have dinner with me?",
    lessons[3].sentence, "I went home after dinner.",
  ], 4);
  await page.getByRole("button", { name: "回課程地圖", exact: true }).click();
  const capstone = page.locator(".road-unit").filter({
    has: page.getByRole("heading", { name: "綜合郵件、行程與生活故事" }),
  });
  await capstone.locator("button.test-row").click();
  for (const [index, lesson] of lessons.entries()) {
    const input = page.locator("textarea.answer-input");
    await expect(input).toBeFocused();
    await input.fill(lesson.sentence);
    await input.press("Enter");
    await expect(page.getByText("本題正確率 100%", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: index === 3 ? /查看測驗結果/ : /下一題/ }).press("Enter");
  }
  await expect(page.getByRole("heading", { name: "A2 課程地圖" })).toBeVisible();
  await expect(page.getByTestId("a2-pilot-completion")).toContainText("A2 試行內容進行中");
  await expect(page.getByRole("button", { name: /在電話中找人/ })).toBeEnabled();
  await expect(page.getByTestId("level-selector-b1")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.reload();
  await expect(page.getByText(`40 / ${a2LessonCount}`, { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? "{}");
    const a2 = state.levelProgress?.A2;
    return {
      lessons: a2?.completedLessonIds.filter((id: string) => id.startsWith("a2-u10-")),
      units: a2?.passedUnitIds,
      passedLevels: state.passedLevelIds,
      levelPassed: a2?.levelPassed,
      comprehension: a2?.passageStats?.["a2-u10-p01"]?.comprehensionCorrect,
    };
  }, progressKey)).toEqual({
    lessons: ["a2-u10-l01", "a2-u10-l02", "a2-u10-l03", "a2-u10-l04"],
    units: [...priorCapstoneUnits, "a2-u10"],
    passedLevels: ["A1"],
    levelPassed: false,
    comprehension: 4,
  });
});

const appliedBrowserUnits = [
  {
    number: 11,
    title: "應用：通話、重述與確認",
    nextTitle: "禮貌地要菜單",
    lessons: [
      ["在電話中找人", "Can I speak to Amy, please?", "Can I speak to Ben, please?", "Can I speak to my manager, please?"],
      ["請對方再說一次", "Could you say that again?", "Can you say that again?", "Could you say it again?"],
      ["請對方說慢一點", "Could you speak more slowly?", "Can you speak more slowly?", "Could you speak slowly?"],
      ["約好稍後回電", "I can call you back after lunch.", "I can call you back after dinner.", "I can call you back at ten."],
    ],
    passage: [
      "Can I speak to Amy, please?", "This is Amy.", "I can meet you at the station.",
      "Could you say that again?", "Could you speak more slowly?", "I can call you back after lunch.",
    ],
    comprehension: ["Amy.", "At the station.", "Could you speak more slowly?", "Call you back."],
  },
  {
    number: 12,
    title: "應用：點餐、更正與結帳",
    nextTitle: "告知有住宿預訂",
    lessons: [
      ["禮貌地要菜單", "May I see the menu, please?", "May we see the menu, please?", "May I see that menu, please?"],
      ["用份量點餐", "I would like a cup of tea.", "We would like a cup of tea.", "She would like a cup of tea."],
      ["更正送錯的品項", "I ordered tea, not coffee.", "I ordered coffee, not tea.", "I ordered water, not coffee."],
      ["請店員結帳", "Could we have the check, please?", "Could I have the check, please?", "Could we have some water, please?"],
    ],
    passage: [
      "May I see the menu, please?", "I would like a cup of tea.", "I ordered tea, not coffee.",
      "I am sorry.", "Could we have the check, please?",
    ],
    comprehension: ["The menu.", "A cup of tea.", "Coffee.", "The check."],
  },
  {
    number: 13,
    title: "應用：旅館入住與求助",
    nextTitle: "詢問可不可以退貨",
    lessons: [
      ["告知有住宿預訂", "I booked a room for tonight.", "I booked a room for tomorrow.", "I booked a room for Saturday."],
      ["詢問行李可以放哪裡", "Where can I leave my bag?", "Where can I leave my cellphone?", "Where can I leave this bag?"],
      ["向櫃檯反映房間太冷", "The room is too cold.", "The bathroom is too cold.", "The room is too expensive."],
      ["請服務人員多拿一條毯子", "Could you bring an extra blanket?", "Could you bring the blanket?", "Could you bring some water?"],
    ],
    passage: [
      "I booked a room for tonight.", "Where can I leave my bag?", "You can leave it on the table.",
      "The room is too cold.", "Could you bring an extra blanket?",
    ],
    comprehension: ["Tonight.", "On the table.", "An extra blanket.", "The room is too cold."],
  },
];

const situations = [
  { title: "應用：退換貨與尺寸", lessons: ["詢問可不可以退貨", "說明尺寸不對", "跟店員說有收據", "問有沒有小一號"] },
  { title: "應用：交通延誤與改搭", lessons: ["聽懂車班延誤", "問下一班幾點發車", "問票能不能改用在別的車上", "告知改搭另一種車"] },
  { title: "應用：工作回報與交接", lessons: ["回報已完成報告", "說明檔案已送出", "請同事在午餐前確認", "回覆檔案已準備好"] },
  { title: "應用：問路與地標", lessons: ["詢問怎麼到目的地", "指示直走到轉角", "在紅綠燈路口轉彎", "說明地點在對面"] },
  { title: "應用：裝置故障與求助", lessons: ["描述裝置開不了機", "請對方幫忙看一下", "建議換一條線試試", "確認裝置恢復正常"] },
  { title: "應用：遺失物品與領回", lessons: ["說明東西在哪裡弄丟", "用顏色描述遺失物", "詢問去哪裡領回", "聽懂領取時要帶什麼"] },
  { title: "應用：圖書館借書與期限", lessons: ["詢問這本書能不能借", "詢問需要辦借書證嗎", "詢問借書歸還期限", "聽懂何時可以還書"] },
  { title: "應用：改約與核對時間", lessons: ["說明想更改預約", "詢問星期五還有沒有空檔", "表示提議時間可以", "請對方確認新時間"] },
  { title: "應用：表達偏好與一起決定", lessons: ["比較兩種東西的偏好", "表示比較想做哪件事", "用輕鬆的問法提議時間", "回應提議聽起來不錯"] },
  { title: "應用：餐點成分與替代選擇", lessons: ["詢問餐點含不含某種成分", "表示自己不吃某種食物", "詢問能不能不要加某種食材", "改選一道可吃的餐點"] },
  { title: "應用：延長時間與回覆期限", lessons: ["直接說明需要更多時間", "提出明天完成的可能性", "給出明確的最晚時間", "答應之後再通知對方"] },
  { title: "應用：敘述經過與後續行動", lessons: ["說明到達得比較晚", "敘述當時店家已關門", "敘述後來再去一趟", "說明最後買了什麼"] },
  { title: "應用：確認意思與避免誤會", lessons: ["坦白說自己不確定", "確認對方指的是哪一天", "請對方出示訊息", "表示現在弄懂了"] },
  { title: "應用：分配事情與互相幫忙", lessons: ["請對方幫忙搬東西", "主動提出能搬去哪裡", "確認誰負責開門", "提出大家可以一起做"] },
  { title: "應用：下雨改約與備案", lessons: ["說明可能會下雨", "提出下雨時可採取的備案", "提出改到星期六", "答應再確認天氣"] },
  { title: "應用：寄件、地址與費用", lessons: ["說明要寄一個包裹", "讀懂地址要寫在哪一面", "詢問寄送要多少錢", "聽懂報出的金額"] },
  { title: "應用：向別人借物與歸還", lessons: ["禮貌地向別人借筆", "解釋自己的東西放在哪", "詢問可以借用多久", "答應什麼時候帶回來"] },
  { title: "應用：說明不舒服與提早離開", lessons: ["簡短說今天身體不舒服", "說需要提早回去", "請同事代為轉告", "表示隔天再打電話"] },
  { title: "應用：超市購物與份量", lessons: ["用包裝單位說需要多少", "詢問店家是否有賣", "選定要兩包米", "詢問能不能刷卡"] },
  { title: "應用：參加活動與報到", lessons: ["詢問在哪裡簽到", "說明是來上課的", "詢問活動何時開始", "回答活動幾點結束"] },
  { title: "應用：告知晚到與道歉", lessons: ["告知自己會晚到", "詢問能不能晚一點見面", "說預計幾分鐘後到", "向等候的人道謝"] },
  { title: "應用：訂位、候位與叫號", lessons: ["詢問有沒有兩人的桌位", "問候位大概要多久", "說可以到外面等", "請對方叫自己的名字"] },
  { title: "應用：寄檔案與回覆訊息", lessons: ["告知會寄檔案給對方", "請對方先看第一頁", "請對方有問題就告知", "說明什麼時候能回覆"] },
  { title: "應用：聽懂場所規則", lessons: ["說明在這裡得保持安靜", "請對方關門", "聽懂請勿在室內用餐", "知道在哪裡可以喝水"] },
  { title: "應用：比較路線與車程", lessons: ["問哪種走法比較快", "說明搭公車要多久", "說其中一種交通工具比較省時", "根據剛收到的資訊提議搭車"] },
  { title: "應用：家事分工與收拾", lessons: ["主動說會把碗盤收好", "請對方把垃圾拿出去", "告知晚餐前可以處理", "提議一起做完"] },
  { title: "應用：取消或更改訂單", lessons: ["表明需要取消訂單", "詢問能否改用別的做法", "請對方寄電子郵件", "表示自己會核對細節"] },
  { title: "應用：展館售票與入場", lessons: ["禮貌地買兩張展覽票", "問每張票的價格", "聽懂小孩可以免費入場", "確認入口在哪一層"] },
  { title: "應用：鄰居來訪與停留時間", lessons: ["問能不能去對方家坐一下", "說自己會忙到三點", "邀請對方七點左右過來", "說只能坐幾分鐘"] },
  { title: "應用：報編號與領取包裹", lessons: ["到櫃台說要領包裹", "聽懂櫃台在問包裹編號", "請對方出示電子郵件", "請在指定位置簽名"] },
  { title: "應用：自助洗衣與操作順序", lessons: ["聽懂先把衣服放進洗衣機", "聽懂水溫的三個選項", "接著按開始鍵", "說洗完就會回來"] },
  { title: "應用：租腳踏車與歸還期限", lessons: ["問能否租腳踏車一小時", "問一小時的租金是多少", "聽懂最晚七點前要帶回來", "問歸還時腳踏車放在哪裡"] },
  { title: "應用：填寫表單與聯絡方式", lessons: ["聽懂要填寫這份表單", "問這裡要不要寫全名", "確認是否需要填電話號碼", "問可以用電子郵件交表單嗎"] },
  { title: "應用：回收標示與物品分類", lessons: ["問哪個是紙類回收桶", "問塑膠瓶能不能回收", "請先把瓶子中的東西倒掉", "聽懂玻璃要放另一個桶"] },
  { title: "應用：溫和提醒音量與道歉", lessons: ["麻煩對方把音樂轉小聲", "說明這裡有點吵", "為聲音太大表示抱歉", "承諾接下來會保持小聲"] },
  { title: "應用：內用、外帶與分開裝", lessons: ["聽懂是問內用還是外帶", "說這份餐點要外帶", "請店員把醬料另外放", "請把飲料另外放一袋"] },
  { title: "應用：問營業時間與公休日", lessons: ["問店家幾點開始營業", "說從八點營業到七點", "聽懂除了週日每天都開", "聽完時間後決定週一再來"] },
  { title: "應用：用地標約集合", lessons: ["提議在圖書館前面見", "說入口在車站對面", "問對方是否看得見正門", "說會在門旁邊等"] },
  { title: "應用：電話中確認拼字與號碼", lessons: ["請對方拼出姓名", "請每個字母都慢慢念", "請對方重念最後兩個數字", "把數字念回去讓對方核對"] },
  { title: "應用：結帳、付款方式與找零", lessons: ["問店家收現金還是卡片", "說這張卡目前刷不過", "問可不可以改用現金", "禮貌地向店員要找零"] },
  { title: "應用：班次延誤與月台資訊", lessons: ["聽懂列車延誤", "用「下一班」追問發車時間", "聽懂回答九點發車", "詢問從哪個月台發車"] },
  { title: "應用：新同事、座位與協助工作", lessons: ["介紹自己是新加入團隊的", "介紹自己和業務團隊共事", "確認這是不是自己的座位", "主動問能不能幫忙做報告"] },
  { title: "應用：打包行李與確認能否裝下", lessons: ["問出門要打包哪些東西", "確認需要帶一件外套", "問外套能不能裝進這個袋子", "說行李重到提不動"] },
  { title: "應用：看住處、房間相對位置與比較", lessons: ["問公寓有沒有廚房", "說臥室就在浴室旁邊", "說這間房比另一間亮", "說比較喜歡有窗戶的那間"] },
  { title: "應用：說明小失誤與提出補救", lessons: ["承認自己不小心弄掉杯子", "說杯子碰到地板時破了", "主動說可以收拾現場", "說會再拿一個新杯子來"] },
  { title: "應用：停用告示與替代設備", lessons: ["讀懂機器暫時不能用", "詢問能否改用另一台", "告知二樓有另一台", "請對方指一下路怎麼走"] },
  { title: "應用：確認課程名額並報名", lessons: ["詢問這堂課是否還有名額", "聽懂上午班已經額滿", "問能不能報名晚間班", "確認是不是現在要付款"] },
  { title: "應用：家事頻率與輪流分工", lessons: ["問多久倒一次垃圾", "描述自己通常晚上倒垃圾", "說自己每週做兩次", "提議輪流倒垃圾"] },
  { title: "應用：讀簡單食譜與說明步驟", lessons: ["聽懂先把蘋果切成小塊", "說接著把切好的食材放進碗", "照食譜加一點糖", "說用湯匙拌一拌"] },
  { title: "應用：詢問能否剪髮及修剪長度", lessons: ["詢問今天能否剪頭髮", "聽懂設計師問想剪多短", "請對方只稍微修短一點", "請把前面的頭髮留長一點"] },
  { title: "應用：退房、寄放行李與領回時間", lessons: ["問住宿最晚幾點退房", "聽懂要把房間鑰匙留在櫃台", "詢問退房後能否寄放行李", "說自己三點會回來領行李"] },
  { title: "應用：藥局買藥與服用說明", lessons: ["到藥局說明需要頭痛藥", "聽懂藥一天吃兩次", "問藥要不要飯後吃", "聽懂沒改善就要看醫生"] },
  { title: "應用：看天氣決定穿著與攜帶", lessons: ["說今天外面很冷", "建議對方穿保暖外套", "提醒對方帶傘", "說明天會比較暖和"] },
  { title: "應用：搭計程車說目的地與下車", lessons: ["告訴司機要去火車站", "問車程要多久", "請司機在下個轉角停", "付錢後要收據"] },
  { title: "應用：掛號看診與說明症狀", lessons: ["到診所說今天想看醫生", "說吃東西時喉嚨痛", "說症狀兩天前開始", "問醫生三點能不能看"] },
  { title: "應用：水果攤問價與決定數量", lessons: ["問這些蘋果多少錢", "聽懂一個賣多少錢", "決定要買三個", "請店家給一個袋子"] },
  { title: "應用：聊週末活動與邀請同行", lessons: ["問對方週末都做什麼", "說自己通常去公園散步", "說自己喜歡在家看書", "邀請對方一起去"] },
  { title: "應用：介紹家人與住處", lessons: ["說自己和媽媽同住", "說自己有兄弟姊妹", "說姊妹住在車站附近", "說兄弟在辦公室上班"] },
  { title: "應用：在賣場找商品與問特價", lessons: ["問米放在哪裡", "聽懂在第二層架子", "問今天有沒有特價", "問有沒有便宜一點的"] },
  { title: "應用：向房東回報修繕", lessons: ["回報廚房的燈壞了", "說地上有水", "問這週能否來修", "說明三點後會在家"] },
  { title: "應用：向主管請假與交代工作", lessons: ["問星期五能不能請假", "說明要幫媽媽的忙", "交代同事可以幫忙", "承諾星期四前做完"] },
  { title: "應用：描述外貌與尋找走散的人", lessons: ["說正在找自己的兄弟", "描述他個子高、頭髮短", "說他穿著黑色外套", "說三點時他在車站附近"] },
  { title: "應用：餐點有問題時禮貌反映", lessons: ["說這不是自己點的", "說茶有點冷掉了", "請對方幫忙加熱", "聽懂店員道歉並重送"] },
  { title: "應用：到銀行開戶與準備證件", lessons: ["說想開銀行帳戶", "問需不需要護照", "問開戶要多少錢", "聽懂明天可以用卡"] },
  { title: "應用：帳單有疑問時請對方查明", lessons: ["說對帳單有疑問", "指出金額不對", "說明被收了兩次錢", "請對方幫忙查"] },
  { title: "應用：安排短途旅行與確認費用", lessons: ["說想去短途旅行", "問這趟旅行多少錢", "問價錢包不包含早餐", "說星期六早上出發"] },
  { title: "應用：詢問與表達簡單意見", lessons: ["問對方覺得這個計畫如何", "說這是個好主意", "說對時間還不確定", "提議試試別的方法"] },
  { title: "應用：打電話約到府維修", lessons: ["說明為了機器打電話來", "問什麼時候能有人來", "確認星期二早上可不可以", "請對方來之前先打電話"] },
  { title: "應用：籌備小型聚會與分工", lessons: ["提議星期六辦聚會", "問誰要帶食物", "說自己可以帶飲料", "請對方邀請朋友"] },
  { title: "應用：分享假期去了哪裡", lessons: ["說上週去了海邊", "說在那裡待了三天", "說當時天氣很好", "說玩得很開心"] },
  { title: "應用：請教學習方法與感謝建議", lessons: ["問怎麼學新單字", "聽懂建議每天練習", "問應該先做什麼", "感謝對方的建議"] },
  { title: "應用：和鄰居溝通小問題", lessons: ["確認腳踏車是不是對方的", "說明擋到自己的門", "請對方移開", "道歉說自己不知道"] },
  { title: "應用：描述一天的作息", lessons: ["說每天七點起床", "說九點開始上班", "說通常中午吃午餐", "說十點上床睡覺"] },
  { title: "應用：比較手機方案與做決定", lessons: ["問哪個方案比較便宜", "說這個方案流量比較多", "聽懂每個月十美元", "決定選便宜的方案"] },
  { title: "應用：請路人幫忙拍照", lessons: ["開口請陌生人幫忙", "請對方幫忙拍照", "教對方按哪個鍵", "向對方道謝"] },
  { title: "應用：聊工作內容與工時", lessons: ["問對方做什麼工作", "說自己在銀行上班", "問喜不喜歡這份工作", "說一週工作三天"] },
  { title: "應用：聊喜歡與不喜歡的食物", lessons: ["問對方喜歡什麼食物", "說自己很喜歡吃魚", "說不喜歡甜食", "邀請對方吃一點看看"] },
  { title: "應用：在建築物內指路", lessons: ["指出電梯在那邊", "說明要上到二樓", "說是左邊第二扇門", "說會在左手邊看到"] },
  { title: "應用：聊過去的工作經驗", lessons: ["說以前在銀行工作過", "說在那裡工作了兩年", "問對方在那裡做什麼", "說每天協助客戶"] },
  { title: "應用：辦交通票卡與儲值", lessons: ["問能不能買公車票卡", "聽懂票卡可用一個月", "問搭火車能不能用", "問去哪裡儲值"] },
  { title: "應用：約下班後見面", lessons: ["問對方下班後有沒有空", "提議七點在車站見面", "提醒可能會晚一點到", "說七點見"] },
  { title: "應用：詢問課程時間與準備物品", lessons: ["問課程幾點開始", "問需不需要帶毛巾", "問能否免費試上一堂", "聽懂課程八點結束"] },
  { title: "應用：寄包裹到國外", lessons: ["說要把箱子寄到國外", "聽懂櫃台問裡面是什麼", "說裡面只有衣服", "問包裹什麼時候到"] },
  { title: "應用：聊剛過去的週末", lessons: ["問週末過得如何", "說星期六打掃家裡", "說和朋友看了電影", "反問對方呢"] },
  { title: "應用：詢問租屋費用與條件", lessons: ["問房租多少錢", "問房租包不包含水費", "問什麼時候可以搬進去", "決定要租這個房間"] },
  { title: "應用：談健康的生活習慣", lessons: ["說盡量每天早上走路", "說每天喝很多水", "說自己很早睡", "說現在覺得好多了"] },
  { title: "應用：安排下個月的計畫", lessons: ["問對方下個月的安排", "說打算去探望媽媽", "說會待一個星期", "說下週再告訴對方"] },
  { title: "應用：請鄰居代收包裹", lessons: ["請鄰居幫忙保管包裹", "說今天不在家", "說今晚會來拿", "謝謝鄰居幫忙"] },
  { title: "應用：說明現在正在做什麼", lessons: ["問對方現在在做什麼", "說正在煮晚餐", "說兄弟正在看電視", "說正在等公車"] },
  { title: "應用：掛失銀行卡", lessons: ["說弄丟了銀行卡", "請銀行停用卡片", "聽懂行員問上次何時使用", "聽懂會寄新卡"] },
  { title: "應用：說自己會與不擅長的事", lessons: ["回答自己會開車", "說自己很會游泳", "說自己不太會做菜", "說這很容易學"] },
  { title: "應用：說明原因並辦理退款", lessons: ["說想要退款", "聽懂店員問為什麼退貨", "說明因為它不能用", "聽懂可以把錢退回"] },
  { title: "應用：請朋友順路載一程", lessons: ["請朋友載一程", "說自己的車壞了", "說八點去接對方", "問要在哪裡等"] },
  { title: "應用：在職場徵求同意", lessons: ["問今天能否早點走", "說要去接兒子", "問明天能否在家工作", "聽懂主管同意"] },
  { title: "應用：比較兩個住處", lessons: ["說這間公寓比較大", "說那間離公司比較近", "說這間舊但便宜", "說比較喜歡第一間"] },
  { title: "應用：說明經常或從不做的事", lessons: ["說總是吃早餐", "說有時候走路上班", "說晚上從不喝咖啡", "問多久做一次飯"] },
  { title: "應用：聊生日與送禮", lessons: ["問對方生日是什麼時候", "說生日在下週", "問生日想要什麼", "說會買禮物給對方"] },
  { title: "應用：向老師提問與說明狀況", lessons: ["說不懂這一課", "請老師再解釋一次", "說把書忘在家裡", "問能否問一個問題"] },
  { title: "應用：請店家保留商品", lessons: ["請店員保留外套", "說下午會回來", "問可以保留多久", "聽懂可以保留到七點"] },
  { title: "應用：介紹自己喜歡的地方", lessons: ["說最喜歡的地方", "說它就在家附近", "說那裡有很多樹", "說早上很安靜"] },
  { title: "應用：學著使用網站", lessons: ["問網站要怎麼用", "教對方先點按鈕", "教對方輸入名字", "說現在可以登入了"] },
  { title: "應用：幫迷路的訪客指路", lessons: ["主動問對方是否迷路", "問對方想去哪裡", "說離這裡不遠", "說可以帶對方去"] },
  { title: "應用：聊家裡養的動物", lessons: ["問對方有沒有養狗", "說養了一隻小貓", "說牠很親人", "說每天早上餵牠"] },
  { title: "應用：問哪一路公車與在哪下車", lessons: ["問哪一路公車到圖書館", "聽懂要搭九號公車", "問要在哪裡下車", "聽懂在下一站下車"] },
  { title: "應用：說昨天做了什麼", lessons: ["問對方昨天做了什麼", "說和朋友見面吃午餐", "說聊了兩個小時", "說然後就回家了"] },
  { title: "應用：簡單的工作面試", lessons: ["聽懂請你說上一份工作", "說擅長協助客戶", "聽懂問為什麼想要這份工作", "說下週一可以開始"] },
  { title: "應用：回診與說明恢復情況", lessons: ["說需要再看一次醫生", "說喉嚨還是痛", "說今天好一點了", "聽懂下週再回來"] },
  { title: "應用：出發前確認安排", lessons: ["確認對方明天還有空", "問應該幾點出發", "提醒別忘了帶票", "說早上會打電話"] },
  { title: "應用：介紹自己的家", lessons: ["說家裡不太大", "說有兩間臥室", "說廚房在浴室旁邊", "說很喜歡自己的家"] },
  { title: "應用：聊季節與喜歡的天氣", lessons: ["問喜歡哪個季節", "說喜歡夏天勝過冬天", "說夏天很熱", "說冬天對自己太冷"] },
  { title: "應用：招待朋友喝茶", lessons: ["說要泡茶給對方", "問要不要加牛奶", "說加一點點糖就好", "稱讚茶很好喝"] },
  { title: "應用：聊運動與健康", lessons: ["問對方打不打羽毛球", "說星期日和朋友打", "說每天早上跑步", "說這對健康有好處"] },
  { title: "應用：反映旅館房間問題", lessons: ["說房間沒有熱水", "說房間的燈壞了", "請櫃台派人來", "問能否換房間"] },
  { title: "應用：說明課表與考試", lessons: ["說星期一和三有課", "說第一堂課九點開始", "說星期四有考試", "說今晚要讀書"] },
  { title: "應用：聊電影與看法", lessons: ["問對方看過那部電影嗎", "說電影真的很好笑", "說故事有點長", "建議對方去看"] },
  { title: "應用：安排家庭聚餐", lessons: ["說家人星期日要來", "說要在家吃晚餐", "請對方幫忙做飯", "說還需要更多米"] },
  { title: "應用：比較店家與新鮮度", lessons: ["說這家店比較便宜", "說這裡的水果很新鮮", "問價錢一樣嗎", "決定在這裡買"] },
  { title: "應用：介紹住家附近", lessons: ["說家附近有小公園", "說可以走路到車站", "說這條街晚上很安靜", "說這裡適合居住"] },
  { title: "應用：追問遲到的包裹", lessons: ["說包裹沒有送到", "說上週訂的", "請對方查訂單編號", "聽懂明天會送到"] },
  { title: "應用：計畫假期旅遊", lessons: ["問假期要去哪裡", "說要去海邊", "說會住飯店", "說對此很開心"] },
  { title: "應用：試穿衣服與挑顏色", lessons: ["問能不能試穿", "說這件太小", "問有沒有藍色", "決定要藍色那件"] },
  { title: "應用：電話中說明自己的位置", lessons: ["說自己在轉角", "問對方看得到什麼", "說看得到一家大銀行", "請對方待著等"] },
  { title: "應用：承認錯誤並補救", lessons: ["承認自己犯錯", "說忘了打電話", "真誠地道歉", "保證不會再發生"] },
  { title: "應用：談未來的目標", lessons: ["說希望找到新工作", "說想多存點錢", "說這對自己很重要", "說今年會努力工作"] },
  { title: "應用：到銀行預約辦事", lessons: ["說想要預約", "聽懂問要辦什麼事", "說要更改地址", "聽懂請帶護照"] },
  { title: "應用：詳細描述遺失物", lessons: ["說弄丟黑色小袋子", "說裡面有手機", "說今天早上在公車上弄丟", "請找到後打電話"] },
  { title: "應用：聊音樂與興趣", lessons: ["問喜歡哪種音樂", "說喜歡晚上聽音樂", "說姊妹很會唱歌", "說有時候一起唱歌"] },
  { title: "應用：請同事幫忙看電腦", lessons: ["說電腦今天很慢", "問對方關機了嗎", "建議關機再開機", "說現在可以用了"] },
  { title: "應用：籌備生日驚喜", lessons: ["提醒別告訴 Amy", "說這是個驚喜", "提議買蛋糕", "說大家七點會到"] },
  { title: "應用：看天氣預報", lessons: ["問明天天氣如何", "說下午會下雨", "說風會很強", "建議待在室內"] },
  { title: "應用：比較交通方式", lessons: ["問搭計程車還是公車", "說計程車快但貴", "說公車要久一點", "決定有時間就搭公車"] },
  { title: "應用：出門前交代家事", lessons: ["請對方關窗", "提醒離開前關燈", "提醒出門要鎖門", "交代把鑰匙放桌上"] },
  { title: "應用：借用充電線", lessons: ["問能不能在這裡充電", "問對方有沒有充電線", "說可以用我的", "說很快會還"] },
  { title: "應用：聊小時候的生活", lessons: ["說以前住在小鎮", "說那時候還很小", "說每天走路上學", "說以前養過小狗"] },
  { title: "應用：說明行程變更", lessons: ["說計畫有變動", "說星期五不出發了", "說改成星期日出發", "請對方告訴大家"] },
  { title: "應用：請朋友推薦餐廳", lessons: ["請朋友推薦好餐廳", "問這裡什麼好吃", "建議對方試試魚", "說價錢不會太貴"] },
  { title: "應用：逾期還書與繳費", lessons: ["說書有點逾期", "說忘了拿來還", "問要付多少錢", "聽懂要付兩美元"] },
  { title: "應用：描述小意外與求助", lessons: ["說今天早上跌倒", "說腿有點痛", "請人扶自己站起來", "說自己應該沒事"] },
  { title: "應用：聊喜歡的家事", lessons: ["說喜歡在家做飯", "說不喜歡洗碗", "請對方今天洗衣服", "提議一起分工"] },
  { title: "應用：詢問運費", lessons: ["問有沒有運費", "問運費多少錢", "聽懂滿額免運", "問能否明天送到"] },
  { title: "應用：和同事閒聊", lessons: ["問同事週末過得好嗎", "問同事今天忙不忙", "邀同事休息喝咖啡", "約午餐後再見"] },
  { title: "應用：詢問運動中心規定", lessons: ["問游泳池幾點開", "問是否要當會員", "聽懂必須帶卡", "說會員免費使用"] },
  { title: "應用：留語音訊息", lessons: ["留言時說自己是誰", "說明來電原因", "請對方回電", "說之後會再打來"] },
  { title: "應用：約讀書會", lessons: ["邀對方一起讀書", "說星期五有考試", "約在圖書館碰面", "提醒帶筆記"] },
  { title: "應用：在餐廳挑座位", lessons: ["請求坐靠窗", "說桌子太小", "說想坐外面", "問位子有沒有人坐"] },
  { title: "應用：請同事代班", lessons: ["請同事幫忙代班", "說明要去看醫生", "答應幫忙代班", "說會告訴主管"] },
  { title: "應用：幫朋友挑禮物", lessons: ["說要找朋友的禮物", "店員問朋友喜歡什麼", "推薦藍色杯子", "請店員包裝"] },
  { title: "應用：詢問停車", lessons: ["問這裡能不能停車", "問可以停在哪裡", "聽懂停在店後面", "問停車費怎麼算"] },
  { title: "應用：歡迎新鄰居", lessons: ["問對方是不是新來的", "歡迎並自我介紹", "說自己住幾樓", "說可以找自己幫忙"] },
  { title: "應用：歸還借來的東西", lessons: ["說借了對方的東西", "說今天想還", "把東西交還", "說下次還可以借"] },
  { title: "應用：回報電梯故障", lessons: ["說電梯壞了", "說明自己帶著重物", "問什麼時候能修好", "請對方修好時通知"] },
  { title: "應用：更改晚餐訂位", lessons: ["說已訂了今晚的位子", "問能不能改時間", "提議改到八點", "確認到達時間"] },
  { title: "應用：聊最喜歡的老師", lessons: ["問最喜歡哪位老師", "形容老師很風趣", "說老師總是幫助自己", "說從老師身上學很多"] },
  { title: "應用：聊小時候的味道", lessons: ["說奶奶以前常做蛋糕", "說當時真的很好吃", "說以前在廚房幫忙", "說還記得那個味道"] },
  { title: "應用：規劃海邊一日遊", lessons: ["提議星期六去海邊", "提醒天氣會很熱", "建議帶帽子和水", "說可以在海裡游泳"] },
  { title: "應用：機場報到", lessons: ["聽懂櫃檯要看護照", "回答行李數量", "問是哪個登機門", "聽懂班機起飛時間"] },
  { title: "應用：在飛機上請求協助", lessons: ["向空服員要毯子", "說自己有點冷", "問能否放包包", "問什麼時候會到"] },
  { title: "應用：回答入境問題", lessons: ["說明來訪目的", "聽懂問停留多久", "回答待十天", "說明住在飯店"] },
  { title: "應用：換外幣", lessons: ["說想換錢", "問今天的匯率", "問能否領現金", "收下收據"] },
  { title: "應用：搬家請朋友幫忙", lessons: ["說上週搬家了", "請朋友幫忙搬箱子", "指示東西放哪裡", "比較新家"] },
  { title: "應用：牙痛去看診", lessons: ["說牙齒痛", "說需要看醫生", "聽懂請張開嘴巴", "聽懂一小時不要吃東西"] },
  { title: "應用：買新手機", lessons: ["說想買新手機", "說明手機優點", "問有沒有黑色", "決定買黑色手機"] },
  { title: "應用：逛夜市", lessons: ["邀朋友去夜市", "問這是什麼食物", "問能否試吃", "點兩份"] },
  { title: "應用：暴風雨天的安排", lessons: ["說暴風雨要來了", "說明天不用上班", "提醒關好窗戶", "說應該待在室內"] },
  { title: "應用：到便利商店繳費", lessons: ["說想繳帳單", "問這裡能不能繳", "聽懂請用機器", "問要不要收據"] },
  { title: "應用：買火車票與找座位", lessons: ["買下一班火車的票", "問有沒有靠窗座位", "問座位在第幾車廂", "聽懂車程時間"] },
  { title: "應用：向外國朋友介紹台灣", lessons: ["介紹台灣是美麗的島", "建議去看山", "稱讚這裡的食物", "說夜市很有名"] },
  { title: "應用：報名當志工", lessons: ["說想當志工", "問這週末能否加入", "說明志工內容", "聽懂請寫下名字"] },
  { title: "應用：請鄰居幫忙澆花", lessons: ["請鄰居幫忙澆水", "說下週不在家", "交代每天澆水", "說會帶禮物回來"] },
  { title: "應用：聊新的興趣", lessons: ["說開始彈吉他", "說每天晚上練習", "說很難但有趣", "邀對方試試看"] },
  { title: "應用：說明線上預約步驟", lessons: ["說可以線上預約", "說第一步到網站", "接著選日期", "說會收到郵件"] },
  { title: "應用：聊朋友的新生寶寶", lessons: ["說朋友有了寶寶", "問是男生還是女生", "形容寶寶很小", "提議去探望"] },
  { title: "應用：聊早餐習慣", lessons: ["問早餐通常吃什麼", "回答吃蛋配牛奶", "說有時沒時間", "說早餐很重要"] },
  { title: "應用：一起看老照片", lessons: ["說這是老照片", "問照片裡的人", "說那是爸爸", "說他看起來好年輕"] },
  { title: "應用：收到送錯的包裹", lessons: ["說這不是自己的包裹", "說明名字錯了", "請對方帶回去", "問真正的包裹在哪"] },
  { title: "應用：出門前找鑰匙", lessons: ["問鑰匙在哪裡", "問有沒有找過包包", "說東西在桌上", "建議固定放門邊"] },
  { title: "應用：約同事吃午餐", lessons: ["邀同事一起吃午餐", "說附近有新餐廳", "問幾點去", "說今天自己請客"] },
];
const transferExamples = a2Patterns.patterns.flatMap((entry) => entry.examples);
appliedBrowserUnits.push(...situations.map((scenario, index) => {
  const number = 14 + index;
  const unitId = `a2-u${number}`;
  const passage = a2Reading.passages.find((entry) => entry.passageId === `${unitId}-p01`);
  if (!passage) throw new Error(`缺少 Playwright 短文測試資料：${unitId}`);
  return {
    number,
    title: scenario.title,
    nextTitle: situations[index + 1]?.lessons[0] ?? null,
    lessons: scenario.lessons.map((title, lessonIndex) => {
      const id = `${unitId}-l0${lessonIndex + 1}`;
      const recognition = a2Reading.recognition.find((entry) => entry.lessonId === id);
      const transfers = transferExamples.filter((entry) => entry.practiceLessonId === id);
      if (!recognition || transfers.length !== 2) throw new Error(`缺少 Playwright 課程測試資料：${id}`);
      return [title, recognition.stem, ...transfers.map((entry) => entry.sentence)];
    }),
    passage: passage.sentences.map((entry) => entry.sentence),
    comprehension: passage.questions.map((entry) => entry.correctAnswer),
  };
}));

test.describe("Applied A2 course flows", () => {
  test.describe.configure({ mode: "parallel" });

  for (const unit of appliedBrowserUnits) {
    test(`completes applied A2 unit ${unit.number} and persists passage and unit pass`, async ({ page }) => {
      test.setTimeout(240_000);
      const unitId = `a2-u${unit.number}`;
      const lessonIds = (id: string) => [1, 2, 3, 4].map((index) => `${id}-l0${index}`);
      const passedA2 = Array.from({ length: unit.number - 1 }, (_, index) =>
        `a2-u${String(index + 1).padStart(2, "0")}`,
      );
      await seedA2(page, {
        completedA2: passedA2.flatMap(lessonIds),
        passedA2,
        passedLevelIds: ["A1"],
      });
      for (const [index, [title, sentence, ...transfers]] of unit.lessons.entries()) {
        await openA2Lesson(page, title);
        if (unit.number === 29 && index === 2) {
          await expect(page.getByText("和 much 搭配詢問金額", { exact: true })).toBeVisible();
        }
        const words = sentence.match(/[A-Za-z]+/g) ?? [];
        await answerRecallTokens(page, words);
        await submitRebuild(page, words);
        await completeEnhancedStages(page, transfers, index < 3, sentence);
      }
      await completePassage(page, unit.passage, unit.comprehension);
      await page.getByRole("button", { name: "回課程地圖", exact: true }).click();
      if (unit.nextTitle) {
        await expect(page.getByRole("button", { name: new RegExp(unit.nextTitle) })).toBeDisabled();
      }
      const card = page.locator(".road-unit").filter({
        has: page.getByRole("heading", { name: unit.title, exact: true }),
      });
      await card.locator("button.test-row").click();
      for (const [index, [, answer]] of unit.lessons.entries()) {
        const input = page.locator("textarea.answer-input");
        await expect(input).toBeFocused();
        await input.fill(answer);
        await input.press("Enter");
        await expect(page.getByText("本題正確率 100%", { exact: true })).toBeVisible();
        await page.getByRole("button", { name: index === 3 ? /查看測驗結果/ : /下一題/ }).press("Enter");
      }
      await expect(page.getByRole("heading", { name: "A2 課程地圖" })).toBeVisible();
      if (unit.nextTitle) {
        await expect(page.getByRole("button", { name: new RegExp(unit.nextTitle) })).toBeEnabled();
      } else {
        await expect(page.getByTestId("a2-pilot-completion")).toContainText("你已完成目前的A2試行內容");
      }
      await expect(page.getByTestId("level-selector-b1")).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await page.reload();
      await expect(page.getByText(`${unit.number * 4} / ${a2LessonCount}`, { exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(({ key, id }) => {
        const state = JSON.parse(localStorage.getItem(key) ?? "{}");
        const a2 = state.levelProgress?.A2;
        return {
          completed: a2?.completedLessonIds?.filter((entry: string) => entry.startsWith(`${id}-`)),
          passed: a2?.passedUnitIds?.includes(id),
          correct: a2?.passageStats?.[`${id}-p01`]?.comprehensionCorrect,
          levelPassed: a2?.levelPassed,
          passedLevels: state.passedLevelIds,
          a1Completed: state.levelProgress?.A1?.completedLessonIds,
        };
      }, { key: progressKey, id: unitId })).toEqual({
        completed: lessonIds(unitId), passed: true, correct: 4, levelPassed: false,
        passedLevels: ["A1"], a1Completed: [],
      });
    });
  }
});
