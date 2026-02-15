import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import QuestionLevel from '../components/UnitPlayer/QuestionLevel';

describe('QuestionLevel', () => {
  it('shows alert when answer is empty', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(
      <QuestionLevel
        level={{
          question_type: 'fill',
          title: 'Q',
          content: 'Fill',
          correctAnswer: 'as',
        }}
        onComplete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Check Answer'));
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('mcq: correct answer path', () => {
    const onComplete = vi.fn();
    render(
      <QuestionLevel
        level={{
          question_type: 'mcq',
          title: 'MCQ',
          content: 'Pick',
          options: ['A', 'B'],
          correctAnswer: 1,
        }}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByText('B'));
    fireEvent.click(screen.getByText('Check Answer'));
    expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));
    expect(onComplete).toHaveBeenCalledWith(true);
  });

  it('fill: incorrect then try again', () => {
    const onComplete = vi.fn();
    render(
      <QuestionLevel
        level={{
          question_type: 'fill',
          title: 'Fill',
          content: 'Type',
          correctAnswer: 'as',
        }}
        onComplete={onComplete}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Type your answer...'), {
      target: { value: 'no' },
    });
    fireEvent.click(screen.getByText('Check Answer'));
    expect(screen.getByText(/Incorrect/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByPlaceholderText('Type your answer...')).toHaveValue('');

    fireEvent.change(screen.getByPlaceholderText('Type your answer...'), {
      target: { value: 'as' },
    });
    fireEvent.click(screen.getByText('Check Answer'));
    fireEvent.click(screen.getByText('Continue'));
    expect(onComplete).toHaveBeenCalledWith(true);
  });

  it('renders fallback for unknown question type', () => {
    render(
      <QuestionLevel
        level={{ question_type: 'unknown', title: 'X', content: 'Y', correctAnswer: '' }}
        onComplete={vi.fn()}
      />
    );
    expect(screen.getByText(/Unknown question type/i)).toBeInTheDocument();
  });
});

