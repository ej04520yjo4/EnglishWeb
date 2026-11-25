import { expect, Page, test } from "@playwright/test";

const progressKey = "yingju-progress-v1";

const emptyLevelProgress = () => ({
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

const emptyProgress = () => ({
  schemaVersion: 6,
  selectedLevel: "A1",
  passedLevelIds: [],
  levelProgress: {
    A1: emptyLevelProgress(),
    A2: emptyLevelProgress(),
    B1: emptyLevelProgress(),
    B2: emptyLevelProgress(),
  },
  vocabularyProgress: {},
});

type Answers = {
  meaningByEnglish: Map<string, string>;
  englishByMeaning: Map<string, string>;
  sentenceByPrompt: Map<string, string>;
};

const loadAnswers = async (page: Page): Promise<Answers> => {
  const library = await (await page.request.get("/data/vocabulary-library-v1.json")).json() as {
    entries: { displayEnglish: string; translationZhTw: string }[];
  };
  const applications = await (await page.request.get("/data/vocabulary-applications-v1.json")).json() as {
    entries: { sentence: string; translationZhTw: string }[];
  };
  return {
    meaningByEnglish: new Map(library.entries.map((entry) => [entry.displayEnglish, entry.translationZhTw])),
    englishByMeaning: new Map(library.entries.map((entry) => [entry.translationZhTw, entry.displayEnglish])),
    sentenceByPrompt: new Map(applications.entries.map((entry) => [entry.translationZhTw, entry.sentence])),
  };
};

const openPath = async (page: Page) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "把英文從「看得懂」練成「寫得出來」" })).toBeVisible();
  await page.getByTestId("home-vocabulary-path").click();
  await expect(page.getByTestId("vocabulary-path")).toBeVisible();
  await expect(page.getByTestId("vocabulary-library-count")).toContainText("3000");
};

const answerStep = async (page: Page, answers: Answers) => {
  const step = page.locator([
    '[data-testid="vocabulary-path-study"]',
    '[data-testid="vocabulary-library-recognition-practice"]',
    '[data-testid="vocabulary-library-spelling-practice"]',
    '[data-testid="vocabulary-library-application-practice"]',
  ].join(",")).first();
  await step.waitFor();
  const kind = await step.getAttribute("data-testid");
  if (kind === "vocabulary-path-study") {
    await page.getByTestId("vocabulary-path-study-next").click();
  } else if (kind === "vocabulary-library-recognition-practice") {
    const word = (await page.getByTestId("vocabulary-library-recognition-word").innerText()).trim();
    await page.getByTestId("vocabulary-library-recognition-option")
      .filter({ hasText: answers.meaningByEnglish.get(word) as string }).first().click();
    await page.getByTestId("vocabulary-library-recognition-check").click();
    await page.getByTestId("vocabulary-library-recognition-next").click();
  } else if (kind === "vocabulary-library-spelling-practice") {
    const meaning = (await page.getByTestId("vocabulary-library-spelling-word").innerText()).trim();
    await page.getByTestId("vocabulary-library-spelling-input").fill(answers.englishByMeaning.get(meaning) as string);
    await page.getByTestId("vocabulary-library-spelling-check").click();
    await page.getByTestId("vocabulary-library-spelling-next").click();
  } else {
    const prompt = (await step.getByRole("heading", { level: 2 }).innerText()).trim();
    await page.getByTestId("vocabulary-library-application-input").fill(answers.sentenceByPrompt.get(prompt) as string);
    await page.getByTestId("vocabulary-library-application-check").click();
    await page.getByTestId("vocabulary-library-application-next").click();
  }
};

const finishRound = async (page: Page, answers: Answers) => {
  const counter = page.getByTestId("vocabulary-path-session-progress");
  await expect(counter).toBeVisible();
  const total = Number(/\/ (\d+)/.exec(await counter.innerText())?.[1]);
  expect(total).toBeGreaterThan(0);
  for (let step = 1; step <= total; step += 1) {
    await expect(counter).toHaveText(`第 ${step} / ${total} 步`);
    await answerStep(page, answers);
  }
  await expect(page.getByTestId("vocabulary-path-complete")).toBeVisible();
  await page.getByTestId("vocabulary-path-return").click();
  await expect(page.getByTestId("vocabulary-path")).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(value));
    },
    { key: progressKey, value: emptyProgress() },
  );
});

