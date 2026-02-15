import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ToastProvider } from '../components/ui/toast/ToastProvider';

const ioMock = vi.fn();

vi.mock('socket.io-client', () => ({ io: (...args) => ioMock(...args) }));

function okJson(payload) {
  return { ok: true, json: async () => payload };
}

function createSocketStub() {
  const handlers = new Map();
  const socket = {
    on: vi.fn((event, cb) => {
      handlers.set(event, cb);
      return socket;
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    __trigger: (event, payload) => {
      const cb = handlers.get(event);
      if (cb) cb(payload);
    },
  };
  return socket;
}

describe('ChatUI', () => {
  it('connects socket, joins room, and sends messages', async () => {
    const ChatUI = (await import('../components/ChatUI/ChatUI')).default;
    const socket = createSocketStub();
    ioMock.mockReturnValue(socket);

    global.fetch = vi.fn(async (url) => {
      const u = String(url);
      if (u.includes('/api/rooms/room1/messages') || u.includes('/api/messages/room1')) {
        return okJson([]);
      }
      return okJson({}); // keep it permissive for this test
    });

    render(
      <ToastProvider>
        <ChatUI
          roomId="room1"
          user={{ id: 's1', firstName: 'Test', lastName: 'Student' }}
          targetLanguage="fr"
        />
      </ToastProvider>
    );

    // Simulate socket connection
    socket.__trigger('connect');

    await waitFor(() => {
      expect(socket.emit).toHaveBeenCalledWith(
        'join_room',
        expect.objectContaining({ roomId: 'room1', userId: 's1' })
      );
    });

    // Send a message
    fireEvent.change(screen.getByTestId('chat-input'), { target: { value: 'Bonjour' } });
    fireEvent.click(screen.getByTestId('chat-send'));

    expect(socket.emit).toHaveBeenCalledWith(
      'send_message',
      expect.objectContaining({ roomId: 'room1', content: 'Bonjour', targetLanguage: 'fr' })
    );

    // Incoming messages render
    socket.__trigger('student_message', {
      id: 'm1',
      sender_role: 'student',
      raw_text: 'Bonjour',
      created_at: new Date().toISOString(),
      segments: [],
      analysis: { error_count: 0, language_distribution: { target_language_pct: 1, l1_pct: 0 } },
    });

    expect(await screen.findAllByText('Bonjour')).not.toHaveLength(0);

    socket.__trigger('ai_message', {
      id: 'm2',
      sender_role: 'ai',
      raw_text: 'Salut!',
      created_at: new Date().toISOString(),
      segments: [],
    });

    expect(await screen.findByText('Salut!')).toBeInTheDocument();
  });
});
