import { expect, Page, test } from "@playwright/test";

const progressKey = "yingju-progress-v1";

type LevelProgress = Record<string, unknown>;

type ProgressFixture = {
  schemaVersion: 6;
  selectedLevel: "A1";
  passedLevelIds: string[];
  levelProgress: Record<string, LevelProgress>;
  vocabularyProgress: Record<string, Record<string, unknown>>;
};

type TargetEntry = {
  lexemeId: string;
  lemma: string;
  curriculumPriority: number;
};

type TargetData = {
  entries: TargetEntry[];
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

const installProgressFixture = async (page: Page) => {
  await page.addInitScript(
    ({ key, value }) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    },
    { key: progressKey, value: emptyProgress() },
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

const openLibrary = async (page: Page) => {
  await page.getByRole("button", { name: "前往3000 單字庫", exact: true }).click();
  await expect(page.getByTestId("vocabulary-library")).toBeVisible();
  await expect(page.getByTestId("vocabulary-library-count")).toContainText("3000");
};

const readLastTarget = async (page: Page) => {
  const response = await page.request.get("/data/vocabulary-targets-v2.json");
  expect(response.ok()).toBe(true);
  const data = (await response.json()) as TargetData;
  return [...data.entries].sort(
    (left, right) => left.curriculumPriority - right.curriculumPriority,
  ).at(-1) as TargetEntry;
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

test("defers the large vocabulary library request until its screen is opened", async ({
  page,
}) => {
  const libraryRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/data/vocabulary-library-v1.json")) {
      libraryRequests.push(request.url());
    }
  });
  await installProgressFixture(page);
  await waitForHome(page);
  await expect.poll(() => libraryRequests.length, { timeout: 500 }).toBe(0);
  await openLibrary(page);
  await expect.poll(() => libraryRequests.length).toBeGreaterThan(0);
});

test("shows all 3000 targets, reaches the final page, and searches the final target", async ({
  page,
}, testInfo) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openLibrary(page);
  await page.screenshot({ path: testInfo.outputPath("vocabulary-library.png") });

  const lastTarget = await readLastTarget(page);
  await expect(page.getByTestId("vocabulary-library-total")).toContainText("3000");
  await page.getByTestId("vocabulary-library-last-page").click();
  await expect(page.getByTestId("vocabulary-library-page")).toContainText("60");
  await expect(
    page.getByTestId(`vocabulary-library-entry-${lastTarget.lexemeId}`),
  ).toBeVisible();

  const search = page.getByTestId("vocabulary-library-search");
  await search.fill(lastTarget.lexemeId);
  const resultCards = page.getByTestId("vocabulary-library-list").locator("article");
  await expect.poll(() => resultCards.count()).toBeGreaterThan(0);
  const resultTexts = await resultCards.allTextContents();
  for (const resultText of resultTexts) {
    expect(resultText.toLocaleLowerCase()).toContain(lastTarget.lexemeId.toLocaleLowerCase());
  }
  await expect(
    page.getByTestId(`vocabulary-library-entry-${lastTarget.lexemeId}`),
  ).toContainText(lastTarget.lemma);
  await expectNoHorizontalOverflow(page);
});

test("browsing, searching, and pagination do not write learning progress", async ({
  page,
}) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openLibrary(page);
  const before = await readProgress(page);

  await page.getByTestId("vocabulary-library-next-page").click();
  await page.getByTestId("vocabulary-library-previous-page").click();
  await page.getByTestId("vocabulary-library-search").fill("the");
  await page.getByTestId("vocabulary-library-level-filter").selectOption("A1");
  await expect(page.getByTestId("vocabulary-library-count")).toContainText("/");
  await page.getByTestId("vocabulary-library-level-filter").selectOption("all");
  await page.getByTestId("vocabulary-library-search").fill("");
  await page.getByTestId("vocabulary-library-last-page").click();
  await page.getByTestId("vocabulary-library-first-page").click();
  const after = await readProgress(page);
  expect(after).toEqual(before);
  await expectNoHorizontalOverflow(page);
});

