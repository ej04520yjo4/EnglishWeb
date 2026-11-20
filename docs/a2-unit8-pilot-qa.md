# A2 第八單元試行 QA：問題與簡單解決方式

## 範圍與狀態

2026-10-27 依使用者明確要求，新增且只新增 `a2-u08`。A1 與 A2 單元 1–7 的課程、穩定 ID、進度及資料模型保持不變；不新增單元 9／10，也不啟用 B1／B2。A2 現為 8 單元、32 課、195 個 word occurrences。

本單元所有 CSV／JSON 資料均為 `pilot_review_required`，音訊為 `pending`。英文、台灣繁體中文、CEFR 難度、KK／IPA、語塊說明及實際學習效果仍待人工複核；自動驗證不等於人工核准。正式來源仍是 `public/data/a2-course-v1.csv`、`a2-pattern-exercises.json` 與 `a2-reading-exercises.json`，由產生器重建。

## 四課與先備內容

| 課程 | 英文核心句／繁中 | 字數 | 本課新 canonical lexeme |
|---|---|---:|---|
| `a2-u08-l01` 描述工作上的問題 | `I have a problem at work.`／我在工作上遇到一個問題。 | 6 | `problem` |
| `a2-u08-l02` 說明疲累的原因 | `I am tired because I work at night.`／我因為晚上工作而很累。 | 8 | `tire`、`because` |
| `a2-u08-l03` 提出休息建議 | `You should take a break.`／你應該休息一下。 | 5 | `break` |
| `a2-u08-l04` 表達因果結果 | `I am tired, so I take a break.`／我很累，所以休息一下。 | 8 | `so` |

`tired` 是句中實際答案與顯示形式，但 `lemma`／`lexeme_id` 使用 `tire`；`context_pos` 是 adjective，`sense_id` 表示「疲累」語境，與名詞 `tire`（輪胎）分開。這是既有 canonical identity 規則，不是新增一個 `tired` 3000 目標。

### 語塊

- `have-a-problem`：有一個問題
- `at-work`：在工作上
- `take-a-break`：休息一下
- `at-night`：在晚上（沿用既有語塊）

語塊只提供整體理解與說明；每個 `answer` 仍是一個英文單字，不能把整個語塊放入單一作答格。

## 句型換字

每課有兩題、共八題，均使用已教或本課已教的 lexeme／chunk，並由 ordered slots 驗證。

1. `I have a problem at home.`／我在家遇到一個問題。
2. `I have a problem at school.`／我在學校遇到一個問題。
3. `I am tired because I clean at night.`／我因為晚上整理而很累。
4. `I am tired because I work on Saturday.`／我因為星期六工作而很累。
5. `I should take a break.`／我應該休息一下。
6. `We should take a break.`／我們應該休息一下。
7. `I am tired, so I take a break at home.`／我很累，所以在家休息一下。
8. `I am tired, so I take a break now.`／我很累，所以現在休息一下。

## 閱讀辨識與文字選答

四課各有一題 `reading-recognition` 與一題 `text-response`，每題四個選項，所有資料仍為 `pilot_review_required`。Unit 8 lesson 4 的文字選答正確句是：

`I am tired, so I take a break.`

為避免「在家／現在」只是目標句的細節加法，三個干擾句固定為不同且已教過的核心句：

- `I am tired because I work at night.`
- `You should take a break.`
- `I have a problem at work.`

這三個選項保留逐字 prerequisite metadata；不以語意相近的 transfer 取代真正不同的選項。

## 綜合短文 `a2-u08-p01`

1. `I have a problem at work.`／我在工作上遇到一個問題。
2. `I am tired because I work at night.`／我因為晚上工作而很累。
3. `I am tired, so I take a break.`／我很累，所以休息一下。
4. `I take a break at home.`／我在家休息一下。
5. `I have some water.`／我喝一些水。

### 閱讀理解

1. 這個人在哪裡遇到問題？→ `At work.`（第一句）
2. 這個人什麼時候工作？→ `At night.`（第二句）
3. 根據第二、三句，這個人晚上工作覺得累，因此做了什麼？→ `Take a break.`（第二、三句共同支持）
4. 這個人在哪裡休息？→ `At home.`（第四句）

每題選項均附 lexeme／chunk 先備資料；答案必須由文章證據支持，不把醫療診斷或未教的 `because of` 加入內容。

## 發音與人工複核

