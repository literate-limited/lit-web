import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LessonLevel from '../components/UnitPlayer/LessonLevel';

describe('LessonLevel', () => {
  it('advances from continue to next level', () => {
    const onComplete = vi.fn();
    render(
      <LessonLevel
        level={{ title: 'Title', content: '<p>Hello</p>' }}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText(/Lesson completed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Next Level'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