test("recognition practice changes only global recognition evidence", async ({
  page,
}) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openLibrary(page);
  const lastTarget = await readLastTarget(page);
  const search = page.getByTestId("vocabulary-library-search");
  await search.fill(lastTarget.lexemeId);
  const card = page.getByTestId(`vocabulary-library-entry-${lastTarget.lexemeId}`);
  await card.getByTestId(`vocabulary-library-recognize-${lastTarget.lexemeId}`).click();
  await expect(page.getByTestId("vocabulary-library-recognition-practice")).toBeVisible();

  const before = await readProgress(page);
  const word = page.getByTestId("vocabulary-library-recognition-word");
  await expect(word).toContainText(lastTarget.lemma);
  const options = page.getByTestId("vocabulary-library-recognition-option");
  await options.filter({ hasText: /.+/ }).last().focus();
  const libraryResponse = await page.request.get("/data/vocabulary-library-v1.json");
  expect(libraryResponse.ok()).toBe(true);
  const libraryData = (await libraryResponse.json()) as {
    entries: Array<{ lexemeId: string; translationZhTw: string }>;
  };
  const libraryEntry = libraryData.entries.find(
    (entry) => entry.lexemeId === lastTarget.lexemeId,
  );
  expect(libraryEntry).toBeTruthy();
  await options.filter({ hasText: libraryEntry?.translationZhTw ?? "" }).click();
  await page.getByTestId("vocabulary-library-recognition-check").click();
  await expect(page.getByTestId("vocabulary-library-recognition-feedback")).toBeVisible();
  await page.getByTestId("vocabulary-library-recognition-next").click();

  const after = await readProgress(page);
  expect(after.levelProgress).toEqual(before.levelProgress);
  expect(after.passedLevelIds).toEqual(before.passedLevelIds);
  expect(after.vocabularyProgress[lastTarget.lexemeId]?.recognitionAttemptEvidenceIds).toHaveLength(1);
  expect(after.vocabularyProgress[lastTarget.lexemeId]?.recognitionCorrectEvidenceIds).toHaveLength(1);
  expect(after.vocabularyProgress[lastTarget.lexemeId]?.spellingCorrectEvidenceIds).toHaveLength(0);
  expect(after.vocabularyProgress[lastTarget.lexemeId]?.applicationCorrectEvidenceIds).toHaveLength(0);

  await page.reload();
  await waitForHome(page);
  const afterReload = await readProgress(page);
  expect(afterReload.vocabularyProgress[lastTarget.lexemeId]?.recognitionAttemptEvidenceIds).toHaveLength(1);
  expect(afterReload.levelProgress).toEqual(before.levelProgress);
});

test("a non-queue card cannot gain same-day clean credit after a wrong first answer", async ({
  page,
}) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openLibrary(page);
  const lastTarget = await readLastTarget(page);
  const search = page.getByTestId("vocabulary-library-search");
  await search.fill(lastTarget.lexemeId);
  const card = page.getByTestId(`vocabulary-library-entry-${lastTarget.lexemeId}`);
  const recognize = card.getByTestId(`vocabulary-library-recognize-${lastTarget.lexemeId}`);
  await recognize.click();
  const options = page.getByTestId("vocabulary-library-recognition-option");
  await expect(options).toHaveCount(4);
  const libraryResponse = await page.request.get("/data/vocabulary-library-v1.json");
  expect(libraryResponse.ok()).toBe(true);
  const libraryData = (await libraryResponse.json()) as {
    entries: Array<{ lexemeId: string; translationZhTw: string }>;
  };
  const libraryEntry = libraryData.entries.find(
    (entry) => entry.lexemeId === lastTarget.lexemeId,
  );
  expect(libraryEntry).toBeTruthy();
  const optionTexts = await options.allTextContents();
  const wrongIndex = optionTexts.findIndex(
    (text) => text.trim() !== (libraryEntry?.translationZhTw ?? "").trim(),
  );
  expect(wrongIndex).toBeGreaterThanOrEqual(0);
  await options.nth(wrongIndex).click();
  await page.getByTestId("vocabulary-library-recognition-check").click();
  await page.getByTestId("vocabulary-library-recognition-next").click();

  await search.fill(lastTarget.lexemeId);
  await page
    .getByTestId(`vocabulary-library-entry-${lastTarget.lexemeId}`)
    .getByTestId(`vocabulary-library-recognize-${lastTarget.lexemeId}`)
    .click();
  const secondOptions = page.getByTestId("vocabulary-library-recognition-option");
  await expect(secondOptions).toHaveCount(4);
  await secondOptions.filter({ hasText: libraryEntry?.translationZhTw ?? "" }).click();
  await page.getByTestId("vocabulary-library-recognition-check").click();
  await page.getByTestId("vocabulary-library-recognition-next").click();

  const after = await readProgress(page);
  const evidence = after.vocabularyProgress[lastTarget.lexemeId];
  expect(evidence.recognitionAttemptEvidenceIds).toHaveLength(1);
  expect(evidence.recognitionCorrectEvidenceIds).toHaveLength(0);
});

