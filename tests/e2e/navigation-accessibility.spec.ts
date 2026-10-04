import { expect, Page, test } from "@playwright/test";

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

const emptyVocabularyEvidence = (overrides: Record<string, unknown> = {}) => ({
  firstSeenAt: "2026-01-01T00:00:00.000Z",
  lastSeenAt: "2026-01-01T00:00:00.000Z",
  exposureEvidenceIds: [],
  recognitionCorrectEvidenceIds: [],
  recognitionAttemptEvidenceIds: [],
  spellingCorrectEvidenceIds: [],
  spellingAttemptEvidenceIds: ["navigation-spelling-miss"],
  applicationCorrectEvidenceIds: [],
  applicationAttemptEvidenceIds: [],
  evidenceStudyDates: {
    "navigation-spelling-miss": "2026-01-01",
  },
  studyDates: ["2026-01-01"],
  sourceLevels: ["A1"],
  ...overrides,
});

const progressFixture = (options: {
  completedLessonIds?: string[];
  passedUnitIds?: string[];
  includeDueReview?: boolean;
  includeWeakness?: boolean;
} = {}) => {
  const a1 = emptyLevelProgress();
  a1.completedLessonIds = options.completedLessonIds ?? [];
  a1.passedUnitIds = options.passedUnitIds ?? [];
  if (options.includeDueReview) {
    a1.reviewItems["a1-u1-l1-t01"] = {
      tokenId: "a1-u1-l1-t01",
      answer: "I",
      prompt: "我",
      familiarity: "不熟",
      dueAt: "2000-01-01T00:00:00.000Z",
      intervalDays: 1,
      successfulDays: 0,
    };
  }
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
    vocabularyProgress: options.includeWeakness
      ? { i: emptyVocabularyEvidence() }
      : {},
  };
};

const seedProgress = async (
  page: Page,
  options: Parameters<typeof progressFixture>[0] = {},
) => {
  await page.addInitScript(
    ({ key, value }) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    },
    { key: progressKey, value: progressFixture(options) },
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

const expectNoHorizontalOverflow = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
};

const expectPageContentFocus = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const content = document.querySelector<HTMLElement>("#main-content");
        const active = document.activeElement;
        return Boolean(
          content &&
            active &&
            content.contains(active) &&
            (active.tagName === "H1" || active === content),
        );
      }),
    )
    .toBe(true);
};

const expectNavigationDescription = async (
  page: Page,
  buttonName: string,
  expectedText: RegExp,
) => {
  const button = page.getByRole("button", { name: buttonName, exact: true });
  await expect(button).toHaveAccessibleDescription(expectedText);
  const describedBy = await button.getAttribute("aria-describedby");
  expect(describedBy, `${buttonName} 應有待辦數量說明`).toBeTruthy();
  const description = page.locator(`#${describedBy}`);
  await expect(description).toHaveText(expectedText);
};

test("skip link uses keyboard focus without writing progress", async ({ page }) => {
  await waitForHome(page);
  const homeAction = page.getByRole("button", { name: /開始這一課/ });
  await expect(homeAction).toBeFocused();

  const skipLink = page.getByRole("link", {
    name: "跳到主要內容",
    exact: true,
  });
  let skipFocused = false;
  for (let index = 0; index < 40; index += 1) {
    if (await skipLink.evaluate((element) => element === document.activeElement)) {
      skipFocused = true;
      break;
    }
    await page.keyboard.press("Shift+Tab");
  }
  expect(skipFocused).toBe(true);
  await expect(skipLink).toBeVisible();

  const before = await page.evaluate((key) => localStorage.getItem(key), progressKey);
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.locator("#main-content")).toHaveAttribute("tabindex", "-1");
  const after = await page.evaluate((key) => localStorage.getItem(key), progressKey);
  expect(after).toBe(before);
  await expectNoHorizontalOverflow(page);
});

