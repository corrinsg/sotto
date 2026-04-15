export interface RawTransaction {
  date: string;
  paymentType: string;
  details: string;
  paidOut: string;
  paidIn: string;
  balance: string;
}

export interface Transaction extends RawTransaction {
  id: string;
  isoDate: string;
  amount: number;
  kind: "debit" | "credit";
}

export interface ParsedStatement {
  transactions: Transaction[];
  warnings: string[];
  stats: { pages: number; rawRows: number; source?: "pdf" | "csv" };
}

export interface ParseOptions {
  onProgress?: (pct: number) => void;
}
