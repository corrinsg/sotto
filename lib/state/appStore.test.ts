import { beforeEach, describe, expect, test } from "vitest";
import { dedupeKey, useAppStore } from "./appStore";
import type { ParsedStatement, Transaction } from "../parser/types";

function mkTx(
  overrides: Partial<Transaction> & {
    isoDate: string;
    details: string;
    amount: number;
  },
): Transaction {
  return {
    id: `t_${overrides.isoDate}_${overrides.details}_${overrides.amount}`,
    date: overrides.date ?? overrides.isoDate,
    isoDate: overrides.isoDate,
    paymentType: overrides.paymentType ?? "VIS",
    details: overrides.details,
    paidOut: overrides.amount < 0 ? Math.abs(overrides.amount).toFixed(2) : "",
    paidIn: overrides.amount > 0 ? overrides.amount.toFixed(2) : "",
    balance: "",
    amount: overrides.amount,
    kind: overrides.amount < 0 ? "debit" : "credit",
  };
}

function mkStatement(
  transactions: Transaction[],
  source: "pdf" | "csv" = "pdf",
): ParsedStatement {
  return {
    transactions,
    warnings: [],
    stats: { pages: 1, rawRows: transactions.length, source },
  };
}

describe("dedupeKey", () => {
  test("same fields produce the same key", () => {
    const a = mkTx({ isoDate: "2026-03-15", details: "ASDA", amount: -45.2 });
    const b = mkTx({ isoDate: "2026-03-15", details: "ASDA", amount: -45.2 });
    expect(dedupeKey(a)).toBe(dedupeKey(b));
  });

  test("whitespace and casing are normalised", () => {
    const a = mkTx({ isoDate: "2026-03-15", details: "ASDA STORES", amount: -45.2 });
    const b = mkTx({ isoDate: "2026-03-15", details: "  asda   stores  ", amount: -45.2 });
    expect(dedupeKey(a)).toBe(dedupeKey(b));
  });

  test("different amounts produce different keys", () => {
    const a = mkTx({ isoDate: "2026-03-15", details: "ASDA", amount: -45.2 });
    const b = mkTx({ isoDate: "2026-03-15", details: "ASDA", amount: -45.21 });
    expect(dedupeKey(a)).not.toBe(dedupeKey(b));
  });

  test("different payment types produce different keys", () => {
    const a = mkTx({ isoDate: "2026-03-15", details: "ASDA", amount: -45.2, paymentType: "VIS" });
    const b = mkTx({ isoDate: "2026-03-15", details: "ASDA", amount: -45.2, paymentType: "BP" });
    expect(dedupeKey(a)).not.toBe(dedupeKey(b));
  });
});

describe("appendStatement — dedupe across statements", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  test("the same statement loaded twice produces no duplicates in totals", () => {
    const store = useAppStore.getState();
    const txns = [
      mkTx({ isoDate: "2026-03-15", details: "ASDA STORES", amount: -45.2 }),
      mkTx({ isoDate: "2026-03-16", details: "TFL", amount: -3.85 }),
      mkTx({ isoDate: "2026-03-17", details: "SALARY", amount: 2500, paymentType: "CR" }),
    ];
    store.beginBatch(1, false);
    store.appendStatement(mkStatement(txns), "march.pdf");
    store.appendStatement(mkStatement(txns), "march-again.pdf");
    store.finishBatch();

    const after = useAppStore.getState();
    expect(after.transactions).toHaveLength(3);
    expect(after.duplicatesSkipped).toBe(3);
    expect(after.loadedFiles[0].transactionCount).toBe(3);
    expect(after.loadedFiles[0].duplicatesSkipped).toBe(0);
    expect(after.loadedFiles[1].transactionCount).toBe(0);
    expect(after.loadedFiles[1].duplicatesSkipped).toBe(3);
  });

  test("partial overlap keeps only new rows from second statement", () => {
    const store = useAppStore.getState();
    const s1 = [
      mkTx({ isoDate: "2026-03-15", details: "ASDA", amount: -45.2 }),
      mkTx({ isoDate: "2026-03-16", details: "TFL", amount: -3.85 }),
    ];
    const s2 = [
      mkTx({ isoDate: "2026-03-16", details: "TFL", amount: -3.85 }), // dupe
      mkTx({ isoDate: "2026-03-17", details: "UBER", amount: -12 }),   // new
    ];
    store.beginBatch(2, false);
    store.appendStatement(mkStatement(s1), "march.pdf");
    store.appendStatement(mkStatement(s2), "march-extra.pdf");
    store.finishBatch();

    const after = useAppStore.getState();
    expect(after.transactions).toHaveLength(3);
    expect(after.duplicatesSkipped).toBe(1);
  });

  test("two genuinely identical transactions within a single file are both kept", () => {
    // Same merchant, same day, same amount, all in one statement —
    // treated as legitimate (e.g. two £5 coffees at the same cafe).
    const store = useAppStore.getState();
    const txns = [
      mkTx({ isoDate: "2026-03-15", details: "PRET A MANGER", amount: -5 }),
      mkTx({ isoDate: "2026-03-15", details: "PRET A MANGER", amount: -5 }),
    ];
    store.beginBatch(1, false);
    store.appendStatement(mkStatement(txns), "march.pdf");
    store.finishBatch();

    const after = useAppStore.getState();
    expect(after.transactions).toHaveLength(2);
    expect(after.duplicatesSkipped).toBe(0);
  });

  test("BALANCE BROUGHT FORWARD rows are never deduped", () => {
    const store = useAppStore.getState();
    const s1 = [
      mkTx({
        isoDate: "2026-03-01",
        details: "BALANCE BROUGHT FORWARD",
        amount: 0,
        paymentType: "",
      }),
      mkTx({ isoDate: "2026-03-15", details: "ASDA", amount: -45.2 }),
    ];
    const s2 = [
      mkTx({
        isoDate: "2026-04-01",
        details: "BALANCE BROUGHT FORWARD",
        amount: 0,
        paymentType: "",
      }),
      mkTx({ isoDate: "2026-04-02", details: "OCTOPUS", amount: -85 }),
    ];
    store.beginBatch(2, false);
    store.appendStatement(mkStatement(s1), "march.pdf");
    store.appendStatement(mkStatement(s2), "april.pdf");
    store.finishBatch();

    const after = useAppStore.getState();
    const bf = after.transactions.filter(
      (t) => t.details === "BALANCE BROUGHT FORWARD",
    );
    expect(bf).toHaveLength(2);
    expect(after.duplicatesSkipped).toBe(0);
  });
});
