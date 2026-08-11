from pathlib import Path

root = Path(__file__).resolve().parents[1]

path = root / "tests" / "rendered-html.test.mjs"
text = path.read_text(encoding="utf-8")

text = text.replace(
    'assert.match(page, /按空白鍵換到下一格/);',
    'assert.match(page, /空白鍵／→ 前往下一格/);',
)
text = text.replace(
    'assert.match(page, /中文提示｜直接回想單字/);',
    'assert.match(page, /把下面提示寫成英文/);',
)

marker = '  assert.match(page, /recall-word-grid/);\n'
extra = (
    '  assert.match(page, /把下面提示寫成英文/);\n'
    '  assert.match(page, /你的英文答案/);\n'
    '  assert.match(page, /event\\.repeat/);\n'
)
if extra not in text:
    if marker not in text:
        raise RuntimeError("rendered-html recall marker not found")
    text = text.replace(marker, marker + extra, 1)

path.write_text(text, encoding="utf-8", newline="\n")

# The generated browser test should assert the stable transition into the
# detail stage instead of depending on optional feedback copy.
e2e_path = root / "tests" / "e2e" / "learning-flow.spec.ts"
e2e = e2e_path.read_text(encoding="utf-8")
old = '  await expect(page.getByText("回答正確", { exact: true })).toBeVisible();\n'
new = '  await expect(page.locator("#detail-next-button")).toBeVisible();\n'
if old not in e2e:
    raise RuntimeError("expected generated feedback assertion not found")
e2e = e2e.replace(old, new, 1)
e2e_path.write_text(e2e, encoding="utf-8", newline="\n")

print("Updated rendered HTML and browser assertions for the polished learning UX.")
