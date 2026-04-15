"use client";

import { useAppStore, selectOverallProgress } from "@/lib/state/appStore";

export function ParseProgress() {
  const overall = useAppStore(selectOverallProgress);
  const totalFiles = useAppStore((s) => s.totalFiles);
  const currentFileIndex = useAppStore((s) => s.currentFileIndex);
  const currentFileName = useAppStore((s) => s.currentFileName);

  const isMulti = totalFiles > 1;

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-zinc-200/60 bg-white p-8 text-center shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
      <div className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {isMulti
          ? `Parsing your statements… (${currentFileIndex}/${totalFiles})`
          : "Parsing your statement…"}
      </div>
      {currentFileName && (
        <div className="mb-4 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {currentFileName}
        </div>
      )}
      {!currentFileName && <div className="mb-4" />}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-[width] duration-300 ease-out"
          style={{ width: `${overall}%` }}
        />
      </div>
      <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Running entirely in your browser. {overall}%
      </div>
    </div>
  );
}
