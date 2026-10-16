import { expect, type Page, test } from "@playwright/test";
import fs from "node:fs";

const progressKey = "yingju-progress-v1";
const settingsKey = "yingju-settings-v1";
const conversationKey = "yingju-conversation-practice-v1";

type ConversationTurn = {
  id: string;
  answers: string[];
};

type ConversationScenario = {
  id: string;
  requiredLessonIds: string[];
  turns: ConversationTurn[];
};

type ConversationData = { scenarios: ConversationScenario[] };

// Keep this file self-contained so the speech tests can be run alone.
const data = JSON.parse(
  fs.readFileSync("public/data/conversation-practice-v1.json", "utf8"),
) as ConversationData;

const introductionScenario = data.scenarios.find((scenario) =>
  scenario.requiredLessonIds.includes("a1-u1-l4"),
);
if (!introductionScenario) {
  throw new Error("Speech E2E fixture cannot find the introduction scenario.");
}

const installSpeechFixture = async (
  page: Page,
  supported = true,
) => {
  await page.addInitScript((isSupported) => {
    const host = window as typeof window & {
      __speechE2E?: {
        instances: Array<{
          lang: string;
          continuous: boolean;
          interimResults: boolean;
          maxAlternatives: number;
          started: boolean;
          stopCalled: boolean;
          abortCalled: boolean;
          onstart: (() => void) | null;
          onresult: ((event: unknown) => void) | null;
          onerror: ((event: unknown) => void) | null;
          onend: (() => void) | null;
        }>;
        savedOnresult: ((event: unknown) => void) | null;
        savedOnend: (() => void) | null;
        ttsCancelCount: number;
        abortThrows: boolean;
      };
    };
    host.__speechE2E = {
      instances: [],
      savedOnresult: null,
      savedOnend: null,
      ttsCancelCount: 0,
      abortThrows: false,
    };

    try {
      const synthesis = window.speechSynthesis;
      if (synthesis && typeof synthesis.cancel === "function") {
        const originalCancel = synthesis.cancel.bind(synthesis);
        Object.defineProperty(synthesis, "cancel", {
          configurable: true,
          value: () => {
            host.__speechE2E!.ttsCancelCount += 1;
            originalCancel();
          },
        });
      }
    } catch {
      // The speech input tests still cover the UI when TTS is unavailable.
    }

    if (!isSupported) {
      for (const name of ["SpeechRecognition", "webkitSpeechRecognition"]) {
        try {
          Object.defineProperty(window, name, {
            configurable: true,
            writable: true,
            value: undefined,
          });
        } catch {
          // Chromium normally has no recognition constructor in this fixture.
        }
      }
      return;
    }

    class FakeSpeechRecognition {
      lang = "";
      continuous = true;
      interimResults = false;
      maxAlternatives = 0;
      started = false;
      stopCalled = false;
      abortCalled = false;
      onstart: (() => void) | null = null;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;

      constructor() {
        host.__speechE2E?.instances.push(this);
      }

      start() {
        this.started = true;
        this.onstart?.();
      }

      stop() {
        this.stopCalled = true;
      }

      abort() {
        this.abortCalled = true;
        if (host.__speechE2E?.abortThrows) {
          throw new Error("speech test abort failure");
        }
        this.onend?.();
      }
    }

    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      writable: true,
      value: FakeSpeechRecognition,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  }, supported);
};

const seed = async (page: Page, speechSupported = true) => {
  await page.clock.setFixedTime(new Date("2026-10-16T12:00:00.000Z"));
  await installSpeechFixture(page, speechSupported);
  await page.addInitScript(({ progressStorageKey, settingsStorageKey }) => {
    if (localStorage.getItem(settingsStorageKey) === null) {
      localStorage.setItem(
        settingsStorageKey,
        JSON.stringify({
          phonetic: "KK",
          autoplay: false,
          slowRate: 0.85,
          showAdvancedPilots: true,
        }),
      );
    }
    // The app creates its normal schema-v6 progress fixture when absent. Do
    // not overwrite it on reload: speech tests must observe persistence.
    void progressStorageKey;
  }, { progressStorageKey: progressKey, settingsStorageKey: settingsKey });
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
  await page
    .getByRole("navigation", { name: "主要導覽" })
    .getByRole("button", { name: /對話/ })
    .click();
  await expect(page.getByTestId("conversation-practice")).toBeVisible();
};

