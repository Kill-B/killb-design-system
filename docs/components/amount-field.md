# Amount field

The amount field takes a money value in one currency and shows that currency the whole time.

## Anatomy

A label above (`xs` step, medium weight); the field (48 px high, `--kb-radius-sm`, `--kb-border-strong`) with the value right-aligned in Inter, medium weight, `lg` step, with `--kb-font-feature-amount`, and the ISO currency code in a chip at the end; helper or error text below (`xs` step).

## Rules

- The consumer provides the currency, its number of decimals, the locale and the limits (minimum, maximum, available balance).
- Use `inputmode="decimal"`. Format with the locale's separators on blur; accept both separators while typing.
- Every amount in the helper text carries its currency and uses `--kb-font-feature-amount`.
- A quote shows the rate with its pair and its validity: `4,123.45 COP/USD, valid 59 s`. When the quote expires, the value is replaced, not animated, and the field gets a short `--kb-brand-subtle` flash.
- Errors say what is wrong and what to do, with the exact numbers: "Above your balance by 6,597.83 USD. Lower the amount or add funds."
- The value itself is always `--kb-text-primary`.
