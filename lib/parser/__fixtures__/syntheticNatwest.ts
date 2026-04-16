// Synthetic fixture mimicking a NatWest "Reward Account" layout:
//   Date | Description | Paid In(£) | Withdrawn(£) | Balance(£)
//
// Exercises the parser's NatWest-specific behaviours:
//   - header labels with "(£)" suffix that must match the keyword dictionary
//   - transaction-start phrases ("Card Transaction", "Standing Order", ...)
//     in place of short type codes
//   - two-line transactions: description on one line, wrap + amounts on the
//     next line
//   - same-day transactions that omit the date after the first row
//   - bare "DD MMM" continuation dates with year inferred from context
//   - BROUGHT FORWARD opening row without the "BALANCE" prefix
//   - a page break with per-page BROUGHT FORWARD and "National Westminster
//     Bank Plc." footer

import PDFDocument from "pdfkit";

export interface ExpectedNatwestRow {
  date: string;
  isoDate: string;
  paymentType: string;
  details: string;
  paidOut: number;
  paidIn: number;
  balance: string;
}

const COLUMNS = {
  dateX: 58,
  descriptionX: 111,
  paidInRight: 390,
  withdrawnRight: 440,
  balanceRight: 510,
};

const PAGE_HEIGHT = 841.89;
const FOOTER_Y = 770;

interface Txn {
  date?: string; // "13 DEC 2023" or "14 DEC" or empty (same-day continuation)
  type?: string; // payment type phrase stripped from the details
  desc: string; // portion of the description on the first line
  wrap?: string; // portion of the description that wraps onto the amount line
  paidIn?: number;
  paidOut?: number;
  balance?: string;
}

const PAGE_1_ROWS: Txn[] = [
  { date: "13 DEC 2023", desc: "BROUGHT FORWARD", balance: "10,250.44" },
  {
    type: "Standing Order",
    desc: "SABA HAMID",
    paidOut: 100.0,
    balance: "10,150.44",
  },
  {
    type: "Direct Debit",
    desc: "PAYPAL PAYMENT",
    paidOut: 63.33,
    balance: "10,087.11",
  },
  {
    date: "14 DEC",
    type: "Card Transaction",
    desc: "9637 13DEC23 C TESCO STORES 4357",
    wrap: "STOURBRIDGE GB",
    paidOut: 27.62,
    balance: "10,059.49",
  },
  {
    type: "Card Transaction",
    desc: "9637 12DEC23 C ALDI 72 772",
    wrap: "STOURBRIDGE GB",
    paidOut: 35.4,
    balance: "10,024.09",
  },
  {
    date: "15 DEC",
    type: "Automated Credit",
    desc: "F MUSRUR FP 15/12/23 1709",
    wrap: "100000001254857796",
    paidIn: 4.49,
    balance: "10,028.58",
  },
];

const PAGE_2_ROWS: Txn[] = [
  { desc: "BROUGHT FORWARD", balance: "10,028.58" },
  {
    date: "02 JAN",
    type: "Card Transaction",
    desc: "9637 31DEC23 ROADHOUSE FAST FOOD",
    wrap: "WEST MIDLANDS GB",
    paidOut: 12.5,
    balance: "10,016.08",
  },
  {
    type: "Standing Order",
    desc: "AMER AZIZ",
    paidOut: 50.0,
    balance: "9,966.08",
  },
];

