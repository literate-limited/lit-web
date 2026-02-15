import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../components/ChatUI/ChatUI', () => {
  return { default: () => <div>ChatMock</div> };
});

function okJson(payload) {
  return { ok: true, json: async () => payload };
}

function errText(text) {
  return { ok: false, text: async () => text };
}

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    global.fetch = vi.fn(async (url, options = {}) => {
      const u = String(url);
      if (u.includes('/api/classes/teacher/t1')) return okJson([]);
      if (u.includes('/api/classes/') && u.includes('/students')) return okJson([]);
      if (u.includes('/api/rooms/r1')) return okJson({ id: 'r1', className: 'Class', language_code: 'fr' });
      if (options.method === 'DELETE') return okJson({ success: true });
      return errText('not found');
    });
  });

  it('redirects anonymous users to login', async () => {
    window.history.pushState({}, '', '/');
    const App = (await import('../App')).default;
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('redirects teachers to teacher dashboard', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 't1', role: 'teacher', firstName: 'T', lastName: 'L' })
    );

    window.history.pushState({}, '', '/');
    const App = (await import('../App')).default;
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Teacher Dashboard/i })).toBeInTheDocument();
    expect(await screen.findByText(/No classes yet/i)).toBeInTheDocument();
  });

  it('redirects students to last room when present', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 's1', role: 'student', firstName: 'S', lastName: 'L' })
    );
    localStorage.setItem('lastRoomId', 'r1');

    window.history.pushState({}, '', '/');
    const App = (await import('../App')).default;
    render(<App />);

    expect(await screen.findByText(/Practice Chat/i)).toBeInTheDocument();
    expect(screen.getByText('ChatMock')).toBeInTheDocument();
  });
});
