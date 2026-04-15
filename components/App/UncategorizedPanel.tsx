"use client";

import { useMemo, useState } from "react";
import { useAppStore, computeUncategorized } from "@/lib/state/appStore";
import { CATEGORIES, type Category } from "@/lib/categorize/types";
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
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="text-sm font-medium text-green-900">
          All transactions categorized.
        </div>
        <div className="mt-1 text-xs text-green-700">
          Your spend breakdown is complete.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Uncategorized ({sorted.length})
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Tag the ones that matter — sorted by amount.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSkipAll}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
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
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div
                  className={`text-sm font-semibold ${isDebit ? "text-zinc-900" : "text-emerald-700"}`}
                >
                  {isDebit ? "−" : "+"}
                  {formatGBP(tx.amount)}
                </div>
                <div className="text-xs text-zinc-500">
                  {tx.date} · {tx.paymentType || "—"}
                </div>
              </div>
              <div className="mt-1 line-clamp-2 text-sm text-zinc-700">
                {tx.details}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <select
                  defaultValue=""
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
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
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {merchantToken && (
                  <label className="flex items-center gap-2 text-xs text-zinc-600">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300"
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
