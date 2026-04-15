"use client";

import { useCallback, useRef, useState } from "react";
import { useAppStore } from "@/lib/state/appStore";
import { parseHsbcStatement } from "@/lib/parser/hsbcParser";
import { parseCsvStatement } from "@/lib/parser/csvParser";
import { configurePdfjsWorker } from "@/lib/parser/pdfjsLoader";
import type { ParsedStatement } from "@/lib/parser/types";
import { cn } from "@/lib/utils";

export function FileDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const startParse = useAppStore((s) => s.startParse);
  const setProgress = useAppStore((s) => s.setProgress);
  const setParsed = useAppStore((s) => s.setParsed);
  const setError = useAppStore((s) => s.setError);

  const handleFile = useCallback(
    async (file: File) => {
      const name = file.name.toLowerCase();
      const isPdf = name.endsWith(".pdf");
      const isCsv = name.endsWith(".csv");
      if (!isPdf && !isCsv) {
        setError(
          "That doesn't look like a PDF or CSV. Please upload your bank statement as PDF or CSV.",
        );
        return;
      }
      startParse();
      try {
        let statement: ParsedStatement;
        if (isPdf) {
          configurePdfjsWorker();
          const buffer = await file.arrayBuffer();
          statement = await parseHsbcStatement(buffer, {
            onProgress: (pct) => setProgress(pct),
          });
        } else {
          const text = await file.text();
          statement = await parseCsvStatement(text, {
            onProgress: (pct) => setProgress(pct),
          });
        }
        if (statement.transactions.length === 0) {
          setError(
            "We couldn't find any transactions. Your statement format may not be supported yet. Make sure it's a text-based (not scanned) PDF or a CSV with recognizable columns.",
          );
          return;
        }
        setParsed(statement);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error.";
        setError(
          isCsv
            ? `Couldn't parse this CSV. ${message}`
            : `Couldn't parse this PDF. It may be password-protected, scanned, or in an unexpected layout. (${message})`,
        );
      }
    },
    [startParse, setProgress, setParsed, setError],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
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
        "group relative flex min-h-64 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-white px-8 py-12 text-center transition",
        dragActive
          ? "border-zinc-900 bg-zinc-50"
          : "border-zinc-300 hover:border-zinc-500",
      )}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,text/csv,.pdf,.csv"
        className="hidden"
        onChange={onInputChange}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M12 13v8" />
          <path d="m8 17 4-4 4 4" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
      </div>
      <div>
        <p className="text-base font-medium text-zinc-900">
          Drop your bank statement here
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          PDF or CSV · click to browse · never leaves your browser
        </p>
      </div>
    </div>
  );
}
