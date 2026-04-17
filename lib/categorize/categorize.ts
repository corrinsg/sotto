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
    // NatWest card-transaction prefix: a 4+ digit card tail, then a compact
    // date like "13DEC23", then an optional "C " (contactless) marker.
    // Stripping it exposes the real merchant name as the first token so a
    // user's "apply to all matching" rule keys on the merchant, not the
    // card/date combo that's unique to that single row.
    .replace(/^\d{4,}\s+\d{1,2}[A-Z]{3}\d{2,4}\s+C?\s*/i, "")
    .trim();
  const tokens = cleaned.split(/\s+/).slice(0, 2);
  return tokens.join(" ");
}
