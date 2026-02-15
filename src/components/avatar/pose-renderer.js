/**
 * Pose Renderer - MediaPipe 33-point pose visualization for Three.js
 * Handles rendering of skeleton, landmarks, and pose connections
 */

class PoseRenderer {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            landmarkSize: 0.03,
            landmarkColor: 0x00ff88,
            connectionColor: 0x0088ff,
            connectionWidth: 2,
            showLandmarks: true,
            showConnections: true,
            ...options
        };

        // MediaPipe 33 landmark indices with names
        this.landmarkNames = {
            0: 'nose',
            1: 'left_eye_inner', 2: 'left_eye', 3: 'left_eye_outer',
            4: 'right_eye_inner', 5: 'right_eye', 6: 'right_eye_outer',
            7: 'left_ear', 8: 'right_ear',
            9: 'mouth_left', 10: 'mouth_right',
            11: 'left_shoulder', 12: 'right_shoulder',
            13: 'left_elbow', 14: 'right_elbow',
            15: 'left_wrist', 16: 'right_wrist',
            17: 'left_pinky', 18: 'right_pinky',
            19: 'left_index', 20: 'right_index',
            21: 'left_thumb', 22: 'right_thumb',
            23: 'left_hip', 24: 'right_hip',
            25: 'left_knee', 26: 'right_knee',
            27: 'left_ankle', 28: 'right_ankle',
            29: 'left_heel', 30: 'right_heel',
            31: 'left_foot_index', 32: 'right_foot_index'
        };

        // Pose connections defining the skeleton
        this.poseConnections = [
            // Face
            [0, 1], [1, 2], [2, 3], [3, 7],
            [0, 4], [4, 5], [5, 6], [6, 8],
            [9, 10], [0, 9], [0, 10],
            // Body
            [11, 12], [11, 23], [12, 24], [23, 24],
            // Left arm
            [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
            [17, 19], [19, 21],
            // Right arm
            [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
            [18, 20], [20, 22],
            // Left leg
            [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
            // Right leg
            [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
        ];

        // Body part groups for coloring
        this.bodyPartGroups = {
            face: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            leftArm: [11, 13, 15, 17, 19, 21],
            rightArm: [12, 14, 16, 18, 20, 22],
            torso: [11, 12, 23, 24],
            leftLeg: [23, 25, 27, 29, 31],
            rightLeg: [24, 26, 28, 30, 32]
        };

        this.landmarks = [];
        this.landmarkMeshes = [];
        this.connectionLines = [];
        this.skeletonGroup = new THREE.Group();
        this.skeletonGroup.name = 'PoseSkeleton';
        this.scene.add(this.skeletonGroup);

        this.initMaterials();
    }

    initMaterials() {
        // Materials for different body parts
        this.materials = {
            face: new THREE.MeshBasicMaterial({ 
                color: 0xffd700, 
                transparent: true, 
                opacity: 0.8 
            }),
            leftArm: new THREE.MeshBasicMaterial({ 
                color: 0x00ff88, 
                transparent: true, 
                opacity: 0.8 
            }),
            rightArm: new THREE.MeshBasicMaterial({ 
                color: 0xff4444, 
                transparent: true, 
                opacity: 0.8 
            }),
            torso: new THREE.MeshBasicMaterial({ 
                color: 0x4488ff, 
                transparent: true, 
                opacity: 0.8 
            }),
            leftLeg: new THREE.MeshBasicMaterial({ 
                color: 0xff8800, 
                transparent: true, 
                opacity: 0.8 
            }),
            rightLeg: new THREE.MeshBasicMaterial({ 
                color: 0x8844ff, 
                transparent: true, 
                opacity: 0.8 
            }),
            connection: new THREE.LineBasicMaterial({
                color: this.options.connectionColor,
                linewidth: this.options.connectionWidth,
                transparent: true,
                opacity: 0.6
            })
        };

        // Geometry for landmarks (spheres)
        this.landmarkGeometry = new THREE.SphereGeometry(
            this.options.landmarkSize, 
            16, 
            16
        );
    }

    /**
     * Get material for a specific landmark index
     */
    getMaterialForLandmark(index) {
        if (this.bodyPartGroups.face.includes(index)) {
            return this.materials.face;
        } else if (this.bodyPartGroups.leftArm.includes(index)) {
            return this.materials.leftArm;
        } else if (this.bodyPartGroups.rightArm.includes(index)) {
            return this.materials.rightArm;
        } else if (this.bodyPartGroups.leftLeg.includes(index)) {
            return this.materials.leftLeg;
        } else if (this.bodyPartGroups.rightLeg.includes(index)) {
            return this.materials.rightLeg;
        }
        return this.materials.torso;
    }

    /**
     * Create or update landmark meshes
     */
    createLandmarks(landmarks) {
        // Clear existing landmarks
        this.landmarkMeshes.forEach(mesh => {
            this.skeletonGroup.remove(mesh);
        });
        this.landmarkMeshes = [];

        if (!landmarks || !this.options.showLandmarks) return;

        landmarks.forEach((landmark, index) => {
            if (!landmark || landmark.visibility < 0.5) return;

            const material = this.getMaterialForLandmark(index);
            const mesh = new THREE.Mesh(this.landmarkGeometry, material.clone());
            
            // Convert normalized coordinates to 3D space
            // MediaPipe: x (0-1, left-right), y (0-1, top-bottom), z (depth)
            // Three.js: x (left-right), y (up-down), z (depth)
            mesh.position.set(
                (landmark.x - 0.5) * 4,     // Scale and center
                -(landmark.y - 0.5) * 4,    // Invert Y and center
                landmark.z * 2              // Scale depth
            );

            mesh.userData = {
                landmarkIndex: index,
                landmarkName: this.landmarkNames[index]
            };

            this.skeletonGroup.add(mesh);
            this.landmarkMeshes.push(mesh);
        });
    }

    /**
     * Create or update connection lines
     */
    createConnections(landmarks) {
        // Remove existing lines
        this.connectionLines.forEach(line => {
            this.skeletonGroup.remove(line);
        });
        this.connectionLines = [];

        if (!landmarks || !this.options.showConnections) return;

        this.poseConnections.forEach(([start, end]) => {
            const startLandmark = landmarks[start];
            const endLandmark = landmarks[end];

            if (!startLandmark || !endLandmark) return;
            if (startLandmark.visibility < 0.5 || endLandmark.visibility < 0.5) return;

            const points = [
                new THREE.Vector3(
                    (startLandmark.x - 0.5) * 4,
                    -(startLandmark.y - 0.5) * 4,
                    startLandmark.z * 2
                ),
                new THREE.Vector3(
                    (endLandmark.x - 0.5) * 4,
                    -(endLandmark.y - 0.5) * 4,
                    endLandmark.z * 2
                )
            ];

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, this.materials.connection);
            
            this.skeletonGroup.add(line);
            this.connectionLines.push(line);
        });
    }

    /**
     * Update pose with new landmark data
     */
    updatePose(landmarks) {
        this.landmarks = landmarks;
        this.createLandmarks(landmarks);
        this.createConnections(landmarks);
    }

    /**
     * Set visibility of landmarks
     */
    setLandmarksVisible(visible) {
        this.options.showLandmarks = visible;
        this.landmarkMeshes.forEach(mesh => {
            mesh.visible = visible;
        });
    }

    /**
     * Set visibility of connections
     */
    setConnectionsVisible(visible) {
        this.options.showConnections = visible;
        this.connectionLines.forEach(line => {
            line.visible = visible;
        });
    }

    /**
     * Set visibility of entire skeleton
     */
    setVisible(visible) {
        this.skeletonGroup.visible = visible;
    }

    /**
     * Get landmark position by name or index
     */
    getLandmarkPosition(nameOrIndex) {
        let index;
        if (typeof nameOrIndex === 'string') {
            index = Object.keys(this.landmarkNames).find(
                key => this.landmarkNames[key] === nameOrIndex
            );
        } else {
            index = nameOrIndex;
        }

        const mesh = this.landmarkMeshes.find(
            m => m.userData.landmarkIndex == index
        );

        return mesh ? mesh.position.clone() : null;
    }

    /**
     * Get all landmark positions as object
     */
    getAllLandmarkPositions() {
        const positions = {};
        this.landmarkMeshes.forEach(mesh => {
            const { landmarkIndex, landmarkName } = mesh.userData;
            positions[landmarkName] = {
                index: landmarkIndex,
                position: mesh.position.clone()
            };
        });
        return positions;
    }

    /**
     * Animate pose interpolation between two frames
     */
    interpolatePoses(fromLandmarks, toLandmarks, factor) {
        if (!fromLandmarks || !toLandmarks) return;

        const interpolated = fromLandmarks.map((from, i) => {
            const to = toLandmarks[i];
            if (!from || !to) return from || to;

            return {
                x: from.x + (to.x - from.x) * factor,
                y: from.y + (to.y - from.y) * factor,
                z: from.z + (to.z - from.z) * factor,
                visibility: Math.min(from.visibility, to.visibility)
            };
        });

        this.updatePose(interpolated);
    }

    /**
     * Clear all rendered pose elements
     */
    clear() {
        this.landmarks = [];
        this.createLandmarks([]);
        this.createConnections([]);
    }

    /**
     * Dispose of geometries and materials
     */
    dispose() {
        this.landmarkGeometry.dispose();
        Object.values(this.materials).forEach(material => material.dispose());
        this.connectionLines.forEach(line => {
            line.geometry.dispose();
        });
    }

    /**
     * Get bounding box of current pose
     */
    getBoundingBox() {
        const box = new THREE.Box3();
        this.landmarkMeshes.forEach(mesh => {
            box.expandByPoint(mesh.position);
        });
        return box;
    }

    /**
     * Center the pose in the scene
     */
    centerPose() {
        const box = this.getBoundingBox();
        const center = box.getCenter(new THREE.Vector3());
        this.skeletonGroup.position.sub(center);
        this.skeletonGroup.position.y += 1; // Keep slightly above ground
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PoseRenderer;
}
