import PDFDocument from "pdfkit";

export interface ExpectedRow {
  date: string;
  isoDate: string;
  paymentType: string;
  details: string;
  paidOut: number;
  paidIn: number;
  balance: string;
}

const COLUMNS = {
  dateX: 60,
  detailsX: 150,
  paidOutRight: 420,
  paidInRight: 490,
  balanceRight: 560,
};

const HEADER_Y = 110;
const FIRST_ROW_Y = 140;
const ROW_HEIGHT = 18;

interface Row {
  date: string;
  paymentType: string;
  details: string;
  continuation?: string;
  paidOut?: number;
  paidIn?: number;
  balance?: string;
}

const PAGE_1_ROWS: Row[] = [
  {
    date: "23 Feb 26",
    paymentType: "",
    details: "BALANCE BROUGHT FORWARD",
    balance: "10000.00",
  },
  {
    date: "24 Feb 26",
    paymentType: "VIS",
    details: "SYNTH GROCERIES LONDON",
    paidOut: 15.5,
  },
  {
    date: "24 Feb 26",
    paymentType: ")))",
    details: "SYNTH CAFE LONDON",
    paidOut: 7.25,
  },
  {
    date: "24 Feb 26",
    paymentType: "BP",
    details: "SYNTH TRANSFER PAYEE",
    paidOut: 50.0,
  },
  {
    date: "25 Feb 26",
    paymentType: "DD",
    details: "SYNTH UTILITY CO",
    paidOut: 100.0,
  },
  {
    date: "26 Feb 26",
    paymentType: "CR",
    details: "SYNTH REFUND SOURCE",
    paidIn: 200.0,
    balance: "10027.25",
  },
];

const PAGE_2_ROWS: Row[] = [
  {
    date: "27 Feb 26",
    paymentType: "VIS",
    details: "SYNTH SHOP LTD",
    paidOut: 30.0,
  },
  {
    date: "28 Feb 26",
    paymentType: "SO",
    details: "SYNTH STANDING ORDER",
    continuation: "TO LANDLORD LTD",
    paidOut: 500.0,
  },
  {
    date: "01 Mar 26",
    paymentType: "VIS",
    details: "SYNTH FINAL MERCHANT",
    paidOut: 12.0,
    balance: "9485.25",
  },
];

const ALL_ROWS = [...PAGE_1_ROWS, ...PAGE_2_ROWS];

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
  doc.text("Details", COLUMNS.detailsX, y, { lineBreak: false });
  drawRightAligned(doc, "Paid out", COLUMNS.paidOutRight, y);
  drawRightAligned(doc, "Paid in", COLUMNS.paidInRight, y);
  drawRightAligned(doc, "Balance", COLUMNS.balanceRight, y);
}

function drawRow(
  doc: PDFKit.PDFDocument,
  row: Row,
  y: number,
): number {
  doc.fontSize(9);
  doc.text(row.date, COLUMNS.dateX, y, { lineBreak: false });
  const details = row.paymentType
    ? `${row.paymentType} ${row.details}`
    : row.details;
  doc.text(details, COLUMNS.detailsX, y, { lineBreak: false });
  if (row.paidOut !== undefined) {
    drawRightAligned(doc, formatAmount(row.paidOut), COLUMNS.paidOutRight, y);
  }
  if (row.paidIn !== undefined) {
    drawRightAligned(doc, formatAmount(row.paidIn), COLUMNS.paidInRight, y);
  }
  if (row.balance) {
    drawRightAligned(doc, row.balance, COLUMNS.balanceRight, y);
  }
  let nextY = y + ROW_HEIGHT;
  if (row.continuation) {
    doc.text(row.continuation, COLUMNS.detailsX, nextY, { lineBreak: false });
    nextY += ROW_HEIGHT;
  }
  return nextY;
}

function drawFooter(doc: PDFKit.PDFDocument, y: number, balance: string): void {
  doc.fontSize(9);
  doc.text("BALANCE CARRIED FORWARD", COLUMNS.detailsX, y, { lineBreak: false });
  drawRightAligned(doc, balance, COLUMNS.balanceRight, y);
}

export function buildSyntheticStatement(): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => {
        const concat = Buffer.concat(chunks);
        // Copy into a standalone ArrayBuffer so it's transferable/cloneable
        // (Node's Buffer pool can't be structured-cloned by pdf.js).
        const ab = new ArrayBuffer(concat.byteLength);
        new Uint8Array(ab).set(concat);
        resolve(new Uint8Array(ab));
      });
      doc.on("error", reject);

      doc.font("Helvetica");

      // Page 1
      doc.fontSize(14).text("Synthetic Bank Statement", 40, 40, {
        lineBreak: false,
      });
      drawHeader(doc, HEADER_Y);
      let y = FIRST_ROW_Y;
      for (const row of PAGE_1_ROWS) {
        y = drawRow(doc, row, y);
      }
      drawFooter(doc, y + 10, "10027.25");

      // Page 2
      doc.addPage();
      doc.fontSize(14).text("Synthetic Bank Statement (cont.)", 40, 40, {
        lineBreak: false,
      });
      drawHeader(doc, HEADER_Y);
      y = FIRST_ROW_Y;
      // Page 2 opens with a BALANCE BROUGHT FORWARD that must be IGNORED
      // by the parser (it already captured page 1's opening line).
      doc.fontSize(9);
      doc.text("BALANCE BROUGHT FORWARD", COLUMNS.detailsX, y, {
        lineBreak: false,
      });
      drawRightAligned(doc, "10027.25", COLUMNS.balanceRight, y);
      y += ROW_HEIGHT;
      for (const row of PAGE_2_ROWS) {
        y = drawRow(doc, row, y);
      }
      drawFooter(doc, y + 10, "9485.25");

      // FSCS trailer — my parser stops here
      doc.fontSize(8);
      doc.text(
        "Further information about the Financial Services Compensation Scheme is available at www.fscs.org.uk",
        40,
        y + 60,
        { lineBreak: true, width: 500 },
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export const SYNTHETIC_GOLDEN: ExpectedRow[] = ALL_ROWS.map((row) => {
  const paidOut = row.paidOut ?? 0;
  const paidIn = row.paidIn ?? 0;
  const continuation = row.continuation ?? "";
  const details =
    row.details === "BALANCE BROUGHT FORWARD"
      ? "BALANCE BROUGHT FORWARD"
      : `${row.details}${continuation ? " " + continuation : ""}`;
  const [day, monShort, yr] = row.date.split(" ");
  const monMap: Record<string, string> = {
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
  return {
    date: row.date,
    isoDate: `20${yr}-${monMap[monShort]}-${day.padStart(2, "0")}`,
    paymentType: row.paymentType,
    details,
    paidOut,
    paidIn,
    balance: row.balance ?? "",
  };
});

export const SYNTHETIC_OPENING_BALANCE = 10000.0;
export const SYNTHETIC_CLOSING_BALANCE = 9485.25;
