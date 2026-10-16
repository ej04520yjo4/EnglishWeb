import { expect, type Page, test } from "@playwright/test";
import fs from "node:fs";

const progressKey = "yingju-progress-v1";
const settingsKey = "yingju-settings-v1";
const conversationKey = "yingju-conversation-practice-v1";

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

type ConversationData = { scenarios: ConversationScenario[] };

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

const emptyLevelProgress = (
  completedLessonIds: string[] = [],
): LevelProgress => ({
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

const progressFixture = (
  completedA1: string[] = [],
  completedA2: string[] = [],
): ProgressFixture => ({
  schemaVersion: 6,
  selectedLevel: "A1",
  passedLevelIds: [],
  levelProgress: {
    A1: emptyLevelProgress(completedA1),
    A2: emptyLevelProgress(completedA2),
    B1: emptyLevelProgress(),
    B2: emptyLevelProgress(),
  },
  vocabularyProgress: {},
});

const scenarioForLesson = (lessonId: string) => {
  const scenario = data.scenarios.find((item) =>
    item.requiredLessonIds.includes(lessonId),
  );
  if (!scenario) throw new Error(`No conversation scenario uses ${lessonId}.`);
  return scenario;
};

const introScenario = scenarioForLesson("a1-u1-l4");
const shoppingScenario = scenarioForLesson("a2-u03-l04");
const arrangementsScenario = scenarioForLesson("a2-u05-l04");
const householdScenario = scenarioForLesson("a2-u06-l04");

const seed = async (
  page: Page,
  options: {
    progress?: ProgressFixture;
    preview?: boolean;
    speechSupported?: boolean;
    clock?: string;
  } = {},
) => {
  await page.clock.setFixedTime(
    new Date(options.clock ?? "2026-10-16T12:00:00.000Z"),
  );
  const progress = options.progress ?? progressFixture();
  await page.addInitScript(
    ({ progressStorageKey, settingsStorageKey, progressValue, preview, speechSupported }) => {
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
            showAdvancedPilots: preview,
          }),
        );
      }
      if (!speechSupported) {
        let target: object | null = window;
        while (target) {
          const descriptor = Object.getOwnPropertyDescriptor(
            target,
            "speechSynthesis",
          );
          if (descriptor?.configurable) {
            Reflect.deleteProperty(target, "speechSynthesis");
          }
          target = Object.getPrototypeOf(target);
        }
      }
    },
    {
      progressStorageKey: progressKey,
      settingsStorageKey: settingsKey,
      progressValue: progress,
      preview: options.preview ?? false,
      speechSupported: options.speechSupported ?? true,
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

const openConversation = async (page: Page) => {
  await waitForHome(page);
  const navigation = page.getByRole("navigation", { name: "主要導覽" });
  await navigation.getByRole("button", { name: /對話/ }).click();
  await expect(page.getByTestId("conversation-practice")).toBeVisible();
};

const openScenario = async (page: Page, scenario: ConversationScenario) => {
  await page
    .getByTestId(`conversation-scenario-${scenario.id}`)
    .click();
  await expect(page.getByTestId("conversation-preparation")).toBeVisible();
  await page.getByTestId("conversation-start").press("Enter");
  await expect(page.getByTestId("conversation-active")).toBeVisible();
};

const finishTurn = async (
  page: Page,
  answer: string,
) => {
  const input = page.getByTestId("conversation-turn-input");
  await expect(input).toBeFocused();
  await input.fill(answer);
  await input.press("Enter");
  await expect(page.getByTestId("conversation-feedback")).toContainText(/./);
  const next = page.getByTestId("conversation-next");
  await expect(next).toBeFocused();
  await next.press("Enter");
};

const finishScenario = async (
  page: Page,
  scenario: ConversationScenario,
  useAlternatives = false,
) => {
  for (const turn of scenario.turns) {
    const answer =
      useAlternatives && turn.answers.length > 1
        ? turn.answers.at(-1)!
        : turn.answers[0];
    await finishTurn(page, answer);
  }
  await expect(page.getByTestId("conversation-summary")).toBeVisible();
};

const readConversationStore = async (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), conversationKey);

