# Status badge

The status badge names the state of a transfer, a customer or a document in one or two words.

## Tones

| Tone     | Text on background                             | States it covers                      |
| -------- | ---------------------------------------------- | ------------------------------------- |
| Neutral  | `--kb-text-secondary` on `--kb-surface-sunken` | Created, canceled, expired            |
| Progress | `--kb-info-fg` on `--kb-info-subtle`           | Pending, processing                   |
| Warning  | `--kb-warning-fg` on `--kb-warning-subtle`     | On hold, needs review, quote expiring |
| Success  | `--kb-success-fg` on `--kb-success-subtle`     | Completed, settled                    |
| Error    | `--kb-error-fg` on `--kb-error-subtle`         | Failed, rejected                      |

## Rules

- The consumer provides the label and the tone. Map each status to one tone in one shared table, not per screen.
- The label is the word people use ("On hold"), never a code.
- A 6 px dot in the text color repeats the tone; the word carries the meaning.
- Never yellow: yellow is the brand, not a state.
- `--kb-radius-xs`, `xs` step, medium weight. One badge per row in tables.
