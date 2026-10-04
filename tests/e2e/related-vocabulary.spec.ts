import { expect, Locator, Page, test } from "@playwright/test";
import fs from "node:fs";

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

const expectReadableText = async (locator: Locator, minimumSamples = 1) => {
  const samples = await locator.evaluateAll((elements) => elements.map((element) => {
    const rgb = (color: string) => (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (color: string) => rgb(color)
      .map((value) => value / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    let background: Element | null = element;
    while (background && getComputedStyle(background).backgroundColor === "rgba(0, 0, 0, 0)") {
      background = background.parentElement;
    }
    const foregroundLight = luminance(getComputedStyle(element).color);
    const backgroundLight = luminance(background ? getComputedStyle(background).backgroundColor : "rgb(255, 255, 255)");
    return {
      text: element.textContent,
      ratio: (Math.max(foregroundLight, backgroundLight) + 0.05) / (Math.min(foregroundLight, backgroundLight) + 0.05),
    };
  }));
  expect(samples.length).toBeGreaterThanOrEqual(minimumSamples);
  for (const sample of samples) {
    expect(sample.ratio, sample.text ?? "related vocabulary contrast").toBeGreaterThanOrEqual(4.5);
  }
};

const waitForHome = async (page: Page) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
};

const openSettings = async (page: Page) => {
  const settingsButton = page.getByRole("button", {
    name: "設定",
    exact: true,
  });
  const settingsHeading = page.getByRole("heading", { name: "設定" });
  await expect(async () => {
    await settingsButton.click();
    await expect(settingsHeading).toBeVisible();
  }).toPass();
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
  const progressBeforeReferenceOpen = await page.evaluate((key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }, progressKey);
  await dayItems
    .first()
    .getByTestId("open-vocabulary-saturday")
    .click();
  await expect(
    dayItems.first().getByTestId("vocabulary-detail-saturday"),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        const item = value.vocabularyProgress?.saturday;
        return {
          exposure: item?.exposureEvidenceIds?.length ?? 0,
          recognition: item?.recognitionCorrectEvidenceIds?.length ?? 0,
          spelling: item?.spellingCorrectEvidenceIds?.length ?? 0,
          application: item?.applicationCorrectEvidenceIds?.length ?? 0,
          completedLessonIds:
            value.levelProgress?.A1?.completedLessonIds ??
            value.completedLessonIds ??
            [],
          correctAnswers:
            value.levelProgress?.A1?.correctAnswers ??
            value.correctAnswers ??
            0,
        };
      }, progressKey),
    )
    .toEqual({
      exposure: 1,
      recognition: 0,
      spelling: 0,
      application: 0,
      completedLessonIds:
        progressBeforeReferenceOpen?.completedLessonIds ?? [],
      correctAnswers: progressBeforeReferenceOpen?.correctAnswers ?? 0,
    });
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
  await page.getByTestId("open-vocabulary-night").click();
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
  await page.getByTestId("open-vocabulary-january").click();
  await expect(
    page.locator('[data-testid="vocabulary-word-january"]'),
  ).toContainText("in January");
  await expect(
    page.locator('[data-testid="vocabulary-word-january"]'),
  ).toContainText("參考詞彙");
  await page.getByTestId("open-vocabulary-may").click();
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
  await page.getByTestId("open-vocabulary-mother").click();
  await expect(
    page.locator('[data-testid="vocabulary-word-mother"]'),
  ).toContainText("正式課程");
  await page.getByTestId("open-vocabulary-father").click();
  await expect(
    page.locator('[data-testid="vocabulary-word-father"]'),
  ).toContainText("參考詞彙");
  await page.getByTestId("open-vocabulary-brother").click();
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
    .getByTestId("open-vocabulary-husband")
    .click();
  await familyItems
    .first()
    .getByRole("button", { name: /正常播放 husband/ })
    .click();
  await expectNoHorizontalOverflow(page);
});

