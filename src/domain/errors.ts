/**
 * Translatable error — carries an i18n key + interpolation params instead of
 * a hardcoded English string. UI surfaces translate via i18next; non-i18n
 * consumers (console, tests) get the key as `.message`.
 *
 * Use this for any error that may surface in the UI. Programmer-only
 * invariants (provider context guards, root-element checks) stay as plain
 * `new Error(...)` since they should never reach a user.
 */

export type ErrorParams = Record<string, string | number>;

export class TranslatableError extends Error {
  readonly key: string;
  readonly params?: ErrorParams;

  constructor(key: string, params?: ErrorParams) {
    super(buildDebugMessage(key, params));
    this.name = 'TranslatableError';
    this.key = key;
    this.params = params;
  }
}

function buildDebugMessage(key: string, params?: ErrorParams): string {
  if (!params || Object.keys(params).length === 0) return key;
  const pairs = Object.entries(params)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(' ');
  return `${key} (${pairs})`;
}