const expectNoHorizontalOverflow = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
};

test("normal mode keeps conversation scenarios behind their lesson prerequisites", async ({
  page,
}) => {
  await seed(page);
  await openConversation(page);

  for (const scenario of data.scenarios) {
    const button = page.getByTestId(`conversation-scenario-${scenario.id}`);
    await expect(button).toBeDisabled();
    await expect(button).toHaveText("完成前置課程後解鎖");
  }
  await expectNoHorizontalOverflow(page);
});

test("QA preview exposes all four scenarios without changing A1 progress", async ({
  page,
}) => {
  await seed(page, { preview: true });
  await openConversation(page);
  await expect(page.locator("[data-testid^='conversation-scenario-']")).toHaveCount(4);
  await expect(page.getByText("A2 試行預覽", { exact: false })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("three-turn conversation accepts a natural alternative and follow-up answers", async ({
  page,
}) => {
  await seed(page, { preview: true });
  await openConversation(page);
  await openScenario(page, shoppingScenario);
  await finishScenario(page, shoppingScenario, true);
  await expectNoHorizontalOverflow(page);
});

test("the third wrong response reveals only a reference answer and still requires retyping", async ({
  page,
}) => {
  await seed(page, { preview: true });
  await openConversation(page);
  await openScenario(page, introScenario);

  const input = page.getByTestId("conversation-turn-input");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await input.fill("This is not one of the answers.");
    await input.press("Enter");
  }
  await expect(page.getByTestId("conversation-reference-answer")).toBeVisible();
  await expect(page.getByTestId("conversation-next")).toHaveCount(0);
  await expect(input).toHaveValue("");

  await input.fill(introScenario.turns[0].answers[0]);
  await input.press("Enter");
  await expect(page.getByTestId("conversation-next")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("repair phrase practice autofocuses and accepts a polite request", async ({
  page,
}) => {
  await seed(page, { preview: true });
  await openConversation(page);
  await openScenario(page, arrangementsScenario);

  await page.getByTestId("conversation-repair-repeat").click();
  const repairInput = page.getByTestId("conversation-repair-input");
  await expect(repairInput).toBeFocused();
  await repairInput.fill("Could you say that again, please?");
  await repairInput.press("Enter");
  await expect(page.getByTestId("conversation-repair")).toHaveCount(0);
  await expect(page.getByTestId("conversation-turn-input")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("Enter advances once, keeps the next turn focused, and survives F5 mid-session", async ({
  page,
}) => {
  await seed(page, { preview: true });
  await openConversation(page);
  await openScenario(page, householdScenario);

  const firstInput = page.getByTestId("conversation-turn-input");
  await firstInput.fill(householdScenario.turns[0].answers[0]);
  await firstInput.press("Enter");
  await expect(page.getByTestId("conversation-feedback")).toContainText(/./);
  const firstNext = page.getByTestId("conversation-next");
  await expect(firstNext).toBeFocused();
  await firstNext.dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    repeat: true,
    bubbles: true,
  });
  await expect(page.getByTestId("conversation-feedback")).toContainText(/./);
  await firstNext.press("Enter");
  const activeBeforeReload = await readConversationStore(page);
  expect(activeBeforeReload.active.turnIndex).toBe(1);
  await page.keyboard.press("F5");
  await expect(page.getByRole("heading", { name: "把英文從「看得懂」練成「寫得出來」" })).toBeVisible();
  await page.getByRole("navigation", { name: "主要導覽" }).getByRole("button", { name: /對話/ }).click();
  await expect(page.getByText("回應 2 /", { exact: false })).toBeVisible();
  await expect(page.getByTestId("conversation-turn-input")).toBeFocused();

  const remaining = householdScenario.turns.slice(1);
  for (const turn of remaining) {
    await finishTurn(page, turn.answers[0]);
  }
  await expect(page.getByTestId("conversation-summary")).toBeVisible();
  await page.getByRole("button", { name: "回到情境列表", exact: true }).click();
  await expect(page.getByTestId(`conversation-scenario-${householdScenario.id}`)).toHaveText("重新練習");
  await expectNoHorizontalOverflow(page);
});

test("assisted first-day practice schedules review sooner and does not inflate clean credit", async ({
  page,
}) => {
  await seed(page, {
    preview: true,
    clock: "2026-10-16T04:00:00.000Z",
  });
  await openConversation(page);
  await openScenario(page, householdScenario);
  await page.getByTestId("conversation-hint").click();
  await finishScenario(page, householdScenario);

  const store = await readConversationStore(page);
  const result = store.results[`${householdScenario.id}:2026-10-16:${store.sourceRevision}`];
  expect(result.assistedTurns).toBeGreaterThan(0);
  expect(result.independentTurns).toBeLessThan(result.turnCount);
  expect(result.dueDate).toBe("2026-10-17");
  await expectNoHorizontalOverflow(page);
});

test("跨午夜拒絕舊回合後保留紀錄並允許重新開始", async ({ page }, testInfo) => {
  await seed(page, {
    preview: true,
    // The app's localDateKey uses the user's local timezone (Asia/Taipei in CI).
    // These UTC instants straddle midnight locally: 23:59 -> 00:01.
    clock: "2026-10-16T15:59:00.000Z",
  });
  await openConversation(page);
  await openScenario(page, introScenario);
  await page.screenshot({
    path: testInfo.outputPath("cross-midnight-active.png"),
    fullPage: true,
  });

  const input = page.getByTestId("conversation-turn-input");
  await input.fill("This is not a valid response.");
  await input.press("Enter");
  const beforeMidnight = await readConversationStore(page);
  expect(beforeMidnight.active.studyDate).toBe("2026-10-16");
  expect(Object.keys(beforeMidnight.turnHistory)).not.toHaveLength(0);

  await page.clock.setFixedTime(new Date("2026-10-16T16:01:00.000Z"));
  await input.fill(introScenario.turns[0].answers[0]);
  await input.press("Enter");

  await expect(page.getByText(/已保留本次作答紀錄/)).toBeVisible();
  const afterMidnight = await readConversationStore(page);
  expect(afterMidnight.active).toBeNull();
  expect(afterMidnight.results).toEqual(beforeMidnight.results);
  expect(afterMidnight.turnHistory).toEqual(beforeMidnight.turnHistory);

  const scenarioButton = page.getByTestId(`conversation-scenario-${introScenario.id}`);
  await expect(scenarioButton).toHaveText("查看情境");
  await scenarioButton.click();
  await page.getByTestId("conversation-start").click();
  await expect(page.getByText("回應 1 /", { exact: false })).toBeVisible();
});

test("A1 schema v6 progress remains byte-for-byte unchanged while searching and practicing", async ({
  page,
}) => {
  const fixture = progressFixture(["a1-u1-l4"]);
  await seed(page, { progress: fixture, preview: true });
  await waitForHome(page);
  const before = await page.evaluate((key) => localStorage.getItem(key), progressKey);

  await page.getByRole("navigation", { name: "主要導覽" }).getByRole("button", { name: /相關字詞/ }).click();
  const search = page.getByLabel("搜尋英文、中文、主題名稱或 lexeme ID");
  await search.fill("brothers");
  await expect(page.getByText("brother", { exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "主要導覽" }).getByRole("button", { name: /對話/ }).click();
  await expect(page.getByTestId("conversation-practice")).toBeVisible();
  await openScenario(page, introScenario);
  await finishScenario(page, introScenario);

  const after = await page.evaluate((key) => localStorage.getItem(key), progressKey);
  expect(after).toBe(before);
  expect(JSON.parse(after ?? "null").schemaVersion).toBe(6);
  await expectNoHorizontalOverflow(page);
});

test("unsupported speech disables conversation playback without blocking text practice", async ({
  page,
}) => {
  await seed(page, { preview: true, speechSupported: false });
  await openConversation(page);
  await openScenario(page, introScenario);
  await expect(page.locator(".conversation-audio-button")).toHaveCount(2);
  await expect(page.locator(".conversation-audio-button").first()).toBeDisabled();
  await expect(page.getByText(/不支援語音播放/)).toBeVisible();
  await finishTurn(page, introScenario.turns[0].answers[0]);
  await expectNoHorizontalOverflow(page);
});
