import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { MatchScene as Scene } from '../types';
import { Feedback } from './Feedback';
import { MatchScene } from './MatchScene';

const src = 'https://learn.microsoft.com/fabric/x';

describe('Feedback', () => {
  const base = {
    explanation: 'Because reasons.',
    source: src,
    onContinue: vi.fn(),
  };

  it('calls a correct answer spot on even when a hint halved the points', () => {
    render(<Feedback {...base} correct points={50} />);
    expect(screen.getByText(/spot on/i)).toBeInTheDocument();
    expect(screen.getByText('+50')).toBeInTheDocument();
  });

  it('calls a partial answer partly right', () => {
    render(<Feedback {...base} correct={false} points={50} />);
    expect(screen.getByText(/partly right/i)).toBeInTheDocument();
  });

  it('calls a zero-point answer not quite', () => {
    render(<Feedback {...base} correct={false} points={0} />);
    expect(screen.getByText(/not quite/i)).toBeInTheDocument();
  });
});

describe('MatchScene', () => {
  const scene: Scene = {
    kind: 'match',
    id: 'm',
    difficulties: ['beginner'],
    prompt: 'Match',
    pairs: [
      ['L1', 'R1'],
      ['L2', 'R2'],
      ['L3', 'R3'],
    ],
    explanation: 'Each left goes with its right.',
    source: src,
  };

  function Harness() {
    const [locked, setLocked] = useState(false);
    return (
      <MatchScene
        scene={scene}
        locked={locked}
        onSubmit={() => setLocked(true)}
      />
    );
  }

  const pick = (name: string) =>
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(`^${name}`) })
    );

  it('reveals the correct partner for each wrong pair after checking', () => {
    render(<Harness />);
    pick('L1');
    pick('R2');
    pick('L2');
    pick('R1');
    pick('L3');
    pick('R3');
    fireEvent.click(screen.getByRole('button', { name: /check/i }));
    expect(screen.getByText('→ R1')).toBeInTheDocument();
    expect(screen.getByText('→ R2')).toBeInTheDocument();
    expect(screen.queryByText('→ R3')).toBeNull();
  });
});
