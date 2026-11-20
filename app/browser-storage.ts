// Browser storage can throw on every access: a full quota raises
// QuotaExceededError on writes, and blocked site data raises SecurityError as
// soon as `localStorage` is read. These helpers keep such failures recoverable
// so a storage problem never unmounts the learning interface.

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type StorageWriteFailure = "quota" | "unavailable";

export type StorageWriteResult =
  | { ok: true }
  | { ok: false; reason: StorageWriteFailure };

export const STORAGE_WRITE_FAILURE_MESSAGE =
  "瀏覽器儲存空間已滿或被封鎖，這次的變更沒有存到本機。請先到「學習進度」下載備份，再清出瀏覽器空間。";

const defaultStorage = (): StorageLike | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const isQuotaExceededError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const { name, code } = error as { name?: unknown; code?: unknown };
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    code === 22 ||
    code === 1014
  );
};

export const readStorageItem = (
  key: string,
  storage: StorageLike | null = defaultStorage(),
): string | null => {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorageItem = (
  key: string,
  value: string,
  storage: StorageLike | null = defaultStorage(),
): StorageWriteResult => {
  if (!storage) return { ok: false, reason: "unavailable" };
  try {
    storage.setItem(key, value);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: isQuotaExceededError(error) ? "quota" : "unavailable",
    };
  }
};

export const removeStorageItem = (
  key: string,
  storage: StorageLike | null = defaultStorage(),
) => {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};