test("sidebar navigation moves focus into static pages and exposes due counts", async ({
  page,
}) => {
  await seedProgress(page, {
    includeDueReview: true,
    includeWeakness: true,
  });
  await waitForHome(page);

  await expectNavigationDescription(page, "前往待複習", /1 項待複習內容/);
  await expectNavigationDescription(page, "前往弱點中心", /1 個待加強單字/);
  const progressBeforeNavigation = await page.evaluate(
    (key) => localStorage.getItem(key), progressKey,
  );

  const staticPages = [
    { label: "A–Z 基礎", heading: "A–Z 發音基礎" },
    { label: "KK 音標", heading: "KK 音標發音" },
    { label: "相關字詞", heading: "相關字詞" },
    { label: "學習進度", heading: "學習進度" },
    { label: "內容管理", heading: "課程內容管理" },
  ];
  for (const item of staticPages) {
    const navigation = page.getByRole("button", {
      name: `前往${item.label}`,
      exact: true,
    });
    await navigation.focus();
    await navigation.press("Enter");
    await expect(page.getByRole("heading", { name: item.heading, exact: true })).toBeVisible();
    await expectPageContentFocus(page);
    await expectNoHorizontalOverflow(page);
    if (item.label === "內容管理") {
      await expect.poll(() => page.locator(".admin-table-wrap").evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      )).toBe(true);
    }
  }

  const settings = page.getByRole("button", { name: "設定", exact: true });
  await settings.focus();
  await settings.press("Enter");
  await expect(page.getByRole("heading", { name: "設定", exact: true })).toBeVisible();
  await expectPageContentFocus(page);
  await expectNoHorizontalOverflow(page);
  await expect(settings).toHaveAttribute("aria-current", "page");
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey))
    .toBe(progressBeforeNavigation);
});

test("late vocabulary loading does not steal focus from a chosen header control", async ({ page }) => {
  let releaseGroups: () => void = () => {};
  const groupsReady = new Promise<void>((resolve) => { releaseGroups = resolve; });
  await page.route("**/data/vocabulary-groups-v1.json", async (route) => {
    await groupsReady;
    await route.continue();
  });
  try {
    await waitForHome(page);
    await page.getByRole("button", { name: "前往相關字詞", exact: true }).press("Enter");
    await expect(page.getByTestId("vocabulary-loading")).toBeVisible();
    await expect(page.locator("#main-content")).toBeFocused();
    const settings = page.getByRole("button", { name: "設定", exact: true });
    await settings.focus();
    releaseGroups();
    await expect(page.getByRole("heading", { name: "相關字詞", exact: true })).toBeVisible();
    await expect(settings).toBeFocused();
    await expectNoHorizontalOverflow(page);
  } finally {
    releaseGroups();
  }
});

test("preserves autoFocus for home, map, and learning entry", async ({ page }) => {
  await waitForHome(page);
  await expect(page.getByRole("button", { name: /開始這一課/ })).toBeFocused();

  const mapNavigation = page.getByRole("button", {
    name: "前往課程地圖",
    exact: true,
  });
  await mapNavigation.focus();
  await mapNavigation.press("Enter");
  await expect(page.getByRole("heading", { name: "A1 課程地圖", exact: true })).toBeVisible();
  const nextLesson = page.locator(".lesson-row.available").first();
  await expect(nextLesson).toBeFocused();

  await nextLesson.press("Enter");
  await expect(page.getByRole("heading", { name: "我是誰", exact: true })).toBeVisible();
  const beginLesson = page.getByRole("button", {
    name: /從中文提示與逐字輸入開始/,
  });
  await expect(beginLesson).toBeFocused();

  const homeNavigation = page.getByRole("button", {
    name: "前往首頁",
    exact: true,
  });
  await homeNavigation.focus();
  await homeNavigation.press("Enter");
  await expect(page.getByRole("heading", {
    name: "把英文從「看得懂」練成「寫得出來」",
  })).toBeVisible();
  await expect(page.getByRole("button", { name: /開始這一課/ })).toBeFocused();
});

