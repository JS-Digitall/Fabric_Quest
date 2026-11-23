import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';

import type { ClaimsDsl, PolicyExpression } from '@microsoft/rayfin-core';
import { NO_EDITORS_SENTINEL, parseEditorEmails } from '@rayfin-app/shared';

/**
 * Editor emails, read when the schema is applied. The CLI runs from the repo
 * root, so fall back to `rayfin/.env` there when the variable isn't exported.
 */
function readEditorEmails(): string[] {
  const envFile = resolve(process.cwd(), 'rayfin/.env');
  if (!process.env.RAYFIN_PUBLIC_EDITOR_EMAILS && existsSync(envFile))
    loadEnvFile(envFile);
  return parseEditorEmails(process.env.RAYFIN_PUBLIC_EDITOR_EMAILS);
}

export const EDITOR_EMAILS = readEditorEmails();

/** Writes allowed only for listed emails; an empty list denies everyone. */
export function editorPolicy(emails: readonly string[]) {
  return (claims: ClaimsDsl): PolicyExpression => {
    if (emails.length === 0) return claims.email.eq(NO_EDITORS_SENTINEL);
    return emails
      .slice(1)
      .reduce<PolicyExpression>(
        (acc, e) => acc.or(claims.email.eq(e)),
        claims.email.eq(emails[0])
      );
  };
}
