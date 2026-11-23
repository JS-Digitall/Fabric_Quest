import { isEditor, parseEditorEmails } from '@rayfin-app/shared';
import { useContext } from 'react';

import { AuthContext } from '@/hooks/auth.context';

/** Shows or hides the editor; the server enforces the same list on writes. */
export function useIsEditor(): boolean {
  const auth = useContext(AuthContext);
  let list: string[] = [];
  try {
    list = parseEditorEmails(import.meta.env.VITE_RAYFIN_EDITOR_EMAILS);
  } catch {
    // A malformed list can't grant writes server-side either; hide the editor.
  }
  return isEditor(list, auth?.session?.user?.email);
}
