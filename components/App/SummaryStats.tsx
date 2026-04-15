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
  const loadedFiles = useAppStore((s) => s.loadedFiles);
  const duplicatesSkipped = useAppStore((s) => s.duplicatesSkipped);
  const summary = useMemo(
    () => computeSummary({ transactions, categoryOverrides, sessionRules }),
    [transactions, categoryOverrides, sessionRules],
  );

  const fileCount = loadedFiles.length;
  const pdfCount = loadedFiles.filter((f) => f.source === "pdf").length;
  const csvCount = fileCount - pdfCount;
  const breakdownParts: string[] = [];
  if (pdfCount > 0) breakdownParts.push(`${pdfCount} PDF${pdfCount === 1 ? "" : "s"}`);
  if (csvCount > 0) breakdownParts.push(`${csvCount} CSV${csvCount === 1 ? "" : "s"}`);
  const breakdown = breakdownParts.join(" · ");

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Total spent
          </div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formatCurrency(summary.totalDebit)}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            across {summary.debitCount} transactions
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Total received
          </div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
            {formatCurrency(summary.totalCredit)}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            across {summary.creditCount} transactions
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Statements analysed
          </div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {fileCount}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {breakdown || "—"}
          </div>
        </div>
      </div>
      {duplicatesSkipped > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 3a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 10 9Z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            <strong className="font-semibold">
              {duplicatesSkipped} duplicate
              {duplicatesSkipped === 1 ? "" : "s"} skipped.
            </strong>{" "}
            Rows with the same date, merchant, payment type, and amount as
            something already loaded were only counted once.
          </span>
        </div>
      )}
    </div>
  );
}
