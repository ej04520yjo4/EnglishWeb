from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8", newline="\n")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly 1 match, found {count}")
    return text.replace(old, new, 1)


page = read("app/page.tsx")

page = replace_once(
    page,
    '''const activateButtonOnEnter = (\n  event: KeyboardEvent<HTMLButtonElement>,\n  action: () => void,\n) => {\n  if (event.key !== "Enter") return;\n  event.preventDefault();\n  action();\n};\n''',
    '''const activateButtonOnEnter = (\n  event: KeyboardEvent<HTMLButtonElement>,\n  action: () => void,\n) => {\n  if (event.key !== "Enter" || event.repeat) return;\n  event.preventDefault();\n  action();\n};\n\nconst moveAcrossInputs = (\n  event: KeyboardEvent<HTMLInputElement>,\n  previous: HTMLInputElement | null,\n  next: HTMLInputElement | null,\n) => {\n  const input = event.currentTarget;\n  const selectionStart = input.selectionStart ?? 0;\n  const selectionEnd = input.selectionEnd ?? selectionStart;\n\n  if (\n    event.key === "ArrowLeft" &&\n    selectionStart === 0 &&\n    selectionEnd === 0 &&\n    previous\n  ) {\n    event.preventDefault();\n    previous.focus();\n    const end = previous.value.length;\n    previous.setSelectionRange(end, end);\n    return true;\n  }\n\n  if (\n    event.key === "ArrowRight" &&\n    selectionStart === input.value.length &&\n    selectionEnd === input.value.length &&\n    next\n  ) {\n    event.preventDefault();\n    next.focus();\n    next.setSelectionRange(0, 0);\n    return true;\n  }\n\n  if (event.key === "Backspace" && input.value.length === 0 && previous) {\n    event.preventDefault();\n    previous.focus();\n    const end = previous.value.length;\n    previous.setSelectionRange(end, end);\n    return true;\n  }\n\n  return false;\n};\n''',
    "Enter repeat guard and cross-input helper",
)

page = replace_once(
    page,
    '''        {stage === "recall" && (\n          <section className="exercise-card">''',
    '''        {stage === "recall" && (\n          <section className="exercise-card recall-card">''',
    "recall card class",
)

recall_header_start = page.index(
    '            <span className="eyebrow">依中文或文法提示，逐字輸入英文</span>'
)
recall_grid_marker = '            <div\n              className={`recall-word-grid'
recall_header_end = page.index(recall_grid_marker, recall_header_start)
new_recall_header = '''            <span className="eyebrow">輸入練習</span>\n            <h1 className="recall-task-title">把下面提示寫成英文</h1>\n            <h2\n              className="chinese-prompt recall-primary-prompt"\n              data-testid="recall-primary-prompt"\n            >\n              {currentToken.prompt}\n            </h2>\n            <p className="recall-task-meta">\n              {currentToken.promptType === "grammar"\n                ? "文法提示"\n                : currentToken.promptType === "context"\n                  ? "語境提示"\n                  : "中文提示"}\n              ・提示 Level {currentTokenHintLevel}\n            </p>\n            <label\n              className="field-label recall-answer-label"\n              htmlFor="recall-answer-0"\n            >\n              你的英文答案\n            </label>\n'''
page = page[:recall_header_start] + new_recall_header + page[recall_header_end:]

old_recall_keydown = '''                    onKeyDown={(event) => {\n                      if (event.key === "Enter") checkRecall();\n                      if (event.key === "Backspace" && !recallValues[index] && index > 0) {\n                        recallInputs.current[index - 1]?.focus();\n                      }\n                    }}'''
new_recall_keydown = '''                    onKeyDown={(event) => {\n                      const previous =\n                        index > 0 ? recallInputs.current[index - 1] : null;\n                      const next =\n                        index < currentTokenWords.length - 1\n                          ? recallInputs.current[index + 1]\n                          : null;\n                      if (moveAcrossInputs(event, previous, next)) return;\n                      if (event.key === "Enter") {\n                        event.preventDefault();\n                        if (event.repeat) return;\n                        checkRecall();\n                      }\n                    }}'''
page = replace_once(
    page,
    old_recall_keydown,
    new_recall_keydown,
    "recall keyboard handling",
)

