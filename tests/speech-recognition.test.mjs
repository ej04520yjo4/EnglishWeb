import assert from "node:assert/strict";
import test from "node:test";
import {
  createSpeechRecognitionController,
  getSpeechRecognitionSupport,
} from "../app/speech-recognition.ts";

const result = (transcript, isFinal) => ({
  isFinal,
  length: 1,
  0: { transcript },
});

function createTimers() {
  let nextId = 1;
  const callbacks = new Map();
  return {
    setTimeout(callback) {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      callbacks.delete(id);
    },
    run(id) {
      const callback = callbacks.get(id);
      callbacks.delete(id);
      callback?.();
    },
    get pendingCount() {
      return callbacks.size;
    },
  };
}

function createFakeEnvironment({ secure = true, emitEndOnStop = true, startThrows = false, stopThrows = false, abortEmitsEnd = false, abortThrows = false, configurationThrows = false } = {}) {
  const timers = createTimers();
  const instances = [];
  class FakeSpeechRecognition {
    constructor() {
      this.lang = "";
      this.continuous = true;
      this.interimResults = false;
      this.maxAlternatives = 0;
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      this.started = false;
      this.stopped = false;
      this.aborted = false;
      if (configurationThrows) {
        Object.defineProperty(this, "lang", {
          configurable: true,
          get: () => "",
          set: () => { throw new Error("fake configuration failed"); },
        });
      }
      instances.push(this);
    }

    start() {
      if (startThrows) throw new Error("fake start failed");
      this.started = true;
    }

    stop() {
      this.stopped = true;
      if (stopThrows) throw new Error("fake stop failed");
      if (emitEndOnStop) this.emitEnd();
    }

    abort() {
      this.aborted = true;
      if (abortThrows) throw new Error("fake abort failed");
      if (abortEmitsEnd) this.emitEnd();
    }

    emitStart() {
      this.onstart?.();
    }

    emitResults(results, resultIndex = 0) {
      this.onresult?.({ resultIndex, results: { length: results.length, ...results } });
    }

    emitError(error) {
      this.onerror?.({ error });
    }

    emitEnd() {
      this.onend?.();
    }

    captureCallbacks() {
      return { onstart: this.onstart, onresult: this.onresult, onerror: this.onerror, onend: this.onend };
    }
  }
  return {
    environment: {
      SpeechRecognition: FakeSpeechRecognition,
      isSecureContext: secure,
      setTimeout: timers.setTimeout,
      clearTimeout: timers.clearTimeout,
    },
    timers,
    instances,
    get latest() {
      return instances.at(-1) ?? null;
    },
  };
}

test("detects secure unprefixed and prefixed browser implementations", () => {
  const fake = createFakeEnvironment();
  const support = getSpeechRecognitionSupport(fake.environment);
  assert.deepEqual(support, {
    supported: true,
    secureContext: true,
    constructorName: "SpeechRecognition",
    message: "語音辨識可以使用。",
  });
  const prefixed = getSpeechRecognitionSupport({
    webkitSpeechRecognition: fake.environment.SpeechRecognition,
    isSecureContext: true,
  });
  assert.equal(prefixed.constructorName, "webkitSpeechRecognition");
  assert.equal(getSpeechRecognitionSupport({ isSecureContext: false, SpeechRecognition: fake.environment.SpeechRecognition }).supported, false);
  assert.equal(getSpeechRecognitionSupport({ isSecureContext: true }).supported, false);
});

