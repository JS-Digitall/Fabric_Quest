import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Feedback } from './Feedback';

const show = (source: string) =>
  render(
    <Feedback
      correct
      points={100}
      explanation="Because the docs say so, in some detail."
      source={source}
      onContinue={() => {}}
    />
  );

describe('Feedback source link', () => {
  it('names Microsoft Learn for Learn pages', () => {
    show('https://learn.microsoft.com/fabric/');
    expect(
      screen.getByRole('link', { name: /learn more on microsoft learn/i })
    ).toBeInTheDocument();
  });

  it('does not claim Microsoft Learn for a team’s own source', () => {
    show('https://wiki.contoso.com/onboarding');
    const link = screen.getByRole('link', { name: /read the source/i });
    expect(link).toHaveAttribute('href', 'https://wiki.contoso.com/onboarding');
    expect(screen.queryByText(/microsoft learn/i)).not.toBeInTheDocument();
  });
});
