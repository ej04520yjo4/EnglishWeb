import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const write = (relativePath, content) => fs.writeFileSync(path.join(root, relativePath), content, "utf8");

const replaceOnce = (relativePath, from, to) => {
  const content = read(relativePath);
  if (!content.includes(from)) {
    throw new Error(`找不到預期片段：${relativePath}\n${from.slice(0, 240)}`);
  }
  const next = content.replace(from, to);
  if (next === content) throw new Error(`未套用修改：${relativePath}`);
  write(relativePath, next);
};

const appendBefore = (relativePath, marker, contentToInsert) => {
  const content = read(relativePath);
  if (!content.includes(marker)) throw new Error(`找不到插入點：${relativePath}`);
  write(relativePath, content.replace(marker, `${contentToInsert}\n${marker}`));
};

const dailyLearningModule = `import type { GlobalVocabularyProgress } from "./vocabulary-progress.ts";
import { normalizeVocabularyEvidence } from "./vocabulary-progress.ts";
import type { VocabularyTargetsData } from "./vocabulary-targets.ts";

export type VocabularyWeaknessFocus = "辨認" | "拼寫" | "運用";

export type VocabularyWeakness = {
  lexemeId: string;
  lemma: string;
  focus: VocabularyWeaknessFocus;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  score: number;
  lastSeenAt: string;
};

const incorrectCount = (attempts: string[], correct: string[]) =>
  Math.max(0, attempts.length - correct.length);

export const buildVocabularyWeaknesses = (
  progress: GlobalVocabularyProgress,
  targets: VocabularyTargetsData | null,
  limit = 12,
): VocabularyWeakness[] => {
  if (!targets || limit <= 0) return [];
  const targetIndex = new Map(
    targets.entries.map((entry) => [entry.lexemeId, entry]),
  );

  return Object.entries(progress)
    .flatMap(([lexemeId, rawEvidence]) => {
      const target = targetIndex.get(lexemeId);
      if (!target) return [];
      const evidence = normalizeVocabularyEvidence(rawEvidence);
      const recognitionWrong = incorrectCount(
        evidence.recognitionAttemptEvidenceIds,
        evidence.recognitionCorrectEvidenceIds,
      );
      const spellingWrong = incorrectCount(
        evidence.spellingAttemptEvidenceIds,
        evidence.spellingCorrectEvidenceIds,
      );
      const applicationWrong = incorrectCount(
        evidence.applicationAttemptEvidenceIds,
        evidence.applicationCorrectEvidenceIds,
      );
      const wrongAttempts =
        recognitionWrong + spellingWrong + applicationWrong;
      if (wrongAttempts <= 0) return [];

      const totalAttempts =
        evidence.recognitionAttemptEvidenceIds.length +
        evidence.spellingAttemptEvidenceIds.length +
        evidence.applicationAttemptEvidenceIds.length;
      const correctAttempts =
        evidence.recognitionCorrectEvidenceIds.length +
        evidence.spellingCorrectEvidenceIds.length +
        evidence.applicationCorrectEvidenceIds.length;
      const focusScores: Array<[VocabularyWeaknessFocus, number]> = [
        ["拼寫", spellingWrong],
        ["運用", applicationWrong],
        ["辨認", recognitionWrong],
      ];
      focusScores.sort((left, right) => right[1] - left[1]);
      const focus = focusScores[0][0];
      const score =
        spellingWrong * 4 +
        applicationWrong * 3 +
        recognitionWrong * 2 +
        Math.min(totalAttempts, 5);

      return [
        {
          lexemeId,
          lemma: target.lemma,
          focus,
          totalAttempts,
          correctAttempts,
          wrongAttempts,
          score,
          lastSeenAt: evidence.lastSeenAt,
        },
      ];
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.wrongAttempts !== left.wrongAttempts) {
        return right.wrongAttempts - left.wrongAttempts;
      }
      return right.lastSeenAt.localeCompare(left.lastSeenAt);
    })
    .slice(0, limit);
};
`;

