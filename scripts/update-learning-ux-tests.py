from pathlib import Path

root = Path(__file__).resolve().parents[1]

# Regression fix: the third failed recall attempt must reveal the answer even when
# the typed spelling is close enough to trigger the near-miss feedback branch.
page_path = root / "app" / "page.tsx"
page = page_path.read_text(encoding="utf-8")
old_recall_feedback = '''    if (\n      clean(recallAnswer).length > 1 &&\n      editDistance(clean(recallAnswer), clean(currentToken.answer)) <= 2\n    ) {\n      setFeedback("拼字很接近，再檢查一次。");\n    } else if (nextAttempt === 1) {\n      setFeedback(`字母數：${patternFor(currentToken.answer)}`);\n    } else if (nextAttempt === 2) {\n      setFeedback(`第一個字母：${currentToken.answer.trim()[0]}`);\n      playTokenAudio(currentToken, 1, false);\n    } else {\n      setFeedback(`正確答案是 ${currentToken.answer}。請重新輸入一次。`);\n      setRecallAnswerRevealed(true);\n    }\n'''
new_recall_feedback = '''    if (nextAttempt >= 3) {\n      setFeedback(`正確答案是 ${currentToken.answer}。請重新輸入一次。`);\n      setRecallAnswerRevealed(true);\n    } else if (\n      clean(recallAnswer).length > 1 &&\n      editDistance(clean(recallAnswer), clean(currentToken.answer)) <= 2\n    ) {\n      setFeedback("拼字很接近，再檢查一次。");\n    } else if (nextAttempt === 1) {\n      setFeedback(`字母數：${patternFor(currentToken.answer)}`);\n    } else {\n      setFeedback(`第一個字母：${currentToken.answer.trim()[0]}`);\n      playTokenAudio(currentToken, 1, false);\n    }\n'''
if old_recall_feedback in page:
    page = page.replace(old_recall_feedback, new_recall_feedback, 1)
elif new_recall_feedback not in page:
    raise RuntimeError("recall feedback block not found")
page_path.write_text(page, encoding="utf-8", newline="\n")

path = root / "tests" / "rendered-html.test.mjs"
text = path.read_text(encoding="utf-8")

text = text.replace(
    'assert.match(page, /按空白鍵換到下一格/);',
    'assert.match(page, /空白鍵／→ 前往下一格/);',
)
text = text.replace(
    'assert.match(page, /最後一格按 Enter 檢查答案/);',
    'assert.match(page, /最後一格按 Enter 檢查/);',
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
    '  const thirdAttemptGuard = page.indexOf("if (nextAttempt >= 3)");\n'
    '  const nearMissCheck = page.indexOf("editDistance(clean(recallAnswer)", thirdAttemptGuard);\n'
    '  assert.ok(thirdAttemptGuard >= 0);\n'
    '  assert.ok(nearMissCheck > thirdAttemptGuard);\n'
)
if extra not in text:
    if marker not in text:
        raise RuntimeError("rendered-html recall marker not found")
    text = text.replace(marker, marker + extra, 1)

path.write_text(text, encoding="utf-8", newline="\n")
print("Updated learning UX assertions and third-attempt recall reveal behavior.")
