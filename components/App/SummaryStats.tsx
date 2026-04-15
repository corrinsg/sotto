"use client";

import { useMemo } from "react";
import { useAppStore, computeSummary } from "@/lib/state/appStore";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function SummaryStats() {
  const transactions = useAppStore((s) => s.transactions);
  const categoryOverrides = useAppStore((s) => s.categoryOverrides);
  const sessionRules = useAppStore((s) => s.sessionRules);
  const stats = useAppStore((s) => s.stats);
  const summary = useMemo(
    () => computeSummary({ transactions, categoryOverrides, sessionRules }),
    [transactions, categoryOverrides, sessionRules],
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Total spent
        </div>
        <div className="mt-1 text-2xl font-semibold text-zinc-900">
          {formatCurrency(summary.totalDebit)}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {summary.debitCount} transactions
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Total received
        </div>
        <div className="mt-1 text-2xl font-semibold text-zinc-900">
          {formatCurrency(summary.totalCredit)}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {summary.creditCount} transactions
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {stats?.source === "csv" ? "Rows parsed" : "Pages parsed"}
        </div>
        <div className="mt-1 text-2xl font-semibold text-zinc-900">
          {stats?.source === "csv"
            ? (stats?.rawRows ?? 0)
            : (stats?.pages ?? 0)}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {stats?.source === "csv"
            ? "from your CSV"
            : `${stats?.rawRows ?? 0} rows`}
        </div>
      </div>
    </div>
  );
}
