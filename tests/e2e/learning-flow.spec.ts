import { expect, Page, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const progressKey = "yingju-progress-v1";
const settingsKey = "yingju-settings-v1";
const lessonsThroughUnit = (lastUnit: number) =>
  Array.from({ length: lastUnit }, (_, unitIndex) =>
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
  sentenceStats: {},
  patternStats: {},
  passageStats: {},
  tokenHintLevels: {},
  chunkHintLevels: {},
  patternHintLevels: {},
  reviewExerciseTypes: {},
});

const seedProgress = async (
  page: Page,
  completedLessonIds: string[] = [],
  passedUnitIds: string[] = [],
) => {
  const progress = progressFixture(
    completedLessonIds,
    passedUnitIds,
  );
  await page.addInitScript(
    ({ key, value }) =>
      localStorage.setItem(key, JSON.stringify(value)),
    { key: progressKey, value: progress },
  );
};

const levelProgressFixture = (
  completedLessonIds: string[] = [],
  passedUnitIds: string[] = [],
) => {
  const { schemaVersion, ...progress } = progressFixture(
    completedLessonIds,
    passedUnitIds,
  );
  if (schemaVersion !== 3) {
    throw new Error("測試用舊進度必須是 schema v3。");
  }
  return progress;
};

const multiLevelProgressFixture = (
  a1Completed: string[] = [],
  a2Completed: string[] = [],
  selectedLevel: "A1" | "A2" = "A2",
  a2PassedUnitIds: string[] = [],
  passedLevelIds: string[] = [],
) => ({
  schemaVersion: 4,
  selectedLevel,
  passedLevelIds,
  levelProgress: {
    A1: levelProgressFixture(a1Completed),
    A2: levelProgressFixture(a2Completed, a2PassedUnitIds),
  },
});

const seedA2Pilot = async (
  page: Page,
  a2Completed: string[] = [],
  a1Completed: string[] = [],
  selectedLevel: "A1" | "A2" = "A2",
  a2PassedUnitIds: string[] = [],
  passedLevelIds: string[] = [],
) => {
  await page.goto("/");
  await page.evaluate(
    ({ progressStorageKey, settingsStorageKey, progress }) => {
      localStorage.setItem(
        progressStorageKey,
        JSON.stringify(progress),
      );
      localStorage.setItem(
        settingsStorageKey,
        JSON.stringify({
          phonetic: "KK",
          autoplay: false,
          slowRate: 0.85,
          showA2Pilot: true,
        }),
      );
    },
    {
      progressStorageKey: progressKey,
      settingsStorageKey: settingsKey,
      progress: multiLevelProgressFixture(
        a1Completed,
        a2Completed,
        selectedLevel,
        a2PassedUnitIds,
        passedLevelIds,
      ),
    },
  );
};

const openA2Lesson = async (
  page: Page,
  title: string,
) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "查看完整路線 →" })
    .click();
  const a2Heading = page.getByRole("heading", {
    name: "A2 課程地圖",
  });
  if (!(await a2Heading.isVisible())) {
    await page.locator('[data-testid="level-selector-a2"]').click();
  }
  await expect(a2Heading).toBeVisible();
  await page
    .getByRole("button", { name: new RegExp(title) })
    .click();
  await page
    .getByRole("button", { name: /從中文提示與逐字輸入開始/ })
    .click();
  await expect(page.locator("#recall-answer-0")).toBeFocused();
};

const openRecommendedLesson = async (
  page: Page,
  expectedTitle?: string,
) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /開始這一課/ }).click();
  if (expectedTitle) {
    await expect(
      page.getByRole("heading", { name: expectedTitle }),
    ).toBeVisible();
  }
  await page
    .getByRole("button", { name: /從中文提示與逐字輸入開始/ })
    .click();
  await expect(page.locator("#recall-answer-0")).toBeFocused();
};

const answerRecallTokens = async (
  page: Page,
  answers: string[],
) => {
  for (const answer of answers) {
    const input = page.locator("#recall-answer-0");
    await input.fill(answer);
    await input.press("Enter");
    await expect(
      page.getByText("回答正確", { exact: true }),
    ).toBeVisible();
    await page.locator("#detail-next-button").click();
  }
};

const submitRebuild = async (page: Page, words: string[]) => {
  const fields = page.locator(".rebuild-field input");
  await expect(fields).toHaveCount(words.length);
  await expect(fields.first()).toBeFocused();
  for (let index = 0; index < words.length; index += 1) {
    await fields.nth(index).fill(words[index]);
  }
  await page
    .getByRole("button", { name: /檢查順序與拼字/ })
    .click();
};

