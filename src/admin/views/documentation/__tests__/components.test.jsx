/**
 * Documentation Components Tests
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DatabaseLayout from '../components/DatabaseLayout';
import MigrationProgress from '../components/MigrationProgress';
import EndpointCard from '../components/EndpointCard';
import EndpointDetailPanel from '../components/EndpointDetailPanel';

describe('DatabaseLayout', () => {
  test('should render SQL panel', () => {
    render(
      <DatabaseLayout>
        <div>SQL Content</div>
      </DatabaseLayout>
    );

    expect(screen.getByText(/postgresql/i)).toBeInTheDocument();
    expect(screen.getByText(/sql content/i)).toBeInTheDocument();
  });
});

describe('MigrationProgress', () => {
  test('should render progress bar', () => {
    const status = {
      migrated: 3,
      total: 3,
      percentage: 100
    };

    render(<MigrationProgress status={status} />);

    expect(screen.getByText(/migration progress/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/3/)).toBeInTheDocument();
  });

  test('should display completion message at 100%', () => {
    const status = {
      migrated: 40,
      total: 40,
      percentage: 100
    };

    render(<MigrationProgress status={status} />);

    expect(screen.getByText(/all planned models migrated/i)).toBeInTheDocument();
  });

  test('should display remaining count when not complete', () => {
    const status = {
      migrated: 2,
      total: 3,
      percentage: 66
    };

    render(<MigrationProgress status={status} />);

    expect(screen.getByText(/1 models remaining/i)).toBeInTheDocument();
  });

  test('should render nothing if no status provided', () => {
    const { container } = render(<MigrationProgress status={null} />);

    expect(container.firstChild).toBeNull();
  });
});

describe('EndpointCard', () => {
  const mockEndpoint = {
    path: '/api/v1/users',
    methods: ['GET', 'POST'],
    domain: 'users',
    hasAuth: true
  };

  test('should render endpoint path', () => {
    render(
      <EndpointCard endpoint={mockEndpoint} isSelected={false} onClick={() => {}} />
    );

    expect(screen.getByText('/api/v1/users')).toBeInTheDocument();
  });

  test('should render HTTP method badges', () => {
    render(
      <EndpointCard endpoint={mockEndpoint} isSelected={false} onClick={() => {}} />
    );

    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
  });

  test('should show auth badge when hasAuth is true', () => {
    render(
      <EndpointCard endpoint={mockEndpoint} isSelected={false} onClick={() => {}} />
    );

    expect(screen.getByText(/🔒 auth/i)).toBeInTheDocument();
  });

  test('should not show auth badge when hasAuth is false', () => {
    const endpoint = { ...mockEndpoint, hasAuth: false };
    render(
      <EndpointCard endpoint={endpoint} isSelected={false} onClick={() => {}} />
    );

    expect(screen.queryByText(/auth/i)).not.toBeInTheDocument();
  });

  test('should handle click', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <EndpointCard endpoint={mockEndpoint} isSelected={false} onClick={handleClick} />
    );

    await user.click(container.firstChild);

    expect(handleClick).toHaveBeenCalledWith(mockEndpoint);
  });

  test('should show selected styling', () => {
    const { container } = render(
      <EndpointCard endpoint={mockEndpoint} isSelected={true} onClick={() => {}} />
    );

    expect(container.firstChild).toHaveClass('bg-blue-50');
  });
});

describe('EndpointDetailPanel', () => {
  const mockEndpoint = {
    path: '/api/v1/users/:id',
    methods: ['GET', 'PUT', 'DELETE'],
    domain: 'users',
    hasAuth: true,
    middlewares: ['authenticate', 'authorize'],
    handler: 'getUserById'
  };

  test('should show message when no endpoint selected', () => {
    render(<EndpointDetailPanel endpoint={null} />);

    expect(screen.getByText(/select an endpoint/i)).toBeInTheDocument();
  });

  test('should display endpoint details', () => {
    render(<EndpointDetailPanel endpoint={mockEndpoint} />);

    expect(screen.getByText('/api/v1/users/:id')).toBeInTheDocument();
    expect(screen.getByText('users')).toBeInTheDocument();
  });

  test('should show auth requirement', () => {
    render(<EndpointDetailPanel endpoint={mockEndpoint} />);

    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  test('should display middleware chain', () => {
    render(<EndpointDetailPanel endpoint={mockEndpoint} />);

    expect(screen.getByText(/middleware chain/i)).toBeInTheDocument();
    expect(screen.getByText('authenticate')).toBeInTheDocument();
    expect(screen.getByText('authorize')).toBeInTheDocument();
  });

  test('should display handler function', () => {
    render(<EndpointDetailPanel endpoint={mockEndpoint} />);

    expect(screen.getByText('getUserById')).toBeInTheDocument();
  });
});
