# 英句練習

英句練習是一個以繁體中文操作、鍵盤優先的英文學習網站。學習流程從單字回想開始，逐步進入片語、句型、完整句子與短篇文章，目標是建立可實際運用的英文句子能力。

目前正式課程為 CEFR A1，共 8 個單元、32 課與 145 個單字出現位置。所有正式 A1 課程都由 `public/data/a1-course-v3.csv` 建立。A2 是唯一執行期試行程度，共 4 單元、16 課、95 個出現位置。B1／B2 資料保留供稽核，但目前停用、不載入也不顯示。試行完成不等於正式通過程度。

## 主要功能

- A1／A2 課程目錄、程度切換與循序解鎖。
- 星期、一天時段、月份與家庭成員的相關字詞主題、搜尋、狀態篩選及課程詳情捷徑。
- 單字回想、三層提示、字義與片語說明。
- 句子重組、閱讀辨識、句型遷移與文章重組。
- KK 音標獨立練習區。
- 單字、語意、句型、句子與文章層級的本機進度。
- A1＋A2 canonical lexeme 目標、全站 exposure／recognition／spelling／application 證據與跨日熟練判定。
- 今日學習 2.0：依序完成到期複習、目前課程、最多三個弱點加強；F5 或關閉頁面後可在同一天繼續，隔天自動失效。
- 弱點中心可直接進入拼寫、辨認或句子運用練習，且不會偽造課程完成或程度通過。
- Excel、CSV、JSON 課程資料匯出與驗證匯入。
- 桌面與手機瀏覽器流程測試。

## Windows 一鍵使用

- 第一次請雙擊「啟動英句練習.bat」
- 更新 GitHub 版本請雙擊「更新並啟動英句練習.bat」

在 EnglishWeb 工作區第一層也提供同名入口檔；雙擊後會轉交給 `english-learning-app` 內的正式啟動器，因此兩個位置都可以使用。
- 關閉終端機即可停止本機網站

啟動器會處理 UTF-8 中文路徑、Node.js、依賴安裝、連接埠選擇與瀏覽器開啟。若工作目錄有尚未提交的變更，更新版不會強制覆蓋。

## 開發指令

需要 Node.js 22.13 或更新版本。

```powershell
npm ci
npm run check:context
npm run audit:project
npm run audit:vocabulary
npm run report:vocabulary
npm run validate:curriculum
npm run verify
npm test
npm run dev
npm run build
npm run test:unit
npm run test:e2e
npm run lint
npx tsc --noEmit --incremental false
```

`npm run verify` 是本機與 GitHub CI 共用的品質門檻；`npm test` 會再加跑完整桌面／手機 Playwright。

預設開發網址為 `http://localhost:3000`；若連接埠被占用，啟動器會選擇其他可用連接埠。

## 專案結構

- `app/`：介面、課程載入、學習流程與進度邏輯。
- `public/data/a1-course-v3.csv`：唯一正式 A1 課程來源。
- `public/data/a2-course-v1.csv`：需人工複核的 A2 試行課程來源。
- `public/data/b1-course-v1.csv`、`public/data/b2-course-v1.csv`：保留但停用的試行資料，只由直接稽核與資料測試讀取。
- `public/data/course-catalog.json`：各程度的狀態、資料檔與版本目錄。
- `public/data/vocabulary-targets-v1.json`：A1＋A2 canonical lexeme 目標契約；目前是分批審核中的 partial baseline。
- `public/data/a1-pattern-exercises.json`：人工審核的句型練習。
- `public/data/a1-reading-exercises.json`：人工審核的閱讀練習。
- `public/data/a2-pattern-exercises.json`、`public/data/a2-reading-exercises.json`：A2 試行練習與文章。
- `public/data/b1-pattern-exercises.json`、`public/data/b1-reading-exercises.json`：B1 試行練習與文章。
- `public/data/b2-pattern-exercises.json`、`public/data/b2-reading-exercises.json`：B2 試行練習與文章。
- `docs/b1-b2-curriculum-overview.md`：B1／B2 規模、單元與人工 QA 邊界。
- `docs/a2-curriculum-blueprint.md`：A2 十單元路線；單元 5–10 只保留規劃，不是正式課程資料。
- `public/data/vocabulary-groups-v1.json`：相關字詞主題、排序、語塊與用法提醒。
- `public/data/reference-vocabulary-v1.json`：正式課程尚未提供的 reference-only 詞彙。
- `docs/a1-a2-vocabulary-3000-plan.md`：3000詞目標、來源、批次審核、計數及熟練規則。
- `tests/`：單元、內容與 Playwright 瀏覽器測試。
- `docs/`：產品規格、內容計畫與工作流程。
- `scripts/`：QA、啟動與開發輔助工具。

## Context Engineering 工作方式

本專案不以聊天紀錄作為唯一記憶。每次工作開始前，依序閱讀：

1. `AGENTS.md`
2. `PLAN.md`
3. `PROGRESS.md`
4. `DECISIONS.md`
5. `TASKS.md`
6. 相關的 `MEMORY.md` 與 `ARCHITECTURE.md`

工作完成後，依實際變動更新 `PROGRESS.md`、`TASKS.md`，必要時再更新 `DECISIONS.md`、`PLAN.md`、`CHANGELOG.md`、`MEMORY.md` 或 `ARCHITECTURE.md`。

完整規則與新對話交接範本請見 [Context Engineering 工作流程](docs/context-engineering-workflow.md)。

## 課程資料原則

- 一般作答列一次只接受一個英文單字。
- 多字片語使用 `chunk_*` 保留整體語意，不直接合併成單一作答框。
- 顯示詞性使用 `context_pos`。
- 單字進度使用 `lexeme_id`；語境差異使用 `sense_id`。
- 不抓取 Oxford、Cambridge 等受保護字典內容。
- 音訊必須保留來源、授權與 QA 狀態。
- A2 試行內容必須通過人工語言 QA，才可升為正式課程；B1／B2 目前固定為 disabled。
- 相關字詞優先使用正式課程資料；只有明確開啟詳情會記錄 exposure，且不等於辨認、拼寫、完成、通過或精通。
- 3000 只計 canonical 單字；occurrence、word form、sense 與 chunk 分開統計。
