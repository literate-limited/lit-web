/**
 * TeleprompTV API Client
 *
 * All API calls for TTV features.
 * Uses the main API client configuration from src/api.js
 */

import { request } from '../../api.js';

const BASE_URL = '/api/ttv';

// ============================================================================
// SCRIPTS
// ============================================================================

export const scripts = {
  create: (data) => request(`${BASE_URL}/scripts`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`${BASE_URL}/scripts${queryString ? '?' + queryString : ''}`);
  },

  get: (id) => request(`${BASE_URL}/scripts/${id}`),

  update: (id, data) => request(`${BASE_URL}/scripts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  delete: (id) => request(`${BASE_URL}/scripts/${id}`, {
    method: 'DELETE'
  }),

  generate: (data) => request(`${BASE_URL}/scripts/generate`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getCuts: (scriptId) => request(`${BASE_URL}/scripts/${scriptId}/cuts`),

  createCut: (scriptId, data) => request(`${BASE_URL}/scripts/${scriptId}/cuts`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateCut: (cutId, data) => request(`${BASE_URL}/cuts/${cutId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  deleteCut: (cutId) => request(`${BASE_URL}/cuts/${cutId}`, {
    method: 'DELETE'
  }),

  reorderCuts: (scriptId, cutIds) => request(`${BASE_URL}/scripts/${scriptId}/cuts/reorder`, {
    method: 'POST',
    body: JSON.stringify({ cutIds })
  })
};

// ============================================================================
// VIDEOS
// ============================================================================

export const videos = {
  getUploadUrl: (fileName) => request(`${BASE_URL}/videos/upload-url`, {
    method: 'POST',
    body: JSON.stringify({ fileName })
  }),

  upload: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('video', file);

    // Note: For progress tracking, we'd need to use XMLHttpRequest
    // For simplicity, using fetch here
    const response = await fetch(`${import.meta.env.VITE_API_URL}${BASE_URL}/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'x-brand': 'ttv'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  finalize: (data) => request(`${BASE_URL}/videos/finalize`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`${BASE_URL}/videos${queryString ? '?' + queryString : ''}`);
  },

  get: (id) => request(`${BASE_URL}/videos/${id}`),

  delete: (id) => request(`${BASE_URL}/videos/${id}`, {
    method: 'DELETE'
  }),

  transcribe: (id, language = 'en') => request(`${BASE_URL}/videos/${id}/transcribe`, {
    method: 'POST',
    body: JSON.stringify({ language })
  }),

  getTranscript: (id) => request(`${BASE_URL}/videos/${id}/transcript`),

  getSubtitles: (id, format = 'vtt') => request(`${BASE_URL}/videos/${id}/subtitles?format=${format}`)
};

// ============================================================================
// EXPORTS
// ============================================================================

export const exports = {
  start: (data) => request(`${BASE_URL}/exports`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  get: (id) => request(`${BASE_URL}/exports/${id}`),

  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`${BASE_URL}/exports${queryString ? '?' + queryString : ''}`);
  }
};

// ============================================================================
// PUBLISHING
// ============================================================================

export const publish = {
  start: (data) => request(`${BASE_URL}/publish`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  get: (id) => request(`${BASE_URL}/publish/${id}`)
};

// ============================================================================
// ANALYTICS
// ============================================================================

export const analytics = {
  track: (eventType, eventData = {}) => request(`${BASE_URL}/analytics`, {
    method: 'POST',
    body: JSON.stringify({ eventType, eventData })
  }),

  get: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`${BASE_URL}/analytics${queryString ? '?' + queryString : ''}`);
  }
};

// ============================================================================
// CREDITS
// ============================================================================

export const credits = {
  getBalance: () => request(`${BASE_URL}/credits/balance`),

  getHistory: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`${BASE_URL}/credits/history${queryString ? '?' + queryString : ''}`);
  }
};

export default {
  scripts,
  videos,
  exports,
  publish,
  analytics,
  credits
};