test("configures en-US single-utterance recognition and emits final text only once", async () => {
  const fake = createFakeEnvironment();
  const interim = [];
  const finals = [];
  const ended = [];
  const controller = createSpeechRecognitionController({
    environment: fake.environment,
    onInterim: (text) => interim.push(text),
    onFinal: (text) => finals.push(text),
    onEnd: (value) => ended.push(value),
  });

  controller.start();
  const instance = fake.latest;
  assert.equal(controller.state, "starting");
  assert.equal(instance.lang, "en-US");
  assert.equal(instance.continuous, false);
  assert.equal(instance.interimResults, true);
  assert.equal(instance.maxAlternatives, 1);
  instance.emitStart();
  assert.equal(controller.state, "listening");
  instance.emitResults([result("I am", false)]);
  instance.emitResults([result("I am", true)]);
  instance.emitResults([result("I am", true)]);
  instance.emitResults([result("I am", true), result("home", true)]);
  assert.deepEqual(interim, ["I am"]);
  assert.deepEqual(finals, ["I am", "home"]);

  const stopped = await controller.stop();
  assert.equal(instance.stopped, true);
  assert.deepEqual(stopped, { status: "ended", finalTranscript: "I am home" });
  assert.equal(controller.state, "idle");
  assert.deepEqual(ended, [stopped]);
});

test("returns the final utterance when the browser ends naturally", () => {
  const fake = createFakeEnvironment();
  const ended = [];
  const finals = [];
  const controller = createSpeechRecognitionController({ environment: fake.environment, onEnd: (value) => ended.push(value), onFinal: (value) => finals.push(value) });
  controller.start();
  const late = fake.latest.captureCallbacks();
  fake.latest.emitResults([result("Hello", true)]);
  fake.latest.emitEnd();
  assert.equal(controller.state, "idle");
  assert.deepEqual(ended, [{ status: "ended", finalTranscript: "Hello" }]);
  assert.equal(fake.timers.pendingCount, 0);
  late.onresult?.({ resultIndex: 0, results: { length: 1, 0: result("late", true) } });
  late.onend?.();
  assert.deepEqual(finals, ["Hello"]);
});

test("maps browser errors to clear Traditional Chinese messages", () => {
  for (const [nativeCode, expectedCode] of [
    ["not-allowed", "permission-denied"],
    ["no-speech", "no-speech"],
    ["network", "network"],
    ["audio-capture", "audio-capture"],
  ]) {
    const fake = createFakeEnvironment();
    const errors = [];
    const controller = createSpeechRecognitionController({ environment: fake.environment, onError: (error) => errors.push(error) });
    controller.start();
    fake.latest.emitError(nativeCode);
    assert.equal(controller.state, "error");
    assert.equal(errors.at(-1).code, expectedCode);
    assert.ok(errors.at(-1).message.length > 8);
  }
});

test("terminates and aborts immediately on a native error without waiting for onend", () => {
  const fake = createFakeEnvironment({ abortEmitsEnd: true });
  const ended = [];
  const errors = [];
  const controller = createSpeechRecognitionController({ environment: fake.environment, onError: (error) => errors.push(error), onEnd: (value) => ended.push(value) });
  controller.start();
  const late = fake.latest.captureCallbacks();
  fake.latest.emitError("network");
  assert.equal(fake.latest.aborted, true);
  assert.equal(controller.state, "error");
  assert.equal(fake.timers.pendingCount, 0);
  assert.deepEqual(ended, [{ status: "error", finalTranscript: "", error: errors[0] }]);
  late.onend?.();
  assert.equal(ended.length, 1);
});

