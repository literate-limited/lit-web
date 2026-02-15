import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MessageSegment from '../components/ChatUI/MessageSegment';

describe('MessageSegment', () => {
  it('flips to show correction and shows tooltip', () => {
    render(
      <MessageSegment
        segment={{
          text: 'want',
          language: 'en',
          is_error: 1,
          correction: 'veux',
          error_type: 'vocabulary',
          error_explanation: 'Use the French verb.',
        }}
      />
    );

    expect(screen.getByText('want')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('veux')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(screen.getByText(/Error:/i)).toBeInTheDocument();
  });
});

