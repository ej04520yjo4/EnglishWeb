# 對話練習：可選用口說輸入

日期：2026-10-16（Asia/Taipei）

## 交付範圍

在目前工作副本 `C:\Users\Guan\Documents\ChatGPT\Tools\EnglishWeb-ui-polish`
的 `codex/conversation-speech-input` 分支實作；基底為已合併 PR #15 的
main `32337bf`。初次功能交付尚未提交、推送、合併或部署；使用者後續已明確
授權提交、正常合併 main、推送 GitHub 及同步 D 槽。合併狀態以 PR／Git
實際回讀為準，不將尚未完成的 CI 當成通過，也不繞過 main 的保護規則。

D 槽原本 20 項修改完整保留在獨立工作副本
`D:\Codex\Tools\EnglishWeb\EnglishWeb-preserved-20261016`，仍在原分支
`codex/a1-pattern-batch-3`、仍未提交；20 個檔案已逐一比對原始 SHA-256。
原使用路徑 `D:\Codex\Tools\EnglishWeb\english-learning-app` 切至 main，
先同步原主線，待 PR 通過後再 fast-forward。額外備份、binary patch 位於
`D:\Codex\Tools\EnglishWeb\backups\pre-speech-sync-20261016`，stash
`8b1e56de8d799dda92f1c332a5a64b3d149e1aef` 亦保留。舊 patch 中的功能已有
後續整合與修正，故不把整份舊檔覆蓋回新版。未刪除任何保存副本。

這是對話回應的可選輸入方式，不是自由聊天、發音評分或新的課程模式。
原本打字、前置課程、日期／來源版本限制及正式詞彙證據保持不變。

## 使用方式

1. 開啟「對話練習」，選擇已解鎖的情境，完成準備後開始。
2. 在回應框下閱讀隱私說明，勾選本次開啟對話頁期間的同意。
3. 按「開始口說」，並在瀏覽器提示時允許麥克風；說出一句美式英文回應。
4. 按「停止辨識」或等候服務結束，確認「辨識文字（尚未送出）」。
5. 按「使用這段文字」，在原輸入框確認或修改，再按「檢查回應」。

「捨棄文字」與「取消辨識」不覆蓋既有草稿。下一回合、重新整理及重新
開啟頁面都不會自動啟用麥克風。使用文字前不計作答，也不因服務失敗扣分。

## 隱私、成本與限制

- 使用瀏覽器 `SpeechRecognition`／`webkitSpeechRecognition`，設定 `en-US`，
  不引入付費 API、帳號或應用程式後端。
- 需要支援此 API 的瀏覽器及 HTTPS／localhost。Chrome 等瀏覽器可能使用
  服務供應商的遠端辨識，不保證離線或完全在本機處理；詳見
  [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)。
- 本網站不建立錄音檔、不持久保存辨識文字；辨識服務供應商的資料處理政策
  不由本站控制，介面在請求麥克風前先告知。
- 每次最長 30 秒；停止等待最多 2 秒。背景、pagehide、離開回合與卸載會
  取消辨識並失效晚到 callback。停止異常時明確警告，禁止同控制器重新啟動。
- 辨識不準時可捨棄或修改再送出；API 的 confidence 不會用來當發音分數。
- 此版本只接入對話回應，沒有改成以口說代替逐字拼寫測驗或 KK 音素練習。

## 學習紀錄

- 保持既有 `yingju-conversation-practice-v1`，向後相容新增 optional
  `usedSpeech` 與 `speechTurns`；舊資料缺少欄位仍可載入，錯誤型別拒絕套用。
- 明確使用辨識文字才標記語音輔助，不是按下麥克風就計分。
- 同日重試、修改文字及重新整理不會洗掉語音輔助歷史。這些回合不算獨立
  文字回想，結果另外顯示語音輔助數，沿用協助完成的隔日複習規則。
- 不寫入正式 schema v6、課程完成、CEFR 通過、3000 字熟練或正式複習排程。
- localStorage 寫入失敗時，不套用文字或聲稱成功，保留原紀錄並進入復原畫面。

## 修改檔案

新增：

