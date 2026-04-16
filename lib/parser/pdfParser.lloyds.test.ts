import { beforeAll, describe, expect, test } from "vitest";
import { createRequire } from "node:module";
import * as pdfjsLib from "pdfjs-dist";

import { parseStatementPdf } from "./pdfParser";
import {
  buildSyntheticLloydsStatement,
  SYNTHETIC_LLOYDS_GOLDEN,
} from "./__fixtures__/syntheticLloyds";

let fixtureBytes: Uint8Array;

beforeAll(async () => {
  const require = createRequire(import.meta.url);
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
    "pdfjs-dist/build/pdf.worker.min.mjs",
  );
  fixtureBytes = await buildSyntheticLloydsStatement();
});

function freshFixture(): Uint8Array {
  const ab = new ArrayBuffer(fixtureBytes.byteLength);
  new Uint8Array(ab).set(fixtureBytes);
  return new Uint8Array(ab);
}

describe("parseStatementPdf — synthetic Lloyds-style statement", () => {
  test("row count matches golden", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    expect(transactions).toHaveLength(SYNTHETIC_LLOYDS_GOLDEN.length);
  });

  test("dates are parsed from DD MMM YY and converted to ISO", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_LLOYDS_GOLDEN.length; i++) {
      expect(transactions[i].isoDate).toBe(SYNTHETIC_LLOYDS_GOLDEN[i].isoDate);
    }
  });

  test("payment types are read from the dedicated Type column", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_LLOYDS_GOLDEN.length; i++) {
      expect(transactions[i].paymentType).toBe(
        SYNTHETIC_LLOYDS_GOLDEN[i].paymentType,
      );
    }
  });

  test("description does NOT contain the type code", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_LLOYDS_GOLDEN.length; i++) {
      const want = SYNTHETIC_LLOYDS_GOLDEN[i];
      expect(transactions[i].details).toBe(want.details);
      expect(transactions[i].details).not.toContain(want.paymentType);
    }
  });

  test("debits and credits land in the right columns (In before Out)", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_LLOYDS_GOLDEN.length; i++) {
      const got = transactions[i];
      const want = SYNTHETIC_LLOYDS_GOLDEN[i];
      const gotOut = parseFloat((got.paidOut || "0").replace(/,/g, ""));
      const gotIn = parseFloat((got.paidIn || "0").replace(/,/g, ""));
      expect(gotOut).toBeCloseTo(want.paidOut, 2);
      expect(gotIn).toBeCloseTo(want.paidIn, 2);
    }
  });

  test("balances are preserved where present", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_LLOYDS_GOLDEN.length; i++) {
      const want = SYNTHETIC_LLOYDS_GOLDEN[i];
      if (want.balance) {
        expect(transactions[i].balance).toBe(want.balance);
      }
    }
  });
});
