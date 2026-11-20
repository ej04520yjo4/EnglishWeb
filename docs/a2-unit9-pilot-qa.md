# A2 第九單元試行 QA：社交、邀請與回應

## 範圍與保護

2026-11-20 接續使用者「繼續做下面的課程」要求，只建立 `a2-u09`。A2 現為 9 單元／36 課／225 個 occurrences；A1 保持 8／32／145，A2 單元 1–8 由列與題目物件雜湊保護。正式 CSV／JSON 路徑、欄位、既有 ID、進度 schema v6 及介面不變。不建立單元 10、不啟用 B1／B2。

工作分支：`codex/a2-social-invitations-unit9`，基底是已推送的 Unit 8 `a3348e7`，不是宣稱已合併的 main。原始 checkout 的 30 個未提交檔案與獨立 review-fixes 分支均不納入本輪。

所有新資料為 `pilot_review_required`。音訊 `pending`，來源 URL 留空，沿用既有瀏覽器語音備援。四個新單字的 KK／IPA 由專案已固定版本的 CMUdict 候選取得，不宣稱已人工核准、已生成音檔或完成學習成效驗證。

## 四課與新字量

| 課程 | 核心句／繁中 | 作答字數 | 新 lexeme |
|---|---|---:|---|
| `a2-u09-l01` 邀請一起吃晚餐 | Would you like to have dinner with me?／你想和我一起吃晚餐嗎？ | 8 | 0 |
| `a2-u09-l02` 熱情接受邀請 | I would love to have dinner with you.／我很樂意和你一起吃晚餐。 | 8 | `love` |
| `a2-u09-l03` 禮貌婉拒與說明原因 | I am sorry, but I have to work.／抱歉，但我得工作。 | 8 | `sorry`、`but` |
| `a2-u09-l04` 提出替代安排 | Can we meet on Saturday instead?／我們可以改成星期六見面嗎？ | 6 | `instead` |

逐字作答、語塊整體理解保持分層。新增語塊 `have-dinner`（吃晚餐）、`would-love-to`（很樂意／很想要）、`with-you`（和你一起）、`i-am-sorry`（抱歉）。沿用 `would-you-like-to`、`with-me`、`have-to`、`on-saturday`。`have dinner` 的 have 不是擁有；`would love to` 不解釋為浪漫的愛。`me` 沿用舊課程 ID，3000 目標的 canonical projection 仍為 `i`。

新增句型：`would-you-like-invitation`、`would-love-acceptance`、`sorry-but-obligation`、`alternative-arrangement`。原藍圖的 `I cannot..., but...` 改採「先說抱歉，再說必須工作」，重用已教的 `have to`；沒有額外導入 could 或否定縮寫。

## 八題句型換字

1. Would you like to watch TV with me?／你想和我一起看電視嗎？
2. Would you like to have breakfast with me?／你想和我一起吃早餐嗎？
3. I would love to watch TV with you.／我很樂意和你一起看電視。
4. I would love to have breakfast with you.／我很樂意和你一起吃早餐。
5. I am sorry, but I have to clean my room.／抱歉，但我得整理房間。
6. I am sorry, but I have to wash the dishes.／抱歉，但我得洗碗。
7. Can we meet on Tuesday instead?／我們可以改成星期二見面嗎？
8. Can we meet tomorrow instead?／我們可以改成明天見面嗎？

每課另有一題四選一英文閱讀辨識與一題四選一中文情境選答。英文干擾句使用當課或前面已教過的核心句，避免只是多加日期／地點、仍可正確回應的近義選項。所有選項保留先備 lexeme／chunk metadata；不關閉 slot 或提前內容驗證。

## 六句對話 `a2-u09-p01`

甲乙標籤僅置於繁中提示，英文輸入不需加入人物標籤。

1. Would you like to have dinner with me on Friday?／甲：你想星期五和我一起吃晚餐嗎？
2. I am sorry, but I have to work on Friday.／乙：抱歉，但我星期五得工作。
3. Can we meet on Saturday instead?／甲：我們可以改成星期六見面嗎？
4. I would love to have dinner with you.／乙：我很樂意和你一起吃晚餐。
5. Can we meet at seven?／甲：我們可以七點見面嗎？
6. I can meet at seven on Saturday.／乙：我可以星期六七點見面。

| 閱讀理解 | 答案 | 證據句 |
|---|---|---|
| 甲邀請乙一起吃哪一餐？ | Dinner. | 1 |
| 乙星期五必須做什麼？ | Work. | 2 |
| 根據第二、三、六句，乙星期五要工作，最後約定改在哪一天見面？ | On Saturday. | 2、3、6 |
| 乙最後確認幾點可以見面？ | At seven. | 6 |

## 解鎖與進度

正常模式需先通過 A1 程度測驗，並依序通過 A2 第 8 單元後進入第 9 單元。QA 試行顯示不會偽造 `passedLevelIds` 或前一單元完成。四課後有第 9 單元測驗；通過只寫該單元，不標記 A2 全程度通過、不解鎖 B1。所有統計及複習沿用既有多程度 localStorage。

## 驗證紀錄

