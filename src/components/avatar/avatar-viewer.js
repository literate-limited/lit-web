/**
 * Avatar Viewer - Main Application
 * Three.js-based sign language animation viewer with MediaPipe pose visualization
 */

class AvatarViewer {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.avatar = null;
        this.skeleton = null;
        this.poseRenderer = null;
        this.playbackControls = null;
        
        this.viewMode = 'both'; // 'avatar', 'skeleton', 'both'
        this.isLoading = false;
        
        // Sample EAT sign pose data (30 frames)
        this.sampleData = this.generateSampleEatSign();
        
        this.init();
    }

    init() {
        this.setupThreeJS();
        this.setupLighting();
        this.setupEnvironment();
        this.setupPoseRenderer();
        this.setupPlaybackControls();
        this.setupEventListeners();
        this.setupAPI();
        
        // Load sample data initially
        this.loadSampleData();
        
        // Start render loop
        this.animate();
    }

    // ===== Three.js Setup =====

    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.fog = new THREE.Fog(0x0f172a, 10, 50);

        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 1.5, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Orbit Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
        this.controls.target.set(0, 1, 0);
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x88ccff, 0.4);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Rim light for better silhouette
        const rimLight = new THREE.SpotLight(0xff8800, 0.5);
        rimLight.position.set(0, 5, -5);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);
    }

    setupEnvironment() {
        // Grid helper
        const gridHelper = new THREE.GridHelper(20, 20, 0x475569, 0x334155);
        this.scene.add(gridHelper);

        // Ground plane (invisible but receives shadows)
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }

    setupPoseRenderer() {
        this.poseRenderer = new PoseRenderer(this.scene, {
            landmarkSize: 0.04,
            landmarkColor: 0x00ff88,
            connectionColor: 0x4488ff,
            showLandmarks: true,
            showConnections: true
        });
    }

    setupPlaybackControls() {
        this.playbackControls = new PlaybackControls({
            fps: 30,
            defaultSpeed: 1.0
        });

        // Set up callbacks
        this.playbackControls.onFrame = (frame) => {
            this.onFrame(frame);
        };

        this.playbackControls.onSeek = (frame) => {
            this.onFrame(frame);
        };

        this.playbackControls.onStop = () => {
            this.onFrame(0);
        };
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // View mode change
        document.addEventListener('viewmodechange', (e) => {
            this.setViewMode(e.detail.mode);
        });

        // UI Controls
        this.bindUIControls();
    }

    bindUIControls() {
        // Translation
        const btnTranslate = document.getElementById('btn-translate');
        const inputText = document.getElementById('input-text');

        if (btnTranslate && inputText) {
            btnTranslate.addEventListener('click', () => {
                const text = inputText.value.trim();
                if (text) {
                    this.translate(text);
                }
            });

            inputText.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const text = inputText.value.trim();
                    if (text) {
                        this.translate(text);
                    }
                }
            });
        }

        // Avatar loading
        const btnLoadAvatar = document.getElementById('btn-load-avatar');
        const avatarFileInput = document.getElementById('avatar-file-input');

        if (btnLoadAvatar && avatarFileInput) {
            btnLoadAvatar.addEventListener('click', () => {
                avatarFileInput.click();
            });

            avatarFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.loadAvatarFromFile(file);
                }
            });
        }

        // Show landmarks toggle
        const chkShowLandmarks = document.getElementById('chk-show-landmarks');
        if (chkShowLandmarks) {
            chkShowLandmarks.addEventListener('change', (e) => {
                if (this.poseRenderer) {
                    this.poseRenderer.setLandmarksVisible(e.target.checked);
                }
            });
        }

        // Error dismiss
        const btnDismissError = document.getElementById('btn-dismiss-error');
        if (btnDismissError) {
            btnDismissError.addEventListener('click', () => {
                this.hideError();
            });
        }

        // Settings button (placeholder for future settings modal)
        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                this.showNotification('Settings panel coming soon!');
            });
        }
    }

    setupAPI() {
        this.apiBaseUrl = '/api';
        this.apiTimeout = 30000; // 30 seconds
    }

    // ===== Animation & Rendering =====

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update controls
        if (this.controls) {
            this.controls.update();
        }

        // Update avatar animation if loaded
        if (this.avatar && this.mixer) {
            const delta = 0.016; // Approximate 60fps
            this.mixer.update(delta);
        }

        // Render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    onFrame(frame) {
        const poseData = this.playbackControls.getPoseAtFrame(frame);
        if (poseData && poseData.landmarks) {
            this.poseRenderer.updatePose(poseData.landmarks);
            this.updateAvatarFromPose(poseData.landmarks);
        }
    }

    // ===== Avatar Loading =====

    loadAvatarFromFile(file) {
        this.showLoading('Loading avatar...');

        const url = URL.createObjectURL(file);
        this.loadAvatar(url, () => {
            URL.revokeObjectURL(url);
            this.hideLoading();
        }, (error) => {
            URL.revokeObjectURL(url);
            this.hideLoading();
            this.showError(`Failed to load avatar: ${error.message}`);
        });
    }

    loadAvatar(url, onSuccess, onError) {
        const loader = new THREE.GLTFLoader();
        
        loader.load(
            url,
            (gltf) => {
                // Remove existing avatar
                if (this.avatar) {
                    this.scene.remove(this.avatar);
                }

                this.avatar = gltf.scene;
                
                // Configure avatar
                this.avatar.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Scale and position
                const box = new THREE.Box3().setFromObject(this.avatar);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                
                const scale = 1.8 / size.y; // Scale to approximately 1.8 units tall
                this.avatar.scale.setScalar(scale);
                this.avatar.position.sub(center.multiplyScalar(scale));
                this.avatar.position.y += 0.9; // Keep on ground

                this.scene.add(this.avatar);

                // Set up animation mixer
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.avatar);
                }

                this.setViewMode(this.viewMode);
                
                if (onSuccess) onSuccess();
            },
            (progress) => {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                this.updateLoadingText(`Loading avatar... ${percent}%`);
            },
            (error) => {
                console.error('Error loading avatar:', error);
                if (onError) onError(error);
            }
        );
    }

    updateAvatarFromPose(landmarks) {
        // This is a simplified example of pose-to-avatar mapping
        // In a production system, you'd use inverse kinematics (IK)
        // to properly map MediaPipe landmarks to avatar joints
        
        if (!this.avatar || !landmarks) return;

        // Find key landmarks
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];
        const leftElbow = landmarks[13];
        const rightElbow = landmarks[14];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        // Simple visualization: move debug spheres to wrist positions
        // In a full implementation, this would rotate avatar joints
    }

    setViewMode(mode) {
        this.viewMode = mode;

        const avatarVisible = mode === 'avatar' || mode === 'both';
        const skeletonVisible = mode === 'skeleton' || mode === 'both';

        if (this.avatar) {
            this.avatar.visible = avatarVisible;
        }

        if (this.poseRenderer) {
            this.poseRenderer.setVisible(skeletonVisible);
        }
    }

    // ===== API Integration =====

    async translate(text) {
        this.showLoading('Translating...');

        try {
            const languageSelect = document.getElementById('language-select');
            const language = languageSelect ? languageSelect.value : 'ase';

            const response = await fetch(`${this.apiBaseUrl}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    target_language: language
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            this.loadAnimation(data);
            this.hideLoading();
            this.showNotification('Translation complete!');

        } catch (error) {
            console.error('Translation error:', error);
            this.hideLoading();
            
            // For demo purposes, load sample data on API failure
            this.showError(`API Error: ${error.message}. Loading sample data.`);
            setTimeout(() => {
                this.loadSampleData();
                this.hideError();
            }, 2000);
        }
    }

    loadAnimation(data) {
        // Extract pose sequence and glosses from API response
        const poseSequence = data.pose_sequence || data.frames || [];
        const glosses = data.glosses || [];

        if (poseSequence.length === 0) {
            this.showError('No pose data received');
            return;
        }

        // Update playback controls with new data
        this.playbackControls.loadPoseSequence(poseSequence, glosses);

        // Display pose data info
        this.updatePoseDataDisplay(poseSequence);

        // Reset to first frame
        this.onFrame(0);
    }

    loadSampleData() {
        this.playbackControls.loadPoseSequence(
            this.sampleData.frames,
            this.sampleData.glosses
        );
        this.updatePoseDataDisplay(this.sampleData.frames);
        this.onFrame(0);
    }

    updatePoseDataDisplay(frames) {
        const poseDataDiv = document.getElementById('pose-data');
        if (!poseDataDiv) return;

        if (frames.length === 0) {
            poseDataDiv.innerHTML = '<p class="empty-state">No pose data loaded</p>';
            return;
        }

        const currentFrame = this.playbackControls ? this.playbackControls.getCurrentFrame() : 0;
        const frame = frames[currentFrame] || frames[0];

        let html = `
            <div class="pose-frame-info">
                <div><strong>Total Frames:</strong> ${frames.length}</div>
                <div><strong>Frame Rate:</strong> 30 FPS</div>
                <div><strong>Duration:</strong> ${(frames.length / 30).toFixed(2)}s</div>
                <div><strong>Landmarks:</strong> ${frame.landmarks ? frame.landmarks.length : 0} points</div>
            </div>
        `;

        if (frame.landmarks && frame.landmarks.length > 0) {
            html += '<div class="pose-landmarks">';
            const keyLandmarks = [
                { idx: 0, name: 'Nose' },
                { idx: 11, name: 'L-Shoulder' },
                { idx: 12, name: 'R-Shoulder' },
                { idx: 15, name: 'L-Wrist' },
                { idx: 16, name: 'R-Wrist' }
            ];
            
            keyLandmarks.forEach(({ idx, name }) => {
                const lm = frame.landmarks[idx];
                if (lm) {
                    html += `
                        <div class="landmark-item">
                            <span class="landmark-name">${name}:</span>
                            <span class="landmark-value">
                                ${lm.x.toFixed(2)}, ${lm.y.toFixed(2)}
                            </span>
                        </div>
                    `;
                }
            });
            html += '</div>';
        }

        poseDataDiv.innerHTML = html;
    }

    // ===== Sample Data Generation =====

    generateSampleEatSign() {
        // Generate a simplified EAT sign animation (30 frames)
        const frames = [];
        const glosses = [{
            gloss: 'EAT',
            start: 0,
            end: 1.0,
            confidence: 0.95
        }];

        for (let i = 0; i < 30; i++) {
            const t = i / 29; // Normalized time 0-1
            const phase = Math.sin(t * Math.PI * 2) * 0.5 + 0.5; // Oscillation

            const landmarks = this.generateEatSignLandmarks(phase);
            
            frames.push({
                frame: i,
                timestamp: i / 30,
                landmarks: landmarks
            });
        }

        return { frames, glosses };
    }

    generateEatSignLandmarks(phase) {
        // Generate MediaPipe 33 landmarks for "EAT" sign
        // EAT: Hand moves from mouth downward repeatedly
        
        const landmarks = [];
        const handOffset = phase * 0.3; // Hand movement range

        for (let i = 0; i < 33; i++) {
            let x = 0.5, y = 0.5, z = 0;
            let visibility = 1.0;

            // Face landmarks
            if (i <= 10) {
                x = 0.5 + (i % 2 === 0 ? -0.05 : 0.05) * (i % 3);
                y = 0.3 + (i > 5 ? 0.02 : 0);
                z = -0.1;
            }
            // Shoulders
            else if (i === 11) {
                x = 0.35; y = 0.45; z = 0;
            }
            else if (i === 12) {
                x = 0.65; y = 0.45; z = 0;
            }
            // Arms (right arm active for EAT sign)
            else if (i === 13) { // Left elbow
                x = 0.3; y = 0.6; z = 0.1;
            }
            else if (i === 14) { // Right elbow (active)
                x = 0.7; y = 0.55 - handOffset * 0.3; z = 0.2;
            }
            else if (i === 15) { // Left wrist
                x = 0.25; y = 0.75; z = 0.2;
            }
            else if (i === 16) { // Right wrist (active - near mouth then down)
                x = 0.55;
                y = 0.35 + handOffset * 0.4; // From mouth to chest
                z = 0.3 - handOffset * 0.1;
            }
            // Hands
            else if (i >= 17 && i <= 22) {
                const isLeft = i % 2 === 1;
                const baseX = isLeft ? 0.25 : 0.55;
                const baseY = isLeft ? 0.75 : 0.35 + handOffset * 0.4;
                x = baseX + (Math.random() - 0.5) * 0.02;
                y = baseY + (Math.random() - 0.5) * 0.02;
                z = 0.3;
            }
            // Hips
            else if (i === 23) {
                x = 0.4; y = 0.75; z = 0;
            }
            else if (i === 24) {
                x = 0.6; y = 0.75; z = 0;
            }
            // Legs (static)
            else {
                const isLeft = i % 2 === 1;
                x = isLeft ? 0.4 : 0.6;
                y = 0.9 + (i >= 25 ? (i >= 27 ? 0.15 : 0.1) : 0);
                z = 0;
            }

            landmarks.push({
                x: Math.max(0, Math.min(1, x)),
                y: Math.max(0, Math.min(1, y)),
                z: z,
                visibility: visibility
            });
        }

        return landmarks;
    }

    // ===== UI Helpers =====

    showLoading(text = 'Loading...') {
        this.isLoading = true;
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (overlay) overlay.classList.remove('hidden');
        if (loadingText) loadingText.textContent = text;
    }

    updateLoadingText(text) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) loadingText.textContent = text;
    }

    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    showError(message) {
        const overlay = document.getElementById('error-overlay');
        const errorText = document.getElementById('error-text');
        
        if (errorText) errorText.textContent = message;
        if (overlay) overlay.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        const overlay = document.getElementById('error-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    showNotification(message) {
        // Simple notification implementation
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: var(--success-color);
            color: white;
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ===== Public API =====

    play() {
        if (this.playbackControls) {
            this.playbackControls.play();
        }
    }

    pause() {
        if (this.playbackControls) {
            this.playbackControls.pause();
        }
    }

    stop() {
        if (this.playbackControls) {
            this.playbackControls.stop();
        }
    }

    seek(frame) {
        if (this.playbackControls) {
            this.playbackControls.seek(frame);
        }
    }

    loadPoseSequence(poseSequence, glosses) {
        this.playbackControls.loadPoseSequence(poseSequence, glosses);
    }

    dispose() {
        // Clean up resources
        this.playbackControls.destroy();
        
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }

        if (this.poseRenderer) {
            this.poseRenderer.dispose();
        }

        window.removeEventListener('resize', this.onWindowResize);
    }
}

// ===== Initialize Application =====

let viewer;

document.addEventListener('DOMContentLoaded', () => {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h1>Error</h1>
                <p>Failed to load Three.js library. Please check your internet connection.</p>
            </div>
        `;
        return;
    }

    try {
        viewer = new AvatarViewer();
        
        // Expose viewer to global scope for debugging
        window.avatarViewer = viewer;
        
        console.log('Avatar Viewer initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Avatar Viewer:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h1>Error</h1>
                <p>Failed to initialize Avatar Viewer: ${error.message}</p>
            </div>
        `;
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (viewer) {
        viewer.dispose();
    }
});
