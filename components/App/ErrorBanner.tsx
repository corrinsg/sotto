"use client";

import { useAppStore } from "@/lib/state/appStore";

export function ErrorBanner() {
  const error = useAppStore((s) => s.error);
  const reset = useAppStore((s) => s.reset);
  if (!error) return null;
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:shadow-none">
      <div className="text-sm font-medium text-rose-900 dark:text-rose-200">
        {error}
      </div>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-full bg-rose-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500"
      >
        Try again
      </button>
    </div>
  );
}
