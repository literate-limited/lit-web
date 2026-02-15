import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StudentDashboard from '../pages/StudentDashboard';

vi.mock('../components/ChatUI/ChatUI', () => {
  return {
    default: ({ onUnitAssigned }) => (
      <div>
        <div>ChatMock</div>
        <button onClick={() => onUnitAssigned?.({ unit_id: 'u1', unit_name: 'Unit 1' })}>
          AssignUnit
        </button>
      </div>
    ),
  };
});

vi.mock('../components/UnitPlayer/UnitPlayer', () => {
  return {
    default: () => <div>UnitPlayerMock</div>,
  };
});

function okJson(payload) {
  return { ok: true, json: async () => payload };
}

function errText(text) {
  return { ok: false, text: async () => text };
}

describe('StudentDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows room not found when fetch fails', async () => {
    global.fetch = vi.fn(async () => errText('nope'));

    render(
      <MemoryRouter initialEntries={['/room/r1']}>
        <Routes>
          <Route
            path="/room/:roomId"
            element={<StudentDashboard user={{ id: 's1', firstName: 'Test', lastName: 'Student' }} onLogout={vi.fn()} />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Room not found/i)).toBeInTheDocument();
  });

  it('renders chat view and can switch to unit view', async () => {
    global.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/api/rooms/r1')) {
        return okJson({ id: 'r1', className: '7 A French', language_code: 'fr' });
      }
      return errText('not found');
    });

    render(
      <MemoryRouter initialEntries={['/room/r1']}>
        <Routes>
          <Route
            path="/room/:roomId"
            element={<StudentDashboard user={{ id: 's1', firstName: 'Test', lastName: 'Student' }} onLogout={vi.fn()} />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Practice Chat/i)).toBeInTheDocument();
    expect(screen.getByText('ChatMock')).toBeInTheDocument();
    expect(screen.getByText(/Coach/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('AssignUnit'));
    expect(await screen.findByText('UnitPlayerMock')).toBeInTheDocument();
  });
});
