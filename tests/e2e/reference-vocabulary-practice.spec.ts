import { expect, Page, test, type TestInfo } from "@playwright/test";

const progressKey = "yingju-progress-v1";

type ProgressFixture = {
  schemaVersion: 6;
  selectedLevel: "A1";
  passedLevelIds: string[];
  levelProgress: Record<string, Record<string, unknown>>;
  vocabularyProgress: Record<string, Record<string, unknown>>;
};

const emptyLevelProgress = (): Record<string, unknown> => ({
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

const emptyProgress = (): ProgressFixture => ({
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

const expectedTranslations: Record<string, string> = {
  Wednesday: "星期三",
  Thursday: "星期四",
  Saturday: "星期六",
  Sunday: "星期日",
};

const dateInTaipei = (offsetDays = 0) => {
  const now = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
};

const referenceEvidence = (studyDate: string) => ({
  firstSeenAt: `${studyDate}T08:00:00.000Z`,
  lastSeenAt: `${studyDate}T08:00:00.000Z`,
  exposureEvidenceIds: [],
  recognitionCorrectEvidenceIds: [`fixture-recognition-${studyDate}`],
  recognitionAttemptEvidenceIds: [`fixture-recognition-attempt-${studyDate}`],
  spellingCorrectEvidenceIds: [],
  spellingAttemptEvidenceIds: [],
  applicationCorrectEvidenceIds: [],
  applicationAttemptEvidenceIds: [],
  evidenceStudyDates: {
    [`fixture-recognition-${studyDate}`]: studyDate,
    [`fixture-recognition-attempt-${studyDate}`]: studyDate,
  },
  studyDates: [studyDate],
  sourceLevels: ["A1"],
});

const installProgressFixture = async (
  page: Page,
  progress: ProgressFixture = emptyProgress(),
) => {
  await page.addInitScript(
    ({ key, value }) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    },
    { key: progressKey, value: progress },
  );
};

const readProgress = async (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), progressKey);

const waitForHome = async (page: Page) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
};

const openRelatedVocabulary = async (page: Page) => {
  const relatedNav = page.getByRole("button", {
    name: "前往相關字詞",
    exact: true,
  });
  await relatedNav.click();
  await expect(
    page.getByRole("heading", { name: "相關字詞", exact: true }),
  ).toBeVisible();
};

const openReferenceRecognition = async (page: Page) => {
  await page.getByTestId("vocabulary-group-days-of-week").click();
  const start = page.getByTestId("start-reference-recognition");
  await expect(start).toBeVisible();
  await start.click();
  await expect(page.getByTestId("reference-recognition-practice")).toBeVisible();
  await expect(page.getByTestId("reference-recognition-word")).toBeVisible();
};

const selectTranslation = async (page: Page, translation: string) => {
  const option = page
    .getByTestId("reference-recognition-option")
    .filter({ hasText: translation });
  await expect(option).toHaveCount(1);
  await option.click();
};

const finishCurrentQuestion = async (page: Page, word: string) => {
  await selectTranslation(page, expectedTranslations[word]);
  await page.getByTestId("reference-recognition-check").click();
  await expect(page.getByTestId("reference-recognition-feedback")).toBeVisible();
};

const expectEvidenceCounts = async (
  page: Page,
  lexemeIds: string[],
  counts: { attempts: number; correct: number },
) => {
  const progress = await readProgress(page);
  for (const lexemeId of lexemeIds) {
    const evidence = progress.vocabularyProgress?.[lexemeId];
    expect(evidence, `${lexemeId} 應有參考詞彙證據`).toBeTruthy();
    expect(evidence.recognitionAttemptEvidenceIds).toHaveLength(counts.attempts);
    expect(evidence.recognitionCorrectEvidenceIds).toHaveLength(counts.correct);
    expect(evidence.spellingCorrectEvidenceIds).toHaveLength(0);
    expect(evidence.applicationCorrectEvidenceIds).toHaveLength(0);
  }
};

test("reference vocabulary browse does not create recognition evidence", async ({
  page,
}) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openRelatedVocabulary(page);
  await page.getByTestId("vocabulary-group-days-of-week").click();
  await expect(page.getByTestId("start-reference-recognition")).toBeVisible();

  const progress = await readProgress(page);
  expect(progress.vocabularyProgress).toEqual({});
  expect(progress.levelProgress.A1.completedLessonIds).toEqual([]);
  expect(progress.levelProgress.A1.reviewItems).toEqual({});
  expect(progress.passedLevelIds).toEqual([]);
});

