# 依賴審查報告（2026-09-04）

本報告只記錄審查結果；本次沒有修改 `package.json` 或 `package-lock.json`，也沒有執行 `npm audit fix`。

## 審查環境與指令結果

- Node.js `v24.18.0`、npm `11.16.0`；lockfile version `3`，lockfile 有 631 個 package entry。
- `npm audit --json`：最終取得完整報告，exit code `1`（npm 以非零碼表示發現漏洞）。第一次網路重試收到 registry `503 Service Unavailable`，再次重試成功取得報告。
- `npm outdated --json`：exit code `1`（有更新可用，非指令執行錯誤）。第一次受 Windows npm cache `EPERM` 影響；授權重新執行後成功查詢 registry。

## 當下漏洞摘要

`metadata.vulnerabilities` 統計 54 個受影響的依賴項目：`critical 0 / high 44 / moderate 8 / low 2`。Audit 的 `vulnerabilities` 物件另列出 20 個唯一套件名稱；依各套件最高嚴重度計為 `high 17 / moderate 1 / low 2`。兩組數字的計算單位不同，不應互相取代。依賴統計為 production 24、development 573、optional 145、peer 48、總計 630。

直接依賴中的受影響項目（6 個，皆非 A1/A2 課程資料）：

- runtime：`next@16.2.6`（high）。Audit 建議路徑為 `16.3.4`，仍須搭配 build、單元與瀏覽器測試。
- build/deploy：`@cloudflare/vite-plugin@1.37.1`、`vite@8.0.13`、`wrangler@4.92.0`、`vinext@0.0.50`（high），以及 build integration `react-server-dom-webpack@19.2.6`（high）。

14 個 transitive 受影響項目為：`@babel/core`（low）、`brace-expansion`、`browserslist`、`fast-uri`、`image-size`、`js-yaml`、`miniflare`、`nanoid`、`postcss`、`sharp`、`undici`、`ws`（high），`esbuild`（low）、`fflate`（moderate）。其中 Cloudflare/Vinext/Vite/Next 的相依樹互相牽連，不應單獨套用強制 override。

## npm outdated 結果

目前 registry 回報的直接更新只有：`next 16.2.6 → 16.3.4`、`react 19.2.6 → 19.2.8`、`react-dom 19.2.6 → 19.2.8`。其餘直接依賴沒有列入本次 outdated JSON。

## 建議升級批次與風險

1. 先以同一批驗證 `next`、`react`、`react-dom` 與 `react-server-dom-webpack` 的安全修補；需完整執行 build、unit、lint、typecheck、Playwright，並檢查 RSC 行為。
2. 另批升級 `@cloudflare/vite-plugin`、`wrangler`、`vite`、`miniflare` 及其 transitive tree；Cloudflare 本地模擬、部署設定與 Vite plugin API 需逐項回歸。
3. `vinext 0.0.50 → 1.0.0-beta.9` 是 audit 標示的 major/beta 轉換，列為獨立 migration，不自動合併。
4. 其餘 transitive 修補應透過上游套件升級帶入，避免不受測試保護的 override。Dependabot PR 不啟用自動合併；每批以 CI 與相容性檢查後人工決定。
