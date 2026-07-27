# A1 句型分批擴充計畫

正式課程句型一律來自 `public/data/a1-course-v3.csv`。換字題只在人工檢查過中文、英文、已學單字與語塊後，才將 `enabledForTransfer` 設為 `true`。

## 已完成

- 第一批：`have-possession`
- 第二批：`be-identification`、`be-location`、`action-at-time`

每個已啟用句型都有閱讀辨識、至少兩個不同於原句的換字題，以及中文提示選英文題。`be-identification` 安排在學過 `he`、`she`、`Amy`、`Ben` 後練習，避免提早使用新字。

## 後續批次

### 第三批：人物與基本指認

- `name-identification`
- `demonstrative-identification`
- `be-relationship`
- `go-to-place`

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

每批先建立少量候選題，再檢查人稱、語意、CEFR 難度、出現順序與語塊使用；通過資料驗證及桌面、手機流程測試後，才進入下一批。
