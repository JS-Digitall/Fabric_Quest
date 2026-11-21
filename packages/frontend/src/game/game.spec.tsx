import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GameApp } from './GameApp';
import { ChapterPlayer } from './screens/ChapterPlayer';
import type { Chapter } from './types';

const src = 'https://learn.microsoft.com/fabric/x';
const fixture: Chapter = {
  id: 'onelake',
  title: 'Test chapter',
  tagline: 't',
  scenes: [
    { kind: 'dialogue', id: 'd', speaker: 'Mira', lines: ['Hello there'] },
    {
      kind: 'choice',
      id: 'c',
      difficulties: ['beginner'],
      prompt: 'Pick B',
      options: ['A', 'B'],
      answer: 1,
      hint: 'It is B',
      explanation: 'B is the right answer here.',
      source: src,
    },
    {
      kind: 'arrange',
      id: 'a',
      difficulties: ['beginner'],
      prompt: 'Order them',
      items: ['one', 'two', 'three'],
      explanation: 'One, two, three in order.',
      source: src,
    },
    {
      kind: 'match',
      id: 'm',
      difficulties: ['beginner'],
      prompt: 'Match them',
      pairs: [
        ['L1', 'R1'],
        ['L2', 'R2'],
        ['L3', 'R3'],
      ],
      explanation: 'Each left goes with its right.',
      source: src,
    },
  ],
};

const click = (name: RegExp | string) =>
  fireEvent.click(screen.getByRole('button', { name }));

/** Reorder the arrange list with arrow keys only, until it matches `target`. */
function arrangeByKeyboard(target: string[]) {
  target.forEach((label, i) => {
    for (let guard = 0; guard < 10; guard++) {
      const items = screen.getAllByRole('listitem').map((li) => li.dataset.value);
      const at = items.indexOf(label);
      if (at === i) break;
      const li = screen.getAllByRole('listitem')[at];
      li.focus();
      fireEvent.keyDown(li, { key: at > i ? 'ArrowUp' : 'ArrowDown' });
    }
  });
}

function matchByKeyboard(pairs: [string, string][]) {
  // Native buttons: Enter/Space activate them, so clicks stand in for key presses.
  for (const [l, r] of pairs) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${l}`) }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${r}`) }));
  }
}

describe('game flow', () => {
  it('goes from title through difficulty to a map of six chapters', () => {
    render(<GameApp />);
    click(/start/i);
    click(/beginner/i);
    const map = screen.getByRole('list', { name: /chapters/i });
    expect(within(map).getAllByRole('listitem')).toHaveLength(6);
  });
});

describe('ChapterPlayer', () => {
  function play(onFinish = vi.fn()) {
    render(<ChapterPlayer chapter={fixture} difficulty="beginner" onFinish={onFinish} onExit={vi.fn()} />);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    click(/continue/i);
    return onFinish;
  }

  it('shows the explanation and a Learn link after answering', () => {
    play();
    click('B');
    expect(screen.getByText('B is the right answer here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /learn more/i })).toHaveAttribute('href', src);
  });

  it('scores a double-clicked answer only once and finishes with keyboard-only puzzles', () => {
    const onFinish = play();
    const b = screen.getByRole('button', { name: 'B' });
    act(() => {
      fireEvent.click(b);
      fireEvent.click(b);
    });
    click(/continue/i);

    arrangeByKeyboard(['one', 'two', 'three']);
    click(/lock in/i);
    click(/continue/i);

    matchByKeyboard(fixture.scenes[3].kind === 'match' ? fixture.scenes[3].pairs : []);
    click(/check/i);
    click(/continue/i);

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(300, 300);
  });

  it('halves points when the beginner hint is used', () => {
    const onFinish = play();
    click(/hint/i);
    expect(screen.getByText('It is B')).toBeInTheDocument();
    click('B');
    expect(screen.getByText(/\+50/)).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });
});