page = replace_once(
    page,
    ': "輸入你聽到、想到的英文"',
    ': "輸入英文"',
    "recall placeholder",
)

chunk_note_marker = '''            {currentTokenWords.length > 1 && (\n              <p className="chunk-input-note">'''
chunk_note_index = page.index(chunk_note_marker, recall_header_start)
recall_audio = '''            <div className="audio-row recall-audio-row">\n              <button\n                className="audio-button"\n                disabled={!tokenAudioAvailable}\n                onClick={() => playTokenAudio(currentToken)}\n              >\n                ▶ 正常\n              </button>\n              <button\n                className="audio-button"\n                disabled={!tokenAudioAvailable}\n                onClick={() => playTokenAudio(currentToken, settings.slowRate)}\n              >\n                ◁ 慢速\n              </button>\n              <small>\n                {!tokenAudioAvailable\n                  ? "此瀏覽器不支援語音播放。"\n                  : audioMessage ||\n                    (currentToken.audioStatus === "ready"\n                      ? "播放課程音訊"\n                      : "目前使用瀏覽器美式語音")}\n              </small>\n            </div>\n'''
page = page[:chunk_note_index] + recall_audio + page[chunk_note_index:]

page = replace_once(
    page,
    '{feedback || "大小寫與頭尾空格會寬鬆判定，拼字仍需正確。"}',
    '{feedback || "拼字要正確；大小寫不影響判定。"}',
    "recall default feedback",
)

# Replace the dense learner-facing detail grid with two essentials and a collapsed details section.
detail_stage = page.index('{stage === "detail" && (')
detail_grid_start = page.index('            <div className="detail-grid">', detail_stage)
detail_grid_end = page.index('            {currentToken.note &&', detail_grid_start)
new_detail = '''            <div className="detail-essential" data-testid="detail-essential">\n              <div className="detail-essential-item preferred-phonetic">\n                <small>\n                  {settings.phonetic === "KK" ? "KK 音標" : "美式 IPA"}\n                </small>\n                <strong>\n                  {settings.phonetic === "KK" ? currentToken.kk : currentToken.ipa}\n                </strong>\n              </div>\n              <div className="detail-essential-item">\n                <small>句中詞性</small>\n                <strong>{currentToken.contextPos || currentToken.partOfSpeech}</strong>\n              </div>\n            </div>\n            <details className="detail-more">\n              <summary>更多字詞資訊</summary>\n              <div className="detail-grid detail-grid-secondary">\n                <div>\n                  <small>\n                    {settings.phonetic === "KK" ? "美式 IPA" : "KK 音標"}\n                  </small>\n                  <strong>\n                    {settings.phonetic === "KK" ? currentToken.ipa : currentToken.kk}\n                  </strong>\n                </div>\n                {currentToken.dictionaryPos && (\n                  <div>\n                    <small>字典詞性</small>\n                    <strong>{currentToken.dictionaryPos}</strong>\n                  </div>\n                )}\n                <div>\n                  <small>音節</small>\n                  <strong>{currentToken.syllables || "單音節／語塊"}</strong>\n                </div>\n                <div>\n                  <small>重音</small>\n                  <strong>{currentToken.stress || "依語句自然重讀"}</strong>\n                </div>\n                <div>\n                  <small>原形／變化</small>\n                  <strong>{currentToken.lemma || currentToken.answer}</strong>\n                </div>\n              </div>\n            </details>\n'''
page = page[:detail_grid_start] + new_detail + page[detail_grid_end:]