const openScenario = async (page: Page) => {
  await page.getByTestId(`conversation-scenario-${introductionScenario.id}`).click();
  await expect(page.getByTestId("conversation-preparation")).toBeVisible();
  await page.getByTestId("conversation-start").press("Enter");
  await expect(page.getByTestId("conversation-active")).toBeVisible();
};

const readFormalProgress = (page: Page) =>
  page.evaluate((key) => localStorage.getItem(key), progressKey);

const readConversationStore = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), conversationKey);

const fakeInstances = (page: Page) =>
  page.evaluate(() => {
    const host = window as typeof window & {
      __speechE2E?: { instances: Array<Record<string, unknown>> };
    };
    return host.__speechE2E?.instances ?? [];
  });

const saveCurrentRecognitionCallbacks = async (page: Page) => {
  await page.evaluate(() => {
    const host = window as typeof window & {
      __speechE2E?: {
        instances: Array<{
          onresult: ((event: unknown) => void) | null;
          onend: (() => void) | null;
        }>;
        savedOnresult: ((event: unknown) => void) | null;
        savedOnend: (() => void) | null;
      };
    };
    const instance = host.__speechE2E?.instances.at(-1);
    if (host.__speechE2E) {
      host.__speechE2E.savedOnresult = instance?.onresult ?? null;
      host.__speechE2E.savedOnend = instance?.onend ?? null;
    }
  });
};

const emitInterim = async (page: Page, transcript: string) => {
  await page.evaluate((value) => {
    const host = window as typeof window & {
      __speechE2E?: {
        instances: Array<{ onresult: ((event: unknown) => void) | null }>;
      };
    };
    const instance = host.__speechE2E?.instances.at(-1);
    instance?.onresult?.({
      resultIndex: 0,
      results: [{
        isFinal: false,
        length: 1,
        0: { transcript: value },
      }],
    });
  }, transcript);
};

const emitFinal = async (page: Page, transcript: string) => {
  await page.evaluate((value) => {
    const host = window as typeof window & {
      __speechE2E?: {
        instances: Array<{ onresult: ((event: unknown) => void) | null }>;
      };
    };
    const instance = host.__speechE2E?.instances.at(-1);
    instance?.onresult?.({
      resultIndex: 0,
      results: [{
        isFinal: true,
        length: 1,
        0: { transcript: value },
      }],
    });
  }, transcript);
};

const emitEnd = async (page: Page) => {
  await page.evaluate(() => {
    const host = window as typeof window & {
      __speechE2E?: { instances: Array<{ onend: (() => void) | null }> };
    };
    host.__speechE2E?.instances.at(-1)?.onend?.();
  });
};

const finishRecognition = async (page: Page, transcript: string) => {
  await emitFinal(page, transcript);
  await page.getByTestId("speech-stop").click();
  await emitEnd(page);
};

const emitSavedFinal = async (page: Page, transcript: string) => {
  await page.evaluate((value) => {
    const host = window as typeof window & {
      __speechE2E?: {
        savedOnresult: ((event: unknown) => void) | null;
      };
    };
    host.__speechE2E?.savedOnresult?.({
      resultIndex: 0,
      results: [{
        isFinal: true,
        length: 1,
        0: { transcript: value },
      }],
    });
  }, transcript);
};

const emitError = async (page: Page, error: string) => {
  await page.evaluate((code) => {
    const host = window as typeof window & {
      __speechE2E?: {
        instances: Array<{ onerror: ((event: unknown) => void) | null }>;
      };
    };
    host.__speechE2E?.instances.at(-1)?.onerror?.({ error: code });
  }, error);
};

const expectNoHorizontalOverflow = async (page: Page) => {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
};

