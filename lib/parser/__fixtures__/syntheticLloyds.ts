// Synthetic fixture mimicking a Lloyds "Classic statement" layout:
//   Date | Description | Type | In (£) | Out (£) | Balance (£)
// Dates in "DD MMM YY" format, payment types as 3-letter codes in a
// dedicated column. Used to exercise the generic column detector on a
// bank layout that differs from HSBC (order of debit/credit reversed,
// separate Type column instead of embedded prefix).

import PDFDocument from "pdfkit";

export interface ExpectedLloydsRow {
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
  descriptionX: 120,
  typeX: 320,
  inRight: 410,
  outRight: 480,
  balanceRight: 560,
};

const HEADER_Y = 110;
const FIRST_ROW_Y = 140;
const ROW_HEIGHT = 18;

interface Row {
  date: string;
  type: string;
  details: string;
  paidIn?: number;
  paidOut?: number;
  balance?: string;
}

const ROWS: Row[] = [
  {
    date: "04 May 23",
    type: "CPT",
    details: "LNK COOPERATIVE SW CD 4821",
    paidOut: 300.0,
  },
  {
    date: "09 May 23",
    type: "TFR",
    details: "P ADAMCZUK KASA 7420",
    paidIn: 50.0,
    balance: "923.56",
  },
  {
    date: "11 May 23",
    type: "DEB",
    details: "BARCLAYCARD CD 7420",
    paidOut: 2.5,
  },
  {
    date: "15 May 23",
    type: "DEB",
    details: "WESTERN VILLA CD 7420",
    paidOut: 240.0,
  },
  {
    date: "16 May 23",
    type: "DEB",
    details: "WINELEAF CD 7420",
    paidOut: 26.69,
    balance: "654.37",
  },
  {
    date: "17 May 23",
    type: "CPT",
    details: "LNK COOPERATIVE SW CD 7420",
    paidOut: 200.0,
  },
  {
    date: "19 May 23",
    type: "DD",
    details: "LV LIFE 0359229101SW",
    paidOut: 33.03,
    balance: "421.34",
  },
  {
    date: "22 May 23",
    type: "DEB",
    details: "PARK FOOD AND WINE 7420",
    paidOut: 30.46,
    balance: "390.88",
  },
  {
    date: "25 May 23",
    type: "CPT",
    details: "LNK COOPERATIVE SW CD 7420",
    paidOut: 200.0,
    balance: "170.88",
  },
  {
    date: "26 May 23",
    type: "DEB",
    details: "UBER *TRIP L3SAM",
    paidOut: 17.43,
    balance: "153.45",
  },
  {
    date: "29 May 23",
    type: "DEB",
    details: "D ROBERTSON",
    paidOut: 860.0,
    balance: "1113.45",
  },
  {
    date: "03 May 23",
    type: "DEB",
    details: "WINELEAF CD 7420",
    paidOut: 17.0,
    balance: "1096.45",
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
  doc.text("Type", COLUMNS.typeX, y, { lineBreak: false });
  drawRightAligned(doc, "In (£)", COLUMNS.inRight, y);
  drawRightAligned(doc, "Out (£)", COLUMNS.outRight, y);
  drawRightAligned(doc, "Balance (£)", COLUMNS.balanceRight, y);
}

function drawRow(doc: PDFKit.PDFDocument, row: Row, y: number): void {
  doc.fontSize(9);
  doc.text(row.date, COLUMNS.dateX, y, { lineBreak: false });
  doc.text(row.details, COLUMNS.descriptionX, y, { lineBreak: false });
  doc.text(row.type, COLUMNS.typeX, y, { lineBreak: false });
  if (row.paidIn !== undefined) {
    drawRightAligned(doc, formatAmount(row.paidIn), COLUMNS.inRight, y);
  }
  if (row.paidOut !== undefined) {
    drawRightAligned(doc, formatAmount(row.paidOut), COLUMNS.outRight, y);
  }
  if (row.balance) {
    drawRightAligned(doc, row.balance, COLUMNS.balanceRight, y);
  }
}

export function buildSyntheticLloydsStatement(): Promise<Uint8Array> {
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

      doc.fontSize(14).text("Lloyds-style Classic statement", 40, 40, {
        lineBreak: false,
      });
      drawHeader(doc, HEADER_Y);
      let y = FIRST_ROW_Y;
      for (const row of ROWS) {
        drawRow(doc, row, y);
        y += ROW_HEIGHT;
      }

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

export const SYNTHETIC_LLOYDS_GOLDEN: ExpectedLloydsRow[] = ROWS.map((row) => {
  const [day, monShort, yr] = row.date.split(" ");
  return {
    date: row.date,
    isoDate: `20${yr}-${MONTH[monShort]}-${day.padStart(2, "0")}`,
    paymentType: row.type,
    details: row.details,
    paidOut: row.paidOut ?? 0,
    paidIn: row.paidIn ?? 0,
    balance: row.balance ?? "",
  };
});
