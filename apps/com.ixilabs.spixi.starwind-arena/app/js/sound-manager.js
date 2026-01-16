// SoundManager - HTML5 Audio loader for Artillery Duel
// Loads and plays audio files using HTML5 Audio (no CORS issues)

class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioElements = {};
        this.soundsPath = 'audio/';
        this.backgroundAudio = null;
        this.loading = false;
        this.loaded = false;
        this.masterVolume = 0.5;
    }

    async init() {
        try {
            console.log('Audio: Initializing with HTML5 Audio');
            
            const soundDisabled = await SpixiAppSdk.getStorageData('settings', 'soundDisabled');
            if (soundDisabled == "true") {
                this.enabled = false;
            }

            // Load all sound files
            this.loadSounds();
            
            // Setup user interaction handler for autoplay
            this.setupInteractionHandler();
        } catch (e) {
            console.error('Audio initialization failed:', e);
            this.enabled = false;
        }
    }
    
    setupInteractionHandler() {
        const enableAudio = () => {
            console.log('Audio: User interaction detected');
        };
        
        // Try multiple interaction events
        ['click', 'touchstart', 'keydown'].forEach(eventType => {
            document.addEventListener(eventType, enableAudio, { once: true, passive: true });
        });
    }

    async loadSounds() {
        if (this.loading || this.loaded) return;
        this.loading = true;
        
        const soundFiles = {
            'fire': 'fire.wav',
            'explosion': 'explosion.wav',
            'hit': 'hit.wav',
            'move': 'move.wav',
            'turnStart': 'turnStart.wav',
            'gameStart': 'gameStart.wav',
            'background': 'background.wav'
        };

        let loadedCount = 0;
        const totalSounds = Object.keys(soundFiles).length;

        // Create HTML5 Audio elements for each sound (no CORS issues)
        this.audioElements = {};
        
        for (const [name, filename] of Object.entries(soundFiles)) {
            try {
                const audio = new Audio();
                audio.src = this.soundsPath + filename;
                audio.preload = 'auto';
                
                // Wait for the audio to be loaded
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => resolve(), 2000); // Fallback timeout
                    audio.addEventListener('canplaythrough', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                    audio.addEventListener('error', (e) => {
                        clearTimeout(timeout);
                        reject(e);
                    }, { once: true });
                    audio.load();
                });
                
                this.audioElements[name] = audio;
                loadedCount++;
                console.log(`Audio: Loaded ${name}`);
            } catch (e) {
                console.warn(`Failed to load ${filename}:`, e.message || e);
            }
        }
        
        this.loading = false;
        this.loaded = true;
        console.log(`Audio: Loaded ${loadedCount}/${totalSounds} sounds`);
    }

    play(soundName) {
        if (!this.enabled) {
            console.log(`Audio: Cannot play ${soundName} - disabled`);
            return;
        }

        this.playSound(soundName);
    }
    
    playSound(soundName) {
        const audioElement = this.audioElements?.[soundName];
        if (!audioElement) {
            console.log(`Audio: Sound not loaded - ${soundName}`);
            return;
        }

        try {
            // Clone the audio element to allow overlapping sounds
            const sound = audioElement.cloneNode();
            sound.volume = this.masterVolume;
            sound.play().catch(e => {
                console.warn(`Audio: Failed to play ${soundName}:`, e.message);
            });
            console.log(`Audio: Playing ${soundName}`);
        } catch (e) {
            console.error(`Audio: Failed to play ${soundName}:`, e);
        }
    }

    playBackground() {
        if (!this.enabled) return;

        const audioElement = this.audioElements?.['background'];
        if (!audioElement) {
            return; // Silently fail if not loaded
        }

        // Stop existing background music if playing
        if (this.backgroundAudio) {
            this.backgroundAudio.pause();
            this.backgroundAudio.currentTime = 0;
        }

        try {
            this.backgroundAudio = audioElement.cloneNode();
            this.backgroundAudio.loop = true;
            this.backgroundAudio.volume = 0.15; // Quieter background music
            this.backgroundAudio.play().catch(e => {
                console.warn('Failed to play background music:', e.message);
            });
        } catch (e) {
            console.warn('Failed to play background music:', e.message);
            this.backgroundAudio = null;
        }
    }

    stopBackground() {
        if (this.backgroundAudio) {
            try {
                this.backgroundAudio.pause();
                this.backgroundAudio.currentTime = 0;
            } catch (e) {
                // Already stopped, ignore
            }
            this.backgroundAudio = null;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.backgroundAudio) {
            this.stopBackground();
        }        
        SpixiAppSdk.setStorageData('settings', 'soundDisabled', !this.enabled);
        return this.enabled;
    }

    setVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
    }
}
