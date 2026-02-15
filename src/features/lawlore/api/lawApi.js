const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/^[\s\S]*?(https?:\/\/)/, '$1').trim();
const isLocalHost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_URL = rawApiUrl || (isLocalHost ? 'http://localhost:3001' : 'https://api.litsuite.app');

/**
 * Lawlore API client
 */
export const lawApi = {
  /**
   * Search statutes and cases
   */
  search: async (query, filters = {}) => {
    const params = new URLSearchParams({
      q: query || '',
      type: filters.type || 'all',
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });

    if (filters.jurisdiction) params.append('jurisdiction', filters.jurisdiction);
    if (filters.yearFrom !== undefined && filters.yearFrom !== null) {
      params.append('year_from', filters.yearFrom);
    }
    if (filters.yearTo !== undefined && filters.yearTo !== null) {
      params.append('year_to', filters.yearTo);
    }

    const response = await fetch(`${API_URL}/api/law/search?${params}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Search failed');
    return response.json();
  },

  /**
   * Get statute by ID
   */
  getStatute: async (id) => {
    const response = await fetch(`${API_URL}/api/law/statutes/${id}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch statute');
    return response.json();
  },

  /**
   * Get case by ID
   */
  getCase: async (id) => {
    const response = await fetch(`${API_URL}/api/law/cases/${id}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch case');
    return response.json();
  },

  /**
   * Get citations for a statute/case
   */
  getCitations: async (id, type = 'statute', citing = true) => {
    const params = new URLSearchParams({
      type,
      citing: citing ? 'true' : 'false',
      limit: 50
    });

    const response = await fetch(`${API_URL}/api/law/citations/${id}?${params}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch citations');
    return response.json();
  },

  /**
   * Save a search (requires auth)
   */
  saveSavedSearch: async (name, query, filters = {}) => {
    const response = await fetch(`${API_URL}/api/law/saved-searches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, query, filters })
    });

    if (!response.ok) throw new Error('Failed to save search');
    return response.json();
  },

  /**
   * List user's saved searches (requires auth)
   */
  listSavedSearches: async () => {
    const response = await fetch(`${API_URL}/api/law/saved-searches`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch saved searches');
    return response.json();
  },

  /**
   * Get and re-run a saved search (requires auth)
   */
  getSavedSearch: async (id) => {
    const response = await fetch(`${API_URL}/api/law/saved-searches/${id}`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch saved search');
    return response.json();
  },

  /**
   * Delete a saved search (requires auth)
   */
  deleteSavedSearch: async (id) => {
    const response = await fetch(`${API_URL}/api/law/saved-searches/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete saved search');
    return response.json();
  },

  /**
   * Get ingestion status
   */
  getIngestionStatus: async () => {
    const response = await fetch(`${API_URL}/api/law/ingestion-status`, {
      headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch ingestion status');
    return response.json();
  }
};

/**
 * Get request headers with auth token and brand
 */
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'x-brand': 'law'
  };

  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