- 修改前 `npm run verify`：exit 0，288 單元測試通過，0 失敗／略過；12 個 gate 全部完成。
- 兩個 A2 產生器與 `npm run validate:curriculum`：exit 0。
- 專用 A2 單元測試：exit 0，42 通過、0 失敗／略過。新增測試最初因測試呼叫缺少 level 參數及使用錯誤 order 欄名失敗，按既有 API 修正；未放寬驗證器。
- 第 9 單元 Playwright：exit 0，8 通過（桌面 4／手機 4），29.3 秒。四課、八換字題、對話、四題理解、單元測驗、F5 全統計保留、切回 A1 不變、窄螢幕無溢出均完成。
- 初次沙箱 browser 啟動：exit 1，localhost `EACCES`，尚未執行測試。取得權限後標準 `npm run test:e2e` 包裝器成功，沒有使用替代 port 或臨時測試 config。
- `npm run verify`：exit 0，12 個 gate 全部完成，293 單元測試通過、0 失敗／略過；日誌 `tmp/unit9-final-verify.log`。
- 重跑兩個產生器：exit 0，CSV 與兩個題目 JSON 的 SHA-256 完全相同。再跑 A2 與來源保護測試：exit 0，61 通過、0 失敗／略過。
- Windows 啟動器測試：exit 0，7 情境通過，包括已安裝／未安裝依賴、缺 Node、安裝失敗、port 占用、中文空格路徑、髒工作目錄更新阻擋。
- 以獨立測試瀏覽器檢視 1440×900 課程地圖與 375×812 單字詳情；新中文提示、KK 與按鈕沒有水平裁切。截圖在 `tmp/unit9-*-map.png` 與 `tmp/unit9-*-detail.png`，不代表實體手機驗收。
- 原始 `english-learning-app` 的 30 個未提交檔案前後 SHA-256 與檔案清單完全相同；A1、套件鎖定、`app/page.tsx` 無 diff。發布範圍僅限第 9 單元分支，不含合併 `main` 或部署。
- 全站瀏覽器第一輪：270 通過（桌面 135／手機 135），8.4 分鐘；結果日誌 `tmp/unit9-full-e2e.log`。取回結束碼時工具 session 已失效，因此沒有據此宣稱該次 exit code。
- 最後重跑 `npm run test:e2e -- --workers=4`：**實際 exit 0，270 通過、0 失敗／略過**，6.4 分鐘；桌面 1440×900 與手機 375×812 各 135。沿用標準 wrapper，沒有更改 port 或 config。日誌 `tmp/unit9-final-e2e.log`。最後再次 `npm run lint` 也 exit 0。

`npm run verify` 內的必要指令均有實際執行，以下 exit code 由 `&&` 串接全部完成、主程序 exit 0 確認：

| 指令 | Exit code | 結果 |
|---|---:|---|
| `npm run check:context` | 0 | 10 份文件通過 |
| `npm run validate:curriculum` | 0 | A1 8／32／145；A2 9／36／225；保留 B1／B2 直接資料稽核 |
| `npm run build` | 0 | Vinext production build 完成 |
| `npm run test:unit` | 0 | 293 通過，0 失敗／略過 |
| `npm run lint` | 0 | ESLint 無錯誤 |
| `npm run typecheck` | 0 | 實際執行 `tsc --noEmit --incremental false` |

其餘六個 verify gate（project audit、vocabulary build/application/phonetic checks、vocabulary audit/report）也全部 exit 0；3000 目標／應用題／音標候選未被更改。沒有新增或升級套件，未重跑 `npm ci`；這不是依賴安全性認證。

## 本機試用入口

本輪在 `D:\Codex\Tools\EnglishWeb\a2-unit8-development` 完成；資料夾沿用舊名稱，實際分支是 `codex/a2-social-invitations-unit9`。請雙擊這個目錄內的 `啟動英句練習.bat`。需要直接檢查時可在設定開啟 A2 試行顯示；不會因此通過 A1 或第 8 單元。原始 `english-learning-app` 的啟動器沒有被改指向，也沒有覆蓋該處未提交修改。

## 人工試用與下一步

請試用邀請／接受／拒絕／改約的差異、中文提示是否清楚、六句對話是否自然，以及 `love`／`sorry`／`but`／`instead` 的 KK／IPA。尚未完成真實手機與真人學習評估；自動手機 viewport 測試不是實體裝置驗收。先收集這一單元回饋，再決定是否開始單元 10。

## 修改檔案

- 課程與註冊：`public/data/a2-course-v1.csv`、`public/data/a2-pattern-exercises.json`、`public/data/a2-reading-exercises.json`、`public/data/course-catalog.json`。
- 可重建來源：`scripts/create-a2-pilot-data.mjs`、`scripts/create-a2-pilot-exercises.mjs`。
- 單元標題說明：`app/curriculum/validation.ts`；不改動驗證規則與介面。
- 回歸測試：`tests/a2-pilot.test.mjs`、`tests/vocabulary-targets.test.mjs`、`tests/e2e/a2-experiences.spec.ts`、`tests/e2e/a2-household.spec.ts`、`tests/e2e/a2-problems.spec.ts`、`tests/e2e/learning-flow.spec.ts`；舊流程只更新 A2 總課數及最後單元邊界，保留既有測試。
- Context：`ARCHITECTURE.md`、`CHANGELOG.md`、`DECISIONS.md`、`MEMORY.md`、`PLAN.md`、`PROGRESS.md`、`README.md`、`TASKS.md`、`docs/a2-curriculum-blueprint.md`。
- 新增：本 QA 文件、`tests/e2e/a2-social.spec.ts`。
- `tmp/` 中的執行日誌、視覺驗證腳本及截圖是忽略的驗證產物，不屬於提交內容。
