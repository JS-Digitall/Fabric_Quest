/**
 * Who may edit the game's questions. The list comes from the git-ignored
 * `RAYFIN_PUBLIC_EDITOR_EMAILS` setting so no real address lands in the repo.
 */
export const NO_EDITORS_SENTINEL = 'no-editors-configured';

export function parseEditorEmails(raw: string | undefined): string[] {
  const emails = (raw ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  // The server rule is a quoted string; a quote would break or widen it.
  const bad = emails.find((e) => /['"\\]/.test(e));
  if (bad)
    throw new Error(`Editor email "${bad}" contains a quote; it can't be used.`);
  return emails;
}

/** UI-only check; the server compares the exact string. */
export function isEditor(
  list: readonly string[],
  email: string | null | undefined
): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return list.some((x) => x.toLowerCase() === e);
}
