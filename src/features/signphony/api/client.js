/**
 * Signphony API Client
 * Connects to the signphony backend API
 */

const API_BASE_URL = import.meta.env.VITE_SIGNPHONY_API_URL || 'http://localhost:8000/api';

class SignphonyAPI {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Health & Status
  async health() {
    return this.request('/health');
  }

  async status() {
    return this.request('/status');
  }

  // Sign Learning Game
  async getSigns(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/signs?${params}`);
  }

  async getSign(id) {
    return this.request(`/sign/${id}`);
  }

  async getRandomSign() {
    return this.request('/random-sign');
  }

  async getCategories() {
    return this.request('/categories');
  }

  async getUserProgress(userId) {
    return this.request(`/user/progress/${userId}`);
  }

  async getUserStats(userId) {
    return this.request(`/user/stats/${userId || ''}`);
  }

  async getLeaderboard() {
    return this.request('/leaderboard');
  }

  async getAchievements(userId) {
    return this.request(`/achievements/${userId}`);
  }

  async saveProgress(data) {
    return this.request('/save_progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Magic Tricks
  async getMagicTricks() {
    return this.request('/magic-tricks');
  }

  async getMagicTrick(id) {
    return this.request(`/magic-trick/${id}`);
  }

  async scoreMagicTrick(id, data) {
    return this.request(`/magic-trick/${id}/score`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Translator
  async translate(text) {
    return this.request('/translate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async translateBatch(texts) {
    return this.request('/translate/batch', {
      method: 'POST',
      body: JSON.stringify({ texts }),
    });
  }

  async getGlossMap() {
    return this.request('/translate/gloss-map');
  }

  async getAvailableSigns() {
    return this.request('/translate/available-signs');
  }

  async getSignStats() {
    return this.request('/translate/sign-stats');
  }

  async searchSigns(query) {
    return this.request(`/translate/search?q=${encodeURIComponent(query)}`);
  }

  // Speech
  async getSpeech(word) {
    return this.request(`/speech/${word}`);
  }

  async getSpeechAudio(word) {
    return `${this.baseURL}/speech/audio/${word}`;
  }

  async getVocalTract(word) {
    return this.request(`/speech/vocal-tract/${word}`);
  }

  async getSignSpeech(signId) {
    return this.request(`/sign/${signId}/speech`);
  }

  // Video
  getReferenceVideoURL(signId) {
    return `${this.baseURL}/reference_video/${signId}`;
  }
}

export const signphonyApi = new SignphonyAPI();
export default signphonyApi;
