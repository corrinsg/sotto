import * as pdfjsLib from "pdfjs-dist";
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  TextContent,
  TextItem,
} from "pdfjs-dist/types/src/display/api";
import type {
  ParsedStatement,
  ParseOptions,
  RawTransaction,
  Transaction,
} from "./types";

interface Word {
  text: string;
  x0: number;
  x1: number;
  top: number;
  bottom: number;
}

interface ColumnLayout {
  paidOutRight: number;
  paidInRight: number;
  balanceRight: number;
  detailsX: number;
  boundaryOutIn: number;
  boundaryInBal: number;
  headerY: number | null;
}

const DATE_RE =
  /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}$/;
const AMOUNT_RE = /^[\d,]+\.\d{2}$/;
const PAYMENT_TYPE_RE =
  /^(VIS|BP|CR|DD|CHQ|SO|TFR|\)\)\)|FPI|FPO|BGC|ATM)\s*/;

const MONTH_TO_NUMBER: Record<string, string> = {
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

const MERGED_FOOTER_RE = /^BALANCECARRIEDFORWARD$/i;

function findFooterStart(words: Word[]): number {
  for (let i = 0; i < words.length; i++) {
    const text = words[i].text;
    if (MERGED_FOOTER_RE.test(text)) return i;
    if (text === "Centenary") return i;
    if (text === "Birmingham") return i;
    if (text === "FSCS") return i;
    if (text === "BALANCE" || text === "Balance") {
      const next = words[i + 1]?.text;
      if (next === "CARRIED" || next === "Carried") return i;
    }
    if (text === "Financial") {
      const next = words[i + 1]?.text;
      if (next === "Services") return i;
    }
  }
  return -1;
}

function extractWords(
  textContent: TextContent,
  pageHeight: number,
): Word[] {
  const words: Word[] = [];
  const wordRe = /\S+/g;
  for (const item of textContent.items) {
    if (!("str" in item)) continue;
    const textItem = item as TextItem;
    const str = textItem.str;
    if (!str || str.trim() === "") continue;

    const itemX = textItem.transform[4];
    const itemY = textItem.transform[5];
    const width = textItem.width;
    const height = textItem.height || 10;

    const top = pageHeight - itemY - height;
    const bottom = pageHeight - itemY;

    const totalChars = str.length;
    const tokens: { text: string; start: number; end: number }[] = [];
    let m: RegExpExecArray | null;
    wordRe.lastIndex = 0;
    while ((m = wordRe.exec(str)) !== null) {
      tokens.push({
        text: m[0],
        start: m.index,
        end: m.index + m[0].length,
      });
    }
    if (tokens.length === 0) continue;

    if (tokens.length === 1) {
      words.push({
        text: tokens[0].text,
        x0: itemX,
        x1: itemX + width,
        top,
        bottom,
      });
      continue;
    }

    for (const tok of tokens) {
      const fracStart = totalChars > 0 ? tok.start / totalChars : 0;
      const fracEnd = totalChars > 0 ? tok.end / totalChars : 1;
      words.push({
        text: tok.text,
        x0: itemX + width * fracStart,
        x1: itemX + width * fracEnd,
        top,
        bottom,
      });
    }
  }
  return words;
}

function groupIntoLines(words: Word[], yTolerance = 5): Word[][] {
  const sorted = [...words].sort((a, b) => {
    const aY = Math.round(a.top * 10) / 10;
    const bY = Math.round(b.top * 10) / 10;
    if (aY !== bY) return aY - bY;
    return a.x0 - b.x0;
  });

  const lines: Word[][] = [];
  let current: Word[] = [];
  let currentY: number | null = null;

  for (const w of sorted) {
    const y = Math.round(w.top * 10) / 10;
    if (currentY === null || Math.abs(y - currentY) < yTolerance) {
      current.push(w);
      if (currentY === null) currentY = y;
    } else {
      if (current.length > 0) lines.push(current);
      current = [w];
      currentY = y;
    }
  }
  if (current.length > 0) lines.push(current);

  for (const line of lines) {
    line.sort((a, b) => a.x0 - b.x0);
  }

  return lines;
}

function detectColumns(lines: Word[][]): ColumnLayout {
  let headerLine: Word[] | null = null;
  for (const line of lines) {
    const text = line.map((w) => w.text).join(" ");
    if (
      text.includes("Paid out") ||
      text.toLowerCase().includes("paid out")
    ) {
      headerLine = line;
      break;
    }
  }

  let paidOutRight: number;
  let paidInRight: number;
  let balanceRight: number;
  const detailsX = 120;

  if (!headerLine) {
    paidOutRight = 480;
    paidInRight = 620;
    balanceRight = 740;
    return {
      paidOutRight,
      paidInRight,
      balanceRight,
      detailsX,
      boundaryOutIn: (paidOutRight + paidInRight) / 2,
      boundaryInBal: (paidInRight + balanceRight) / 2,
      headerY: null,
    };
  }

  const paidWords = headerLine.filter(
    (w) => w.text.toLowerCase() === "paid",
  );
  const outWords = headerLine.filter((w) => w.text.toLowerCase() === "out");
  const inWords = headerLine.filter((w) => w.text.toLowerCase() === "in");
  const balanceWords = headerLine.filter(
    (w) => w.text.toLowerCase() === "balance",
  );

  if (outWords.length > 0 && inWords.length > 0) {
    paidOutRight = outWords[0].x1;
    paidInRight = inWords[0].x1;
  } else if (paidWords.length >= 2) {
    paidOutRight = paidWords[0].x1;
    paidInRight = paidWords[1].x1;
  } else if (paidWords.length === 1) {
    paidOutRight = paidWords[0].x1;
    paidInRight = paidOutRight + 140;
  } else {
    paidOutRight = 480;
    paidInRight = 620;
  }

  balanceRight =
    balanceWords.length > 0 ? balanceWords[0].x1 : paidInRight + 120;

  const headerY = headerLine[headerLine.length - 1].top;

  return {
    paidOutRight,
    paidInRight,
    balanceRight,
    detailsX,
    boundaryOutIn: (paidOutRight + paidInRight) / 2,
    boundaryInBal: (paidInRight + balanceRight) / 2,
    headerY,
  };
}

function stripFooterWords(line: Word[]): Word[] {
  const idx = findFooterStart(line);
  if (idx === -1) return line;
  return line.slice(0, idx);
}

function isFscsLine(line: Word[]): boolean {
  for (const w of line) {
    if (w.text === "FSCS") return true;
    if (w.text === "Financial") return true;
    if (w.text === "Compensation") return true;
  }
  return false;
}

interface ParserState {
  transactions: RawTransaction[];
  current: RawTransaction | null;
  reachedFscs: boolean;
}

function makeParserState(): ParserState {
  return { transactions: [], current: null, reachedFscs: false };
}

function parseDataLines(
  lines: Word[][],
  cols: ColumnLayout,
  state: ParserState,
): void {
  for (const rawLine of lines) {
    if (state.reachedFscs) break;
    if (isFscsLine(rawLine)) {
      if (state.current) {
        state.transactions.push(state.current);
        state.current = null;
      }
      state.reachedFscs = true;
      break;
    }

    const stripped = stripFooterWords(rawLine);
    if (stripped.length === 0) {
      if (state.current) {
        state.transactions.push(state.current);
        state.current = null;
      }
      continue;
    }
    processLine(stripped);
  }

  function processLine(line: Word[]): void {
    const dateWordsInLine: Word[] = [];
    const otherWords: Word[] = [];
    for (const w of line) {
      if (w.x0 < cols.detailsX - 20) {
        dateWordsInLine.push(w);
      } else {
        otherWords.push(w);
      }
    }

    let hasDate = false;
    let dateStr = "";
    if (dateWordsInLine.length > 0) {
      const potential = dateWordsInLine.map((w) => w.text).join(" ");
      if (DATE_RE.test(potential)) {
        hasDate = true;
        dateStr = potential;
      }
    }

    const wordsToCheck = hasDate
      ? otherWords
      : dateWordsInLine.length > 0
        ? otherWords
        : line;

    const detailWords: string[] = [];
    let paidOutVal = "";
    let paidInVal = "";
    let balanceVal = "";

    for (const w of wordsToCheck) {
      if (AMOUNT_RE.test(w.text)) {
        const right = w.x1;
        if (right < cols.boundaryOutIn) {
          paidOutVal = w.text;
        } else if (right < cols.boundaryInBal) {
          paidInVal = w.text;
        } else {
          balanceVal = w.text;
        }
      } else {
        detailWords.push(w.text);
      }
    }

    let detailText = detailWords.join(" ").trim();
    detailText = detailText.replace(/\s+/g, " ");

    const isBroughtForward = /BALANCE\s*BROUGHT\s*FORWARD/i.test(detailText);
    if (isBroughtForward) {
      if (state.transactions.length === 0) {
        if (state.current) state.transactions.push(state.current);
        state.transactions.push({
          date: dateStr,
          paymentType: "",
          details: "BALANCE BROUGHT FORWARD",
          paidOut: "",
          paidIn: "",
          balance: balanceVal,
        });
        state.current = null;
      }
      return;
    }

    let paymentType = "";
    const m = detailText.match(PAYMENT_TYPE_RE);
    if (m) {
      paymentType = m[1];
      detailText = detailText.slice(m[0].length).trim();
    }

    if (hasDate || paymentType) {
      if (!detailText && !paidOutVal && !paidInVal && !balanceVal) {
        return;
      }
      if (state.current) state.transactions.push(state.current);
      state.current = {
        date: hasDate ? dateStr : "",
        paymentType,
        details: detailText,
        paidOut: paidOutVal,
        paidIn: paidInVal,
        balance: balanceVal,
      };
    } else if (state.current !== null) {
      if (detailText) {
        state.current.details =
          state.current.details.length > 0
            ? `${state.current.details} ${detailText}`
            : detailText;
      }
      if (paidOutVal) state.current.paidOut = paidOutVal;
      if (paidInVal) state.current.paidIn = paidInVal;
      if (balanceVal) state.current.balance = balanceVal;
    }
  }
}

function forwardFillDates(txns: RawTransaction[]): void {
  let lastDate = "";
  for (const t of txns) {
    if (t.date) {
      lastDate = t.date;
    } else {
      t.date = lastDate;
    }
  }
}

function toIsoDate(date: string): string {
  const m = date.match(/^(\d{1,2})\s+(\w{3})\s+(\d{2})$/);
  if (!m) return "";
  const day = m[1].padStart(2, "0");
  const month = MONTH_TO_NUMBER[m[2]] ?? "00";
  const year = `20${m[3]}`;
  return `${year}-${month}-${day}`;
}

function parseAmount(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/,/g, ""));
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

