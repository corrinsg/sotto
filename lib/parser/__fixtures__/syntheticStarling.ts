// Synthetic fixture mimicking a Starling personal-account statement:
//   DATE | TYPE | TRANSACTION | IN | OUT | ACCOUNT BALANCE
//
// Exercises the parser's Starling-specific behaviours:
//   - the "ACCOUNT BALANCE" header label wraps across two close lines,
//     and we rely on the 2-line header merge to detect the balance
//     column's x-position
//   - "TRANSACTION" as the description column keyword
//   - amounts are prefixed with "£" — AMOUNT_RE must accept the prefix
//     and the stored value must be stripped of it
//   - the TYPE column holds multi-word phrases ("DIRECT CREDIT",
//     "ONLINE PAYMENT", "SUBSCRIPTION CHARGE") instead of 3-letter codes
//   - rows can wrap across two visual lines: the tail of the TYPE label
//     sits on the line below (Starling renders "SUBSCRIPTION" on one
//     line and "CHARGE" on the next). That wrap line must append to the
//     same row rather than start a new transaction.

import PDFDocument from "pdfkit";

export interface ExpectedStarlingRow {
  date: string;
  isoDate: string;
  paymentType: string;
  details: string;
  paidOut: number;
  paidIn: number;
  balance: string;
}

const COLUMNS = {
  dateX: 30,
  typeX: 93,
  transactionX: 191,
  inRight: 443,
  outRight: 498,
  balanceRight: 558,
};

interface Row {
  date: string;
  typePrimary: string;
  typeWrap?: string;
  details: string;
  detailsWrap?: string;
  paidIn?: number;
  paidOut?: number;
  balance?: string;
}

const ROWS: Row[] = [
  {
    date: "01/02/2021",
    typePrimary: "DIRECT CREDIT",
    details: "Amazon Payments Uk (4664765393648773)",
    paidIn: 307.97,
  },
  {
    date: "01/02/2021",
    typePrimary: "SUBSCRIPTION",
    typeWrap: "CHARGE",
    details: "Starling Bank (Subscription Charge For",
    detailsWrap: "2021-02-01)",
    paidOut: 14.0,
  },
  {
    date: "01/02/2021",
    typePrimary: "FASTER PAYMENT",
    details: "Talha Arshad (Part salary)",
    paidOut: 700.0,
  },
  {
    date: "01/02/2021",
    typePrimary: "ONLINE PAYMENT",
    details: "Packlink",
    paidOut: 4.48,
    balance: "115.09",
  },
  {
    date: "02/02/2021",
    typePrimary: "CONTACTLESS",
    details: "Packaging Express",
    paidOut: 28.56,
  },
  {
    date: "03/02/2021",
    typePrimary: "DIRECT DEBIT",
    details: "Ebay Sarl (34EF503E4B5A44B3AC)",
    paidOut: 0.36,
    balance: "82.09",
  },
];

function formatAmount(n: number): string {
  return "\u00a3" + n.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
  doc.text("DATE", COLUMNS.dateX, y, { lineBreak: false });
  doc.text("TYPE", COLUMNS.typeX, y, { lineBreak: false });
  doc.text("TRANSACTION", COLUMNS.transactionX, y, { lineBreak: false });
  drawRightAligned(doc, "IN", COLUMNS.inRight, y);
  drawRightAligned(doc, "OUT", COLUMNS.outRight, y);
  drawRightAligned(doc, "ACCOUNT", COLUMNS.balanceRight, y);
  drawRightAligned(doc, "BALANCE", COLUMNS.balanceRight, y + 12);
}

function drawRow(doc: PDFKit.PDFDocument, row: Row, y: number): number {
  doc.fontSize(9);
  doc.text(row.date, COLUMNS.dateX, y, { lineBreak: false });
  doc.text(row.typePrimary, COLUMNS.typeX, y, { lineBreak: false });
  doc.text(row.details, COLUMNS.transactionX, y, { lineBreak: false });
  if (row.paidIn !== undefined) {
    drawRightAligned(doc, formatAmount(row.paidIn), COLUMNS.inRight, y);
  }
  if (row.paidOut !== undefined) {
    drawRightAligned(doc, formatAmount(row.paidOut), COLUMNS.outRight, y);
  }
  if (row.balance) {
    drawRightAligned(doc, formatAmount(parseFloat(row.balance)), COLUMNS.balanceRight, y);
  }
  let cursor = y + 12;
  if (row.typeWrap || row.detailsWrap) {
    if (row.typeWrap) {
      doc.text(row.typeWrap, COLUMNS.typeX, cursor, { lineBreak: false });
    }
    if (row.detailsWrap) {
      doc.text(row.detailsWrap, COLUMNS.transactionX, cursor, { lineBreak: false });
    }
    cursor += 12;
  }
  return cursor;
}

export function buildSyntheticStarlingStatement(): Promise<Uint8Array> {
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
      doc.fontSize(14).text("01/02/2021 - 23/02/2021 Statement", 40, 40, {
        lineBreak: false,
      });
      drawHeader(doc, 110);

      let y = 155;
      for (const row of ROWS) {
        y = drawRow(doc, row, y);
      }
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

export const SYNTHETIC_STARLING_GOLDEN: ExpectedStarlingRow[] = ROWS.map(
  (row) => {
    const paymentType = row.typeWrap
      ? `${row.typePrimary} ${row.typeWrap}`
      : row.typePrimary;
    const details = row.detailsWrap
      ? `${row.details} ${row.detailsWrap}`
      : row.details;
    return {
      date: row.date,
      isoDate: toIso(row.date),
      paymentType,
      details,
      paidOut: row.paidOut ?? 0,
      paidIn: row.paidIn ?? 0,
      balance: row.balance ?? "",
    };
  },
);
