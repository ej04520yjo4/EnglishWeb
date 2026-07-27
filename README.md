# 英句練習

繁體中文互動式英文句子學習網站。核心流程是：

1. 依中文提示回想英文單字或語塊
2. 查看 KK／IPA、詞性、音節與用法
3. 依順序重組完整句子
4. 閱讀辨識完整句意
5. 使用相同句型完成文字換字練習
6. 依情境選擇適合的英文回答
7. 依表現安排延遲複習

目前內建 A1 的 8 個單元與 32 句課程，包含 A–Z 基礎、循序解鎖、單元測驗、程度總測驗、進度頁面，以及課程資料管理。所有學習進度儲存在目前瀏覽器，不需登入。

唯一正式 A1 課程來源是 `public/data/a1-course-v3.csv`。課程地圖、逐字學習、測驗、複習、文章重建與內容管理都由這份 v3 CSV 建立；`app/course-data.ts` 只保存型別與非課程靜態資料。

## 開發

需要 Node.js 22.13 以上版本。

```powershell
npm ci
npm run dev
npm test
npm run test:e2e
npm run lint
npx tsc --noEmit --incremental false
```

`npm run dev` 啟動本機網站；`npm test` 會建立可發佈版本，執行單元測試與 Playwright 瀏覽器流程。`npm run test:e2e` 可單獨執行桌面與手機瀏覽器測試。

## 主要檔案

- `app/page.tsx`：頁面、學習互動、進度、測驗與匯入匯出
- `public/data/a1-course-v3.csv`：唯一正式 A1 課程內容
- `public/data/a1-pattern-exercises.json`：經驗證的句型換字題
- `public/data/a1-reading-exercises.json`：閱讀辨識、文字回答與短文理解題
- `app/a1-mvp-data.ts`：v3 CSV 解析、驗證、版本與課程建立
- `app/a1-exercises.ts`：新題型資料讀取與 A1 難度驗證
- `app/course-data.ts`：TypeScript 型別與非課程靜態資料
- `app/globals.css`：桌面版與響應式介面樣式
- `tests/`：單元、渲染與 Playwright 端到端測試

## 課程資料 QA

內容管理頁可匯出 Excel、CSV 或 JSON。表格內修改先保存在草稿，只有通過完整 v3 驗證後才會套用；也可隨時還原 `public/data/a1-course-v3.csv`。資料表保留課程與學習單位的穩定 ID，可交由 GPT 或人工檢查台灣繁體中文翻譯、KK／IPA、詞性、語塊切分與 CEFR 難度後再匯入。

目前語音在預先產生音檔缺少時使用瀏覽器／作業系統的免費美式語音備援。加入正式音檔前，必須記錄模型、聲音、版本、授權、速度、產生日期與 QA 狀態。
