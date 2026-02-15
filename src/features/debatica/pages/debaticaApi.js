import { request } from '../../../api';

export const debaticaApi = {
  debates: () => request('/api/deb/debates'),
  debate: (id) => request(`/api/deb/debates/${id}`),
  createAttempt: (debateId, side) => request('/api/deb/attempts', { method: 'POST', body: JSON.stringify({ debateId, side }) }),
  attempt: (id) => request(`/api/deb/attempts/${id}`),
  attempts: () => request('/api/deb/attempts'),
  saveRounds: (id, rounds) => request(`/api/deb/attempts/${id}/rounds`, { method: 'PUT', body: JSON.stringify(rounds) }),
  submit: (id) => request(`/api/deb/attempts/${id}/submit`, { method: 'POST' })
};
