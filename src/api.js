import { getCurrentBrand } from './config/brands';

// Strip any stray characters before the URL scheme (Vercel env vars can include \n artefacts)
const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/^[\s\S]*?(https?:\/\/)/, '$1').trim();
const isBrowser = typeof window !== 'undefined';
const isLocalHost = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const API_URL = rawApiUrl || (isLocalHost ? 'http://localhost:3001' : 'https://api.litsuite.app');
export const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL || '').trim() ||
  API_URL;

/**
 * Get authentication token from localStorage.
 *
 * Canonical key is `auth_token`, but we also accept legacy keys used by
 * other auth paths (SSO uses `access_token`, older code uses `token`).
 * @returns {string|null}
 */
export function getToken() {
  return (
    localStorage.getItem('auth_token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token')
  );
}

/**
 * Store authentication token
 * @param {string} token
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Clear authentication token
 */
export function clearToken() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Get default headers with brand and auth
 * @returns {object}
 */
function getHeaders() {
  const brand = getCurrentBrand();
  const headers = {
    'Content-Type': 'application/json',
    'x-brand': brand.code
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Make an API request with standard error handling
 * @param {string} url
 * @param {object} options
 * @returns {Promise<any>}
 */
export async function request(url, options = {}) {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Auth
  signup: async (data) => {
    const result = await request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    // Store token if returned
    if (result.token) {
      setToken(result.token);
    }

    return result;
  },

  signupStudent: async (data) => {
    const result = await request('/api/auth/signup/student', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    // Store token if returned
    if (result.token) {
      setToken(result.token);
    }

    return result;
  },

  login: async (data) => {
    const result = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    // Store token if returned
    if (result.token) {
      setToken(result.token);
    }

    return result;
  },

  // Classes
  createClass: async (data) => {
    return request('/api/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getClassByCode: async (code) => {
    return request(`/api/classes/${code}`);
  },

  getTeacherClasses: async (teacherId) => {
    return request(`/api/classes/teacher/${teacherId}`);
  },

  joinClass: async (code, data) => {
    const result = await request(`/api/classes/join/${code}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    // Store token if returned
    if (result.token) {
      setToken(result.token);
    }

    return result;
  },

  deleteClass: async (classId) => {
    return request(`/api/classes/${classId}`, {
      method: 'DELETE'
    });
  },

  getClassStudents: async (classId) => {
    return request(`/api/classes/${classId}/students`);
  },

  // Rooms
  getRoomMessages: async (roomId) => {
    return request(`/api/rooms/${roomId}/messages`);
  },

  getRoomDetails: async (roomId) => {
    return request(`/api/rooms/${roomId}`);
  },

  // Curriculum
  getLanguages: async () => {
    return request('/api/curriculum/languages');
  },

  getTopics: async (language) => {
    return request(`/api/curriculum/${language}/topics`);
  },

  getTopic: async (language, topicId) => {
    return request(`/api/curriculum/${language}/topics/${topicId}`);
  },

  getRandomQuestions: async (language, count = 1, topicId = null, difficulty = null) => {
    const params = new URLSearchParams({ count });
    if (topicId) params.append('topicId', topicId);
    if (difficulty) params.append('difficulty', difficulty);
    return request(`/api/curriculum/${language}/questions/random?${params}`);
  },

  getCurriculumStatistics: async (language) => {
    return request(`/api/curriculum/${language}/statistics`);
  },

  getTopicHierarchy: async (language) => {
    return request(`/api/curriculum/${language}/hierarchy`);
  }
};

export default api;
