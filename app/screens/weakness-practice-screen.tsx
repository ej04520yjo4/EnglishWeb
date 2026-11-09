import type * as React from "react";
import { activateButtonOnEnter } from "../home-model";
import type { VocabularyWeakness } from "../daily-learning";
import type { DailySessionState } from "../daily-session";
import type { Screen, WeaknessPracticeSource } from "../home-model";

export type WeaknessPracticeScreenProps = {
  checkWeaknessPractice: () => void;
  continueWeaknessPractice: () => void;
  dailySession: DailySessionState | null;
  recognitionOptionsForWeakness: (source: WeaknessPracticeSource) => string[];
  setScreen: React.Dispatch<React.SetStateAction<Screen>>;
  setWeaknessPracticeUsedPaste: React.Dispatch<React.SetStateAction<boolean>>;
  setWeaknessPracticeValue: React.Dispatch<React.SetStateAction<string>>;
  speak: (text: string, rate?: number, countReplay?: boolean) => void;
  vocabularyPracticeSources: Map<string, WeaknessPracticeSource>;
  vocabularyWeaknesses: VocabularyWeakness[];
  weaknessPracticeChecked: boolean;
  weaknessPracticeFeedback: string;
  weaknessPracticeIndex: number;
  weaknessPracticeQueue: string[];
  weaknessPracticeReturnScreen: "weakness" | "daily-summary";
  weaknessPracticeRevealed: boolean;
  weaknessPracticeValue: string;
};

