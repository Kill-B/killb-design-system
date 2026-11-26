# KillB design system

The rules for building with KillB's tokens on every surface: the website, the customer portal, internal apps and the API docs. The brand intent behind them is in [the brand document](brand.md). Every value here comes from `tokens/source.json` through `npm run build`.

## Principles

1. **Yellow is a signal, not a paint.** Ink carries the information; yellow marks the one thing to do or notice.
2. **Numbers are the product.** Amounts, rates and ids use tabular figures, are right-aligned, carry their currency and are never colored by brand.
3. **Roles, not hexes.** Components use role tokens (`--kb-text-primary`, `--kb-brand-fill`). Palette steps (`--kb-yellow-700`) only feed the roles.
4. **One scale per dimension.** Type, space, radius and elevation each come from one short scale. A value outside the scale is a bug.
5. **Contrast is a gate.** Every checked text pair is 4.5:1 or more and every control border and focus ring 3:1 or more, in both themes. The build fails otherwise.

## Tokens

Install the package and pick the output for your stack:

```sh
npm install @killb/design-system
```

| Output                               | Use                                                                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `@killb/design-system/tokens.css`    | CSS custom properties prefixed `--kb-`, light on `:root`, dark under `[data-theme="dark"]`, plus `@font-face` for the fonts |
| `@killb/design-system/tokens.json`   | The same tokens in the W3C design tokens format                                                                             |
| `@killb/design-system/mui`           | `lightThemeOptions` and `darkThemeOptions` for MUI's `createTheme`                                                          |
| `@killb/design-system/mintlify.json` | The `colors` and `fonts` block for a Mintlify `docs.json`                                                                   |

A static page can load the stylesheet from a CDN, pinned to a version:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@killb/design-system@1.0.0/dist/tokens.css" />
```

The dark theme applies only when the root element has `data-theme="dark"`. It never follows the operating system on its own: each product decides.

## Color

Six scales from 50 to 950, built in OKLCH so equal steps look equal: `yellow` (400 is the brand `#FFC701`), a warm `neutral`, and `green`, `red`, `orange` and `blue` for status. Use a role, never a palette step, in a component.

| Role                   | Light       | Dark        | Use                               |
| ---------------------- | ----------- | ----------- | --------------------------------- |
| `--kb-surface-canvas`  | neutral 50  | neutral 950 | Page background                   |
| `--kb-surface-default` | white       | neutral 900 | Cards, tables, forms              |
| `--kb-surface-raised`  | white       | neutral 800 | Menus, popovers, dialogs          |
| `--kb-surface-sunken`  | neutral 100 | neutral 950 | Wells, table headers              |
| `--kb-surface-inverse` | neutral 950 | neutral 50  | Black bands, tooltips             |
| `--kb-text-primary`    | neutral 950 | neutral 50  | All body text and amounts         |
| `--kb-text-secondary`  | neutral 600 | neutral 400 | Labels, helper text, placeholders |
| `--kb-text-brand`      | yellow 700  | yellow 400  | Short emphasis only               |
| `--kb-border-subtle`   | neutral 200 | neutral 800 | Dividers, card outlines           |
| `--kb-border-strong`   | neutral 500 | neutral 500 | Input and checkbox outlines       |
| `--kb-focus-ring`      | yellow 700  | yellow 400  | Every focus state                 |
| `--kb-brand-fill`      | yellow 400  | yellow 400  | The primary action                |
| `--kb-brand-on-fill`   | neutral 950 | neutral 950 | Text on brand fills               |

Status roles follow one pattern: `--kb-<status>-fg` for text and icons, `-fill` for solid badges, `-on-fill` for text on the fill, `-subtle` for banners, for `success`, `warning`, `error` and `info`.

The yellow rules:

- Put ink on yellow, never white on yellow.
- On light grounds the only yellow text is `--kb-text-brand` (5.4:1 on white). Links are ink with an underline.
- Yellow never encodes data: no yellow status, no yellow chart series, no yellow amounts.
- Warning is orange and always carries an icon and a word.

How much of each color, in area: about 60 % neutral, 30 % ink and 10 % yellow on the website; about 70 %, 25 % and 5 % or less in products. In a money interface the yellow budget is the smallest.

## Data visualization

- **Categorical:** `--kb-viz-1` to `--kb-viz-5` (blue, gold, teal, purple, vermillion), in that order. Each series is 3:1 or more against the chart background, and the set stays distinct under protanopia, deuteranopia and tritanopia in both themes. Past five series, group the rest as "Other".
- **Sequential** (one measure, low to high): `--kb-viz-seq-1` to `--kb-viz-seq-8`.
- **Diverging** (gain and loss around zero): `--kb-viz-div-neg-3` to `--kb-viz-div-pos-3`, orange to blue rather than red to green. Always print the sign.

## Type

Space Grotesk for display and headings from 25 px, Inter for everything else. One scale, base 16 px, ratio 1.25, rounded to whole pixels; every line height is a multiple of 4.

