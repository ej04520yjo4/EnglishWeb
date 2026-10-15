import { expect, Page, test, TestInfo } from "@playwright/test";
import {
  expectBorderContrast,
  expectFocusOutlineContrast,
  expectPlaceholderContrast,
  expectTextContrast,
} from "./helpers/contrast";

const progressKey = "yingju-progress-v1";

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

const emptyLevelProgress = (): LevelProgress => ({
  completedLessonIds: [],
  passedUnitIds: [],
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

const progressFixture = (
  completedLessonIds: string[] = [],
  passedUnitIds: string[] = [],
) => {
  const a1 = emptyLevelProgress();
  a1.completedLessonIds = completedLessonIds;
  a1.passedUnitIds = passedUnitIds;
  return {
    schemaVersion: 6,
    selectedLevel: "A1",
    passedLevelIds: [],
    levelProgress: {
      A1: a1,
      A2: emptyLevelProgress(),
      B1: emptyLevelProgress(),
      B2: emptyLevelProgress(),
    },
    vocabularyProgress: {},
  };
};

const lessonsThroughUnit = (lastUnit: number) =>
  Array.from({ length: lastUnit }, (_, unitIndex) =>
    Array.from(
      { length: 4 },
      (_, lessonIndex) => `a1-u${unitIndex + 1}-l${lessonIndex + 1}`,
    ),
  ).flat();

const seedProgress = async (
  page: Page,
  completedLessonIds: string[] = [],
  passedUnitIds: string[] = [],
) => {
  await page.addInitScript(
    ({ key, value }) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    },
    {
      key: progressKey,
      value: progressFixture(completedLessonIds, passedUnitIds),
    },
  );
};

const waitForHome = async (page: Page) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
};

const openRecommendedLesson = async (
  page: Page,
  expectedTitle: string,
) => {
  await waitForHome(page);
  await page.getByRole("button", { name: /開始這一課/ }).click();
  await expect(
    page.getByRole("heading", { name: expectedTitle, exact: true }),
  ).toBeVisible();
};

const beginLesson = async (page: Page) => {
  await page
    .getByRole("button", { name: /從中文提示與逐字輸入開始/ })
    .click();
  await expect(page.locator("#recall-answer-0")).toBeFocused();
};

const answerRecall = async (page: Page, answers: string[]) => {
  for (const answer of answers) {
    const input = page.locator("#recall-answer-0");
    await input.fill(answer);
    await input.press("Enter");
    await expect(page.getByText("回答正確", { exact: true })).toBeVisible();
    await page.locator("#detail-next-button").click();
  }
};

const openReplayedLessonFromMap = async (page: Page, title: string) => {
  await page.getByRole("button", { name: /離開本階段/ }).click();
  await expect(
    page.getByRole("heading", { name: "A1 課程地圖", exact: true }),
  ).toBeVisible();
  await page.locator(".lesson-row").filter({ hasText: title }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await beginLesson(page);
};

const advanceToRebuild = async (page: Page, answers: string[]) => {
  await answerRecall(page, answers);
  await expect(page.locator(".rebuild-field input")).toHaveCount(answers.length);
};

const fillRebuild = async (page: Page, words: string[]) => {
  const fields = page.locator(".rebuild-field input");
  await expect(fields).toHaveCount(words.length);
  for (const [index, word] of words.entries()) {
    await fields.nth(index).fill(word);
  }
};

const expectRebuildInputBoundaries = async (page: Page, label: string) => {
  const fields = page.locator(".rebuild-field input");
  for (let index = 0; index < await fields.count(); index += 1) {
    await expectBorderContrast(fields.nth(index), {
      label: `${label} 第 ${index + 1} 格邊界`,
      minRatio: 3,
    });
  }
};

const screenshot = async (page: Page, testInfo: TestInfo, name: string) => {
  await expect.poll(() => page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  )).toBe(true);
  // Anchor full-page captures at the top so offscreen fixed elements are not
  // painted into the middle of the image when Chrome captures a scrolled page.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath(name),
    fullPage: true,
  });
};

