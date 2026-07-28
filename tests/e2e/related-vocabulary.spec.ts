import { expect, Page, test } from "@playwright/test";

const progressKey = "yingju-progress-v1";

type ProgressFixture = {
  schemaVersion: 3;
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

const progressFixture = (): ProgressFixture => ({
  schemaVersion: 3,
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

const expectNoHorizontalOverflow = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          window.innerWidth,
      ),
    )
    .toBe(true);
};

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
  });
  await relatedNav.focus();
  await relatedNav.press(" ");
  await expect(
    page.getByRole("heading", { name: "相關字詞" }),
  ).toBeVisible();
  await expect(relatedNav).toHaveClass(/active/);

  await page
    .getByRole("button", { name: "前往首頁" })
    .click();
  await relatedNav.focus();
  await relatedNav.press("Enter");
  await expect(
    page.getByRole("heading", { name: "相關字詞" }),
  ).toBeVisible();
};

test("uses the main navigation and presents searchable related vocabulary without overflow", async ({
  page,
}, testInfo) => {
  const progress = progressFixture();
  progress.lexemeProgress.monday = {
    attempts: 1,
    correctAnswers: 1,
    completedLessonIds: ["a1-u6-l2"],
    lastLessonId: "a1-u6-l2",
    lastSeenAt: "2026-07-01T00:00:00.000Z",
  };
  progress.reviewItems["a1-u5-l4-t05"] = {
    tokenId: "a1-u5-l4-t05",
    answer: "night",
    prompt: "晚上",
    familiarity: "不熟",
    dueAt: "2026-07-01T00:00:00.000Z",
    intervalDays: 1,
    successfulDays: 0,
  };
  await page.addInitScript(
    ({ key, value }) =>
      localStorage.setItem(key, JSON.stringify(value)),
    { key: progressKey, value: progress },
  );
  await waitForHome(page);
  await openRelatedVocabulary(page);

  const groupGrid = page.locator(
    '[data-testid="vocabulary-group-grid"]',
  );
  await expect(groupGrid.locator("button")).toHaveCount(4);
  const columns = await groupGrid.evaluate(
    (element) =>
      getComputedStyle(element).gridTemplateColumns
        .split(" ")
        .filter(Boolean).length,
  );
  expect(columns).toBe(
    testInfo.project.name === "mobile-chrome" ? 1 : 2,
  );

  await page
    .locator('[data-testid="vocabulary-group-days-of-week"]')
    .click();
  const dayItems = page.locator(
    '[data-testid="vocabulary-word-list"] > article',
  );
  await expect(dayItems).toHaveCount(7);
  await expect(
    page.locator('[data-testid="vocabulary-word-monday"]'),
  ).toContainText("已學");
  await expect(
    page.locator('[data-testid="vocabulary-word-saturday"]'),
  ).toContainText("尚未正式學習");

  const search = page.getByRole("searchbox", {
    name: "搜尋英文、中文、主題名稱或 lexeme ID",
  });
  await search.fill("  SaTurDay  ");
  await expect(dayItems).toHaveCount(1);
  await expect(dayItems.first()).toContainText("Saturday");
  await expect(dayItems.first()).toContainText("星期六");
  const saturdayBox = await dayItems.first().boundingBox();
  const viewport = page.viewportSize();
  if (!saturdayBox || !viewport) {
    throw new Error("無法取得 Saturday 卡片或測試視窗尺寸。");
  }
  expect(saturdayBox.x + saturdayBox.width).toBeLessThanOrEqual(
    viewport.width,
  );
  await dayItems
    .first()
    .getByRole("button", { name: /正常播放 Saturday/ })
    .click();

  await search.fill("");
  await page
    .locator('[data-testid="vocabulary-group-times-of-day"]')
    .click();
  await expect(
    page.locator('[data-testid="vocabulary-word-night"]'),
  ).toContainText("待複習");
  await expect(
    page.locator('[data-testid="vocabulary-word-night"]'),
  ).toContainText("at night");
  await expectNoHorizontalOverflow(page);
});

