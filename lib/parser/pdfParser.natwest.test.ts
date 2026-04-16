import { beforeAll, describe, expect, test } from "vitest";
import { createRequire } from "node:module";
import * as pdfjsLib from "pdfjs-dist";

import { parseStatementPdf } from "./pdfParser";
import {
  buildSyntheticNatwestStatement,
  SYNTHETIC_NATWEST_GOLDEN,
} from "./__fixtures__/syntheticNatwest";

let fixtureBytes: Uint8Array;

beforeAll(async () => {
  const require = createRequire(import.meta.url);
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
    "pdfjs-dist/build/pdf.worker.min.mjs",
  );
  fixtureBytes = await buildSyntheticNatwestStatement();
});

function freshFixture(): Uint8Array {
  const ab = new ArrayBuffer(fixtureBytes.byteLength);
  new Uint8Array(ab).set(fixtureBytes);
  return new Uint8Array(ab);
}

describe("parseStatementPdf — synthetic NatWest-style statement", () => {
  test("row count matches golden (page-break BROUGHT FORWARD is de-duplicated)", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    expect(transactions).toHaveLength(SYNTHETIC_NATWEST_GOLDEN.length);
  });

  test("ISO dates resolve bare 'DD MMM' continuations using the last seen year, including DEC→JAN rollover", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_NATWEST_GOLDEN.length; i++) {
      expect(transactions[i].isoDate).toBe(SYNTHETIC_NATWEST_GOLDEN[i].isoDate);
    }
  });

  test("NatWest phrase types are extracted into paymentType and stripped from details", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_NATWEST_GOLDEN.length; i++) {
      const want = SYNTHETIC_NATWEST_GOLDEN[i];
      expect(transactions[i].paymentType).toBe(want.paymentType);
      if (want.paymentType) {
        expect(transactions[i].details).not.toContain(want.paymentType);
      }
    }
  });

  test("same-day transactions inherit the date from the preceding row", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_NATWEST_GOLDEN.length; i++) {
      expect(transactions[i].date).toBe(SYNTHETIC_NATWEST_GOLDEN[i].date);
    }
  });

  test("description wraps merge with the amount line (no truncation, no pollution)", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_NATWEST_GOLDEN.length; i++) {
      expect(transactions[i].details).toBe(SYNTHETIC_NATWEST_GOLDEN[i].details);
    }
  });

  test("debits and credits land in the right columns", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_NATWEST_GOLDEN.length; i++) {
      const got = transactions[i];
      const want = SYNTHETIC_NATWEST_GOLDEN[i];
      const gotOut = parseFloat((got.paidOut || "0").replace(/,/g, ""));
      const gotIn = parseFloat((got.paidIn || "0").replace(/,/g, ""));
      expect(gotOut).toBeCloseTo(want.paidOut, 2);
      expect(gotIn).toBeCloseTo(want.paidIn, 2);
    }
  });

  test("balances are preserved on every row", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_NATWEST_GOLDEN.length; i++) {
      expect(transactions[i].balance).toBe(
        SYNTHETIC_NATWEST_GOLDEN[i].balance,
      );
    }
  });

  test("no transaction contains per-page NatWest footer text", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (const t of transactions) {
      expect(t.details).not.toContain("National Westminster");
      expect(t.details).not.toContain("Registered Office");
      expect(t.details).not.toContain("Authorised");
    }
    for (const t of transactions.slice(1)) {
      expect(t.details).not.toContain("BROUGHT FORWARD");
    }
  });
});
