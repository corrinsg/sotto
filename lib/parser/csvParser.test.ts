import { describe, expect, test } from "vitest";
import { parseCsvStatement } from "./csvParser";

const SIGNED_AMOUNT_CSV = `Date,Description,Amount,Balance
15/03/2026,ASDA GROCERIES,-45.20,1000.00
16/03/2026,SALARY,2500.00,3500.00
17/03/2026,TFL TRAVEL,-3.85,3496.15
`;

const SPLIT_DEBIT_CREDIT_CSV = `Transaction Date,Description,Debit,Credit,Balance
2026-03-15,ASDA STORES,45.20,,1000.00
2026-03-16,SALARY PAYMENT,,2500.00,3500.00
2026-03-17,TFL TRAVEL,3.85,,3496.15
`;

const REVOLUT_CSV = `Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
CARD_PAYMENT,Current,2026-03-15 09:30:00,2026-03-15 09:30:00,ASDA,-45.20,0.00,GBP,COMPLETED,1000.00
TOPUP,Current,2026-03-16 08:00:00,2026-03-16 08:00:00,Apple Pay Top-Up,2500.00,0.00,GBP,COMPLETED,3500.00
`;

const HSBC_STYLE_CSV = `Date,Description,Paid Out,Paid In,Balance
23 Feb 26,ASDA GROCERIES ONL,6.95,,27695.64
24 Feb 26,CHAINLINK LABS,,15574.81,43270.45
`;

const CURRENCY_SYMBOLS_CSV = `Date,Details,Amount
15/03/2026,WAITROSE,"£32.85"
16/03/2026,REFUND,"£12.50"
17/03/2026,PARENS DEBIT,"(£7.20)"
`;

const QUOTED_COMMAS_CSV = `Date,Description,Amount
15/03/2026,"WAITROSE, STORES",-32.85
16/03/2026,"SALARY, ACME LTD",2500.00
`;

const MONZO_STYLE_CSV = `Transaction ID,Date,Time,Type,Name,Category,Amount,Currency,Notes
tx_00001,15/03/2026,09:30:00,Card payment,ASDA,groceries,-45.20,GBP,
tx_00002,16/03/2026,12:00:00,Faster payment,Rent,bills,-1500.00,GBP,
tx_00003,17/03/2026,08:00:00,Pot transfer,Pocket,transfers,0.00,GBP,
`;

const BOM_CSV = `\uFEFFDate,Description,Amount
15/03/2026,ASDA,-45.20
`;

const UNSUPPORTED_CSV = `Col1,Col2,Col3
foo,bar,baz
`;

const EMPTY_HEADER_ONLY = `Date,Description,Amount
`;

