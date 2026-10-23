import { expect, type Page, test } from "@playwright/test";
import fs from "node:fs";

const progressKey = "yingju-progress-v1";
const conversationKey = "yingju-conversation-practice-v1";
const conversationReviewKey = "yingju-conversation-review-v1";
const today = "2026-10-16";

type ConversationTurn = {
  id: string;
  partnerEnglish: string;
  answers: string[];
};

type ConversationScenario = {
  id: string;
  level: "A1" | "A2";
  title: string;
  requiredLessonIds: string[];
  turns: ConversationTurn[];
};

type ConversationData = {
  sourceRevision: string;
  scenarios: ConversationScenario[];
};

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

type ProgressFixture = {
  schemaVersion: 6;
  selectedLevel: "A1";
  passedLevelIds: string[];
  levelProgress: Record<"A1" | "A2" | "B1" | "B2", LevelProgress>;
  vocabularyProgress: Record<string, unknown>;
};

const data = JSON.parse(
  fs.readFileSync("public/data/conversation-practice-v1.json", "utf8"),
) as ConversationData;
const introductionScenario = data.scenarios.find(
  (scenario) => scenario.id === "conversation-introduction",
)!;

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

const progressFixture = (): ProgressFixture => ({
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

type ConversationRecord = {
  attempts: number;
  firstCorrect: boolean;
  usedHint: boolean;
  answerRevealed: boolean;
  usedPaste: boolean;
  usedSpeech?: boolean;
  repairUsed: boolean;
  completed: boolean;
};

const record = (overrides: Partial<ConversationRecord> = {}): ConversationRecord => ({
  attempts: 1,
  firstCorrect: true,
  usedHint: false,
  answerRevealed: false,
  usedPaste: false,
  usedSpeech: false,
  repairUsed: false,
  completed: true,
  ...overrides,
});

const reviewFixture = () => {
  const studyDate = "2026-10-15";
  const sourceRevision = data.sourceRevision;
  const turnHistory = Object.fromEntries(
    introductionScenario.turns.map((turn, index) => [
      `${sourceRevision}:${studyDate}:${turn.id}`,
      index === 0
        ? record({ attempts: 2, usedHint: true })
        : index === 1
          ? record({ attempts: 2, usedSpeech: true })
          : record(),
    ]),
  );
  const resultId = `${introductionScenario.id}:${studyDate}:${sourceRevision}`;
  return {
    schemaVersion: 1,
    sourceRevision,
    active: null,
    results: {
      [resultId]: {
        id: resultId,
        scenarioId: introductionScenario.id,
        sourceRevision,
        studyDate,
        dueDate: today,
        turnCount: introductionScenario.turns.length,
        independentTurns: 1,
        assistedTurns: 2,
        speechTurns: 1,
      },
    },
    turnHistory,
  };
};

const seed = async (
  page: Page,
  options: { conversation?: unknown; malformedReview?: boolean; preview?: boolean } = {},
) => {
  await page.clock.setFixedTime(new Date("2026-10-16T12:00:00.000Z"));
  await page.addInitScript(
    ({ progress, conversationStorageKey, conversationValue, reviewStorageKey, malformedReview, preview }) => {
      // Keep persisted bytes across F5; only seed a fresh browser context.
      // This is important for proving that an active weak-review session resumes
      // instead of being silently replaced by the fixture.
      if (localStorage.getItem("yingju-progress-v1") === null) {
        localStorage.setItem("yingju-progress-v1", JSON.stringify(progress));
      }
      if (localStorage.getItem(conversationStorageKey) === null) {
        localStorage.setItem(conversationStorageKey, JSON.stringify(conversationValue));
      }
      if (malformedReview && localStorage.getItem(reviewStorageKey) === null) {
        localStorage.setItem(reviewStorageKey, "{\"schemaVersion\":999,\"active\":\"bad\"}");
      }
      if (localStorage.getItem("yingju-settings-v1") === null) {
        localStorage.setItem(
          "yingju-settings-v1",
          JSON.stringify({
            phonetic: "KK",
            autoplay: false,
            slowRate: 0.85,
            showAdvancedPilots: preview,
          }),
        );
      }
    },
    {
      progress: progressFixture(),
      conversationStorageKey: conversationKey,
      conversationValue: options.conversation ?? reviewFixture(),
      reviewStorageKey: conversationReviewKey,
      malformedReview: options.malformedReview ?? false,
      preview: options.preview ?? true,
    },
  );
};

const openConversation = async (page: Page) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "把英文從「看得懂」練成「寫得出來」" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "主要導覽" })
    .getByRole("button", { name: /對話/ })
    .click();
  await expect(page.getByTestId("conversation-practice")).toBeVisible();
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