test("keeps the landing CTA and real lesson text states readable", async ({
  page,
}, testInfo) => {
  await waitForHome(page);
  const landingCta = page.getByRole("button", { name: /開始這一課/ });
  await expectTextContrast(landingCta, {
    label: "首頁開始這一課按鈕（一般）",
  });
  await landingCta.hover();
  await landingCta.evaluate((element) => Promise.all(
    element.getAnimations().map((animation) => animation.finished),
  ));
  await expectTextContrast(landingCta, {
    label: "首頁開始這一課按鈕（滑過）",
  });
  await page.mouse.move(0, 0);
  await landingCta.focus();
  await landingCta.evaluate((element) => Promise.all(
    element.getAnimations().map((animation) => animation.finished),
  ));
  await expectTextContrast(landingCta, {
    label: "首頁開始這一課按鈕（焦點狀態文字）",
  });

  await landingCta.click();
  await expect(page.locator(".lesson-intro-card")).toBeVisible();
  await expectTextContrast(page.locator(".lesson-intro-card > p:not(.data-source-note)"), {
    label: "課程導言翻譯",
  });
  for (const [index, label] of [
    [0, "課程導言學習單位標籤"],
    [1, "課程導言文法重點標籤"],
    [2, "課程導言預估時間標籤"],
  ] as const) {
    await expectTextContrast(page.locator(".intro-facts small").nth(index), {
      label,
    });
  }
  await expectTextContrast(page.locator(".data-source-note"), {
    label: "課程導言資料來源說明",
  });

  await beginLesson(page);
  await screenshot(page, testInfo, "recall.png");
  for (const [selector, label] of [
    [".recall-task-title", "回想標題"],
    [".recall-task-meta", "回想提示標籤"],
    [".recall-answer-label", "回想輸入標籤"],
    [".recall-card .feedback", "回想說明"],
  ] as const) {
    await expectTextContrast(page.locator(selector), { label });
  }
  const recallInput = page.locator("#recall-answer-0");
  await expectPlaceholderContrast(recallInput, {
    label: "回想輸入提示文字",
  });
  await expectBorderContrast(recallInput, {
    label: "回想輸入邊界",
    minRatio: 3,
  });
  await recallInput.focus();
  await expectFocusOutlineContrast(recallInput, {
    label: "回想輸入鍵盤焦點外框",
    minRatio: 3,
  });

  await recallInput.fill("I");
  await recallInput.press("Enter");
  await expect(page.getByText("回答正確", { exact: true })).toBeVisible();
  await expectTextContrast(page.locator(".success-label"), {
    label: "字詞詳解正確標籤",
  });
  await expectTextContrast(page.locator(".detail-essential-item small").first(), {
    label: "字詞詳解資訊標籤",
  });
  await expectTextContrast(page.locator("#detail-next-button kbd"), {
    label: "字詞詳解繼續按鈕鍵盤提示",
  });
  const detailNext = page.locator("#detail-next-button");
  await expect(detailNext).toBeFocused();
  await expectFocusOutlineContrast(detailNext, { label: "詳情下一步鍵盤外框" });
  await detailNext.hover();
  await detailNext.evaluate((element) => Promise.all(
    element.getAnimations().map((animation) => animation.finished),
  ));
  await expectTextContrast(detailNext.locator("kbd"), {
    label: "字詞詳解繼續按鈕鍵盤提示（滑過）",
  });
  await screenshot(page, testInfo, "detail.png");
});

test("checks rebuild default, wrong, revealed, correct, and result states", async ({
  page,
}, testInfo) => {
  await seedProgress(page);
  await openRecommendedLesson(page, "我是誰");
  await beginLesson(page);
  await advanceToRebuild(page, ["I", "am", "Amy"]);
  await expectRebuildInputBoundaries(page, "重組預設");
  await screenshot(page, testInfo, "rebuild-default.png");

  await fillRebuild(page, ["x", "am", "Amy"]);
  await page.getByRole("button", { name: /檢查順序與拼字/ }).click();
  await expect(page.getByText(/第 1 次未通過/)).toBeVisible();
  await expect(page.locator(".rebuild-field.spelling input")).toHaveCount(1);
  await expect(page.locator(".rebuild-field.correct input")).toHaveCount(2);
  await expectTextContrast(page.locator(".rebuild-field.spelling input"), {
    label: "重組錯誤拼字欄位",
  });
  await expectTextContrast(page.locator(".rebuild-field.correct input").first(), {
    label: "重組正確欄位",
  });
  await expectBorderContrast(page.locator(".rebuild-field.spelling input"), {
    label: "重組錯誤欄位邊界",
    minRatio: 3,
  });
  await expectBorderContrast(page.locator(".rebuild-field.correct input").first(), {
    label: "重組正確欄位邊界",
    minRatio: 3,
  });
  await screenshot(page, testInfo, "rebuild-wrong.png");

  await page.getByRole("button", { name: /檢查順序與拼字/ }).click();
  await expect(page.getByText(/第 2 次未通過/)).toBeVisible();
  await page.getByRole("button", { name: /檢查順序與拼字/ }).click();
  await expect(page.getByText(/已嘗試 3 次/)).toBeVisible();
  await expect(page.locator(".rebuild-field.revealed input")).toHaveCount(3);
  await expectTextContrast(page.locator(".rebuild-field.revealed input").first(), {
    label: "重組揭露答案欄位",
  });
  await expectTextContrast(page.locator(".rebuild-field.revealed small").first(), {
    label: "重組揭露狀態標籤",
  });
  await expectBorderContrast(page.locator(".rebuild-field.revealed input").first(), {
    label: "重組揭露欄位邊界",
    minRatio: 3,
  });
  await screenshot(page, testInfo, "rebuild-revealed.png");

  await page.locator("#rebuild-next-button").click();
  await expect(page.getByRole("heading", { name: /完成本課文字練習/ })).toBeVisible();
  await expectTextContrast(page.locator(".result-card .eyebrow"), {
    label: "課程結果標籤",
  });
  await expectTextContrast(page.locator(".result-support-row span").first(), {
    label: "課程結果支援資訊",
  });
  await screenshot(page, testInfo, "result.png");
});

