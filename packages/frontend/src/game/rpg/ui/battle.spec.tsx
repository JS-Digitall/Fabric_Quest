import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Chapter, QuestionScene } from '../../types';
import { newCampaign, startBossBattle, startCreatureBattle } from '../campaign';
import { BattleScreen } from './BattleScreen';

const src = 'https://learn.microsoft.com/fabric/x';
const choice = (id: string): QuestionScene => ({
  kind: 'choice',
  id,
  difficulties: ['beginner'],
  prompt: `Question ${id}`,
  options: ['Wrong', 'Right'],
  answer: 1,
  explanation: 'Because this is how Fabric works.',
  source: src,
});
const chapter: Chapter = {
  id: 'onelake',
  title: 'One Lake',
  tagline: 't',
  scenes: [
    choice('c1'),
    {
      ...choice('b1'),
      kind: 'dashboard',
      chart: { title: 'T', x: 'k', y: 'v', rows: [{ k: 'a', v: 1 }] },
    } as QuestionScene,
    {
      ...choice('b2'),
      kind: 'dashboard',
      chart: { title: 'T', x: 'k', y: 'v', rows: [{ k: 'a', v: 1 }] },
    } as QuestionScene,
  ],
};

// The chart needs a real canvas; stand in a plain figure.
vi.mock('../../scenes/DashboardScene', () => ({
  StoryChart: () => <figure>chart</figure>,
}));

const hpOf = (name: RegExp) =>
  Number(
    screen.getByRole('progressbar', { name }).getAttribute('aria-valuenow')
  );
const click = (name: RegExp | string) =>
  fireEvent.click(screen.getByRole('button', { name }));

describe('BattleScreen', () => {
  it('wins a creature battle with a correct answer', () => {
    const c = newCampaign('beginner');
    const onEnd = vi.fn();
    render(
      <BattleScreen
        chapter={chapter}
        campaign={c}
        battle={startCreatureBattle(c, chapter, 'x1')!}
        onEnd={onEnd}
      />
    );
    click('Right');
    expect(screen.getByText('+100')).toBeInTheDocument();
    expect(hpOf(/foe hp/i)).toBe(0);
    click(/continue/i);
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ answered: { c1: 100 } }),
      'won'
    );
  });

  it('scores a double-clicked answer only once', () => {
    const c = newCampaign('beginner');
    const onEnd = vi.fn();
    render(
      <BattleScreen
        chapter={chapter}
        campaign={c}
        battle={startCreatureBattle(c, chapter, 'x1')!}
        onEnd={onEnd}
      />
    );
    const right = screen.getByRole('button', { name: 'Right' });
    act(() => {
      fireEvent.click(right);
      fireEvent.click(right);
    });
    click(/continue/i);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0][0].answered).toEqual({ c1: 100 });
  });

  it('costs 20 HP for a wrong answer', () => {
    const c = newCampaign('beginner');
    render(
      <BattleScreen
        chapter={chapter}
        campaign={c}
        battle={startCreatureBattle(c, chapter, 'x1')!}
        onEnd={vi.fn()}
      />
    );
    click('Wrong');
    expect(hpOf(/your hp/i)).toBe(80);
  });

  it('lets you flee a creature but not a boss', () => {
    const c = newCampaign('beginner');
    const onEnd = vi.fn();
    const { unmount } = render(
      <BattleScreen
        chapter={chapter}
        campaign={c}
        battle={startCreatureBattle(c, chapter, 'x1')!}
        onEnd={onEnd}
      />
    );
    click(/run away/i);
    expect(onEnd).toHaveBeenCalledWith(c, 'escaped');
    unmount();
    render(
      <BattleScreen
        chapter={chapter}
        campaign={c}
        battle={startBossBattle(c, chapter)!}
        onEnd={vi.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /run away/i })).toBeNull();
  });

  it('empties the boss HP bar when its last question is done, even after a miss', () => {
    const c = newCampaign('beginner');
    render(
      <BattleScreen
        chapter={chapter}
        campaign={c}
        battle={startBossBattle(c, chapter)!}
        onEnd={vi.fn()}
      />
    );
    click('Right');
    click(/continue/i);
    click('Wrong');
    expect(hpOf(/foe hp/i)).toBe(0);
  });

  it('moves a boss on to its next question after Continue', () => {
    const c = newCampaign('beginner');
    const onEnd = vi.fn();
    render(
      <BattleScreen
        chapter={chapter}
        campaign={c}
        battle={startBossBattle(c, chapter)!}
        onEnd={onEnd}
      />
    );
    expect(screen.getByText('Question b1')).toBeInTheDocument();
    click('Right');
    click(/continue/i);
    expect(screen.getByText('Question b2')).toBeInTheDocument();
    expect(onEnd).not.toHaveBeenCalled();
    click('Right');
    click(/continue/i);
    expect(onEnd).toHaveBeenCalledWith(
      expect.objectContaining({ bossesDefeated: ['onelake'] }),
      'won'
    );
  });
});
