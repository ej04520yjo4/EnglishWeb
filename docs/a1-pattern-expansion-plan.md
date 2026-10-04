# A1 句型分批擴充計畫

正式課程句型一律來自 `public/data/a1-course-v3.csv`。新增練習分批檢查中文、英文、已學單字、語塊與 slot；通過自動驗證後可依本次整合要求開放試用，但 `enabledForTransfer=true` 不等於人工核可。第三批持續標記 `qaStatus=pilot_review_required`，畫面亦顯示待人工複核。

## 已完成

- 第一批：`have-possession`
- 第二批：`be-relationship`、`be-location`、`action-at-time`

前兩批每個已啟用句型都有閱讀辨識、至少兩個不同於原句的換字題，以及中文提示選英文題。`be-relationship` 在 `a1-u3-l2` 使用與原句相同的句型練習。

## 第三批：人物與基本指認（已整合，待使用者試用）

| 練習課程 | 句型 | 換字題 | 類型 |
|---|---|---|---|
| `a1-u1-l2` | `name-identification` | My name is Amy.（我的名字是 Amy。） | 本課句型 |
| `a1-u2-l3` | `demonstrative-identification` | That is a book.（那是一本書。）／This is my bag.（這是我的包包。） | 同句型，參考第 2 單元第 1 課 |
| `a1-u3-l3` | `be-identification` | He is Ben.（他是 Ben。）／She is Amy.（她是 Amy。） | 第 1 單元已學句型複習，不冒充本課的 have 句型 |
| `a1-u7-l4` | `go-to-place` | I go to school.（我去上學。）／I go to the store.（我去商店。） | 第 5 單元已學句型複習 |

- 共新增 7 題換字、4 題閱讀辨識、4 題文字選答。20 種正式句型中啟用 8 種、已覆蓋 8 種、缺漏 0 種、刻意延後 12 種。
- 姓名課的例外：當時只教過 Amy／Ben，Ben 已是原句，因此只有 Amy 這一題合法、不同於原句的換字題。閱讀與文字選答均採兩個不同姓名選項，不以 `I am Amy.` 當成 `My name is Amy.` 的錯誤意思，也不為湊數提前加人名。
- 其他三課各有兩題換字、四個選項。前往地點題使用 `I am at home.` 作為干擾選項，不把「搭公車上學」與「去上學」硬分成對錯。
- 每個新換字題有完整 `slotValues`；所有選項先備內容均受檢查。複習題顯示實際句型及來源參考句，成績記錄在實際練習的句型，不更動原課程句型。
- 從 D 槽待提交批次逐項整合；D 槽原始修改仍保留。機器輔助語意檢查與程式測試不是人工英文、繁中與教學難度核可。

## 後續批次

### 第四批：偏好、需求與日常活動

- `be-origin`
- `like-preference`
- `want-object`
- `action-at-location`
- `play-sport`

### 第五批：時間與日期

- `it-be-time`
- `date-identification`
- `be-time`
- `from-to-time-range`

### 第六批：固定說法與綜合應用

- `fixed-social-expression`
- `go-to-place-by-transport`
- `go-to-place-at-time`

每批先建立少量候選題，再檢查人稱、語意、CEFR 難度、出現順序與語塊使用；通過資料驗證及桌面、手機流程測試，並收集本批使用者回饋後，才決定下一批。
