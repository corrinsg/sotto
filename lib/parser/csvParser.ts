import type {
  ParsedStatement,
  ParseOptions,
  Transaction,
} from "./types";

interface ColumnMap {
  date: number;
  description: number;
  amount: number;
  debit: number;
  credit: number;
  balance: number;
  type: number;
}

const DATE_HEADERS = [
  "date",
  "transaction date",
  "trans. date",
  "posting date",
  "posted date",
  "completed date",
  "started date",
  "value date",
  "booking date",
];

const DESCRIPTION_HEADERS = [
  "description",
  "details",
  "name",
  "reference",
  "merchant",
  "narrative",
  "memo",
  "payee",
  "transaction description",
  "particulars",
];

const AMOUNT_HEADERS = ["amount", "value", "transaction amount"];

const DEBIT_HEADERS = [
  "debit",
  "paid out",
  "money out",
  "withdrawal",
  "out",
  "paid_out",
  "debit amount",
];

const CREDIT_HEADERS = [
  "credit",
  "paid in",
  "money in",
  "deposit",
  "in",
  "paid_in",
  "credit amount",
];

const BALANCE_HEADERS = ["balance", "running balance", "account balance"];

const TYPE_HEADERS = ["type", "transaction type", "payment type"];

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function parseCsvText(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      current.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && cleaned[i + 1] === "\n") i++;
      current.push(field);
      field = "";
      if (current.some((c) => c.length > 0)) {
        rows.push(current);
      }
      current = [];
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || current.length > 0) {
    current.push(field);
    if (current.some((c) => c.length > 0)) {
      rows.push(current);
    }
  }

  return rows;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, " ").replace(/[_]/g, " ");
}

function detectColumns(headers: string[]): ColumnMap {
  const norm = headers.map(normalizeHeader);
  const findIn = (candidates: string[]): number => {
    for (const name of candidates) {
      const idx = norm.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };
  return {
    date: findIn(DATE_HEADERS),
    description: findIn(DESCRIPTION_HEADERS),
    amount: findIn(AMOUNT_HEADERS),
    debit: findIn(DEBIT_HEADERS),
    credit: findIn(CREDIT_HEADERS),
    balance: findIn(BALANCE_HEADERS),
    type: findIn(TYPE_HEADERS),
  };
}

function parseFlexibleDate(
  value: string,
): { display: string; iso: string } | null {
  const full = value.trim();
  if (!full) return null;
  const firstToken = full.split(/\s+/)[0];
  const attempts = firstToken === full ? [full] : [full, firstToken];

  for (const s of attempts) {
    // Named-month dates: "23 Feb 26", "23-Feb-26", "23/Feb/26",
    // "23.Feb.2026" — any of space/hyphen/slash/dot as the separator.
    const mNamed =
      /^(\d{1,2})[\s\-\/.]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\-\/.]+(\d{2,4})$/i.exec(
        s,
      );
    if (mNamed) {
      const day = mNamed[1].padStart(2, "0");
      const month = MONTHS[mNamed[2].toLowerCase()];
      const year = mNamed[3].length === 2 ? `20${mNamed[3]}` : mNamed[3];
      return { display: full, iso: `${year}-${month}-${day}` };
    }

    const mUk = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/.exec(s);
    if (mUk) {
      const day = mUk[1].padStart(2, "0");
      const month = mUk[2].padStart(2, "0");
      const year = mUk[3].length === 2 ? `20${mUk[3]}` : mUk[3];
      return { display: full, iso: `${year}-${month}-${day}` };
    }

    const mIso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (mIso) {
      const day = mIso[3].padStart(2, "0");
      const month = mIso[2].padStart(2, "0");
      return { display: full, iso: `${mIso[1]}-${month}-${day}` };
    }
  }

  return null;
}

function parseFlexibleAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let s = trimmed.replace(/[£$€¥\s,]/g, "");
  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  if (s.length === 0) return null;
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  return negative ? -n : n;
}

