"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/state/appStore";
import { FileDropzone } from "@/components/App/FileDropzone";
import { ParseProgress } from "@/components/App/ParseProgress";
import { SummaryStats } from "@/components/App/SummaryStats";
import { CategoryChart } from "@/components/App/CategoryChart";
import { UncategorizedPanel } from "@/components/App/UncategorizedPanel";
import { ExportButton } from "@/components/App/ExportButton";
import { AddMoreButton } from "@/components/App/AddMoreButton";
import { ErrorBanner } from "@/components/App/ErrorBanner";

export default function AppPage() {
  const phase = useAppStore((s) => s.phase);
  const reset = useAppStore((s) => s.reset);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Sotto
        </Link>
        <div className="flex items-center gap-3">
          {phase === "parsed" && <AddMoreButton />}
          {phase === "parsed" && <ExportButton />}
          {phase !== "idle" && (
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Start over
            </button>
          )}
        </div>
      </header>

      {phase === "idle" && (
        <div className="mx-auto w-full max-w-xl pt-8">
          <FileDropzone />
          <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
            CSV works for most banks. PDF support is more limited.{" "}
            <Link
              href="/privacy"
              className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              Is my privacy protected?
            </Link>
          </p>
        </div>
      )}

      {phase === "parsing" && <ParseProgress />}

      {phase === "error" && <ErrorBanner />}

      {phase === "parsed" && (
        <div className="flex flex-col gap-6">
          <SummaryStats />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <CategoryChart />
            </div>
            <div className="lg:col-span-2">
              <UncategorizedPanel />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
