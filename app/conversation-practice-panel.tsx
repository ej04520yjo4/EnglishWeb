"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { A1CourseCsvRow } from "./a1-mvp-data";
import { localDateKey } from "./local-date";
import {
  CONVERSATION_STORAGE_KEY,
  advanceConversation,
  canStartConversation,
  conversationResultId,
  emptyConversationStore,
  getConversationTurnRecord,
  gradeConversationAnswer,
  loadConversationData,
  markConversationSupport,
  restoreConversationStore,
  saveConversationSession,
  startConversation,
  submitConversationAnswer,
  type ConversationData,
  type ConversationResult,
  type ConversationScenario,
  type ConversationSession,
  type ConversationStore,
} from "./conversation-practice";

type Props = {
  sourceRows: A1CourseCsvRow[];
  completedLessonIds: string[];
  a2Unlocked: boolean;
  allowPilotPreview: boolean;
  onSpeak: (text: string, rate: number) => void;
  audioAvailable: boolean;
  onExit?: () => void;
};

type ConversationView = "overview" | "preparation" | "active" | "summary";
type RepairKind = "repeat" | "slow";

const today = () => localDateKey();

const cleanAnswer = (value: string) =>
  value
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();

const activateOnEnter = (
  event: KeyboardEvent<HTMLButtonElement>,
  action: () => void,
) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  if (!event.repeat) action();
};

const repairPrompts: Record<RepairKind, {
  title: string;
  instruction: string;
  rate: number;
  answers: string[];
}> = {
  repeat: {
    title: "請對方重說",
    instruction: "請輸入一個禮貌的英文說法，請對方再說一次。",
    rate: 1,
    answers: [
      "Could you say that again, please?",
      "Could you say that again please?",
      "Could you repeat that, please?",
      "Could you repeat that please?",
    ],
  },
  slow: {
    title: "請說慢一點",
    instruction: "請輸入一個禮貌的英文說法，請對方說慢一點。",
    rate: 0.75,
    answers: [
      "Could you speak more slowly, please?",
      "Could you speak more slowly please?",
      "Could you speak slower, please?",
      "Could you speak slower please?",
      "Could you talk more slowly, please?",
      "Could you talk more slowly please?",
    ],
  },
};

const repairExpectedLabel = (kind: RepairKind) =>
  kind === "repeat"
    ? "Could you say that again, please?"
    : "Could you speak more slowly, please?";

function AudioButton({
  label,
  text,
  rate,
  onSpeak,
  audioAvailable,
}: {
  label: string;
  text: string;
  rate: number;
  onSpeak: Props["onSpeak"];
  audioAvailable: boolean;
}) {
  return (
    <button
      className="secondary-button conversation-audio-button"
      type="button"
      disabled={!audioAvailable}
      onClick={() => onSpeak(text, rate)}
      aria-label={audioAvailable ? label : `${label}（語音播放不可用）`}
    >
      ▶ {label}
    </button>
  );
}

function ScenarioCard({
  scenario,
  enabled,
  completed,
  active,
  blockedByActive,
  blockedByStorage,
  result,
  onSelect,
}: {
  scenario: ConversationScenario;
  enabled: boolean;
  completed: boolean;
  active: boolean;
  blockedByActive: boolean;
  blockedByStorage: boolean;
  result?: ConversationResult;
  onSelect: () => void;
}) {
  return (
    <article className={`conversation-scenario-card ${!enabled ? "is-disabled" : ""}`}>
      <div>
        <span className="eyebrow">{scenario.level}・情境對話</span>
        <h2>{scenario.title}</h2>
        <p>{scenario.summaryZhTw}</p>
      </div>
      <div className="conversation-scenario-meta">
        <span>{scenario.turns.length} 個回應回合</span>
        {completed && <span className="status-pill">已完成</span>}
      </div>
      {result && (
        <small className="conversation-result-note">
          下次複習：{result.dueDate}・{result.independentTurns} 題可獨立回應，{result.assistedTurns} 題使用提示或協助
        </small>
      )}
      <button
        className={enabled ? "primary-button" : "secondary-button"}
        type="button"
        disabled={!enabled}
        data-testid={`conversation-scenario-${scenario.id}`}
        onClick={onSelect}
        onKeyDown={(event) => activateOnEnter(event, onSelect)}
      >
        {enabled ? (active ? "繼續對話" : completed ? "重新練習" : "查看情境") : blockedByStorage ? "先處理本機紀錄" : blockedByActive ? "先完成目前對話" : "完成前置課程後解鎖"}
      </button>
    </article>
  );
}

