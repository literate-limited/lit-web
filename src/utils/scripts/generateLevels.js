// utils/generateLevels.js
// --------------------------------------------------------------
// Generates a batch of “vocalizing” levels by chaining 4 requests:
// 1. GET  /next-level?language=…            → next level number
// 2. POST /create-level                     → blank level (vocalizing)
// 3. POST /levels/generate-sentence         → sentence from OpenAI
// 4. PUT  /levels/update-text/:id           → save sentence to level
// --------------------------------------------------------------
// Every request includes the JWT from localStorage so that admin-
// only endpoints work.   Extensive console output pinpoints the
// exact step on failure.  Feel free to trim logs in production.
// --------------------------------------------------------------

const API_URL = import.meta.env.VITE_API_URL;

/**
 * @typedef GenerateOpts
 * @prop {string} language         e.g. “en”, “hi”
 * @prop {number} count            how many levels to create
 * @prop {'short'|'long'} sentenceLength  pass‑thru to OpenAI prompt
 */

export async function generateLevels ({ language = 'en', count = 1, sentenceLength = 'short' } = /** @type {GenerateOpts} */({})) {
  console.log('[generateLevels] ⏩', { language, count, sentenceLength });

  // fresh token per call in case user logged out & back in
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No auth token in localStorage');

  // helper wraps fetch & throws on non‑2xx
  const http = async (url, opts = {}) => {
    const res = await fetch(`${API_URL}${url}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {})
      }
    });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return res.json();
  };

  for (let i = 0; i < count; i++) {
    console.log(`———— loop ${i + 1} / ${count} ————`);

    try {
      /* 1️⃣  NEXT LEVEL */
      const { nextLevel } = await http(`/next-level?language=${language}`, { method: 'GET' });
      console.log('nextLevel =', nextLevel);

      /* 2️⃣  CREATE BLANK LEVEL */
      const { newLevel } = await http('/create-level', {
        method: 'POST',
        body: JSON.stringify({ level: nextLevel, type: 'vocalizing', language })
      });
      const levelId = newLevel._id;
      console.log('created levelId =', levelId);

      /* 3️⃣  GET SENTENCE FROM BACKEND (OpenAI) */
      const { text } = await http('/levels/generate-sentence', {
        method: 'POST',
        body: JSON.stringify({ language, sentenceLength })
      });
      console.log('sentence =', text);

      /* 4️⃣  UPDATE LEVEL WITH SENTENCE */
      await http(`/levels/update-text/${levelId}`, {
        method: 'PUT',
        body: JSON.stringify({ texts: [text] })
      });
      console.log('✅ level updated:', levelId);

    } catch (err) {
      console.error('❌ generation step failed:', err.message);
      return; // stop on first failure; remove if you want to continue loops
    }
  }

  console.log('[generateLevels] 🎉 all done');
}
