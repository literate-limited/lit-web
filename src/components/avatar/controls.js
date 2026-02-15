/**
 * Controls - UI Controls and Playback Manager
 * Handles playback controls, timeline, and animation state
 */

class PlaybackControls {
    constructor(options = {}) {
        this.options = {
            fps: 30,
            defaultSpeed: 1.0,
            ...options
        };

        // Playback state
        this.state = {
            isPlaying: false,
            isPaused: false,
            isLooping: false,
            currentFrame: 0,
            totalFrames: 0,
            speed: 1.0,
            startTime: 0,
            pausedTime: 0
        };

        // Animation data
        this.animationData = null;
        this.glosses = [];

        // Callbacks
        this.onPlay = null;
        this.onPause = null;
        this.onStop = null;
        this.onSeek = null;
        this.onFrame = null;
        this.onLoop = null;
        this.onComplete = null;

        // Animation frame ID
        this.animationFrameId = null;
        this.lastFrameTime = 0;

        // Bind UI elements
        this.bindElements();
        this.bindEvents();
    }

    bindElements() {
        // Buttons
        this.btnPlay = document.getElementById('btn-play');
        this.btnPause = document.getElementById('btn-pause');
        this.btnStop = document.getElementById('btn-stop');
        this.btnLoop = document.getElementById('btn-loop');

        // Timeline
        this.timeline = document.getElementById('timeline');
        this.timeCurrent = document.getElementById('time-current');
        this.timeTotal = document.getElementById('time-total');

        // Checkboxes
        this.chkSlowMotion = document.getElementById('chk-slow-motion');
        this.chkShowLandmarks = document.getElementById('chk-show-landmarks');

        // Info displays
        this.statusText = document.getElementById('status-text');
        this.frameText = document.getElementById('frame-text');
        this.glossText = document.getElementById('gloss-text');
        this.glossList = document.getElementById('gloss-list');

        // View toggles
        this.btnViewAvatar = document.getElementById('btn-view-avatar');
        this.btnViewSkeleton = document.getElementById('btn-view-skeleton');
        this.btnViewBoth = document.getElementById('btn-view-both');
    }

