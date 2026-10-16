# 3000 字句子應用與 KK 候選交付

工作日期：2026-10-15～16（台灣時間）。工作分支：`codex/vocabulary-application-kk`。

## 已完成的 main 整合

前一版 3000 字庫經 [PR #13](https://github.com/ej04520yjo4/EnglishWeb/pull/13)
合併至 main，merge commit `7bf6e03014f0942360726e5e89245d5217920afd`。
GitHub run `38759698862` 的品質檢查與 Playwright 均通過後才正常合併，
未使用管理員繞過、force push 或調降保護規則。此動作不等於部署。

本次補充內容建立在該 main 版本上；不要將前一版合併誤認為本輪補充也已合併。
有效工作目錄是 `C:\Users\Guan\Documents\ChatGPT\Tools\EnglishWeb-ui-polish`。
D 槽另一份 `codex/a1-pattern-batch-3` 的原有 20 項未提交修改保持不動。

## 內容與流程

- 3000 個 canonical 目標各有 1 題原創句子應用，共 60 批、每批 50 題。
- 每題有英文參考句、台灣繁中翻譯、句中目標字形與用法說明。
- 看中文與目標字，輸入完整英文；按 Enter 檢查，Shift+Enter 換行。
- 多字、少字或錯字不能只因包含目標字而過關。第三次錯誤顯示答案，
  必須重打後完成，沒有倒數自動跳頁。
- 每字每天只計第一次作答；錯後重試、看答案、貼上均不能補發乾淨應用證據。
  F5 保留這個界線。題目跨日或來源 revision 改變時拒絕寫入。
- 僅更新 schema v6 的全域 application 證據；不代替課程、單元或程度通過，
  不修改複習間隔，也不額外發放辨認或拼字證據。
- 補充資料只在進入單字庫時載入；錯誤隔離，不阻擋既有課程與字詞練習。

這是「對照參考句」的引導式應用，不是接受所有正確譯法的自由作文評分。
題目的周邊單字與文法不等於已通過正式課程的先備內容檢查。

## KK／IPA 來源與限制

採 [CMUdict 固定版本](https://github.com/cmusphinx/cmudict/tree/74790861f652b15e4ac49015a90074ad62a27690)，
完整下載 SHA-256：
`81917843C7F44CE2B094AC63873C2C7A4CF802040792C455BA3CA406891C3D22`。
保留 BSD-style 授權通知及可離線重建的目標子集，沒有擷取受保護字典。

- 3000 字均有來源音位；3627 個讀音變體，559 字有多種讀音，缺漏 0。
- 原始 ARPAbet 與全部變體保留；KK／美式 IPA 是本專案自行轉寫的候選。
- 多音字不自動選詞性或語境；音節邊界及重音位置為明確標示的推算候選。
- 已修正重音插在母音前而非音節起點的問題；測試包含 computer、important、
  remember、understand、banana 等，但不代表所有音標已人工驗證。
- 不產生音檔、不修改 `audio_status`，也不把單字發音冒充獨立 KK 符號錄音。

所有新增句子保持 `pilot_review_required`，所有音標保持候選待審。
原始 132 字的舊來源授權待辦沒有因新 CMUdict 補充而自動結案。

## 內容校正

獨立機器輔助抽查發現並修正：`fill out the form` 的美式用法、sight 對應視力
而非風景、possession 的自然句型，以及 place、struggle、presence、defense、
quick、meal、promote、currently、invest、mayor、out、very、manager、load 的中文。
這是抽樣校正與回歸保護，並非 3000 題全量人工核准。

## 實際驗證

修改前：`npm run verify` exit 0，215 項單元測試；合併候選另通過 GitHub 全套
Playwright。沒有把前輪本機結果當成本輪重新執行。

| 指令／檢查 | Exit code | 結果 |
|---|---:|---|
| `npm run verify` | 0 | 12 道品質門檻通過 |
| `npm run check:context` | 0 | 10 份必要文件 |
| `npm run audit:project` | 0 | 814 個保留課程 occurrences；來源稽核通過 |
| `npm run check:vocabulary-build` | 0 | 原 3000 字庫可離線重建 |
| `npm run check:vocabulary-applications` | 0 | 3000/3000，缺題 0，60 批一致 |
| `npm run check:vocabulary-phonetics` | 0 | 固定來源與轉寫輸出一致 |
| `npm run audit:vocabulary` / `report:vocabulary` | 0 | 3000 canonical 目標，無 ID／lemma 衝突 |
| `npm run validate:curriculum` | 0 | A1 8/32/145；A2 5/20/122；停用 B1/B2 結構仍通過 |
| `npm run build` | 0 | Vinext production build 完成 |
| `npm run test:unit` | 0 | 234 passed、0 failed、0 skipped |
| `npm run lint` | 0 | 0 errors、0 warnings |
| `npm run typecheck` | 0 | `tsc --noEmit --incremental false` |
| 新增功能 Playwright | 0 | 14 passed：桌面 7、手機 7 |
| 全站 Playwright | 0 | 180 passed：桌面 90、手機 90；0 failed，9.2 分鐘 |
| Windows 啟動器情境 | 0 | 7 passed、0 failed；安裝錯誤使用隔離命令 fixture |

首輪 focused Playwright 曾 exit 1：5 passed／7 failed，原因是新測試在首頁
完成資料載入前就點導覽。增加可觀察的首頁就緒等待後重跑，保留全部進度與流程
斷言。另補測並修正檢查按鈕長按 Enter 重複計次；未以增加重試次數掩蓋錯誤。
桌面與手機新畫面截圖已檢視，未見輸入框或 KK 區塊被水平裁切。

第一輪全站測試 exit 1：179 passed／1 failed（9.7 分鐘）。失敗是既有
Daily 鍵盤測試等待 resume 按鈕逾時；trace 的 `wallTime=1792079999297`
對應台灣 2026-10-15 23:59:59.297，當日 fixture 在 hydration 期間跨午夜，
被正式過期規則清除。純鍵盤 fixture 改固定中午，正式跨午夜測試仍保留，
未更動產品過期規則或增加自動 retry。保留失敗 trace，重新執行全套後
180 項全部通過，包含桌面與手機的真正跨午夜失效測試。

本輪未重新 `npm ci`，沒有改依賴版本；`npm test` wrapper 未另跑，其組成指令
分開執行。既有 npm audit 的 29 個受影響套件（1 critical）仍待獨立相容性修補，
不可把本交付稱為安全無漏洞的發布。

## 修改範圍

實作 commits：`02f303d`（來源音標）、`c6f200e`（原創應用資料／引擎）、
`ebc30c0`（介面與測試接線）、`29dbaf9`（鍵盤 fixture 日期隔離）。
文件另行提交；測試結果以表格最終紀錄為準。

- 新資料：`data-sources/vocabulary-3000/applications/` 60 批及 manifest；
  `phonetics/` 固定來源子集、音位映射、manifest；兩份 supplemental runtime JSON。
- 新邏輯：`vocabulary-application.ts`、`vocabulary-application-practice.tsx`、
  `use-vocabulary-supplements.ts`、`vocabulary-phonetics.ts`。
- 串接：`app/page.tsx` 小幅接線、字庫 panel、區塊樣式、package scripts。
- 工具：應用題 generator、發音 fetch/build、來源授權與 README。
- 測試：應用單元測試、發音單元測試、補充功能桌面／手機 E2E。
- 文件：根目錄 Context Engineering 文件及本報告。

A1/A2 正式 CSV、既有練習 JSON、v1/v2 targets、原 library JSON、穩定 ID、
課程解鎖、schema v6 及 B1/B2 停用狀態均保持不變。

## 下一步

先試用前 50 字的句子應用與跨日紀錄，再逐批複核英文、中文和多讀音候選。
優先處理依賴安全更新與尚未確定的日常工作目錄，不新增課程或主題來掩蓋待審項目。
