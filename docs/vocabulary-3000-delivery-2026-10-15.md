# 3000 單字庫交付與驗證

## 本輪完成範圍

- 分支：`codex/vocabulary-3000`；起點為已發布的 `c90b145`。
- 原有 132 個目標物件完整保留，新增 2868 個不同的 canonical headword，合計 3000。
- 1500 個主動目標、1500 個辨認目標；A1 候選階段 1200、A2 候選階段 1800。這是規劃分配，不是官方 CEFR 認證。
- 60 頁，每頁 50 字，可搜尋英文、繁中及定義，篩選候選階段與學習目標。
- 每張卡可進入辨認或拼字練習。英文拼字定義會遮蔽完整答案；三次錯誤後揭示並要求重輸入。
- 同一字、日期與模式只採第一次作答；貼上、揭示與同日重試不會灌入乾淨拼字／辨認證據。
- 新字庫只寫 global `vocabularyProgress`，不創造課程完成、測驗通過、複習排程或句子應用證據。
- 延後至第一次開啟字庫才下載詞義資料；本次頁面使用期間重用已驗證資料。
- 瀏覽器不支援語音時停用播放並顯示訊息。未提供虛構音訊網址或音標。

## 內容來源與限制

新增字中 2706 筆有 NGSL 頻率排序，162 筆為實用補充候選。728 筆新字採原創短定義修正，其餘 2140 筆使用 WordNet 與 Chinese Open WordNet 的相同 synset 對照。來源 SHA-256、版本、轉換規則、原始授權通知及可離線重建的快照均保留，詳見[來源套件](../data-sources/vocabulary-3000/README.md)。

自動驗證與機器輔助查核不等於人工語言審核。全部資料維持 `pilot_review_required`，總表是 `count_complete_review_required`，不是 `complete`。既有 132 筆來源授權待釐清的狀態沒有被悄悄清除。

收錄 3000 字不表示使用者已熟悉 3000 字。辨認仍需跨日證據，主動熟練另需乾淨拼字與真實句子應用；新字的句子應用題仍待後續逐批建立。新字庫 KK／IPA 未製作，不能視為音標課程已完成。

## 保護範圍

- A1 正式來源仍為 8 單元／32 課／145 occurrences，CSV、練習 JSON 未修改。
- A2 仍為 pilot，5 單元／20 課／122 occurrences，CSV、練習 JSON 未修改。
- B1／B2 保留 disabled，沒有新增課程或開放程度。
- 原有四個相關字詞主題與 27 筆 reference records 未修改。
- v1 的 132 個 target 物件保持相同；進度仍為 schema v6。
- 另一份 D 槽工作目錄及其未提交修改未觸碰。

## 實際驗證

| 指令 | Exit code | 結果 |
|---|---:|---|
| `npm run check:context` | 0 | 10 份文件通過 |
| `npm run audit:project` | 0 | 4 levels、814 occurrences、0 orphan/duplicate data files |
| `npm run check:vocabulary-build` | 0 | 三份產物可重現，3000／60 批 |
| `npm run audit:vocabulary` | 0 | 3000 unique、1500 active／1500 receptive、132 舊物件保留 |
| `npm run report:vocabulary` | 0 | 正式課程 108、reference-only 24、獨立字庫新增 2868 |
| `npm run validate:curriculum` | 0 | A1／A2／停用的 B1、B2 結構全部通過 |
| `npm run build` | 0 | Vinext 五階段建置通過 |
| `npm run test:unit` | 0 | 215 passed、0 failed／skipped |
| `npm run lint` | 0 | ESLint 通過 |
| `npx tsc --noEmit --incremental false`（由 `typecheck` 執行） | 0 | TypeScript 通過 |
| `npm run verify` | 0 | 以上 10 道品質關卡依序通過 |
| 字庫專項 Playwright | 0 | 20 passed：桌面 10、手機 10 |
| 完整 `npm run test:e2e` | 0 | 166 passed：桌面 83、手機 83，0 failed／skipped，8.1 分鐘 |
| `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-windows-launcher.ps1` | 0 | 7 種啟動情境通過 |
| `npm audit --json` | 1 | 29 affected packages：1 critical／24 high／2 moderate／2 low |

本輪初次瀏覽器啟動受沙箱 Workers runtime 限制，exit 1，沒有測到瀏覽器案例；獲准啟動本機 Chrome／localhost 後執行實測。字庫首輪 14 passed／2 failed，原因是測試在已位於第一頁時點擊停用的第一頁按鈕；修正測試操作並新增貼上／語音備援案例後，20 項通過。沒有刪除或降低測試。

完整瀏覽器首輪為 exit 1，164 passed／2 failed；兩個失敗皆為原有備份測試仍期待舊版「清單仍在分批建置」文字。更新為實際的 3000／3000 與待人工複核狀態，保留備份內容及還原斷言後，重新完整執行得到以上 166 項通過。桌面 1440×900 與手機 375×812 的實際畫面亦已檢視，未見水平溢位。

啟動器的七種情境包含已安裝／未安裝依賴、缺少 Node、安裝失敗、連接埠占用、中文與空白路徑、Git 未提交修改；安裝分支使用隔離的假指令測試，不宣稱在全新機器完成實際網路安裝。本輪實際新增開發相依套件安裝成功，但沒有執行全專案 `npm ci`。

修改前未在本輪重跑完整基準；196 unit／146 browser 是前一輪的歷史結果，不宣稱為本輪新執行的基準。

套件安全警示主要包含既有 `next@16.2.6`，本輪新增的 dev-only `opencc-js@1.3.1` 無稽核警示。尚未分析這些 Next 路徑在 Vinext 中的可達性，也未做框架升級；因此不宣稱安全掃描通過或可直接公開部署。

上游授權文字保留原文，包括其行尾空白；自有程式、資料與文件另做 whitespace 檢查。最後僅移除四個檔案的多餘結尾空行並更新來源 manifest 雜湊，兩份 runtime JSON 內容未變。

## 下一步

使用者先試第一頁 50 字，記錄不自然或歧義的中文／定義，再逐批複核。新 active 字需要自然且已教前置內容的句子應用題；詞義確認後再製作 KK／IPA 與合法音訊。相依套件安全升級應另開一個相容性驗證批次。

## 提交與檔案範圍

- `2fedd3b`：資料來源、可重現產生器、3000 字目標／詞義、授權通知、純函式練習引擎與單元測試。
- `7b664d7`：搜尋與練習介面、延遲載入、進度串接，以及桌面／手機瀏覽器回歸。
- 文件另行提交，與程式及大量產生資料分開。所有內容留在 `codex/vocabulary-3000`，未合併 main、未部署。

主要新增檔案：`app/vocabulary-library.ts`、`app/vocabulary-library-panel.tsx`、兩份 `public/data/vocabulary-*.json` v2／library 產物、`data-sources/vocabulary-3000/`、`public/licenses/vocabulary-3000/`、三份來源／建置腳本，以及 library、catalog 與 Playwright 測試。

修改檔案：`app/page.tsx`、`app/globals.css`、`app/vocabulary-targets.ts`、詞彙稽核／報告腳本、`package.json`／lock、`.gitignore`、既有 E2E 的版本路徑／狀態文字，以及 README 與 Context Engineering 文件。正式課程資料、Windows 啟動器、部署設定未修改。