`tired` 的 CMUdict ARPAbet 候選為 `T AY1 ER0 D`，來源固定於 [CMUdict commit 74790861](https://raw.githubusercontent.com/cmusphinx/cmudict/74790861f652b15e4ac49015a90074ad62a27690/cmudict.dict)。這只是候選音標來源；KK／IPA、詞義、重音、台灣用語與音訊仍待人工確認，未把候選標成 `ready`，也未宣稱已有獨立音檔。

## 解鎖、驗證與試用

- 正常模式須依序完成／通過 A2 單元 7，才可進入單元 8；QA 預覽只供檢查，不改寫 `passedLevelIds`、A1／A2 其他進度或 3000 詞彙證據。
- 產生器 `node scripts/create-a2-pilot-exercises.mjs` 在最後干擾選項修正後已成功執行（exit 0）。
- 最後修正前的乾淨分支 `npm run verify` exit 0、288 個單元測試通過；Unit 8 focused Playwright 為 8／8（桌面 4、手機 4）。
- 最後修正後，兩個產生器重跑的三份 A2 檔案均逐位元組不變；focused 資料測試 56／56 通過。D 槽整合版 `npm run verify` exit 0、295 個單元測試通過（包含保留的 7 個備份復原測試），build／lint／TypeScript 均通過；Windows 啟動器 7／7、exit 0。
- 最終完整瀏覽器矩陣 **272／272 通過**（桌面 1440×900：136；手機 375×812：136），exit 0、失敗 0、跳過 0、重試 0，耗時 10.3 分鐘。實際指令：`node node_modules/@playwright/test/cli.js test --config tmp/unit8-playwright.config.ts --workers=2`；完整紀錄在 `tmp/unit8-integrated-e2e-final.log`。
- 標準 `npm run test:e2e` 啟動器在沙箱中因本機連線 `EACCES` 退出 1，授權重跑又因固定等待 4173、實際網址為 4174 而退出 1；兩次均未執行瀏覽器案例。最終成功使用忽略追蹤的暫存設定，對實際 4174 網址執行完整矩陣，未改動正式測試器或略過案例。固定埠號問題仍列入 `E2E-ACTUAL-PORT-001`，不可宣稱原啟動器本身已通過。
- 首輪實際網址回歸發現舊測試以 `1/32 課` 全域搜尋，現在 A1／A2 同為 32 課會匹配兩個元素。已改成逐一指定 A1／A2 區塊，仍檢查兩種進度；首輪停止（exit 1）後完整重跑通過。新單字詳情的桌面／手機截圖已查看，沒有水平溢位或文字、按鈕裁切；暫存截圖助手曾因未等待 A2 載入而逾時，加入載入等待後 exit 0。
- Unit 8 英文、繁中、比較／因果提示強度、`tired` 詞性與 KK／IPA、文章自然度，以及實際 Windows／手機試用仍待人工 QA。完成自動測試不等於內容通過審核。
- 本輪停止於單元 8；在使用者試用與人工複核前，不建立單元 9／10。

## 發布與既有修改保護

- 第 7 單元透過 [PR #18](https://github.com/ej04520yjo4/EnglishWeb/pull/18) 正常合併並推送，合併 commit 為 `855693667b75fe4b815614eb09f3a7e0e06dec9b`。GitHub 兩項必要檢查通過：284 個單元測試、254 個瀏覽器案例。
- 2026-10-29 使用者要求推送第 8 單元；本次以 `D:\Codex\Tools\EnglishWeb\a2-unit8-development` 的 `codex/a2-problems-solutions-unit8` 分支隔離提交，不合併 `main`。原 `english-learning-app` 的 30 個未提交檔案完整保留；本機與遠端 `main` 仍保留上述第 7 單元版本。
- 原本未提交的備份復原功能仍保持本機修改：7 個程式／測試／package 檔案與原始快照逐位元組一致，8 份重疊文件已合併保留。`backups\before-a2-unit7-20261027`、`backups\before-unit7-publication-20261027` 與具名 stash 均保留，沒有將備份復原功能混入 PR #18。
- 試用第 8 單元請用一般「啟動英句練習.bat」；更新啟動器會因未提交修改而停止，這是保護措施，不要強制覆蓋。
- 上述 295／272 是 2026-10-27 含本機備份功能的歷史整合結果。2026-10-29 乾淨分支重驗：`npm run verify` exit 0、288 項單元測試通過；第 8 單元與 A1／A2 進度保留的 focused E2E exit 0、10 項通過（桌面／手機各 5）。完整矩陣本輪未重跑。既有 GitHub Actions 只對 main push／pull request 啟動，功能分支 push 不代表已跑 GitHub CI。

## 第 8 單元修改檔案

新增：

- `docs/a2-unit8-pilot-qa.md`
- `tests/e2e/a2-problems.spec.ts`

修改：

- `public/data/a2-course-v1.csv`
- `public/data/a2-pattern-exercises.json`
- `public/data/a2-reading-exercises.json`
- `public/data/course-catalog.json`
- `scripts/create-a2-pilot-data.mjs`
- `scripts/create-a2-pilot-exercises.mjs`
- `app/curriculum/validation.ts`（僅單元顯示說明）
- `tests/a2-pilot.test.mjs`
- `tests/vocabulary-targets.test.mjs`
- `tests/e2e/a2-experiences.spec.ts`
- `tests/e2e/a2-household.spec.ts`
- `tests/e2e/learning-flow.spec.ts`
- `docs/a2-curriculum-blueprint.md`
- `ARCHITECTURE.md`、`CHANGELOG.md`、`DECISIONS.md`、`MEMORY.md`、`PLAN.md`、`PROGRESS.md`、`README.md`、`TASKS.md`

沒有修改 A1 CSV、A2 單元 1–7 內容、3000 單字資料、既有畫面配置或正式進度模型。
