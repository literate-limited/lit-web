/**
 * PoseAnimator - Manages frame-by-frame animation of pose data
 * Handles playback, timing, and loop control for avatar animation
 */

class PoseAnimator {
    constructor(avatar, fps = 30) {
        this.avatar = avatar;
        this.fps = fps;
        this.frameTime = 1000 / fps; // milliseconds per frame

        // Playback state
        this.frames = [];
        this.currentFrame = 0;
        this.isPlaying = false;
        this.loop = true;
        this.speed = 1.0;

        // Timing
        this.lastFrameTime = 0;
        this.startTime = 0;
        this.pausedTime = 0;

        // Callbacks
        this.onFrameUpdate = null;
        this.onLoop = null;
        this.onStop = null;

        // Animation request ID for cleanup
        this.animationId = null;
    }

    /**
     * Load frame data from API response
     * @param {Array} frameData - Array of frame objects with landmarks
     */
    loadFrames(frameData) {
        if (!Array.isArray(frameData)) {
            console.error('Invalid frame data provided');
            return;
        }

        this.frames = frameData;
        this.currentFrame = 0;
        console.log(`Loaded ${this.frames.length} frames`);
    }

    /**
     * Start animation playback
     */
    play() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.startTime = performance.now();
        this.lastFrameTime = performance.now();
        this.animate();
    }

    /**
     * Pause animation without resetting
     */
    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Resume animation from pause
     */
    resume() {
        if (this.isPlaying) return;
        this.play();
    }

    /**
     * Stop animation and reset to beginning
     */
    stop() {
        this.pause();
        this.currentFrame = 0;
        if (this.onStop) {
            this.onStop();
        }
    }

    /**
     * Jump to specific frame
     * @param {number} frameIndex - Frame number to jump to
     */
    jumpToFrame(frameIndex) {
        const index = Math.max(0, Math.min(frameIndex, this.frames.length - 1));
        this.currentFrame = index;

        if (this.frames[index] && this.onFrameUpdate) {
            this.onFrameUpdate(this.frames[index]);
        }
    }

    /**
     * Set animation speed multiplier
     * @param {number} speed - Speed multiplier (1.0 = normal, 0.5 = half, 2.0 = double)
     */
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(speed, 5.0)); // Clamp 0.1x to 5.0x
    }

    /**
     * Set whether animation should loop
     * @param {boolean} shouldLoop - True to loop, false to stop at end
     */
    setLoop(shouldLoop) {
        this.loop = shouldLoop;
    }

    /**
     * Get current animation progress (0 to 1)
     * @returns {number} Progress from 0 to 1
     */
    getProgress() {
        if (this.frames.length === 0) return 0;
        return this.currentFrame / (this.frames.length - 1);
    }

    /**
     * Get current frame data
     * @returns {Object} Current frame object
     */
    getCurrentFrame() {
        return this.frames[this.currentFrame] || null;
    }

    /**
     * Get total number of frames
     * @returns {number} Total frames
     */
    getFrameCount() {
        return this.frames.length;
    }

    /**
     * Get current playback state as object
     * @returns {Object} State object
     */
    getState() {
        return {
            currentFrame: this.currentFrame,
            totalFrames: this.frames.length,
            isPlaying: this.isPlaying,
            progress: this.getProgress(),
            fps: this.fps,
            speed: this.speed,
            loop: this.loop
        };
    }

    /**
     * Main animation loop using requestAnimationFrame
     * @private
     */
    animate = () => {
        if (!this.isPlaying || this.frames.length === 0) {
            return;
        }

        const now = performance.now();
        const delta = (now - this.lastFrameTime) / this.speed;

        if (delta >= this.frameTime) {
            this.currentFrame++;

            // Handle loop or stop at end
            if (this.currentFrame >= this.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                    if (this.onLoop) {
                        this.onLoop();
                    }
                } else {
                    this.pause();
                    if (this.onStop) {
                        this.onStop();
                    }
                    return;
                }
            }

            // Update frame
            if (this.frames[this.currentFrame] && this.onFrameUpdate) {
                this.onFrameUpdate(this.frames[this.currentFrame]);
            }

            this.lastFrameTime = now;
        }

        this.animationId = requestAnimationFrame(this.animate);
    }

    /**
     * Dispose and cleanup resources
     */
    dispose() {
        this.stop();
        this.frames = [];
        this.onFrameUpdate = null;
        this.onLoop = null;
        this.onStop = null;
        this.avatar = null;
    }
}

// Export for use in modules and scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PoseAnimator;
}

// Export to global window for browser use
if (typeof window !== 'undefined') {
    window.PoseAnimator = PoseAnimator;
}
