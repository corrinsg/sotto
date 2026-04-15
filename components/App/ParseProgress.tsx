"use client";

import { useAppStore } from "@/lib/state/appStore";

export function ParseProgress() {
  const progress = useAppStore((s) => s.parseProgress);
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center">
      <div className="mb-4 text-sm font-medium text-zinc-900">
        Parsing your statement…
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full bg-zinc-900 transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 text-xs text-zinc-500">
        Running entirely in your browser. {progress}%
      </div>
    </div>
  );
}
