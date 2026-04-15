import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import * as pdfjsLib from "pdfjs-dist";

import { parseHsbcStatement } from "../parser/hsbcParser";
import type { Transaction } from "../parser/types";
import { categorize, extractMerchantToken } from "./categorize";
import type { Category } from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(
  __dirname,
  "..",
  "parser",
  "__fixtures__",
  "march_statement.pdf",
);

const require = createRequire(import.meta.url);
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
  "pdfjs-dist/build/pdf.worker.min.mjs",
);

function mockTx(
  details: string,
  kind: "debit" | "credit" = "debit",
  paymentType = "VIS",
): Transaction {
  return {
    id: "t",
    date: "01 Jan 26",
    isoDate: "2026-01-01",
    paymentType,
    details,
    paidOut: kind === "debit" ? "10.00" : "",
    paidIn: kind === "credit" ? "10.00" : "",
    balance: "",
    amount: kind === "debit" ? -10 : 10,
    kind,
  };
}

describe("categorize — unit tests", () => {
  test.each<[string, Category]>([
    ["ASDA GROCERIES ONL 08080062732", "Groceries"],
    ["WAITROSE STORES WHETSTONE", "Groceries"],
    ["SAINSBURYS S/MKTS LONDON", "Groceries"],
    ["TFL TRAVEL CH TFL.GOV.UK/CP", "Transport"],
    ["UBR* PENDING.UBER. LONDON", "Transport"],
    ["UBER UK RIDES LONDON", "Transport"],
    ["OCTOPUS", "Utilities"],
    ["AFFINITY WATER", "Utilities"],
    ["NETFLIX.CO", "Subscriptions"],
    ["CLAUDE.AI SUBSCRIP", "Subscriptions"],
    ["VMS WeWork City Ro London", "Subscriptions"],
    ["Amazon.co.uk*UO5CJ", "Shopping"],
    ["AMZNMktplace*DL5VR", "Shopping"],
    ["ITSU EAGLE HOUSE", "Dining Out"],
    ["PRET A MANGER LONDON", "Dining Out"],
    ["COSTA COFFEE LONDON", "Dining Out"],
    ["FINCHLEY DENTAL LO LONDON", "Health & Fitness"],
    ["PETS AT HOME LTD GREATER LONDO", "Pet"],
    ["HALO DOGS LTD LONDON", "Pet"],
    ["SOHO THEATRE London", "Entertainment"],
    ["HOLLYWOOD BOWL PUTTSTARS", "Entertainment"],
    ["LOT AIRLINEA080D(4 LONDON", "Travel"],
    ["BUTLINS BURGER KIN SKEGNESS", "Dining Out"],
    ["AGEAS INTERNET", "Insurance"],
  ])("%s → %s", (details, expected) => {
    const result = categorize(mockTx(details));
    expect(result.category).toBe(expected);
  });

  test("ATM payment type is categorized as Cash regardless of details", () => {
    const tx = mockTx("CASH WITHDRAWAL MUSWELL HILL", "debit", "ATM");
    expect(categorize(tx).category).toBe("Cash");
  });

  test("ATM category beats merchant rules via priority", () => {
    const tx = mockTx("ASDA ATM GROCERIES LEEDS", "debit", "ATM");
    expect(categorize(tx).category).toBe("Cash");
  });

  test("non-ATM payment type doesn't trigger Cash", () => {
    const tx = mockTx("SOMERANDOMMERCHANT", "debit", "VIS");
    expect(categorize(tx).category).toBe(null);
  });

  test("unknown merchant returns null", () => {
    expect(categorize(mockTx("SOMERANDOMPLACE LTD")).category).toBe(null);
  });

  test("BUPA only matches credit (refunds), never debit", () => {
    expect(categorize(mockTx("BUPA PAYMENTS", "credit")).category).toBe("Health & Fitness");
    expect(categorize(mockTx("BUPA PAYMENTS", "debit")).category).toBe(null);
  });

  test("CHAINLINK LABS only matches credit (income)", () => {
    expect(
      categorize(mockTx("Chainlink Labs", "credit")).category,
    ).toBe("Income");
    expect(categorize(mockTx("Chainlink Labs", "debit")).category).toBe(null);
  });
});

describe("extractMerchantToken", () => {
  test("strips payment type prefix", () => {
    expect(extractMerchantToken("VIS ASDA GROCERIES")).toBe("ASDA GROCERIES");
  });
  test("takes first two words", () => {
    expect(extractMerchantToken("TFL TRAVEL CH TFL.GOV.UK/CP")).toBe("TFL TRAVEL");
  });
  test("handles INT'L prefix", () => {
    expect(
      extractMerchantToken("INT'L 0026317893 LinkedIn P83441678"),
    ).toBe("LinkedIn P83441678");
  });
});

describe("categorize — coverage on real fixture", () => {
  test("categorizes at least 70% of the sample statement", async () => {
    const pdf = readFileSync(FIXTURE);
    const data = new Uint8Array(pdf.buffer, pdf.byteOffset, pdf.byteLength);
    const { transactions } = await parseHsbcStatement(data);
    const categorizedCount = transactions.filter(
      (t) => categorize(t).category !== null,
    ).length;
    const coverage = categorizedCount / transactions.length;
    expect(coverage).toBeGreaterThan(0.7);
  });

  test("no debit is ever categorized as Income", async () => {
    const pdf = readFileSync(FIXTURE);
    const data = new Uint8Array(pdf.buffer, pdf.byteOffset, pdf.byteLength);
    const { transactions } = await parseHsbcStatement(data);
    for (const t of transactions) {
      if (t.kind === "debit") {
        expect(categorize(t).category).not.toBe("Income");
      }
    }
  });
});
