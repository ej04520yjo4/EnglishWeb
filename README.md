# 英句練習

英句練習是一個以繁體中文操作、鍵盤優先的英文學習網站。學習流程從單字回想開始，逐步進入片語、句型、完整句子與短篇文章，目標是建立可實際運用的英文句子能力。

目前正式課程為 CEFR A1，共 8 個單元、32 課與 145 個單字出現位置。所有正式 A1 課程都由 `public/data/a1-course-v3.csv` 建立。A2 是唯一執行期試行程度，共 6 單元、24 課、146 個出現位置；第六單元試行居家與日常家務。B1／B2 資料保留供稽核，但目前停用、不載入也不顯示。試行完成不等於正式通過程度。

## 主要功能

- A1／A2 課程目錄、程度切換與循序解鎖。
- 星期、一天時段、月份與家庭成員的相關字詞主題、搜尋、狀態篩選及課程詳情捷徑。
- 相關字詞搜尋支援課程字形與語塊：`brothers`、`my brother`、`我的哥哥` 可找到 `brother`；A2 資料載入後，`last night`／`昨晚` 可找到 `night`。搜尋不會改變學習進度。
- 相關字詞主題內可按「練習延伸單字辨認」：既有 24 個延伸單字每輪最多練 5 個，每字每天只記錄第一次作答；跨日答對兩次才算可以辨認，不會因此完成課程或獲得主動拼寫能力。內容仍待人工複核。
- 單字回想、三層提示、字義與片語說明。
- 句子重組、閱讀辨識、句型遷移與文章重組。
- A1 第三批附加練習已供試用：第 1 單元第 2 課、第 2 單元第 3 課、第 3 單元第 3 課、第 7 單元第 4 課。共 7 題換字、4 題閱讀與 4 題文字選答；姓名課使用兩個不同姓名選項。新內容仍待人工複核，複習題會標示來源句與實際句型。
- KK 音標獨立練習區。
- 3000 單字庫新增每字一題完整句子應用：看繁中情境及目標字輸入英文，三次錯誤後揭示並要求重打；貼上、看答案及同日重試不會補發乾淨應用證據。
- 每字可展開 KK／美式 IPA 候選及 CMUdict 來源。多音詞全部保留，不自動猜詞性；音節邊界與重音位置為推算，仍待人工複核，與獨立 KK 符號錄音不同。
- 單字、語意、句型、句子與文章層級的本機進度。
- A1＋A2 canonical lexeme 目標、全站 exposure／recognition／spelling／application 證據與跨日熟練判定。
- 今日學習 3.0：先完成最多五題主動複習（拼寫、辨認或正式句子運用），再進入目前課程與最多三個弱點加強；F5 可從第一個未完成項目續接，跨午夜立即失效。
- 今日總結使用可見且正在作答的 active study time；首頁、背景分頁、離線期間與單次超過五分鐘的閒置區段不計入。
- 弱點中心可直接進入拼寫、辨認或句子運用練習，且不會偽造課程完成或程度通過。
- 文字優先的日常對話試行：4 個情境、12 個學習者回合與 32 個準備語句；可選用美式英文口說轉文字，但不產生正式課程或詞彙證據，也不是口說／發音評分。
- Excel、CSV、JSON 課程資料匯出與驗證匯入。
- 桌面與手機瀏覽器流程測試。

## Windows 一鍵使用

- 第一次請雙擊「啟動英句練習.bat」
- 更新 GitHub 版本請雙擊「更新並啟動英句練習.bat」

在 EnglishWeb 工作區第一層也提供同名入口檔；雙擊後會轉交給 `english-learning-app` 內的正式啟動器，因此兩個位置都可以使用。
- 關閉終端機即可停止本機網站

啟動器會處理 UTF-8 中文路徑、Node.js、依賴安裝、連接埠選擇與瀏覽器開啟。若工作目錄有尚未提交的變更，更新版不會強制覆蓋。

## 對話練習邊界

正常模式仍遵守正式程度與 `requiredLessonIds` 前置條件；QA 預覽只供檢查，不會修改 `passedLevelIds`、課程完成、詞彙證據或複習排程。對話資料使用獨立的 `yingju-conversation-practice-v1` 儲存，並綁定本機日期與 source revision；提示、看答案與貼上狀態只在對話練習內計算，不能透過同日重新開始取得乾淨紀錄。協助完成隔日再複習，乾淨完成三日後再複習。

