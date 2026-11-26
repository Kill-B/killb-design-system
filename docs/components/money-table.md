# Money table

The money table lists transfers, statements and balances so amounts can be compared down a column.

## Rules

- The consumer provides the rows, the column definitions (text, id, date, amount, rate, status) and the sort.
- Amount and rate columns are right-aligned with `--kb-font-feature-amount`. Every row in a column uses the same number of decimals for its currency, so the decimal points line up.
- The currency code follows the amount in `--kb-text-secondary`. When the whole column is one currency, the code goes in the header instead ("Amount (USD)").
- Negative amounts use a true minus (−). Color is optional and never the only signal.
- Ids use `--kb-font-mono` in `--kb-text-secondary`, truncated in the middle and copied in full on click.
- Header row: `xs` step, medium weight, on `--kb-surface-sunken`. Rows: 44 px minimum, `xs` step, `--kb-border-subtle` rules, no zebra stripes.
- Hover: `--kb-surface-sunken`. Selected: `--kb-brand-subtle`, with `aria-selected`.
- Flat on the page: a `--kb-border-subtle` outline and `--kb-radius-md` on the container, no shadow.
- The empty state says what will appear and how to get the first row ("No payouts yet. Payouts you send appear here.").
