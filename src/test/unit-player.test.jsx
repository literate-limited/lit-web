import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import UnitPlayer from '../components/UnitPlayer/UnitPlayer';

describe('UnitPlayer', () => {
  it('shows error when unitId is missing', async () => {
    render(<UnitPlayer unitId={undefined} user={{ id: 's1' }} onUnitComplete={vi.fn()} />);
    expect(await screen.findByText(/Failed to load unit/i)).toBeInTheDocument();
  });

  it('can exit unit immediately', async () => {
    const onUnitComplete = vi.fn();
    render(<UnitPlayer unitId="u1" user={{ id: 's1' }} onUnitComplete={onUnitComplete} />);

    expect(await screen.findByText('Present Tense: Avoir & Aller')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Exit Unit'));
    expect(onUnitComplete).toHaveBeenCalled();
  });

  it('skip advances and completes the unit', async () => {
    const onUnitComplete = vi.fn();
    render(<UnitPlayer unitId="u1" user={{ id: 's1' }} onUnitComplete={onUnitComplete} />);

    expect(await screen.findByText('Present Tense: Avoir & Aller')).toBeInTheDocument();

    // Level 1 -> 2
    fireEvent.click(screen.getByText('Skip'));
    await waitFor(() => expect(screen.getByText(/Question 1/i)).toBeInTheDocument());

    // Level 2 -> 3
    fireEvent.click(screen.getByText('Skip'));
    await waitFor(() => expect(screen.getByText(/Question 2/i)).toBeInTheDocument());

    // Level 3 -> complete
    fireEvent.click(screen.getByText('Skip'));
    expect(onUnitComplete).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'u1', skipped: true })
    );
  });
});