test("弱點複習只列出需要支援的回合，並保留正式與原對話紀錄", async ({
  page,
}, testInfo) => {
  await seed(page);
  await openConversation(page);
  const conversationBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    conversationKey,
  );
  const progressBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    progressKey,
  );

  // A completed formal conversation opens on its summary first. The review
  // entry point is intentionally also available from the overview list.
  await page.getByRole("button", { name: "回到情境列表", exact: true }).click();
  await expect(page.getByTestId("conversation-practice")).toBeVisible();
  await page.getByRole("button", { name: "對話弱點複習", exact: true }).click();
  await expect(page.getByTestId("conversation-review")).toBeVisible();
  await expect(page.getByText("已到複習時間", { exact: true })).toBeVisible();
  // The overview deliberately shows only turn numbers and support reasons;
  // partner English is revealed after the learner starts that weak turn.
  await expect(page.locator(".conversation-review-reasons li")).toHaveCount(2);
  await expect(page.getByText(/第 1 回合：/)).toBeVisible();
  await expect(page.getByText(/第 2 回合：/)).toBeVisible();
  await expect(page.getByText(/第 3 回合：/)).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("conversation-review-overview.png"),
    fullPage: true,
  });

  await page
    .getByTestId(`conversation-review-start-${introductionScenario.id}`)
    .click();
  await expect(page.getByTestId("conversation-review-input")).toBeFocused();
  await page
    .getByTestId("conversation-review-input")
    .fill(introductionScenario.turns[0].answers[0]);
  await expect(page.getByTestId("conversation-review-check")).toBeEnabled();
  await page.screenshot({
    path: testInfo.outputPath("conversation-review-active.png"),
    fullPage: true,
  });
  await page.getByTestId("conversation-review-input").press("Enter");
  await expect(page.getByTestId("conversation-review-next")).toBeVisible();
  await page.getByTestId("conversation-review-next").press("Enter");

  const reviewInput = page.getByTestId("conversation-review-input");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await reviewInput.fill("This is not the accepted answer.");
    await reviewInput.press("Enter");
  }
  await expect(page.getByTestId("conversation-review-reference-answer")).toBeVisible();
  await expect(page.getByTestId("conversation-review-next")).toHaveCount(0);

  await reviewInput.fill(introductionScenario.turns[1].answers[0]);
  await reviewInput.press("Enter");
  await expect(page.getByTestId("conversation-review-next")).toBeVisible();
  await page.getByTestId("conversation-review-next").press("Enter");
  await expect(page.getByTestId("conversation-review-summary")).toBeVisible();
  await expect(page.getByTestId("conversation-review-summary")).toContainText("首次無協助答對");
  await expect(page.getByTestId("conversation-review-summary")).toContainText("仍需加強");
  await page.screenshot({
    path: testInfo.outputPath("conversation-review-summary.png"),
    fullPage: true,
  });

  expect(await page.evaluate((key) => localStorage.getItem(key), conversationKey)).toBe(
    conversationBefore,
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey)).toBe(
    progressBefore,
  );
  await expectNoHorizontalOverflow(page);
});