function stableId(
  date: string,
  details: string,
  amount: number,
  index: number,
): string {
  const raw = `${date}|${details}|${amount.toFixed(2)}|${index}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (h * 31 + raw.charCodeAt(i)) | 0;
  }
  return `t_${(h >>> 0).toString(36)}_${index}`;
}

async function inputToText(
  input: ArrayBuffer | Uint8Array | File | Blob | string,
): Promise<string> {
  if (typeof input === "string") return input;
  if (input instanceof Uint8Array) return new TextDecoder().decode(input);
  if (input instanceof ArrayBuffer) return new TextDecoder().decode(input);
  return (input as Blob).text();
}

export async function parseCsvStatement(
  input: ArrayBuffer | Uint8Array | File | Blob | string,
  opts?: ParseOptions,
): Promise<ParsedStatement> {
  const text = await inputToText(input);
  const rows = parseCsvText(text);

  if (rows.length < 2) {
    throw new Error(
      "This CSV file is empty or has no data rows beyond the header.",
    );
  }

  const headers = rows[0];
  const cols = detectColumns(headers);

  if (cols.date === -1) {
    throw new Error(
      "Couldn't find a Date column. Your CSV needs a header like 'Date' or 'Transaction Date'.",
    );
  }
  if (cols.description === -1) {
    throw new Error(
      "Couldn't find a Description column. Your CSV needs a header like 'Description', 'Details', 'Name', or 'Merchant'.",
    );
  }
  if (cols.amount === -1 && (cols.debit === -1 || cols.credit === -1)) {
    throw new Error(
      "Couldn't find an Amount column (or separate Debit/Credit columns).",
    );
  }

  const warnings: string[] = [];
  const transactions: Transaction[] = [];
  const dataRows = rows.slice(1);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    const dateRaw = row[cols.date] ?? "";
    const descriptionRaw = row[cols.description] ?? "";
    const balance =
      cols.balance !== -1 ? (row[cols.balance] ?? "").trim() : "";
    const paymentType =
      cols.type !== -1 ? (row[cols.type] ?? "").trim() : "";

    if (!dateRaw && !descriptionRaw) continue;

    const parsedDate = parseFlexibleDate(dateRaw);
    if (!parsedDate) {
      warnings.push(`Row ${i + 2}: couldn't parse date "${dateRaw}"`);
      continue;
    }

    let amount: number | null = null;
    let kind: "debit" | "credit" = "debit";
    let paidOut = "";
    let paidIn = "";

    if (cols.amount !== -1) {
      const val = parseFlexibleAmount(row[cols.amount] ?? "");
      if (val === null) {
        warnings.push(
          `Row ${i + 2}: couldn't parse amount "${row[cols.amount]}"`,
        );
        continue;
      }
      if (val === 0) continue;
      amount = val;
      if (val < 0) {
        kind = "debit";
        paidOut = Math.abs(val).toFixed(2);
      } else {
        kind = "credit";
        paidIn = val.toFixed(2);
      }
    } else {
      const debitVal = parseFlexibleAmount(row[cols.debit] ?? "");
      const creditVal = parseFlexibleAmount(row[cols.credit] ?? "");
      if (debitVal !== null && debitVal !== 0) {
        amount = -Math.abs(debitVal);
        kind = "debit";
        paidOut = Math.abs(debitVal).toFixed(2);
      } else if (creditVal !== null && creditVal !== 0) {
        amount = creditVal;
        kind = "credit";
        paidIn = creditVal.toFixed(2);
      } else {
        continue;
      }
    }

    const details = descriptionRaw.replace(/\s+/g, " ").trim();

    transactions.push({
      id: stableId(parsedDate.display, details, amount, i),
      date: parsedDate.display,
      isoDate: parsedDate.iso,
      paymentType,
      details,
      paidOut,
      paidIn,
      balance,
      amount,
      kind,
    });

    opts?.onProgress?.(Math.round(((i + 1) / dataRows.length) * 100));
  }

  return {
    transactions,
    warnings,
    stats: { pages: 0, rawRows: dataRows.length, source: "csv" },
  };
}
