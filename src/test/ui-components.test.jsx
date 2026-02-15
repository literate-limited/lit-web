import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Textarea from '../components/ui/Textarea';

describe('UI primitives', () => {
  it('Button forwards props and keeps custom className', () => {
    render(
      <Button data-testid="btn" className="extra" variant="secondary" size="sm">
        Click
      </Button>
    );
    const btn = screen.getByTestId('btn');
    expect(btn).toHaveTextContent('Click');
    expect(btn.className).toContain('extra');
  });

  it('Input forwards props and keeps custom className', () => {
    render(<Input data-testid="in" className="extra" placeholder="Email" />);
    const input = screen.getByTestId('in');
    expect(input).toHaveAttribute('placeholder', 'Email');
    expect(input.className).toContain('extra');
  });

  it('Textarea forwards props and keeps custom className', () => {
    render(<Textarea data-testid="ta" className="extra" rows={4} />);
    const ta = screen.getByTestId('ta');
    expect(ta).toHaveAttribute('rows', '4');
    expect(ta.className).toContain('extra');
  });

  it('Card renders children and forwards className', () => {
    render(
      <Card data-testid="card" className="extra">
        Hello
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveTextContent('Hello');
    expect(card.className).toContain('extra');
  });

  it('Modal renders when open and closes on escape', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Title" onClose={onClose}>
        Body
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