const completeEnhancedStages = async (
  page: Page,
  transferAnswers: string[],
  expectResult = true,
) => {
  await page.locator("#recognition-option-correct").click();
  await page.locator("#recognition-check-button").click();
  await page.locator("#recognition-next-button").click();

  const transfer = page.locator("#pattern-transfer-answer");
  for (const answer of transferAnswers) {
    await expect(transfer).toBeFocused();
    await transfer.fill(answer);
    await transfer.press("Enter");
    await page.locator("#pattern-transfer-next-button").click();
  }

  await page.locator("#text-response-option-correct").click();
  await page.locator("#text-response-check-button").click();
  await page.locator("#text-response-next-button").click();
  if (expectResult) {
    await expect(page.locator("#lesson-result-next")).toBeVisible();
  }
};

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

const completePassage = async (
  page: Page,
  sentences: string[],
  questionCount: number,
) => {
  for (let index = 0; index < sentences.length; index += 1) {
    await page
      .locator(`#passage-sentence-${index}`)
      .fill(sentences[index]);
  }
  await page
    .getByRole("button", { name: "檢查整段文章" })
    .click();
  for (let question = 0; question < questionCount; question += 1) {
    await page.locator("#passage-answer-0").click();
    await page.locator("#passage-question-check-button").click();
    await page.locator("#passage-question-next-button").click();
  }
  await expect(page.locator("#lesson-result-next")).toBeVisible();
};