write("app/daily-learning.ts", dailyLearningModule);

replaceOnce(
  "app/page.tsx",
  `import {\n  canCreditSpellingCorrect,\n  recordGlobalVocabularyEvidence,\n  summarizeVocabularyProgress,\n  type VocabularyEvidenceKind,\n} from "./vocabulary-progress.ts";`,
  `import {\n  canCreditSpellingCorrect,\n  recordGlobalVocabularyEvidence,\n  summarizeVocabularyProgress,\n  type VocabularyEvidenceKind,\n} from "./vocabulary-progress.ts";\nimport { buildVocabularyWeaknesses } from "./daily-learning.ts";`,
);

replaceOnce(
  "app/page.tsx",
  `  | "related-vocabulary"\n  | "review"\n  | "progress"`,
  `  | "related-vocabulary"\n  | "review"\n  | "weakness"\n  | "progress"`,
);

replaceOnce(
  "app/page.tsx",
  `  { screen: "related-vocabulary", label: "相關字詞", icon: "▦" },\n  { screen: "review", label: "待複習", icon: "↻" },\n  { screen: "progress", label: "學習進度", icon: "▥" },`,
  `  { screen: "related-vocabulary", label: "相關字詞", icon: "▦" },\n  { screen: "review", label: "待複習", icon: "↻" },\n  { screen: "weakness", label: "弱點中心", icon: "△" },\n  { screen: "progress", label: "學習進度", icon: "▥" },`,
);

replaceOnce(
  "app/page.tsx",
  `  const dueReviews = Object.values(progress.reviewItems).filter(\n    (item) => new Date(item.dueAt).getTime() <= timestamp(),\n  );\n  const accuracy = progress.totalAttempts`,
  `  const dueReviews = Object.values(progress.reviewItems).filter(\n    (item) => new Date(item.dueAt).getTime() <= timestamp(),\n  );\n  const vocabularyWeaknesses = useMemo(\n    () =>\n      buildVocabularyWeaknesses(\n        multiProgress.vocabularyProgress,\n        vocabularyTargets,\n      ),\n    [multiProgress.vocabularyProgress, vocabularyTargets],\n  );\n  const accuracy = progress.totalAttempts`,
);

replaceOnce(
  "app/page.tsx",
  `        : {\n            kicker: \`下一個建議課程・單元 \${nextUnit.number}\`,\n            title: nextLesson.title,\n            preview: nextLesson.sentence,\n            chips: [\`\${nextLesson.tokens.length} 個學習單位\`, \`約 \${nextLesson.minutes} 分鐘\`, nextLesson.grammar],\n            action: () => startLesson(nextLesson),\n            buttonLabel: "開始這一課",\n          };\n    return (`,
  `        : {\n            kicker: \`下一個建議課程・單元 \${nextUnit.number}\`,\n            title: nextLesson.title,\n            preview: nextLesson.sentence,\n            chips: [\`\${nextLesson.tokens.length} 個學習單位\`, \`約 \${nextLesson.minutes} 分鐘\`, nextLesson.grammar],\n            action: () => startLesson(nextLesson),\n            buttonLabel: "開始這一課",\n          };\n    const todayMinutes =\n      Math.max(1, nextLesson.minutes) +\n      Math.min(dueReviews.length, 5) +\n      Math.min(vocabularyWeaknesses.length, 3);\n    const todayAction = dueReviews.length\n      ? () => setScreen("review")\n      : recommendation.action;\n    const todayActionLabel = dueReviews.length\n      ? \`先複習 \${dueReviews.length} 項\`\n      : recommendation.buttonLabel;\n    return (`,
);

