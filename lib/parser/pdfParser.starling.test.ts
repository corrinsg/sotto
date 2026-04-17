import { beforeAll, describe, expect, test } from "vitest";
import { createRequire } from "node:module";
import * as pdfjsLib from "pdfjs-dist";

import { parseStatementPdf } from "./pdfParser";
import {
  buildSyntheticStarlingStatement,
  SYNTHETIC_STARLING_GOLDEN,
} from "./__fixtures__/syntheticStarling";

let fixtureBytes: Uint8Array;

beforeAll(async () => {
  const require = createRequire(import.meta.url);
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
    "pdfjs-dist/build/pdf.worker.min.mjs",
  );
  fixtureBytes = await buildSyntheticStarlingStatement();
});

function freshFixture(): Uint8Array {
  const ab = new ArrayBuffer(fixtureBytes.byteLength);
  new Uint8Array(ab).set(fixtureBytes);
  return new Uint8Array(ab);
}

describe("parseStatementPdf — synthetic Starling-style statement", () => {
  test("row count matches golden (wrap rows don't spawn extra transactions)", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    expect(transactions).toHaveLength(SYNTHETIC_STARLING_GOLDEN.length);
  });

  test("DD/MM/YYYY dates convert to ISO", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_STARLING_GOLDEN.length; i++) {
      expect(transactions[i].isoDate).toBe(
        SYNTHETIC_STARLING_GOLDEN[i].isoDate,
      );
    }
  });

  test("multi-word TYPE column phrases are captured in full and stripped from details", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_STARLING_GOLDEN.length; i++) {
      const want = SYNTHETIC_STARLING_GOLDEN[i];
      expect(transactions[i].paymentType).toBe(want.paymentType);
      // None of the type phrase words should have leaked into details.
      for (const word of want.paymentType.split(/\s+/)) {
        if (word.length >= 4) {
          expect(transactions[i].details).not.toContain(word);
        }
      }
    }
  });

  test("wrap rows extend both the type and the description of the preceding row", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_STARLING_GOLDEN.length; i++) {
      expect(transactions[i].details).toBe(SYNTHETIC_STARLING_GOLDEN[i].details);
    }
  });

  test("£-prefixed amounts are stored without the currency symbol and split into In/Out", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_STARLING_GOLDEN.length; i++) {
      const got = transactions[i];
      const want = SYNTHETIC_STARLING_GOLDEN[i];
      expect(got.paidOut).not.toContain("£");
      expect(got.paidIn).not.toContain("£");
      expect(got.balance).not.toContain("£");
      const gotOut = parseFloat((got.paidOut || "0").replace(/,/g, ""));
      const gotIn = parseFloat((got.paidIn || "0").replace(/,/g, ""));
      expect(gotOut).toBeCloseTo(want.paidOut, 2);
      expect(gotIn).toBeCloseTo(want.paidIn, 2);
    }
  });

  test("balance is preserved where present", async () => {
    const { transactions } = await parseStatementPdf(freshFixture());
    for (let i = 0; i < SYNTHETIC_STARLING_GOLDEN.length; i++) {
      const want = SYNTHETIC_STARLING_GOLDEN[i];
      if (want.balance) {
        expect(transactions[i].balance).toBe(want.balance);
      }
    }
  });
});
