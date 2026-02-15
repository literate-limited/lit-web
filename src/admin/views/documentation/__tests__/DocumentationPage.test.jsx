/**
 * DocumentationPage Tests
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentationPage from '../DocumentationPage';

// Mock the tab components
vi.mock('../DataTab', () => ({
  default: function MockDataTab() {
    return <div data-testid="data-tab">Data Tab Content</div>;
  }
}));

vi.mock('../APIsTab', () => ({
  default: function MockAPIsTab() {
    return <div data-testid="apis-tab">APIs Tab Content</div>;
  }
}));

describe('DocumentationPage', () => {
  test('should render with Data tab active by default', () => {
    render(<DocumentationPage />);

    expect(screen.getByTestId('data-tab')).toBeInTheDocument();
  });

  test('should render tab navigation buttons', () => {
    render(<DocumentationPage />);

    expect(screen.getByRole('button', { name: /data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apis/i })).toBeInTheDocument();
  });

  test('should switch to APIs tab when clicked', async () => {
    const user = userEvent.setup();
    render(<DocumentationPage />);

    const apisButton = screen.getByRole('button', { name: /apis/i });
    await user.click(apisButton);

    expect(screen.getByTestId('apis-tab')).toBeInTheDocument();
  });

  test('should switch back to Data tab when clicked', async () => {
    const user = userEvent.setup();
    render(<DocumentationPage />);

    // Switch to APIs
    await user.click(screen.getByRole('button', { name: /apis/i }));
    expect(screen.getByTestId('apis-tab')).toBeInTheDocument();

    // Switch back to Data
    await user.click(screen.getByRole('button', { name: /data/i }));
    expect(screen.getByTestId('data-tab')).toBeInTheDocument();
  });

  test('should apply active tab styling', async () => {
    const user = userEvent.setup();
    render(<DocumentationPage />);

    const dataButton = screen.getByRole('button', { name: /data/i });
    const apisButton = screen.getByRole('button', { name: /apis/i });

    // Data tab should be active initially
    expect(dataButton).toHaveClass('border-blue-500');

    // Switch to APIs
    await user.click(apisButton);

    // APIs should be active now
    expect(apisButton).toHaveClass('border-blue-500');
  });
});
