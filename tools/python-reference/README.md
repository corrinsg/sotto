# Python reference parser

This is the original HSBC PDF → CSV parser. It is kept here as:

1. **Reference** for the semantics the TypeScript port in `lib/parser/hsbcParser.ts` must match.
2. **Golden-CSV generator** for `lib/parser/__fixtures__/golden_clean.csv`.

## Regenerating the golden

```bash
cd tools/python-reference
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python parse_expenses.py ../../Data/march_statement.pdf \
  -o ../../lib/parser/__fixtures__/golden_raw.csv --format csv
```

Then hand-correct `golden_raw.csv` → `golden_clean.csv` to fix known Python-parser bugs:

- **Footer bleed.** Rows where `BALANCECARRIEDFORWARD plc 1 Centenary Square Birmingham B1 1HQ` is glued to legitimate transaction details. Strip the footer text from these rows.
- **`BALANCEBROUGHTFORWARD`** on row 1 — normalize to `BALANCE BROUGHT FORWARD`.
- **FSCS disclaimer trailer** — drop any trailing row that is just the Financial Services Compensation Scheme paragraph.

The TypeScript port must match `golden_clean.csv`, not `golden_raw.csv`. It fixes these bugs at parse time via token-level filters.