目前對話試行仍待使用者實際試用與英文／繁中 QA；不要將準備語句視為正式 A2 課程。對話頁可獨立下載紀錄備份，目前尚無對話備份匯入介面，也不會混入正式課程或進度備份。

### 可選用的口說輸入

在「對話練習」開始回合後，先閱讀隱私說明、勾選同意，再按「開始口說」。使用美式英文說出回應，按「停止辨識」或等候辨識結束。確認辨識文字後按「使用這段文字」，可在原輸入框修改，再按「檢查回應」；辨識不會自動送出答案。

- 使用瀏覽器內建 Web Speech API，不需要付費 API 金鑰。請優先在 Windows Chrome 使用 `localhost` 或 HTTPS；瀏覽器、系統、網路與辨識服務都可能影響可用性。
- 瀏覽器可能將聲音送到其服務供應商處理，不能保證離線或完全在本機執行。詳見 [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)。本網站不建立錄音檔、不保存辨識文字，只在獨立對話紀錄標示是否使用語音輸入。
- 只有按下開始才請求麥克風；可隨時取消，離開畫面或切到背景即取消，不會在重新整理或下一題自動啟動。
- 不支援、拒絕權限、沒有收到語音或網路錯誤時，顯示原因並保留打字流程。不會把辨識失敗當成答錯。
- 使用辨識文字的回合會單獨標示，不能算獨立拼寫或發音標準；不增加正式課程、CEFR 或 3000 單字熟練證據。
- 自動測試以模擬辨識事件檢查流程，不代表已完成真實麥克風／發音準確度測試。

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
- `public/data/vocabulary-targets-v2.json`：唯一runtime詞彙目標，3000個canonical單字；v1保留為132字基準。
- `public/data/vocabulary-library-v1.json`：3000字的繁中意思、英文定義、詞性與練習來源，全部仍待人工複核。
- `public/data/vocabulary-applications-v1.json`：3000 題原創雙語句子應用；由 `data-sources/vocabulary-3000/applications/batch-*.json` 的 60 批產生。
- `public/data/vocabulary-phonetics-v1.json`：3000 字的 CMUdict 音位轉寫候選；來源子集、雜湊與授權均保留，可離線重建。
- `public/data/a1-pattern-exercises.json`：A1 句型練習；第三批保留 `pilot_review_required`。
- `public/data/a1-reading-exercises.json`：A1 閱讀練習；第三批保留 `pilot_review_required`。
- `public/data/a2-pattern-exercises.json`、`public/data/a2-reading-exercises.json`：A2 試行練習與文章。
- `public/data/b1-pattern-exercises.json`、`public/data/b1-reading-exercises.json`：B1 試行練習與文章。
- `public/data/b2-pattern-exercises.json`、`public/data/b2-reading-exercises.json`：B2 試行練習與文章。
- `docs/b1-b2-curriculum-overview.md`：B1／B2 規模、單元與人工 QA 邊界。
- `docs/a2-curriculum-blueprint.md`：A2 十單元路線；單元 1–6 已有試行資料，單元 7–10 仍只保留規劃。
- `public/data/conversation-practice-v1.json`：獨立的文字對話試行來源，不是正式 A2 課程資料。
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

## 3000 單字庫

左側選「3000 單字庫」，可搜尋英文／中文、篩選候選階段與學習目標，每頁50字、共60頁。每張卡可練習辨認、拼字與完整句子應用，並展開KK／IPA候選；拼字或句子應用連續三次答錯後會顯示答案，重新輸入可完成，但不算乾淨拼字或應用證據。瀏覽、搜尋與翻頁不改進度。

已收錄3000字不表示你已熟悉3000字：辨認需跨日答對；主動熟練另外需要拼字及句子應用。每字每天只記首次作答；看答案、貼上或同日重試不會自動取得乾淨的句子應用證據。A1/A2標籤是候選學習階段，並非官方CEFR認證；詞義、翻譯與分級仍待人工複核。KK／IPA為保留來源音位的轉寫候選，尚待人工確認，不代表新增音檔。

來源、授權、SHA-256及重建方式見[詞庫來源說明](data-sources/vocabulary-3000/README.md)；完整授權通知隨網站放在`public/licenses/vocabulary-3000/`。

```powershell
npm run build:vocabulary
npm run check:vocabulary-build
npm run build:vocabulary-applications
npm run check:vocabulary-applications
npm run build:vocabulary-phonetics
npm run check:vocabulary-phonetics
```

一般建置不需下載字典。只有重做來源快照時才執行`npm run fetch:vocabulary-source`與`npm run prepare:vocabulary-source`，輸入雜湊不符就停止。
