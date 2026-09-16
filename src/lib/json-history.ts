import type { JsonIndent } from "./json-format";

export const jsonHistoryStorageKey = "devkit-json-format-history";
export const jsonHistoryLimit = 10;

export interface JsonHistoryEntry {
  id: string;
  text: string;
  indent: JsonIndent;
  formattedAt: number;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface HistoryEntryWithFingerprint {
  entry: JsonHistoryEntry;
  fingerprint: string;
}

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isJsonIndent(value: unknown): value is JsonIndent {
  return value === 0 || value === 2 || value === 4;
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((output, key) => {
        output[key] = sortJsonValue((value as Record<string, unknown>)[key]);
        return output;
      }, {});
  }

  return value;
}

function jsonFingerprint(text: string): string | null {
  try {
    return JSON.stringify(sortJsonValue(JSON.parse(text) as unknown));
  } catch {
    return null;
  }
}

function createEntryId(fingerprint: string, formattedAt: number) {
  let hash = 0;
  for (let index = 0; index < fingerprint.length; index += 1) {
    hash = (hash * 31 + fingerprint.charCodeAt(index)) | 0;
  }
  return `json-${formattedAt.toString(36)}-${(hash >>> 0).toString(36)}`;
}

function parseStoredEntry(value: unknown): HistoryEntryWithFingerprint | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<JsonHistoryEntry>;
  if (
    typeof candidate.id !== "string" ||
    !candidate.id ||
    typeof candidate.text !== "string" ||
    !isJsonIndent(candidate.indent) ||
    typeof candidate.formattedAt !== "number" ||
    !Number.isFinite(candidate.formattedAt)
  ) {
    return null;
  }

  const fingerprint = jsonFingerprint(candidate.text);
  if (!fingerprint) return null;

  return {
    entry: {
      id: candidate.id,
      text: candidate.text,
      indent: candidate.indent,
      formattedAt: candidate.formattedAt
    },
    fingerprint
  };
}

function normalizeEntries(entries: HistoryEntryWithFingerprint[]): HistoryEntryWithFingerprint[] {
  const seen = new Set<string>();

  return entries
    .sort((left, right) => right.entry.formattedAt - left.entry.formattedAt)
    .filter(item => {
      if (seen.has(item.fingerprint)) return false;
      seen.add(item.fingerprint);
      return true;
    })
    .slice(0, jsonHistoryLimit);
}

function writeEntries(entries: JsonHistoryEntry[], storage?: StorageLike) {
  const target = getStorage(storage);
  if (!target) return;

  try {
    target.setItem(jsonHistoryStorageKey, JSON.stringify(entries));
  } catch {
    // The caller still receives the updated in-memory list when browser storage is unavailable.
  }
}

export function loadJsonHistory(storage?: StorageLike): JsonHistoryEntry[] {
  const target = getStorage(storage);
  if (!target) return [];

  try {
    const raw = target.getItem(jsonHistoryStorageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return normalizeEntries(parsed.map(parseStoredEntry).filter((entry): entry is HistoryEntryWithFingerprint => Boolean(entry))).map(item => item.entry);
  } catch {
    return [];
  }
}

export function recordJsonHistory(
  input: Pick<JsonHistoryEntry, "text" | "indent">,
  formattedAt = Date.now(),
  storage?: StorageLike
): JsonHistoryEntry[] {
  const fingerprint = jsonFingerprint(input.text);
  if (!fingerprint || !isJsonIndent(input.indent)) return loadJsonHistory(storage);

  const stored = loadJsonHistory(storage).map(entry => ({
    entry,
    fingerprint: jsonFingerprint(entry.text) || ""
  }));
  const matching = stored.find(item => item.fingerprint === fingerprint);
  const nextEntry: JsonHistoryEntry = {
    id: matching?.entry.id || createEntryId(fingerprint, formattedAt),
    text: input.text,
    indent: input.indent,
    formattedAt
  };
  const nextEntries = normalizeEntries([
    { entry: nextEntry, fingerprint },
    ...stored.filter(item => item.fingerprint && item.fingerprint !== fingerprint)
  ]).map(item => item.entry);

  writeEntries(nextEntries, storage);
  return nextEntries;
}

export function clearJsonHistory(storage?: StorageLike) {
  const target = getStorage(storage);
  if (!target) return;

  try {
    target.removeItem(jsonHistoryStorageKey);
  } catch {
    // Keep the UI usable when browser storage is unavailable.
  }
}
