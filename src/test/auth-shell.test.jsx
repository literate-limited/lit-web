import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthShell from '../components/layout/AuthShell';

describe('AuthShell', () => {
  it('renders title, subtitle, children, and footer', () => {
    render(
      <AuthShell
        title="Login"
        subtitle="Welcome back"
        footer={<div>Footer</div>}
      >
        <div>Body</div>
      </AuthShell>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect(screen.getByText('LIT')).toBeInTheDocument();
  });
});

