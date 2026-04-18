"use client";

import { useMemo } from "react";
import { useAppStore, computeCategorized } from "@/lib/state/appStore";

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExportButton() {
  const transactions = useAppStore((s) => s.transactions);
  const categoryOverrides = useAppStore((s) => s.categoryOverrides);
  const sessionRules = useAppStore((s) => s.sessionRules);
  const categorized = useMemo(
    () => computeCategorized({ transactions, categoryOverrides, sessionRules }),
    [transactions, categoryOverrides, sessionRules],
  );

  const handleExport = () => {
    const header = [
      "date",
      "payment_type",
      "details",
      "amount",
      "kind",
      "category",
    ].join(",");
    const rows = categorized.map(({ tx, category }) =>
      [
        escapeCsv(tx.isoDate || tx.date),
        escapeCsv(tx.paymentType),
        escapeCsv(tx.details),
        tx.amount.toFixed(2),
        tx.kind,
        escapeCsv(category ?? "Uncategorised"),
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sotto-categorised.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      aria-label="Export categorised transactions as CSV"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 sm:px-4 sm:py-2 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden
      >
        <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
        <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  );
}