test("shows the month and family topics with formal and reference sources", async ({
  page,
}) => {
  await waitForHome(page);
  await openRelatedVocabulary(page);

  await expect(
    page.locator('[data-testid="vocabulary-topic-days-of-week"]'),
  ).toBeVisible();
  const search = page.getByRole("searchbox", {
    name: "搜尋英文、中文、主題名稱或 lexeme ID",
  });
  await search.fill("December");
  await expect(
    page.locator('[data-testid="vocabulary-topic-months-of-year"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="vocabulary-word-december"]'),
  ).toContainText("December");

  await search.fill("十二月");
  await expect(
    page.locator('[data-testid="vocabulary-topic-months-of-year"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="vocabulary-word-december"]'),
  ).toContainText("December");

  await search.fill("先生");
  await expect(
    page.locator('[data-testid="vocabulary-topic-family-members"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="vocabulary-word-husband"]'),
  ).toContainText("husband");

  await search.fill("not-a-real-vocabulary-item");
  await expect(
    page.locator('[data-testid="vocabulary-global-empty"]'),
  ).toContainText("找不到相關字詞");
  await expect(
    page.locator(".vocabulary-topic-detail"),
  ).toHaveCount(0);

  await search.fill("");
  await expect(
    page.locator('[data-testid="vocabulary-topic-family-members"]'),
  ).toBeVisible();

  await page
    .locator('[data-testid="vocabulary-group-months-of-year"]')
    .click();
  const monthItems = page.locator(
    '[data-testid="vocabulary-word-list"] > article',
  );
  await expect(monthItems).toHaveCount(12);
  await expect(
    page.locator('[data-testid="vocabulary-word-january"]'),
  ).toContainText("in January");
  await expect(
    page.locator('[data-testid="vocabulary-word-january"]'),
  ).toContainText("參考詞彙");
  await expect(
    page.locator('[data-testid="vocabulary-word-may"]'),
  ).toContainText("正式課程");

  await search.fill("十二月");
  await expect(monthItems).toHaveCount(1);
  await expect(monthItems.first()).toContainText("December");
  await search.fill("");

  await page
    .locator('[data-testid="vocabulary-group-family-members"]')
    .click();
  const familyItems = page.locator(
    '[data-testid="vocabulary-word-list"] > article',
  );
  await expect(familyItems).toHaveCount(10);
  await expect(
    page.locator('[data-testid="vocabulary-word-mother"]'),
  ).toContainText("正式課程");
  await expect(
    page.locator('[data-testid="vocabulary-word-father"]'),
  ).toContainText("參考詞彙");
  await expect(
    page.locator('[data-testid="vocabulary-word-brother"]'),
  ).toContainText("my brother");
  await expect(
    page
      .locator('[data-testid="vocabulary-word-brother"]')
      .getByRole("heading", {
        name: "brother",
        exact: true,
      }),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="vocabulary-word-brother"]'),
  ).not.toContainText("brothers");
  await expect(
    page.locator('[data-testid="vocabulary-word-brother"]'),
  ).toContainText("哥哥／弟弟／兄弟");

  await search.fill("先生");
  await expect(familyItems).toHaveCount(1);
  await expect(familyItems.first()).toContainText("husband");
  await familyItems
    .first()
    .getByRole("button", { name: /正常播放 husband/ })
    .click();
  await expectNoHorizontalOverflow(page);
});

test("opens a related group after a correct course word and returns to the same detail stage", async ({
  page,
}) => {
  const completedLessonIds = Array.from(
    { length: 5 },
    (_, unitIndex) =>
      Array.from(
        { length: 4 },
        (_unused, lessonIndex) =>
          `a1-u${unitIndex + 1}-l${lessonIndex + 1}`,
      ),
  ).flat();
  completedLessonIds.push("a1-u6-l1");
  const progress = progressFixture();
  progress.completedLessonIds = completedLessonIds;
  progress.passedUnitIds = [
    "a1-u1",
    "a1-u2",
    "a1-u3",
    "a1-u4",
    "a1-u5",
  ];
  await page.addInitScript(
    ({ key, value }) =>
      localStorage.setItem(key, JSON.stringify(value)),
    { key: progressKey, value: progress },
  );
  await waitForHome(page);
  await page
    .getByRole("button", { name: "查看完整路線 →" })
    .click();
  await page
    .getByRole("button", { name: /今天星期一/ })
    .click();
  await page
    .getByRole("button", {
      name: /從中文提示與逐字輸入開始/,
    })
    .click();

  for (const answer of ["Today", "is", "Monday"]) {
    const input = page.locator("#recall-answer-0");
    await input.fill(answer);
    await input.press("Enter");
    await expect(
      page.getByText("回答正確", { exact: true }),
    ).toBeVisible();
    if (answer !== "Monday") {
      await page.locator("#detail-next-button").click();
    }
  }

  await expect(
    page.locator(
      '[data-testid="open-related-vocabulary-from-detail"]',
    ),
  ).toBeVisible();
  const progressBefore = await page.evaluate((key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }, progressKey);
  await page
    .locator(
      '[data-testid="open-related-vocabulary-from-detail"]',
    )
    .click();

  const monday = page.locator(
    '[data-testid="vocabulary-word-monday"]',
  );
  await expect(monday).toHaveAttribute("aria-current", "true");
  await expect(monday).toContainText("本課單字");
  await expect(
    page.getByRole("button", { name: "← 返回目前課程" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page
    .getByRole("button", { name: "← 返回目前課程" })
    .click();
  await expect(
    page.getByText("回答正確", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Monday" }),
  ).toBeVisible();
  await expect(page.locator("#detail-next-button")).toBeFocused();

  const progressAfter = await page.evaluate((key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }, progressKey);
  assertProgressEqual(progressAfter, progressBefore);
});

test("keeps A1 usable when related-vocabulary data fails", async ({
  page,
}) => {
  await page.route(
    "**/data/vocabulary-groups-v1.json",
    (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: "{}",
      }),
  );
  await waitForHome(page);
  await page
    .getByRole("button", { name: "前往相關字詞" })
    .click();
  await expect(
    page.locator('[data-testid="vocabulary-load-error"]'),
  ).toContainText("相關字詞目前無法載入");
  await page.getByRole("button", { name: "返回首頁" }).click();
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
});

const assertProgressEqual = (
  actual: unknown,
  expected: unknown,
) => {
  expect(actual).toEqual(expected);
};