test("speech consent gates microphone, interim stays a preview, and final text requires explicit use", async ({ page }, testInfo) => {
  await seed(page);
  await openConversation(page);
  await openScenario(page);

  const consent = page.getByTestId("speech-consent");
  const start = page.getByTestId("speech-start");
  await expect(consent).not.toBeChecked();
  await expect(start).toBeDisabled();

  await consent.check();
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page.getByTestId("speech-stop")).toBeVisible();

  const config = await page.evaluate(() => {
    const host = window as typeof window & {
      __speechE2E?: { instances: Array<Record<string, unknown>> };
    };
    const instance = host.__speechE2E?.instances.at(-1);
    return {
      lang: instance?.lang,
      continuous: instance?.continuous,
      interimResults: instance?.interimResults,
      maxAlternatives: instance?.maxAlternatives,
    };
  });
  expect(config).toEqual({
    lang: "en-US",
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
  });

  await emitInterim(page, "My name");
  await expect(page.getByTestId("speech-interim")).toContainText("My name");
  await expect(page.getByTestId("conversation-turn-input")).toHaveValue("");
  await expect(page.getByTestId("conversation-feedback")).toHaveText("");

  const expectedAnswer = introductionScenario.turns[0].answers[0];
  await finishRecognition(page, expectedAnswer);
  await expect(page.getByTestId("speech-preview")).toContainText(expectedAnswer);
  await page.screenshot({
    path: testInfo.outputPath("speech-preview.png"),
    fullPage: true,
  });
  await expect(page.getByTestId("conversation-turn-input")).toHaveValue("");

  await page.getByTestId("speech-use").click();
  await expect(page.getByTestId("conversation-turn-input")).toHaveValue(expectedAnswer);
  await expect(page.getByTestId("conversation-feedback")).toHaveText("");
  await page.getByTestId("conversation-turn-input").press("Enter");
  await expect(page.getByTestId("conversation-feedback")).toContainText(/回應|符合|回答/);
  await page.getByTestId("conversation-next").press("Enter");
  await expect(page.getByTestId("speech-consent")).toBeChecked();
  await expect(page.getByTestId("speech-start")).toBeEnabled();
  await expect.poll(async () => (await fakeInstances(page)).length).toBe(1);
  await expectNoHorizontalOverflow(page);
});

for (const [nativeError, expectedMessage] of [
  ["not-allowed", "拒絕麥克風權限"],
  ["network", "網路"],
  ["no-speech", "沒有聽到"],
] as const) {
  test(`speech ${nativeError} falls back to editable text input`, async ({ page }) => {
    await seed(page);
    await openConversation(page);
    await openScenario(page);
    await page.getByTestId("speech-consent").check();
    await page.getByTestId("speech-start").click();
    await emitError(page, nativeError);

    await expect(page.getByTestId("speech-status")).toContainText(expectedMessage);
    const input = page.getByTestId("conversation-turn-input");
    await expect(input).toBeEditable();
    await input.fill(introductionScenario.turns[0].answers[0]);
    await expect(input).toHaveValue(introductionScenario.turns[0].answers[0]);
    await expect(page.getByTestId("speech-preview")).toHaveCount(0);
    expect(Object.keys((await readConversationStore(page)).turnHistory)).toHaveLength(0);
    await expectNoHorizontalOverflow(page);
  });
}

test("discarding a final transcript preserves the learner's typed draft", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await openScenario(page);
  const input = page.getByTestId("conversation-turn-input");
  await input.fill("My ");
  await page.getByTestId("speech-consent").check();
  await page.getByTestId("speech-start").click();
  await finishRecognition(page, introductionScenario.turns[0].answers[0]);

  await expect(page.getByTestId("speech-preview")).toBeVisible();
  await expect(input).toHaveValue("My ");
  await page.getByTestId("speech-discard").click();
  await expect(page.getByTestId("speech-preview")).toHaveCount(0);
  await expect(input).toHaveValue("My ");
});