test("rejects unsupported or insecure starts and reports constructor/start failures", () => {
  const unsupportedErrors = [];
  const unsupported = createSpeechRecognitionController({
    environment: { isSecureContext: false },
    onError: (error) => unsupportedErrors.push(error),
  });
  assert.throws(() => unsupported.start(), /語音辨識/);
  assert.equal(unsupportedErrors[0].code, "unsupported");

  const insecure = createSpeechRecognitionController({
    environment: { isSecureContext: false, SpeechRecognition: createFakeEnvironment().environment.SpeechRecognition },
    onError: (error) => unsupportedErrors.push(error),
  });
  assert.throws(() => insecure.start(), /HTTPS|localhost/);
  assert.equal(unsupportedErrors.at(-1).code, "secure-context-required");

  class ThrowingConstructor {
    constructor() {
      throw new Error("constructor failure");
    }
  }
  const constructorErrors = [];
  const constructorFailure = createSpeechRecognitionController({
    environment: { isSecureContext: true, SpeechRecognition: ThrowingConstructor },
    onError: (error) => constructorErrors.push(error),
  });
  assert.throws(() => constructorFailure.start(), /語音辨識啟動失敗/);
  assert.equal(constructorErrors[0].code, "start-failed");

  const startFailureFake = createFakeEnvironment({ startThrows: true });
  const startErrors = [];
  const startFailure = createSpeechRecognitionController({ environment: startFailureFake.environment, onError: (error) => startErrors.push(error) });
  assert.throws(() => startFailure.start(), /語音辨識啟動失敗/);
  assert.equal(startErrors[0].code, "start-failed");
});

test("cleans up and reports a friendly error when recognition configuration throws", () => {
  const fake = createFakeEnvironment({ configurationThrows: true });
  const errors = [];
  const controller = createSpeechRecognitionController({ environment: fake.environment, onError: (error) => errors.push(error) });
  assert.throws(() => controller.start(), /語音辨識啟動失敗/);
  assert.equal(fake.latest.aborted, true);
  assert.equal(controller.state, "error");
  assert.equal(errors[0].code, "start-failed");
});

test("prevents double-start and does not restart automatically", () => {
  const fake = createFakeEnvironment();
  const errors = [];
  const controller = createSpeechRecognitionController({ environment: fake.environment, onError: (error) => errors.push(error) });
  controller.start();
  assert.throws(() => controller.start(), /進行中/);
  assert.equal(errors.at(-1).code, "busy");
  fake.latest.emitEnd();
  assert.equal(controller.state, "idle");
  assert.equal(fake.instances.length, 1);
});

test("cancel invalidates late results and resolves a pending stop without storing audio", async () => {
  const fake = createFakeEnvironment({ emitEndOnStop: false });
  const finals = [];
  const errors = [];
  const controller = createSpeechRecognitionController({ environment: fake.environment, onFinal: (text) => finals.push(text), onError: (error) => errors.push(error) });
  controller.start();
  const instance = fake.latest;
  const late = instance.captureCallbacks();
  const pending = controller.stop();
  controller.cancel();
  late.onresult?.({ resultIndex: 0, results: { length: 1, 0: result("late", true) } });
  late.onerror?.({ error: "network" });
  late.onend?.();
  assert.deepEqual(await pending, { status: "cancelled", finalTranscript: "" });
  assert.deepEqual(finals, []);
  assert.deepEqual(errors, []);
  assert.equal(instance.aborted, true);
  assert.equal(controller.state, "idle");
});

test("stops a hung microphone after the bounded stop timeout", async () => {
  const fake = createFakeEnvironment({ emitEndOnStop: false });
  const errors = [];
  const controller = createSpeechRecognitionController({
    environment: fake.environment,
    stopTimeoutMs: 500,
    maxDurationMs: 10_000,
    onError: (error) => errors.push(error),
  });
  controller.start();
  const pending = controller.stop();
  fake.timers.run(2);
  const stopped = await pending;
  assert.equal(stopped.status, "timeout");
  assert.equal(stopped.error.code, "timeout");
  assert.equal(fake.latest.aborted, true);
  assert.equal(controller.state, "error");
  assert.equal(errors.at(-1).code, "timeout");
});

test("aborts and releases the recognizer when stop itself throws", async () => {
  const fake = createFakeEnvironment({ stopThrows: true, abortEmitsEnd: true });
  const controller = createSpeechRecognitionController({ environment: fake.environment, maxDurationMs: 10_000 });
  controller.start();
  const stopped = await controller.stop();
  assert.equal(stopped.status, "error");
  assert.equal(stopped.error.code, "recognition-failed");
  assert.equal(fake.latest.aborted, true);
  assert.equal(controller.state, "error");
});

