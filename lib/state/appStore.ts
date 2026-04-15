"use client";

import { create } from "zustand";
import type { ParsedStatement, Transaction } from "../parser/types";
import type { Category, MerchantRule } from "../categorize/types";
import { categorize } from "../categorize/categorize";
import { STARTER_RULES } from "../categorize/rules";

export type Phase = "idle" | "parsing" | "parsed" | "error";

interface AppState {
  phase: Phase;
  parseProgress: number;
  error: string | null;
  transactions: Transaction[];
  stats: ParsedStatement["stats"] | null;
  categoryOverrides: Record<string, Category>;
  sessionRules: MerchantRule[];
}

interface AppActions {
  startParse: () => void;
  setProgress: (pct: number) => void;
  setParsed: (statement: ParsedStatement) => void;
  setError: (msg: string) => void;
  assignCategory: (txId: string, cat: Category) => void;
  addSessionRule: (rule: MerchantRule) => void;
  reset: () => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  phase: "idle",
  parseProgress: 0,
  error: null,
  transactions: [],
  stats: null,
  categoryOverrides: {},
  sessionRules: [],

  startParse: () =>
    set({
      phase: "parsing",
      parseProgress: 0,
      error: null,
      transactions: [],
      stats: null,
      categoryOverrides: {},
      sessionRules: [],
    }),
  setProgress: (pct) => set({ parseProgress: pct }),
  setParsed: (statement) =>
    set({
      phase: "parsed",
      parseProgress: 100,
      transactions: statement.transactions,
      stats: statement.stats,
    }),
  setError: (msg) => set({ phase: "error", error: msg }),
  assignCategory: (txId, cat) =>
    set((state) => ({
      categoryOverrides: { ...state.categoryOverrides, [txId]: cat },
    })),
  addSessionRule: (rule) =>
    set((state) => ({ sessionRules: [...state.sessionRules, rule] })),
  reset: () =>
    set({
      phase: "idle",
      parseProgress: 0,
      error: null,
      transactions: [],
      stats: null,
      categoryOverrides: {},
      sessionRules: [],
    }),
}));

export interface CategorizedTransaction {
  tx: Transaction;
  category: Category | null;
  assigned: boolean;
}

interface CategorizationInputs {
  transactions: Transaction[];
  categoryOverrides: Record<string, Category>;
  sessionRules: MerchantRule[];
}

export function computeCategorized(
  inputs: CategorizationInputs,
): CategorizedTransaction[] {
  const rules = [...inputs.sessionRules, ...STARTER_RULES];
  return inputs.transactions.map((tx) => {
    const override = inputs.categoryOverrides[tx.id];
    if (override) {
      return { tx, category: override, assigned: true };
    }
    const result = categorize(tx, rules);
    return { tx, category: result.category, assigned: false };
  });
}

export interface CategoryTotal {
  category: Category | "Uncategorized";
  total: number;
  count: number;
}

export function computeTotalsByCategory(
  inputs: CategorizationInputs,
): CategoryTotal[] {
  const categorized = computeCategorized(inputs);
  const totals = new Map<string, { total: number; count: number }>();

  for (const { tx, category } of categorized) {
    if (tx.details === "BALANCE BROUGHT FORWARD") continue;
    if (tx.kind !== "debit") continue;
    const key = category ?? "Uncategorized";
    const prev = totals.get(key) ?? { total: 0, count: 0 };
    totals.set(key, {
      total: prev.total + Math.abs(tx.amount),
      count: prev.count + 1,
    });
  }

  return Array.from(totals.entries())
    .map(([category, v]) => ({
      category: category as Category | "Uncategorized",
      total: v.total,
      count: v.count,
    }))
    .sort((a, b) => b.total - a.total);
}

export function computeUncategorized(
  inputs: CategorizationInputs,
): CategorizedTransaction[] {
  return computeCategorized(inputs).filter(
    (c) =>
      c.category === null && c.tx.details !== "BALANCE BROUGHT FORWARD",
  );
}

export interface Summary {
  totalDebit: number;
  totalCredit: number;
  debitCount: number;
  creditCount: number;
}

export function computeSummary(inputs: CategorizationInputs): Summary {
  const categorized = computeCategorized(inputs);
  let totalDebit = 0;
  let totalCredit = 0;
  let debitCount = 0;
  let creditCount = 0;
  for (const { tx } of categorized) {
    if (tx.details === "BALANCE BROUGHT FORWARD") continue;
    if (tx.kind === "debit") {
      totalDebit += Math.abs(tx.amount);
      debitCount++;
    } else if (tx.kind === "credit") {
      totalCredit += tx.amount;
      creditCount++;
    }
  }
  return { totalDebit, totalCredit, debitCount, creditCount };
}
