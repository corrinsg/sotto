import type { Transaction } from "../parser/types";
import type { Category, MerchantRule } from "./types";
import { STARTER_RULES } from "./rules";

export interface CategorizeResult {
  category: Category | null;
  ruleIndex: number | null;
}

export function categorize(
  tx: Transaction,
  rules: readonly MerchantRule[] = STARTER_RULES,
): CategorizeResult {
  const haystack = tx.details.toUpperCase();
  let best: { category: Category; priority: number; index: number } | null =
    null;

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const appliesTo = rule.appliesTo ?? "both";
    if (appliesTo === "debit" && tx.kind !== "debit") continue;
    if (appliesTo === "credit" && tx.kind !== "credit") continue;

    if (rule.paymentType && tx.paymentType !== rule.paymentType) continue;

    let hit: boolean;
    if (rule.pattern) {
      hit = rule.pattern.test(tx.details);
    } else if (rule.match) {
      hit = haystack.includes(rule.match.toUpperCase());
    } else {
      hit = rule.paymentType !== undefined;
    }

    if (hit) {
      const p = rule.priority ?? 0;
      if (!best || p > best.priority) {
        best = { category: rule.category, priority: p, index: i };
      }
    }
  }

  return best
    ? { category: best.category, ruleIndex: best.index }
    : { category: null, ruleIndex: null };
}

export function extractMerchantToken(details: string): string {
  const cleaned = details
    .replace(/^(VIS|BP|CR|DD|CHQ|SO|TFR|\)\)\)|FPI|FPO|BGC|ATM)\s+/i, "")
    .replace(/^INT'L\s+\d+\s+/, "")
    .trim();
  const tokens = cleaned.split(/\s+/).slice(0, 2);
  return tokens.join(" ");
}
