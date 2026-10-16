/**
 * A small, text-first wrapper around the browser SpeechRecognition API.
 *
 * This module deliberately does not store audio, score pronunciation, or
 * restart recognition automatically. Callers should invoke start() only from
 * an explicit, consented user action and call cancel()/dispose() when the
 * page is hidden or the component is unmounted.
 */

export type SpeechRecognitionState =
  | "idle"
  | "starting"
  | "listening"
  | "stopping"
  | "error";

export type SpeechRecognitionErrorCode =
  | "unsupported"
  | "secure-context-required"
  | "busy"
  | "permission-denied"
  | "no-speech"
  | "network"
  | "audio-capture"
  | "aborted"
  | "language-not-supported"
  | "service-not-allowed"
  | "start-failed"
  | "recognition-failed"
  | "timeout"
  | "cleanup-failed"
  | "disposed";

export interface SpeechRecognitionError {
  readonly code: SpeechRecognitionErrorCode;
  readonly message: string;
  readonly nativeCode?: string;
}

export interface SpeechRecognitionSupport {
  readonly supported: boolean;
  readonly secureContext: boolean;
  readonly constructorName: "SpeechRecognition" | "webkitSpeechRecognition" | null;
  readonly message: string;
}

export interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
  readonly confidence?: number;
}

export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternativeLike | undefined;
}

export interface SpeechRecognitionResultListLike {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResultLike | undefined;
}

export interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

export interface SpeechRecognitionErrorEventLike {
  readonly error?: string;
  readonly message?: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

export interface SpeechRecognitionEnvironment {
  readonly SpeechRecognition?: SpeechRecognitionConstructor;
  readonly webkitSpeechRecognition?: SpeechRecognitionConstructor;
  readonly isSecureContext?: boolean;
  readonly setTimeout?: (handler: () => void, timeout: number) => unknown;
  readonly clearTimeout?: (handle: unknown) => void;
}

export interface SpeechRecognitionStopResult {
  readonly status: "ended" | "cancelled" | "timeout" | "error";
  readonly finalTranscript: string;
  readonly error?: SpeechRecognitionError;
}

export interface SpeechRecognitionControllerOptions {
  readonly environment?: SpeechRecognitionEnvironment;
  readonly stopTimeoutMs?: number;
  /** Maximum microphone lifetime for one explicit start, in milliseconds. */
  readonly maxDurationMs?: number;
  readonly onStateChange?: (state: SpeechRecognitionState) => void;
  readonly onInterim?: (transcript: string) => void;
  readonly onFinal?: (transcript: string) => void;
  readonly onError?: (error: SpeechRecognitionError) => void;
  readonly onEnd?: (result: SpeechRecognitionStopResult) => void;
}

export interface SpeechRecognitionController {
  readonly state: SpeechRecognitionState;
  readonly support: SpeechRecognitionSupport;
  start(): void;
  stop(): Promise<SpeechRecognitionStopResult>;
  cancel(): void;
  dispose(): void;
}

const DEFAULT_STOP_TIMEOUT_MS = 2_000;
const DEFAULT_MAX_DURATION_MS = 30_000;

const ERROR_MESSAGES: Record<SpeechRecognitionErrorCode, string> = {
  unsupported: "此瀏覽器不支援語音辨識。請使用支援此功能的最新版 Chrome，並確認網站權限。",
  "secure-context-required": "語音辨識需要 HTTPS 或 localhost，請使用安全連線後再試一次。",
  busy: "語音辨識正在進行中，請先停止目前的辨識。",
  "permission-denied": "瀏覽器拒絕麥克風權限。請在網址列允許麥克風後，再按一次開始。",
  "no-speech": "沒有聽到清楚的語音，請靠近麥克風後再試一次。",
  network: "語音辨識服務需要網路連線，請檢查網路後再試一次。",
  "audio-capture": "找不到可用的麥克風，請確認裝置與系統權限。",
  aborted: "語音辨識已停止，請需要時重新按下開始。",
  "language-not-supported": "目前瀏覽器不支援美式英文語音辨識，請改用支援此功能的最新版 Chrome。",
  "service-not-allowed": "語音辨識服務未獲允許，請檢查瀏覽器與網站權限。",
  "start-failed": "語音辨識啟動失敗，請確認麥克風權限後再試一次。",
  "recognition-failed": "語音辨識發生問題，請再說一次。",
  timeout: "語音辨識超過時間，正在停止麥克風。",
  "cleanup-failed": "瀏覽器未能確認已停止麥克風。請關閉此分頁，或在網址列停用麥克風權限。",
  disposed: "語音辨識已關閉，請重新開啟本功能。",
};

function hostFromGlobal(): SpeechRecognitionEnvironment {
  return globalThis as unknown as SpeechRecognitionEnvironment;
}

function describeSupport(environment: SpeechRecognitionEnvironment): SpeechRecognitionSupport {
  const constructorName = environment.SpeechRecognition
    ? "SpeechRecognition"
    : environment.webkitSpeechRecognition
      ? "webkitSpeechRecognition"
      : null;
  const secureContext = environment.isSecureContext === true;
  if (!constructorName) {
    return {
      supported: false,
      secureContext,
      constructorName: null,
      message: ERROR_MESSAGES.unsupported,
    };
  }
  if (!secureContext) {
    return {
      supported: false,
      secureContext,
      constructorName,
      message: ERROR_MESSAGES["secure-context-required"],
    };
  }
  return {
    supported: true,
    secureContext,
    constructorName,
    message: "語音辨識可以使用。",
  };
}

export function getSpeechRecognitionSupport(
  environment: SpeechRecognitionEnvironment = hostFromGlobal(),
): SpeechRecognitionSupport {
  return describeSupport(environment);
}

function normaliseTranscript(transcript: string): string {
  return transcript.trim().replace(/\s+/gu, " ");
}

function joinTranscript(parts: Iterable<string>): string {
  return normaliseTranscript([...parts].filter((part) => part.trim()).join(" "));
}

function errorCodeForNative(nativeCode: string | undefined): SpeechRecognitionErrorCode {
  switch (nativeCode) {
    case "not-allowed":
    case "service-not-allowed":
      return nativeCode === "service-not-allowed" ? "service-not-allowed" : "permission-denied";
    case "no-speech":
      return "no-speech";
    case "network":
      return "network";
    case "audio-capture":
      return "audio-capture";
    case "aborted":
      return "aborted";
    case "language-not-supported":
      return "language-not-supported";
    default:
      return "recognition-failed";
  }
}

function makeError(
  code: SpeechRecognitionErrorCode,
  nativeCode?: string,
): SpeechRecognitionError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    ...(nativeCode ? { nativeCode } : {}),
  };
}

