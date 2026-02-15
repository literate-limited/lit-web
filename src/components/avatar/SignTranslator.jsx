/**
 * SignTranslator Component
 *
 * Translates English text to Auslan sign language with 3D avatar animation
 *
 * Usage:
 *   <SignTranslator />
 */

import { useState, useEffect, useRef } from 'react';
import './SignTranslator.css';

// Dynamically load dependencies
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export default function SignTranslator() {
  const [inputText, setInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);

  const canvasRef = useRef(null);
  const avatarControllerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Load dependencies on mount
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        // Load Three.js
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
        await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');

        // Load Kalidokit (pose → bones IK)
        await loadScript('https://cdn.jsdelivr.net/npm/kalidokit@1.1.5/dist/kalidokit.umd.js');

        // Load avatar controller
        const { default: AvatarController } = await import('./avatar-controller.js');

        // Initialize avatar
        const controller = new AvatarController(canvasRef.current);
        await controller.init();
        await controller.loadAvatar('/models/rocketbox_adult_01.glb');

        avatarControllerRef.current = controller;

        console.log('✓ Avatar system initialized');
      } catch (err) {
        console.error('Failed to load avatar system:', err);
        setError('Failed to load 3D avatar system');
      }
    };

    loadDependencies();

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (avatarControllerRef.current) {
        avatarControllerRef.current.dispose();
      }
    };
  }, []);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to translate');
      return;
    }

    setIsTranslating(true);
    setError(null);
    setTranslationResult(null);

    try {
      // Call translation API
      const response = await fetch('http://localhost:5001/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const result = await response.json();
      setTranslationResult(result);

      // Auto-play animation
      playSignSequence(result);

    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const playSignSequence = async (result) => {
    if (!avatarControllerRef.current || !result.sign_sequence) {
      return;
    }

    setIsPlaying(true);
    setCurrentSignIndex(0);

    const controller = avatarControllerRef.current;
    const signs = result.sign_sequence;

    for (let i = 0; i < signs.length; i++) {
      setCurrentSignIndex(i);
      const sign = signs[i];

      if (sign.found && sign.poses) {
        // Animate this sign
        await controller.animatePoses(sign.poses, sign.duration || 1.0);

        // Transition delay
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        // Fingerspell fallback
        console.log('Fingerspelling:', sign.gloss);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsPlaying(false);
    setCurrentSignIndex(0);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <div className="sign-translator">
      <div className="translator-header">
        <h2>English to Auslan Sign Language</h2>
        <p>Type English text and see it translated to sign language</p>
      </div>

      <div className="translator-content">
        {/* Input Section */}
        <div className="input-section">
          <textarea
            className="text-input"
            placeholder="Type English text here... (e.g., 'Hello, I want coffee')"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={4}
            disabled={isTranslating}
          />

          <button
            className="translate-btn"
            onClick={handleTranslate}
            disabled={isTranslating || !inputText.trim()}
          >
            {isTranslating ? 'Translating...' : 'Translate to Signs'}
          </button>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Avatar Display */}
        <div className="avatar-section">
          <div className="avatar-canvas-wrapper">
            <canvas ref={canvasRef} className="avatar-canvas" />

            {isPlaying && translationResult && (
              <div className="playback-status">
                Sign {currentSignIndex + 1} of {translationResult.sign_sequence.length}
                <br />
                <strong>{translationResult.gloss_sequence[currentSignIndex]}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Translation Results */}
        {translationResult && (
          <div className="translation-results">
            <div className="result-section">
              <h3>Input:</h3>
              <p className="original-text">{translationResult.input}</p>
            </div>

            <div className="result-section">
              <h3>Gloss (Sign Order):</h3>
              <p className="gloss-sequence">
                {translationResult.gloss_sequence.join(' ')}
              </p>
            </div>

            {translationResult.grammar_notes && translationResult.grammar_notes.length > 0 && (
              <div className="result-section">
                <h3>Grammar Notes:</h3>
                <ul className="grammar-notes">
                  {translationResult.grammar_notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="result-section">
              <h3>Signs Found:</h3>
              <p>
                {translationResult.sign_sequence.filter(s => s.found).length} / {translationResult.sign_sequence.length}
              </p>

              <div className="sign-details">
                {translationResult.sign_sequence.map((sign, i) => (
                  <div key={i} className={`sign-item ${sign.found ? 'found' : 'missing'}`}>
                    <span className="sign-gloss">{sign.gloss}</span>
                    <span className="sign-status">
                      {sign.found ? '✓' : '⚠️ fingerspell'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="replay-btn"
              onClick={() => playSignSequence(translationResult)}
              disabled={isPlaying}
            >
              {isPlaying ? 'Playing...' : '🔄 Replay Animation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
