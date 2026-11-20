import type * as React from "react";
import { activateButtonOnEnter } from "../home-model";
import type { Assessment, Screen } from "../home-model";

export type AssessmentScreenProps = {
  assessment: Assessment | null;
  assessmentValue: string;
  checkAssessment: () => void;
  nextAssessment: () => void;
  setAssessment: React.Dispatch<React.SetStateAction<Assessment | null>>;
  setAssessmentValue: React.Dispatch<React.SetStateAction<string>>;
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  speak: (text: string, rate?: number, countReplay?: boolean) => void;
};

export function AssessmentScreen({
  assessment,
  assessmentValue,
  checkAssessment,
  nextAssessment,
  setAssessment,
  setAssessmentValue,
  setScreen,
  speak,
}: AssessmentScreenProps) {

    if (!assessment) return null;
    const item = assessment.lessons[assessment.index];
    const finalScores = assessment.scores;
    return (
      <div className="learning-shell">
        <div className="learning-top"><button className="back-button" onClick={() => { setAssessment(null); setScreen("map"); }}>← 稍後再測</button><span>{assessment.title}・{assessment.index + 1}/{assessment.lessons.length}</span></div>
        <div className="stage-progress"><i style={{ width: `${((assessment.index + 1) / assessment.lessons.length) * 100}%` }} /></div>
        <section className="exercise-card">
          <span className="eyebrow">完整句子輸入測驗</span>
          <h1 className="chinese-prompt">{item.translation}</h1>
          <button className="audio-button centered-audio" onClick={() => speak(item.sentence)}>▶ 播放完整句子</button>
          <textarea
            key={item.id}
            className="answer-input sentence-input"
            rows={3}
            value={assessmentValue}
            disabled={assessment.checked}
            autoFocus={!assessment.checked}
            onChange={(event) => setAssessmentValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.repeat) {
                event.preventDefault();
                checkAssessment();
              }
            }}
            spellCheck={false}
            autoComplete="off"
          />
          {assessment.checked && <div className={`assessment-result ${assessment.lastScore >= 80 ? "pass" : ""}`}><strong>本題正確率 {assessment.lastScore}%</strong><span>正確句子：{item.sentence}</span></div>}
          <button
            key={assessment.checked ? "assessment-next" : "assessment-submit"}
            className="primary-button full-button detail-next-button"
            onClick={assessment.checked ? nextAssessment : checkAssessment}
            onKeyDown={(event) =>
              activateButtonOnEnter(
                event,
                assessment.checked ? nextAssessment : checkAssessment,
              )
            }
            autoFocus={assessment.checked}
            aria-keyshortcuts="Enter"
            title={assessment.checked ? "按 Enter 繼續" : "在輸入框按 Enter 送出"}
          >
            <span>
              {assessment.checked
                ? (assessment.index === assessment.lessons.length - 1 ? "查看測驗結果" : "下一題 →")
                : "送出答案"}
            </span>
            <kbd>Enter</kbd>
          </button>
          {!!finalScores.length && <small className="center-note">目前平均 {Math.round(finalScores.reduce((sum, score) => sum + score, 0) / finalScores.length)}%</small>}
        </section>
      </div>
    );
}