function normalize(raw: RawTransaction[]): Transaction[] {
  const result: Transaction[] = [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    const paidOut = parseAmount(r.paidOut);
    const paidIn = parseAmount(r.paidIn);
    let amount: number;
    let kind: "debit" | "credit";
    if (paidOut > 0) {
      amount = -paidOut;
      kind = "debit";
    } else {
      amount = paidIn;
      kind = "credit";
    }

    const cleaned: RawTransaction = {
      ...r,
      details: r.details.replace(/\s+\.$/, "").replace(/\s+/g, " ").trim(),
    };

    result.push({
      ...cleaned,
      id: stableId(cleaned.date, cleaned.details, amount, i),
      isoDate: toIsoDate(cleaned.date),
      amount,
      kind,
    });
  }
  return result;
}

function toUint8(input: ArrayBuffer | Uint8Array): Uint8Array {
  if (input instanceof Uint8Array) return input;
  return new Uint8Array(input);
}

async function toUint8FromInput(
  input: ArrayBuffer | Uint8Array | File | Blob,
): Promise<Uint8Array> {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  const buffer = await (input as Blob).arrayBuffer();
  return new Uint8Array(buffer);
}

async function parsePage(
  page: PDFPageProxy,
  state: ParserState,
): Promise<void> {
  const viewport = page.getViewport({ scale: 1 });
  const pageHeight = viewport.height;
  const textContent = await page.getTextContent();
  const words = extractWords(textContent, pageHeight);
  if (words.length === 0) return;

  const lines = groupIntoLines(words, 5);
  const cols = detectColumns(lines);

  const headerY = cols.headerY ?? 0;
  const dataLines = lines.filter((line) => line[0].top > headerY + 5);

  parseDataLines(dataLines, cols, state);
}

export async function parseHsbcStatement(
  input: ArrayBuffer | Uint8Array | File | Blob,
  opts?: ParseOptions,
): Promise<ParsedStatement> {
  const data = await toUint8FromInput(input);
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: false,
    isEvalSupported: false,
  });

  let pdf: PDFDocumentProxy | null = null;
  const warnings: string[] = [];
  const state = makeParserState();
  let pages = 0;

  try {
    pdf = await loadingTask.promise;
    pages = pdf.numPages;
    opts?.onProgress?.(0);

    for (let p = 1; p <= pages; p++) {
      const page = await pdf.getPage(p);
      try {
        await parsePage(page, state);
      } finally {
        page.cleanup();
      }
      opts?.onProgress?.(Math.round((p / pages) * 100));
    }
  } finally {
    if (pdf) await pdf.destroy();
  }

  if (state.current) {
    state.transactions.push(state.current);
    state.current = null;
  }

  forwardFillDates(state.transactions);
  const transactions = normalize(state.transactions);

  return {
    transactions,
    warnings,
    stats: { pages, rawRows: state.transactions.length },
  };
}
