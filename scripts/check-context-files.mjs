import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = new Map([
  ["AGENTS.md", ["# Repository Guidelines", "## Context Is the Source of Truth"]],
  ["PLAN.md", ["# Product Plan", "## Milestones"]],
  ["PROGRESS.md", ["# Project Progress", "## Next Concrete Step"]],
  ["DECISIONS.md", ["# Design Decisions", "## ADR-001"]],
  ["TASKS.md", ["# Prioritized Tasks", "## Next - P1"]],
  ["MEMORY.md", ["# Project Memory", "## Non-Negotiable Learning Rules"]],
  ["CHANGELOG.md", ["# Changelog", "## 2026-07-27"]],
  ["ARCHITECTURE.md", ["# System Architecture", "## Runtime Flow"]],
  ["README.md", ["# 英句練習", "## Context Engineering 工作方式"]],
  [
    "docs/context-engineering-workflow.md",
    ["# Context Engineering 工作流程", "## 新對話啟動 Prompt"],
  ],
]);

const suspiciousCharacters = [
  ["replacement character", "\uFFFD"],
  ["soft hyphen", "\u00AD"],
  ["zero-width space", "\u200B"],
  ["zero-width non-joiner", "\u200C"],
  ["zero-width joiner", "\u200D"],
  ["word joiner", "\u2060"],
  ["zero-width no-break space", "\uFEFF"],
  ["U+FFFE", "\uFFFE"],
  ["common mojibake marker", "嚙"],
];

const failures = [];

for (const [relativePath, requiredSections] of requiredFiles) {
  const absolutePath = resolve(repositoryRoot, relativePath);
  let content;

  try {
    content = await readFile(absolutePath, "utf8");
  } catch (error) {
    failures.push(`${relativePath}: cannot be read (${error.message})`);
    continue;
  }

  if (content.trim().length < 100) {
    failures.push(`${relativePath}: file is unexpectedly short`);
  }

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      failures.push(`${relativePath}: missing required section "${section}"`);
    }
  }

  for (const [label, character] of suspiciousCharacters) {
    if (content.includes(character)) {
      failures.push(`${relativePath}: contains ${label}`);
    }
  }

  for (const character of content) {
    const codePoint = character.codePointAt(0);
    if (codePoint >= 0xe000 && codePoint <= 0xf8ff) {
      failures.push(
        `${relativePath}: contains private-use character U+${codePoint
          .toString(16)
          .toUpperCase()}`,
      );
      break;
    }
  }
}

if (failures.length > 0) {
  console.error("Context Engineering check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Context Engineering check passed: ${requiredFiles.size} files are present, structured, and clean UTF-8.`,
);
