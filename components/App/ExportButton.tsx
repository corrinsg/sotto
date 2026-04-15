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
        escapeCsv(category ?? "Uncategorized"),
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sotto-categorized.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      Export categorized CSV
    </button>
  );
}