describe("parseCsvStatement", () => {
  test("parses single signed-amount layout", async () => {
    const { transactions, stats } = await parseCsvStatement(SIGNED_AMOUNT_CSV);
    expect(stats.source).toBe("csv");
    expect(transactions).toHaveLength(3);

    expect(transactions[0].details).toBe("ASDA GROCERIES");
    expect(transactions[0].amount).toBeCloseTo(-45.2, 2);
    expect(transactions[0].kind).toBe("debit");
    expect(transactions[0].isoDate).toBe("2026-03-15");

    expect(transactions[1].amount).toBeCloseTo(2500, 2);
    expect(transactions[1].kind).toBe("credit");

    expect(transactions[2].isoDate).toBe("2026-03-17");
  });

  test("parses split debit/credit layout with ISO dates", async () => {
    const { transactions } = await parseCsvStatement(SPLIT_DEBIT_CREDIT_CSV);
    expect(transactions).toHaveLength(3);
    expect(transactions[0].kind).toBe("debit");
    expect(transactions[0].amount).toBeCloseTo(-45.2, 2);
    expect(transactions[0].isoDate).toBe("2026-03-15");
    expect(transactions[1].kind).toBe("credit");
    expect(transactions[1].amount).toBeCloseTo(2500, 2);
  });

  test("parses Revolut-style date+time in date column", async () => {
    const { transactions } = await parseCsvStatement(REVOLUT_CSV);
    expect(transactions).toHaveLength(2);
    expect(transactions[0].isoDate).toBe("2026-03-15");
    expect(transactions[0].amount).toBeCloseTo(-45.2, 2);
    expect(transactions[1].amount).toBeCloseTo(2500, 2);
  });

  test("parses HSBC-style month-name dates with paid out / paid in columns", async () => {
    const { transactions } = await parseCsvStatement(HSBC_STYLE_CSV);
    expect(transactions).toHaveLength(2);
    expect(transactions[0].isoDate).toBe("2026-02-23");
    expect(transactions[0].kind).toBe("debit");
    expect(transactions[0].amount).toBeCloseTo(-6.95, 2);
    expect(transactions[1].kind).toBe("credit");
    expect(transactions[1].amount).toBeCloseTo(15574.81, 2);
  });

  test("accepts named-month dates with hyphens, slashes or dots as separators", async () => {
    const csv = `Date,Description,Amount
23-Feb-26,ASDA,-6.95
24/Feb/2026,TESCO,-12.00
25.Feb.26,ITSU,-13.44`;
    const { transactions } = await parseCsvStatement(csv);
    expect(transactions).toHaveLength(3);
    expect(transactions[0].isoDate).toBe("2026-02-23");
    expect(transactions[1].isoDate).toBe("2026-02-24");
    expect(transactions[2].isoDate).toBe("2026-02-25");
  });

  test("handles currency symbols and parenthesized negatives", async () => {
    const { transactions } = await parseCsvStatement(CURRENCY_SYMBOLS_CSV);
    expect(transactions).toHaveLength(3);
    expect(transactions[0].amount).toBeCloseTo(32.85, 2);
    expect(transactions[0].kind).toBe("credit");
    expect(transactions[2].amount).toBeCloseTo(-7.2, 2);
    expect(transactions[2].kind).toBe("debit");
  });

  test("handles quoted fields with embedded commas", async () => {
    const { transactions } = await parseCsvStatement(QUOTED_COMMAS_CSV);
    expect(transactions).toHaveLength(2);
    expect(transactions[0].details).toBe("WAITROSE, STORES");
    expect(transactions[1].details).toBe("SALARY, ACME LTD");
  });

  test("skips zero-amount Monzo pot transfers and parses real transactions", async () => {
    const { transactions } = await parseCsvStatement(MONZO_STYLE_CSV);
    expect(transactions).toHaveLength(2);
    expect(transactions[0].details).toBe("ASDA");
    expect(transactions[1].details).toBe("Rent");
  });

  test("strips UTF-8 BOM", async () => {
    const { transactions } = await parseCsvStatement(BOM_CSV);
    expect(transactions).toHaveLength(1);
  });

  test("rejects a CSV with no recognizable columns", async () => {
    await expect(parseCsvStatement(UNSUPPORTED_CSV)).rejects.toThrow(
      /date column/i,
    );
  });

  test("rejects an empty CSV", async () => {
    await expect(parseCsvStatement(EMPTY_HEADER_ONLY)).rejects.toThrow(
      /empty|no data rows/i,
    );
  });

  test("progress callback fires", async () => {
    const seen: number[] = [];
    await parseCsvStatement(SIGNED_AMOUNT_CSV, {
      onProgress: (p) => seen.push(p),
    });
    expect(seen.length).toBeGreaterThan(0);
    expect(seen[seen.length - 1]).toBe(100);
  });

  test("stable id is deterministic across parses", async () => {
    const a = await parseCsvStatement(SIGNED_AMOUNT_CSV);
    const b = await parseCsvStatement(SIGNED_AMOUNT_CSV);
    expect(a.transactions.map((t) => t.id)).toEqual(
      b.transactions.map((t) => t.id),
    );
  });
});
