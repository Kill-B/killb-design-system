/** The public names of a build: token paths, CSS custom properties and package exports. */
export interface PublicNames {
  cssProperties: string[];
  exports: string[];
  tokens: string[];
}

export function tokenPaths(tree: unknown, prefix = ''): string[] {
  if (typeof tree !== 'object' || tree === null) return [];
  if ('$value' in tree) return [prefix];
  return Object.entries(tree).flatMap(([key, value]) =>
    key.startsWith('$') ? [] : tokenPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

export const cssProperties = (css: string): string[] => [...new Set(css.match(/--kb-[\w-]+(?=\s*:)/g) ?? [])];

export function publicNames(tokensJson: unknown, tokensCss: string, packageJson: { exports?: object }): PublicNames {
  return {
    cssProperties: cssProperties(tokensCss).sort(),
    exports: Object.keys(packageJson.exports ?? {}).sort(),
    tokens: tokenPaths(tokensJson).sort(),
  };
}

export function removedNames(published: PublicNames, current: PublicNames): string[] {
  const gone = (kind: keyof PublicNames, label: string): string[] =>
    published[kind].filter(name => !current[kind].includes(name)).map(name => `${label} ${name}`);
  return [...gone('tokens', 'token'), ...gone('cssProperties', 'CSS property'), ...gone('exports', 'export')];
}

export type Published = { kind: 'none' } | { kind: 'version'; names: PublicNames; version: string };

export interface BreakingResult {
  message: string;
  ok: boolean;
}

export const hasBreakingFooter = (messages: string[]): boolean => messages.some(m => /^BREAKING[ -]CHANGE:/m.test(m));

/**
 * Compares the current names with the latest published version.
 * No published version: skipped. Registry unreachable (fetchPublished throws): fails closed.
 */
export async function checkBreaking(
  current: PublicNames,
  fetchPublished: () => Promise<Published>,
  commitMessages: string[],
): Promise<BreakingResult> {
  let published: Published;
  try {
    published = await fetchPublished();
  } catch (error) {
    return {
      message: `Breaking-change check failed: the npm registry could not be reached (${(error as Error).message}). Re-run CI.`,
      ok: false,
    };
  }
  if (published.kind === 'none') {
    return { message: 'Breaking-change check skipped: no version of the package is published yet.', ok: true };
  }
  const removed = removedNames(published.names, current);
  if (removed.length === 0) {
    return { message: `No public name removed since ${published.version}.`, ok: true };
  }
  const list = removed.map(r => `  - ${r}`).join('\n');
  if (hasBreakingFooter(commitMessages)) {
    return { message: `Removed since ${published.version}, declared with BREAKING CHANGE:\n${list}`, ok: true };
  }
  return {
    message: `Removed since ${published.version} without a BREAKING CHANGE footer in any commit:\n${list}`,
    ok: false,
  };
}