replaceOnce(
  "app/page.tsx",
  `        </section>\n\n        <section className="continue-card">`,
  `        </section>\n\n        <section\n          className="section-card"\n          data-testid="daily-learning-plan"\n        >\n          <div className="section-heading">\n            <div>\n              <span className="eyebrow">今日學習</span>\n              <h2>今天照這個順序完成就好</h2>\n            </div>\n            <span className="status-pill">約 {todayMinutes} 分鐘</span>\n          </div>\n          <div className="three-grid">\n            <StatCard\n              label="① 待複習"\n              value={dueReviews.length}\n              note={dueReviews.length ? "先把到期內容喚回來" : "今天沒有到期內容"}\n            />\n            <StatCard\n              label="② 今日課程"\n              value={recommendation.title}\n              note={recommendation.kicker}\n            />\n            <StatCard\n              label="③ 弱點加強"\n              value={Math.min(vocabularyWeaknesses.length, 3)}\n              note={\n                vocabularyWeaknesses.length\n                  ? \`優先：\${vocabularyWeaknesses\n                      .slice(0, 3)\n                      .map((item) => item.lemma)\n                      .join("、")}\`\n                  : "目前沒有明顯錯誤累積"\n              }\n            />\n          </div>\n          <div className="section-heading">\n            <button\n              className="primary-button detail-next-button"\n              data-testid="start-daily-learning"\n              onClick={todayAction}\n              onKeyDown={(event) => activateButtonOnEnter(event, todayAction)}\n              aria-keyshortcuts="Enter"\n            >\n              <span>{todayActionLabel}</span>\n              <kbd>Enter</kbd>\n            </button>\n            <button\n              className="text-button"\n              onClick={() => setScreen("weakness")}\n            >\n              查看弱點中心 →\n            </button>\n          </div>\n        </section>\n\n        <section className="continue-card">`,
);

const weaknessRenderer = `  const renderWeakness = () => {
    const spellingCount = vocabularyWeaknesses.filter(
      (item) => item.focus === "拼寫",
    ).length;
    const recognitionCount = vocabularyWeaknesses.filter(
      (item) => item.focus === "辨認",
    ).length;
    const applicationCount = vocabularyWeaknesses.filter(
      (item) => item.focus === "運用",
    ).length;
    return (
      <div className="page-stack" data-testid="weakness-center">
        <section className="page-title">
          <div>
            <span className="eyebrow">依你的實際錯誤證據排序</span>
            <h1>弱點中心</h1>
            <p>只列出真的答錯過的核心詞彙；看過一次或單純打開單字卡不算弱點。</p>
          </div>
          <span className="level-pill">目前 {vocabularyWeaknesses.length} 個</span>
        </section>
        <div className="three-grid">
          <StatCard label="拼寫弱點" value={spellingCount} />
          <StatCard label="辨認弱點" value={recognitionCount} />
          <StatCard label="運用弱點" value={applicationCount} />
        </div>
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">優先處理錯誤最多的內容</span>
              <h2>最需要加強</h2>
            </div>
            <button className="text-button" onClick={() => setScreen("review")}>
              前往待複習 →
            </button>
          </div>
          {vocabularyWeaknesses.length ? (
            <div className="review-list" data-testid="weakness-list">
              {vocabularyWeaknesses.map((item, index) => (
                <article className="review-row" key={item.lexemeId}>
                  <span className="lesson-number">{index + 1}</span>
                  <div>
                    <strong>{item.lemma}</strong>
                    <small>
                      {item.focus}・答錯 {item.wrongAttempts} / 嘗試 {item.totalAttempts}
                      {item.lastSeenAt ? `・最近 ${item.lastSeenAt.slice(0, 10)}` : ""}
                    </small>
                  </div>
                  <span className="status-pill">{item.focus}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state" data-testid="weakness-empty-state">
              <strong>目前沒有明顯弱點</strong>
              <span>完成更多辨認、拼寫與句型練習後，答錯過的內容會自動出現在這裡。</span>
              <button
                className="primary-button detail-next-button"
                onClick={() => startLesson(nextLesson)}
                onKeyDown={(event) =>
                  activateButtonOnEnter(event, () => startLesson(nextLesson))
                }
                aria-keyshortcuts="Enter"
              >
                <span>繼續下一課</span>
                <kbd>Enter</kbd>
              </button>
            </div>
          )}
        </section>
      </div>
    );
  };

`;