test("learns a lesson, keeps it after reload and reaches the goal on the next study day", async ({ page }) => {
  test.setTimeout(180_000);
  await page.clock.setFixedTime(new Date("2026-11-24T10:00:00+08:00"));
  const answers = await loadAnswers(page);
  await openPath(page);
  await expect(page.getByTestId("vocabulary-path-started")).toContainText("已開始 0 / 3000");
  await expect(page.getByTestId("vocabulary-path-review")).toHaveCount(0);

  await expect(page.getByTestId("vocabulary-path-next")).toBeEnabled();
  await page.getByTestId("vocabulary-path-next").click();
  await finishRound(page, answers);
  await expect(page.getByTestId("vocabulary-path-started")).toContainText("已開始 10 / 3000");
  await expect(page.getByTestId("vocabulary-path-due")).toContainText("今日待複習 0 字");
  await expect(page.getByTestId("vocabulary-path-next")).toContainText("第 2 課");

  await openPath(page);
  await expect(page.getByTestId("vocabulary-path-started")).toContainText("已開始 10 / 3000");
  await expect(page.getByTestId("vocabulary-path-goal")).toContainText("已達標 0 / 3000");

  await page.clock.setFixedTime(new Date("2026-11-25T10:00:00+08:00"));
  await openPath(page);
  await expect(page.getByTestId("vocabulary-path-due")).toContainText("今日待複習 10 字");
  for (let round = 0; round < 3; round += 1) {
    const review = page.getByTestId("vocabulary-path-review");
    if (!(await review.count())) break;
    await expect(review).toBeEnabled();
    await review.click();
    await finishRound(page, answers);
  }
  await expect(page.getByTestId("vocabulary-path-goal")).toContainText("已達標 10 / 3000");
  await expect(page.getByTestId("vocabulary-path-due")).toContainText("今日待複習 0 字");
});

test("lists every stage and opens a chosen lesson without page overflow", async ({ page }) => {
  await openPath(page);
  await page.getByTestId("vocabulary-path-lessons").locator("summary").click();
  await page.getByTestId("vocabulary-path-stage-5").click();
  await expect(page.getByTestId("vocabulary-path-lesson-300")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByTestId("vocabulary-path-lesson-300")).toBeEnabled();
  await page.getByTestId("vocabulary-path-lesson-300").click();
  await expect(page.getByTestId("vocabulary-path-session-progress")).toContainText("第 1 /");
  await expect(page.getByTestId("vocabulary-path-study")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("answers a recognition step with number keys and Enter", async ({ page }) => {
  const answers = await loadAnswers(page);
  await openPath(page);
  await expect(page.getByTestId("vocabulary-path-next")).toBeEnabled();
  await page.getByTestId("vocabulary-path-next").click();
  for (let index = 0; index < 10; index += 1) await page.getByTestId("vocabulary-path-study-next").click();
  const word = (await page.getByTestId("vocabulary-library-recognition-word").innerText()).trim();
  const options = (await page.getByTestId("vocabulary-library-recognition-option").allInnerTexts()).map((text) => text.trim());
  const position = options.indexOf(answers.meaningByEnglish.get(word) as string);
  expect(position).toBeGreaterThanOrEqual(0);
  await page.keyboard.press(String(position + 1));
  await expect(page.getByTestId("vocabulary-library-recognition-check")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("vocabulary-library-recognition-feedback")).toContainText("答對了");
  await expect(page.getByTestId("vocabulary-library-recognition-next")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("vocabulary-path-session-progress")).toContainText("第 12 /");
});

test("shows the contextual KK for lead and offers example speech instead of isolated speech", async ({ page }) => {
  test.setTimeout(60_000);
  const path = await (await page.request.get("/data/vocabulary-path-v1.json")).json() as {
    lessons: { order: number; stageId: string; lexemeIds: string[] }[];
  };
  const lesson = path.lessons.find(({ lexemeIds }) => lexemeIds.includes("lead"));
  expect(lesson).toBeDefined();
  await openPath(page);
  await page.getByTestId("vocabulary-path-lessons").locator("summary").click();
  await page.getByTestId(`vocabulary-path-${lesson!.stageId}`).click();
  await page.getByTestId(`vocabulary-path-lesson-${lesson!.order}`).click();
  for (let i = 0; i < lesson!.lexemeIds.indexOf("lead"); i += 1) {
    await page.getByTestId("vocabulary-path-study-next").click();
  }
  await expect(page.getByTestId("vocabulary-path-study-word")).toHaveText("lead");
  await expect(page.getByTestId("vocabulary-path-study-kk")).toHaveText("KK 原形候選（本句詞義）：/lid/");
  await expect(page.getByRole("button", { name: "播放 lead 的美式發音" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "播放例句發音" })).toBeVisible();
});

test("keeps the word library usable when the path file cannot load", async ({ page }) => {
  await page.route("**/data/vocabulary-path-v1.json", (route) => route.fulfill({ status: 500, body: "{}" }));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "把英文從「看得懂」練成「寫得出來」" })).toBeVisible();
  await page.getByRole("button", { name: "前往3000 單字庫", exact: true }).click();
  await expect(page.getByTestId("vocabulary-path-error")).toContainText("暫時無法載入");
  await expect(page.getByTestId("vocabulary-library-count")).toContainText("3000");
});
