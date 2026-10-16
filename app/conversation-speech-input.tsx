"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import {
  createSpeechRecognitionController,
  getSpeechRecognitionSupport,
  type SpeechRecognitionController,
  type SpeechRecognitionState,
} from "./speech-recognition";

type Props = {
  consented: boolean;
  onConsentChange: (value: boolean) => void;
  onBusyChange: (busy: boolean) => void;
  onUseTranscript: (text: string) => boolean;
};

const isBusy = (state: SpeechRecognitionState) =>
  state === "starting" || state === "listening" || state === "stopping";

// Browser capability is stable for this document; the server snapshot keeps
// feature detection out of SSR and prevents a hydration mismatch.
const subscribeCapability = () => () => {};
const capabilitySnapshot = () => {
  const support = getSpeechRecognitionSupport();
  return support.supported ? "supported" : support.constructorName ? "insecure" : "unsupported";
};
const serverCapability = () => "pending";

const guardHeldEnter = (event: KeyboardEvent<HTMLButtonElement>) => {
  if (event.key === "Enter" && (event.repeat || event.nativeEvent.isComposing)) {
    event.preventDefault();
  }
};

export function ConversationSpeechInput({
  consented,
  onConsentChange,
  onBusyChange,
  onUseTranscript,
}: Props) {
  const controllerRef = useRef<SpeechRecognitionController | null>(null);
  const capability = useSyncExternalStore(subscribeCapability, capabilitySnapshot, serverCapability);
  const support = capability === "pending" ? null : getSpeechRecognitionSupport();
  const [state, setState] = useState<SpeechRecognitionState>("idle");
  const [message, setMessage] = useState("");
  const [interim, setInterim] = useState("");
  const [preview, setPreview] = useState("");
  const [cleanupBlocked, setCleanupBlocked] = useState(false);
  const busy = isBusy(state);

  useEffect(() => {
    let mounted = true;
    const controller = createSpeechRecognitionController({
      onStateChange: (next) => {
        if (!mounted) return;
        setState(next);
        onBusyChange(isBusy(next));
        if (next === "starting") setMessage("正在請求麥克風，請留意瀏覽器的權限提示。");
        if (next === "listening") setMessage("正在聆聽，請說一句英文；最長 30 秒，可隨時停止或取消。");
        if (next === "stopping") setMessage("正在結束辨識，請稍候…");
      },
      onInterim: (text) => {
        if (mounted) setInterim(text);
      },
      onError: (error) => {
        if (!mounted) return;
        if (error.code === "cleanup-failed") setCleanupBlocked(true);
        setMessage(`${error.message} 你仍可直接打字，不會計為答錯。`);
        setInterim("");
        setPreview("");
      },
      onEnd: (result) => {
        if (!mounted) return;
        setInterim("");
        if (result.status !== "ended") return;
        setPreview(result.finalTranscript);
        setMessage(result.finalTranscript
          ? "辨識已結束。請確認文字，再決定是否放入回應框；尚未送出答案。"
          : "沒有取得可用的辨識文字。請再試一次或直接打字，不會計為答錯。");
      },
    });
    controllerRef.current = controller;

    const cancelHidden = () => {
      if (!isBusy(controller.state)) return;
      controller.cancel();
      setInterim("");
      setPreview("");
      if (controllerRef.current?.state !== "error") {
        setMessage("已離開作答畫面，語音辨識已取消；不會自動重新開始。");
      }
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") cancelHidden();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", cancelHidden);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", cancelHidden);
      controller.dispose();
      controllerRef.current = null;
      onBusyChange(false);
    };
  }, [onBusyChange]);

  const start = () => {
    if (!consented || !support?.supported || busy || cleanupBlocked || !controllerRef.current) return;
    setInterim("");
    setPreview("");
    try {
      // Prevent the partner's synthesized voice from becoming the learner's input.
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      controllerRef.current.start();
    } catch {
      // The controller reports friendly recognition errors. A failing TTS
      // cancellation also prevents capture instead of listening to playback.
      if (controllerRef.current.state !== "error") {
        setMessage("無法停止語音播放或啟動辨識，請稍後再試；你仍可直接打字。");
      }
    }
  };

  const cancel = () => {
    controllerRef.current?.cancel();
    setInterim("");
    setPreview("");
    if (controllerRef.current?.state !== "error") {
      setMessage("已取消語音辨識，原本輸入的文字保持不變。");
    }
  };

  return (
    <section className="conversation-speech" aria-label="可選用的口說輸入">
      <strong>口說輸入（美式英文）</strong>
      <p id="speech-privacy-notice">
        瀏覽器可能把語音傳送至其服務供應商辨識，需要網路，不保證離線。
        本網站不保存錄音或辨識文字；只記錄是否使用語音輸入。這不是發音評分。
      </p>
      <label className="conversation-speech-consent">
        <input
          type="checkbox"
          data-testid="speech-consent"
          checked={consented}
          disabled={!support?.supported || busy}
          aria-describedby="speech-privacy-notice"
          onChange={(event) => onConsentChange(event.target.checked)}
        />
        我了解語音可能由瀏覽器的外部服務處理，同意本次開啟對話頁期間使用
      </label>
      <div className="conversation-speech-actions">
        {!busy && <button
          className="secondary-button"
          type="button"
          data-testid="speech-start"
          disabled={!consented || !support?.supported || cleanupBlocked}
          onClick={start}
          onKeyDown={guardHeldEnter}
        >開始口說</button>}
        {busy && <>
          <button
            className="secondary-button"
            type="button"
            data-testid="speech-stop"
            disabled={state === "stopping"}
            onClick={() => { void controllerRef.current?.stop(); }}
            onKeyDown={guardHeldEnter}
          >停止辨識</button>
          <button className="secondary-button" type="button" data-testid="speech-cancel" onClick={cancel} onKeyDown={guardHeldEnter}>取消辨識</button>
        </>}
      </div>
      <p role="status" data-testid="speech-status">{message || (support
        ? support.supported
          ? "可選用口說輸入；勾選同意並按開始後，才會使用麥克風。"
          : `${support.message} 仍可直接打字完成練習。`
        : "正在檢查瀏覽器語音辨識支援…")}</p>
      {interim && <p data-testid="speech-interim" lang="en-US">{interim}</p>}
      {!busy && preview && <div className="conversation-speech-preview">
        <strong>辨識文字（尚未送出）</strong>
        <p data-testid="speech-preview" lang="en-US">{preview}</p>
        <p>使用後會取代回應框的文字，你仍可修改，再自行按「檢查回應」。</p>
        <div className="conversation-speech-actions">
          <button className="secondary-button" type="button" data-testid="speech-use" onKeyDown={guardHeldEnter} onClick={() => {
            if (!onUseTranscript(preview)) return;
            setPreview("");
            setMessage("已放入回應框。請確認或修改，再按檢查回應；這次會標記為語音輔助。");
          }}>使用這段文字</button>
          <button className="text-button" type="button" data-testid="speech-discard" onKeyDown={guardHeldEnter} onClick={() => {
            setPreview("");
            setMessage("已捨棄辨識文字，原本輸入的文字保持不變。");
          }}>捨棄文字</button>
        </div>
      </div>}
    </section>
  );
}