test("opens a related group after a correct course word and returns to the same detail stage", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({
    reducedMotion: testInfo.project.name === "mobile-chrome" ? "reduce" : "no-preference",
  });
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
  await openRelatedVocabulary(page);
  await page.getByRole("searchbox").fill("December");
  await expect(page.getByTestId("vocabulary-word-december")).toBeVisible();
  await page.getByRole("group", { name: "已學狀態篩選" })
    .getByRole("button", { name: "已學", exact: true }).click();
  await page.getByRole("button", { name: "前往首頁" }).click();
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
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        const item = value.vocabularyProgress?.monday;
        return {
          exposure: item?.exposureEvidenceIds?.length ?? 0,
          spelling: item?.spellingCorrectEvidenceIds?.length ?? 0,
        };
      }, progressKey),
    )
    .toEqual({ exposure: 1, spelling: 1 });
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
  await expect(monday).toBeFocused();
  await expectReadableText(monday.locator(".vocabulary-status.current"));
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await expect(page.getByRole("group", { name: "已學狀態篩選" })
    .getByRole("button", { name: "全部", exact: true })).toHaveAttribute("aria-pressed", "true");
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

test("persists global vocabulary evidence and includes it in backup import and export", async ({
  page,
}) => {
  await waitForHome(page);
  await openRelatedVocabulary(page);
  await page
    .locator('[data-testid="vocabulary-group-days-of-week"]')
    .click();
  await page.getByTestId("open-vocabulary-saturday").click();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return value.vocabularyProgress?.saturday?.exposureEvidenceIds?.length;
      }, progressKey),
    )
    .toBe(1);

  await page.reload();
  await expect(page.getByText("本機進度已儲存")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return {
          schemaVersion: value.schemaVersion,
          exposure:
            value.vocabularyProgress?.saturday?.exposureEvidenceIds?.length,
        };
      }, progressKey),
    )
    .toEqual({ schemaVersion: 6, exposure: 1 });

  await page
    .getByRole("button", { name: "前往學習進度", exact: true })
    .click();
  await expect(page.getByTestId("global-vocabulary-progress")).toBeVisible();
  await expect(page.getByText("A1＋A2總目標")).toBeVisible();
  await expect(page.getByText("3000詞彙清單仍在分批建置")).toBeVisible();

  await openSettings(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出進度備份" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) {
    throw new Error("無法取得進度備份下載路徑。");
  }
  const backup = JSON.parse(fs.readFileSync(downloadPath, "utf8"));
  expect(backup.schemaVersion).toBe(6);
  expect(
    backup.progress.vocabularyProgress.saturday.exposureEvidenceIds,
  ).toHaveLength(1);

  await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    value.vocabularyProgress = {};
    localStorage.setItem(key, JSON.stringify(value));
  }, progressKey);
  await page.reload();
  await expect(page.getByText("本機進度已儲存")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return Object.keys(value.vocabularyProgress ?? {}).length;
      }, progressKey),
    )
    .toBe(0);

  await openSettings(page);
  await page
    .locator('label:has-text("匯入進度備份") input[type="file"]')
    .setInputFiles({
      name: "vocabulary-progress-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup), "utf8"),
    });
  await expect(page.getByText("完整學習進度已還原。")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return value.vocabularyProgress?.saturday?.exposureEvidenceIds?.length;
      }, progressKey),
    )
    .toBe(1);
  await expectNoHorizontalOverflow(page);
});