function formatAmount(n: number): string {
  return n.toLocaleString("en-GB", {
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
  doc.text("Date", COLUMNS.dateX, y, { lineBreak: false });
  doc.text("Description", COLUMNS.descriptionX, y, { lineBreak: false });
  drawRightAligned(doc, "Paid In(£)", COLUMNS.paidInRight, y);
  drawRightAligned(doc, "Withdrawn(£)", COLUMNS.withdrawnRight, y);
  drawRightAligned(doc, "Balance(£)", COLUMNS.balanceRight, y);
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  doc.fontSize(8);
  doc.text(
    "National Westminster Bank Plc. Registered in England & Wales No.929027.",
    COLUMNS.dateX,
    FOOTER_Y,
    { lineBreak: false },
  );
  doc.text(
    "Registered Office: 250 Bishopsgate, London, EC2M 4AA.",
    COLUMNS.dateX,
    FOOTER_Y + 10,
    { lineBreak: false },
  );
  doc.text(
    "Authorised by the Prudential Regulation Authority and regulated by the Financial Conduct Authority.",
    COLUMNS.dateX,
    FOOTER_Y + 20,
    { lineBreak: false },
  );
}

function drawTxn(
  doc: PDFKit.PDFDocument,
  t: Txn,
  y: number,
): number {
  doc.fontSize(9);
  if (t.date) {
    doc.text(t.date, COLUMNS.dateX, y, { lineBreak: false });
  }
  const descLine = t.type ? `${t.type} ${t.desc}` : t.desc;
  doc.text(descLine, COLUMNS.descriptionX, y, { lineBreak: false });

  if (t.wrap) {
    const wrapY = y + 11;
    doc.text(t.wrap, COLUMNS.descriptionX, wrapY, { lineBreak: false });
    if (t.paidIn !== undefined) {
      drawRightAligned(doc, formatAmount(t.paidIn), COLUMNS.paidInRight, wrapY);
    }
    if (t.paidOut !== undefined) {
      drawRightAligned(
        doc,
        formatAmount(t.paidOut),
        COLUMNS.withdrawnRight,
        wrapY,
      );
    }
    if (t.balance) {
      drawRightAligned(doc, t.balance, COLUMNS.balanceRight, wrapY);
    }
    return wrapY + 13;
  }

  if (t.paidIn !== undefined) {
    drawRightAligned(doc, formatAmount(t.paidIn), COLUMNS.paidInRight, y);
  }
  if (t.paidOut !== undefined) {
    drawRightAligned(doc, formatAmount(t.paidOut), COLUMNS.withdrawnRight, y);
  }
  if (t.balance) {
    drawRightAligned(doc, t.balance, COLUMNS.balanceRight, y);
  }
  return y + 13;
}

function drawPage(doc: PDFKit.PDFDocument, rows: Txn[]): void {
  drawHeader(doc, 90);
  let y = 115;
  for (const row of rows) {
    y = drawTxn(doc, row, y);
  }
  drawFooter(doc);
}

export function buildSyntheticNatwestStatement(): Promise<Uint8Array> {
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
      doc.fontSize(12).text("NatWest Reward Account Statement", 40, 40, {
        lineBreak: false,
      });

      drawPage(doc, PAGE_1_ROWS);
      doc.addPage({ size: "A4", margin: 40 });
      drawPage(doc, PAGE_2_ROWS);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

const MONTH: Record<string, string> = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

// Golden output: one entry per NatWest transaction, in the order the parser
// should emit them. The BROUGHT FORWARD row appears only once (the page 2
// page-break BROUGHT FORWARD must be de-duplicated by the parser).
export const SYNTHETIC_NATWEST_GOLDEN: ExpectedNatwestRow[] = [
  {
    date: "13 DEC 2023",
    isoDate: "2023-12-13",
    paymentType: "",
    details: "BALANCE BROUGHT FORWARD",
    paidOut: 0,
    paidIn: 0,
    balance: "10,250.44",
  },
  {
    date: "13 DEC 2023",
    isoDate: "2023-12-13",
    paymentType: "Standing Order",
    details: "SABA HAMID",
    paidOut: 100.0,
    paidIn: 0,
    balance: "10,150.44",
  },
  {
    date: "13 DEC 2023",
    isoDate: "2023-12-13",
    paymentType: "Direct Debit",
    details: "PAYPAL PAYMENT",
    paidOut: 63.33,
    paidIn: 0,
    balance: "10,087.11",
  },
  {
    date: "14 DEC 2023",
    isoDate: "2023-12-14",
    paymentType: "Card Transaction",
    details: "9637 13DEC23 C TESCO STORES 4357 STOURBRIDGE GB",
    paidOut: 27.62,
    paidIn: 0,
    balance: "10,059.49",
  },
  {
    date: "14 DEC 2023",
    isoDate: "2023-12-14",
    paymentType: "Card Transaction",
    details: "9637 12DEC23 C ALDI 72 772 STOURBRIDGE GB",
    paidOut: 35.4,
    paidIn: 0,
    balance: "10,024.09",
  },
  {
    date: "15 DEC 2023",
    isoDate: "2023-12-15",
    paymentType: "Automated Credit",
    details: "F MUSRUR FP 15/12/23 1709 100000001254857796",
    paidOut: 0,
    paidIn: 4.49,
    balance: "10,028.58",
  },
  {
    date: "02 JAN 2024",
    isoDate: "2024-01-02",
    paymentType: "Card Transaction",
    details: "9637 31DEC23 ROADHOUSE FAST FOOD WEST MIDLANDS GB",
    paidOut: 12.5,
    paidIn: 0,
    balance: "10,016.08",
  },
  {
    date: "02 JAN 2024",
    isoDate: "2024-01-02",
    paymentType: "Standing Order",
    details: "AMER AZIZ",
    paidOut: 50.0,
    paidIn: 0,
    balance: "9,966.08",
  },
];

// Keep MONTH export consistent with the Lloyds fixture style.
void MONTH;
