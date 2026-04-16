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

// Despite the file name this parser is now generic across UK banks with
// text-based PDF statements. It detects column layout dynamically from
// a header-keyword dictionary, so it handles variations in column order,
// labels, and date formats. Originally written against HSBC and still
// covers that format as a special case.

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
  typeX0: number | null;
  typeX1: number | null;
  boundaryOutIn: number;
  boundaryInBal: number;
  headerY: number | null;
}

const DATE_PATTERNS: RegExp[] = [
  // DD MMM YY or DD MMM YYYY  (HSBC "04 May 23", Lloyds "04 May 2023")
  /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}$/i,
  // DD/MM/YY(YY)  (Santander, many others)
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  // DD-MM-YY(YY)
  /^\d{1,2}-\d{1,2}-\d{2,4}$/,
  // DD.MM.YY(YY)
  /^\d{1,2}\.\d{1,2}\.\d{2,4}$/,
  // ISO YYYY-MM-DD
  /^\d{4}-\d{1,2}-\d{1,2}$/,
];

const AMOUNT_RE = /^[\d,]+\.\d{2}$/;

// Payment type prefix codes commonly embedded at the start of the details
// string (HSBC convention). Banks with a dedicated Type column are handled
// separately via column detection.
const PAYMENT_TYPE_RE =
  /^(VIS|BP|CR|DR|DD|CHQ|SO|TFR|\)\)\)|FPI|FPO|BGC|ATM|CPT|DEB|POS|SAL|SBT|SPB)\s*/;

// Single-word type codes that might appear in a separate Type column.
const TYPE_CODE_RE = /^(VIS|BP|CR|DR|DD|CHQ|SO|TFR|FPI|FPO|BGC|ATM|CPT|DEB|POS|SAL|SBT|SPB)$/;

