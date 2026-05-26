import { describe, expect, it } from 'vitest';

import { normalizeDetectedLanguage } from './index';

describe('normalizeDetectedLanguage', () => {
  it('strips POSIX locale variants before i18next validates the tag', () => {
    expect(normalizeDetectedLanguage('en-US@POSIX')).toBe('en-US');
  });

  it('leaves regular BCP 47 language tags unchanged', () => {
    expect(normalizeDetectedLanguage('nl-NL')).toBe('nl-NL');
  });
});
