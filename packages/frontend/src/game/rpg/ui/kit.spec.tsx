import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CommandList, PixelBar } from './kit';

const options = ['Mirroring', 'Copy job', 'Eventstreams'];

function list(onPick = vi.fn(), locked = false) {
  render(
    <CommandList
      label="Answers"
      options={options}
      picked={locked ? 0 : null}
      answer={locked ? 1 : null}
      onPick={onPick}
    />
  );
  return onPick;
}

const button = (name: string) => screen.getByRole('button', { name });

describe('CommandList', () => {
  it('names each option by its text', () => {
    list();
    for (const o of options) expect(button(o)).toBeInTheDocument();
  });

  it('moves the cursor down with ArrowDown and wraps up from the first', () => {
    list();
    button('Mirroring').focus();
    fireEvent.keyDown(button('Mirroring'), { key: 'ArrowDown' });
    expect(button('Copy job')).toHaveFocus();
    fireEvent.keyDown(button('Copy job'), { key: 'ArrowUp' });
    fireEvent.keyDown(button('Mirroring'), { key: 'ArrowUp' });
    expect(button('Eventstreams')).toHaveFocus();
  });

  it('jumps with Home and End', () => {
    list();
    button('Copy job').focus();
    fireEvent.keyDown(button('Copy job'), { key: 'End' });
    expect(button('Eventstreams')).toHaveFocus();
    fireEvent.keyDown(button('Eventstreams'), { key: 'Home' });
    expect(button('Mirroring')).toHaveFocus();
  });

  it('keeps only the active option in the tab order', () => {
    list();
    expect(button('Mirroring')).toHaveAttribute('tabindex', '0');
    expect(button('Copy job')).toHaveAttribute('tabindex', '-1');
  });

  it('picks the clicked option once', () => {
    const onPick = list();
    fireEvent.click(button('Copy job'));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(1);
  });

  it('locks and marks the right and wrong answers', () => {
    const onPick = list(vi.fn(), true);
    expect(button('Mirroring')).toBeDisabled();
    expect(button('Mirroring')).toHaveAttribute('data-state', 'wrong');
    expect(button('Copy job')).toHaveAttribute('data-state', 'right');
    fireEvent.click(button('Copy job'));
    expect(onPick).not.toHaveBeenCalled();
  });
});

describe('PixelBar', () => {
  it('is a labelled progressbar with the current value', () => {
    render(<PixelBar label="Your HP" value={60} max={100} color="#3ccf7f" />);
    const bar = screen.getByRole('progressbar', { name: 'Your HP' });
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });
});
