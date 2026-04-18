"use client";

import { useRef } from "react";
import { useStatementParser } from "@/lib/state/useStatementParser";

export function AddMoreButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const parseFiles = useStatementParser();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      parseFiles(e.target.files, { append: true });
      e.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,text/csv,.pdf,.csv"
        multiple
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Add more statements"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 sm:px-4 sm:py-2 sm:text-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:shadow-none dark:hover:border-emerald-800 dark:hover:bg-emerald-900/50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        <span className="hidden sm:inline">Add more</span>
      </button>
    </>
  );
}
