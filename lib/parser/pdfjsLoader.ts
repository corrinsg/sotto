import * as pdfjsLib from "pdfjs-dist";

let configured = false;

export function configurePdfjsWorker(): void {
  if (configured) return;

  const workerSrc = "/pdfjs/pdf.worker.min.mjs";
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  if (typeof window !== "undefined") {
    if (!workerSrc.startsWith("/") && !workerSrc.startsWith(window.location.origin)) {
      throw new Error(
        `pdf.js worker must be same-origin; got ${workerSrc}. This is a privacy violation.`,
      );
    }
  }

  configured = true;
}
