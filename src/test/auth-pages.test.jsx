import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import JoinClass from '../pages/JoinClass';
import Login from '../pages/Login';
import Signup from '../pages/Signup';

function mockFetch(handler) {
  global.fetch = vi.fn(async (url, options = {}) => handler(String(url), options));
}

function okJson(payload) {
  return { ok: true, json: async () => payload };
}

function errText(text) {
  return { ok: false, text: async () => text };
}

describe('Auth pages', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Teacher signup navigates to dashboard on success', async () => {
    const onLogin = vi.fn();

    mockFetch((url) => {
      if (url.includes('/api/auth/signup')) {
        return okJson({ id: 't1', role: 'teacher', firstName: 'Test', lastName: 'Teacher' });
      }
      return errText('not found');
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<Signup onLogin={onLogin} />} />
          <Route path="/teacher-dashboard" element={<div>TeacherDash</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Teacher' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 't@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'pass123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('TeacherDash')).toBeInTheDocument();
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ id: 't1', role: 'teacher' })
    );
  });

  it('Login shows error on invalid credentials', async () => {
    const onLogin = vi.fn();

    mockFetch((url) => {
      if (url.includes('/api/auth/login')) return errText('bad');
      return errText('not found');
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login onLogin={onLogin} />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 't@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('JoinClass loads class by code and navigates to room on success', async () => {
    const onLogin = vi.fn();

    mockFetch((url) => {
      if (url.endsWith('/api/classes/ABC123')) {
        return okJson({ id: 'c1', name: '7 A French', code: 'ABC123' });
      }
      if (url.includes('/api/classes/join/ABC123')) {
        return okJson({
          student: { id: 's1', role: 'student', firstName: 'Test', lastName: 'Student' },
          classData: { id: 'c1', name: '7 A French', code: 'ABC123' },
          roomId: 'room1',
        });
      }
      return errText('not found');
    });

    render(
      <MemoryRouter initialEntries={['/join/ABC123']}>
        <Routes>
          <Route path="/join/:code" element={<JoinClass onLogin={onLogin} />} />
          <Route path="/room/:roomId" element={<div>RoomReady</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/You're joining 7 A French/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Student' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 's@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'pass123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Join Class' }));

    expect(await screen.findByText('RoomReady')).toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem('lastRoomId')).toBe('room1');
    });
    expect(localStorage.getItem('classData')).toContain('ABC123');
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's1', role: 'student' })
    );
  });
});
