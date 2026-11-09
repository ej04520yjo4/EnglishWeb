import type * as React from "react";
import { isLevelFormallyUnlocked } from "../curriculum/progress";
import type { MultiLevelProgress } from "../curriculum/progress";
import type { SettingsState } from "../home-model";

export type SettingsScreenProps = {
  exportProgress: () => void;
  importProgress: (event: React.ChangeEvent<HTMLInputElement, Element>) => Promise<void>;
  multiProgress: MultiLevelProgress;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  settings: SettingsState;
};

export function SettingsScreen({
  exportProgress,
  importProgress,
  multiProgress,
  setSettings,
  settings,
}: SettingsScreenProps) {
  return (
    <div className="page-stack">
      <section className="page-title"><div><span className="eyebrow">個人化與備份</span><h1>設定</h1><p>設定只儲存在這台瀏覽器，不需登入。</p></div></section>
      <div className="two-grid">
        <section className="section-card settings-card">
          <h2>發音與音標</h2>
          <label><span>預設音標</span><select value={settings.phonetic} onChange={(event) => setSettings({ ...settings, phonetic: event.target.value as "KK" | "IPA" })}><option>KK</option><option>IPA</option></select></label>
          <label className="switch-row"><span><strong>題目開始自動播放</strong><small>單字或語塊播放一次</small></span><input type="checkbox" checked={settings.autoplay} onChange={(event) => setSettings({ ...settings, autoplay: event.target.checked })} /></label>
          <label><span>慢速播放速度</span><select value={settings.slowRate} onChange={(event) => setSettings({ ...settings, slowRate: Number(event.target.value) })}><option value={0.75}>75%</option><option value={0.85}>85%（建議）</option><option value={0.9}>90%</option></select></label>
          <label className="switch-row">
            <span>
              <strong>顯示進階試行課程</strong>
              <small>
                顯示 A2 試行課程，僅供內容 QA，不會偽造程度通過
              </small>
            </span>
            <input
              data-testid="a2-pilot-toggle"
              type="checkbox"
              checked={settings.showAdvancedPilots}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  showAdvancedPilots: event.target.checked,
                })
              }
            />
          </label>
          <div className="source-note">
            <strong>進階程度解鎖狀態</strong>
            <span>
              {isLevelFormallyUnlocked(
                "A2",
                multiProgress.passedLevelIds,
              )
                ? "已通過 A1 程度測驗，A2 已正式解鎖。B1 與 B2 目前保留資料但未開放。"
                : settings.showAdvancedPilots
                  ? "目前開啟 QA 試用入口；正式解鎖條件仍不會被改寫。"
                  : "通過 A1 程度總測驗後正式解鎖。"}
            </span>
          </div>
          <div className="source-note"><strong>語音來源狀態</strong><span>資料結構已預留預先產生音檔與授權欄位；目前互動版在音檔缺少時使用裝置的免費美式語音備援。</span></div>
        </section>
        <section className="section-card settings-card">
          <h2>完整學習進度備份</h2>
          <p>包含完成課程、測驗、熟悉度、複習排程與偏好設定。</p>
          <button className="secondary-button full-button" onClick={exportProgress}>匯出進度備份</button>
          <label className="primary-button full-button file-button">匯入進度備份<input type="file" accept=".json" onChange={importProgress} /></label>
          <small>匯入會以備份內容取代目前進度，建議先匯出現有資料。</small>
        </section>
      </div>
    </div>
  );
}
