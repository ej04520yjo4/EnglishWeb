import { expect, Page, test } from "@playwright/test";

const progressKey = "yingju-progress-v1";
const dailySessionKey = "yingju-daily-session-v3";
const fixtureMarkerKey = "englishweb-daily-keyboard-fixture";

type ReviewMode = "spelling" | "recognition" | "application";

type DailyReviewItem = {
  id: string;
  level: "A1";
  occurrenceId: string;
  lexemeId: string;
  mode: ReviewMode;
};

type VocabularyEvidence = {
  firstSeenAt: string;
  lastSeenAt: string;
  exposureEvidenceIds: string[];
  recognitionCorrectEvidenceIds: string[];
  recognitionAttemptEvidenceIds: string[];
  spellingCorrectEvidenceIds: string[];
  spellingAttemptEvidenceIds: string[];
  applicationCorrectEvidenceIds: string[];
  applicationAttemptEvidenceIds: string[];
  evidenceStudyDates: Record<string, string>;
  studyDates: string[];
  sourceLevels: string[];
};

const emptyLevelProgress = (completedLessonIds: string[] = []) => ({
  completedLessonIds,
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

const progressFixture = ({
  completedLessonIds = [],
  vocabularyProgress = {},
}: {
  completedLessonIds?: string[];
  vocabularyProgress?: Record<string, VocabularyEvidence>;
} = {}) => ({
  schemaVersion: 6,
  selectedLevel: "A1",
  passedLevelIds: [],
  levelProgress: {
    A1: emptyLevelProgress(completedLessonIds),
    A2: emptyLevelProgress(),
    B1: emptyLevelProgress(),
    B2: emptyLevelProgress(),
  },
  vocabularyProgress,
});

const evidenceFor = (
  kind: "spelling" | "recognition" | "application",
  lexemeId: string,
): VocabularyEvidence => {
  const evidenceId = `seed-${kind}-miss-${lexemeId}`;
  return {
    firstSeenAt: "2026-08-19T01:00:00.000Z",
    lastSeenAt: "2026-08-19T01:00:00.000Z",
    exposureEvidenceIds: [],
    recognitionCorrectEvidenceIds: [],
    recognitionAttemptEvidenceIds:
      kind === "recognition" ? [evidenceId] : [],
    spellingCorrectEvidenceIds: [],
    spellingAttemptEvidenceIds: kind === "spelling" ? [evidenceId] : [],
    applicationCorrectEvidenceIds: [],
    applicationAttemptEvidenceIds:
      kind === "application" ? [evidenceId] : [],
    evidenceStudyDates: { [evidenceId]: "2026-08-19" },
    studyDates: ["2026-08-19"],
    sourceLevels: ["A1"],
  };
};

const reviewItem = (
  occurrenceId: string,
  lexemeId: string,
  mode: ReviewMode,
): DailyReviewItem => ({
  id: `daily-review:${occurrenceId}:${mode}`,
  level: "A1",
  occurrenceId,
  lexemeId,
  mode,
});

const seedFixture = async (
  page: Page,
  options: {
    completedLessonIds?: string[];
    vocabularyProgress?: Record<string, VocabularyEvidence>;
    reviewItems?: DailyReviewItem[];
    weaknessLexemeIds?: string[];
    completedSteps?: string[];
  } = {},
) => {
  const progress = progressFixture(options);
  await page.addInitScript(
    ({
      fixtureMarkerStorageKey,
      progressStorageKey,
      sessionStorageKey,
      progressValue,
      daily,
    }) => {
      if (sessionStorage.getItem(fixtureMarkerStorageKey) === "ready") return;
      sessionStorage.setItem(fixtureMarkerStorageKey, "ready");
      if (localStorage.getItem(progressStorageKey) === null) {
        localStorage.setItem(progressStorageKey, JSON.stringify(progressValue));
      }
      if (localStorage.getItem(sessionStorageKey) !== null) return;
      if (!daily) return;
      const now = new Date();
      const pad = (value: number) => String(value).padStart(2, "0");
      const localDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      localStorage.setItem(
        sessionStorageKey,
        JSON.stringify({
          version: 3,
          localDate,
          level: "A1",
          startedAt: now.getTime(),
          lessonId: "a1-u1-l1",
          reviewCount: daily.reviewItems.length,
          reviewItems: daily.reviewItems,
          completedReviewItemIds: [],
          reviewItemProgress: {},
          weaknessLexemeIds: daily.weaknessLexemeIds,
          completedWeaknessLexemeIds: [],
          completedSteps: daily.completedSteps,
          beforeVocabulary: { exposed: 0, receptive: 0, active: 0 },
          activeStudySeconds: 0,
          activeStartedAt: null,
        }),
      );
    },
    {
      fixtureMarkerStorageKey: fixtureMarkerKey,
      progressStorageKey: progressKey,
      sessionStorageKey: dailySessionKey,
      progressValue: progress,
      daily:
        options.reviewItems || options.weaknessLexemeIds
          ? {
              reviewItems: options.reviewItems ?? [],
              weaknessLexemeIds: options.weaknessLexemeIds ?? [],
              completedSteps: options.completedSteps ?? [],
            }
          : null,
    },
  );
};

const waitForA1Home = async (page: Page) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
};

const resumeDaily = async (page: Page) => {
  await page.getByTestId("daily-session-resume").click();
};

const readProgress = async (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), progressKey);

