import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "tmp/vocabulary-sources");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data-sources/vocabulary-3000/sources.json"), "utf8"));
const digest = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
fs.mkdirSync(directory, { recursive: true });
for (const source of manifest.sources) {
  const destination = path.join(directory, source.file);
  if (path.dirname(destination) !== directory) throw new Error("來源路徑必須在暫存目錄內。");
  if (fs.existsSync(destination)) {
    if (digest(fs.readFileSync(destination)) !== source.sha256) {
      throw new Error(`現有來源雜湊不符：${source.file}。保留原檔，請先人工確認。`);
    }
    console.log(`Verified cached ${source.file}`);
    continue;
  }
  const response = await fetch(source.url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`來源下載失敗：${source.file}（HTTP ${response.status}）。`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (digest(bytes) !== source.sha256) throw new Error(`下載來源版本已改變：${source.file}。不可繼續。`);
  fs.writeFileSync(destination, bytes, { flag: "wx" });
  console.log(`Downloaded and verified ${source.file}`);
}
// Only this exact, hash-verified official archive is extracted into the task temp directory.
execFileSync("tar", ["-xzf", path.join(directory, "WordNet-3.0.tar.gz"), "-C", directory], { windowsHide: true });
console.log("Vocabulary sources ready. Run npm run prepare:vocabulary-source next.");
