"use client";

import { useEffect } from "react";

// Last-resort boundary: an unexpected runtime error shows a recoverable notice
// instead of a blank page. Learner progress stays in browser storage; nothing
// here reads, rewrites, or clears it.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="app-error" role="alert">
      <h1>畫面發生錯誤</h1>
      <p>
        英句練習遇到未預期的問題。已儲存在這台瀏覽器的學習進度不會因此被清除。
      </p>
      <div className="app-error-actions">
        <button className="primary-button" type="button" onClick={reset}>
          再試一次
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => window.location.reload()}
        >
          重新整理頁面
        </button>
      </div>
    </main>
  );
}
