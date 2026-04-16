"use client";

import { useCallback } from "react";
import { useAppStore } from "./appStore";
import { parseStatementPdf } from "../parser/pdfParser";
import { parseCsvStatement } from "../parser/csvParser";
import { configurePdfjsWorker } from "../parser/pdfjsLoader";
import type { ParsedStatement } from "../parser/types";

interface ParseOpts {
  append?: boolean;
}

export function useStatementParser() {
  const beginBatch = useAppStore((s) => s.beginBatch);
  const setCurrentFile = useAppStore((s) => s.setCurrentFile);
  const setFileProgress = useAppStore((s) => s.setFileProgress);
  const appendStatement = useAppStore((s) => s.appendStatement);
  const finishBatch = useAppStore((s) => s.finishBatch);
  const setError = useAppStore((s) => s.setError);

  return useCallback(
    async (input: FileList | File[], opts: ParseOpts = {}) => {
      const fileArray = Array.from(input);
      const valid = fileArray.filter((f) => {
        const n = f.name.toLowerCase();
        return n.endsWith(".pdf") || n.endsWith(".csv");
      });

      if (valid.length === 0) {
        setError(
          "None of those look like PDFs or CSVs. Please upload your bank statements as PDF or CSV.",
        );
        return;
      }

      beginBatch(valid.length, Boolean(opts.append));

      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const fileName = file.name;
        const isPdf = fileName.toLowerCase().endsWith(".pdf");

        setCurrentFile(i + 1, fileName);
        setFileProgress(0);

        try {
          let statement: ParsedStatement;
          if (isPdf) {
            configurePdfjsWorker();
            const buffer = await file.arrayBuffer();
            statement = await parseStatementPdf(buffer, {
              onProgress: (pct) => setFileProgress(pct),
            });
          } else {
            const text = await file.text();
            statement = await parseCsvStatement(text, {
              onProgress: (pct) => setFileProgress(pct),
            });
          }

          if (statement.transactions.length === 0) {
            setError(
              `We couldn't find any transactions in ${fileName}. Make sure it's a text-based (not scanned) PDF or a CSV with recognisable columns.`,
            );
            return;
          }
          appendStatement(statement, fileName);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error.";
          setError(
            isPdf
              ? `Couldn't parse ${fileName}. It may be password-protected, scanned, or in an unexpected layout. (${message})`
              : `Couldn't parse ${fileName}. ${message}`,
          );
          return;
        }
      }

      finishBatch();
    },
    [
      beginBatch,
      setCurrentFile,
      setFileProgress,
      appendStatement,
      finishBatch,
      setError,
    ],
  );
}
