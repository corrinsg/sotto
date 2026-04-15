"use client";

import { useMemo } from "react";
import { useAppStore, computeTotalsByCategory } from "@/lib/state/appStore";

const COLORS: Record<string, string> = {
  Groceries: "#0f172a",
  "Dining Out": "#1f2937",
  Transport: "#334155",
  Car: "#7c2d12",
  Utilities: "#475569",
  Insurance: "#3f3f46",
  "Rent/Mortgage": "#0f172a",
  Home: "#44403c",
  Kids: "#5b21b6",
  Pet: "#92400e",
  Shopping: "#1f2937",
  Entertainment: "#334155",
  Health: "#475569",
  Travel: "#0f172a",
  Subscriptions: "#1f2937",
  Cash: "#57534e",
  Income: "#065f46",
  Other: "#52525b",
  Uncategorized: "#a1a1aa",
};

function formatGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatGBPPrecise(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function CategoryChart() {
  const transactions = useAppStore((s) => s.transactions);
  const categoryOverrides = useAppStore((s) => s.categoryOverrides);
  const sessionRules = useAppStore((s) => s.sessionRules);
  const totals = useMemo(
    () =>
      computeTotalsByCategory({
        transactions,
        categoryOverrides,
        sessionRules,
      }),
    [transactions, categoryOverrides, sessionRules],
  );

  if (totals.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
        No spend to show.
      </div>
    );
  }

  const maxTotal = Math.max(...totals.map((t) => t.total));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold text-zinc-900">
        Spend by category
      </h2>
      <div className="space-y-3">
        {totals.map((entry) => {
          const pct = maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0;
          const color = COLORS[entry.category] ?? "#52525b";
          return (
            <div key={entry.category}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <div className="font-medium text-zinc-900">
                  {entry.category}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-zinc-900">
                    {formatGBPPrecise(entry.total)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    ({entry.count})
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                  aria-label={`${entry.category}: ${formatGBP(entry.total)} across ${entry.count} transactions`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