function ListenFirstControl({
  checked,
  audioAvailable,
  onChange,
}: {
  checked: boolean;
  audioAvailable: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="conversation-listen-toggle">
      <input
        type="checkbox"
        checked={checked}
        disabled={!audioAvailable}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <strong>先聽再看文字</strong>
        <small>{audioAvailable ? "先按播放理解對方，再自行打開英文與中文" : "此瀏覽器沒有可用的語音播放"}</small>
      </span>
    </label>
  );
}

function Preparation({
  scenario,
  onBack,
  onStart,
  listenFirst,
  audioAvailable,
  onListenFirstChange,
}: {
  scenario: ConversationScenario;
  onBack: () => void;
  onStart: () => void;
  listenFirst: boolean;
  audioAvailable: boolean;
  onListenFirstChange: (checked: boolean) => void;
}) {
  return (
    <section className="section-card conversation-preparation" data-testid="conversation-preparation">
      <button className="back-button" type="button" onClick={onBack}>
        ← 返回對話情境
      </button>
      <span className="eyebrow">開始前先準備</span>
      <h1>{scenario.title}</h1>
      <p>{scenario.summaryZhTw}</p>
      <div className="conversation-preparation-list">
        {scenario.preparation.map((item) => (
          <article key={`${item.english}-${item.translationZhTw}`}>
            <strong lang="en-US">{item.english}</strong>
            <span>{item.translationZhTw}</span>
            <small>{item.noteZhTw}</small>
          </article>
        ))}
      </div>
      <ListenFirstControl
        checked={listenFirst}
        audioAvailable={audioAvailable}
        onChange={onListenFirstChange}
      />
      <p className="qa-note">
        這是文字回應練習，不是自由聊天評分。系統只接受本題列出的合理回答，讓你先熟悉可直接套用的句型。
      </p>
      <button
        className="primary-button full-button"
        type="button"
        autoFocus
        data-testid="conversation-start"
        onClick={onStart}
        onKeyDown={(event) => activateOnEnter(event, onStart)}
      >
        開始情境對話 →
      </button>
    </section>
  );
}

function RepairPractice({
  kind,
  partnerEnglish,
  value,
  revealed,
  attempts,
  audioAvailable,
  onSpeak,
  onChange,
  onPaste,
  onCheck,
  onClose,
}: {
  kind: RepairKind;
  partnerEnglish: string;
  value: string;
  revealed: boolean;
  attempts: number;
  audioAvailable: boolean;
  onSpeak: Props["onSpeak"];
  onChange: (value: string) => void;
  onPaste: () => void;
  onCheck: () => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prompt = repairPrompts[kind];
  const accepted = prompt.answers.some((answer) => cleanAnswer(answer) === cleanAnswer(value));
  useEffect(() => {
    inputRef.current?.focus();
  }, [kind]);
  return (
    <div className="conversation-repair" data-testid="conversation-repair">
      <div className="conversation-repair-heading">
        <div>
          <span className="eyebrow">修復對話</span>
          <h3>{prompt.title}</h3>
        </div>
        <button className="text-button" type="button" onClick={onClose}>先返回</button>
      </div>
      <p>{prompt.instruction}</p>
      <div className="conversation-repair-context">
        <span>對方剛才說：</span>
        <strong lang="en-US">{partnerEnglish}</strong>
      </div>
      <div className="conversation-repair-model">
        <span>禮貌說法範例（先讀一次，再自行輸入）</span>
        <strong lang="en-US">{repairExpectedLabel(kind)}</strong>
      </div>
      <input
        ref={inputRef}
        className="answer-input"
        data-testid="conversation-repair-input"
        value={value}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onPaste={onPaste}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.repeat && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onCheck();
          }
        }}
        placeholder="輸入英文，再按 Enter"
      />
      <p className={`feedback ${revealed && !accepted ? "warning" : ""}`} role="status">
        {accepted ? "很好，這樣就能禮貌地請對方調整說法。" : revealed ? `請重新輸入：${repairExpectedLabel(kind)}` : attempts ? "尚未符合本題練習目標，再試一次。" : ""}
      </p>
      {revealed && (
        <div className="correct-format" lang="en-US">{repairExpectedLabel(kind)}</div>
      )}
      <div className="conversation-repair-actions">
        <AudioButton
          label="重播對方"
          text={partnerEnglish}
          rate={prompt.rate}
          onSpeak={onSpeak}
          audioAvailable={audioAvailable}
        />
        <button
          className="primary-button"
          type="button"
          data-testid="conversation-repair-check"
          onClick={onCheck}
          onKeyDown={(event) => activateOnEnter(event, onCheck)}
        >
          {accepted ? "完成修復並重播 →" : "檢查說法"}
        </button>
      </div>
    </div>
  );
}

