"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/state/appStore";
import { FileDropzone } from "@/components/App/FileDropzone";
import { ParseProgress } from "@/components/App/ParseProgress";
import { SummaryStats } from "@/components/App/SummaryStats";
import { CategoryChart } from "@/components/App/CategoryChart";
import { UncategorizedPanel } from "@/components/App/UncategorizedPanel";
import { ExportButton } from "@/components/App/ExportButton";
import { ErrorBanner } from "@/components/App/ErrorBanner";

export default function AppPage() {
  const phase = useAppStore((s) => s.phase);
  const reset = useAppStore((s) => s.reset);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Sotto
        </Link>
        <div className="flex items-center gap-3">
          {phase === "parsed" && <ExportButton />}
          {phase !== "idle" && (
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Start over
            </button>
          )}
        </div>
      </header>

      {phase === "idle" && (
        <div className="mx-auto w-full max-w-xl">
          <FileDropzone />
          <p className="mt-4 text-center text-xs text-zinc-500">
            CSV works for most banks. PDF support is more limited.{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-zinc-900"
            >
              How we protect your data
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
