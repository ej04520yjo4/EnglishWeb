// Lossless compact encoding for the large runtime vocabulary files.
//
// The canonical JSON files keep their full, reviewable shape for audits. The
// browser instead downloads a packed copy in which
// - arrays of objects that share the same key order become a key list plus
//   value rows, and
// - strings that repeat are stored once in a string table and referenced by
//   index.
// `unpackJson` restores the exact canonical value, including key order, so the
// existing validators run unchanged. Values that are not packed pass through
// untouched, which keeps canonical fixtures and test doubles working.

export const PACKED_JSON_FORMAT = "englishweb-packed-json-v1";

const MARK = "§";
const TABLE_KEYS = `${MARK}k`;
const TABLE_ROWS = `${MARK}r`;
const MIN_TABLE_ROWS = 2;

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type PackedJson = {
  format: typeof PACKED_JSON_FORMAT;
  strings: string[];
  data: Json;
};

const isPlainObject = (value: unknown): value is Record<string, Json> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const isPackedJson = (value: unknown): value is PackedJson =>
  isPlainObject(value) &&
  value.format === PACKED_JSON_FORMAT &&
  Array.isArray(value.strings) &&
  "data" in value;

const sameKeyOrder = (rows: Record<string, Json>[]) => {
  const keys = Object.keys(rows[0]);
  return rows.every((row) => {
    const rowKeys = Object.keys(row);
    return (
      rowKeys.length === keys.length &&
      rowKeys.every((key, index) => key === keys[index])
    );
  });
};

const reference = (index: number) => `${MARK}${index.toString(36)}`;

export const packJson = (value: unknown): PackedJson => {
  const counts = new Map<string, number>();
  const assertSafeString = (text: string) => {
    if (text.startsWith(MARK)) {
      throw new Error(`Cannot pack a string that starts with ${MARK}: ${text}`);
    }
  };

  const toTables = (input: unknown): Json => {
    if (typeof input === "string") {
      assertSafeString(input);
      counts.set(input, (counts.get(input) ?? 0) + 1);
      return input;
    }
    if (input === null || typeof input !== "object") return input as Json;
    if (Array.isArray(input)) {
      const items = input as unknown[];
      if (
        items.length >= MIN_TABLE_ROWS &&
        items.every(isPlainObject) &&
        sameKeyOrder(items as Record<string, Json>[])
      ) {
        const keys = Object.keys(items[0] as Record<string, Json>);
        return {
          [TABLE_KEYS]: keys.map((key) => toTables(key)),
          [TABLE_ROWS]: (items as Record<string, Json>[]).map((row) =>
            keys.map((key) => toTables(row[key])),
          ),
        };
      }
      return items.map(toTables);
    }
    return Object.fromEntries(
      Object.entries(input as Record<string, Json>).map(([key, item]) => {
        assertSafeString(key);
        return [key, toTables(item)];
      }),
    );
  };

  const tabled = toTables(value);
  const strings = [...counts]
    .filter(([text, count]) => count > 1 && text.length > 2)
    .sort((left, right) => right[1] - left[1] || (left[0] < right[0] ? -1 : 1))
    .map(([text]) => text);
  const indexes = new Map(strings.map((text, index) => [text, index]));

  const withReferences = (input: Json): Json => {
    if (typeof input === "string") {
      const index = indexes.get(input);
      return index === undefined ? input : reference(index);
    }
    if (input === null || typeof input !== "object") return input;
    if (Array.isArray(input)) return input.map(withReferences);
    return Object.fromEntries(
      Object.entries(input).map(([key, item]) => [key, withReferences(item)]),
    );
  };

  return { format: PACKED_JSON_FORMAT, strings, data: withReferences(tabled) };
};

export const unpackJson = <T = unknown>(value: unknown): T => {
  if (!isPackedJson(value)) return value as T;
  const { strings } = value;

  const restoreString = (text: string) => {
    if (!text.startsWith(MARK)) return text;
    const restored = strings[Number.parseInt(text.slice(MARK.length), 36)];
    if (restored === undefined) {
      throw new Error(`Packed JSON references a missing string: ${text}`);
    }
    return restored;
  };

  const restore = (input: Json): Json => {
    if (typeof input === "string") return restoreString(input);
    if (input === null || typeof input !== "object") return input;
    if (Array.isArray(input)) return input.map(restore);
    const keys = input[TABLE_KEYS];
    const rows = input[TABLE_ROWS];
    if (Array.isArray(keys) && Array.isArray(rows)) {
      const names = keys.map((key) => restoreString(key as string));
      return rows.map((row) => {
        const cells = row as Json[];
        const entry: Record<string, Json> = {};
        names.forEach((name, index) => {
          entry[name] = restore(cells[index]);
        });
        return entry;
      });
    }
    const entry: Record<string, Json> = {};
    for (const [key, item] of Object.entries(input)) {
      entry[key] = restore(item);
    }
    return entry;
  };

  return restore(value.data) as T;
};
