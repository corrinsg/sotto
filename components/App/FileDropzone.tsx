"use client";

import { useRef, useState } from "react";
import { useStatementParser } from "@/lib/state/useStatementParser";
import { cn } from "@/lib/utils";

export function FileDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const parseFiles = useStatementParser();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      parseFiles(e.target.files);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      parseFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      className={cn(
        "group relative flex min-h-72 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed bg-white px-8 py-12 text-center shadow-sm transition dark:bg-zinc-900 dark:shadow-none",
        dragActive
          ? "border-emerald-500 bg-emerald-50/40 shadow-md dark:bg-emerald-950/30"
          : "border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50/20 dark:border-zinc-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20",
      )}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,text/csv,.pdf,.csv"
        multiple
        className="hidden"
        onChange={onInputChange}
      />
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 transition dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900",
          dragActive && "scale-105 bg-emerald-100 dark:bg-emerald-900",
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
        >
          <path d="M12 13v8" />
          <path d="m8 17 4-4 4 4" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Drop your bank statements here
        </p>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          One or more PDFs or CSVs · click to browse · never leaves your
          browser
        </p>
      </div>
    </div>
  );
}
