import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import TeacherDashboard from '../pages/TeacherDashboard';
import { renderWithProviders } from './testUtils';

function okJson(payload) {
  return { ok: true, json: async () => payload };
}

function errText(text) {
  return { ok: false, text: async () => text };
}

describe('TeacherDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn(async (url, options = {}) => {
      const u = String(url);

      if (u.includes('/api/classes/teacher/teacher1')) {
        return okJson([]);
      }

      if (u.includes('/api/classes') && options.method === 'POST') {
        return okJson({
          id: 'c1',
          teacherId: 'teacher1',
          name: '7 A French',
          code: 'ABC123',
        });
      }

      if (u.includes('/api/classes/c1/students')) {
        return okJson([]);
      }

      if (u.includes('/api/classes/c1') && options.method === 'DELETE') {
        return okJson({ success: true });
      }

      return errText('not found');
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders empty state and can create a class', async () => {
    renderWithProviders(
      <TeacherDashboard
        user={{ id: 'teacher1', firstName: 'Test', lastName: 'Teacher', role: 'teacher' }}
        onLogout={vi.fn()}
      />
    );

    expect(await screen.findByText(/No classes yet/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('create-class-open'));
    fireEvent.change(screen.getByTestId('year-level'), { target: { value: '7' } });
    fireEvent.change(screen.getByTestId('class-identifier'), { target: { value: 'A' } });
    fireEvent.change(screen.getByTestId('subject'), { target: { value: 'French' } });
    fireEvent.click(screen.getByTestId('create-class-submit'));

    expect(await screen.findByText('Class created')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '7 A French' })).toBeInTheDocument();
  });

  it('copies join link to clipboard', async () => {
    renderWithProviders(
      <TeacherDashboard
        user={{ id: 'teacher1', firstName: 'Test', lastName: 'Teacher', role: 'teacher' }}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('create-class-open'));
    fireEvent.change(screen.getByTestId('year-level'), { target: { value: '7' } });
    fireEvent.change(screen.getByTestId('class-identifier'), { target: { value: 'A' } });
    fireEvent.change(screen.getByTestId('subject'), { target: { value: 'French' } });
    fireEvent.click(screen.getByTestId('create-class-submit'));

    const copyBtn = await screen.findByTestId('copy-join-link');
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
    expect(await screen.findByText(/Join link copied/i)).toBeInTheDocument();
  });

  it('shows a toast when loading classes fails', async () => {
    global.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/api/classes/teacher/teacher1')) return errText('nope');
      return errText('not found');
    });

    renderWithProviders(
      <TeacherDashboard
        user={{ id: 'teacher1', firstName: 'Test', lastName: 'Teacher', role: 'teacher' }}
        onLogout={vi.fn()}
      />
    );

    expect(await screen.findByText('Failed to load classes')).toBeInTheDocument();
  });

  it('program config saves system prompt to localStorage', async () => {
    global.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/api/classes/teacher/teacher1')) {
        return okJson([{ id: 'c1', name: '7 A French', code: 'ABC123' }]);
      }
      if (u.includes('/api/classes/c1/students')) return okJson([]);
      return errText('not found');
    });

    renderWithProviders(
      <TeacherDashboard
        user={{ id: 'teacher1', firstName: 'Test', lastName: 'Teacher', role: 'teacher' }}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(await screen.findByText('7 A French'));
    fireEvent.click(screen.getByTestId('program-config-toggle'));
    fireEvent.change(screen.getByTestId('system-prompt'), { target: { value: 'Be concise.' } });
    fireEvent.click(screen.getByTestId('save-prompt'));

    expect(await screen.findByText('Prompt saved')).toBeInTheDocument();
    expect(localStorage.getItem('lit:teacher:systemPrompts')).toContain('Be concise.');
  });

  it('chat units validate title, add, and remove', async () => {
    global.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/api/classes/teacher/teacher1')) {
        return okJson([{ id: 'c1', name: '7 A French', code: 'ABC123' }]);
      }
      if (u.includes('/api/classes/c1/students')) return okJson([]);
      return errText('not found');
    });

    renderWithProviders(
      <TeacherDashboard
        user={{ id: 'teacher1', firstName: 'Test', lastName: 'Teacher', role: 'teacher' }}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(await screen.findByText('7 A French'));
    fireEvent.click(screen.getByTestId('program-config-toggle'));
    fireEvent.click(screen.getByTestId('add-chat-unit'));

    fireEvent.click(screen.getByText('Add Unit'));
    expect(await screen.findByText('Please enter a unit title')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Unit Title/i), { target: { value: 'Greetings' } });
    fireEvent.change(screen.getByPlaceholderText(/Topic Tags/i), { target: { value: 'greetings,intros' } });
    fireEvent.click(screen.getByText('Add Unit'));

    expect(await screen.findByText(/Unit added/i)).toBeInTheDocument();
    expect(await screen.findByText('Greetings')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Delete unit'));
    expect(await screen.findByText('Unit removed')).toBeInTheDocument();
  });

  it('opens chat viewer even when student has no private room', async () => {
    global.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/api/classes/teacher/teacher1')) {
        return okJson([{ id: 'c1', name: '7 A French', code: 'ABC123' }]);
      }
      if (u.includes('/api/classes/c1/students')) {
        return okJson([{ id: 's1', firstName: 'Test', lastName: 'Student', enrollment_date: new Date().toISOString() }]);
      }
      return errText('not found');
    });

    renderWithProviders(
      <TeacherDashboard
        user={{ id: 'teacher1', firstName: 'Test', lastName: 'Teacher', role: 'teacher' }}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(await screen.findByText('7 A French'));
    fireEvent.click(await screen.findByTestId('view-chat'));

    expect(await screen.findByText(/No private room found/i)).toBeInTheDocument();
    expect(await screen.findByTestId('teacher-chat-viewer')).toBeInTheDocument();
    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
  });

  it('loads chat viewer messages and computes analysis badges', async () => {
    global.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/api/classes/teacher/teacher1')) {
        return okJson([{ id: 'c1', name: '7 A French', code: 'ABC123' }]);
      }
      if (u.includes('/api/classes/c1/students')) {
        return okJson([
          {
            id: 's1',
            firstName: 'Test',
            lastName: 'Student',
            enrollment_date: new Date().toISOString(),
            roomId: 'r1',
          },
        ]);
      }
      if (u.includes('/api/rooms/r1/messages') || u.includes('/api/messages/r1')) {
        return okJson([
          {
            id: 'm1',
            sender_role: 'student',
            raw_text: 'Je want',
            created_at: new Date().toISOString(),
            segments: [
              { text: 'Je', language: 'fr', is_error: 0 },
              { text: 'want', language: 'en', is_error: 1, correction: 'veux', error_type: 'vocabulary' },
            ],
          },
          {
            id: 'm2',
            sender_role: 'ai',
            raw_text: 'Tu veux aller où?',
            created_at: new Date().toISOString(),
            segments: [],
          },
        ]);
      }
      return errText('not found');
    });

    renderWithProviders(
      <TeacherDashboard
        user={{ id: 'teacher1', firstName: 'Test', lastName: 'Teacher', role: 'teacher' }}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(await screen.findByText('7 A French'));
    fireEvent.click(await screen.findByTestId('view-chat'));

    expect(await screen.findByText('want')).toBeInTheDocument();
    expect(screen.getByText(/1 error/i)).toBeInTheDocument();
    expect(screen.getByText(/50% French/i)).toBeInTheDocument();
    expect(screen.getByText(/Tu veux aller où\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => {
      expect(screen.queryByTestId('teacher-chat-viewer')).not.toBeInTheDocument();
    });
  });

  it('delete flow can cancel or confirm', async () => {
    global.fetch = vi.fn(async (url, options = {}) => {
      const u = String(url);
      if (u.includes('/api/classes/teacher/teacher1')) {
        return okJson([{ id: 'c1', name: '7 A French', code: 'ABC123' }]);
      }
      if (u.includes('/api/classes/c1/students')) return okJson([]);
      if (u.includes('/api/classes/c1') && options.method === 'DELETE') return okJson({ success: true });
      return errText('not found');
    });

    renderWithProviders(
      <TeacherDashboard
        user={{ id: 'teacher1', firstName: 'Test', lastName: 'Teacher', role: 'teacher' }}
        onLogout={vi.fn()}
      />
    );

    // Cancel
    fireEvent.click(await screen.findByLabelText('Delete class'));
    expect(await screen.findByText(/Delete Class\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText(/Delete Class\?/i)).not.toBeInTheDocument();

    // Confirm
    fireEvent.click(screen.getByLabelText('Delete class'));
    fireEvent.click(screen.getByText('Delete'));
    expect(await screen.findByText(/Class deleted/i)).toBeInTheDocument();
    expect(await screen.findByText(/No classes yet/i)).toBeInTheDocument();
  });
});
