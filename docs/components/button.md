# Button

The button starts an action; its label says exactly which one ("Send payout", not "Continue").

## Variants

| Variant   | Fill and text                                                             | Use                                                              |
| --------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Primary   | `--kb-brand-fill` with `--kb-brand-on-fill` (12.1:1)                      | The one main action of the view. At most one per view or dialog. |
| Secondary | `--kb-surface-inverse` with `--kb-text-inverse`                           | A strong second action.                                          |
| Outline   | `--kb-surface-default`, `--kb-border-strong` outline, `--kb-text-primary` | Neutral actions in toolbars and forms.                           |
| Ghost     | transparent, `--kb-text-primary`                                          | Cancel, dismiss, low-emphasis actions next to a primary.         |
| Danger    | `--kb-error-fill` with `--kb-error-on-fill`                               | Destructive, irreversible actions. Always confirmed in a dialog. |

Sizes: small (32 px high, `xs` step, medium weight), default (40 px, `md` step), large (56 px, `lg` step, marketing only).

## Rules

- The consumer provides the label (sentence case, a verb first) and an optional 16 px icon before it.
- Shape is `--kb-radius-full`.
- Hover uses `--kb-brand-fill-hover`; pressed uses `--kb-brand-fill-pressed`.
- Focus: 2 px `--kb-focus-ring`, 2 px offset, on `:focus-visible`.
- Loading keeps the width; a spinner replaces the label and the button is `aria-busy="true"`.
- A disabled button says why in a tooltip when the reason isn't visible on the screen.
- Never white text on yellow. Never two primary buttons side by side.
