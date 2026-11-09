import type * as React from "react";
import { StatCard } from "../home-widgets";
import type { A1CourseCsvRow, CourseValidationReport } from "../a1-mvp-data";
import type { CourseUnit } from "../course-data";
import type { CefrLevel } from "../curriculum/types";

export type ContentAdminScreenProps = {
  adminSearch: string;
  adminUnit: string;
  contentSourceVersion: string;
  contentStats: { units: number; lessons: number; sentences: number; occurrences: number; pendingQa: number; };
  courseRowsUpdatedAt: string;
  courseSourceRevision: string;
  courseUnits: CourseUnit[];
  discardCourseDraft: () => void;
  exportContentCsv: () => void;
  exportContentJson: () => void;
  exportContentXlsx: () => Promise<void>;
  filteredRows: A1CourseCsvRow[];
  importContent: (event: React.ChangeEvent<HTMLInputElement, Element>) => Promise<void>;
  importReport: CourseValidationReport | null;
  levelStatusLabel: "試行課程" | "正式課程";
  renderLevelSelector: () => React.JSX.Element;
  restoreOfficialCourseData: () => void;
  selectedLevel: CefrLevel;
  setAdminSearch: React.Dispatch<React.SetStateAction<string>>;
  setAdminUnit: React.Dispatch<React.SetStateAction<string>>;
  updateCourseDraftRow: (row: A1CourseCsvRow, updates: Record<string, string>) => void;
  validateAndApplyCourseDraft: () => void;
};

export function ContentAdminScreen({
  adminSearch,
  adminUnit,
  contentSourceVersion,
  contentStats,
  courseRowsUpdatedAt,
  courseSourceRevision,
  courseUnits,
  discardCourseDraft,
  exportContentCsv,
  exportContentJson,
  exportContentXlsx,
  filteredRows,
  importContent,
  importReport,
  levelStatusLabel,
  renderLevelSelector,
  restoreOfficialCourseData,
  selectedLevel,
  setAdminSearch,
  setAdminUnit,
  updateCourseDraftRow,
  validateAndApplyCourseDraft,
}: ContentAdminScreenProps) {
  return (
    <div className="page-stack wide-page">
      {renderLevelSelector()}
      <section className="page-title">
        <div>
          <span className="eyebrow">內容資料與人工 QA</span>
          <h1>課程內容管理</h1>
          <p>表格修改先保存在草稿；只有完整驗證通過後才會套用。</p>
          <small>
            {levelStatusLabel}來源：public/data/{contentSourceVersion}
            ・revision {courseSourceRevision.slice(0, 12)}
            ・更新時間{" "}
            {courseRowsUpdatedAt
              ? new Date(courseRowsUpdatedAt).toLocaleString("zh-TW")
              : "載入中"}
          </small>
        </div>
        <div className="toolbar">
          <button className="primary-button" onClick={validateAndApplyCourseDraft}>驗證並套用</button>
          <button className="secondary-button" onClick={discardCourseDraft}>放棄草稿</button>
          <button className="secondary-button" onClick={restoreOfficialCourseData}>還原正式課程資料</button>
          <button className="secondary-button" onClick={exportContentXlsx}>匯出 Excel</button>
          <button className="secondary-button" onClick={exportContentCsv}>匯出 CSV</button>
          <button className="secondary-button" onClick={exportContentJson}>匯出 JSON</button>
          <label className="primary-button file-button">匯入修訂<input type="file" accept=".xlsx,.xls,.csv,.json" onChange={importContent} /></label>
        </div>
      </section>
      <div className="three-grid content-stats-grid">
        <StatCard
          label="單元／課程"
          value={`${contentStats.units}／${contentStats.lessons}`}
        />
        <StatCard
          label="句子／occurrence"
          value={`${contentStats.sentences}／${contentStats.occurrences}`}
        />
        <StatCard
          label="待人工 QA"
          value={contentStats.pendingQa}
          note={
            selectedLevel !== "A1"
              ? "試行內容不可標記為 production ready"
              : "依 qa_status 統計"
          }
        />
      </div>
      <section className="qa-note">
        <strong>給 GPT 檢查時可直接上傳匯出的資料表</strong>
        <span>請它逐列檢查台灣繁體中文翻譯、KK／IPA、詞性、語塊切分與 CEFR 難度；修正後再匯入本頁。</span>
      </section>
      {importReport && (
        <section className="qa-note" aria-live="polite">
          <strong>
            匯入結果：總列數 {importReport.totalRows}・成功列數{" "}
            {importReport.successfulRows}・失敗列數 {importReport.failedRows}
          </strong>
          <span>
            未匹配 ID：
            {importReport.unmatchedIds.length
              ? importReport.unmatchedIds.join("、")
              : "無"}
          </span>
          <span>
            驗證錯誤：
            {importReport.validationErrors.length
              ? importReport.validationErrors.join("｜")
              : "無"}
          </span>
        </section>
      )}
      <section className="section-card">
        <div className="filter-row">
          <input value={adminSearch} onChange={(event) => setAdminSearch(event.target.value)} placeholder="搜尋英文、中文或句子" />
          <select value={adminUnit} onChange={(event) => setAdminUnit(event.target.value)}>
            <option value="all">全部單元</option>
            {courseUnits.map((unit) => <option key={unit.id} value={unit.id}>單元 {unit.number}・{unit.title}</option>)}
          </select>
          <span>顯示 {filteredRows.length} 筆</span>
        </div>
        <div className="progress-table-wrap admin-table-wrap">
          <table className="data-table admin-table">
            <thead><tr><th>課程</th><th>類型</th><th>英文答案</th><th>繁中提示</th><th>詞性</th><th>KK</th><th>IPA</th><th>QA</th></tr></thead>
            <tbody>{filteredRows.map((row) => (
              <tr key={row.occurrence_id}>
                <td><strong>{row.lesson_title}</strong><small>{row.lesson_id}<br />順序 {row.token_order}</small></td>
                <td><span className="chip">{row.chunk_id ? "單字＋語塊" : "單字"}</span></td>
                <td><input value={row.answer} onChange={(event) => updateCourseDraftRow(row, { answer: event.target.value })} /></td>
                <td><input value={row.prompt} onChange={(event) => updateCourseDraftRow(row, { prompt: event.target.value })} /></td>
                <td><input value={row.context_pos} onChange={(event) => updateCourseDraftRow(row, { context_pos: event.target.value, partOfSpeech: event.target.value })} /></td>
                <td><input value={row.kk_us} onChange={(event) => updateCourseDraftRow(row, { kk_us: event.target.value, kk: event.target.value })} /></td>
                <td><input value={row.ipa_standalone} onChange={(event) => updateCourseDraftRow(row, { ipa_standalone: event.target.value, ipa_us: event.target.value, ipa: event.target.value })} /></td>
                <td><span className="qa-status">{row.qa_status || "待人工確認"}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
