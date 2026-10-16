# 日常對話與 A2 居家單元交付紀錄

日期：2026-10-16。整合分支：`codex/everyday-conversation`，基底為 PR #14 正常合併後的 `01c904d`。本輪新增內容仍是 `pilot_review_required`，不是人工審核或口說能力認證。

## 本輪完成範圍

- A2 單元 6「居家與日常家務」：4 課、24 個逐字 occurrences、8 題換字、4 題閱讀辨識、4 題文字選答、5 句短文與 4 題閱讀理解。
- 獨立「對話練習」：自我介紹、購物、約時間、家務合作，共 4 情境、12 個作答回合、32 筆雙語準備語句。
- 先預習，再完整輸入回應；接受資料中明列的同義說法與縮寫。未符合參考回答不代表其他英文一定錯誤。
- 可選「先聽再看文字」、正常／慢速播放、練習禮貌請求重說與說慢一點。沒有麥克風、錄音、語音辨識或發音評分。
- 錯三次顯示參考回答，需重新輸入並明確按下一步；Enter 不連跳，重新整理保留當日未完成回合。
- 第一次獨立回應全部正確時，建議 3 個本地日期後複習；有提示、貼上、揭示或首次錯誤時隔天複習。請求重說是溝通策略，不視為答錯。

## 正式課程保護

A1 仍為 8 單元／32 課／145 occurrences，CSV 不變。A2 現為 6／24／146；原單元 1–5 的列與練習物件有獨立雜湊回歸保護。正式逐字 answer、chunk 分層、ID、順序、schema v6 進度與解鎖規則延續既有模型。B1/B2 保持 disabled，A2 單元 7–10 未建立。

3000-word v1/v2 目標檔、既有句子應用題與 KK 候選資料未修改。新增 9 個正式 lexeme 均已在 3000-word library 中；沒有以新 occurrence 重複計算單字目標。

另一個 D 槽 checkout 的 20 個未提交修改保持原樣，沒有跨目錄覆蓋。

## A2 單元 6

| 課程 | 核心句 | 本課新 lexeme |
|---|---|---|
| a2-u06-l01 平常的家務 | I usually clean my room. | usually、clean、room（3） |
| a2-u06-l02 必須洗碗 | I have to wash the dishes. | wash、dish（2） |
| a2-u06-l03 請求幫忙洗衣服 | Can you help me with the laundry? | help、laundry（2） |
| a2-u06-l04 星期六打掃房子 | We clean the house on Saturday. | house、saturday（2） |

`dishes` 作答保留複數，lemma 為 `dish`。每課真正新 lexeme 不超過 4。

新增 chunk：`usually-clean`、`wash-the-dishes`、`can-you-help`、`with-the-laundry`、`clean-the-house`、`on-saturday`；沿用既有 `have-to`。

新增句型：`frequency-routine`、`have-to-chore`、`can-help-with`、`clean-house-day`。

短文 `a2-u06-p01`：

1. I usually clean my room on Saturday. — 我通常星期六整理我的房間。
2. I have to wash the dishes. — 我必須洗碗。
3. Can you help me with the laundry? — 你可以幫我洗衣服嗎？
4. I can help you. — 我可以幫你。
5. We clean the house on Saturday. — 我們星期六打掃房子。

閱讀理解：

| 問題 | 正解 |
|---|---|
| 這個人通常哪一天整理房間？ | On Saturday. |
| 這個人必須洗什麼？ | The dishes. |
| 對方請求幫忙處理什麼？ | The laundry. |
| 對方用哪一句話答應提供幫忙？ | I can help you. |

內容複核將含糊的換字句 `Can you help me with my room?` 改為 `Can you help me with my laundry?`。購物對話補上明確的八美元價格回答；家務問句與中文提示一併對齊。這些是機器輔助編輯，不是人工核准。

## 對話資料、進度與錯誤邊界

- 唯一補充來源是 `public/data/conversation-practice-v1.json`，只在進入對話頁時載入；全部對方語句與參考回應均先提供雙語教學。
- 正常模式要求對應前置課程完成，A2 另需真正解鎖。QA preview 不修改 `passedLevelIds` 或假造課程完成。
- 獨立保存於 `yingju-conversation-practice-v1`，不寫入正式 token、lesson、review、vocabulary mastery 或 CEFR 通過紀錄。
- SHA-256 綁定作答來源；來源更新取消舊未完成回合，但保留歷史。結果鍵包含情境、日期及來源版本，避免同日新版與舊版混淆。
- 同日同版本的首次作答與協助旗標不能藉退出、重新整理或重做清除；跨午夜拒絕舊回合後可重新開始，不會卡在循環。
- 無效或被阻擋的本機儲存會明確顯示錯誤並暫停作答，不悄悄覆寫。對話紀錄可獨立下載；目前尚無 UI 匯入功能，正式課程備份不包含此資料。
- 不支援語音時停用播放並維持完整文字操作；瀏覽器 TTS 聲音可能不同，不宣稱為已完成的獨立音檔。