test("checks recognition selected, wrong, and correct states in a real lesson", async ({
  page,
}, testInfo) => {
  await seedProgress(page, lessonsThroughUnit(3), [
    "a1-u1",
    "a1-u2",
    "a1-u3",
  ]);
  await openRecommendedLesson(page, "我有一顆蘋果");
  await beginLesson(page);
  await advanceToRebuild(page, ["I", "have", "an", "apple"]);
  await fillRebuild(page, ["I", "have", "an", "apple"]);
  await page.getByRole("button", { name: /檢查順序與拼字/ }).click();
  await expect(page.locator("#recognition-option-correct")).toBeVisible();

  await expectTextContrast(page.locator(".exercise-instruction"), {
    label: "閱讀辨識說明",
  });
  await expectTextContrast(page.locator("#recognition-option-correct"), {
    label: "閱讀辨識選項（一般）",
  });
  await expectBorderContrast(page.locator("#recognition-option-correct"), {
    label: "閱讀辨識選項（一般）邊界",
    minRatio: 3,
  });
  await expectTextContrast(page.locator("#recognition-check-button"), {
    label: "閱讀辨識檢查按鈕",
  });

  await page.locator("#recognition-option-pen").click();
  await expect(page.locator("#recognition-option-pen")).toHaveClass(/selected/);
  await expectTextContrast(page.locator("#recognition-option-pen"), {
    label: "閱讀辨識錯誤選項（已選取）",
  });
  await expectBorderContrast(page.locator("#recognition-option-pen"), {
    label: "閱讀辨識錯誤選項（已選取）邊界",
    minRatio: 3,
  });
  await page.locator("#recognition-check-button").click();
  await expect(page.locator("#recognition-option-pen")).toHaveClass(/wrong/);
  await expectTextContrast(page.locator("#recognition-option-pen"), {
    label: "閱讀辨識錯誤結果",
  });
  await expectBorderContrast(page.locator("#recognition-option-pen"), {
    label: "閱讀辨識錯誤結果邊界",
    minRatio: 3,
  });
  await expectTextContrast(page.locator(".feedback"), {
    label: "閱讀辨識錯誤回饋",
  });

  await openReplayedLessonFromMap(page, "我有一顆蘋果");
  await advanceToRebuild(page, ["I", "have", "an", "apple"]);
  await fillRebuild(page, ["I", "have", "an", "apple"]);
  await page.getByRole("button", { name: /檢查順序與拼字/ }).click();
  await expect(page.locator("#recognition-option-correct")).toBeVisible();
  await page.locator("#recognition-option-correct").click();
  await expect(page.locator("#recognition-option-correct")).toHaveClass(/selected/);
  await page.locator("#recognition-check-button").click();
  await expect(page.locator("#recognition-option-correct")).toHaveClass(/correct/);
  await expectTextContrast(page.locator("#recognition-option-correct"), {
    label: "閱讀辨識正確結果",
  });
  await expectBorderContrast(page.locator("#recognition-option-correct"), {
    label: "閱讀辨識正確結果邊界",
    minRatio: 3,
  });
  await expectTextContrast(page.locator(".feedback"), {
    label: "閱讀辨識正確回饋",
  });
  await expectTextContrast(page.locator("#recognition-next-button"), {
    label: "閱讀辨識下一步按鈕",
  });
  await screenshot(page, testInfo, "recognition-correct.png");
});
