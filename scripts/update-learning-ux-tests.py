from pathlib import Path

path = Path(__file__).resolve().parents[1] / "tests" / "rendered-html.test.mjs"
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
print("Updated rendered HTML assertions for the polished learning UX.")
