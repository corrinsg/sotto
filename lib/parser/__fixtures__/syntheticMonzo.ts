// Synthetic fixture mimicking a Monzo personal-account statement:
//   Date | Description | (GBP) Amount | (GBP) Balance
//
// Exercises the parser's Monzo-specific behaviours:
//   - header labels with "(GBP)" prefix that must normalise to base
//     keywords so the column detector can find "Amount" / "Balance"
//   - single signed "Amount" column: negative = debit, positive = credit
//   - DD/MM/YYYY date format (distinct from HSBC/Lloyds/NatWest)
//   - multi-line rows where the merchant descriptor sits on the line
//     directly above the date+amount line (pre-desc buffering)
//   - multi-line rows where the descriptor ALSO wraps onto the line
//     immediately below the amount line (post-amount wrap)
//   - legal text following the final transaction must not leak into it

import PDFDocument from "pdfkit";

export interface ExpectedMonzoRow {
  date: string;
  isoDate: string;
  details: string;
  paidOut: number;
  paidIn: number;
  balance: string;
  kind: "debit" | "credit";
}

const COLUMNS = {
  dateX: 70,
  descriptionX: 153,
  amountRight: 430,
  balanceRight: 525,
};

const HEADER_Y = 110;
const FIRST_ROW_Y = 140;
const ROW_BLOCK = 30;

interface Row {
  date: string;
  descBefore?: string;
  descInline?: string;
  descAfter?: string;
  amount: number; // signed: negative = debit, positive = credit
  balance: string;
}

const ROWS: Row[] = [
  {
    date: "02/05/2022",
    descInline: "DC*mrgreen Sliema GIB",
    amount: -100.0,
    balance: "315.00",
  },
  {
    date: "06/05/2022",
    descInline: "COSTA COFFEE GBR",
    amount: -4.05,
    balance: "310.95",
  },
  {
    date: "14/05/2022",
    descInline: "Www Aliexpress com",
    amount: -100.0,
    balance: "116.95",
  },
  {
    date: "23/05/2022",
    descBefore: "DC*mrgreen Waterport Ro Sliema GX11 1AA",
    descAfter: "GIBGIB",
    amount: 230.0,
    balance: "276.70",
  },
  {
    date: "26/05/2022",
    descInline: "PAYPAL *LS BET 35314369001 GBR",
    amount: -200.0,
    balance: "76.70",
  },
  {
    date: "30/05/2022",
    descBefore: "DC*mrgreen Waterport Ro Sliema GX11 1AA",
    descAfter: "GIBGIB",
    amount: 200.0,
    balance: "276.70",
  },
];

function formatAmount(n: number): string {
  const sign = n < 0 ? "-" : "";
  return (
    sign +
    Math.abs(n).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function drawRightAligned(
  doc: PDFKit.PDFDocument,
  text: string,
  rightEdge: number,
  y: number,
): void {
  const width = doc.widthOfString(text);
  doc.text(text, rightEdge - width, y, { lineBreak: false });
}

function drawHeader(doc: PDFKit.PDFDocument, y: number): void {
  doc.fontSize(10);
  doc.text("Date", COLUMNS.dateX, y, { lineBreak: false });
  doc.text("Description", COLUMNS.descriptionX, y, { lineBreak: false });
  drawRightAligned(doc, "(GBP) Amount", COLUMNS.amountRight, y);
  drawRightAligned(doc, "(GBP) Balance", COLUMNS.balanceRight, y);
}

function drawRow(doc: PDFKit.PDFDocument, row: Row, y: number): number {
  doc.fontSize(9);
  let cursor = y;
  if (row.descBefore) {
    doc.text(row.descBefore, COLUMNS.descriptionX, cursor, { lineBreak: false });
    cursor += 10;
  }
  doc.text(row.date, COLUMNS.dateX, cursor, { lineBreak: false });
  if (row.descInline) {
    doc.text(row.descInline, COLUMNS.descriptionX, cursor, { lineBreak: false });
  }
  drawRightAligned(doc, formatAmount(row.amount), COLUMNS.amountRight, cursor);
  drawRightAligned(doc, row.balance, COLUMNS.balanceRight, cursor);
  cursor += 10;
  if (row.descAfter) {
    doc.text(row.descAfter, COLUMNS.descriptionX, cursor, { lineBreak: false });
    cursor += 10;
  }
  return Math.max(cursor, y + ROW_BLOCK);
}

export function buildSyntheticMonzoStatement(): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => {
        const concat = Buffer.concat(chunks);
        const ab = new ArrayBuffer(concat.byteLength);
        new Uint8Array(ab).set(concat);
        resolve(new Uint8Array(ab));
      });
      doc.on("error", reject);

      doc.font("Helvetica");
      doc.fontSize(14).text("Personal Account statement", 40, 40, {
        lineBreak: false,
      });
      drawHeader(doc, HEADER_Y);

      let y = FIRST_ROW_Y;
      for (const row of ROWS) {
        y = drawRow(doc, row, y);
      }

      // Legal trailer, to verify it doesn't leak into the last transaction.
      doc.fontSize(8);
      doc.text(
        "Monzo Bank Limited (https://monzo.com) is a company registered in England No. 9446231.",
        40,
        y + 40,
        { lineBreak: false },
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function toIso(d: string): string {
  const [day, month, year] = d.split("/");
  return `${year}-${month}-${day}`;
}

function joinDesc(row: Row): string {
  const parts = [row.descBefore, row.descInline, row.descAfter].filter(Boolean);
  return parts.join(" ");
}

export const SYNTHETIC_MONZO_GOLDEN: ExpectedMonzoRow[] = ROWS.map((row) => ({
  date: row.date,
  isoDate: toIso(row.date),
  details: joinDesc(row),
  paidOut: row.amount < 0 ? -row.amount : 0,
  paidIn: row.amount > 0 ? row.amount : 0,
  balance: row.balance,
  kind: row.amount < 0 ? "debit" : "credit",
}));