test("keyboard choices select only on Enter and focus the next action", async ({ page }) => {
  await seedProgress(page, { completedLessonIds: ["a1-u1-l1"] });
  await waitForHome(page);
  await page.getByRole("button", { name: /開始這一課/ }).press("Enter");
  await expect(page.getByRole("heading", { name: "我的名字", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }).press("Enter");

  for (const answer of ["My", "name", "is", "Ben"]) {
    const input = page.locator("#recall-answer-0");
    await expect(input).toBeFocused();
    await input.fill(answer);
    await input.press("Enter");
    await expect(page.getByText("回答正確", { exact: true })).toBeVisible();
    await page.locator("#detail-next-button").press("Enter");
  }

  const rebuildFields = page.locator(".rebuild-field input");
  await expect(rebuildFields.first()).toBeFocused();
  for (const [index, word] of ["My", "name", "is", "Ben"].entries()) {
    await rebuildFields.nth(index).fill(word);
  }
  await page.getByRole("button", { name: /檢查順序與拼字/ }).press("Enter");
  await expect(page.locator("#recognition-option-correct")).toBeFocused();
  await expect(page.locator("#recognition-option-correct")).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator("#recognition-option-amy-name")).toBeFocused();
  await expect(page.locator("#recognition-option-amy-name")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#recognition-option-correct")).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator("#recognition-option-correct")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.locator("#recognition-check-button")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#recognition-next-button")).toBeFocused();
  await page.keyboard.press("Enter");

  const transfer = page.locator("#pattern-transfer-answer");
  await expect(transfer).toBeFocused();
  await transfer.fill("My name is Amy.");
  await transfer.press("Enter");
  await page.locator("#pattern-transfer-next-button").press("Enter");

  await expect(page.locator("#text-response-option-correct")).toBeFocused();
  await expect(page.locator("#text-response-option-correct")).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await expect(page.locator("#text-response-option-correct")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.locator("#text-response-check-button")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#text-response-next-button")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "做得好！你已完成本課文字練習" })).toBeVisible();
});

test("passage comprehension keeps the first option keyboard reachable between questions", async ({
  page,
}) => {
  const completedLessonIds = Array.from({ length: 8 }, (_, unitIndex) =>
    Array.from(
      { length: 4 },
      (_, lessonIndex) => `a1-u${unitIndex + 1}-l${lessonIndex + 1}`,
    ),
  ).flat().filter((lessonId) => lessonId !== "a1-u8-l4");
  await seedProgress(page, {
    completedLessonIds,
    passedUnitIds: [
      "a1-u1",
      "a1-u2",
      "a1-u3",
      "a1-u4",
      "a1-u5",
      "a1-u6",
      "a1-u7",
    ],
  });
  await waitForHome(page);
  await page.getByRole("button", { name: /開始這一課/ }).press("Enter");
  await expect(page.getByRole("heading", { name: "搭公車上班", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /從中文提示與逐字輸入開始/ }).press("Enter");

  for (const answer of ["I", "go", "to", "work", "by", "bus"]) {
    const input = page.locator("#recall-answer-0");
    await input.fill(answer);
    await input.press("Enter");
    await expect(page.getByText("回答正確", { exact: true })).toBeVisible();
    await page.locator("#detail-next-button").press("Enter");
  }

  const rebuildWords = ["I", "go", "to", "work", "by", "bus"];
  const rebuildFields = page.locator(".rebuild-field input");
  await expect(rebuildFields).toHaveCount(rebuildWords.length);
  for (const [index, word] of rebuildWords.entries()) {
    await rebuildFields.nth(index).fill(word);
  }
  await page.getByRole("button", { name: /檢查順序與拼字/ }).press("Enter");

  const passageSentences = [
    "I get up at seven.",
    "I eat breakfast at home.",
    "I go to work at eight.",
    "I go to work by bus.",
  ];
  for (const [index, sentence] of passageSentences.entries()) {
    await page.locator(`#passage-sentence-${index}`).fill(sentence);
  }
  await page.getByRole("button", { name: "檢查整段文章", exact: true }).press("Enter");
  await expect(page.locator("#passage-answer-0")).toBeFocused();

  for (const [questionIndex, answer] of [
    "At seven.",
    "At home.",
    "By bus.",
  ].entries()) {
    const firstOption = page.locator("#passage-answer-0");
    await expect(firstOption).toBeFocused();
    await expect(firstOption).toHaveAttribute("aria-pressed", "false");
    const answerOption = page
      .locator(".exercise-choice")
      .filter({ hasText: answer });
    await answerOption.focus();
    await answerOption.press("Enter");
    await expect(answerOption).toHaveAttribute("aria-pressed", "true");
    const optionCount = await page.locator(".exercise-choice").count();
    for (let tab = 0; tab < optionCount; tab += 1) {
      await page.keyboard.press("Tab");
    }
    await expect(page.locator("#passage-question-check-button")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#passage-question-next-button")).toBeFocused();
    if (questionIndex < 2) {
      await page.keyboard.press("Enter");
    }
  }
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "做得好！你已完成本課文字練習" })).toBeVisible();
});