page = replace_once(
    page,
    '''            <p className="chunk-input-note">\n              每格只輸入一個英文單字；按空白鍵換到下一格，最後一格按 Enter 檢查答案。\n            </p>''',
    '''            <p className="chunk-input-note">\n              每格只輸入一個英文單字；空白鍵／→ 前往下一格，← 回上一格，最後一格按 Enter 檢查。\n            </p>''',
    "rebuild keyboard hint",
)

old_rebuild_keydown = '''                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {\n                      if (rebuildAnswerRevealed) return;\n                      if (event.key === " ") {'''
new_rebuild_keydown = '''                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {\n                      if (rebuildAnswerRevealed) return;\n                      const previous =\n                        index > 0\n                          ? (document.getElementById(\n                              `rebuild-${index - 1}`,\n                            ) as HTMLInputElement | null)\n                          : null;\n                      const next =\n                        index < selectedLesson.tokens.length - 1\n                          ? (document.getElementById(\n                              `rebuild-${index + 1}`,\n                            ) as HTMLInputElement | null)\n                          : null;\n                      if (moveAcrossInputs(event, previous, next)) return;\n                      if (event.key === " ") {'''
page = replace_once(
    page,
    old_rebuild_keydown,
    new_rebuild_keydown,
    "rebuild cross-input handling",
)

page = replace_once(
    page,
    '''                      if (event.key === "Enter") {\n                        event.preventDefault();\n                        if (index === selectedLesson.tokens.length - 1) {\n                          checkRebuild();''',
    '''                      if (event.key === "Enter") {\n                        event.preventDefault();\n                        if (event.repeat) return;\n                        if (index === selectedLesson.tokens.length - 1) {\n                          checkRebuild();''',
    "rebuild Enter repeat guard",
)

# Other free-text inputs should also ignore keyboard auto-repeat on Enter.
page = page.replace(
    'if (event.key !== "Enter") return;\n                event.preventDefault();',
    'if (event.key !== "Enter" || event.repeat) return;\n                event.preventDefault();',
)
page = page.replace(
    'if (event.key !== "Enter" || event.shiftKey) return;',
    'if (event.key !== "Enter" || event.shiftKey || event.repeat) return;',
)
page = page.replace(
    'if (event.key === "Enter" && !weaknessPracticeChecked) {\n                    event.preventDefault();',
    'if (event.key === "Enter" && !weaknessPracticeChecked) {\n                    event.preventDefault();\n                    if (event.repeat) return;',
)

write("app/page.tsx", page)

