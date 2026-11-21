//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import '@testing-library/jest-dom';

import type { ReactNode } from 'react';
import { vi } from 'vitest';

// jsdom has no animation frames to finish exit animations, so screens would
// stay mounted forever. Render presence children directly in tests.
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
  };
});

import { MotionGlobalConfig } from 'framer-motion';

// Jump straight to animation targets so entrance fades don't leave content at opacity 0.
MotionGlobalConfig.skipAnimations = true;

// Phaser probes a real canvas at import time, which jsdom lacks. The world is
// exercised in the browser; unit tests only need the module shape.
vi.mock('phaser', () => {
  class Scene {}
  class Game {
    destroy() {}
  }
  const Phaser = { Scene, Game, AUTO: 0, Scale: { RESIZE: 0 } };
  return { default: Phaser, ...Phaser };
});
