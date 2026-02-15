import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from '../components/ui/toast/ToastProvider';

function Demo() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Saved')}>Save</button>
      <button onClick={() => toast.error('Nope')}>Fail</button>
    </div>
  );
}

describe('ToastProvider', () => {
  it('renders and dismisses a toast', () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Save'));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('auto-dismisses after duration', async () => {
    vi.useFakeTimers();

    function Auto() {
      const toast = useToast();
      return <button onClick={() => toast.info('Hi', { duration: 10 })}>Go</button>;
    }

    render(
      <ToastProvider>
        <Auto />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Go'));
    expect(screen.getByText('Hi')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(20);
    expect(screen.queryByText('Hi')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