| Step  | Size / line height | Letter spacing |
| ----- | ------------------ | -------------- |
| `7xl` | 95 / 100           | −0.05em        |
| `6xl` | 76 / 84            | −0.045em       |
| `5xl` | 61 / 68            | −0.04em        |
| `4xl` | 49 / 56            | −0.035em       |
| `3xl` | 39 / 48            | −0.03em        |
| `2xl` | 31 / 40            | −0.02em        |
| `xl`  | 25 / 32            | −0.01em        |
| `lg`  | 20 / 28            | −0.005em       |
| `md`  | 16 / 24            | 0              |
| `xs`  | 13 / 20            | +0.005em       |

Each step is `--kb-font-size-<step>`, `--kb-line-height-<step>` and `--kb-letter-spacing-<step>`. Weights are `--kb-font-weight-regular` (400), `-medium` (500) and `-bold` (700, for a single word only).

- 13 px is the floor.
- Sentence case everywhere. Uppercase only for small labels, with +0.06em tracking.
- Running text stays within `--kb-width-reading` (720 px).

### Numbers

Set `font-feature-settings: var(--kb-font-feature-amount)` on every amount, rate, date in a table and id.

- Right-align amounts; give every row the same decimals for its currency so the decimal points line up.
- Write the ISO currency code after the amount in `--kb-text-secondary`: `1,250.00 USD`.
- Negative amounts use a true minus (−). Color is a second signal, never the only one.
- Show rates with their pair: `4,123.45 COP/USD`.
- Ids are monospaced at 13 px, truncated in the middle, copied in full.

## Space

A 4 px base with an 8 px rhythm: `--kb-space-0`, `4`, `8`, `12`, `16`, `24`, `32`, `40`, `48`, `64`, `80`, `96`, `128`, `160`. Gaps inside a component use 4 to 16; between components 16 to 32; sections 48 and up.

## Layout

- 12 columns from 768 px. Gutters 16, 24 and 32 px; page margins 16, 24 and 40 px (mobile, tablet, desktop).
- Breakpoints: 480, 768, 1024, 1280 and 1536 px (in `tokens.json` and the MUI theme).
- Widths: `--kb-width-reading` 720 px, `--kb-width-marketing` 1280 px, `--kb-width-app` 1440 px.
- The golden ratio belongs to marketing compositions only.

## Shape

- **Radius:** `--kb-radius-full` for buttons (the brand pill), `-sm` (8 px) for inputs and toasts, `-md` (12 px) for cards and dialogs, `-xl` and `-2xl` for marketing cards, `-xs` for badges.
- **Borders and shadows:** borders separate things on the same plane, shadows lift things above it. Cards, tables and panels are flat with `--kb-border-subtle`. Menus and popovers take `--kb-elevation-2`, sticky headers and drawers `-3`, dialogs and toasts `-4`. A card never has both.
- In the dark theme, surfaces get lighter as they rise.

## Motion

Motion explains a change; it does not decorate. `--kb-duration-instant` (100 ms) for color changes, `-fast` (150 ms) for small toggles, `-base` (200 ms) for menus, `-slow` (300 ms) for dialogs. Use `--kb-ease-standard` within the screen, `-enter` for arrivals and `-exit` for departures. Under `prefers-reduced-motion`, fade instead of moving. Never animate a number that changes value; replace it and mark the change briefly.

## States

| State               | Treatment                                                                |
| ------------------- | ------------------------------------------------------------------------ |
| Hover               | One step darker fill, or a sunken surface behind a ghost control         |
| Focus               | 2 px `--kb-focus-ring` outline, 2 px offset, on `:focus-visible`         |
| Pressed or selected | `--kb-brand-fill-pressed`; selected rows on `--kb-brand-subtle`          |
| Disabled            | `--kb-text-disabled`, no hover change, the reason in a tooltip           |
| Loading             | Keep the layout; skeletons on a sunken surface                           |
| Error               | `--kb-error-fg` message under the field, with an icon, saying what to do |

## Components

The first components are the ones money flows through:

- [Button](components/button.md)
- [Amount field](components/amount-field.md)
- [Status badge](components/status-badge.md)
- [Money table](components/money-table.md)

## Governance

- **One source.** Every output is generated from `tokens/source.json`. Nothing in `dist/` is edited by hand.
- **Ownership.** The product owner decides on brand, new roles and new components. Engineers who build the surfaces review every token change.
- **Change process.** A pull request with the reason, screenshots in both themes and the contrast report; the template asks for each.
- **Versioning.** Renaming or removing a token, a CSS property or an export is a major version, declared with a `BREAKING CHANGE:` footer; CI blocks it otherwise. Adding a token or changing a value is a minor version (`feat`).
- **Checks.** The build fails when a contrast floor or the color-blind separation is broken, and CI fails when the Inter files lose their tabular figures.
