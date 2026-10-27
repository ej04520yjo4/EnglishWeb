# A2 第七單元試行 QA：經驗與生活改變

## 範圍與狀態

2026-10-27 依使用者「繼續增加課程」要求，延續藍圖的下一個單元。僅新增 `a2-u07`；不改 A1、A2-u01～u06 或穩定 ID，不新增單元 8，不啟用 B1/B2。全部內容仍為 `pilot_review_required`，音訊 `pending`，KK/IPA 是待複核候選，不宣稱人工審核完成。

唯一來源仍為 `public/data/a2-course-v1.csv`、`a2-pattern-exercises.json`、`a2-reading-exercises.json`，由既有兩支 A2 產生器重建。CSV 欄位與資料模型未變；A2 總計 7 單元、28 課、168 occurrences。

## 四課與先備內容

| 課程 | 英文核心句／繁中 | 新 lexeme |
|---|---|---|
| `a2-u07-l01` 分享旅行經驗 | I have been to Taiwan.／我去過台灣。 | 0；`been` 是既有 `be` 的新形式 |
| `a2-u07-l02` 詢問曾經去過的地方 | Have you been to Taiwan before?／你以前去過台灣嗎？ | 1：before |
| `a2-u07-l03` 描述生活改變 | My life is different now.／我的生活現在不一樣了。 | 3：life、different、now |
| `a2-u07-l04` 說說新的工作 | I have a new job now.／我現在有一份新工作。 | 2：new、job |

各課逐字數為 5／6／5／6，共 22。沿用 A1 的主詞、地點與日常物品，以及 A2 交通、房間、家務、星期六等先備內容。`have` 在前兩課是完成式助動詞，第四課是「擁有」；同一 lexeme 以 sense/context_pos 區分。`a` 提示仍為「一個」，「一份工作」的量詞放在說明。

句型：`present-perfect-experience`、`present-perfect-experience-question`、`be-change-now`、`have-new-state-now`。

語塊：`have-been-to`、`been-to`、`different-now`、`new-job`。問句中的 Have 與 been 分隔，不建立不連續的虛假語塊。

## 句型換字

每課另有一題閱讀辨識與一題文字選答，選項各四個。

1. We have been to Taiwan.／我們去過台灣。
2. I have been to that store.／我去過那間商店。
3. Have you been to that store before?／你以前去過那間商店嗎？
4. Have you been to this station before?／你以前去過這個車站嗎？
5. My room is different now.／我的房間現在不一樣了。
6. My house is different now.／我的房子現在不一樣了。
7. I have a new book now.／我現在有一本新書。
8. I have a new bag now.／我現在有一個新包包。

## 綜合短文 `a2-u07-p01`

1. Have you been to Taiwan before?／你以前去過台灣嗎？
2. I have been to Taiwan.／我去過台灣。
3. I have a new job now.／我現在有一份新工作。
4. My life is different now.／我的生活現在不一樣了。
5. I go to work by train.／我搭火車去上班。
6. I usually clean my room on Saturday.／我通常星期六整理我的房間。

理解題與答案：去過哪裡 → Taiwan；現在有什麼新的 → A new job；哪一天整理房間 → On Saturday；結合第三、五句判斷去新工作地點的交通方式 → By train。最後一題明列兩句證據，不推測工作地點在台灣，也不捏造改變的原因。所有英文選項都具備先備 lexeme/chunk metadata。

## 文法與音標複核依據

文法以原創簡短句練習「have + 過去分詞」的經驗用法及疑問語序，不複製教材、字典解釋或音檔。用法核對參考 [British Council：Present perfect – experiences](https://learnenglishkids.britishcouncil.org/grammar-vocabulary/grammar-practice/present-perfect-experiences)（查閱 2026-10-27）。此參考不是 CEFR A2 認證；本單元只教 `been` 的受限情境，未引入完整完成式、第三人稱 has、否定或連續式。

新詞的 KK/IPA、音節、自然度與 A2 難度仍須人工複核；音訊沒有完成，不填入假音訊網址。瀏覽器語音只是既有備援，不代表單獨的 KK 符號錄音已更新。

## 驗證與試用

以下 288／291 單元測試與 264 瀏覽器測試是先前含未提交備份功能的原工作目錄結果，不是乾淨發布分支的測試總數。乾淨發布驗證另記於 `PROGRESS.md`；備份功能不包含在本次課程發布。

乾淨發布分支重驗：`npm run verify` exit 0，284 項單元測試全數通過，建置／lint／型別檢查完成；第 7 單元 Chrome 流程 exit 0，桌面 4／4、手機 4／4。使用已確認的本機 4174 網址；原固定 4173 入口啟動逾時另行保留紀錄。完整 GitHub CI 仍須通過後才能合併。

- 基準 `npm run verify`：exit 0，288 單元測試通過。
- A2 專項：33／33 通過；原六單元 row/exercise-object hash 相同，A1 保持 8／32／145。
- `npm run verify`：exit 0，12 個品質關卡完成，含 291 單元測試（0 失敗／跳過）、建置、lint 與型別檢查。最終獨立 lint 無警告。
- 完整 Playwright：exit 0，264／264 通過（桌面 1440×900 與手機 375×812 各 132），0 失敗／跳過，15.4 分鐘。原固定 4173 的入口遇到本機連線／port 回退問題，實際執行使用相同專案設定的暫存 config 連到 Vinext 已確認的 4174；未宣稱固定 port 入口通過。
- Windows 啟動器：exit 0，7／7 情境通過。詳細指令、先前失敗及修復紀錄見 `PROGRESS.md` 本輪驗證段落。
- 桌面／手機課程地圖與 `been` 詳情已擷取並檢視，未見文字／按鈕裁切；實際手機與使用者教學體驗仍待試用。
- 正常模式依既有規則通過 A1 與 A2 第六單元後，才能開始第七單元。QA 預覽不會改寫 passedLevelIds 或其他單元的完成狀態。
- 待使用者試用四課、換字、六句重建、理解題與重新整理復原；待人工檢查英文／繁中／KK／IPA及現在完成式提示強度。通過自動測試不等於教學成效或人工核准。
- 本輪停止於第七單元。下一步先記錄試用回饋，再決定是否擴充第八單元。
