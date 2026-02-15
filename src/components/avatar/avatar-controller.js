/**
 * AvatarController - Manages 3D scene, avatar loading, and pose animation
 * Integrates Three.js with PoseAnimator for realistic avatar animation
 */

class AvatarController {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.options = {
            avatarScale: 1.8,
            backgroundColor: 0x0f172a,
            enableLighting: true,
            enableControls: true,
            ...options
        };

        // Three.js scene components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Avatar and animation
        this.avatar = null;
        this.animator = null;
        this.bones = {};

        // Kalidokit integration
        this.kalidokit = window.Kalidokit;

        // Initialization
        this.isInitialized = false;
        this.animationId = null;

        this.init();
    }

    /**
     * Initialize Three.js scene
     * @private
     */
    init() {
        try {
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupLighting();
            this.setupControls();
            this.startRenderLoop();
            this.isInitialized = true;
            console.log('AvatarController initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AvatarController:', error);
            throw error;
        }
    }

    /**
     * Setup Three.js scene
     * @private
     */
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);
    }

    /**
     * Setup camera with aspect ratio handling
     * @private
     */
    setupCamera() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const aspect = width / height;

        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 1.5, 5);
        this.camera.lookAt(0, 1, 0);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Setup WebGL renderer
     * @private
     */
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });

        this.renderer.setSize(
            this.container.clientWidth,
            this.container.clientHeight
        );
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.appendChild(this.renderer.domElement);
    }

    /**
     * Setup 3D lighting
     * @private
     */
    setupLighting() {
        if (!this.options.enableLighting) return;

        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light for shadows and highlights
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        // Optional ground plane for reference
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.receiveShadow = true;
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        this.scene.add(ground);
    }

    /**
     * Setup orbit controls for camera interaction
     * @private
     */
    setupControls() {
        if (!this.options.enableControls || !window.THREE.OrbitControls) {
            return;
        }

        try {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.target.set(0, 1.2, 0);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.autoRotate = false;
            this.controls.autoRotateSpeed = 2;
            this.controls.update();
        } catch (error) {
            console.warn('OrbitControls not available, interaction disabled');
        }
    }

    /**
     * Load avatar model from GLB file
     * @param {string} modelPath - Path to GLB file
     * @returns {Promise<THREE.Group>} Loaded avatar model
     */
    async loadAvatar(modelPath) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();

            loader.load(
                modelPath,
                (gltf) => {
                    this.avatar = gltf.scene;
                    this.avatar.scale.setScalar(this.options.avatarScale);

                    // Setup shadows
                    this.avatar.traverse((node) => {
                        if (node instanceof THREE.Mesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });

                    // Extract and cache bones for animation
                    if (gltf.animations && gltf.animations.length > 0) {
                        const skeleton = gltf.animations[0];
                        // Store bone references for later use
                    }

                    this.scene.add(this.avatar);
                    resolve(this.avatar);
                },
                (progress) => {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    console.log(`Avatar loading: ${percent}%`);
                },
                (error) => {
                    console.error('Error loading avatar:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Load pose data from API and setup animator
     * @param {number} signId - Sign ID to fetch poses for
     * @returns {Promise<boolean>} Success status
     */
    async loadPoseData(signId) {
        try {
            const response = await fetch(`/api/reference_poses/${signId}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load pose data');
            }

            // Create animator if not exists
            if (!this.animator) {
                this.animator = new PoseAnimator(this.avatar, data.fps || 30);

                // Setup frame update callback
                this.animator.onFrameUpdate = (frame) => {
                    this.updateAvatarFromFrame(frame);
                };
            }

            // Load frames and start animation
            this.animator.loadFrames(data.frames);
            this.animator.play();

            console.log(`Loaded ${data.total_frames} frames for sign: ${data.sign_word}`);
            return true;
        } catch (error) {
            console.error('Error loading pose data:', error);
            return false;
        }
    }

    /**
     * Update avatar skeleton from pose frame
     * @param {Object} frame - Frame object with landmarks array
     * @private
     */
    updateAvatarFromFrame(frame) {
        if (!frame || !frame.landmarks || !this.kalidokit) {
            return;
        }

        try {
            // Use Kalidokit to solve IK from landmarks
            const riggedPose = this.kalidokit.Pose.solve(frame.landmarks, {
                runtime: 'mediapipe',
                video: null,
                smoothBones: true
            });

            // Apply pose to avatar skeleton
            this.applyRiggedPose(riggedPose);
        } catch (error) {
            // Silently handle frame processing errors
            // console.warn('Error processing frame:', error);
        }
    }

    /**
     * Apply rigged pose solution to avatar bones
     * @param {Object} riggedPose - Kalidokit solved pose
     * @private
     */
    applyRiggedPose(riggedPose) {
        if (!this.avatar) return;

        // Helper to apply rotation to a bone
        const applyBoneRotation = (boneName, rotation) => {
            const bone = this.findBone(this.avatar, boneName);
            if (bone && rotation) {
                bone.rotation.order = 'YXZ';
                bone.rotation.set(
                    rotation.x || 0,
                    rotation.y || 0,
                    rotation.z || 0
                );
            }
        };

        // Helper to apply position to a bone
        const applyBonePosition = (boneName, position) => {
            const bone = this.findBone(this.avatar, boneName);
            if (bone && position) {
                bone.position.set(
                    position.x || 0,
                    position.y || 0,
                    position.z || 0
                );
            }
        };

        // Apply main body parts
        if (riggedPose.Hips) {
            applyBonePosition('Hips', riggedPose.Hips.position);
            applyBoneRotation('Hips', riggedPose.Hips.rotation);
        }

        if (riggedPose.Spine) applyBoneRotation('Spine', riggedPose.Spine.rotation);
        if (riggedPose.Chest) applyBoneRotation('Chest', riggedPose.Chest.rotation);
        if (riggedPose.UpperChest) applyBoneRotation('UpperChest', riggedPose.UpperChest.rotation);
        if (riggedPose.Neck) applyBoneRotation('Neck', riggedPose.Neck.rotation);
        if (riggedPose.Head) applyBoneRotation('Head', riggedPose.Head.rotation);

        // Apply arms
        ['Left', 'Right'].forEach(side => {
            if (riggedPose[`${side}Shoulder`]) applyBoneRotation(`${side}Shoulder`, riggedPose[`${side}Shoulder`].rotation);
            if (riggedPose[`${side}UpperArm`]) applyBoneRotation(`${side}UpperArm`, riggedPose[`${side}UpperArm`].rotation);
            if (riggedPose[`${side}LowerArm`]) applyBoneRotation(`${side}LowerArm`, riggedPose[`${side}LowerArm`].rotation);
            if (riggedPose[`${side}Hand`]) applyBoneRotation(`${side}Hand`, riggedPose[`${side}Hand`].rotation);
        });

        // Apply legs (less important for sign language but included)
        ['Left', 'Right'].forEach(side => {
            if (riggedPose[`${side}UpperLeg`]) applyBoneRotation(`${side}UpperLeg`, riggedPose[`${side}UpperLeg`].rotation);
            if (riggedPose[`${side}LowerLeg`]) applyBoneRotation(`${side}LowerLeg`, riggedPose[`${side}LowerLeg`].rotation);
            if (riggedPose[`${side}Foot`]) applyBoneRotation(`${side}Foot`, riggedPose[`${side}Foot`].rotation);
        });
    }

    /**
     * Find bone in avatar skeleton by name
     * @param {THREE.Group} object - Avatar object to search
     * @param {string} boneName - Name of bone to find
     * @returns {THREE.Bone|null} Bone object or null
     * @private
     */
    findBone(object, boneName) {
        if (this.bones[boneName]) {
            return this.bones[boneName];
        }

        let foundBone = null;
        object.traverse((node) => {
            if (node.name === boneName) {
                foundBone = node;
                this.bones[boneName] = node;
            }
        });

        return foundBone;
    }

    /**
     * Get animator instance
     * @returns {PoseAnimator|null} Animator or null
     */
    getAnimator() {
        return this.animator;
    }

    /**
     * Handle window resize
     * @private
     */
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Start main render loop
     * @private
     */
    startRenderLoop() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);

            // Update controls
            if (this.controls) {
                this.controls.update();
            }

            // Render scene
            this.renderer.render(this.scene, this.camera);
        };

        animate();
    }

    /**
     * Dispose and cleanup resources
     */
    dispose() {
        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Cleanup animator
        if (this.animator) {
            this.animator.dispose();
            this.animator = null;
        }

        // Cleanup scene
        if (this.scene) {
            this.scene.clear();
        }

        // Cleanup renderer
        if (this.renderer && this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }

        // Remove event listeners
        window.removeEventListener('resize', () => this.onWindowResize());

        this.avatar = null;
        this.bones = {};
    }
}

// Export for use in modules and scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarController;
}

// Export to global window for browser use
if (typeof window !== 'undefined') {
    window.AvatarController = AvatarController;
}