export function WeaknessPracticeScreen({
  checkWeaknessPractice,
  continueWeaknessPractice,
  dailySession,
  recognitionOptionsForWeakness,
  setScreen,
  setWeaknessPracticeUsedPaste,
  setWeaknessPracticeValue,
  speak,
  vocabularyPracticeSources,
  vocabularyWeaknesses,
  weaknessPracticeChecked,
  weaknessPracticeFeedback,
  weaknessPracticeIndex,
  weaknessPracticeQueue,
  weaknessPracticeReturnScreen,
  weaknessPracticeRevealed,
  weaknessPracticeValue,
}: WeaknessPracticeScreenProps) {

    const lexemeId = weaknessPracticeQueue[weaknessPracticeIndex] ?? "";
    const dailyWeaknessSession =
      weaknessPracticeReturnScreen === "daily-summary" ? dailySession : null;
    const weaknessDisplayIndex = dailyWeaknessSession
      ? dailyWeaknessSession.completedWeaknessLexemeIds.length +
        weaknessPracticeIndex +
        1
      : weaknessPracticeIndex + 1;
    const weaknessDisplayTotal = dailyWeaknessSession
      ? dailyWeaknessSession.weaknessLexemeIds.length
      : weaknessPracticeQueue.length;
    const weakness = vocabularyWeaknesses.find(
      (item) => item.lexemeId === lexemeId,
    );
    const source = vocabularyPracticeSources.get(lexemeId);
    if (!lexemeId || !weakness || !source) {
      return (
        <div className="page-stack" data-testid="weakness-practice">
          <section className="section-card">
            <h1>目前沒有可直接練習的弱點</h1>
            <p>完成更多正式課程作答後，系統會建立可驗證的弱點練習。</p>
            <button
              className="secondary-button"
              onClick={() => setScreen("weakness")}
            >
              返回弱點中心
            </button>
          </section>
        </div>
      );
    }
    const recognitionOptions = recognitionOptionsForWeakness(source);
    const expected =
      weakness.focus === "拼寫"
        ? source.answer
        : weakness.focus === "運用"
          ? source.sentence
          : source.prompt;
    return (
      <div className="page-stack" data-testid="weakness-practice">
        <section className="page-title">
          <div>
            <span className="eyebrow">
              弱點加強・{weaknessDisplayIndex}/{weaknessDisplayTotal}
            </span>
            <h1>{weakness.lemma}</h1>
            <p>
              目前優先加強「{weakness.focus}」。答錯不會影響課程完成或 CEFR 解鎖。
            </p>
          </div>
          <span className="level-pill">答錯 {weakness.wrongAttempts} 次</span>
        </section>
        <section className="exercise-card" key={lexemeId}>
          {weakness.focus === "拼寫" && (
            <>
              <span className="eyebrow">看中文，自己拼出英文</span>
              <h2 className="chinese-prompt">{source.prompt}</h2>
              <button
                className="audio-button"
                onClick={() => speak(source.answer)}
              >
                ▶ 聽發音
              </button>
              <input
                className="answer-input"
                data-testid="weakness-practice-input"
                value={weaknessPracticeValue}
                readOnly={weaknessPracticeChecked}
                autoFocus={!weaknessPracticeChecked}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                onPaste={() => setWeaknessPracticeUsedPaste(true)}
                onChange={(event) =>
                  setWeaknessPracticeValue(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !weaknessPracticeChecked) {
                    event.preventDefault();
                    if (event.repeat) return;
                    checkWeaknessPractice();
                  }
                }}
                placeholder="輸入英文單字"
              />
            </>
          )}
          {weakness.focus === "辨認" && (
            <>
              <span className="eyebrow">看到英文，辨認課程中的中文意思</span>
              <h2 className="chinese-prompt">{source.answer}</h2>
              <div className="exercise-choice-list">
                {recognitionOptions.map((option, index) => (
                  <button
                    key={option}
                    className={`exercise-choice ${
                      weaknessPracticeValue === option ? "selected" : ""
                    }`}
                    disabled={weaknessPracticeChecked}
                    data-testid="weakness-practice-option"
                    aria-pressed={weaknessPracticeValue === option}
                    autoFocus={index === 0 && !weaknessPracticeChecked}
                    onClick={() => setWeaknessPracticeValue(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
          {weakness.focus === "運用" && (
            <>
              <span className="eyebrow">把弱點放回完整句子</span>
              <h2 className="chinese-prompt">{source.translation}</h2>
              <textarea
                className="answer-input sentence-input"
                data-testid="weakness-practice-input"
                rows={3}
                value={weaknessPracticeValue}
                readOnly={weaknessPracticeChecked}
                autoFocus={!weaknessPracticeChecked}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                onPaste={() => setWeaknessPracticeUsedPaste(true)}
                onChange={(event) =>
                  setWeaknessPracticeValue(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.repeat &&
                    !weaknessPracticeChecked
                  ) {
                    event.preventDefault();
                    checkWeaknessPractice();
                  }
                }}
                placeholder="輸入完整英文句子"
              />
            </>
          )}
          <div
            className={`feedback ${weaknessPracticeRevealed ? "warning" : ""}`}
            aria-live="polite"
          >
            {weaknessPracticeFeedback ||
              `針對「${weakness.focus}」重新作答；連續三次錯誤後才會顯示答案。`}
          </div>
          {weaknessPracticeRevealed && (
            <div className="correct-format">{expected}</div>
          )}
          <button
            key={weaknessPracticeChecked ? "weakness-next" : "weakness-check"}
            className="primary-button full-button detail-next-button"
            data-testid="weakness-practice-action"
            autoFocus={weaknessPracticeChecked}
            onClick={
              weaknessPracticeChecked
                ? continueWeaknessPractice
                : checkWeaknessPractice
            }
            onKeyDown={(event) =>
              activateButtonOnEnter(
                event,
                weaknessPracticeChecked ? continueWeaknessPractice : checkWeaknessPractice,
              )
            }
            aria-keyshortcuts={weaknessPracticeChecked ? "Enter" : undefined}
          >
            <span>
              {weaknessPracticeChecked
                ? weaknessPracticeIndex < weaknessPracticeQueue.length - 1
                  ? "下一個弱點 →"
                  : weaknessPracticeReturnScreen === "daily-summary"
                    ? "查看今日總結 →"
                    : "完成這個弱點 →"
                : "檢查答案"}
            </span>
            {weaknessPracticeChecked && <kbd>Enter</kbd>}
          </button>
        </section>
      </div>
    );
}
