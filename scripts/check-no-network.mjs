#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ROOTS = ["app", "components", "lib"];
const SKIP_FILES = new Set(["scripts/check-no-network.mjs"]);
const FORBIDDEN = [
  { pattern: /\bfetch\s*\(/, label: "fetch(" },
  { pattern: /\bXMLHttpRequest\b/, label: "XMLHttpRequest" },
  { pattern: /\bsendBeacon\s*\(/, label: "sendBeacon(" },
  { pattern: /\bnavigator\.connection\b/, label: "navigator.connection" },
  { pattern: /\bnew\s+WebSocket\s*\(/, label: "WebSocket" },
];

const violations = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(ROOT, full);
    if (SKIP_FILES.has(rel)) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(name)) continue;
    const src = readFileSync(full, "utf8");
    const lines = src.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
      for (const { pattern, label } of FORBIDDEN) {
        if (pattern.test(line)) {
          violations.push(`${rel}:${i + 1}: ${label} — ${line.trim()}`);
        }
      }
    }
  }
}

for (const root of ROOTS) {
  const full = join(ROOT, root);
  try {
    if (statSync(full).isDirectory()) walk(full);
  } catch {
    // directory does not exist yet
  }
}

if (violations.length > 0) {
  console.error("Privacy violation: forbidden network APIs found:");
  for (const v of violations) console.error("  " + v);
  console.error(
    "\nThis product must not make any network requests on the parsing path.",
  );
  process.exit(1);
}

console.log("OK: no forbidden network APIs on the parsing path.");