    bindEvents() {
        // Playback buttons
        if (this.btnPlay) {
            this.btnPlay.addEventListener('click', () => this.play());
        }
        if (this.btnPause) {
            this.btnPause.addEventListener('click', () => this.pause());
        }
        if (this.btnStop) {
            this.btnStop.addEventListener('click', () => this.stop());
        }
        if (this.btnLoop) {
            this.btnLoop.addEventListener('click', () => this.toggleLoop());
        }

        // Timeline
        if (this.timeline) {
            this.timeline.addEventListener('input', (e) => this.seek(parseInt(e.target.value)));
            this.timeline.addEventListener('mousedown', () => this.onTimelineDragStart());
            this.timeline.addEventListener('mouseup', () => this.onTimelineDragEnd());
        }

        // Checkboxes
        if (this.chkSlowMotion) {
            this.chkSlowMotion.addEventListener('change', (e) => this.setSpeed(e.target.checked ? 0.5 : 1.0));
        }

        // View toggles
        if (this.btnViewAvatar) {
            this.btnViewAvatar.addEventListener('click', () => this.setViewMode('avatar'));
        }
        if (this.btnViewSkeleton) {
            this.btnViewSkeleton.addEventListener('click', () => this.setViewMode('skeleton'));
        }
        if (this.btnViewBoth) {
            this.btnViewBoth.addEventListener('click', () => this.setViewMode('both'));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    handleKeydown(e) {
        // Ignore if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'KeyS':
                this.stop();
                break;
            case 'KeyL':
                this.toggleLoop();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.stepFrame(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.stepFrame(1);
                break;
            case 'Home':
                e.preventDefault();
                this.seek(0);
                break;
            case 'End':
                e.preventDefault();
                this.seek(this.state.totalFrames - 1);
                break;
        }
    }

    // ===== Playback Control Methods =====

    play() {
        if (this.state.isPlaying) return;

        if (this.state.currentFrame >= this.state.totalFrames - 1) {
            this.state.currentFrame = 0;
        }

        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.startTime = performance.now() - (this.state.currentFrame / this.options.fps * 1000);

        this.updateUI();
        this.startAnimationLoop();

        if (this.onPlay) this.onPlay();
        this.setStatus('Playing');
    }

    pause() {
        if (!this.state.isPlaying) return;

        this.state.isPlaying = false;
        this.state.isPaused = true;
        this.state.pausedTime = performance.now();

        this.stopAnimationLoop();
        this.updateUI();

        if (this.onPause) this.onPause();
        this.setStatus('Paused');
    }

    stop() {
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.state.currentFrame = 0;

        this.stopAnimationLoop();
        this.updateUI();
        this.updateTimeDisplay();

        if (this.onStop) this.onStop();
        if (this.onSeek) this.onSeek(0);
        this.setStatus('Stopped');
    }

    togglePlayPause() {
        if (this.state.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    toggleLoop() {
        this.state.isLooping = !this.state.isLooping;
        this.updateUI();

        if (this.onLoop) this.onLoop(this.state.isLooping);
    }

    seek(frame) {
        frame = Math.max(0, Math.min(frame, this.state.totalFrames - 1));
        this.state.currentFrame = frame;

        if (this.state.isPlaying) {
            this.state.startTime = performance.now() - (frame / this.options.fps * 1000);
        }

        this.updateUI();
        this.updateTimeDisplay();

        if (this.onSeek) this.onSeek(frame);
    }

    onTimelineDragStart() {
        this.wasPlayingBeforeDrag = this.state.isPlaying;
        if (this.state.isPlaying) {
            this.pause();
        }
    }

    onTimelineDragEnd() {
        if (this.wasPlayingBeforeDrag) {
            this.play();
        }
    }

    stepFrame(direction) {
        const newFrame = this.state.currentFrame + direction;
        if (newFrame >= 0 && newFrame < this.state.totalFrames) {
            this.seek(newFrame);
        }
    }

    setSpeed(speed) {
        this.state.speed = speed;
        if (this.state.isPlaying) {
            // Recalculate start time to maintain current position
            this.state.startTime = performance.now() - 
                (this.state.currentFrame / this.options.fps * 1000 / speed);
        }
    }

    // ===== Animation Loop =====

    startAnimationLoop() {
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    stopAnimationLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    animate() {
        if (!this.state.isPlaying) return;

        const now = performance.now();
        const elapsed = (now - this.state.startTime) * this.state.speed;
        const frameDuration = 1000 / this.options.fps;
        
        let targetFrame = Math.floor(elapsed / frameDuration);

        // Handle looping
        if (targetFrame >= this.state.totalFrames) {
            if (this.state.isLooping) {
                targetFrame = 0;
                this.state.startTime = now;
            } else {
                targetFrame = this.state.totalFrames - 1;
                this.stop();
                if (this.onComplete) this.onComplete();
                return;
            }
        }

        if (targetFrame !== this.state.currentFrame) {
            this.state.currentFrame = targetFrame;
            this.updateUI();
            this.updateTimeDisplay();

            if (this.onFrame) this.onFrame(targetFrame);
        }

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    // ===== Data Loading =====

    loadAnimation(animationData, glosses = []) {
        this.animationData = animationData;
        this.glosses = glosses;
        this.state.totalFrames = animationData.frames ? animationData.frames.length : 0;
        this.state.currentFrame = 0;

        this.updateUI();
        this.updateTimeDisplay();
        this.renderGlossList();

        if (this.timeline) {
            this.timeline.max = Math.max(0, this.state.totalFrames - 1);
            this.timeline.value = 0;
        }

        this.setStatus('Loaded');
    }

    loadPoseSequence(poseSequence, glosses = []) {
        const animationData = {
            frames: poseSequence,
            fps: this.options.fps
        };
        this.loadAnimation(animationData, glosses);
    }

    // ===== UI Updates =====

    updateUI() {
        // Update buttons
        if (this.btnPlay) {
            this.btnPlay.classList.toggle('active', this.state.isPlaying);
        }
        if (this.btnPause) {
            this.btnPause.classList.toggle('active', this.state.isPaused);
        }
        if (this.btnLoop) {
            this.btnLoop.classList.toggle('active', this.state.isLooping);
            this.btnLoop.style.opacity = this.state.isLooping ? '1' : '0.5';
        }

        // Update timeline
        if (this.timeline && !this.timeline.matches(':active')) {
            this.timeline.value = this.state.currentFrame;
        }

        // Update frame text
        if (this.frameText) {
            this.frameText.textContent = `${this.state.currentFrame} / ${this.state.totalFrames}`;
        }

        // Update current gloss
        this.updateCurrentGloss();
    }

    updateTimeDisplay() {
        const currentTime = this.state.currentFrame / this.options.fps;
        const totalTime = this.state.totalFrames / this.options.fps;

        if (this.timeCurrent) {
            this.timeCurrent.textContent = this.formatTime(currentTime);
        }
        if (this.timeTotal) {
            this.timeTotal.textContent = this.formatTime(totalTime);
        }
    }

    updateCurrentGloss() {
        const currentTime = this.state.currentFrame / this.options.fps;
        
        // Find current gloss based on timing
        const currentGloss = this.glosses.find(g => 
            currentTime >= g.start && currentTime < g.end
        );

        if (this.glossText) {
            this.glossText.textContent = currentGloss ? currentGloss.gloss : '-';
        }

        // Update gloss list highlighting
        if (this.glossList) {
            const items = this.glossList.querySelectorAll('.gloss-item');
            items.forEach((item, index) => {
                const gloss = this.glosses[index];
                const isActive = gloss && currentTime >= gloss.start && currentTime < gloss.end;
                item.classList.toggle('active', isActive);
                if (isActive) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }
    }

    renderGlossList() {
        if (!this.glossList) return;

        if (this.glosses.length === 0) {
            this.glossList.innerHTML = '<p class="empty-state">No glosses available</p>';
            return;
        }

        this.glossList.innerHTML = this.glosses.map((gloss, index) => `
            <div class="gloss-item" data-index="${index}">
                <span class="gloss-index">${index + 1}</span>
                <span class="gloss-text">${gloss.gloss}</span>
                <span class="gloss-time">${this.formatTime(gloss.start)}</span>
            </div>
        `).join('');
    }

    setViewMode(mode) {
        // Update toggle buttons
        if (this.btnViewAvatar) {
            this.btnViewAvatar.classList.toggle('active', mode === 'avatar');
        }
        if (this.btnViewSkeleton) {
            this.btnViewSkeleton.classList.toggle('active', mode === 'skeleton');
        }
        if (this.btnViewBoth) {
            this.btnViewBoth.classList.toggle('active', mode === 'both');
        }

        // Dispatch event for avatar viewer
        const event = new CustomEvent('viewmodechange', { detail: { mode } });
        document.dispatchEvent(event);
    }

    setStatus(status) {
        if (this.statusText) {
            this.statusText.textContent = status;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    // ===== Getters =====

    getCurrentFrame() {
        return this.state.currentFrame;
    }

    getTotalFrames() {
        return this.state.totalFrames;
    }

    getCurrentPose() {
        if (!this.animationData || !this.animationData.frames) return null;
        return this.animationData.frames[this.state.currentFrame];
    }

    getPoseAtFrame(frame) {
        if (!this.animationData || !this.animationData.frames) return null;
        return this.animationData.frames[frame];
    }

    isPlaying() {
        return this.state.isPlaying;
    }

    isLooping() {
        return this.state.isLooping;
    }

    // ===== Cleanup =====

    destroy() {
        this.stopAnimationLoop();
        // Event listeners are automatically cleaned up when elements are removed
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlaybackControls;
}