test("capturing speech cancels TTS and disables competing controls until it ends", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await openScenario(page);
  await page.getByTestId("speech-consent").check();
  const beforeCancelCount = await page.evaluate(() => {
    const host = window as typeof window & {
      __speechE2E?: { ttsCancelCount: number };
    };
    return host.__speechE2E?.ttsCancelCount ?? 0;
  });

  await page.getByTestId("speech-start").click();
  await expect(page.getByTestId("speech-stop")).toBeVisible();
  await expect(page.locator(".conversation-audio-button")).toHaveCount(2);
  await expect(page.locator(".conversation-audio-button").first()).toBeDisabled();
  await expect(page.locator(".conversation-audio-button").nth(1)).toBeDisabled();
  await expect(page.getByTestId("conversation-turn-input")).toHaveAttribute("readonly", "");
  await expect(page.getByTestId("conversation-check")).toBeDisabled();

  const afterCancelCount = await page.evaluate(() => {
    const host = window as typeof window & {
      __speechE2E?: { ttsCancelCount: number };
    };
    return host.__speechE2E?.ttsCancelCount ?? 0;
  });
  expect(afterCancelCount).toBeGreaterThan(beforeCancelCount);

  await page.getByTestId("speech-cancel").click();
  await expect(page.getByTestId("conversation-turn-input")).not.toHaveAttribute("readonly", "");
  await expect(page.getByTestId("conversation-check")).toBeDisabled();
});

test("speech-use fails closed when conversation storage cannot be written", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await openScenario(page);
  await page.getByTestId("speech-consent").check();
  await page.getByTestId("speech-start").click();
  await finishRecognition(page, introductionScenario.turns[0].answers[0]);

  const savedBytes = await page.evaluate((key) => localStorage.getItem(key), conversationKey);
  await page.evaluate((key) => {
    const storage = window.localStorage;
    const original = storage.setItem.bind(storage);
    Object.defineProperty(storage, "setItem", {
      configurable: true,
      value: (candidateKey: string, value: string) => {
        if (candidateKey === key) throw new Error("speech test storage failure");
        original(candidateKey, value);
      },
    });
  }, conversationKey);

  await page.getByTestId("speech-use").click();
  await expect(page.getByRole("alert")).toContainText("對話紀錄需要先處理");
  await expect(page.getByRole("alert")).toContainText("speech test storage failure");
  await expect(page.getByTestId("conversation-summary")).toHaveCount(0);
  await expect(page.getByTestId("conversation-speech-used")).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), conversationKey)).toBe(savedBytes);
});

test("cleanup failure remains visible and stale speech callbacks remain ignored", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await openScenario(page);
  await page.getByTestId("speech-consent").check();
  await page.getByTestId("speech-start").click();
  await saveCurrentRecognitionCallbacks(page);
  await page.evaluate(() => {
    const host = window as typeof window & {
      __speechE2E?: { abortThrows: boolean };
    };
    if (host.__speechE2E) host.__speechE2E.abortThrows = true;
  });

  await page.getByTestId("speech-cancel").click();
  await expect(page.getByTestId("speech-status")).toContainText("未能確認已停止麥克風");
  await expect(page.getByTestId("speech-status")).not.toContainText("已取消語音辨識");
  await expect(page.getByTestId("speech-start")).toBeDisabled();
  await emitSavedFinal(page, "cleanup stale answer");
  await expect(page.getByTestId("speech-preview")).toHaveCount(0);
});

test("unsupported speech keeps the text flow available and disables microphone start", async ({ page }) => {
  await seed(page, false);
  await openConversation(page);
  await openScenario(page);
  await expect(page.getByTestId("speech-status")).toContainText(/不支援|需要 HTTPS|安全連線/);
  await expect(page.getByTestId("speech-start")).toBeDisabled();
  const input = page.getByTestId("conversation-turn-input");
  await expect(input).toBeEditable();
  await input.fill(introductionScenario.turns[0].answers[0]);
  await expectNoHorizontalOverflow(page);
});

