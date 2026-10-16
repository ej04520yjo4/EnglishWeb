import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(
  root,
  "data-sources",
  "vocabulary-3000",
  "phonetics",
  "source-manifest.json",
);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const args = process.argv.slice(2);
const refresh = args.includes("--refresh");
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const defaultDestination = path.join(
  root,
  "tmp",
  "vocabulary-phonetics",
  "cmudict-7479086.dict",
);
const destination = path.resolve(
  root,
  option("--output") ?? defaultDestination,
);
const snapshotPath = path.resolve(root, manifest.snapshotFile);

if (!manifest.sourceUrl || !manifest.sourceSha256 || !manifest.sourceBytes) {
  throw new Error("CMUdict source manifest 缺少固定網址、SHA-256 或檔案大小。");
}

const hashBytes = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const verifyFullSource = (bytes, label) => {
  const actualHash = hashBytes(bytes);
  if (actualHash !== manifest.sourceSha256.toUpperCase()) {
    throw new Error(
      `${label} 的 SHA-256 不符合 pinned CMUdict：預期 ${manifest.sourceSha256}，實際 ${actualHash}。`,
    );
  }
  if (bytes.byteLength !== manifest.sourceBytes) {
    throw new Error(
      `${label} 的大小不符合 pinned CMUdict：預期 ${manifest.sourceBytes} bytes，實際 ${bytes.byteLength} bytes。`,
    );
  }
};

const verifySnapshot = (bytes, label) => {
  const normalizedBytes = Buffer.from(
    bytes.toString("utf8").replaceAll("\r\n", "\n"),
    "utf8",
  );
  const actualHash = hashBytes(normalizedBytes);
  if (actualHash !== manifest.snapshotSha256.toUpperCase()) {
    throw new Error(
      `${label} 的 snapshot SHA-256 不符合 pinned CMUdict：預期 ${manifest.snapshotSha256}，實際 ${actualHash}。`,
    );
  }
  if (normalizedBytes.byteLength !== manifest.snapshotBytes) {
    throw new Error(
      `${label} 的 snapshot 大小不符合 pinned CMUdict：預期 ${manifest.snapshotBytes} bytes，實際 ${normalizedBytes.byteLength} bytes。`,
    );
  }
};

if (!refresh) {
  try {
    const snapshot = await readFile(snapshotPath);
    verifySnapshot(snapshot, snapshotPath);
    console.log(`已驗證離線 CMUdict target snapshot：${snapshotPath}`);
    console.log("未下載完整 CMUdict；如需更新來源請明確加入 --refresh。\n");
    process.exit(0);
  } catch (error) {
    throw new Error(
      `離線 target snapshot 不存在或驗證失敗：${error.message}\n若要明確更新完整來源，請執行 node scripts/fetch-vocabulary-phonetics.mjs --refresh。`,
    );
  }
}

try {
  const existing = await readFile(destination);
  verifyFullSource(existing, destination);
  console.log(`CMUdict 已存在且通過 pinned hash：${destination}`);
  process.exit(0);
} catch (error) {
  if (error?.code !== "ENOENT") {
    console.log(`現有檔案未通過驗證，將重新下載：${error.message}`);
  }
}

const response = await fetch(manifest.sourceUrl, {
  headers: { "User-Agent": "EnglishWeb-vocabulary-phonetics-fetch/1.0" },
});
if (!response.ok) {
  throw new Error(`下載 CMUdict 失敗（HTTP ${response.status}）。`);
}
const bytes = new Uint8Array(await response.arrayBuffer());
verifyFullSource(bytes, manifest.sourceUrl);

await mkdir(path.dirname(destination), { recursive: true });
const temporaryDestination = `${destination}.download`;
await writeFile(temporaryDestination, bytes);
await rm(destination, { force: true });
await rename(temporaryDestination, destination);
console.log(`已下載並驗證 pinned CMUdict：${destination}`);
console.log(`SHA-256：${hashBytes(bytes)}`);
console.log("這是明確 --refresh 取得的完整來源；預設 build 仍使用已提交的 target snapshot。");