test("detaches before timeout abort so synchronous onend cannot re-enter", async () => {
  const fake = createFakeEnvironment({ emitEndOnStop: false, abortEmitsEnd: true });
  const ended = [];
  const controller = createSpeechRecognitionController({
    environment: fake.environment,
    stopTimeoutMs: 500,
    maxDurationMs: 10_000,
    onEnd: (value) => ended.push(value),
  });
  controller.start();
  const pending = controller.stop();
  fake.timers.run(2);
  const stopped = await pending;
  assert.equal(stopped.status, "timeout");
  assert.equal(ended.length, 1);
  assert.equal(fake.latest.aborted, true);
});

test("reports when the browser refuses the abort cleanup instead of claiming the mic is stopped", async () => {
  const fake = createFakeEnvironment({ emitEndOnStop: false, abortThrows: true });
  const errors = [];
  const ended = [];
  const controller = createSpeechRecognitionController({
    environment: fake.environment,
    stopTimeoutMs: 500,
    maxDurationMs: 10_000,
    onError: (error) => errors.push(error),
    onEnd: (value) => ended.push(value),
  });
  controller.start();
  const pending = controller.stop();
  fake.timers.run(2);
  const stopped = await pending;
  assert.equal(stopped.status, "error");
  assert.equal(stopped.error.code, "cleanup-failed");
  assert.equal(controller.state, "error");
  assert.equal(errors.at(-1).code, "cleanup-failed");
  assert.equal(ended.at(-1).error.code, "cleanup-failed");
});

test("cancel exposes cleanup failure so the UI can keep the warning visible", () => {
  const fake = createFakeEnvironment({ abortThrows: true });
  const errors = [];
  const controller = createSpeechRecognitionController({ environment: fake.environment, onError: (error) => errors.push(error) });
  controller.start();
  controller.cancel();
  assert.equal(controller.state, "error");
  assert.equal(errors.at(-1).code, "cleanup-failed");
  assert.throws(() => controller.start(), /未能確認已停止/);
});

test("ignores a delayed onstart after stop has entered stopping", async () => {
  const fake = createFakeEnvironment({ emitEndOnStop: false });
  const controller = createSpeechRecognitionController({ environment: fake.environment, maxDurationMs: 10_000 });
  controller.start();
  const late = fake.latest.captureCallbacks();
  const pending = controller.stop();
  assert.equal(controller.state, "stopping");
  late.onstart?.();
  assert.equal(controller.state, "stopping");
  late.onend?.();
  assert.equal((await pending).status, "ended");
});

test("automatically releases a recognition session at the maximum utterance duration", () => {
  const fake = createFakeEnvironment({ emitEndOnStop: false });
  const ended = [];
  const controller = createSpeechRecognitionController({
    environment: fake.environment,
    maxDurationMs: 500,
    onEnd: (value) => ended.push(value),
  });
  controller.start();
  fake.timers.run(1);
  assert.equal(fake.latest.aborted, true);
  assert.equal(controller.state, "error");
  assert.equal(ended[0].status, "timeout");
});

test("dispose invalidates callbacks and aborts the active recognition", () => {
  const fake = createFakeEnvironment({ emitEndOnStop: false });
  const states = [];
  const finals = [];
  const controller = createSpeechRecognitionController({
    environment: fake.environment,
    onStateChange: (state) => states.push(state),
    onFinal: (text) => finals.push(text),
  });
  controller.start();
  const instance = fake.latest;
  const late = instance.captureCallbacks();
  controller.dispose();
  late.onresult?.({ resultIndex: 0, results: { length: 1, 0: result("late", true) } });
  late.onend?.();
  assert.deepEqual(finals, []);
  assert.equal(instance.aborted, true);
  assert.equal(controller.state, "idle");
  assert.equal(states.at(-1), "idle");
});