function ActiveConversation({
  scenario,
  session,
  onSessionChange,
  onSpeak,
  audioAvailable,
  data,
  onError,
  listenFirst,
}: {
  scenario: ConversationScenario;
  session: ConversationSession;
  onSessionChange: (session: ConversationSession) => void;
  onSpeak: Props["onSpeak"];
  audioAvailable: boolean;
  data: ConversationData;
  onError: (message: string) => void;
  listenFirst: boolean;
}) {
  const turn = scenario.turns[session.turnIndex];
  const record = turn ? getConversationTurnRecord(session) : undefined;
  const [value, setValue] = useState("");
  const [outcome, setOutcome] = useState<"correct" | "wrong" | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [repairKind, setRepairKind] = useState<RepairKind | null>(null);
  const [repairValue, setRepairValue] = useState("");
  const [repairAttempts, setRepairAttempts] = useState(0);
  const [repairRevealed, setRepairRevealed] = useState(false);
  const [repairPaste, setRepairPaste] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [textRevealed, setTextRevealed] = useState(false);

  // Each turn is keyed by the parent, so focusing on mount keeps the flow
  // keyboard-first after advancing and also restores focus after a reload.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!turn || !record) {
    return <section className="section-card"><p>對話回合資料暫時無法載入。</p></section>;
  }

  const updateSupport = (kind: "hint" | "paste" | "repair") => {
    try {
      onSessionChange(markConversationSupport(data, session, kind));
    } catch (error) {
      onError(error instanceof Error ? error.message : "對話協助紀錄無法儲存。 ");
    }
  };

  const check = () => {
    if (!value.trim() || record.completed) return;
    const answer = value.trim();
    if (!answer) return;
    setValue(answer);
    const correct = gradeConversationAnswer(answer, turn);
    let next: ConversationSession;
    try {
      next = submitConversationAnswer(data, session, answer);
      onSessionChange(next);
    } catch (error) {
      onError(error instanceof Error ? error.message : "對話答案無法儲存，請重新整理後再試。 ");
      return;
    }
    setOutcome(correct ? "correct" : "wrong");
    if (!correct && getConversationTurnRecord(next).answerRevealed) {
      setValue("");
    }
  };

  const next = () => {
    const current = getConversationTurnRecord(session);
    if (!current.completed) return;
    try {
      onSessionChange(advanceConversation(data, session));
    } catch (error) {
      onError(error instanceof Error ? error.message : "對話進度無法儲存，請重新整理後再試。 ");
    }
  };

  const openRepair = (kind: RepairKind) => {
    updateSupport("repair");
    setRepairKind(kind);
    setRepairValue("");
    setRepairAttempts(0);
    setRepairRevealed(false);
  };

  const checkRepair = () => {
    if (!repairKind || !repairValue.trim()) return;
    if (repairRevealed && !repairPrompts[repairKind].answers.some((answer) => cleanAnswer(answer) === cleanAnswer(repairValue))) return;
    const accepted = repairPrompts[repairKind].answers.some((answer) => cleanAnswer(answer) === cleanAnswer(repairValue));
    if (!accepted) {
      const nextAttempts = repairAttempts + 1;
      setRepairAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        setRepairRevealed(true);
        setRepairValue("");
      }
      return;
    }
    onSpeak(turn.partnerEnglish, repairPrompts[repairKind].rate);
    setRepairKind(null);
    setRepairValue("");
    setRepairAttempts(0);
    setRepairRevealed(false);
  };

  const currentRecord = getConversationTurnRecord(session);
  const checkedCorrect = currentRecord.completed && outcome === "correct";
  const canAdvance = currentRecord.completed;
  const hidePartnerText = listenFirst && audioAvailable && !textRevealed;

  return (
    <section className="section-card conversation-active" data-testid="conversation-active">
      <div className="conversation-progress-row">
        <span className="eyebrow">{scenario.title}</span>
        <span>回應 {session.turnIndex + 1} / {scenario.turns.length}</span>
      </div>
      <div className="conversation-partner-bubble">
        <span className="conversation-role">對方</span>
        {hidePartnerText ? (
          <p className="conversation-listen-first-prompt">先聽對方，再決定是否查看文字。</p>
        ) : (
          <>
            <p lang="en-US">{turn.partnerEnglish}</p>
            <small>{turn.partnerZhTw}</small>
          </>
        )}
        <div className="conversation-audio-actions">
          <AudioButton label="聽正常速度" text={turn.partnerEnglish} rate={1} onSpeak={onSpeak} audioAvailable={audioAvailable} />
          <AudioButton label="聽慢速" text={turn.partnerEnglish} rate={0.75} onSpeak={onSpeak} audioAvailable={audioAvailable} />
        </div>
        {hidePartnerText && (
          <button
            className="text-button conversation-reveal-text"
            type="button"
            data-testid="conversation-reveal-text"
            onClick={() => setTextRevealed(true)}
            onKeyDown={(event) => activateOnEnter(event, () => setTextRevealed(true))}
          >
            查看對方文字
          </button>
        )}
      </div>
      <div className="conversation-goal">
        <strong>你的回應目標</strong>
        <p>{turn.goalZhTw}</p>
      </div>
      {repairKind ? (
        <RepairPractice
          kind={repairKind}
          partnerEnglish={turn.partnerEnglish}
          value={repairValue}
          revealed={repairRevealed}
          attempts={repairAttempts}
          audioAvailable={audioAvailable}
          onSpeak={onSpeak}
          onChange={setRepairValue}
          onPaste={() => {
            setRepairPaste(true);
            if (!repairPaste) updateSupport("paste");
          }}
          onCheck={checkRepair}
          onClose={() => setRepairKind(null)}
        />
      ) : (
        <>
          <label className="field-label" htmlFor="conversation-turn-input">輸入你的英文回應</label>
          <input
            ref={inputRef}
            id="conversation-turn-input"
            className="answer-input conversation-turn-input"
            data-testid="conversation-turn-input"
            value={value}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onPaste={() => updateSupport("paste")}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.repeat && !event.nativeEvent.isComposing) {
                event.preventDefault();
                check();
              }
            }}
            placeholder="輸入英文，按 Enter 檢查"
            readOnly={currentRecord.completed}
          />
          <button
            className="primary-button full-button conversation-check-button"
            type="button"
            data-testid="conversation-check"
            disabled={!value.trim() || currentRecord.completed}
            onClick={check}
            onKeyDown={(event) => activateOnEnter(event, check)}
          >
            檢查回應
          </button>
          <div className="conversation-support-actions">
            <button
              className="secondary-button"
              type="button"
              data-testid="conversation-hint"
              disabled={hintVisible}
              onClick={() => {
                updateSupport("hint");
                setHintVisible(true);
                inputRef.current?.focus();
              }}
            >
              顯示句型提示
            </button>
            <button className="text-button" type="button" data-testid="conversation-repair-repeat" onClick={() => openRepair("repeat")}>
              請對方重說
            </button>
            <button className="text-button" type="button" data-testid="conversation-repair-slow" onClick={() => openRepair("slow")}>
              請說慢一點
            </button>
          </div>
          {hintVisible && <p className="conversation-hint" role="status">提示：{turn.hintZhTw}</p>}
          <p className={`feedback ${outcome === "wrong" ? "warning" : ""}`} role="status" data-testid="conversation-feedback">
            {outcome === "correct" && (turn.feedbackZhTw || "回應符合本題練習目標。")}
            {outcome === "wrong" && !currentRecord.answerRevealed && "尚未符合本題練習目標，再試一次。"}
            {outcome === "wrong" && currentRecord.answerRevealed && "先看參考答案，再重新輸入一次才能繼續。"}
          </p>
          {currentRecord.answerRevealed && (
            <div className="conversation-reference-answer" data-testid="conversation-reference-answer">
              <span>參考回答</span>
              <strong lang="en-US">{turn.answers[0]}</strong>
            </div>
          )}
          {canAdvance && (
            <button
              className="primary-button full-button"
              type="button"
              autoFocus
              data-testid="conversation-next"
              onClick={next}
              onKeyDown={(event) => activateOnEnter(event, next)}
            >
              {session.turnIndex + 1 === scenario.turns.length ? "完成情境對話 →" : "下一個回應 →"}
            </button>
          )}
          {!audioAvailable && <p className="audio-unavailable" role="status">此瀏覽器不支援語音播放；你仍可使用文字回應練習。</p>}
          {checkedCorrect && <span className="visually-hidden">回答正確</span>}
        </>
      )}
    </section>
  );
}