function alternativeTranscript(result: SpeechRecognitionResultLike | undefined): string {
  return normaliseTranscript(result?.[0]?.transcript ?? "");
}

export function createSpeechRecognitionController(
  options: SpeechRecognitionControllerOptions = {},
): SpeechRecognitionController {
  const environment = options.environment ?? hostFromGlobal();
  const support = describeSupport(environment);
  const stopTimeoutMs = Math.max(100, Math.floor(options.stopTimeoutMs ?? DEFAULT_STOP_TIMEOUT_MS));
  const maxDurationMs = Math.max(100, Math.floor(options.maxDurationMs ?? DEFAULT_MAX_DURATION_MS));
  const setTimer = environment.setTimeout ?? ((handler: () => void, timeout: number) => globalThis.setTimeout(handler, timeout));
  const clearTimer = environment.clearTimeout ?? ((handle: unknown) => globalThis.clearTimeout(handle as number));

  let currentState: SpeechRecognitionState = "idle";
  let disposed = false;
  let generation = 0;
  let recognition: SpeechRecognitionLike | null = null;
  let stopTimer: unknown = null;
  let sessionTimer: unknown = null;
  let stopResolve: ((result: SpeechRecognitionStopResult) => void) | null = null;
  let finalSegments = new Map<number, string>();
  let processedFinalIndices = new Set<number>();
  let lastError: SpeechRecognitionError | undefined;
  let cleanupBlocked = false;
  const onStateChange = options.onStateChange;
  const onInterim = options.onInterim;
  const onFinal = options.onFinal;
  const onError = options.onError;
  const onEnd = options.onEnd;

  const notifyState = (state: SpeechRecognitionState): void => {
    if (currentState === state) return;
    currentState = state;
    if (!disposed) onStateChange?.(state);
  };

  const clearStopTimer = (): void => {
    if (stopTimer === null) return;
    clearTimer(stopTimer);
    stopTimer = null;
  };

  const clearSessionTimer = (): void => {
    if (sessionTimer === null) return;
    clearTimer(sessionTimer);
    sessionTimer = null;
  };

  const transcript = (): string => joinTranscript([...finalSegments.entries()].sort(([a], [b]) => a - b).map(([, value]) => value));

  const detachRecognition = (instance: SpeechRecognitionLike | null): void => {
    if (!instance) return;
    instance.onstart = null;
    instance.onresult = null;
    instance.onerror = null;
    instance.onend = null;
  };

  const finish = (
    result: SpeechRecognitionStopResult,
    expectedGeneration: number,
    abortAfterDetach = false,
  ): void => {
    if (expectedGeneration !== generation || disposed) return;
    clearStopTimer();
    clearSessionTimer();
    const instance = recognition;
    recognition = null;
    detachRecognition(instance);
    // Invalidate callbacks before any abort call. Some browsers synchronously
    // emit `onend` from abort(), and that event must not re-enter this session.
    generation += 1;
    let terminalResult = result;
    if (abortAfterDetach) {
      try {
        instance?.abort();
      } catch {
        const cleanupError = makeError("cleanup-failed");
        cleanupBlocked = true;
        lastError = cleanupError;
        onError?.(cleanupError);
        terminalResult = {
          status: "error",
          finalTranscript: result.finalTranscript,
          error: cleanupError,
        };
      }
    }
    const resolver = stopResolve;
    stopResolve = null;
    if (terminalResult.status === "error" || terminalResult.status === "timeout") {
      notifyState("error");
    } else {
      notifyState("idle");
    }
    if (!disposed) onEnd?.(terminalResult);
    resolver?.(terminalResult);
  };

  const publishError = (error: SpeechRecognitionError, expectedGeneration: number): void => {
    if (expectedGeneration !== generation || disposed) return;
    lastError = error;
    onError?.(error);
    finish({ status: "error", finalTranscript: transcript(), error }, expectedGeneration, true);
  };

  const handleResult = (event: SpeechRecognitionEventLike, expectedGeneration: number): void => {
    if (expectedGeneration !== generation || disposed) return;
    const start = Math.max(0, Math.min(event.resultIndex, event.results.length));
    const interim: string[] = [];
    for (let index = start; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (!result) continue;
      const text = alternativeTranscript(result);
      if (result.isFinal) {
        if (processedFinalIndices.has(index)) continue;
        processedFinalIndices.add(index);
        finalSegments.set(index, text);
        if (text) onFinal?.(text);
      } else if (text) {
        interim.push(text);
      }
    }
    if (interim.length > 0) onInterim?.(joinTranscript([...finalSegments.values(), ...interim]));
  };

  const start = (): void => {
    if (disposed) {
      const error = makeError("disposed");
      onError?.(error);
      throw new Error(error.message);
    }
    if (recognition || currentState === "starting" || currentState === "listening" || currentState === "stopping") {
      const error = makeError("busy");
      onError?.(error);
      throw new Error(error.message);
    }
    if (cleanupBlocked) {
      const error = makeError("cleanup-failed");
      notifyState("error");
      onError?.(error);
      throw new Error(error.message);
    }
    if (!support.supported) {
      const code = support.constructorName ? "secure-context-required" : "unsupported";
      const error = makeError(code);
      notifyState("error");
      onError?.(error);
      throw new Error(error.message);
    }
    const Constructor = environment.SpeechRecognition ?? environment.webkitSpeechRecognition;
    if (!Constructor) {
      const error = makeError("unsupported");
      notifyState("error");
      onError?.(error);
      throw new Error(error.message);
    }
    const expectedGeneration = ++generation;
    finalSegments = new Map<number, string>();
    processedFinalIndices = new Set<number>();
    lastError = undefined;
    let instance: SpeechRecognitionLike;
    try {
      instance = new Constructor();
    } catch (cause) {
      const error = makeError("start-failed");
      notifyState("error");
      onError?.(error);
      throw new Error(error.message, { cause: cause instanceof Error ? cause : undefined });
    }
    recognition = instance;
    try {
      instance.lang = "en-US";
      instance.continuous = false;
      instance.interimResults = true;
      instance.maxAlternatives = 1;
      instance.onstart = () => {
        if (expectedGeneration !== generation || disposed || currentState === "stopping") return;
        notifyState("listening");
      };
      instance.onresult = (event) => handleResult(event, expectedGeneration);
      instance.onerror = (event) => {
        const nativeCode = event.error;
        const error = makeError(errorCodeForNative(nativeCode), nativeCode);
        publishError(error, expectedGeneration);
      };
      instance.onend = () => {
        if (expectedGeneration !== generation || disposed) return;
        finish(
          lastError
            ? { status: "error", finalTranscript: transcript(), error: lastError }
            : { status: "ended", finalTranscript: transcript() },
          expectedGeneration,
        );
      };
      notifyState("starting");
      instance.start();
    } catch (cause) {
      const error = makeError("start-failed");
      publishError(error, expectedGeneration);
      throw new Error(error.message, { cause: cause instanceof Error ? cause : undefined });
    }
    if (recognition !== instance) return;
    sessionTimer = setTimer(() => {
      if (expectedGeneration !== generation || disposed || !recognition) return;
      const error = makeError("timeout");
      lastError = error;
      onError?.(error);
      finish({ status: "timeout", finalTranscript: transcript(), error }, expectedGeneration, true);
    }, maxDurationMs);
  };

  const stop = (): Promise<SpeechRecognitionStopResult> => {
    if (disposed) return Promise.resolve({ status: "cancelled", finalTranscript: transcript() });
    if (!recognition) {
      return Promise.resolve(
        lastError
          ? { status: "error", finalTranscript: transcript(), error: lastError }
          : { status: "ended", finalTranscript: transcript() },
      );
    }
    if (stopResolve) return new Promise<SpeechRecognitionStopResult>((resolve) => {
      const previousResolve = stopResolve;
      stopResolve = (result) => {
        previousResolve?.(result);
        resolve(result);
      };
    });
    const expectedGeneration = generation;
    notifyState("stopping");
    const resultPromise = new Promise<SpeechRecognitionStopResult>((resolve) => {
      stopResolve = resolve;
    });
    stopTimer = setTimer(() => {
      if (expectedGeneration !== generation || disposed || !recognition) return;
      const error = makeError("timeout");
      lastError = error;
      onError?.(error);
      finish({ status: "timeout", finalTranscript: transcript(), error }, expectedGeneration, true);
    }, stopTimeoutMs);
    try {
      recognition.stop();
    } catch {
      const error = makeError("recognition-failed");
      publishError(error, expectedGeneration);
    }
    return resultPromise;
  };

  const cancel = (): void => {
    if (disposed) return;
    generation += 1;
    clearStopTimer();
    clearSessionTimer();
    const instance = recognition;
    recognition = null;
    detachRecognition(instance);
    let cleanupError: SpeechRecognitionError | undefined;
    try {
      instance?.abort();
    } catch {
      cleanupBlocked = true;
      cleanupError = makeError("cleanup-failed");
      lastError = cleanupError;
      onError?.(cleanupError);
    }
    const resolver = stopResolve;
    stopResolve = null;
    notifyState(cleanupError ? "error" : "idle");
    resolver?.(cleanupError
      ? { status: "error", finalTranscript: transcript(), error: cleanupError }
      : { status: "cancelled", finalTranscript: transcript() });
  };

  const dispose = (): void => {
    if (disposed) return;
    cancel();
    disposed = true;
  };

  return {
    get state(): SpeechRecognitionState {
      return currentState;
    },
    support,
    start,
    stop,
    cancel,
    dispose,
  };
}
