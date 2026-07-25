import { expect, Page, test } from "@playwright/test";

const progressKey = "yingju-progress-v1";
const completedBeforeUnit8 = Array.from(
  { length: 7 },
  (_, unitIndex) =>
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
});

const seedProgress = async (
  page: Page,
  completedLessonIds: string[] = [],
  passedUnitIds: string[] = [],
) => {
  const progress = progressFixture(completedLessonIds, passedUnitIds);
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: progressKey, value: progress },
  );
};

const openRecommendedLesson = async (page: Page, expectedTitle?: string) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「說得出來」",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /開始這一課/ }).click();
  if (expectedTitle) {
    await expect(
      page.getByRole("heading", { name: expectedTitle }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: /從發音與中文提示開始/ }).click();
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

const completeRebuild = async (page: Page, words: string[]) => {
  const fields = page.locator(".rebuild-field input");
  await expect(fields).toHaveCount(words.length);
  for (let index = 0; index < words.length; index += 1) {
    await fields.nth(index).fill(words[index]);
  }
  await page.getByRole("button", { name: /檢查順序與拼字/ }).click();
  await expect(page.locator("#dictation-answer")).toBeVisible();
};

const completeDictation = async (page: Page, sentence: string) => {
  await page.locator("#dictation-answer").fill(sentence);
  await page.locator("#dictation-answer").press("Enter");
  await expect(
    page.getByRole("heading", { name: "做得好！你已經重建整個句子" }),
  ).toBeVisible();
};

const expectNoHorizontalOverflow = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
};

test("completes the first lesson and keeps local progress after refresh", async ({
  page,
}) => {
  await openRecommendedLesson(page);
  await answerRecallTokens(page, ["I", "am", "Amy"]);
  await completeRebuild(page, ["I", "am", "Amy"]);
  await completeDictation(page, "I am Amy.");

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return value.completedLessonIds?.includes("a1-u1-l1");
      }, progressKey),
    )
    .toBe(true);
  await page.reload();
  await expect(page.getByText("1 / 32", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("completes a non-first lesson through the same full flow", async ({
  page,
}) => {
  await seedProgress(page, ["a1-u1-l1"]);
  await openRecommendedLesson(page, "我的名字");
  await answerRecallTokens(page, ["My", "name", "is", "Ben"]);
  await completeRebuild(page, ["My", "name", "is", "Ben"]);
  await completeDictation(page, "My name is Ben.");
  await expectNoHorizontalOverflow(page);
});

test("does not leak the sentence into dictation after the last recall answer was revealed", async ({
  page,
}) => {
  await openRecommendedLesson(page);
  await answerRecallTokens(page, ["I", "am"]);

  const lastToken = page.locator("#recall-answer-0");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await lastToken.fill("wrong");
    await lastToken.press("Enter");
  }
  await expect(page.getByText(/正確答案是 Amy/)).toBeVisible();
  await lastToken.fill("Amy");
  await lastToken.press("Enter");
  await page.locator("#detail-next-button").click();
  await completeRebuild(page, ["I", "am", "Amy"]);

  const dictation = page.locator("#dictation-answer");
  await expect(dictation).toHaveValue("");
  await expect(dictation).not.toHaveAttribute("placeholder", "I am Amy.");
});

test("reveals the unit 8 passage without auto-advancing and waits for confirmation", async ({
  page,
}) => {
  await seedProgress(
    page,
    [
      ...completedBeforeUnit8,
      "a1-u8-l1",
      "a1-u8-l2",
      "a1-u8-l3",
    ],
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
  await answerRecallTokens(page, ["I", "go", "to", "work", "by", "bus"]);
  await completeRebuild(page, ["I", "go", "to", "work", "by", "bus"]);
  await page.locator("#dictation-answer").fill("I go to work by bus.");
  await page.locator("#dictation-answer").press("Enter");

  await expect(page.getByText("依句子順序重建整段文章")).toBeVisible();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByRole("button", { name: "檢查整段文章" }).click();
  }
  const confirmation = page.locator("#passage-complete-button");
  await expect(confirmation).toHaveText("我已閱讀，完成課程");
  await page.waitForTimeout(1_700);
  await expect(confirmation).toBeVisible();
  await confirmation.click();
  await expect(
    page.getByRole("heading", { name: "做得好！你已經重建整個句子" }),
  ).toBeVisible();
});

test("penalizes an extra word in the real unit assessment", async ({ page }) => {
  await seedProgress(page, [
    "a1-u1-l1",
    "a1-u1-l2",
    "a1-u1-l3",
    "a1-u1-l4",
  ]);
  await page.goto("/");
  await page.getByRole("button", { name: /開始單元測驗/ }).click();
  const answer = page.locator(".answer-input");
  await answer.fill("I am Amy today");
  await answer.press("Enter");
  await expect(page.getByText("本題正確率 75%")).toBeVisible();
});
