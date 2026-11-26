# @killb/design-system

KillB's design tokens and brand assets: color, type, space, radius, elevation and motion for every KillB surface, with the fonts and the logo.

- [Brand](docs/brand.md): attributes, identity, logo rules, color, type, proportion and imagery.
- [Design system](docs/design-system.md): how to build with the tokens, and the first component specs.

## Install

```sh
npm install @killb/design-system
```

```css
@import '@killb/design-system/tokens.css';

.amount {
  color: var(--kb-text-primary);
  font-feature-settings: var(--kb-font-feature-amount);
}
```

```ts
import { createTheme } from '@mui/material/styles';
import { lightThemeOptions } from '@killb/design-system/mui';

export const theme = createTheme(lightThemeOptions);
```

Set `data-theme="dark"` on the root element for the dark theme.

## Develop

Requires Node 26 (see `.nvmrc`).

```sh
npm ci
npm run build        # dist/ from tokens/source.json, with the contrast and color-blind checks
npm test
npm run lint && npm run format:check && npm run typecheck
```

Change a token in `tokens/source.json`, never in `dist/`. The build fails, writing nothing, when a contrast floor or the color-blind separation breaks, and prints `dist/contrast-report.md` when it passes. Pull requests follow the template; renaming or removing a public name needs a `BREAKING CHANGE:` footer.

Releases are automatic: a `feat` or `fix` commit on `main` publishes a new version to npm with provenance.

## License

Code and tokens: [MIT](LICENSE). The KillB name and logos are not covered by the MIT license: see [TRADEMARK.md](TRADEMARK.md). Fonts: SIL Open Font License 1.1 ([Inter](fonts/OFL-Inter.txt), [Space Grotesk](fonts/OFL-SpaceGrotesk.txt)).