appendBefore("app/page.tsx", "  const renderProgress = () => {", weaknessRenderer.trimEnd());

replaceOnce(
  "app/page.tsx",
  `    if (screen === "review") return renderReview();\n    if (screen === "progress") return renderProgress();`,
  `    if (screen === "review") return renderReview();\n    if (screen === "weakness") return renderWeakness();\n    if (screen === "progress") return renderProgress();`,
);

replaceOnce(
  "app/page.tsx",
  `              {item.screen === "review" && dueReviews.length > 0 && <b>{dueReviews.length}</b>}\n            </button>`,
  `              {item.screen === "review" && dueReviews.length > 0 && <b>{dueReviews.length}</b>}\n              {item.screen === "weakness" && vocabularyWeaknesses.length > 0 && (\n                <b>{vocabularyWeaknesses.length}</b>\n              )}\n            </button>`,
);

const unitTest = `import assert from "node:assert/strict";
import test from "node:test";
import { buildVocabularyWeaknesses } from "../app/daily-learning.ts";
import { createEmptyVocabularyEvidence } from "../app/vocabulary-progress.ts";

const targets = {
  schemaVersion: 1,
  status: "partial_review_required",
  completionLevel: "A2",
  goals: {
    totalLexemes: 3000,
    activeLexemes: 1500,
    receptiveLexemes: 1500,
    a1Cumulative: { totalLexemes: 1200, activeLexemes: 700, receptiveLexemes: 500 },
    a2Cumulative: { totalLexemes: 3000, activeLexemes: 1500, receptiveLexemes: 1500 },
  },
  entries: [
    {
      lexemeId: "because",
      lemma: "because",
      sourceLexemeIds: ["because"],
      targetLevel: "A2",
      masteryTarget: "active",
      curriculumPriority: 1,
      topics: ["test"],
      sourceRefs: [],
      qaStatus: "pilot_review_required",
    },
    {
      lexemeId: "water",
      lemma: "water",
      sourceLexemeIds: ["water"],
      targetLevel: "A1",
      masteryTarget: "active",
      curriculumPriority: 2,
      topics: ["test"],
      sourceRefs: [],
      qaStatus: "pilot_review_required",
    },
  ],
};

test("weakness ranking prioritizes repeated spelling errors", () => {
  const because = createEmptyVocabularyEvidence();
  because.lastSeenAt = "2026-08-07T01:00:00.000Z";
  because.recognitionAttemptEvidenceIds = ["r1", "r2"];
  because.recognitionCorrectEvidenceIds = ["r1"];
  because.spellingAttemptEvidenceIds = ["s1", "s2", "s3"];
  because.spellingCorrectEvidenceIds = ["s1"];
  because.applicationAttemptEvidenceIds = ["a1"];

  const weaknesses = buildVocabularyWeaknesses(
    { because },
    targets,
  );

  assert.equal(weaknesses.length, 1);
  assert.equal(weaknesses[0].lexemeId, "because");
  assert.equal(weaknesses[0].focus, "拼寫");
  assert.equal(weaknesses[0].wrongAttempts, 4);
  assert.equal(weaknesses[0].totalAttempts, 6);
});

test("weakness center ignores correct-only and non-target evidence", () => {
  const water = createEmptyVocabularyEvidence();
  water.recognitionAttemptEvidenceIds = ["r1", "r2"];
  water.recognitionCorrectEvidenceIds = ["r1", "r2"];
  water.spellingAttemptEvidenceIds = ["s1"];
  water.spellingCorrectEvidenceIds = ["s1"];
  water.applicationAttemptEvidenceIds = ["a1"];
  water.applicationCorrectEvidenceIds = ["a1"];

  const unknown = createEmptyVocabularyEvidence();
  unknown.spellingAttemptEvidenceIds = ["s2"];

  assert.deepEqual(
    buildVocabularyWeaknesses({ water, unknown }, targets),
    [],
  );
});
`;
write("tests/daily-learning.test.mjs", unitTest);