test("完整對話結果可進入弱點複習，且同日重新整理會恢復進度", async ({ page }) => {
  const emptyConversation = {
    schemaVersion: 1,
    sourceRevision: data.sourceRevision,
    active: null,
    results: {},
    turnHistory: {},
  };
  await seed(page, { conversation: emptyConversation });
  await openConversation(page);
  await page
    .getByTestId(`conversation-scenario-${introductionScenario.id}`)
    .click();
  await page.getByTestId("conversation-start").click();
  await page.getByTestId("conversation-hint").click();

  for (const [index, turn] of introductionScenario.turns.entries()) {
    const input = page.getByTestId("conversation-turn-input");
    await input.fill(turn.answers[0]);
    await input.press("Enter");
    await page.getByTestId("conversation-next").press("Enter");
    if (index === introductionScenario.turns.length - 1) break;
  }
  await expect(page.getByTestId("conversation-summary")).toBeVisible();
  const conversationBeforeReview = await page.evaluate(
    (key) => localStorage.getItem(key),
    conversationKey,
  );
  const progressBeforeReview = await page.evaluate(
    (key) => localStorage.getItem(key),
    progressKey,
  );
  await page.getByRole("button", { name: "只複習弱點回合", exact: true }).click();
  await page
    .getByTestId(`conversation-review-start-${introductionScenario.id}`)
    .click();
  await expect(page.getByTestId("conversation-review-input")).toBeVisible();
  await page.getByTestId("conversation-review-input").fill("partial answer");
  await page.getByTestId("conversation-review-input").press("Enter");
  const reviewBeforeReload = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    conversationReviewKey,
  );
  expect(reviewBeforeReload.active.records[introductionScenario.turns[0].id].attempts).toBe(1);

  await page.reload();
  await openConversation(page);
  // Reload remounts the normal conversation summary. Review view is an
  // explicit choice, while the same-day review session itself is resumed.
  await expect(page.getByTestId("conversation-summary")).toBeVisible();
  await page.getByRole("button", { name: "只複習弱點回合", exact: true }).click();
  await expect(page.getByTestId("conversation-review")).toBeVisible();
  await expect(page.getByTestId("conversation-review-input")).toBeVisible();
  await expect(page.getByTestId("conversation-review-input")).toHaveValue("");
  await expect(page.getByText("弱點複習 1 / 1", { exact: true })).toBeVisible();
  const reviewAfterReload = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    conversationReviewKey,
  );
  expect(reviewAfterReload.active.records[introductionScenario.turns[0].id].attempts).toBe(1);
  const conversationAfterReview = await page.evaluate(
    (key) => localStorage.getItem(key),
    conversationKey,
  );
  expect(conversationAfterReview).toBe(conversationBeforeReview);
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey)).toBe(
    progressBeforeReview,
  );
  const completedResult = Object.values(JSON.parse(conversationAfterReview ?? "{}").results) as Array<{
    turnCount: number;
    independentTurns: number;
    assistedTurns: number;
  }>;
  expect(completedResult).toHaveLength(1);
  expect(completedResult[0]).toMatchObject({ turnCount: 3, independentTurns: 2, assistedTurns: 1 });
  await expectNoHorizontalOverflow(page);
});

test("損壞的弱點複習紀錄會停止載入且不覆寫原始內容", async ({ page }) => {
  await seed(page, { malformedReview: true });
  await openConversation(page);
  await page.getByRole("button", { name: "回到情境列表", exact: true }).click();
  await expect(page.getByTestId("conversation-practice")).toBeVisible();
  const malformedBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    conversationReviewKey,
  );
  await page.getByRole("button", { name: "對話弱點複習", exact: true }).click();
  await expect(page.getByTestId("conversation-review")).toBeVisible();
  await expect(page.getByTestId("conversation-review-input")).toHaveCount(0);
  await expect(page.locator('[data-testid^="conversation-review-start-"]')).toHaveCount(0);
  await expect(page.getByRole("alert").filter({ hasText: "弱點複習紀錄需要先處理" })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), conversationReviewKey)).toBe(
    malformedBefore,
  );
});

test("跨分頁更新弱點複習紀錄時會停止作答並保留外部資料", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await page.getByRole("button", { name: "回到情境列表", exact: true }).click();
  await page.getByRole("button", { name: "對話弱點複習", exact: true }).click();
  await page
    .getByTestId(`conversation-review-start-${introductionScenario.id}`)
    .click();

  const externalStore = JSON.stringify({
    schemaVersion: 1,
    sourceRevision: data.sourceRevision,
    active: null,
    lastResult: null,
    externalWriter: true,
  });
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: conversationReviewKey, value: externalStore },
  );
  await page
    .getByTestId("conversation-review-input")
    .fill(introductionScenario.turns[0].answers[0]);
  await page.getByTestId("conversation-review-input").press("Enter");
  await expect(
    page.getByRole("alert").filter({ hasText: "另一個分頁更新" }),
  ).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), conversationReviewKey)).toBe(
    externalStore,
  );
  await expect(page.getByTestId("conversation-review-next")).toHaveCount(0);
});