const expectNoHorizontalOverflow = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    )
    .toBe(true);
};

test("Daily recognition focuses its first option without changing progress", async ({
  page,
}) => {
  await seedFixture(page, {
    reviewItems: [reviewItem("a1-u1-l1-t01", "i", "recognition")],
  });
  await waitForA1Home(page);
  const before = await readProgress(page);
  await resumeDaily(page);

  await expect(page.getByTestId("daily-review-counter")).toHaveText("今日複習 1 / 1");
  const options = page.getByTestId("daily-review-option");
  await expect(options.first()).toBeFocused();
  await expect(page.getByTestId("daily-review-revealed-answer")).toHaveCount(0);
  expect(await readProgress(page)).toEqual(before);
  await expectNoHorizontalOverflow(page);
});

test("Daily recognition advances once and focuses the next recognition item", async ({
  page,
}) => {
  const first = reviewItem("a1-u1-l1-t01", "i", "recognition");
  const second = reviewItem("a1-u1-l1-t02", "be", "recognition");
  await seedFixture(page, { reviewItems: [first, second] });
  await waitForA1Home(page);
  await resumeDaily(page);

  const firstOption = page.getByTestId("daily-review-option").first();
  await expect(firstOption).toBeFocused();
  await page.keyboard.down("Enter");
  const next = page.getByTestId("daily-review-next");
  await expect(next).toBeFocused();
  await page.keyboard.down("Enter");
  await expect(next).toBeFocused();
  await page.keyboard.up("Enter");
  await expect(page.getByTestId("daily-review-counter")).toHaveText("今日複習 1 / 2");
  const firstSession = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    dailySessionKey,
  );
  expect(firstSession.completedReviewItemIds).toEqual([first.id]);
  await page.keyboard.down("Enter");

  await expect(page.getByTestId("daily-review-counter")).toHaveText("今日複習 2 / 2");
  const secondOption = page.getByTestId("daily-review-option").first();
  await expect(secondOption).toBeFocused();
  await page.keyboard.down("Enter");
  await expect(secondOption).toBeFocused();
  await expect(page.getByTestId("daily-review-next")).toHaveCount(0);
  await page.keyboard.up("Enter");
  await page.keyboard.down("Enter");
  const finalNext = page.getByTestId("daily-review-next");
  await expect(finalNext).toBeFocused();
  await page.keyboard.down("Enter");
  await expect(finalNext).toBeFocused();
  await page.keyboard.up("Enter");
  const session = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    dailySessionKey,
  );
  expect(session.completedReviewItemIds).toEqual([first.id, second.id]);
  await expectNoHorizontalOverflow(page);
});

