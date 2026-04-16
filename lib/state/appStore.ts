"use client";

import { create } from "zustand";
import type { ParsedStatement, Transaction } from "../parser/types";
import type { Category, MerchantRule } from "../categorize/types";
import { categorize } from "../categorize/categorize";
import { STARTER_RULES } from "../categorize/rules";

export type Phase = "idle" | "parsing" | "parsed" | "error";

export interface LoadedFile {
  name: string;
  source: "pdf" | "csv";
  transactionCount: number; // rows actually kept (after dedupe)
  duplicatesSkipped: number; // rows from this file that were dupes of earlier rows
  pages: number;
  rawRows: number;
}

interface AppState {
  phase: Phase;
  // Parsing progress
  totalFiles: number;
  currentFileIndex: number; // 1-based
  currentFileName: string | null;
  perFileProgress: number; // 0-100 for the current file

  error: string | null;
  transactions: Transaction[];
  loadedFiles: LoadedFile[];
  duplicatesSkipped: number; // running total across the current session
  categoryOverrides: Record<string, Category>;
  sessionRules: MerchantRule[];
}

interface AppActions {
  beginBatch: (totalFiles: number, keepExisting: boolean) => void;
  setCurrentFile: (index: number, name: string) => void;
  setFileProgress: (pct: number) => void;
  appendStatement: (statement: ParsedStatement, filename: string) => void;
  finishBatch: () => void;
  setError: (msg: string) => void;
  assignCategory: (txId: string, cat: Category) => void;
  addSessionRule: (rule: MerchantRule) => void;
  reset: () => void;
}

const INITIAL: AppState = {
  phase: "idle",
  totalFiles: 0,
  currentFileIndex: 0,
  currentFileName: null,
  perFileProgress: 0,
  error: null,
  transactions: [],
  loadedFiles: [],
  duplicatesSkipped: 0,
  categoryOverrides: {},
  sessionRules: [],
};

function normaliseForDedupe(details: string): string {
  return details.toUpperCase().replace(/\s+/g, " ").trim();
}

export function dedupeKey(tx: Transaction): string {
  return [
    tx.isoDate,
    tx.paymentType,
    normaliseForDedupe(tx.details),
    tx.amount.toFixed(2),
  ].join("|");
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  ...INITIAL,

  beginBatch: (totalFiles, keepExisting) =>
    set((state) => ({
      phase: "parsing",
      totalFiles,
      currentFileIndex: 0,
      currentFileName: null,
      perFileProgress: 0,
      error: null,
      transactions: keepExisting ? state.transactions : [],
      loadedFiles: keepExisting ? state.loadedFiles : [],
      duplicatesSkipped: keepExisting ? state.duplicatesSkipped : 0,
      categoryOverrides: keepExisting ? state.categoryOverrides : {},
      sessionRules: keepExisting ? state.sessionRules : [],
    })),

  setCurrentFile: (index, name) =>
    set({
      currentFileIndex: index,
      currentFileName: name,
      perFileProgress: 0,
    }),

  setFileProgress: (pct) => set({ perFileProgress: pct }),

  appendStatement: (statement, filename) =>
    set((state) => {
      // Dedupe across files only. Keys collected from rows already in
      // state before this file was loaded. We deliberately don't add to
      // `seenFromPrior` as we iterate the current file, so two genuinely
      // identical rows within a single statement (e.g. two £5 coffees
      // at the same cafe on the same day) are both kept.
      const seenFromPrior = new Set<string>();
      for (const tx of state.transactions) {
        // BALANCE BROUGHT FORWARD rows deliberately bypass dedupe —
        // each statement has its own opening balance on its own date.
        if (tx.details === "BALANCE BROUGHT FORWARD") continue;
        seenFromPrior.add(dedupeKey(tx));
      }
      const fresh: Transaction[] = [];
      let skipped = 0;
      for (const tx of statement.transactions) {
        if (tx.details === "BALANCE BROUGHT FORWARD") {
          fresh.push(tx);
          continue;
        }
        if (seenFromPrior.has(dedupeKey(tx))) {
          skipped++;
          continue;
        }
        fresh.push(tx);
      }

      const source = statement.stats.source ?? "pdf";
      const loaded: LoadedFile = {
        name: filename,
        source,
        transactionCount: fresh.length,
        duplicatesSkipped: skipped,
        pages: statement.stats.pages,
        rawRows: statement.stats.rawRows,
      };
      return {
        transactions: [...state.transactions, ...fresh],
        loadedFiles: [...state.loadedFiles, loaded],
        duplicatesSkipped: state.duplicatesSkipped + skipped,
      };
    }),

  finishBatch: () =>
    set({
      phase: "parsed",
      perFileProgress: 100,
    }),

  setError: (msg) => set({ phase: "error", error: msg }),

  assignCategory: (txId, cat) =>
    set((state) => ({
      categoryOverrides: { ...state.categoryOverrides, [txId]: cat },
    })),

  addSessionRule: (rule) =>
    set((state) => ({ sessionRules: [...state.sessionRules, rule] })),

  reset: () => set({ ...INITIAL }),
}));

export function selectOverallProgress(state: AppState): number {
  if (state.totalFiles === 0) return 0;
  const completed = Math.max(0, state.currentFileIndex - 1);
  const current = Math.max(0, Math.min(100, state.perFileProgress)) / 100;
  return Math.round(((completed + current) / state.totalFiles) * 100);
}

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
  category: Category | "Uncategorised";
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
    const key = category ?? "Uncategorised";
    const prev = totals.get(key) ?? { total: 0, count: 0 };
    totals.set(key, {
      total: prev.total + Math.abs(tx.amount),
      count: prev.count + 1,
    });
  }

  return Array.from(totals.entries())
    .map(([category, v]) => ({
      category: category as Category | "Uncategorised",
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