test("正式模式未滿足前置課程時不允許開始弱點複習", async ({ page }) => {
  await seed(page, { preview: false });
  await openConversation(page);
  await page.getByRole("button", { name: "回到情境列表", exact: true }).click();
  await page.getByRole("button", { name: "對話弱點複習", exact: true }).click();
  await expect(
    page.getByTestId(`conversation-review-start-${introductionScenario.id}`),
  ).toBeDisabled();
  await expect(page.getByTestId("conversation-review-input")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("跨午夜會拒絕舊弱點回合，保留來源資料並允許新日期重新開始", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await page.getByRole("button", { name: "回到情境列表", exact: true }).click();
  await page.getByRole("button", { name: "對話弱點複習", exact: true }).click();
  await page
    .getByTestId(`conversation-review-start-${introductionScenario.id}`)
    .click();

  const conversationBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    conversationKey,
  );
  const progressBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    progressKey,
  );
  const reviewBefore = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    conversationReviewKey,
  );
  expect(reviewBefore.active.studyDate).toBe("2026-10-16");
  expect(reviewBefore.active.records[introductionScenario.turns[0].id].attempts).toBe(0);

  await page.getByTestId("conversation-review-input").fill("pending answer");
  await page.clock.setFixedTime(new Date("2026-10-16T16:01:00.000Z"));
  await page.getByTestId("conversation-review-input").press("Enter");
  await expect(page.getByRole("alert")).toContainText("日期已變更");

  const afterMidnight = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    conversationReviewKey,
  );
  // The unsent text must not become an answer attempt, and the old raw active
  // session remains available until the learner explicitly starts the new day.
  expect(afterMidnight.active.studyDate).toBe("2026-10-16");
  expect(afterMidnight.active.records[introductionScenario.turns[0].id].attempts).toBe(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), conversationKey)).toBe(
    conversationBefore,
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey)).toBe(
    progressBefore,
  );

  await page
    .getByTestId(`conversation-review-start-${introductionScenario.id}`)
    .click();
  const restarted = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    conversationReviewKey,
  );
  expect(restarted.active.studyDate).toBe("2026-10-17");
  await page
    .getByTestId("conversation-review-input")
    .fill(introductionScenario.turns[0].answers[0]);
  await page.getByTestId("conversation-review-input").press("Enter");
  await expect(page.getByTestId("conversation-review-next")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("弱點複習儲存遇到配額錯誤時不前進也不覆蓋原紀錄", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await page.getByRole("button", { name: "回到情境列表", exact: true }).click();
  await page.getByRole("button", { name: "對話弱點複習", exact: true }).click();
  await page
    .getByTestId(`conversation-review-start-${introductionScenario.id}`)
    .click();

  const reviewBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    conversationReviewKey,
  );
  const conversationBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    conversationKey,
  );
  const progressBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    progressKey,
  );
  await page.evaluate((key) => {
    const storage = window.localStorage;
    const original = storage.setItem.bind(storage);
    Object.defineProperty(storage, "setItem", {
      configurable: true,
      value: (candidateKey: string, value: string) => {
        if (candidateKey === key) {
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        }
        original(candidateKey, value);
      },
    });
  }, conversationReviewKey);

  await page
    .getByTestId("conversation-review-input")
    .fill(introductionScenario.turns[0].answers[0]);
  await page.getByTestId("conversation-review-input").press("Enter");
  await expect(
    page.getByRole("alert").filter({ hasText: "弱點複習儲存失敗" }).first(),
  ).toBeVisible();
  await expect(page.getByTestId("conversation-review-next")).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), conversationReviewKey)).toBe(
    reviewBefore,
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), conversationKey)).toBe(
    conversationBefore,
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey)).toBe(
    progressBefore,
  );
  await expectNoHorizontalOverflow(page);
});