test("cancel and hidden-page cleanup abort recognition and ignore stale callbacks", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await openScenario(page);
  await page.getByTestId("speech-consent").check();
  await page.getByTestId("speech-start").click();
  await saveCurrentRecognitionCallbacks(page);
  await page.getByTestId("speech-cancel").click();
  await expect(page.getByTestId("speech-start")).toBeVisible();

  const afterCancel = await page.evaluate(() => {
    const host = window as typeof window & {
      __speechE2E?: { instances: Array<{ abortCalled: boolean }> };
    };
    return host.__speechE2E?.instances.at(-1)?.abortCalled;
  });
  expect(afterCancel).toBe(true);
  await emitSavedFinal(page, "stale answer");
  await expect(page.getByTestId("speech-preview")).toHaveCount(0);

  await page.getByTestId("speech-start").click();
  await saveCurrentRecognitionCallbacks(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const afterHidden = await page.evaluate(() => {
    const host = window as typeof window & {
      __speechE2E?: { instances: Array<{ abortCalled: boolean }> };
    };
    return host.__speechE2E?.instances.at(-1)?.abortCalled;
  });
  expect(afterHidden).toBe(true);
  await emitSavedFinal(page, "hidden stale answer");
  await expect(page.getByTestId("speech-preview")).toHaveCount(0);
});

test("unmount aborts the active recognition instance and does not leak its final callback", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await openScenario(page);
  await page.getByTestId("speech-consent").check();
  await page.getByTestId("speech-start").click();
  await saveCurrentRecognitionCallbacks(page);

  await page
    .getByRole("navigation", { name: "主要導覽" })
    .getByRole("button", { name: /首頁/ })
    .click();
  await expect(page.getByRole("heading", { name: "把英文從「看得懂」練成「寫得出來」" })).toBeVisible();

  const afterUnmount = await page.evaluate(() => {
    const host = window as typeof window & {
      __speechE2E?: {
        instances: Array<{ abortCalled: boolean }>;
        savedOnresult: ((event: unknown) => void) | null;
      };
    };
    const instance = host.__speechE2E?.instances.at(-1);
    host.__speechE2E?.savedOnresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, length: 1, 0: { transcript: "leaked answer" } }],
    });
    return instance?.abortCalled;
  });
  expect(afterUnmount).toBe(true);

  await page.getByRole("navigation", { name: "主要導覽" }).getByRole("button", { name: /對話/ }).click();
  await expect(page.getByTestId("conversation-active")).toBeVisible();
  await expect(page.getByTestId("speech-preview")).toHaveCount(0);
});

test("reload never starts recognition automatically and resets only the panel consent", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await openScenario(page);
  await page.getByTestId("speech-consent").check();
  await page.getByTestId("speech-start").click();
  await page.reload();
  await openConversation(page);

  await expect(page.getByTestId("conversation-active")).toBeVisible();
  await expect(page.getByTestId("speech-consent")).not.toBeChecked();
  await expect(page.getByTestId("speech-start")).toBeDisabled();
  await expect.poll(async () => (await fakeInstances(page)).length).toBe(0);
});

test("speech assistance is stored separately from formal progress and clean typed evidence", async ({ page }) => {
  await seed(page);
  await openConversation(page);
  await openScenario(page);
  const formalBefore = await readFormalProgress(page);
  await page.getByTestId("speech-consent").check();
  await page.getByTestId("speech-start").click();
  await finishRecognition(page, introductionScenario.turns[0].answers[0]);
  await page.getByTestId("speech-use").click();
  await page.getByTestId("conversation-turn-input").press("Enter");
  await expect(page.getByTestId("conversation-next")).toBeVisible();
  await page.getByTestId("conversation-next").press("Enter");

  const afterSpeechUse = await readConversationStore(page);
  const firstHistory = Object.values(afterSpeechUse.turnHistory).find(
    (record: unknown) => (record as { usedSpeech?: boolean }).usedSpeech === true,
  ) as { usedSpeech?: boolean } | undefined;
  expect(firstHistory?.usedSpeech).toBe(true);
  expect(await readFormalProgress(page)).toBe(formalBefore);

  const remaining = introductionScenario.turns.slice(1);
  for (const turn of remaining) {
    const input = page.getByTestId("conversation-turn-input");
    await input.fill(turn.answers[0]);
    await input.press("Enter");
    await page.getByTestId("conversation-next").press("Enter");
  }
  const store = await readConversationStore(page);
  const result = Object.values(store.results).at(-1) as {
    independentTurns: number;
    speechTurns?: number;
  };
  expect(result.speechTurns).toBe(1);
  expect(result.independentTurns).toBe(introductionScenario.turns.length - 1);
  expect(await readFormalProgress(page)).toBe(formalBefore);
  await expectNoHorizontalOverflow(page);
});