test("completes the four weekday reference words and preserves evidence after reload", async ({
  page,
}, testInfo: TestInfo) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openRelatedVocabulary(page);
  await openReferenceRecognition(page);
  await page.screenshot({
    path: testInfo.outputPath("reference-practice.png"),
    fullPage: true,
  });

  const completedWords: string[] = [];
  for (let index = 0; index < 4; index += 1) {
    const word = (await page.getByTestId("reference-recognition-word").textContent())?.trim() ?? "";
    expect(Object.keys(expectedTranslations), `未知的參考詞彙：${word}`).toContain(word);
    expect(completedWords).not.toContain(word);
    completedWords.push(word);
    await finishCurrentQuestion(page, word);
    const next = page.getByTestId("reference-recognition-next");
    await expect(next).toBeFocused();
    await next.press("Enter");
    if (index < 3) {
      await expect(page.getByTestId("reference-recognition-word")).toHaveText(/\S+/);
    }
  }

  expect(completedWords).toEqual([
    "Wednesday",
    "Thursday",
    "Saturday",
    "Sunday",
  ]);
  await expect(page.getByTestId("reference-recognition-summary")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("reference-summary.png"),
    fullPage: true,
  });
  await expectEvidenceCounts(
    page,
    ["wednesday", "thursday", "saturday", "sunday"],
    { attempts: 1, correct: 1 },
  );

  await page.reload();
  await expect.poll(async () => {
    const progress = await readProgress(page);
    return progress.vocabularyProgress?.wednesday?.recognitionCorrectEvidenceIds?.length ?? 0;
  }).toBe(1);
  await expectEvidenceCounts(
    page,
    ["wednesday", "thursday", "saturday", "sunday"],
    { attempts: 1, correct: 1 },
  );
});

test("does not turn a same-day wrong attempt into a correct credit after reload", async ({
  page,
}) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openRelatedVocabulary(page);
  await openReferenceRecognition(page);

  const word = (await page.getByTestId("reference-recognition-word").textContent())?.trim() ?? "";
  const correctTranslation = expectedTranslations[word];
  const wrongOption = page
    .getByTestId("reference-recognition-option")
    .filter({ hasNotText: correctTranslation });
  await expect(wrongOption.first()).toBeVisible();
  await wrongOption.first().click();
  await page.getByTestId("reference-recognition-check").click();
  await expect(page.getByTestId("reference-recognition-feedback")).toBeVisible();
  await expectEvidenceCounts(page, [word.toLowerCase()], { attempts: 1, correct: 0 });

  await page.reload();
  await waitForHome(page);
  await openRelatedVocabulary(page);
  await openReferenceRecognition(page);
  await expect(page.getByTestId("reference-recognition-word")).not.toHaveText(word);
  await expectEvidenceCounts(page, [word.toLowerCase()], { attempts: 1, correct: 0 });
});

