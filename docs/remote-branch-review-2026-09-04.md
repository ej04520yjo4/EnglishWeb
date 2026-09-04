# 遠端分支稽核（2026-09-04）

## 稽核基準

- 比對基準：`origin/main`，HEAD `8cb32887af2629960039eb34f59ca2b6cac4038a`（合併 PR #2）。
- 本表的合併判定使用 `git merge-base --is-ancestor <branch> origin/main`。
- 最後提交時間取自目前本機已存在的 `origin/*` refs（Asia/Taipei，ISO 8601）。
- GitHub Pull requests 頁面於本次檢查顯示 `0 Open`、`2 Closed`；因此下表目前沒有開啟中的 PR。未執行任何分支刪除。

## `origin/feat/*` 分支

| 分支 | HEAD | 最後提交時間 | 完全合併至 `origin/main` | Open PR | 建議 |
| --- | --- | --- | --- | --- | --- |
| `feat/a1-a2-vocabulary-3000-foundation` | `247c2c0d` | 2026-08-07 11:34:39 +08:00 | 是 | 無 | 已合併；可列入刪除候選，刪除前確認無需保留歷史工作分支。 |
| `feat/a2-pilot-foundation` | `13dd956a` | 2026-07-27 22:23:23 +08:00 | 是 | 無 | 已合併；可列入刪除候選。 |
| `feat/a2-shopping-comparison` | `c3153990` | 2026-07-28 10:47:46 +08:00 | 否 | 無 | 尚有 8 個分支獨有 commits；保留，先人工檢查與目前 A2 內容的重疊後再決定。 |
| `feat/a2-units-2-to-4` | `b1e137e3` | 2026-07-28 12:39:32 +08:00 | 是 | 無 | 已合併；可列入刪除候選。 |
| `feat/active-review-hardening` | `6823b657` | 2026-08-30 21:20:55 +08:00 | 是 | 無 | 已合併；可列入刪除候選。 |
| `feat/daily-learning-session-v2` | `1a0a19b5` | 2026-08-09 16:17:35 +08:00 | 是 | 無 | 已合併；可列入刪除候選。 |
| `feat/daily-learning-weakness-center` | `e103427d` | 2026-08-07 10:40:19 +00:00 | 否 | 無 | 尚有 5 個分支獨有 commits；保留，人工確認是否仍有未移植的 Daily/Weakness 工作。 |
| `feat/learning-ux-polish` | `b2e4e919` | 2026-08-19 17:08:48 +08:00 | 是 | 無 | 已合併；可列入刪除候選。 |
| `feat/related-vocabulary` | `bdb1905c` | 2026-07-28 06:54:58 +08:00 | 是 | 無 | 已合併；可列入刪除候選。 |

相對於 `origin/main`，兩個未合併分支的差異量為：`feat/a2-shopping-comparison` 為 main-only 42／branch-only 8；`feat/daily-learning-weakness-center` 為 main-only 26／branch-only 5。這些數字只描述 Git commit 圖，不代表內容品質或可直接合併。

## PR1 修正分支（額外列出）

`fix/clean-application-evidence`（HEAD `9dca6c19`，2026-09-04 12:28:41 +08:00）已完全合併至 `origin/main`，且對應 PR #2 已關閉；它不是 `feat/*`，但因為是本輪 PR1 的工作分支一併列出。可列入刪除候選，未執行刪除。

## 結論與後續

- 可刪除候選：上述 7 個已合併 `feat/*` 分支，以及已合併的 `fix/clean-application-evidence`。
- 必須保留並人工檢查：`feat/a2-shopping-comparison`、`feat/daily-learning-weakness-center`。目前兩者都沒有開啟 PR，也不應因「未合併」直接刪除。
- 分支清理仍應由維護者確認後，依 GitHub branch protection 與團隊保留政策另行執行。
