//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import App from '@/App';

// The game loads its questions from the database; these specs cover auth only.
vi.mock('@/game/content/load', () => ({
  loadContent: async () => ({ meta: [], rows: [] }),
}));
vi.mock('@/lib/rayfin-client', () => ({ getRayfinClient: async () => ({}) }));

describe('App', () => {
  it('renders the Fabric Quest game', async () => {
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: /fabric quest/i })
    ).toBeInTheDocument();
  });
});