test("spelling reveal requires retype and never creates clean credit", async ({
  page,
}) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openLibrary(page);
  const lastTarget = await readLastTarget(page);
  await page.getByTestId("vocabulary-library-search").fill(lastTarget.lexemeId);
  await page
    .getByTestId(`vocabulary-library-entry-${lastTarget.lexemeId}`)
    .getByTestId(`vocabulary-library-spell-${lastTarget.lexemeId}`)
    .click();
  await expect(page.getByTestId("vocabulary-library-spelling-practice")).toBeVisible();

  const input = page.getByTestId("vocabulary-library-spelling-input");
  const check = page.getByTestId("vocabulary-library-spelling-check");
  await input.fill("wrong");
  await check.click();
  await input.fill("still-wrong");
  await check.click();
  await input.fill("nope");
  await check.click();
  await expect(page.getByTestId("vocabulary-library-spelling-revealed")).toContainText(lastTarget.lemma);
  await input.fill(lastTarget.lemma);
  await check.click();
  await expect(page.getByTestId("vocabulary-library-spelling-feedback")).toBeVisible();

  const progress = await readProgress(page);
  const evidence = progress.vocabularyProgress[lastTarget.lexemeId];
  // The vocabulary module intentionally records only the first attempt for a
  // lexeme on a study date; retyping after a reveal is required by the UI but
  // cannot create another clean-credit event.
  expect(evidence.spellingAttemptEvidenceIds).toHaveLength(1);
  expect(evidence.spellingCorrectEvidenceIds).toHaveLength(0);
  expect(evidence.recognitionCorrectEvidenceIds).toHaveLength(0);
  expect(evidence.applicationCorrectEvidenceIds).toHaveLength(0);
});

test("spelling definitions mask a real answer-containing definition", async ({
  page,
}) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openLibrary(page);
  await page.getByTestId("vocabulary-library-search").fill("know");
  await page
    .getByTestId("vocabulary-library-entry-know")
    .getByTestId("vocabulary-library-spell-know")
    .click();
  const definition = page.getByTestId("vocabulary-library-spelling-definition");
  await expect(definition).toContainText("____");
  await expect(definition).not.toContainText(/\bknow\b/i);
});

test("keeps the library usable when its target data fails to load", async ({
  page,
}) => {
  await page.route("**/data/vocabulary-targets-v2.json", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "simulated target library failure" }),
    });
  });
  await installProgressFixture(page);
  await waitForHome(page);
  await page.getByRole("button", { name: "前往3000 單字庫", exact: true }).click();
  await expect(page.getByTestId("vocabulary-library-error")).toBeVisible();
  const progress = await readProgress(page);
  expect(progress.vocabularyProgress).toEqual({});
});

test("clean spelling survives reload while pasted spelling receives no clean credit", async ({ page }) => {
  await installProgressFixture(page);
  await waitForHome(page);
  await openLibrary(page);
  const before = await readProgress(page);
  const last = await readLastTarget(page);
  await page.getByTestId("vocabulary-library-search").fill(last.lexemeId);
  await page.getByTestId(`vocabulary-library-spell-${last.lexemeId}`).click();
  await page.getByTestId("vocabulary-library-spelling-input").fill(last.lemma);
  await page.getByTestId("vocabulary-library-spelling-input").press("Enter");
  await expect(page.getByTestId("vocabulary-library-spelling-feedback")).toBeVisible();
  await page.reload();
  await waitForHome(page);
  await openLibrary(page);
  await page.getByTestId("vocabulary-library-search").fill("book");
  await page.getByTestId("vocabulary-library-spell-book").click();
  const input = page.getByTestId("vocabulary-library-spelling-input");
  await input.dispatchEvent("paste");
  await input.fill("book");
  await input.press("Enter");
  await expect(page.getByTestId("vocabulary-library-spelling-feedback")).toBeVisible();
  const after = await readProgress(page);
  expect(after.vocabularyProgress[last.lexemeId].spellingCorrectEvidenceIds).toHaveLength(1);
  expect(after.vocabularyProgress.book.spellingAttemptEvidenceIds).toHaveLength(1);
  expect(after.vocabularyProgress.book.spellingCorrectEvidenceIds).toHaveLength(0);
  expect(after.levelProgress).toEqual(before.levelProgress);
  expect(after.passedLevelIds).toEqual(before.passedLevelIds);
  expect(after.vocabularyProgress[last.lexemeId].applicationCorrectEvidenceIds).toHaveLength(0);
  await expectNoHorizontalOverflow(page);
});

test("unsupported speech disables playback without blocking recognition", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: undefined });
  });
  await installProgressFixture(page);
  await waitForHome(page);
  await openLibrary(page);
  await page.getByTestId("vocabulary-library-search").fill("book");
  await page.getByTestId("vocabulary-library-recognize-book").click();
  await expect(page.getByRole("button", { name: "播放 book 的美式發音" })).toBeDisabled();
  await expect(page.getByText("此瀏覽器不支援語音播放", { exact: true })).toBeVisible();
  await expect(page.getByTestId("vocabulary-library-recognition-option")).toHaveCount(4);
});