test("recognition on two local dates becomes receptive without active evidence", async ({
  page,
}) => {
  const yesterday = dateInTaipei(-1);
  const progress = emptyProgress();
  progress.vocabularyProgress.wednesday = referenceEvidence(yesterday);
  await installProgressFixture(page, progress);
  await waitForHome(page);
  const levelProgressBefore = JSON.stringify((await readProgress(page)).levelProgress);
  await openRelatedVocabulary(page);
  await openReferenceRecognition(page);
  await expect(page.getByTestId("reference-recognition-word")).toHaveText("Wednesday");
  await finishCurrentQuestion(page, "Wednesday");

  const stored = await readProgress(page);
  const evidence = stored.vocabularyProgress.wednesday;
  expect(evidence.recognitionCorrectEvidenceIds).toHaveLength(2);
  expect(new Set(Object.values(evidence.evidenceStudyDates)).size).toBe(2);
  expect(evidence.spellingCorrectEvidenceIds).toHaveLength(0);
  expect(evidence.applicationCorrectEvidenceIds).toHaveLength(0);
  expect(JSON.stringify(stored.levelProgress)).toBe(levelProgressBefore);

  await page.getByRole("button", { name: "← 返回相關字詞", exact: true }).first().click();
  await expect(page.getByTestId("reference-mastery-wednesday")).toContainText("已跨日答對");
  await page.getByRole("button", { name: "前往學習進度", exact: true }).click();
  const globalVocabularyProgress = page.getByTestId("global-vocabulary-progress");
  await expect(globalVocabularyProgress).toBeVisible();
  await expect(globalVocabularyProgress).toContainText("可以辨認");
  await expect(
    globalVocabularyProgress
      .locator(".stat-card")
      .filter({ hasText: "可以主動拼寫及運用" }),
  ).toContainText("0");
});

test("rejects a recognition submission after the local study date changes", async ({
  page,
}) => {
  const studyDate = new Date("2026-10-15T12:00:00+08:00");
  await page.clock.install({ time: studyDate });
  await installProgressFixture(page);
  await waitForHome(page);
  await openRelatedVocabulary(page);
  await openReferenceRecognition(page);

  const word = (await page.getByTestId("reference-recognition-word").textContent())?.trim() ?? "";
  expect(Object.keys(expectedTranslations)).toContain(word);
  await selectTranslation(page, expectedTranslations[word]);
  await page.clock.setFixedTime(new Date("2026-10-16T00:01:00+08:00"));
  await page.getByTestId("reference-recognition-check").click();
  await expect(page.getByRole("heading", { name: "已進入新的一天" })).toBeVisible();

  const progress = await readProgress(page);
  expect(progress.vocabularyProgress).toEqual({});
});

test("keeps reference browsing available when vocabulary targets fail to load", async ({
  page,
}) => {
  await page.route("**/data/vocabulary-targets-v2.json", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "simulated vocabulary target failure" }),
    });
  });
  await installProgressFixture(page);
  await waitForHome(page);
  await openRelatedVocabulary(page);
  await page.getByTestId("vocabulary-group-days-of-week").click();

  await expect(page.getByTestId("vocabulary-word-list")).toBeVisible();
  const start = page.getByTestId("start-reference-recognition");
  await expect(start).toBeDisabled();
  await expect(
    page.getByText("詞彙目標尚未載入，辨認練習暫時無法開始。", { exact: true }),
  ).toBeVisible();
});

test("supports keyboard recognition controls and stays within the viewport", async ({
  page,
}) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openRelatedVocabulary(page);
  await openReferenceRecognition(page);

  const firstWord = (await page.getByTestId("reference-recognition-word").textContent())?.trim() ?? "";
  const options = page.getByTestId("reference-recognition-option");
  await expect(options.first()).toBeFocused();
  const correctOption = options.filter({ hasText: expectedTranslations[firstWord] });
  await expect(correctOption).toHaveCount(1);
  await correctOption.focus();
  await page.keyboard.press("Enter");

  const check = page.getByTestId("reference-recognition-check");
  await check.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("reference-recognition-feedback")).toBeVisible();

  const next = page.getByTestId("reference-recognition-next");
  await expect(next).toBeFocused();
  const firstWordBeforeNext = await page.getByTestId("reference-recognition-word").textContent();
  await page.keyboard.down("Enter");
  await expect
    .poll(() => page.getByTestId("reference-recognition-word").textContent())
    .not.toBe(firstWordBeforeNext);
  const secondWordAfterNext = await page.getByTestId("reference-recognition-word").textContent();
  await page.keyboard.down("Enter");
  await page.keyboard.up("Enter");
  await expect(page.getByTestId("reference-recognition-word")).toHaveText(secondWordAfterNext ?? "");
  await expect(page.getByTestId("reference-recognition-feedback")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
});
