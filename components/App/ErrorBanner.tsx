"use client";

import { useAppStore } from "@/lib/state/appStore";

export function ErrorBanner() {
  const error = useAppStore((s) => s.error);
  const reset = useAppStore((s) => s.reset);
  if (!error) return null;
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <div className="text-sm font-medium text-red-900">{error}</div>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-full bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
      >
        Try again
      </button>
    </div>
  );
}