const MONTH_TO_NUMBER: Record<string, string> = {
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

// Header keyword dictionary. Phrases listed most-specific first so that
// "paid in" is tried before a fallback match on "in" alone.
const HEADER_KEYWORDS: Record<
  "date" | "description" | "type" | "debit" | "credit" | "balance",
  string[][]
> = {
  date: [["date"], ["transaction", "date"], ["posting", "date"]],
  description: [
    ["description"],
    ["details"],
    ["transaction", "details"],
    ["reference"],
    ["narrative"],
    ["particulars"],
  ],
  type: [["type"], ["transaction", "type"], ["payment", "type"]],
  debit: [
    ["paid", "out"],
    ["money", "out"],
    ["withdrawal"],
    ["withdrawals"],
    ["debit"],
    ["out", "(£)"],
    ["out"],
  ],
  credit: [
    ["paid", "in"],
    ["money", "in"],
    ["deposit"],
    ["deposits"],
    ["credit"],
    ["in", "(£)"],
    ["in"],
  ],
  balance: [
    ["running", "balance"],
    ["account", "balance"],
    ["balance"],
  ],
};

function findPhraseInLine(
  line: Word[],
  phrase: string[],
): { firstIdx: number; lastIdx: number } | null {
  if (phrase.length === 0 || line.length < phrase.length) return null;
  outer: for (let i = 0; i <= line.length - phrase.length; i++) {
    for (let j = 0; j < phrase.length; j++) {
      if (line[i + j].text.toLowerCase() !== phrase[j]) {
        continue outer;
      }
    }
    return { firstIdx: i, lastIdx: i + phrase.length - 1 };
  }
  return null;
}

interface DetectedCols {
  date?: { x0: number; x1: number };
  description?: { x0: number; x1: number };
  type?: { x0: number; x1: number };
  debit?: { x0: number; x1: number };
  credit?: { x0: number; x1: number };
  balance?: { x0: number; x1: number };
}

function detectColsInLine(line: Word[]): DetectedCols {
  const detected: DetectedCols = {};
  const consumed = new Set<number>();
  const categories = ["debit", "credit", "balance", "description", "type", "date"] as const;
  for (const category of categories) {
    for (const phrase of HEADER_KEYWORDS[category]) {
      const match = findPhraseInLine(line, phrase);
      if (!match) continue;
      if ([...Array(match.lastIdx - match.firstIdx + 1).keys()].some(
        (k) => consumed.has(match.firstIdx + k),
      )) {
        continue;
      }
      detected[category] = {
        x0: line[match.firstIdx].x0,
        x1: line[match.lastIdx].x1,
      };
      for (let k = match.firstIdx; k <= match.lastIdx; k++) consumed.add(k);
      break;
    }
  }
  return detected;
}

function scoreHeader(cols: DetectedCols): number {
  let s = 0;
  if (cols.debit) s += 2;
  if (cols.credit) s += 2;
  if (cols.balance) s += 2;
  if (cols.date) s += 1;
  if (cols.description) s += 1;
  if (cols.type) s += 1;
  return s;
}

function detectColumns(lines: Word[][]): ColumnLayout {
  let bestScore = 0;
  let bestCols: DetectedCols = {};
  let bestLine: Word[] | null = null;

  for (const line of lines) {
    const cols = detectColsInLine(line);
    const score = scoreHeader(cols);
    if (score > bestScore) {
      bestScore = score;
      bestCols = cols;
      bestLine = line;
    }
  }

  // Fallback hardcoded defaults if we couldn't find a decent header.
  // Keeps the legacy HSBC behaviour for any weird statement that doesn't
  // expose an obvious table header in its text layer.
  if (bestScore < 3 || !bestLine) {
    const paidOutRight = 480;
    const paidInRight = 620;
    const balanceRight = 740;
    return {
      paidOutRight,
      paidInRight,
      balanceRight,
      detailsX: 120,
      typeX0: null,
      typeX1: null,
      boundaryOutIn: (paidOutRight + paidInRight) / 2,
      boundaryInBal: (paidInRight + balanceRight) / 2,
      headerY: null,
      };
  }

  const paidOutRight = bestCols.debit?.x1 ?? 480;
  const paidInRight =
    bestCols.credit?.x1 ??
    (bestCols.debit ? paidOutRight + 140 : 620);
  const balanceRight = bestCols.balance?.x1 ?? paidInRight + 120;
  const detailsX = bestCols.description?.x0 ?? 120;
  const typeX0 = bestCols.type?.x0 ?? null;
  const typeX1 = bestCols.type?.x1 ?? null;
  const headerY = bestLine[bestLine.length - 1].top;

  return {
    paidOutRight,
    paidInRight,
    balanceRight,
    detailsX,
    typeX0,
    typeX1,
    boundaryOutIn: (paidOutRight + paidInRight) / 2,
    boundaryInBal: (paidInRight + balanceRight) / 2,
    headerY,
  };
}

function looksLikeDate(s: string): boolean {
  return DATE_PATTERNS.some((re) => re.test(s));
}

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
    if (text === "Authorised" || text === "authorised") {
      const next = words[i + 1]?.text?.toLowerCase();
      if (next === "and" || next === "by") return i;
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
    // Split the line into date-region words, type-column words, and
    // other words based on the detected column x-positions.
    const dateRegionRight = cols.detailsX - 20;
    const dateWordsInLine: Word[] = [];
    const typeWordsInLine: Word[] = [];
    const otherWords: Word[] = [];

    for (const w of line) {
      const inTypeCol =
        cols.typeX0 !== null &&
        cols.typeX1 !== null &&
        w.x0 >= cols.typeX0 - 5 &&
        w.x1 <= cols.typeX1 + 10;
      if (w.x0 < dateRegionRight) {
        dateWordsInLine.push(w);
      } else if (inTypeCol && TYPE_CODE_RE.test(w.text)) {
        typeWordsInLine.push(w);
      } else {
        otherWords.push(w);
      }
    }

    let hasDate = false;
    let dateStr = "";
    if (dateWordsInLine.length > 0) {
      const potential = dateWordsInLine
        .map((w) => w.text)
        .join(" ")
        .trim();
      if (looksLikeDate(potential)) {
        hasDate = true;
        dateStr = potential;
      } else if (dateWordsInLine.length === 1 && looksLikeDate(dateWordsInLine[0].text)) {
        hasDate = true;
        dateStr = dateWordsInLine[0].text;
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

    // Assign each amount to the column whose right edge is closest.
    // Using nearest-neighbour instead of a left-to-right boundary lets
    // us handle banks that put credit before debit (Lloyds) or any
    // other non-HSBC ordering.
    for (const w of wordsToCheck) {
      if (AMOUNT_RE.test(w.text)) {
        const right = w.x1;
        const dOut = Math.abs(right - cols.paidOutRight);
        const dIn = Math.abs(right - cols.paidInRight);
        const dBal = Math.abs(right - cols.balanceRight);
        const min = Math.min(dOut, dIn, dBal);
        if (min === dOut) paidOutVal = w.text;
        else if (min === dIn) paidInVal = w.text;
        else balanceVal = w.text;
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

    // Payment type: prefer the dedicated Type column when the header had
    // one and we found a code in that column. Otherwise fall back to the
    // embedded-prefix convention that HSBC uses.
    let paymentType = "";
    if (typeWordsInLine.length > 0) {
      paymentType = typeWordsInLine[0].text;
    } else {
      const m = detailText.match(PAYMENT_TYPE_RE);
      if (m) {
        paymentType = m[1];
        detailText = detailText.slice(m[0].length).trim();
      }
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
  const trimmed = date.trim();
  if (!trimmed) return "";

  // DD MMM YY / DD MMM YYYY
  let m =
    /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})$/i.exec(
      trimmed,
    );
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = MONTH_TO_NUMBER[m[2].toLowerCase()] ?? "00";
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YY(YY) or DD-MM-YY(YY) or DD.MM.YY(YY)
  m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/.exec(trimmed);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }

  return "";
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

export async function parseStatementPdf(
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
    stats: { pages, rawRows: state.transactions.length, source: "pdf" },
  };
}