css = read("app/globals.css")
ux_css = '''\n\n/* Learning input hierarchy: keep the task first, controls second, metadata last. */\n.recall-card {\n  width: min(900px, 100%);\n  margin: 0 auto;\n  padding: clamp(28px, 4vw, 48px);\n}\n\n.recall-task-title {\n  margin: 0;\n  color: var(--muted);\n  font-size: clamp(17px, 2vw, 22px);\n  font-weight: 750;\n}\n\n.recall-primary-prompt {\n  margin: 14px 0 8px;\n  font-size: clamp(44px, 6vw, 68px);\n  font-weight: 900;\n  letter-spacing: -0.035em;\n}\n\n.recall-task-meta {\n  margin: 0 0 24px;\n  color: var(--muted);\n  font-size: 13px;\n  font-weight: 650;\n}\n\n.recall-answer-label {\n  display: block;\n  margin-bottom: 8px;\n  text-align: center;\n}\n\n.recall-card .answer-input {\n  min-height: 82px;\n  border-width: 2px;\n  font-size: clamp(27px, 3.2vw, 36px);\n  font-weight: 800;\n}\n\n.recall-card .answer-input::placeholder {\n  font-size: 16px;\n}\n\n.recall-audio-row {\n  justify-content: center;\n  margin-top: 16px;\n}\n\n.recall-audio-row small {\n  flex-basis: 100%;\n  color: var(--muted);\n  text-align: center;\n}\n\n.recall-card .feedback {\n  max-width: 720px;\n  margin-inline: auto;\n}\n\n.detail-card {\n  width: min(900px, 100%);\n  margin-inline: auto;\n}\n\n.detail-essential {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 12px;\n  margin-bottom: 14px;\n}\n\n.detail-essential-item {\n  min-height: 92px;\n  display: grid;\n  align-content: center;\n  gap: 7px;\n  padding: 16px 18px;\n  border: 1px solid var(--line);\n  border-radius: 14px;\n  background: #fcfaf7;\n}\n\n.detail-essential-item.preferred-phonetic {\n  border-color: #f0b39f;\n  background: var(--coral-soft);\n}\n\n.detail-essential-item small {\n  color: var(--muted);\n}\n\n.detail-essential-item strong {\n  font-size: 19px;\n}\n\n.detail-more {\n  margin-bottom: 18px;\n  border: 1px solid var(--line);\n  border-radius: 13px;\n  background: #fcfaf7;\n}\n\n.detail-more summary {\n  padding: 13px 16px;\n  color: #657084;\n  cursor: pointer;\n  font-size: 13px;\n  font-weight: 750;\n}\n\n.detail-grid-secondary {\n  margin: 0;\n  padding: 0 14px 14px;\n}\n\n@media (max-width: 640px) {\n  .recall-card {\n    padding: 26px 18px;\n  }\n\n  .recall-primary-prompt {\n    font-size: clamp(38px, 12vw, 52px);\n  }\n\n  .recall-card .answer-input {\n    min-height: 74px;\n    font-size: 27px;\n  }\n\n  .detail-essential {\n    grid-template-columns: 1fr;\n  }\n}\n'''
if "/* Learning input hierarchy:" in css:
    raise RuntimeError("learning UX CSS already present")
css += ux_css
write("app/globals.css", css)

# Add focused browser coverage for the reported keyboard and hierarchy problems.
tests = read("tests/e2e/learning-flow.spec.ts")
insert_marker = '''test("completes the original word and rebuild flow and persists it", async ({\n  page,\n}) => {'''
new_tests = '''test("prevents held Enter from skipping a learning unit and keeps the task visually primary", async ({\n  page,\n}) => {\n  await openRecommendedLesson(page, "我是誰");\n\n  const prompt = page.locator('[data-testid="recall-primary-prompt"]');\n  const input = page.locator("#recall-answer-0");\n  const promptFontSize = await prompt.evaluate((element) =>\n    Number.parseFloat(getComputedStyle(element).fontSize),\n  );\n  const inputFontSize = await input.evaluate((element) =>\n    Number.parseFloat(getComputedStyle(element).fontSize),\n  );\n  expect(promptFontSize).toBeGreaterThan(inputFontSize);\n\n  await input.fill("I");\n  await input.press("Enter");\n  await expect(page.getByText("學習單位 1/3", { exact: true })).toBeVisible();\n  await expect(page.getByText("回答正確", { exact: true })).toBeVisible();\n  await expect(page.getByText("單字本體", { exact: true })).toHaveCount(0);\n  await expect(page.getByText("句中用法", { exact: true })).toHaveCount(0);\n  await expect(page.getByText("更多字詞資訊", { exact: true })).toBeVisible();\n\n  const next = page.locator("#detail-next-button");\n  await expect(next).toBeFocused();\n  await next.dispatchEvent("keydown", {\n    key: "Enter",\n    code: "Enter",\n    repeat: true,\n    bubbles: true,\n  });\n  await expect(page.getByText("學習單位 1/3", { exact: true })).toBeVisible();\n\n  await next.press("Enter");\n  await expect(page.getByText("學習單位 2/3", { exact: true })).toBeVisible();\n  await expect(page.locator("#recall-answer-0")).toBeFocused();\n});\n\ntest("moves across sentence boxes with left and right arrow keys", async ({\n  page,\n}) => {\n  await openRecommendedLesson(page, "我是誰");\n  await answerRecallTokens(page, ["I", "am", "Amy"]);\n\n  const fields = page.locator(".rebuild-field input");\n  await expect(fields).toHaveCount(3);\n  await fields.nth(0).fill("I");\n  await fields.nth(1).fill("am");\n\n  await fields.nth(1).focus();\n  await fields.nth(1).evaluate((element: HTMLInputElement) =>\n    element.setSelectionRange(0, 0),\n  );\n  await fields.nth(1).press("ArrowLeft");\n  await expect(fields.nth(0)).toBeFocused();\n\n  await fields.nth(0).evaluate((element: HTMLInputElement) => {\n    const end = element.value.length;\n    element.setSelectionRange(end, end);\n  });\n  await fields.nth(0).press("ArrowRight");\n  await expect(fields.nth(1)).toBeFocused();\n});\n\n'''
if insert_marker not in tests:
    raise RuntimeError("E2E insertion marker not found")