replaceOnce(
  "package.json",
  `"test:unit": "node --experimental-strip-types --test tests/rendered-html.test.mjs tests/a1-mvp-v3.test.mjs tests/a2-pilot.test.mjs tests/b1-b2-curriculum.test.mjs tests/vocabulary-groups.test.mjs tests/vocabulary-targets.test.mjs"`,
  `"test:unit": "node --experimental-strip-types --test tests/rendered-html.test.mjs tests/a1-mvp-v3.test.mjs tests/a2-pilot.test.mjs tests/b1-b2-curriculum.test.mjs tests/vocabulary-groups.test.mjs tests/vocabulary-targets.test.mjs tests/daily-learning.test.mjs"`,
);

const browserTest = `test("shows the daily learning plan and weakness center", async ({ page }) => {
  await page.goto("/");
  await expectLevelHomeReady(page, "A1");
  await expect(page.locator('[data-testid="daily-learning-plan"]')).toBeVisible();
  await expect(page.locator('[data-testid="start-daily-learning"]')).toBeVisible();
  await page.getByRole("button", { name: "前往弱點中心" }).click();
  await expect(page.locator('[data-testid="weakness-center"]')).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "弱點中心", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-testid="weakness-empty-state"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

`;
appendBefore(
  "tests/e2e/learning-flow.spec.ts",
  `test("keeps the Windows one-click launchers in the project root", async () => {`,
  browserTest.trimEnd(),
);

replaceOnce(
  "CHANGELOG.md",
  `- Added vocabulary coverage and personal mastery summaries to the learning-progress page.`,
  `- Added vocabulary coverage and personal mastery summaries to the learning-progress page.\n- Added a home-page daily learning plan that prioritizes due review, the next lesson, and up to three evidence-backed vocabulary weaknesses.\n- Added a weakness center that ranks only actually missed target lexemes and separates spelling, recognition, and application focus.`,
);

replaceOnce(
  "PROGRESS.md",
  `- The progress page separates the 3000 goal, current target coverage, personal evidence-based mastery, senses, chunks, and due reviews.`,
  `- The progress page separates the 3000 goal, current target coverage, personal evidence-based mastery, senses, chunks, and due reviews.\n- The home page now shows a deterministic daily learning plan: due review first, then the current recommended lesson, then up to three evidence-backed weak lexemes.\n- The weakness center ranks only target lexemes with actual incorrect recognition, clean-spelling, or application attempts; passive exposure never creates a weakness.`,
);

replaceOnce(
  "PROGRESS.md",
  `- \`npm run test:unit\`: exit 0; 108 passed, 0 failed.`,
  `- \`npm run test:unit\`: exit 0; 110 passed, 0 failed.`,
);
replaceOnce(
  "PROGRESS.md",
  `- \`npm run test:e2e\`: exit 0; 42 passed across desktop and mobile, 0 failed.`,
  `- \`npm run test:e2e\`: exit 0; 44 passed across desktop and mobile, 0 failed.`,
);

replaceOnce(
  "TASKS.md",
  `## Next - P1\n\n- [ ] **CI-E2E-001:** After pushing the hydration fix, confirm GitHub Actions passes all browser tests and exposes the Playwright artifact.`,
  `## Next - P1\n\n- [x] **LEARNING-LOOP-001:** Add a deterministic daily learning plan and evidence-backed weakness center without changing schema v6 or CEFR unlock rules.\n- [ ] **CI-E2E-001:** After pushing the hydration fix, confirm GitHub Actions passes all browser tests and exposes the Playwright artifact.`,
);

console.log("Daily learning plan and weakness center applied.");
