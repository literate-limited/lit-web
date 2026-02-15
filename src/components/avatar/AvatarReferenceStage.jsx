import React, { useEffect, useRef, useState } from 'react';
import ReferenceVideoStage from './ReferenceVideoStage';

const AvatarReferenceStage = ({ sign, signNumber, totalSigns, onReady }) => {
  const canvasContainerRef = useRef(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const controllerRef = useRef(null);

  /**
   * Load required JavaScript libraries dynamically
   */
  const loadDependencies = async () => {
    const scripts = [
      {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        name: 'THREE',
        onLoad: () => window.THREE
      },
      {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/controls/OrbitControls.js',
        name: 'OrbitControls',
        onLoad: () => window.THREE?.OrbitControls
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/three@r128/examples/js/loaders/GLTFLoader.js',
        name: 'GLTFLoader',
        onLoad: () => window.THREE?.GLTFLoader
      },
      {
        src: 'https://unpkg.com/kalidokit@1.1.5/dist/kalidokit.umd.js',
        name: 'Kalidokit',
        onLoad: () => window.Kalidokit
      },
      {
        src: '/static/avatar-viewer/pose-animator.js',
        name: 'PoseAnimator',
        onLoad: () => window.PoseAnimator
      },
      {
        src: '/static/avatar-viewer/avatar-controller.js',
        name: 'AvatarController',
        onLoad: () => window.AvatarController
      }
    ];

    for (const script of scripts) {
      if (script.onLoad()) {
        continue; // Already loaded
      }

      await new Promise((resolve, reject) => {
        const scriptElement = document.createElement('script');
        scriptElement.src = script.src;
        scriptElement.async = true;

        scriptElement.onload = () => {
          if (script.onLoad()) {
            resolve();
          } else {
            reject(new Error(`${script.name} failed to load`));
          }
        };

        scriptElement.onerror = () => {
          reject(new Error(`Failed to load ${script.src}`));
        };

        document.head.appendChild(scriptElement);
      });
    }

    console.log('All dependencies loaded successfully');
  };

  /**
   * Initialize avatar and load pose data
   */
  const initAvatar = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all dependencies
      await loadDependencies();

      // Verify container exists
      if (!canvasContainerRef.current) {
        throw new Error('Container not ready');
      }

      // Initialize avatar controller
      const controller = new window.AvatarController(
        canvasContainerRef.current,
        {
          avatarScale: 1.8,
          backgroundColor: 0x0f172a,
          enableLighting: true,
          enableControls: true
        }
      );

      controllerRef.current = controller;

      // Load avatar model
      const modelPath = '/static/avatar-viewer/models/rocketbox_adult_01.glb';
      await controller.loadAvatar(modelPath);

      // Wait a moment for rendering to stabilize
      await new Promise(r => setTimeout(r, 500));

      setAvatarLoaded(true);

      // Load and play pose data for this sign
      if (sign && sign.id) {
        const success = await controller.loadPoseData(sign.id);

        if (success && controller.getAnimator()) {
          const animator = controller.getAnimator();

          // Track loop count
          animator.onLoop = () => {
            setPlayCount(prev => prev + 1);
          };

          // Auto-play
          animator.play();
        } else {
          throw new Error('Failed to load pose data');
        }
      } else {
        throw new Error('Invalid sign data');
      }
    } catch (err) {
      console.error('Avatar initialization failed:', err);
      setError(err.message || 'Failed to initialize avatar');
      setAvatarLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize on component mount
   */
  useEffect(() => {
    if (!sign || !sign.id) {
      setError('Invalid sign data');
      return;
    }

    initAvatar();

    // Cleanup on unmount
    return () => {
      if (controllerRef.current) {
        try {
          controllerRef.current.dispose();
          controllerRef.current = null;
        } catch (err) {
          console.warn('Error disposing controller:', err);
        }
      }
    };
  }, [sign]);

  /**
   * Fallback to video if avatar fails
   */
  if (error) {
    return (
      <div className="modal-overlay active">
        <div className="modal modal-full">
          <div className="modal-header">
            <h2>Watch the Sign</h2>
            <span className="sign-counter">
              {signNumber} of {totalSigns}
            </span>
          </div>

          <div className="modal-body reference-body">
            <div className="error-message" style={{
              padding: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgb(239, 68, 68)',
              borderRadius: '8px',
              color: 'rgb(220, 38, 38)',
              marginBottom: '20px'
            }}>
              <p style={{ margin: 0, marginBottom: '10px' }}>
                Avatar display unavailable. Falling back to video...
              </p>
              <small style={{ opacity: 0.7 }}>{error}</small>
            </div>

            {/* Use video fallback */}
            <ReferenceVideoStage
              sign={sign}
              signNumber={signNumber}
              totalSigns={totalSigns}
              onReady={onReady}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay active">
      <div className="modal modal-full">
        <div className="modal-header">
          <h2>Watch the Sign</h2>
          <span className="sign-counter">
            {signNumber} of {totalSigns}
          </span>
        </div>

        <div className="modal-body reference-body">
          <div className="reference-content">
            {/* Avatar canvas */}
            <div className="avatar-wrapper large" style={{
              position: 'relative',
              width: '100%',
              height: '600px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div ref={canvasContainerRef} style={{
                width: '100%',
                height: '100%'
              }} />

              {/* Loading overlay */}
              {isLoading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(4px)'
                }}>
                  <div style={{
                    textAlign: 'center',
                    color: '#ffffff'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      marginBottom: '12px'
                    }}>Loading avatar...</div>
                    <div style={{
                      opacity: 0.7,
                      fontSize: '14px'
                    }}>This may take a moment</div>
                  </div>
                </div>
              )}
            </div>

            {/* Sign information */}
            <div className="sign-info">
              <h3 className="sign-name">
                {sign.english || sign.gloss || 'Unknown Sign'}
              </h3>
              {sign.category && (
                <p className="sign-category">
                  <span className="badge">{sign.category}</span>
                </p>
              )}
              {sign.description && (
                <p className="sign-description">{sign.description}</p>
              )}
            </div>

            {/* Play indicator */}
            <div className="play-indicator">
              <p className="small-text">
                Watch the avatar sign 2-3 times to familiarize yourself before recording.
              </p>
              <div className="play-count">
                <span className="badge-secondary">
                  Loops: <strong>{playCount}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-primary btn-large"
            onClick={onReady}
            disabled={!avatarLoaded || isLoading}
            style={{
              opacity: (!avatarLoaded || isLoading) ? 0.5 : 1,
              cursor: (!avatarLoaded || isLoading) ? 'not-allowed' : 'pointer'
            }}
          >
            <span className="btn-icon">✓</span>
            <span className="btn-text">Ready to Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarReferenceStage;