## 驗證紀錄

基準 `npm run verify`：exit 0，12 gates、234 unit tests。初次整合單元測試 232 pass／5 fail，原因是新增單元未加入展示 registry 及舊整檔 hash；已修正實際 registry、更新擴充來源 hash，保留舊單元 hash 鎖，未弱化驗證器。

瀏覽器測試前 `npm run verify`：exit 0，全部 12 gates、251 unit tests、0 failed/skipped。第一次全站 Playwright：exit 1，204 passed／2 failed（10.4 分鐘）。桌面與手機皆發現同一真實問題：第五句短文的顯示用 ID 被當作未完成的課程，導致略過文章重建。修正改用正式課程的先備條件，不刪除短文、題目或測試。

修復後的家務單元 Playwright：exit 0，6 passed／0 failed（45.6 秒），桌面與手機都實際完成四課、五句重建、四題理解及重新整理。`npm run verify` 再次 exit 0，全部 12 gates、252 unit tests、0 failed/skipped。

Windows 啟動器隔離情境測試：exit 0，7 passed／0 failed。桌面與手機對話截圖已檢查，文字及主要操作未水平裁切。最後全站 `npm run test:e2e`：exit 0，206 passed／0 failed／0 skipped，10.2 分鐘；桌面 1440×900 與手機寬度 375×812 各 103 項。測試之後未再修改 runtime 或課程資料。

| 本機實際執行指令 | Exit | 結果 |
|---|---:|---|
| `npm run check:context` | 0 | 10 份文件格式／UTF-8 檢查 |
| `npm run audit:project` | 0 | 4 程度、838 occurrences、12 catalog sources；0 orphan／duplicate |
| `npm run check:vocabulary-build` | 0 | 3000 目標與字庫可重建 |
| `npm run check:vocabulary-applications` | 0 | 3000 句子應用資料可重建 |
| `npm run check:vocabulary-phonetics` | 0 | 3000 音標候選、3627 variants 可重建 |
| `npm run audit:vocabulary` | 0 | 3000 canonical targets；1500 active／1500 receptive candidates |
| `npm run report:vocabulary` | 0 | A1＋A2 union 119；排除姓名 117；0 invalid IDs／lemma conflicts |
| `npm run validate:curriculum` | 0 | A1 8/32/145、A2 6/24/146；4 個對話／12 回合 |
| `npm run build` | 0 | Vinext 正式建置成功 |
| `npm run test:unit` | 0 | 252 passed、0 failed、0 skipped |
| `npm run lint` | 0 | 0 errors／warnings |
| `npx tsc --noEmit --incremental false`（verify 的 typecheck） | 0 | 型別檢查通過 |
| `npm run test:e2e -- tests/e2e/a2-household.spec.ts` | 0 | 修復後 6 passed、0 failed |
| `npm run test:e2e` | 0 | 最終 206 passed、0 failed、0 skipped；桌面／手機各 103 |
| `powershell -File scripts/test-windows-launcher.ps1` | 0 | 7 passed、0 failed；部分故障使用隔離 fixtures |

`npm test` 未另作 wrapper 重複執行；其 `verify` 與 `test:e2e` 子命令分別執行。此輪本機未重跑 `npm ci`，沒有依賴變更。瀏覽器測試使用隔離進度，不是使用者的真實學習檔案。

### 提交分組

- `bf9d46a` — Add A2 household routines pilot unit
- `c635b3a` — Add source-bound conversation practice and recall records
- `34e50b9` — Add prepared conversation flows with keyboard and audio support
- `114d614` — Gate extended passages on formal lesson prerequisites
- Context Engineering 與此交付文件獨立提交，不混入其他 checkout 修改。

### 檔案範圍

新增：`app/conversation-practice.ts`、`app/conversation-practice-panel.tsx`、`public/data/conversation-practice-v1.json`、`tests/conversation-practice.test.mjs`、`tests/e2e/conversation-practice.spec.ts`、`tests/e2e/a2-household.spec.ts`、本文件。

修改：A2 CSV／pattern／reading、course catalog、兩個 A2 產生器；`app/curriculum/validation.ts`、`app/passage-flow.ts`、`app/page.tsx`、`app/globals.css`；`scripts/validate-curriculum.mjs`、`package.json`；A1／A2／target 單元測試及既有 `learning-flow.spec.ts` 的總數 fixture；PLAN、PROGRESS、DECISIONS、TASKS、MEMORY、ARCHITECTURE、CHANGELOG、README 與 A2 blueprint。實際 diff 以本分支相對 `01c904d` 為準。

## 尚未完成與下一步

請實際試用四組對話及 A2 單元 6，至少跨兩個日期觀察複習，再與真人練習相同情境。文字答對不代表已具備口說流暢度。英文、台灣繁中、音標與難度仍待人工複核；本輪不自動開啟 B1/B2 或追加單元 7。

既有依賴安全問題仍需獨立處理；本輪沒有依賴更新、付費語音、雲端服務或正式部署。
