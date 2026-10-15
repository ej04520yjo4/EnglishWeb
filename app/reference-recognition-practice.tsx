"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { localDateKey } from "./local-date.ts";
import type { ReferenceRecognitionQuestion } from "./reference-vocabulary-practice.ts";

const activateOnEnter = (
  event: KeyboardEvent<HTMLButtonElement>,
  action: () => void,
) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  if (!event.repeat) action();
};

type Props = {
  title: string;
  questions: ReferenceRecognitionQuestion[];
  onAnswer: (question: ReferenceRecognitionQuestion, answer: string) => void;
  onExit: () => void;
};

function RecognitionQuestion({
  question,
  position,
  total,
  onAnswer,
  onNext,
  onExit,
}: {
  question: ReferenceRecognitionQuestion;
  position: number;
  total: number;
  onAnswer: Props["onAnswer"];
  onNext: (correct: boolean) => void;
  onExit: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const [expired, setExpired] = useState(false);
  const submitted = useRef(false);
  const advanced = useRef(false);
  const checkButton = useRef<HTMLButtonElement | null>(null);
  const isCurrentDay = () => question.studyDate === localDateKey();
  useEffect(() => {
    const expire = () => {
      if (question.studyDate !== localDateKey()) setExpired(true);
    };
    const timer = window.setInterval(expire, 30_000);
    window.addEventListener("focus", expire);
    document.addEventListener("visibilitychange", expire);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", expire);
      document.removeEventListener("visibilitychange", expire);
    };
  }, [question.studyDate]);
  const check = () => {
    if (submitted.current || !selected) return;
    if (!isCurrentDay()) {
      setExpired(true);
      return;
    }
    submitted.current = true;
    onAnswer(question, selected);
    setChecked(true);
  };
  const next = () => {
    if (!checked || advanced.current) return;
    if (!isCurrentDay()) {
      setExpired(true);
      return;
    }
    advanced.current = true;
    onNext(selected === question.answer);
  };

  if (expired) {
    return (
      <section className="section-card" role="status">
        <h2>已進入新的一天</h2>
        <p>請返回主題重新開始；尚未送出的答案不會記錄成今天的成績。</p>
        <button className="primary-button" autoFocus onClick={onExit}
          onKeyDown={(event) => activateOnEnter(event, onExit)}>返回相關字詞</button>
      </section>
    );
  }

  return (
    <section className="exercise-card">
      <span className="eyebrow">延伸單字辨認・{position} / {total}</span>
      <h2 className="chinese-prompt" lang="en-US" data-testid="reference-recognition-word">
        {question.displayEnglish}
      </h2>
      <p className="exercise-instruction">請選出這個單字的意思，再按「確認答案」。</p>
      <div className="exercise-choice-list" role="group" aria-label="單字意思選項">
        {question.options.map((option, index) => (
          <button
            key={option}
            className={`exercise-choice ${selected === option ? "selected" : ""} ${checked && option === question.answer ? "correct" : ""} ${checked && selected === option && option !== question.answer ? "wrong" : ""}`}
            data-testid="reference-recognition-option"
            aria-pressed={selected === option}
            disabled={checked}
            autoFocus={index === 0}
            onClick={() => setSelected(option)}
            onKeyDown={(event) => activateOnEnter(event, () => {
              setSelected(option);
              // Let React enable the confirmation button before moving focus.
              window.requestAnimationFrame(() => checkButton.current?.focus());
            })}
          >
            {option}
          </button>
        ))}
      </div>
      {checked ? (
        <>
          <p className={`feedback ${selected !== question.answer ? "warning" : ""}`}
            role="status" data-testid="reference-recognition-feedback">
            {selected === question.answer ? "答對了！" : "這次還不熟悉，先記住正確意思。"}
            {question.displayEnglish}＝{question.answer}。
            <br />不同日期的兩次正確辨認，才會計為「可以辨認」。
          </p>
          <button key="next" className="primary-button full-button" autoFocus
            data-testid="reference-recognition-next" onClick={next}
            onKeyDown={(event) => activateOnEnter(event, next)}>
            {position === total ? "查看本輪結果" : "下一個單字 →"}
          </button>
        </>
      ) : (
        <button key="check" ref={checkButton} className="primary-button full-button"
          data-testid="reference-recognition-check" disabled={!selected} onClick={check}
          onKeyDown={(event) => activateOnEnter(event, check)}>
          確認答案
        </button>
      )}
    </section>
  );
}

export function ReferenceRecognitionPractice({ title, questions, onAnswer, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const question = questions[index];
  return (
    <div className="learning-shell" data-testid="reference-recognition-practice">
      <button className="back-button" onClick={onExit}>← 返回相關字詞</button>
      <h1>{title}・辨認練習</h1>
      <p className="qa-note">
        參考詞彙試行：英文、繁中與音標仍待人工複核。每字每天只記錄第一次作答；
        答錯會顯示答案，隔天再練習。不計入課程完成、單元測驗或主動拼寫能力。
      </p>
      {question ? (
        <RecognitionQuestion key={question.id} question={question} position={index + 1}
          total={questions.length} onAnswer={onAnswer} onExit={onExit}
          onNext={(correct) => {
            setCorrectCount((current) => current + (correct ? 1 : 0));
            setIndex((current) => current + 1);
          }} />
      ) : (
        <section className="section-card" data-testid="reference-recognition-summary">
          <h2>本輪辨認練習完成</h2>
          <p>完成 {questions.length} 個單字，本輪答對 {correctCount} 個。</p>
          <p>作答已存入本機學習紀錄。返回主題可繼續其他未答字詞；今天已答過的字，請隔天再來。</p>
          <button className="primary-button full-button" autoFocus onClick={onExit}
            onKeyDown={(event) => activateOnEnter(event, onExit)}>返回相關字詞</button>
        </section>
      )}
    </div>
  );
}
