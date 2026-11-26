# KillB brand

How KillB looks and feels on every surface: what the brand stands for, how the logo and the yellow are used, and which type and proportions carry it. The values live in [the design system](design-system.md); this document sets the intent they serve.

## Who we are

KillB is payments infrastructure for Latin America. It moves money between local currencies, dollars and digital assets: ramps, payouts, payins, conversions and USD accounts, through an API and a portal. The mission is to unlock greater economic opportunity for everyone.

The people we design for:

| Audience         | What they need from us                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Finance teams    | To trust a number before they approve it. They read the amount, the rate and the status, in that order.              |
| Product builders | Fintechs and platforms that plug KillB into their product. They judge us by how clean the docs and the sandbox feel. |
| Developers       | Examples that run and errors that explain.                                                                           |
| Operations teams | Long sessions in dense tables, with no room for ambiguity.                                                           |

## Attributes

Four words, each with a test. Every screen, page and post should pass all four.

| Attribute   | Means                                               | Looks like                                                            | Not                                                                      |
| ----------- | --------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Precise** | Every number is exact, labeled and in its currency. | Tabular figures, aligned decimals, the rate printed with its pair.    | Rounded numbers, vague states without a time.                            |
| **Direct**  | One clear next step per view.                       | One yellow button. Verbs on buttons. Errors that say what to do.      | Three equal calls to action, "Continue", marketing speak in the product. |
| **Solid**   | Infrastructure: it works the same every time.       | Black ink, a strict grid, flat surfaces, consistent states.           | Effects, glass, motion for its own sake, a new style per screen.         |
| **Open**    | Borderless, and in the customer's language.         | White space, light, layouts that fit English, Spanish and Portuguese. | Jargon, walls of text, examples from one country only.                   |

What we are not:

- **Crypto hype**: neon on black, glowing coins, rockets, purple gradients.
- **Toy fintech**: cartoon mascots, confetti on a payment, pastel everything.
- **Legacy bank**: navy and grey, stock handshakes, small print as decoration.

References for the feel: the precision of the best payment dashboards with money, the plain language of borderless consumer finance, and the calm of institutional banking products.

### Personality

Closer to an exchange terminal than to a lifestyle app, but warm enough that a first-time customer isn't afraid to press the button.

| Scale                   | Where KillB sits            |
| ----------------------- | --------------------------- |
| Serious ↔ Playful       | mostly serious              |
| Institutional ↔ Startup | slightly institutional      |
| Quiet ↔ Loud            | quiet                       |
| Technical ↔ Consumer    | slightly technical          |
| Warm ↔ Cold             | in the middle, leaning warm |

## Identity

Yellow and ink are the core identity: the logo, the website's signature and the most recognizable thing we own. They are a stage, not the default screen. People read numbers on white; the black and the yellow frame them.

| Surface         | Default mode                     | Dark mode              |
| --------------- | -------------------------------- | ---------------------- |
| Website         | Light, with full-width ink bands | No                     |
| Customer portal | Light                            | Later, as a preference |
| Internal apps   | Light                            | Yes, as a preference   |
| API docs        | Follows the reader's system      | Yes                    |

## Logo rules

One wordmark, drawn in a 110 × 32 box (3.44 : 1). The files in [`logos/`](../logos) are the masters; never redraw the mark.

| Version                                                                            | Ground                                 | Contrast |
| ---------------------------------------------------------------------------------- | -------------------------------------- | -------- |
| ![Yellow wordmark](../logos/killb-wordmark-yellow.svg) `killb-wordmark-yellow.svg` | Ink (`#111110`) and other dark grounds | 12.1 : 1 |
| ![Ink wordmark](../logos/killb-wordmark-ink.svg) `killb-wordmark-ink.svg`          | Yellow (`#FFC701`)                     | 12.1 : 1 |
| `killb-wordmark-ink.svg`                                                           | White and light greys                  | 18.9 : 1 |

- **Clear space:** half the logo's height on every side (16 px around a 32 px logo).
- **Minimum size:** 80 px wide on screen, 24 mm in print.
- **Placement:** top left in products and documents; centered only on covers and merchandise.
- **Not allowed:** the yellow wordmark on white or light grey (1.56 : 1); stretching, squashing or rotating; recoloring outside yellow and ink; gradients, shadows or white on yellow; placing the logo on photos.

## Color

Yellow is a signal, not a paint. The brand yellow `#FFC701` is a surface color: with ink on top it reaches 12.1 : 1, but as text on white it reaches 1.56 : 1. So the yellow fills and highlights, and the ink speaks.

| Pair                                | Contrast | Use                                 |
| ----------------------------------- | -------- | ----------------------------------- |
| Ink on yellow                       | 12.1 : 1 | Buttons, highlights, banners        |
| Yellow on ink                       | 12.1 : 1 | Logo, emphasis on dark              |
| Text-safe yellow `#935F00` on white | 5.4 : 1  | Eyebrows and one-word emphasis only |
| Brand yellow as text on white       | 1.56 : 1 | Never                               |

How much of each color, measured in area:

| Surface  | Neutral surfaces | Ink        | Yellow      |
| -------- | ---------------- | ---------- | ----------- |
| Website  | about 60 %       | about 30 % | about 10 %  |
| Products | about 70 %       | about 25 % | 5 % or less |

- **Warning is orange** (`#E66700`), 40 degrees of hue away from the brand yellow, and always comes with an icon and a word, so a warning never looks like a primary action.
- **The neutral leans warm.** The greys carry a trace of the yellow's hue, so they read as paper rather than steel and the yellow sits on them without vibrating.

## Type

Space Grotesk speaks, Inter works. Space Grotesk sets display text and headings from 25 px; Inter sets text, labels and every number. Both are under the SIL Open Font License 1.1.

- One scale for every surface: 16 × 1.25ⁿ, from 13 to 95 px. Products use the bottom of the scale, marketing the top.
- Amounts, rates and ids use tabular figures and a slashed zero, so columns align and 0 never reads as O.

## Proportion

A 4 px grid for the product, the golden ratio for the stage.

| Value   | Where                                                                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4 and 8 | Base and rhythm of every spacing step                                                                                                                                                      |
| 1.25    | Type ratio; line heights land on the 4 px grid                                                                                                                                             |
| 12      | Columns on every surface from 768 px                                                                                                                                                       |
| 1.618   | Marketing compositions only: a 7/5 hero split on 12 columns, feature images at 1.618 : 1, the hero glow on a golden-ratio point. Never in UI spacing, where it produces fractional pixels. |

## Imagery

The pill is our shape. The light is our texture.

Do:

- Pill buttons on every surface.
- One soft radial yellow glow from a corner, at most one per page, on the website and campaign pieces.
- Real product screens on real devices, with realistic amounts in local currencies.
- Real people and real Latin American places.
- Flat black bands to stage a statement or a number.

Don't:

- Coins, rockets, globes made of dollar signs, neon circuitry.
- Stock handshakes and staged team photos.
- Glassmorphism, 3D money, gradients other than the yellow glow.
- Glow or illustration inside the products: they stay flat.
- Emoji as icons in the product.