- `app/speech-recognition.ts`：瀏覽器辨識控制器。
- `app/conversation-speech-input.tsx`：同意、控制、預覽與明確套用。
- `tests/speech-recognition.test.mjs`：注入式控制器測試。
- `tests/e2e/conversation-speech.spec.ts`：真實 UI 搭配模擬辨識事件。
- 本文件。

修改：

- `app/conversation-practice-panel.tsx`、`app/conversation-practice.ts`、
  `app/globals.css`、`package.json`、`tests/conversation-practice.test.mjs`。
- `PLAN.md`、`PROGRESS.md`、`DECISIONS.md`、`TASKS.md`、`MEMORY.md`、
  `ARCHITECTURE.md`、`CHANGELOG.md`、`README.md`。

未修改：所有 `public/data/*`、`app/page.tsx`、正式課程／詞彙進度模組、
套件鎖檔與 Windows 啟動器。A1 保持 8／32／145；A2 保持 6／24／146。

## 驗證結果

| 實際執行 | Exit code | 通過／失敗 | 範圍 |
|---|---:|---|---|
| 基準 `npm run verify` | 0 | 252 unit／0 | 修改前的既有品質關卡 |
| 最終 `npm run verify` | 0 | 274 unit／0 | 全部 12 關：context、project／vocabulary audits、重現性、curriculum、build、unit、lint、types |
| 初次口說 focused Playwright | 0 | 22／0 | 桌面 11、手機寬度 11，模擬辨識 |
| `npm run test:e2e` | 0 | 228／0 | 桌面 114、手機寬度 114，11.2 分鐘 |
| 最後口說專項 Playwright | 0 | 26／0 | 桌面 13、手機寬度 13，34.7 秒，含最後加固與兩項新錯誤案例 |
| `git diff --check` | 0 | 無空白錯誤 | 僅 Windows 行尾提示 |

全部列出的成功測試沒有 skip。完整 E2E 執行期間另完成了停止異常的
小範圍加固；交付前以最後一次口說專項重跑驗證該區域及新增失敗案例。

曾出現的問題也保留：初次本機測試伺服器因 sandbox port bind EACCES
無法啟動，取得本機伺服器權限後通過。Lint 發現 effect 同步 setState
與測試的 `this` alias；改為 hydration-safe capability snapshot 與正確
fixture 後通過。TypeScript 發現取消後 getter 的 narrowing 判斷，改為
重新讀取控制器參照後通過；沒有停用 lint／type rule 或刪除測試。

新增兩項錯誤案例後的第一次專項執行為 exit 1、24 passed／2 failed：
儲存失敗的產品行為正確，但測試使用了情境列表復原頁標題，而非作答中
復原頁標題。改用實際標題後全部通過，仍驗證原 storage bytes 不變、
不顯示成功、不套用語音輔助及明確錯誤訊息。

已檢視最後桌面與 375 像素手機寬度的 `speech-preview.png`：文字與按鈕
未水平裁切。這不等於完整網站無障礙或實體手機認證。

獨立檢查亦修正了儲存失敗仍顯示套用成功，以及 stop 期間晚到 onstart
錯誤切回 listening 的問題。Controller 單元測試涵蓋 constructor、設定、
start、stop、原生 error、timeout、cleanup 失敗與過期 callback。

沒有執行真實麥克風、供應商服務辨識、手機實機、GitHub CI 或部署測試。
沒有新增相依套件；本輪未重跑 npm ci、npm audit 或獨立 Windows 啟動器套件。
已有相依套件安全性待辦仍存在，不能把功能測試通過稱為安全性清零。

本機 log：`tmp/speech-baseline-verify.log`、`tmp/speech-verified-final.log`、
`tmp/speech-full-e2e.log`；最後口說專項另存 `tmp/speech-focused-final.log`。

## 待使用者實測

- Windows Chrome 的實際麥克風、權限提示及辨識服務可達性。
- 臺灣使用者口音、背景噪音、慢速說話及重說的辨識品質。
- 手機實機的服務可用性與系統麥克風權限；375 像素的 Chrome 測試不等同
  實體手機或 Safari 驗證。
- 若需要逐音素／重音／KK 發音評分，須另外選擇適用模型、授權與評分方法，
  不可以文字辨識是否相符假裝已經完成。
