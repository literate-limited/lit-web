import { describe, expect, it, vi } from 'vitest';
import { api } from '../api';

describe('api', () => {
  it('throws with response text on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'nope',
    });

    await expect(api.login({ email: 'a', password: 'b' })).rejects.toThrow('nope');
  });

  it('returns parsed json on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'u1' }),
    });

    await expect(api.getRoomDetails('r1')).resolves.toEqual({ id: 'u1' });
  });
});

