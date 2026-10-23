"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  canStartConversation,
  type ConversationData,
  type ConversationStore,
  type ConversationTurn,
} from "./conversation-practice";
import {
  CONVERSATION_REVIEW_STORAGE_KEY,
  advanceConversationReview,
  currentConversationReviewRecord,
  emptyConversationReviewStore,
  getConversationWeakTurns,
  isConversationReviewDue,
  markConversationReviewSupport,
  restoreConversationReviewStore,
  saveConversationReviewSession,
  startConversationReview,
  submitConversationReviewAnswer,
  type ConversationReviewSession,
} from "./conversation-review";
import { localDateKey } from "./local-date";

type Props = {
  data: ConversationData;
  conversationStore: ConversationStore;
  completedLessonIds: string[];
  a2Unlocked: boolean;
  allowPilotPreview: boolean;
  conversationBlocked: boolean;
  onSpeak: (text: string, rate: number) => void;
  audioAvailable: boolean;
  listenFirst: boolean;
  onBack: () => void;
};

const enterAction = (event: KeyboardEvent<HTMLElement>, action: () => void) => {
  if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  if (!event.repeat && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) action();
};

function ReviewTurn({ data, session, turn, audioAvailable, listenFirst, onSpeak, onSave, onError }: {
  data: ConversationData;
  session: ConversationReviewSession;
  turn: ConversationTurn;
  audioAvailable: boolean;
  listenFirst: boolean;
  onSpeak: Props["onSpeak"];
  onSave: (session: ConversationReviewSession) => boolean;
  onError: (error: unknown) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [partnerVisible, setPartnerVisible] = useState(!listenFirst || !audioAvailable);
  const input = useRef<HTMLInputElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const record = currentConversationReviewRecord(session);

  useEffect(() => {
    if (record.completed) nextButton.current?.focus();
    else input.current?.focus();
  }, [record.completed]);

  const check = () => {
    if (!answer.trim() || record.completed) return;
    try {
      const next = submitConversationReviewAnswer(data, session, answer);
      if (onSave(next) && !record.answerRevealed && currentConversationReviewRecord(next).answerRevealed) setAnswer("");
    } catch (error) { onError(error); }
  };
  const advance = () => {
    try { onSave(advanceConversationReview(data, session)); }
    catch (error) { onError(error); }
  };
  const support = (kind: "hint" | "paste") => {
    try { return onSave(markConversationReviewSupport(data, session, kind)); }
    catch (error) { onError(error); return false; }
  };
  const speak = (rate: number) => {
    try { onSpeak(turn.partnerEnglish, rate); }
    catch (error) { onError(error); }
  };

  return (
    <section className="section-card conversation-active conversation-review-turn">
      <span className="eyebrow">弱點複習 {session.turnIndex + 1} / {session.turnIds.length}</span>
      <h2>先回想，再用自己的手把句子打出來</h2>
      <p className="qa-note">只練已學過的回應。這是文字回想練習，不是發音評分或自由對話。</p>
      <div className="conversation-partner-bubble">
        <strong>對方說</strong>
        {partnerVisible ? <><p lang="en">{turn.partnerEnglish}</p><small>{turn.partnerZhTw}</small></> : <p className="conversation-listen-first-prompt">先播放聽聽看，準備好再顯示文字。</p>}
        <div className="conversation-support-actions">
          <button className="secondary-button" type="button" disabled={!audioAvailable} onClick={() => speak(1)}>▶ 聽對方說話</button>
          <button className="secondary-button" type="button" disabled={!audioAvailable} onClick={() => speak(0.75)}>▶ 慢速播放</button>
          {!partnerVisible && <button className="text-button" type="button" onClick={() => setPartnerVisible(true)}>顯示對方文字</button>}
        </div>
      </div>
      <label className="conversation-review-answer">
        <strong>你的任務：{turn.goalZhTw}</strong>
        <span>輸入完整英文回應</span>
        <input
          ref={input}
          className="answer-input"
          data-testid="conversation-review-input"
          value={answer}
          readOnly={record.completed}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(event) => setAnswer(event.target.value)}
          onPaste={(event) => { if (!support("paste")) event.preventDefault(); }}
          onKeyDown={(event) => enterAction(event, record.completed ? advance : check)}
        />
      </label>
      {!record.completed && (
        <div className="conversation-support-actions">
          <button className="primary-button" type="button" data-testid="conversation-review-check" disabled={!answer.trim()} onClick={check} onKeyDown={(event) => enterAction(event, check)}>檢查回應</button>
          <button className="secondary-button" type="button" disabled={record.usedHint} onClick={() => support("hint")}>給我提示</button>
        </div>
      )}
      {record.usedHint && <p className="qa-note">提示：{turn.hintZhTw}</p>}
      <div aria-live="polite">
        {record.completed ? <p className="success-note">回答正確！{turn.feedbackZhTw}</p> : record.attempts > 0 && <p className="qa-note">還不符合本題練習的說法，請再試一次。已嘗試 {record.attempts} 次。</p>}
        {record.answerRevealed && <div className="conversation-answer-reveal" data-testid="conversation-review-reference-answer"><strong>參考答案</strong><p lang="en">{turn.answers[0]}</p>{!record.completed && <p>請重新輸入正確回應後再繼續。</p>}</div>}
      </div>
      {record.completed && (
        <button ref={nextButton} className="primary-button full-button" type="button" data-testid="conversation-review-next" onClick={advance} onKeyDown={(event) => enterAction(event, advance)}>
          {session.turnIndex === session.turnIds.length - 1 ? "完成弱點複習 →" : "下一個弱點回合 →"}
        </button>
      )}
      {!audioAvailable && <p className="audio-unavailable">此瀏覽器不支援播放；仍可閱讀對方文字並完成練習。</p>}
    </section>
  );
}

