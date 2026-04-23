# Sotto

A privacy-first bank statement analyser. Drop your PDF or CSV, get a categorised spend breakdown — everything runs in your browser. No uploads, no accounts, no telemetry.

**Live at [usesotto.vercel.app](https://usesotto.vercel.app)**

## How it works

1. You drop one or more bank statements (PDF or CSV) into the browser.
2. The parser extracts transactions entirely client-side using [pdf.js](https://mozilla.github.io/pdf.js/) (for PDFs) or a built-in CSV tokeniser.
3. A rule-based dictionary auto-categorises each transaction into one of 21 spend categories (Groceries, Dining Out, Transport, etc.).
4. You review anything the dictionary missed, tag it, and optionally "apply to all matching" — a session rule that auto-categorises future rows with the same merchant.
5. A donut chart and bar breakdown show where your money went.
6. Export the categorised data as CSV if you want to keep it.

Closing the tab wipes everything. Nothing is persisted — not in localStorage, not on a server, not anywhere.

## Privacy guarantees

These aren't just claims — they're enforced by code and verifiable by anyone:

- **No server upload.** The file input reads into an `ArrayBuffer` via `file.arrayBuffer()`. There is no `<form>` POST, no API route, no `fetch()` on the parsing path.
- **Strict Content-Security-Policy.** Every response carries `connect-src 'self'`, which tells the browser to block any outbound network request to a third party. Even a bug couldn't exfiltrate data.
- **Per-request nonce.** Inline scripts use `'nonce-<random>'` + `'strict-dynamic'` instead of `'unsafe-inline'`, tightening the CSP against XSS.
- **Zero analytics.** No Google Analytics, no Sentry, no Vercel Analytics, no telemetry of any kind.
- **Self-hosted pdf.js worker.** The Web Worker that parses PDFs is served from the same origin (`/pdfjs/pdf.worker.min.mjs`), not fetched from a CDN.
- **Auditable.** The [`/privacy`](https://usesotto.vercel.app/privacy) page walks you through verifying every claim in under a minute using DevTools.

## Supported formats

| Format | Coverage |
|---|---|
| **CSV** | Most UK banks. The parser auto-detects common column headers (Date, Description, Amount, Debit/Credit, Balance, etc.) across multiple naming conventions. |
| **PDF (text-based)** | Dynamic column detection covers HSBC, Lloyds, NatWest, Monzo (signed amount column), and Starling (multi-line "Account Balance" header + £-prefixed amounts). Handles banks that use "Paid out"/"Paid in", "Money out"/"Money in", "Debit"/"Credit", "In"/"Out", or a dedicated "Type" column. |
| **PDF (image/scanned)** | Not supported. If pdf.js finds no text layer, the app shows a clear error. |

## Categories

Groceries, Dining Out, Transport, Car, Utilities, Insurance, Investments & Savings, Rent/Mortgage, Home, Kids, Pet, Personal Care, Shopping, Entertainment, Health & Fitness, Travel, Subscriptions, Cash, Charity, Income, Other.

The dictionary ships 200+ rules covering major UK chains, keyword fallbacks (RESTAURANT, BISTRO, PHARMACY, CASH, RENT, SALARY, etc.), and payment-type codes (ATM, DD, etc.). Anything unmatched lands in the review panel for manual tagging.

## Tech stack

- **Next.js 16** (App Router) + React 19 + Tailwind 4
- **pdfjs-dist** for PDF text extraction (self-hosted worker, no CDN)
- **Zustand** for in-memory state (no `persist` middleware)
- **Vitest** for unit tests (116 tests across parser, CSV, categorisation, and store dedupe logic)
- **Playwright** for E2E privacy tests (zero-network assertion, offline parse, CSP header verification)
- Dark mode support via `prefers-color-scheme`

## Running locally

```bash
git clone https://github.com/corrinsg/sotto.git
cd sotto
npm install
npm run dev
```

Open [http://localhost:3010](http://localhost:3010).

## Tests

```bash
# Unit tests
npm test

# E2E privacy tests (builds + starts a production server)
npm run test:e2e

# CI grep for forbidden network APIs on the parsing path
npm run check:no-network
```

## Contributing

Contributions are welcome — especially new merchant rules for the categorisation dictionary and support for additional bank PDF layouts.

If you're adding a merchant rule, add it to `lib/categorize/rules.ts`. If you're adding a bank parser, write a synthetic fixture in `lib/parser/__fixtures__/` (never commit real statement data) and test against it.

## Licence

MIT
