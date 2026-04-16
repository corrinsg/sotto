import { beforeAll, describe, expect, test } from "vitest";
import { createRequire } from "node:module";
import * as pdfjsLib from "pdfjs-dist";

import { parseStatementPdf } from "./pdfParser";
import {
  buildSyntheticStatement,
  SYNTHETIC_CLOSING_BALANCE,
  SYNTHETIC_GOLDEN,
  SYNTHETIC_OPENING_BALANCE,
} from "./__fixtures__/synthetic";

let fixtureBytes: Uint8Array;

beforeAll(async () => {
  const require = createRequire(import.meta.url);
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
    "pdfjs-dist/build/pdf.worker.min.mjs",
  );
  fixtureBytes = await buildSyntheticStatement();
});

function freshFixture(): Uint8Array {
  // pdf.js detaches the input buffer during parsing, so each test needs
  // its own copy backed by a fresh ArrayBuffer.
  const ab = new ArrayBuffer(fixtureBytes.byteLength);
  new Uint8Array(ab).set(fixtureBytes);
  return new Uint8Array(ab);
}

function normalizeDetails(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

describe("parseStatementPdf — synthetic HSBC-style statement", () => {
  test("row count matches the golden", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    expect(transactions).toHaveLength(SYNTHETIC_GOLDEN.length);
  });

  test("every row matches the golden on key fields", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    const diffs: string[] = [];
    for (let i = 0; i < SYNTHETIC_GOLDEN.length; i++) {
      const got = transactions[i];
      const want = SYNTHETIC_GOLDEN[i];
      if (got.date !== want.date) {
        diffs.push(`[${i}] date: got "${got.date}" want "${want.date}"`);
      }
      if (got.isoDate !== want.isoDate) {
        diffs.push(
          `[${i}] isoDate: got "${got.isoDate}" want "${want.isoDate}"`,
        );
      }
      if (got.paymentType !== want.paymentType) {
        diffs.push(
          `[${i}] paymentType: got "${got.paymentType}" want "${want.paymentType}"`,
        );
      }
      const gotPaidOut = parseFloat((got.paidOut || "0").replace(/,/g, ""));
      const gotPaidIn = parseFloat((got.paidIn || "0").replace(/,/g, ""));
      if (Math.abs(gotPaidOut - want.paidOut) > 0.005) {
        diffs.push(
          `[${i}] paidOut: got ${gotPaidOut} want ${want.paidOut}`,
        );
      }
      if (Math.abs(gotPaidIn - want.paidIn) > 0.005) {
        diffs.push(`[${i}] paidIn: got ${gotPaidIn} want ${want.paidIn}`);
      }
      if (
        normalizeDetails(got.details) !== normalizeDetails(want.details)
      ) {
        diffs.push(
          `[${i}] details: got "${got.details}" want "${want.details}"`,
        );
      }
    }
    if (diffs.length > 0) {
      throw new Error(
        `Found ${diffs.length} row mismatches:\n${diffs.slice(0, 20).join("\n")}`,
      );
    }
  });

  test("opening row is BALANCE BROUGHT FORWARD and carries the opening balance", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    const opening = transactions[0];
    expect(opening.details).toMatch(/BALANCE BROUGHT FORWARD/);
    expect(parseFloat(opening.balance.replace(/,/g, ""))).toBeCloseTo(
      SYNTHETIC_OPENING_BALANCE,
      2,
    );
  });

  test("cross-page BALANCE BROUGHT FORWARD on page 2 is NOT duplicated", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    const broughtForwardCount = transactions.filter((t) =>
      /BALANCE BROUGHT FORWARD/.test(t.details),
    ).length;
    expect(broughtForwardCount).toBe(1);
  });

  test("totals invariant: sum of real transactions matches balance delta", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    const opening = parseFloat(transactions[0].balance.replace(/,/g, ""));
    let closing = 0;
    for (let i = transactions.length - 1; i >= 0; i--) {
      if (transactions[i].balance) {
        closing = parseFloat(transactions[i].balance.replace(/,/g, ""));
        break;
      }
    }
    const net = transactions
      .slice(1)
      .reduce((sum, t) => sum + t.amount, 0);
    expect(Math.abs(net - (closing - opening))).toBeLessThan(0.02);
    expect(closing).toBeCloseTo(SYNTHETIC_CLOSING_BALANCE, 2);
  });

  test("no transaction contains footer bleed or FSCS text", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (const t of transactions) {
      expect(t.details).not.toMatch(/BALANCE CARRIED FORWARD/i);
      expect(t.details).not.toMatch(/BALANCECARRIEDFORWARD/i);
      expect(t.details).not.toMatch(/Financial Services Compensation/);
      expect(t.details).not.toMatch(/FSCS/);
    }
  });

  test("stats report the right number of pages", async () => {
    const { stats } = await parseStatementPdf(freshFixture());
    expect(stats.pages).toBe(2);
    expect(stats.rawRows).toBeGreaterThan(0);
  });
});