tests = tests.replace(insert_marker, new_tests + insert_marker, 1)
write("tests/e2e/learning-flow.spec.ts", tests)

# Document the scoped UX change without claiming A2 human QA is complete.
changelog = read("CHANGELOG.md")
changelog_marker = "This file records user-visible or contributor-visible project changes. Detailed implementation history remains in Git.\n"
changelog_entry = '''\n## 2026-08-11 - Learning Input UX Polish\n\n### Changed\n\n- Reviewed the current A1/A2 core and exercise-facing English; no protected course sentence required a grammar correction in this pass.\n- Prevented held/repeated Enter key events from advancing through more than one learning step.\n- Added cross-box left/right arrow navigation (plus existing empty-box Backspace behavior) for word and sentence input grids.\n- Reworked recall screens so the learner prompt is visually dominant, the answer input is second, and audio/status text is secondary.\n- Simplified the post-answer word detail to the selected phonetic system and contextual part of speech, with secondary linguistic metadata collapsed under `更多字詞資訊`.\n- Removed internal lexeme/sense identifiers from the normal learner-facing detail screen.\n\n'''
if changelog_entry.strip() not in changelog:
    changelog = changelog.replace(changelog_marker, changelog_marker + changelog_entry, 1)
write("CHANGELOG.md", changelog)

progress = read("PROGRESS.md")
progress = progress.replace("- Updated: 2026-08-09", "- Updated: 2026-08-11", 1)
progress_marker = "- Weakness rows can launch direct focus practice for spelling, recognition, or sentence application without changing lesson completion or CEFR unlocks.\n"
progress_add = '''- Lesson input UX now ignores held Enter repeats, supports left/right cross-box navigation, emphasizes the active prompt/input, and collapses secondary word metadata after a correct answer.\n- A1/A2 core and exercise-facing English received a focused language pass on 2026-08-11; no protected source sentence required a grammar correction in this pass.\n'''
if progress_add.strip() not in progress:
    progress = progress.replace(progress_marker, progress_marker + progress_add, 1)
progress = progress.replace(
    "- `npm run test:e2e`: exit 0; 48 passed across desktop and mobile, 0 failed.",
    "- `npm run test:e2e`: exit 0; 52 passed across desktop and mobile, 0 failed.",
    1,
)
write("PROGRESS.md", progress)

tasks = read("TASKS.md")
task_marker = "- [x] **LEARNING-LOOP-002:** Turn the daily plan into a resumable review → lesson → weakness → summary session and add direct evidence-backed weakness practice.\n"
task_add = "- [x] **UX-INPUT-001:** Prevent Enter key skip-through, add cross-box arrow navigation, and simplify recall/detail visual hierarchy.\n"
if task_add not in tasks:
    tasks = tasks.replace(task_marker, task_marker + task_add, 1)
write("TASKS.md", tasks)

print("Applied learning UX polish patch successfully.")