export function ConversationWeakReview(props: Props) {
  const { data, conversationStore, completedLessonIds, a2Unlocked, allowPilotPreview, conversationBlocked, onBack } = props;
  const [initial] = useState(() => {
    try {
      const raw = typeof window === "undefined" ? null : window.localStorage.getItem(CONVERSATION_REVIEW_STORAGE_KEY);
      return { store: restoreConversationReviewStore(raw, data, localDateKey()), raw, error: "" };
    } catch (error) {
      return { store: emptyConversationReviewStore(data), raw: null, error: error instanceof Error ? error.message : "弱點複習紀錄無法讀取，原始紀錄未被覆寫。" };
    }
  });
  const savedRaw = useRef(initial.raw);
  const [store, setStore] = useState(initial.store);
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(Boolean(initial.error));
  const [showSummary, setShowSummary] = useState(false);
  const activeScenario = data.scenarios.find((scenario) => scenario.id === store.active?.scenarioId);
  const activeAllowed = activeScenario && canStartConversation(activeScenario, completedLessonIds, a2Unlocked, allowPilotPreview);
  const activeTurn = activeScenario?.turns.find((turn) => turn.id === store.active?.turnIds[store.active.turnIndex]);
  const unavailable = conversationBlocked || Boolean(conversationStore.active);

  const reportError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "弱點複習暫時無法繼續，原紀錄仍保留。";
    setError(message);
    if (store.active && store.active.studyDate !== localDateKey()) {
      // Discard only the expired in-memory activity. Keep the saved bytes until
      // the learner explicitly starts a new session or downloads a backup.
      try { setStore(restoreConversationReviewStore(JSON.stringify(store), data, localDateKey())); }
      catch (restoreError) {
        setBlocked(true);
        setError(restoreError instanceof Error ? restoreError.message : message);
      }
    }
  };
  const save = (session: ConversationReviewSession): boolean => {
    if (blocked || unavailable) return false;
    try {
      if (window.localStorage.getItem(CONVERSATION_REVIEW_STORAGE_KEY) !== savedRaw.current) {
        throw new Error("弱點複習紀錄已由另一個分頁更新，為避免覆蓋已暫停作答。請重新整理後繼續。");
      }
      const next = saveConversationReviewSession(store, data, session);
      const raw = JSON.stringify(next);
      window.localStorage.setItem(CONVERSATION_REVIEW_STORAGE_KEY, raw);
      savedRaw.current = raw;
      setStore(next);
      setError("");
      setShowSummary(session.finished);
      return true;
    } catch (error) {
      setBlocked(true);
      const detail = error instanceof Error ? error.message : "未知錯誤";
      reportError(new Error(`弱點複習儲存失敗：${detail}。尚未前進，原有紀錄未被覆寫。`));
      return false;
    }
  };
  const download = () => {
    try {
      const raw = window.localStorage.getItem(CONVERSATION_REVIEW_STORAGE_KEY);
      if (!raw) { setError("目前沒有可下載的弱點複習紀錄。"); return; }
      const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "yingju-conversation-review-backup.json";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) { reportError(error); }
  };
  const reset = () => {
    if (!window.confirm("只清除弱點複習紀錄？原本的對話成績、正式課程和單字進度不會變更。建議先下載備份。")) return;
    try {
      window.localStorage.removeItem(CONVERSATION_REVIEW_STORAGE_KEY);
      savedRaw.current = null;
      setStore(emptyConversationReviewStore(data));
      setBlocked(false);
      setError("");
      setShowSummary(false);
    } catch (error) { reportError(error); }
  };

  const candidates = data.scenarios.map((scenario) => {
    const result = Object.values(conversationStore.results)
      .filter((result) => result.scenarioId === scenario.id && result.sourceRevision === data.sourceRevision)
      .sort((a, b) => b.studyDate.localeCompare(a.studyDate))[0];
    return { scenario, result, weak: getConversationWeakTurns(data, conversationStore, scenario.id), due: isConversationReviewDue(result, localDateKey()) };
  }).sort((a, b) => Number(b.due) - Number(a.due));

  return (
    <div className="page-stack conversation-page" data-testid="conversation-review">
      <button className="back-button" type="button" onClick={onBack}>← 返回情境列表</button>
      <section className="page-title conversation-title">
        <div><span className="eyebrow">重練卡住的地方</span><h1>對話弱點複習</h1><p>答錯、提示、貼上或口說轉文字協助的回合，都可以在這裡集中回想。</p></div>
      </section>
      <p className="qa-note">複習獨立保存，不改寫原本成績、複習日期或正式進度。完成後仍可回到完整對話，檢查能否獨立回應；同一天重練不會洗掉首次紀錄。</p>
      {error && <p className="qa-note" role="alert">{error}</p>}
      {blocked ? (
        <section className="section-card" role="alert">
          <h2>弱點複習紀錄需要先處理</h2>
          <p>為避免覆蓋舊資料，已暫停新的作答。其他課程與原對話成績不受影響。</p>
          <div className="conversation-support-actions"><button className="secondary-button" type="button" onClick={download}>下載弱點複習備份</button><button className="secondary-button" type="button" onClick={reset}>重設弱點複習紀錄</button></div>
        </section>
      ) : unavailable ? (
        <p className="qa-note" role="status">{conversationBlocked ? "請先返回情境列表處理原對話紀錄，再開始弱點複習。" : "請先完成目前的完整對話，再開始弱點複習。"}</p>
      ) : store.active && activeScenario && activeTurn ? (
        activeAllowed ? <ReviewTurn key={`${store.active.studyDate}:${store.active.scenarioId}:${store.active.turnIndex}`} data={data} session={store.active} turn={activeTurn} onSave={save} onError={reportError} onSpeak={props.onSpeak} audioAvailable={props.audioAvailable} listenFirst={props.listenFirst} />
          : <p className="qa-note" role="alert">這段對話目前尚未解鎖。請先完成前置課程，再繼續複習。</p>
      ) : showSummary && store.lastResult ? (
        <section className="result-card conversation-summary" data-testid="conversation-review-summary">
          <span className="eyebrow">本次弱點複習完成</span>
          <h2>把這些回應再練熟一點了</h2>
          <div className="three-grid">
            <article className="stat-card"><span>複習回合</span><strong>{store.lastResult.turnCount}</strong></article>
            <article className="stat-card"><span>首次無協助答對</span><strong>{store.lastResult.independentTurns}</strong></article>
            <article className="stat-card"><span>仍需加強</span><strong>{store.lastResult.assistedTurns}</strong></article>
          </div>
          <p>這只是本次回想表現，不代表已精通。下次完整對話若能獨立答對，弱點清單才會依新紀錄更新。</p>
          <button className="primary-button" type="button" autoFocus onClick={onBack} onKeyDown={(event) => enterAction(event, onBack)}>返回情境列表</button>
        </section>
      ) : (
        <>
          {store.lastResult && <p className="qa-note">上次弱點複習：{store.lastResult.studyDate}，共 {store.lastResult.turnCount} 回合，首次無協助答對 {store.lastResult.independentTurns} 回合。</p>}
          {!candidates.some((item) => item.weak.length) && <section className="section-card"><h2>目前沒有需要集中重練的回合</h2><p>先完成一段情境對話；有答錯或使用協助時，會在這裡整理成弱點清單。</p></section>}
          <div className="conversation-scenario-grid">
            {candidates.filter((item) => item.weak.length > 0).map(({ scenario, result, weak, due }) => (
              <article className="conversation-scenario-card" key={scenario.id}>
                <span className="eyebrow">{scenario.level}・{weak.length} 個弱點回合</span>
                <h2>{scenario.title}</h2>
                {due && <span className="status-pill">已到複習時間</span>}
                {result && <small>完整對話下次複習：{result.dueDate}</small>}
                <ul className="conversation-review-reasons">
                  {weak.map((item) => <li key={item.turnId}>第 {scenario.turns.findIndex((turn) => turn.id === item.turnId) + 1} 回合：{item.reasons.join("、")}</li>)}
                </ul>
                {!canStartConversation(scenario, completedLessonIds, a2Unlocked, allowPilotPreview) && <p className="qa-note">完成正式前置課程後即可開始；複習不會繞過解鎖條件。</p>}
                <button className="primary-button" type="button" data-testid={`conversation-review-start-${scenario.id}`} disabled={!canStartConversation(scenario, completedLessonIds, a2Unlocked, allowPilotPreview)} onClick={() => {
                  try { save(startConversationReview(data, scenario.id, weak, localDateKey())); }
                  catch (error) { reportError(error); }
                }}>開始弱點複習</button>
              </article>
            ))}
          </div>
        </>
      )}
      {!blocked && <div className="conversation-backup-actions"><button className="text-button" type="button" onClick={download}>下載弱點複習備份</button><small>當天未完成的回合會保留；跨日請重新開始。未送出的輸入文字不會保存。</small></div>}
    </div>
  );
}