test("announces vocabulary results and exposes keyboard disclosure semantics", async ({ page }) => {
  await waitForHome(page);
  await openRelatedVocabulary(page);
  await expect(page.getByRole("button", { name: "前往相關字詞" })).toHaveAttribute("aria-current", "page");
  const search = page.getByRole("searchbox");
  const summary = page.getByTestId("vocabulary-search-summary");
  await expect(summary).toHaveAttribute("role", "status");
  await search.fill("brothers");
  await expect(search).toBeFocused();
  await search.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(search).toBeFocused();
  await expect(search).toHaveCSS("outline-style", "solid");
  await expect(search).toHaveCSS("outline-width", "3px");
  await expect(search).toHaveCSS("outline-color", "rgb(177, 68, 46)");
  await expect(summary).toContainText("1 個符合的字詞");
  await expect(summary).toContainText("家庭成員");
  await expect(page.getByTestId("vocabulary-group-family-members")).toHaveAttribute("aria-pressed", "true");
  const toggle = page.getByTestId("open-vocabulary-brother");
  await expect(toggle).toHaveAccessibleName("開啟字詞詳情：brother");
  const details = page.getByTestId("vocabulary-detail-brother");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAttribute("aria-controls", await details.getAttribute("id") ?? "missing-id");
  await expect(details).toBeHidden();
  await toggle.focus();
  await expect(toggle).toHaveCSS("outline-style", "solid");
  await expect(toggle).toHaveCSS("outline-width", "3px");
  await toggle.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(details).toBeVisible();
  await expectReadableText(page.locator([
    ".vocabulary-filter-row button.active",
    ".vocabulary-status",
    "#vocabulary-detail-brother .vocabulary-phonetics small",
  ].join(", ")), 5);
  const collapse = page.getByRole("button", { name: "收合字詞詳情：brother", exact: true });
  await expect(collapse).toBeFocused();
  await collapse.press(" ");
  await expect(details).toBeHidden();
  await expect(page.getByRole("button", { name: "開啟字詞詳情：brother", exact: true })).toBeFocused();
  await search.fill("nonexistent-meaning-xyz");
  await expect(summary).toContainText("找不到相關字詞");
  await expect(search).toBeFocused();
  await expectNoHorizontalOverflow(page);
});

test("searches occurrence and chunk aliases without changing canonical cards or progress", async ({ page }) => {
  await waitForHome(page);
  await openRelatedVocabulary(page);
  const search = page.getByRole("searchbox", {
    name: "搜尋英文、中文、主題名稱或 lexeme ID",
  });
  // A2 aliases arrive asynchronously; finding this chunk confirms the ready projection.
  await search.fill("last night");
  await expect(page.getByTestId("vocabulary-word-night")).toBeVisible();
  await expect.poll(() => page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored).schemaVersion : null;
  }, progressKey)).toBe(6);
  const progressBefore = await page.evaluate((key) => localStorage.getItem(key), progressKey);

  for (const query of ["brothers", "my brother", "我的哥哥", "我的弟弟", "  MY   BROTHER  "]) {
    await search.fill(query);
    const brother = page.getByTestId("vocabulary-word-brother");
    await expect(brother.getByRole("heading", { name: "brother", exact: true })).toBeVisible();
    await expect(brother).not.toContainText("brothers");
    await expect(page.getByTestId("vocabulary-topic-family-members")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
  for (const query of ["last night", "昨晚"]) {
    await search.fill(query);
    await expect(page.getByTestId("vocabulary-word-night").getByRole("heading", {
      name: "night", exact: true,
    })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
  await search.fill("no-such-alias-xyz");
  await expect(page.getByTestId("vocabulary-global-empty")).toContainText("找不到相關字詞");
  await expect(page.locator(".vocabulary-topic-detail")).toHaveCount(0);
  await search.fill("");
  await expect(page.getByTestId("vocabulary-topic-times-of-day")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), progressKey)).toBe(progressBefore);
  await expectNoHorizontalOverflow(page);
});

test("keeps A1 occurrence and configured chunk aliases available when A2 fails", async ({ page }) => {
  await page.route("**/data/a2-course-v1.csv", (route) => route.fulfill({
    status: 503,
    contentType: "text/plain",
    body: "simulated A2 source outage",
  }));
  await waitForHome(page);
  await openRelatedVocabulary(page);
  const search = page.getByRole("searchbox", {
    name: "搜尋英文、中文、主題名稱或 lexeme ID",
  });
  for (const query of ["brothers", "my brother", "我的哥哥"]) {
    await search.fill(query);
    await expect(page.getByTestId("vocabulary-word-brother")).toBeVisible();
  }
  await search.fill("last night");
  await expect(page.getByTestId("vocabulary-global-empty")).toBeVisible();
  await page.getByRole("button", { name: "前往首頁" }).click();
  await expect(page.getByRole("heading", {
    name: "把英文從「看得懂」練成「寫得出來」",
  })).toBeVisible();
  await expectNoHorizontalOverflow(page);
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
