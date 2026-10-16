# A2 Curriculum Blueprint

## Purpose

This blueprint reserves a ten-unit A2 route without creating hidden lessons. Units 1–6 have versioned pilot CSV/JSON data; unit 6 is a bounded pilot still awaiting learner and language QA, while units 7–10 remain planning notes.

## Ten-Unit Route

| Unit | Theme | Status |
|---|---|---|
| 1 | 昨天與明天 | Pilot data |
| 2 | 旅行與交通 | Pilot data |
| 3 | 購物與比較 | Pilot data |
| 4 | 健康與建議 | Pilot data |
| 5 | 工作與約會安排 | Pilot data |
| 6 | 居家與日常家務 | Bounded pilot data |
| 7 | 經驗與生活改變 | Blueprint only |
| 8 | 問題與簡單解決方式 | Blueprint only |
| 9 | 社交、邀請與回應 | Blueprint only |
| 10 | 綜合郵件、行程與生活故事 | Blueprint only |

## Pilot Unit 5

### Unit 5 — 工作與約會安排

- 溝通目標：安排工作時段、確認日期與改約。
- 主要文法：present continuous for arrangements、時間介系詞。
- 字彙領域：工作行程、日期、會面時間。
- 句型方向：`I am meeting...`、`Can we meet at...?`
- 短文類型：簡短行事曆與約會對話。
- 前置能力：單元 1 的未來計畫與單元 2 的時刻表達。

試行內容共有四課：安排明天與主管見面、確認星期與時段、說明會議時間、把會議改到其他日期。內容保持逐字拼寫、語塊整體理解，並附兩題句型換字、閱讀辨識、文字選答，以及四句文章與五題理解題。全部資料仍為 `pilot_review_required`。

## Pilot Unit 6

### Unit 6 — 居家與日常家務

Unit 6 now has versioned pilot CSV/JSON data with four lessons and remains `pilot_review_required`. It is not production content or human-approved CEFR material; the learner trial and language QA must finish before unit 7 receives formal data.

- 溝通目標：說明家務分工與日常頻率。
- 主要文法：adverbs of frequency、have to 複習。
- 字彙領域：房間、清潔、家務與頻率。
- 句型方向：`I usually...`、`I have to...`
- 短文類型：家庭日常與家務清單。
- 前置能力：A1 地點、日常活動及單元 4 的必要性表達。

## Deferred Unit Details

### Unit 7 — 經驗與生活改變

- 溝通目標：分享簡單經驗與前後改變。
- 主要文法：present perfect 入門、比較前後狀態。
- 字彙領域：生活事件、近期經驗與改變。
- 句型方向：`I have...`、`It is ... now.`
- 短文類型：短篇個人經驗。
- 前置能力：單元 1 的過去式與單元 3 的比較表達。

### Unit 8 — 問題與簡單解決方式

- 溝通目標：描述問題、說明原因並提出簡單做法。
- 主要文法：because、so、should 複習。
- 字彙領域：日常問題、原因、選擇與建議。
- 句型方向：`...because...`、`You should...`
- 短文類型：問題與解決步驟。
- 前置能力：單元 4 的建議與已學時間順序。

### Unit 9 — 社交、邀請與回應

- 溝通目標：邀請、接受、婉拒與提出替代安排。
- 主要文法：Would you like to…? 複習、can/could 回應。
- 字彙領域：社交活動、時間與禮貌回應。
- 句型方向：`Would you like to...?`、`I cannot..., but...`
- 短文類型：訊息往返與簡短對話。
- 前置能力：單元 1 的邀請與單元 5 的安排。

### Unit 10 — 綜合郵件、行程與生活故事

- 溝通目標：理解並回應短郵件、行程與連續生活事件。
- 主要文法：A2 已教時態、連接詞與比較句型整合。
- 字彙領域：郵件、行程、購物、交通、健康與社交。
- 句型方向：整合單元 1–9 已複核句型。
- 短文類型：短郵件、行程表與生活故事。
- 前置能力：完成並通過前九個 A2 單元。

## Progression Rules

- Each formal unit contains four lessons, one ordered passage, and a unit assessment.
- Ordinary recall remains one English word per answer; chunks preserve whole-phrase meaning.
- New lexemes should normally stay at four or fewer per lesson and recur later.
- Transfer and reading exercises may use only content taught by that lesson.
- Units unlock sequentially in learner mode. QA preview may inspect pilot units without changing pass records.
- Unit 6 is a bounded pilot and remains `pilot_review_required`; completing it never means completing all of A2 and never unlocks B1.
- Unit 7 must wait for the unit 6 learner trial and language QA; the conversation supplement does not count as a formal unit prerequisite or completion.

## Supplemental Conversation Practice

`public/data/conversation-practice-v1.json` is an isolated text-first supplement, not an additional A2 unit. It contains four everyday scenarios, 12 learner turns, and 32 preparation phrases. Required formal lessons and normal level prerequisites gate access; QA preview is non-mutating. Partner replies and accepted variants are explicitly taught preparation content, but they create no formal occurrence, vocabulary, CEFR, or review evidence. The supplement uses its own date/source-revision-bound storage and has no microphone, speech recognition, oral grading, or pronunciation scoring.

## Deferred Boundary

Units 7–10 must not receive formal lesson IDs, occurrence IDs, CSV rows, exercise JSON, or learner progress until units 1–6 finish manual English, Traditional Chinese, phonetic, difficulty, and browser-flow review. Unit 6 already has bounded pilot IDs and data, but must remain `pilot_review_required` until its learner and language QA is recorded; the pilot does not promote A2 to production or unlock B1.
