import { beforeAll, describe, expect, test } from "vitest";
import { createRequire } from "node:module";
import * as pdfjsLib from "pdfjs-dist";

import { parseStatementPdf } from "./pdfParser";
import {
  buildSyntheticMonzoStatement,
  SYNTHETIC_MONZO_GOLDEN,
} from "./__fixtures__/syntheticMonzo";

let fixtureBytes: Uint8Array;

beforeAll(async () => {
  const require = createRequire(import.meta.url);
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
    "pdfjs-dist/build/pdf.worker.min.mjs",
  );
  fixtureBytes = await buildSyntheticMonzoStatement();
});

function freshFixture(): Uint8Array {
  const ab = new ArrayBuffer(fixtureBytes.byteLength);
  new Uint8Array(ab).set(fixtureBytes);
  return new Uint8Array(ab);
}

describe("parseStatementPdf — synthetic Monzo-style statement", () => {
  test("row count matches golden (legal trailer is not parsed as a row)", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    expect(transactions).toHaveLength(SYNTHETIC_MONZO_GOLDEN.length);
  });

  test("DD/MM/YYYY dates convert to ISO", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_MONZO_GOLDEN.length; i++) {
      expect(transactions[i].isoDate).toBe(SYNTHETIC_MONZO_GOLDEN[i].isoDate);
    }
  });

  test("signed Amount column splits into paidOut/paidIn by sign", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_MONZO_GOLDEN.length; i++) {
      const got = transactions[i];
      const want = SYNTHETIC_MONZO_GOLDEN[i];
      const gotOut = parseFloat((got.paidOut || "0").replace(/,/g, ""));
      const gotIn = parseFloat((got.paidIn || "0").replace(/,/g, ""));
      expect(gotOut).toBeCloseTo(want.paidOut, 2);
      expect(gotIn).toBeCloseTo(want.paidIn, 2);
      expect(got.kind).toBe(want.kind);
    }
  });

  test("balance is preserved on every row", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_MONZO_GOLDEN.length; i++) {
      expect(transactions[i].balance).toBe(SYNTHETIC_MONZO_GOLDEN[i].balance);
    }
  });

  test("description lines above AND below the amount line attach to the correct row", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_MONZO_GOLDEN.length; i++) {
      expect(transactions[i].details).toBe(SYNTHETIC_MONZO_GOLDEN[i].details);
    }
  });

  test("legal trailer text does not leak into the last transaction", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    const last = transactions[transactions.length - 1];
    expect(last.details).not.toContain("Monzo Bank Limited");
    expect(last.details).not.toContain("monzo.com");
    expect(last.details).not.toContain("9446231");
  });
});
