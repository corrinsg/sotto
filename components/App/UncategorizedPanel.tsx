"use client";

import { useMemo, useState } from "react";
import { useAppStore, computeUncategorized } from "@/lib/state/appStore";
import { CATEGORY_GROUPS, type Category } from "@/lib/categorize/types";
import { extractMerchantToken } from "@/lib/categorize/categorize";

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function UncategorizedPanel() {
  const transactions = useAppStore((s) => s.transactions);
  const categoryOverrides = useAppStore((s) => s.categoryOverrides);
  const sessionRules = useAppStore((s) => s.sessionRules);
  const assignCategory = useAppStore((s) => s.assignCategory);
  const addSessionRule = useAppStore((s) => s.addSessionRule);
  const [applyToAll, setApplyToAll] = useState<Record<string, boolean>>({});

  const sorted = useMemo(() => {
    const unc = computeUncategorized({
      transactions,
      categoryOverrides,
      sessionRules,
    });
    return unc.sort(
      (a, b) => Math.abs(b.tx.amount) - Math.abs(a.tx.amount),
    );
  }, [transactions, categoryOverrides, sessionRules]);

  const handleAssign = (
    txId: string,
    merchantToken: string,
    category: Category,
  ) => {
    assignCategory(txId, category);
    if (applyToAll[txId] !== false && merchantToken) {
      addSessionRule({
        match: merchantToken,
        category,
        priority: 100,
      });
    }
  };

  const handleSkipAll = () => {
    for (const c of sorted) {
      assignCategory(c.tx.id, "Other");
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-6 text-center shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:shadow-none">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
          All transactions categorised.
        </div>
        <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
          Your spend breakdown is complete.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Uncategorised ({sorted.length})
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Tag the ones that matter — sorted by amount.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSkipAll}
          className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Skip all as Other
        </button>
      </div>
      <div className="space-y-3">
        {sorted.map(({ tx }) => {
          const merchantToken = extractMerchantToken(tx.details);
          const isDebit = tx.kind === "debit";
          return (
            <div
              key={tx.id}
              className="rounded-xl border border-zinc-200/60 bg-zinc-50/60 p-3.5 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div
                  className={`text-sm font-semibold tabular-nums ${
                    isDebit
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {isDebit ? "−" : "+"}
                  {formatGBP(tx.amount)}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {tx.date} · {tx.paymentType || "—"}
                </div>
              </div>
              <div className="mt-1 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
                {tx.details}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <select
                  defaultValue=""
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none dark:focus:border-emerald-500"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssign(
                        tx.id,
                        merchantToken,
                        e.target.value as Category,
                      );
                    }
                  }}
                >
                  <option value="" disabled>
                    Assign category…
                  </option>
                  {CATEGORY_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {merchantToken && (
                  <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500/30 dark:border-zinc-600 dark:bg-zinc-800"
                      checked={applyToAll[tx.id] !== false}
                      onChange={(e) =>
                        setApplyToAll((prev) => ({
                          ...prev,
                          [tx.id]: e.target.checked,
                        }))
                      }
                    />
                    Apply to all matching &ldquo;{merchantToken}&rdquo;
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
