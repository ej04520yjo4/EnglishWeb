# 依賴審查報告（2026-09-04）

本報告只記錄審查結果；本次沒有修改 `package.json` 或 `package-lock.json`，也沒有執行 `npm audit fix`。

## 審查環境與指令結果

- Node.js `v24.18.0`、npm `11.16.0`；lockfile version `3`，lockfile 有 631 個 package entry。
- `npm audit --json`：最終取得完整報告，exit code `1`（npm 以非零碼表示發現漏洞）。先前一次查詢收到 registry `503 Service Unavailable`；最終重試成功。
- `npm outdated --json`：最終 exit code `1`（有更新可用，非指令執行錯誤）。沙箱內第一次受 Windows npm cache `EPERM` 影響；以一般使用者權限重試後成功查詢 registry。

## 當下漏洞摘要

Audit 的 `metadata.vulnerabilities` 與逐套件物件都統計 54 個受影響套件名稱：`critical 0 / high 44 / moderate 8 / low 2`。依賴樹統計為 production 24、development 573、optional 145、peer 48、總計 630。

受影響的直接依賴共 11 個：

- runtime／server：`next@16.2.6`（high）。它參與實際應用程式建置與伺服器執行，應視為可達的 runtime 風險。
- build、lint、local runtime 與 deploy toolchain：`@cloudflare/vite-plugin`、`@tailwindcss/postcss`、`@vitejs/plugin-react`、`@vitejs/plugin-rsc`、`eslint`、`eslint-config-next`、`react-server-dom-webpack`、`vinext`、`vite`、`wrangler`。這些不等於瀏覽器一定載入漏洞程式碼，但會影響可信建置、開發伺服器或部署流程。

受影響的 transitive 依賴共 43 個：`@babel/core`、`@babel/helper-compilation-targets`、`@babel/helper-module-transforms`、`@eslint-community/eslint-utils`、`@eslint/config-array`、`@eslint/eslintrc`、`@shuding/opentype.js`、`@typescript-eslint/eslint-plugin`、`@typescript-eslint/parser`、`@typescript-eslint/type-utils`、`@typescript-eslint/utils`、`@unpic/react`、`@vercel/og`、`ajv`、`ajv-formats`、`ajv-keywords`、`brace-expansion`、`browserslist`、`esbuild`、`eslint-import-resolver-typescript`、`eslint-plugin-import`、`eslint-plugin-jsx-a11y`、`eslint-plugin-react`、`eslint-plugin-react-hooks`、`fast-uri`、`fflate`、`image-size`、`js-yaml`、`miniflare`、`minimatch`、`nanoid`、`postcss`、`satori`、`schema-utils`、`sharp`、`terser-webpack-plugin`、`typescript-eslint`、`undici`、`update-browserslist-db`、`vite-tsconfig-paths`、`vitefu`、`webpack`、`ws`。其中 Next、Cloudflare、Vinext、Vite 與 ESLint 的相依樹互相牽連，不應個別套用未經測試的 override。

## npm outdated 結果

Registry 回報 19 個直接套件有更新：

- 應用程式／RSC：`next 16.2.6 → 16.3.4`、`react 19.2.6 → 19.2.8`、`react-dom 19.2.6 → 19.2.8`、`react-server-dom-webpack 19.2.6 → 19.2.8`、`eslint-config-next 16.2.6 → 16.3.4`。
- Vite／Cloudflare：`@cloudflare/vite-plugin 1.37.1 → 1.54.4`、`@vitejs/plugin-react 6.0.2 → 6.1.1`、`@vitejs/plugin-rsc 0.5.26 → 0.5.34`、`vite 8.0.13 → 8.2.2`、`wrangler 4.92.0 → 4.129.0`。
- 測試／樣式／型別：`@playwright/test 1.62.0 → 1.62.1`、`@tailwindcss/postcss 4.2.1 → 4.3.3`、`tailwindcss 4.2.1 → 4.3.3`、`@types/react 19.2.14 → 19.2.18`、`@types/react-dom 19.2.3 → 19.2.7`。
- 需要 major 或預發行遷移審查：`@types/node 22.19.19 → 26.4.1`、`eslint 9.39.4 → 10.9.1`、`typescript 5.9.3 → 7.0.2`、`vinext 0.0.50 → 1.0.0-beta.9`。

其中只有 `@playwright/test` 的現有 `^1.62.0` 範圍允許 npm 選取 `1.62.1`；其他套件目前使用精確版本，必須透過獨立變更審查。

## 建議升級批次與風險

1. 先以同一 PR 驗證 `next`、`eslint-config-next`、`react`、`react-dom` 與 `react-server-dom-webpack` 的相容修補；完整執行 build、unit、lint、typecheck、Playwright，並檢查 RSC 與 SSR 行為。
2. 第二個 PR 處理相容的 Playwright、Tailwind 與 React 型別 patch/minor；確認 CSS 輸出、桌面與手機瀏覽器矩陣。
3. 第三個 PR 同批驗證 `@cloudflare/vite-plugin`、兩個 Vite plugin、`vite` 與 `wrangler`；檢查 Cloudflare 本地模擬、production build、部署設定與 plugin API。
4. `vinext 0.0.50 → 1.0.0-beta.9` 是 major/beta 遷移，另立 PR，在官方相容矩陣確認後才評估；不可由 Dependabot 自動合併。
5. `eslint 10`、`typescript 7`、`@types/node 26` 各有 major 相容風險，等目前 plugin／framework 支援確認後分批處理。Transitive 修補優先由上游升級帶入，避免不受完整測試保護的 override。

本輪沒有升級依賴、沒有修改 lockfile，也沒有執行 `npm audit fix` 或任何強制修補。Dependabot 只提出有上限的審查 PR，每一批仍需人工確認完整 CI。
