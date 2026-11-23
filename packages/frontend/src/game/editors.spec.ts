import { isEditor, parseEditorEmails } from '@rayfin-app/shared';
import { describe, expect, it } from 'vitest';

describe('editor allow-list', () => {
  it('trims entries, drops empties and keeps case', () => {
    expect(parseEditorEmails(' Anna@x.com , ,bob@y.org ')).toEqual([
      'Anna@x.com',
      'bob@y.org',
    ]);
  });

  it('rejects an email the server rule cannot quote', () => {
    expect(() => parseEditorEmails("o'brien@x.com")).toThrow(
      /o'brien@x\.com/
    );
  });

  it('treats a missing setting as no editors', () => {
    expect(parseEditorEmails(undefined)).toEqual([]);
  });

  it('matches emails case-insensitively in the UI', () => {
    expect(isEditor(['Anna@x.com'], 'anna@X.com')).toBe(true);
  });

  it('has no editors when the list is empty', () => {
    expect(isEditor([], 'a@b.c')).toBe(false);
  });

  it('is not an editor without a signed-in email', () => {
    expect(isEditor(['a@b.c'], null)).toBe(false);
  });
});