test("completes the original word and rebuild flow and persists it", async ({
  page,
}) => {
  await openRecommendedLesson(page, "我是誰");
  await answerRecallTokens(page, ["I", "am", "Amy"]);
  await submitRebuild(page, ["I", "am", "Amy"]);
  await expect(
    page.getByRole("heading", {
      name: "做得好！你已完成本課文字練習",
    }),
  ).toBeVisible();
  await expect(page.locator("#dictation-answer")).toHaveCount(0);

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(
          localStorage.getItem(key) ?? "{}",
        );
        return value.levelProgress?.A1?.completedLessonIds?.includes(
          "a1-u1-l1",
        );
      }, progressKey),
    )
    .toBe(true);
  await page.reload();
  await expect(page.getByText("1 / 32", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("completes have-possession recognition, two transfers, and text response", async ({
  page,
}) => {
  await seedProgress(
    page,
    lessonsThroughUnit(3),
    ["a1-u1", "a1-u2", "a1-u3"],
  );
  await openRecommendedLesson(page, "我有一顆蘋果");
  await answerRecallTokens(page, ["I", "have", "an", "apple"]);
  await submitRebuild(page, ["I", "have", "an", "apple"]);

  await expect(
    page.getByText("閱讀辨識・確認你理解完整句意"),
  ).toBeVisible();
  await page.locator("#recognition-option-correct").click();
  await page.locator("#recognition-check-button").click();
  await page.locator("#recognition-next-button").click();

  const transfer = page.locator("#pattern-transfer-answer");
  await expect(transfer).toBeFocused();
  await transfer.fill("I have a book.");
  await transfer.press("Enter");
  await page.locator("#pattern-transfer-next-button").click();
  await transfer.fill("I have a pen.");
  await transfer.press("Enter");
  await page.locator("#pattern-transfer-next-button").click();

  await page.locator("#text-response-option-correct").click();
  await page.locator("#text-response-check-button").click();
  await page.locator("#text-response-next-button").click();
  await expect(
    page.getByRole("heading", {
      name: "做得好！你已完成本課文字練習",
    }),
  ).toBeVisible();
  await expect(page.getByText("句型運用")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("completes the be-relationship second-batch flow", async ({
  page,
}) => {
  await seedProgress(
    page,
    [...lessonsThroughUnit(2), "a1-u3-l1"],
    ["a1-u1", "a1-u2"],
  );
  await openRecommendedLesson(page);
  await answerRecallTokens(page, ["He", "is", "my", "friend"]);
  await submitRebuild(page, ["He", "is", "my", "friend"]);
  await completeEnhancedStages(page, [
    "She is my friend.",
    "She is my wife.",
  ]);
  await expectNoHorizontalOverflow(page);
});

test("completes the action-at-time second-batch flow", async ({
  page,
}) => {
  await seedProgress(
    page,
    [
      ...lessonsThroughUnit(4),
      "a1-u5-l1",
      "a1-u5-l2",
      "a1-u5-l3",
    ],
    ["a1-u1", "a1-u2", "a1-u3", "a1-u4"],
  );
  await openRecommendedLesson(page);
  await answerRecallTokens(page, ["I", "watch", "TV", "at", "night"]);
  await submitRebuild(page, ["I", "watch", "TV", "at", "night"]);
  await completeEnhancedStages(page, [
    "I watch TV at seven.",
    "I play badminton at night.",
  ]);
  await expectNoHorizontalOverflow(page);
});

test("completes the be-location second-batch flow", async ({
  page,
}) => {
  await seedProgress(
    page,
    [...lessonsThroughUnit(6), "a1-u7-l1", "a1-u7-l2"],
    [
      "a1-u1",
      "a1-u2",
      "a1-u3",
      "a1-u4",
      "a1-u5",
      "a1-u6",
    ],
  );
  await openRecommendedLesson(page);
  await answerRecallTokens(page, [
    "The",
    "bathroom",
    "is",
    "on",
    "the",
    "left",
  ]);
  await submitRebuild(page, [
    "The",
    "bathroom",
    "is",
    "on",
    "the",
    "left",
  ]);
  await completeEnhancedStages(page, [
    "The store is on the left.",
    "The bathroom is near the station.",
  ]);
  await expectNoHorizontalOverflow(page);
});

test("requires the revealed pattern answer to be retyped before continuing", async ({
  page,
}) => {
  await seedProgress(
    page,
    lessonsThroughUnit(3),
    ["a1-u1", "a1-u2", "a1-u3"],
  );
  await openRecommendedLesson(page, "我有一顆蘋果");
  await answerRecallTokens(page, ["I", "have", "an", "apple"]);
  await submitRebuild(page, ["I", "have", "an", "apple"]);
  await page.locator("#recognition-option-correct").click();
  await page.locator("#recognition-check-button").click();
  await page.locator("#recognition-next-button").click();

  const transfer = page.locator("#pattern-transfer-answer");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await transfer.fill("I have an apple.");
    await transfer.press("Enter");
  }
  await expect(
    page.getByText(/正確答案是 I have a book/),
  ).toBeVisible();
  await expect(
    page.locator("#pattern-transfer-next-button"),
  ).toHaveCount(0);
  await transfer.fill("I have a book.");
  await transfer.press("Enter");
  await expect(
    page.locator("#pattern-transfer-next-button"),
  ).toBeVisible();
});

test("completes unit 8 passage rebuild and comprehension", async ({
  page,
}) => {
  await seedProgress(
    page,
    [...lessonsThroughUnit(7), "a1-u8-l1", "a1-u8-l2", "a1-u8-l3"],
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
  await answerRecallTokens(page, [
    "I",
    "go",
    "to",
    "work",
    "by",
    "bus",
  ]);
  await submitRebuild(page, [
    "I",
    "go",
    "to",
    "work",
    "by",
    "bus",
  ]);

  const sentences = [
    "I get up at seven.",
    "I eat breakfast at home.",
    "I go to work at eight.",
    "I go to work by bus.",
  ];
  for (let index = 0; index < sentences.length; index += 1) {
    await page.locator(`#passage-sentence-${index}`).fill(
      sentences[index],
    );
  }
  await page
    .getByRole("button", { name: "檢查整段文章" })
    .click();
  await expect(page.locator("#passage-answer-0")).toBeVisible();

  for (let question = 0; question < 3; question += 1) {
    await page.locator("#passage-answer-0").click();
    await page.locator("#passage-question-check-button").click();
    await page.locator("#passage-question-next-button").click();
  }
  await expect(
    page.getByRole("heading", {
      name: "做得好！你已完成本課文字練習",
    }),
  ).toBeVisible();
  await expect(page.getByText("短文理解")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("penalizes an extra word in the real unit assessment", async ({
  page,
}) => {
  await seedProgress(page, lessonsThroughUnit(1));
  await page.goto("/");
  await page
    .getByRole("button", { name: /開始單元測驗/ })
    .click();
  const answer = page.locator(".answer-input");
  await answer.fill("I am Amy today");
  await answer.press("Enter");
  await expect(page.getByText("本題正確率 75%")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("migrates v3 progress and keeps A2 locked until pilot QA is enabled", async ({
  page,
}) => {
  await seedProgress(page, ["a1-u1-l1"]);
  await page.goto("/");
  await expect(page.getByText("1 / 32", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(
          localStorage.getItem(key) ?? "{}",
        );
        return {
          schemaVersion: value.schemaVersion,
          completed: value.levelProgress?.A1
            ?.completedLessonIds?.length,
        };
      }, progressKey),
    )
    .toEqual({ schemaVersion: 4, completed: 1 });

  await page.getByRole("button", { name: "課程地圖" }).click();
  const a2Selector = page.locator(
    '[data-testid="level-selector-a2"]',
  );
  await expect(a2Selector).toHaveClass(/locked/);
  await a2Selector.click();
  await expect(
    page.getByText("A2 需通過 A1 程度總測驗後正式解鎖。"),
  ).toBeVisible();
  await page.getByRole("button", { name: "設定" }).click();
  await page.locator('[data-testid="a2-pilot-toggle"]').check();
  await page.getByRole("button", { name: "課程地圖" }).click();
  await a2Selector.click();
  await expect(
    page.getByRole("heading", { name: "A2 課程地圖" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(
          localStorage.getItem(key) ?? "{}",
        );
        return value.passedLevelIds;
      }, progressKey),
    )
    .toEqual([]);
  await expectNoHorizontalOverflow(page);
});

test("completes the first A2 lesson and preserves both levels after reload", async ({
  page,
}) => {
  await seedA2Pilot(page, [], ["a1-u1-l1"]);
  await openA2Lesson(page, "昨晚做了什麼");
  await answerRecallTokens(page, [
    "I",
    "watched",
    "TV",
    "last",
    "night",
  ]);
  await submitRebuild(page, [
    "I",
    "watched",
    "TV",
    "last",
    "night",
  ]);
  await completeEnhancedStages(page, [
    "I watched TV at home.",
    "I watched TV at night.",
  ]);

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(
          localStorage.getItem(key) ?? "{}",
        );
        return {
          a1: value.levelProgress?.A1?.completedLessonIds,
          a2: value.levelProgress?.A2?.completedLessonIds,
        };
      }, progressKey),
    )
    .toEqual({
      a1: ["a1-u1-l1"],
      a2: ["a2-u01-l01"],
    });
  await page.reload();
  await expect(page.getByText("1 / 16", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "課程地圖" }).click();
  await page.locator('[data-testid="level-selector-a1"]').click();
  await expect(
    page.getByRole("heading", { name: "A1 課程地圖" }),
  ).toBeVisible();
  await expect(page.getByText("1/32 課")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("completes the A2 passage rebuild and all three comprehension questions", async ({
  page,
}) => {
  await seedA2Pilot(page, [
    "a2-u01-l01",
    "a2-u01-l02",
    "a2-u01-l03",
  ]);
  await openA2Lesson(page, "提出邀請");
  await answerRecallTokens(page, [
    "Would",
    "you",
    "like",
    "to",
    "go",
    "with",
    "me",
  ]);
  await submitRebuild(page, [
    "Would",
    "you",
    "like",
    "to",
    "go",
    "with",
    "me",
  ]);
  await completeEnhancedStages(page, [
    "Would you like to play badminton?",
    "Would you like to go to the store?",
  ], false);

  const passageSentences = [
    "Yesterday, I went to the store.",
    "Last night, I watched TV at home.",
    "Tomorrow, I am going to play badminton.",
    "Would you like to go with me?",
  ];
  for (let index = 0; index < passageSentences.length; index += 1) {
    await page
      .locator(`#passage-sentence-${index}`)
      .fill(passageSentences[index]);
  }
  await page
    .getByRole("button", { name: "檢查整段文章" })
    .click();
  for (let question = 0; question < 3; question += 1) {
    await page.locator("#passage-answer-0").click();
    await page.locator("#passage-question-check-button").click();
    await page.locator("#passage-question-next-button").click();
  }
  await expect(
    page.getByRole("heading", {
      name: "做得好！你已完成本課文字練習",
    }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(
          localStorage.getItem(key) ?? "{}",
        );
        return value.levelProgress?.A2?.completedLessonIds?.includes(
          "a2-u01-l04",
        );
      }, progressKey),
    )
    .toBe(true);
  await expectNoHorizontalOverflow(page);
});

test("keeps formal A2 units sequential while QA preview exposes all pilot units", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    ({ key, settings, progress }) => {
      localStorage.setItem(key, JSON.stringify(progress));
      localStorage.setItem("yingju-settings-v1", JSON.stringify(settings));
    },
    {
      key: progressKey,
      settings: {
        phonetic: "KK",
        autoplay: false,
        slowRate: 0.85,
        showA2Pilot: false,
      },
      progress: multiLevelProgressFixture(
        [],
        [],
        "A2",
        [],
        ["A1"],
      ),
    },
  );
  await page.reload();
  await page.getByRole("button", { name: "課程地圖" }).click();
  const travelLesson = page.getByRole("button", {
    name: /怎麼去車站/,
  });
  const shoppingLesson = page.getByRole("button", {
    name: /詢問價格/,
  });
  const healthLesson = page.getByRole("button", {
    name: /我頭痛/,
  });
  await expect(travelLesson).toBeDisabled();
  await expect(shoppingLesson).toBeDisabled();
  await expect(healthLesson).toBeDisabled();

  await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    value.levelProgress.A2.completedLessonIds = [
      "a2-u01-l01",
      "a2-u01-l02",
      "a2-u01-l03",
      "a2-u01-l04",
    ];
    value.levelProgress.A2.passedUnitIds = ["a2-u01"];
    localStorage.setItem(key, JSON.stringify(value));
  }, progressKey);
  await page.reload();
  await page.getByRole("button", { name: "課程地圖" }).click();
  await expect(travelLesson).toBeEnabled();
  await expect(shoppingLesson).toBeDisabled();

  await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    value.levelProgress.A2.completedLessonIds.push(
      "a2-u02-l01",
      "a2-u02-l02",
      "a2-u02-l03",
      "a2-u02-l04",
    );
    value.levelProgress.A2.passedUnitIds.push("a2-u02");
    localStorage.setItem(key, JSON.stringify(value));
  }, progressKey);
  await page.reload();
  await page.getByRole("button", { name: "課程地圖" }).click();
  await expect(shoppingLesson).toBeEnabled();
  await expect(healthLesson).toBeDisabled();

  await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    value.levelProgress.A2.completedLessonIds.push(
      "a2-u03-l01",
      "a2-u03-l02",
      "a2-u03-l03",
      "a2-u03-l04",
    );
    value.levelProgress.A2.passedUnitIds.push("a2-u03");
    localStorage.setItem(key, JSON.stringify(value));
  }, progressKey);
  await page.reload();
  await page.getByRole("button", { name: "課程地圖" }).click();
  await expect(healthLesson).toBeEnabled();

  await page.evaluate((key) => {
    const value = JSON.parse(localStorage.getItem(key) ?? "{}");
    value.levelProgress.A2.passedUnitIds = ["a2-u01"];
    localStorage.setItem(key, JSON.stringify(value));
  }, progressKey);
  await page.reload();
  await page.getByRole("button", { name: "課程地圖" }).click();
  await expect(healthLesson).toBeDisabled();

  await page.getByRole("button", { name: "設定" }).click();
  await page.locator('[data-testid="a2-pilot-toggle"]').check();
  await page.getByRole("button", { name: "課程地圖" }).click();
  await expect(
    healthLesson,
  ).toBeEnabled();
  await expectNoHorizontalOverflow(page);
});

test("completes all 12 new A2 lessons and three new passages", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await seedA2Pilot(page);
  const lessons = [
    {
      title: "怎麼去車站",
      recall: ["How", "can", "I", "get", "to", "the", "station"],
      transfers: [
        "How can I get to the store?",
        "How can I get to school?",
      ],
    },
    {
      title: "搭公車",
      recall: ["You", "can", "take", "the", "bus"],
      transfers: ["I can take the bus.", "She can take the bus."],
    },
    {
      title: "買火車票",
      recall: ["I", "bought", "a", "train", "ticket", "yesterday"],
      transfers: [
        "I bought a train ticket at seven.",
        "I bought a train ticket at eight.",
      ],
    },
    {
      title: "火車出發時間",
      recall: ["The", "train", "leaves", "at", "nine", "tomorrow", "morning"],
      transfers: [
        "The train leaves at seven tomorrow morning.",
        "The train leaves at eight tomorrow morning.",
      ],
      passage: [
        "I am going to the station tomorrow.",
        "I can take the bus.",
        "I bought a train ticket yesterday.",
        "The train leaves at nine tomorrow morning.",
      ],
      questions: 5,
    },
    {
      title: "詢問價格",
      recall: ["How", "much", "is", "this", "shirt"],
      transfers: [
        "How much is this book?",
        "How much is this apple?",
      ],
    },
    {
      title: "比較價格",
      recall: ["This", "shirt", "is", "cheaper", "than", "that", "one"],
      transfers: [
        "This book is cheaper than that one.",
        "This apple is cheaper than that one.",
      ],
    },
    {
      title: "詢問尺寸",
      recall: ["Do", "you", "have", "a", "larger", "size"],
      transfers: [
        "Do you have this shirt?",
        "Do you have that one?",
      ],
    },
    {
      title: "太貴了",
      recall: ["It", "is", "too", "expensive", "for", "me"],
      transfers: [
        "This shirt is too expensive for me.",
        "That one is too expensive for me.",
      ],
      passage: [
        "I want this shirt.",
        "This shirt is cheaper than that one.",
        "I want a larger size.",
        "It is too expensive for me.",
      ],
      questions: 4,
    },
    {
      title: "我頭痛",
      recall: ["I", "have", "a", "headache"],
      transfers: [
        "I have a headache today.",
        "I have a headache at night.",
      ],
    },
    {
      title: "多喝水",
      recall: ["You", "should", "drink", "more", "water"],
      transfers: [
        "You should drink water at home.",
        "You should drink more water at night.",
      ],
    },
    {
      title: "去看醫生",
      recall: ["I", "have", "to", "see", "a", "doctor", "tomorrow"],
      transfers: [
        "I have to see a doctor today.",
        "I have to see a doctor at eight.",
      ],
    },
    {
      title: "晚餐後吃藥",
      recall: ["Take", "this", "medicine", "after", "dinner"],
      transfers: [
        "Take this medicine after breakfast.",
        "Take this medicine at eight.",
      ],
      passage: [
        "I have a headache today.",
        "You should drink more water.",
        "I have to see a doctor tomorrow.",
        "Take this medicine after dinner.",
      ],
      questions: 5,
    },
  ];

  for (const lesson of lessons) {
    await openA2Lesson(page, lesson.title);
    await answerRecallTokens(page, lesson.recall);
    await submitRebuild(page, lesson.recall);
    await completeEnhancedStages(
      page,
      lesson.transfers,
      !lesson.passage,
    );
    if (lesson.passage) {
      await completePassage(
        page,
        lesson.passage,
        lesson.questions ?? 0,
      );
    }
    await expectNoHorizontalOverflow(page);
  }

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return {
          completed: value.levelProgress?.A2?.completedLessonIds?.filter(
            (lessonId: string) => !lessonId.startsWith("a2-u01-"),
          ).length,
          passages: Object.keys(
            value.levelProgress?.A2?.passageStats ?? {},
          ).filter((passageId) => passageId !== "a2-u01-p01").length,
        };
      }, progressKey),
    )
    .toEqual({ completed: 12, passages: 3 });

  await page.reload();
  await expect(page.getByText("12 / 16", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("finishing current A2 pilot content never marks A2 passed or unlocks B1", async ({
  page,
}) => {
  await seedA2Pilot(
    page,
    [],
    [],
    "A2",
    ["a2-u01", "a2-u02", "a2-u03", "a2-u04"],
  );
  await page.goto("/");
  await page.getByRole("button", { name: "課程地圖" }).click();
  await expect(
    page.locator('[data-testid="a2-pilot-completion"]'),
  ).toContainText("你已完成目前的A2試行內容");
  await expect(
    page.getByText("A2 程度總測驗", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /B1/ }),
  ).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        return {
          passedLevelIds: value.passedLevelIds,
          levelPassed: value.levelProgress?.A2?.levelPassed,
        };
      }, progressKey),
    )
    .toEqual({ passedLevelIds: [], levelPassed: false });
});

test("shows a Traditional Chinese A2 error without breaking A1", async ({
  page,
}) => {
  await page.route("**/data/a2-course-v1.csv", (route) =>
    route.fulfill({
      status: 500,
      contentType: "text/plain",
      body: "simulated A2 failure",
    }),
  );
  await seedA2Pilot(page, [], [], "A1");
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "把英文從「看得懂」練成「寫得出來」",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "課程地圖" }).click();
  await page.locator('[data-testid="level-selector-a2"]').click();
  await expect(
    page.locator('[data-testid="a2-load-error"]'),
  ).toContainText("A2 試行課程資料載入失敗");
  await page.locator('[data-testid="return-a1-from-error"]').click();
  await expect(
    page.getByRole("heading", { name: "A1 課程地圖" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("keeps the Windows one-click launchers in the project root", async () => {
  const root = path.resolve(process.cwd());
  expect(
    fs.existsSync(path.join(root, "啟動英句練習.bat")),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(root, "更新並啟動英句練習.bat")),
  ).toBe(true);
});
