import assert from "node:assert/strict";
import test from "node:test";
import {
  isQuotaExceededError,
  readStorageItem,
  removeStorageItem,
  writeStorageItem,
} from "../app/browser-storage.ts";

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
};

const throwingStorage = (error) => ({
  getItem: () => {
    throw error;
  },
  setItem: () => {
    throw error;
  },
  removeItem: () => {
    throw error;
  },
});

test("reads, writes, and removes values through a working storage", () => {
  const storage = memoryStorage();
  assert.deepEqual(writeStorageItem("key", "value", storage), { ok: true });
  assert.equal(readStorageItem("key", storage), "value");
  assert.equal(removeStorageItem("key", storage), true);
  assert.equal(readStorageItem("key", storage), null);
});

test("reports a full quota instead of throwing", () => {
  const storage = throwingStorage(
    new DOMException("full", "QuotaExceededError"),
  );
  assert.deepEqual(writeStorageItem("key", "value", storage), {
    ok: false,
    reason: "quota",
  });
});

test("treats blocked storage as unavailable on every operation", () => {
  const storage = throwingStorage(new DOMException("blocked", "SecurityError"));
  assert.equal(readStorageItem("key", storage), null);
  assert.deepEqual(writeStorageItem("key", "value", storage), {
    ok: false,
    reason: "unavailable",
  });
  assert.equal(removeStorageItem("key", storage), false);
});

test("treats missing storage as unavailable", () => {
  assert.equal(readStorageItem("key", null), null);
  assert.deepEqual(writeStorageItem("key", "value", null), {
    ok: false,
    reason: "unavailable",
  });
  assert.equal(removeStorageItem("key", null), false);
});

test("recognizes legacy quota error shapes", () => {
  assert.equal(isQuotaExceededError({ name: "NS_ERROR_DOM_QUOTA_REACHED" }), true);
  assert.equal(isQuotaExceededError({ code: 22 }), true);
  assert.equal(isQuotaExceededError(new Error("other")), false);
  assert.equal(isQuotaExceededError(null), false);
});
