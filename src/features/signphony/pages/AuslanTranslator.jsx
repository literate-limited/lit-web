/**
 * Auslan Translator Page
 */

import React, { useState } from 'react';
import { useSignphony } from '../hooks/useSignphony';

const AuslanTranslator = () => {
  const { api } = useSignphony();
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) return;

    try {
      setLoading(true);
      const data = await api.translate(text);
      setTranslation(data);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auslan-translator">
      <h1>🤖 Auslan Translator</h1>
      <p>Convert English text to Auslan sign sequences</p>

      <div className="translator-input">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter English text to translate..."
          rows={5}
        />
        <button onClick={handleTranslate} disabled={loading}>
          {loading ? 'Translating...' : 'Translate'}
        </button>
      </div>

      {translation && (
        <div className="translation-result">
          <h3>Gloss Sequence:</h3>
          <p>{translation.gloss}</p>

          <h3>Signs:</h3>
          <div className="signs-list">
            {translation.signs?.map((sign, idx) => (
              <div key={idx} className="sign-item">
                <strong>{sign.word}</strong>: {sign.gloss}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuslanTranslator;