test("weakness spelling uses Enter from submit to the next item and summary", async ({
  page,
}) => {
  await seedFixture(page, {
    vocabularyProgress: { i: evidenceFor("spelling", "i"), be: evidenceFor("spelling", "be") },
    weaknessLexemeIds: ["i", "be"],
    completedSteps: ["lesson"],
  });
  await waitForA1Home(page);
  await resumeDaily(page);

  const input = page.getByTestId("weakness-practice-input");
  await expect(input).toBeFocused();
  await input.fill("I");
  await input.press("Enter");
  const action = page.getByTestId("weakness-practice-action");
  await expect(action).toBeFocused();
  await action.press("Enter");

  await expect(page.getByText("弱點加強・2/2", { exact: true })).toBeVisible();
  await expect(page.getByTestId("weakness-practice-input")).toBeFocused();
  await page.getByTestId("weakness-practice-input").fill("am");
  await page.getByTestId("weakness-practice-input").press("Enter");
  await expect(action).toBeFocused();
  await action.press("Enter");
  await expect(page.getByTestId("daily-learning-summary")).toBeVisible();
  await expect(page.getByTestId("finish-daily-session")).toBeFocused();
  const beforeFinish = await readProgress(page);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("daily-learning-plan")).toBeVisible();
  expect(await readProgress(page)).toEqual(beforeFinish);
  expect(await page.evaluate((key) => localStorage.getItem(key), dailySessionKey)).toBeNull();
  await expectNoHorizontalOverflow(page);
});

test("weakness application reveals after three Enter errors without mastery credit", async ({
  page,
}) => {
  await seedFixture(page, {
    vocabularyProgress: { my: evidenceFor("application", "my") },
    weaknessLexemeIds: ["my"],
    completedSteps: ["lesson"],
  });
  await waitForA1Home(page);
  await resumeDaily(page);

  const input = page.getByTestId("weakness-practice-input");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await input.fill("I am Amy.");
    await input.press("Enter");
  }
  const action = page.getByTestId("weakness-practice-action");
  await expect(action).toBeFocused();
  await expect(page.getByText("正確答案是", { exact: false })).toBeVisible();
  await action.press("Enter");
  await expect(page.getByTestId("daily-learning-summary")).toBeVisible();

  const evidence = await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return value?.vocabularyProgress?.my;
  }, progressKey);
  expect(evidence.applicationCorrectEvidenceIds).toEqual([]);
  expect(evidence.applicationAttemptEvidenceIds).toHaveLength(4);
  await expectNoHorizontalOverflow(page);
});

test("weakness recognition focuses the first option and preserves selection focus", async ({
  page,
}) => {
  await seedFixture(page, {
    vocabularyProgress: { be: evidenceFor("recognition", "be") },
    weaknessLexemeIds: ["be"],
    completedSteps: ["lesson"],
  });
  await waitForA1Home(page);
  await resumeDaily(page);

  const options = page.getByTestId("weakness-practice-option");
  await expect(options.first()).toBeFocused();
  await expect(options.first()).toHaveAttribute("aria-pressed", "false");
  const second = options.nth(1);
  await second.press("Enter");
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(options.first()).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("weakness-practice-action")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("unit assessment keeps keyboard focus through pass and reload", async ({ page }) => {
  await seedFixture(page, {
    completedLessonIds: [
      "a1-u1-l1",
      "a1-u1-l2",
      "a1-u1-l3",
      "a1-u1-l4",
    ],
  });
  await waitForA1Home(page);
  await page.getByRole("button", { name: /開始單元測驗/ }).click();

  for (const [index, answer] of [
    "I am Amy.",
    "My name is Ben.",
    "Nice to meet you.",
    "I am from Taiwan.",
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

  await expect(page.getByRole("heading", { name: "A1 課程地圖" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "null");
        return value?.levelProgress?.A1?.passedUnitIds ?? [];
      }, progressKey),
    )
    .toContain("a1-u1");
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "前往課程地圖", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A1 課程地圖" })).toBeVisible();
  expect((await readProgress(page)).levelProgress.A1.passedUnitIds).toContain("a1-u1");
  await expect(
    page.locator(".road-unit").nth(1).locator(".lesson-row.available").first(),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