export function ConversationPractice({
  sourceRows,
  completedLessonIds,
  a2Unlocked,
  allowPilotPreview,
  onSpeak,
  audioAvailable,
  onExit,
}: Props) {
  const [data, setData] = useState<ConversationData | null>(null);
  const [store, setStore] = useState<ConversationStore | null>(null);
  const [view, setView] = useState<ConversationView>("overview");
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastResult, setLastResult] = useState<ConversationResult | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [summaryWasJustCompleted, setSummaryWasJustCompleted] = useState(false);
  const [listenFirst, setListenFirst] = useState(false);

  useEffect(() => {
    const reloadOnF5 = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "F5" || event.repeat) return;
      event.preventDefault();
      window.location.reload();
    };
    window.addEventListener("keydown", reloadOnF5);
    return () => window.removeEventListener("keydown", reloadOnF5);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadConversationData(sourceRows)
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded);
        let restored: ConversationStore;
        try {
          setHasBackup(Boolean(window.localStorage.getItem(CONVERSATION_STORAGE_KEY)));
          restored = restoreConversationStore(
            window.localStorage.getItem(CONVERSATION_STORAGE_KEY),
            loaded,
            today(),
          );
          setStorageBlocked(false);
          setError("");
        } catch (restoreError) {
          restored = emptyConversationStore(loaded);
          setStorageBlocked(true);
          setError(restoreError instanceof Error ? restoreError.message : "對話學習紀錄格式無法讀取，已隔離本功能資料。 ");
        }
        setStore(restored);
        if (restored.active) {
          setSelectedScenarioId(restored.active.scenarioId);
          setView("active");
          setSummaryWasJustCompleted(false);
        } else {
          const result = Object.values(restored.results)
            .filter(
              (candidate) =>
                candidate.sourceRevision === loaded.sourceRevision &&
                loaded.scenarios.some((item) => item.id === candidate.scenarioId),
            )
            .sort((a, b) => b.studyDate.localeCompare(a.studyDate))[0];
          setLastResult(result ?? null);
          if (result) {
            setSelectedScenarioId(result.scenarioId);
            setView("summary");
          }
          setSummaryWasJustCompleted(false);
        }
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setLoading(false);
        setError(loadError instanceof Error ? loadError.message : "對話資料暫時無法載入。 ");
      });
    return () => {
      cancelled = true;
    };
  }, [sourceRows]);

  const scenario = useMemo(
    () => data?.scenarios.find((item) => item.id === selectedScenarioId),
    [data, selectedScenarioId],
  );
  const activeScenario = useMemo(
    () => data?.scenarios.find((item) => item.id === store?.active?.scenarioId),
    [data, store?.active?.scenarioId],
  );
  const resultForScenario = (scenarioId: string, sourceStore = store) =>
    Object.values(sourceStore?.results ?? {})
      .filter(
        (result) =>
          result.scenarioId === scenarioId &&
          result.sourceRevision === data?.sourceRevision,
      )
      .sort((a, b) => b.studyDate.localeCompare(a.studyDate))[0];
  const activeConversationAllowed = activeScenario
    ? canStartConversation(
        activeScenario,
        completedLessonIds,
        a2Unlocked,
        allowPilotPreview,
      )
    : false;

  const recoverExpiredActiveSession = (message: string) => {
    if (!data || !store?.active || store.active.studyDate === today()) {
      return false;
    }
    try {
      // Re-validate the current in-memory store through the same restore path
      // used on reload. An expired active session is dropped while results and
      // turnHistory remain intact.
      const recovered = restoreConversationStore(
        JSON.stringify(store),
        data,
        today(),
      );
      window.localStorage.setItem(
        CONVERSATION_STORAGE_KEY,
        JSON.stringify(recovered),
      );
      setStore(recovered);
      setHasBackup(true);
      setStorageBlocked(false);
      setSelectedScenarioId("");
      setLastResult(null);
      setSummaryWasJustCompleted(false);
      setView("overview");
      setError(`${message} 已保留本次作答紀錄，請重新開始這段對話。`);
      return true;
    } catch (recoveryError) {
      setStorageBlocked(true);
      setError(
        recoveryError instanceof Error
          ? recoveryError.message
          : "跨日對話紀錄無法重新整理；原紀錄仍保留，請先備份後再處理。",
      );
      return false;
    }
  };

  const persistSession = (session: ConversationSession) => {
    if (!data || !store) return;
    try {
      const nextStore = saveConversationSession(store, data, session);
      window.localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(nextStore));
      setHasBackup(true);
      setStore(nextStore);
      setError("");
      if (!nextStore.active) {
        const resultKey = conversationResultId(
          session.scenarioId,
          session.studyDate,
          session.sourceRevision,
        );
        const result = nextStore.results[resultKey] ?? resultForScenario(session.scenarioId, nextStore) ?? null;
        setLastResult(result);
        setSummaryWasJustCompleted(!store.results[resultKey]);
        setView("summary");
      } else {
        setView("active");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "對話進度無法儲存。正式課程不受影響。 ";
      if (message.includes("日期已變更") && recoverExpiredActiveSession(message)) {
        return;
      }
      setStorageBlocked(true);
      setError(message);
    }
  };

  const downloadConversationBackup = () => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(CONVERSATION_STORAGE_KEY);
    } catch (error) {
      setError(error instanceof Error ? error.message : "無法讀取對話紀錄備份。 ");
      return;
    }
    if (!raw) return;
    const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "yingju-conversation-practice-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetConversationStorage = () => {
    if (!data) return;
    try {
      window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    } catch (error) {
      setError(error instanceof Error ? error.message : "無法重設對話紀錄。 ");
      return;
    }
    setStore(emptyConversationStore(data));
    setStorageBlocked(false);
    setHasBackup(false);
    setError("");
    setLastResult(null);
    setSelectedScenarioId("");
    setSummaryWasJustCompleted(false);
    setView("overview");
  };

  const speakSafely = (text: string, rate: number) => {
    try {
      onSpeak(text, rate);
    } catch (error) {
      setError(error instanceof Error ? error.message : "語音播放暫時無法使用；仍可繼續文字練習。 ");
    }
  };

  const handleConversationError = (message: string) => {
    if (message.includes("日期已變更") && recoverExpiredActiveSession(message)) {
      return;
    }
    // Keep non-date errors visible in the current flow. In particular, do not
    // clear or overwrite an active session when a source/storage error occurs.
    setError(message);
  };

  if (loading) {
    return <section className="section-card" data-testid="conversation-practice"><strong>正在載入情境對話…</strong></section>;
  }
  if (!data || !store) {
    return (
      <section className="section-card" data-testid="conversation-practice" role="alert">
        <h1>情境對話暫時無法使用</h1>
        <p>{error || "對話資料尚未準備完成。"}</p>
        <button className="secondary-button" type="button" onClick={onExit}>返回上一頁</button>
      </section>
    );
  }
  if (store.active && storageBlocked && view === "active") {
    return (
      <div className="page-stack conversation-page" data-testid="conversation-practice">
        <section className="section-card" role="alert">
          <h1>對話紀錄需要先處理</h1>
          <p>{error || "為避免覆蓋原有紀錄，暫停新的作答。請先備份或重設本功能紀錄。"}</p>
          <div className="conversation-support-actions">
            <button className="secondary-button" type="button" onClick={downloadConversationBackup} disabled={!hasBackup}>下載現有紀錄備份</button>
            <button className="secondary-button" type="button" onClick={resetConversationStorage}>重設對話紀錄</button>
            <button className="text-button" type="button" onClick={() => setView("overview")}>返回情境列表</button>
          </div>
        </section>
      </div>
    );
  }
  if (store.active && activeScenario && view === "active" && !activeConversationAllowed) {
    return (
      <div className="page-stack conversation-page" data-testid="conversation-practice">
        <section className="section-card" role="alert">
          <h1>這段對話目前尚未解鎖</h1>
          <p>前置課程或程度解鎖條件已變更，不能繞過課程順序繼續。請先回到課程地圖完成必要內容。</p>
          <button className="secondary-button" type="button" autoFocus onClick={() => setView("overview")} onKeyDown={(event) => activateOnEnter(event, () => setView("overview"))}>返回情境列表</button>
        </section>
      </div>
    );
  }
  if (store.active && activeScenario && view === "active") {
    return (
      <div className="page-stack conversation-page" data-testid="conversation-practice">
        <button className="back-button" type="button" onClick={() => setView("overview")}>← 暫停，回到情境列表</button>
        {error && <p className="qa-note" role="status">{error}</p>}
        <ActiveConversation
          key={`${activeScenario.id}:${store.active.turnIndex}`}
          scenario={activeScenario}
          session={store.active}
          data={data}
          onSpeak={speakSafely}
          audioAvailable={audioAvailable}
          listenFirst={listenFirst}
          onSessionChange={persistSession}
          onError={handleConversationError}
        />
      </div>
    );
  }
  if (view === "preparation" && scenario) {
    return (
      <div className="page-stack conversation-page" data-testid="conversation-practice">
        <Preparation
          scenario={scenario}
          onBack={() => setView("overview")}
          onStart={() => {
            const session = startConversation(data, scenario.id, today());
            persistSession(session);
          }}
          listenFirst={listenFirst}
          audioAvailable={audioAvailable}
          onListenFirstChange={setListenFirst}
        />
      </div>
    );
  }
  if (view === "summary" && lastResult && scenario) {
    const resultIsToday = lastResult.studyDate === today();
    const summaryHeading = summaryWasJustCompleted
      ? `你完成了「${scenario.title}」`
      : resultIsToday
        ? `今天首次完成紀錄：${scenario.title}`
        : `最近一次完成紀錄：${scenario.title}`;
    const summaryLead = summaryWasJustCompleted
      ? "這次"
      : resultIsToday
        ? "今天首次完成紀錄"
        : `${lastResult.studyDate}完成紀錄`;
    return (
      <div className="page-stack conversation-page" data-testid="conversation-practice">
        <section className="result-card conversation-summary" data-testid="conversation-summary">
          <div className="celebration">✓</div>
          <span className="eyebrow">情境對話完成</span>
          <h1>{summaryHeading}</h1>
          <p>{summaryLead}完成 {lastResult.turnCount} 個回應回合，其中 {lastResult.independentTurns} 題沒有使用提示或協助。</p>
          <div className="three-grid">
            <article className="stat-card"><span>獨立回應</span><strong>{lastResult.independentTurns}</strong></article>
            <article className="stat-card"><span>使用協助</span><strong>{lastResult.assistedTurns}</strong></article>
            <article className="stat-card"><span>下次複習</span><strong>{lastResult.dueDate}</strong></article>
          </div>
          <p className="qa-note">你可以自己把這段對話大聲說一遍；本功能目前不評分口說，也不使用麥克風。</p>
          <button
            className="primary-button full-button"
            type="button"
            autoFocus
            onClick={() => setView("overview")}
            onKeyDown={(event) => activateOnEnter(event, () => setView("overview"))}
          >
            回到情境列表
          </button>
        </section>
      </div>
    );
  }
  return (
    <div className="page-stack conversation-page" data-testid="conversation-practice">
      <section className="page-title conversation-title">
        <div>
          <span className="eyebrow">生活英文・文字對話</span>
          <h1>對話練習</h1>
          <p>先聽懂對方，再用完整、禮貌的英文接住對話。</p>
        </div>
        <span className="status-pill">不使用麥克風</span>
      </section>
      {storageBlocked && error && (
        <section className="qa-note conversation-storage-recovery" role="alert">
          <strong>本功能的本機紀錄需要處理</strong>
          <span>{error}</span>
          <div className="conversation-support-actions">
            <button className="secondary-button" type="button" onClick={downloadConversationBackup} disabled={!hasBackup}>
              下載現有紀錄備份
            </button>
            <button className="secondary-button" type="button" onClick={resetConversationStorage}>
              重設對話紀錄
            </button>
          </div>
        </section>
      )}
      {!storageBlocked && error && <p className="qa-note" role="status">{error}</p>}
      {allowPilotPreview && <p className="qa-note">目前為 A2 試行預覽；完成對話不會直接通過程度或解鎖正式課程。</p>}
      <ListenFirstControl
        checked={listenFirst}
        audioAvailable={audioAvailable}
        onChange={setListenFirst}
      />
      {!storageBlocked && (
        <div className="conversation-backup-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={downloadConversationBackup}
            onKeyDown={(event) => activateOnEnter(event, downloadConversationBackup)}
            disabled={!hasBackup}
          >
            下載對話紀錄備份
          </button>
          <small>對話練習紀錄獨立保存；正式課程的進度備份不包含這些紀錄。</small>
        </div>
      )}
      {store.active === null && Object.keys(store.results).length > 0 && !lastResult && (
        <p className="qa-note">上次對話紀錄已保留；選擇情境即可重新練習。</p>
      )}
      <div className="conversation-scenario-grid">
        {data.scenarios.map((item) => {
          const active = store.active?.scenarioId === item.id;
          const blockedByActive = Boolean(store.active && (!active || !activeConversationAllowed));
          const blockedByStorage = storageBlocked;
          const enabled = !blockedByStorage && (active
            ? activeConversationAllowed
            : !store.active && canStartConversation(item, completedLessonIds, a2Unlocked, allowPilotPreview));
          const result = resultForScenario(item.id);
          const completed = Boolean(result);
          return (
            <ScenarioCard
              key={item.id}
              scenario={item}
              enabled={enabled}
              completed={completed}
              active={active}
              blockedByActive={blockedByActive}
              blockedByStorage={blockedByStorage}
              result={result}
              onSelect={() => {
                setSelectedScenarioId(item.id);
                setLastResult(result ?? null);
                setView(active ? "active" : "preparation");
              }}
            />
          );
        })}
      </div>
      {!audioAvailable && <p className="audio-unavailable" role="status">此瀏覽器不支援語音播放；仍可使用文字輸入完成練習。</p>}
      {onExit && <button className="text-button" type="button" onClick={onExit}>返回首頁</button>}
    </div>
  );
}

