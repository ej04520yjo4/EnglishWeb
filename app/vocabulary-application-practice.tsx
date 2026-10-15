"use client";

import { useState } from "react";
import { gradeVocabularyApplication, type VocabularyApplicationQuestion } from "./vocabulary-application";

export function VocabularyApplicationPractice({ question, sentence, onAnswer, onExit }: {
  question: VocabularyApplicationQuestion;
  sentence: string;
  onAnswer: (answer: string, usedPaste: boolean, answerRevealed: boolean) => void;
  onExit: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [usedPaste, setUsedPaste] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const correct = gradeVocabularyApplication(answer, sentence);

  const check = () => {
    if (complete || !answer.trim()) return;
    try {
      onAnswer(answer, usedPaste, revealed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "作答紀錄失敗，請重新開始。");
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    if (correct) setComplete(true);
    else if (next >= 3) { setRevealed(true); setAnswer(""); }
  };

  return <section className="section-card vocabulary-library-practice" data-testid="vocabulary-library-application-practice">
    <button className="back-button" onClick={onExit}>← 返回 3000 單字庫</button>
    <span className="eyebrow">情境句子應用・試行內容</span>
    <h2>{question.promptZhTw}</h2>
    <p>請使用 <strong>{question.targetForm}</strong>，輸入完整英文參考句（{question.wordCount} 個字）。</p>
    <p>{question.noteZhTw}</p>
    <small>這是獨立情境練習，不代表已通過任何課程。以參考句對照，大小寫與句尾標點寬鬆；不是自由作文批改。</small>
    <label className="vocabulary-search">
      <span>完整英文句子</span>
      <textarea className="answer-input" data-testid="vocabulary-library-application-input" aria-label="輸入完整英文應用句"
        autoFocus value={answer} disabled={complete} autoComplete="off" spellCheck={false}
        onChange={(event) => setAnswer(event.target.value)} onPaste={() => setUsedPaste(true)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
          event.preventDefault();
          if (event.repeat) return;
          check();
        }} />
    </label>
    {attempts > 0 && !complete && !revealed && <p className="feedback warning" role="status">與本題參考句還有差異，請檢查語序與拼字；第 {attempts} 次作答。第三次會顯示完整句子。</p>}
    {revealed && !complete && <p className="feedback warning" role="status" data-testid="vocabulary-library-application-revealed">參考答案：{sentence}。請重新輸入後再繼續。</p>}
    {error && <p className="feedback warning" role="alert">{error}</p>}
    {complete && <div role="status" data-testid="vocabulary-library-application-feedback">
      <p className="feedback">完成句子應用：{sentence}</p>
      <small>同一單字每天只記錄首次作答；答錯後重試、貼上或揭示答案不會新增乾淨應用證據。</small>
    </div>}
    {complete ? <button className="primary-button full-button" autoFocus onClick={onExit} onKeyDown={(event) => { if (event.key === "Enter" && event.repeat) event.preventDefault(); }}>返回單字庫</button>
      : <button className="primary-button full-button" data-testid="vocabulary-library-application-check" disabled={!answer.trim() || (revealed && !correct)} onClick={check}
        onKeyDown={(event) => { if (event.key === "Enter" && (event.repeat || event.nativeEvent.isComposing)) event.preventDefault(); }}>{revealed ? "重新輸入並完成" : "檢查完整句子"}</button>}
  </section>;
}
