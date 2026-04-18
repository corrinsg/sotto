"use client";

import { useMemo } from "react";
import { useAppStore, computeTotalsByCategory } from "@/lib/state/appStore";
import type { CategoryTotal } from "@/lib/state/appStore";

const COLORS: Record<string, string> = {
  Groceries: "#10b981",
  "Dining Out": "#f97316",
  Transport: "#0ea5e9",
  Car: "#64748b",
  Utilities: "#06b6d4",
  Insurance: "#6366f1",
  "Rent/Mortgage": "#3f3f46",
  Home: "#d97706",
  Kids: "#c026d3",
  Pet: "#b45309",
  Shopping: "#f43f5e",
  Entertainment: "#8b5cf6",
  "Health & Fitness": "#14b8a6",
  Travel: "#3b82f6",
  Subscriptions: "#a855f7",
  Cash: "#78716c",
  Income: "#059669",
  Other: "#a1a1aa",
  Uncategorised: "#d4d4d8",
  Others: "#a1a1aa",
};

const OTHERS_COLOR = "#a1a1aa";

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

interface DonutSlice {
  label: string;
  value: number;
  color: string;
  count: number;
}

function buildDonutSlices(totals: CategoryTotal[]): DonutSlice[] {
  if (totals.length <= 6) {
    return totals.map((t) => ({
      label: t.category,
      value: t.total,
      color: COLORS[t.category] ?? "#78716c",
      count: t.count,
    }));
  }
  const top5 = totals.slice(0, 5);
  const rest = totals.slice(5);
  const slices: DonutSlice[] = top5.map((t) => ({
    label: t.category,
    value: t.total,
    color: COLORS[t.category] ?? "#78716c",
    count: t.count,
  }));
  slices.push({
    label: `Others (${rest.length})`,
    value: rest.reduce((s, r) => s + r.total, 0),
    color: OTHERS_COLOR,
    count: rest.reduce((s, r) => s + r.count, 0),
  });
  return slices;
}

function Donut({
  slices,
  total,
  size = 220,
}: {
  slices: DonutSlice[];
  total: number;
  size?: number;
}) {
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const sliceTotal = slices.reduce((s, x) => s + x.value, 0);
  const drawableSlices = slices.filter((s) => s.value > 0);

  // Render each slice as its own SVG arc path so slice boundaries meet
  // at exactly the same point on both sides. The previous implementation
  // used full circles with stroke-dasharray tricks which left a visible
  // seam at the last-slice → first-slice wrap-around (most noticeable
  // between Uncategorised and Others when one was biggest and the other
  // last).
  let accumulated = 0;
  const fullCircle = drawableSlices.length === 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Donut chart of ${slices.length} category slices`}
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        className="stroke-zinc-100 dark:stroke-zinc-800"
        strokeWidth={strokeWidth}
      />
      {drawableSlices.map((s) => {
        if (sliceTotal === 0) return null;
        // Single-slice edge case: one slice covering 100% degenerates to
        // a zero-length arc path, so render as a full circle instead.
        if (fullCircle) {
          return (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
            />
          );
        }
        const startFrac = accumulated / sliceTotal;
        const endFrac = (accumulated + s.value) / sliceTotal;
        accumulated += s.value;
        const startAngle = 2 * Math.PI * startFrac - Math.PI / 2;
        const endAngle = 2 * Math.PI * endFrac - Math.PI / 2;
        const sx = cx + radius * Math.cos(startAngle);
        const sy = cy + radius * Math.sin(startAngle);
        const ex = cx + radius * Math.cos(endAngle);
        const ey = cy + radius * Math.sin(endAngle);
        const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
        const d = `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey}`;
        return (
          <path
            key={s.label}
            d={d}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        );
      })}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        className="fill-zinc-500 text-[11px] font-medium uppercase tracking-wide dark:fill-zinc-400"
      >
        Total spend
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        className="fill-zinc-900 text-xl font-semibold dark:fill-zinc-100"
      >
        {formatGBP(total)}
      </text>
    </svg>
  );
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
      <div className="rounded-2xl border border-zinc-200/60 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-400 dark:shadow-none">
        No spend to show.
      </div>
    );
  }

  const maxTotal = Math.max(...totals.map((t) => t.total));
  const overallTotal = totals.reduce((s, t) => s + t.total, 0);
  const donutSlices = buildDonutSlices(totals);

  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Spend by category
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {totals.length} categor{totals.length === 1 ? "y" : "ies"}
        </span>
      </div>

      <div className="mb-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <Donut slices={donutSlices} total={overallTotal} />
        <div className="w-full max-w-xs space-y-2">
          {donutSlices.map((s) => {
            const pct =
              overallTotal > 0
                ? ((s.value / overallTotal) * 100).toFixed(0)
                : "0";
            return (
              <div
                key={s.label}
                className="flex items-center gap-2.5 text-sm"
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                  aria-hidden
                />
                <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                  {s.label}
                </span>
                <span className="ml-auto flex items-baseline gap-1.5 tabular-nums">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {pct}%
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatGBPPrecise(s.value)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-zinc-200/60 pt-6 dark:border-zinc-800/60">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Full breakdown
          </h3>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            sorted by amount
          </span>
        </div>
        <div className="space-y-4">
          {totals.map((entry) => {
            const pct = maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0;
            const color = COLORS[entry.category] ?? "#78716c";
            return (
              <div key={entry.category}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {entry.category}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatGBPPrecise(entry.total)}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      ({entry.count})
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
    </div>
  );
}
