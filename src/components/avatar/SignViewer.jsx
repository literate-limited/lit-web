import { useState, useEffect, useRef } from 'react';
import './SignTranslator.css';

export default function SignViewer() {
  const [signs, setSigns] = useState([]);
  const [selectedSign, setSelectedSign] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const canvasRef = useRef(null);
  const avatarControllerRef = useRef(null);

  // Initialize avatar on mount
  useEffect(() => {
    const initAvatar = async () => {
      try {
        const { default: AvatarController } = await import('./avatar-controller.js');
        const controller = new AvatarController(canvasRef.current);
        await controller.init();

        // Load the actual human model
        try {
          await controller.loadAvatar('/breeeeeeeeahnah.glb');
          console.log('✓ Human avatar loaded!');
        } catch (err) {
          console.warn('Could not load avatar model:', err);
        }

        avatarControllerRef.current = controller;
        console.log('✓ Avatar system initialized');
      } catch (err) {
        console.error('Avatar init failed:', err);
        setError('Avatar init failed: ' + err.message);
      }
    };
    
    setTimeout(initAvatar, 100);
    
    return () => {
      if (avatarControllerRef.current) {
        try {
          avatarControllerRef.current.dispose();
        } catch (e) {
          console.warn('Error disposing avatar:', e);
        }
      }
    };
  }, []);

  // Load available signs
  useEffect(() => {
    const loadSigns = async () => {
      try {
        const response = await fetch('https://signphony-api-production.up.railway.app/api/translate/signs');
        const data = await response.json();
        if (data.success && data.signs) {
          setSigns(data.signs.slice(0, 50)); // First 50 for demo
        }
      } catch (err) {
        console.warn('Using fallback signs list with REAL poses');
        // Real Auslan signs we have pose data for
        setSigns([
          'about', 'above', 'abroad', 'absent', 'absolutely',
          'absorb', 'abstract', 'abuse', 'accept', 'access',
          'accident', 'baby', 'back', 'background', 'bad',
          'balance', 'ball', 'banana', 'bank', 'bar',
          'basketball', 'bath', 'battery', 'beautiful', 'because',
          'bed', 'beer', 'before', 'begin', 'believe',
          'best', 'better', 'big', 'bike', 'bird',
          'birthday', 'black', 'blue', 'boat', 'book',
          'bottle', 'boy', 'bread', 'break', 'breakfast',
          'bridge', 'bring', 'brother', 'brown', 'build'
        ]);
      }
    };

    loadSigns();
  }, []);

  const playSign = async (sign) => {
    if (!avatarControllerRef.current) {
      setError('Avatar not ready');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const signWord = typeof sign === 'string' ? sign : sign.name;
      console.log(`Loading pose data for: ${signWord}`);

      // Load actual pose data from API
      const response = await fetch(`https://signphony-api-production.up.railway.app/api/translate/pose/${signWord}`);
      const data = await response.json();

      if (data.success && data.frames) {
        console.log(`✓ Loaded ${data.total_frames} frames of pose data`);

        // Play the animation with real pose data
        const controller = avatarControllerRef.current;
        if (controller.playPoseSequence) {
          await controller.playPoseSequence(data.frames, 1.0);
        }
      } else {
        throw new Error('Failed to load pose data');
      }

      setSelectedSign(sign);
    } catch (err) {
      console.error('Error playing sign:', err);
      setError('Error playing sign: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Auslan Sign Viewer</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
        {/* Sign List */}
        <div style={{ 
          border: '1px solid #ddd', 
          padding: '15px', 
          borderRadius: '8px',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <h2 style={{ marginTop: 0 }}>Dictionary ({signs.length})</h2>
          {signs.map((sign, idx) => (
            <button
              key={idx}
              onClick={() => playSign(sign)}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                margin: '5px 0',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                backgroundColor: selectedSign === sign ? '#4F46E5' : 'white',
                color: selectedSign === sign ? 'white' : 'black'
              }}
            >
              {typeof sign === 'string' ? sign : (sign.gloss || sign.name || `Sign ${idx}`)}
            </button>
          ))}
        </div>

        {/* Avatar Display */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h2 style={{ marginTop: 0 }}>3D Avatar</h2>
          <canvas 
            ref={canvasRef}
            style={{
              width: '100%',
              height: '500px',
              backgroundColor: '#0f172a',
              borderRadius: '4px'
            }}
          />
          {selectedSign && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <strong>Current Sign:</strong> {typeof selectedSign === 'string' ? selectedSign : (selectedSign.gloss || selectedSign.name)}
            </div>
          )}
          {error && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#fee',
              borderRadius: '4px',
              color: '#c00'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
