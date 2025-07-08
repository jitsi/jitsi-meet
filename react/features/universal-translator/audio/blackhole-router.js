/**
 * BlackHole virtual audio device integration
 * Handles audio routing for macOS BlackHole virtual audio driver
 * Supports routing translated audio back into Jitsi Meet stream.
 */

export class BlackHoleRouter {
    constructor() {
        this.inputStream = null;
        this.outputContext = null;
        this.outputDestination = null;
        this.isRouting = false;
        this.audioQueue = [];
        this.processingQueue = false;
        this.blackHoleInputDevice = null;
        this.blackHoleOutputDevice = null;
        this.mixerNode = null;
        this.gainNode = null;
        this.isInitialized = false;
    }

    /**
   * Initialize BlackHole audio routing with enhanced device detection.
   */
    async initialize() {
        try {
            console.log('Initializing BlackHole audio routing...');

            // Get all available devices
            const devices = await navigator.mediaDevices.enumerateDevices();

            // Find BlackHole input and output devices
            this.blackHoleInputDevice = devices.find(device =>
                device.kind === 'audioinput'
        && (device.label.toLowerCase().includes('blackhole')
         || device.label.toLowerCase().includes('aggregate device'))
            );

            this.blackHoleOutputDevice = devices.find(device =>
                device.kind === 'audiooutput'
        && device.label.toLowerCase().includes('blackhole')
            );

            if (!this.blackHoleInputDevice) {
                console.warn('BlackHole input device not found. Available devices:',
          devices.filter(d => d.kind === 'audioinput').map(d => d.label));

                return await this._initializeDefaultAudio();
            }

            console.log('Found BlackHole devices:', {
                input: this.blackHoleInputDevice.label,
                output: this.blackHoleOutputDevice?.label || 'Using default output'
            });

            await this._initializeBlackHoleRouting();
            this.isInitialized = true;

            return {
                inputDevice: this.blackHoleInputDevice,
                outputDevice: this.blackHoleOutputDevice,
                deviceType: 'blackhole'
            };
        } catch (error) {
            console.error('Error initializing BlackHole:', error);
            throw error;
        }
    }

    /**
   * Initialize BlackHole routing with proper audio context setup.
   */
    async _initializeBlackHoleRouting() {
    // Create audio context with appropriate sample rate
        this.outputContext = new AudioContext({
            sampleRate: 48000, // Higher quality for better translation output
            latencyHint: 'interactive' // Low latency for real-time translation
        });

        // Create gain node for volume control
        this.gainNode = this.outputContext.createGain();
        this.gainNode.gain.value = 0.8; // Slightly lower to prevent clipping

        // Create destination for BlackHole output
        this.outputDestination = this.outputContext.createMediaStreamDestination();
        this.gainNode.connect(this.outputDestination);

        console.log('BlackHole routing initialized successfully');
    }

    /**
   * Initialize with default audio device as fallback.
   */
    async _initializeDefaultAudio() {
        const constraints = {
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };

        this.inputStream = await navigator.mediaDevices.getUserMedia(constraints);
        this.outputContext = new AudioContext({ sampleRate: 16000 });

        console.log('Default audio initialized as fallback');

        return {
            inputStream: this.inputStream,
            outputContext: this.outputContext,
            deviceType: 'default'
        };
    }

    /**
   * Start audio routing.
   */
    async startRouting() {
        if (this.isRouting) {
            console.warn('Audio routing already started');

            return;
        }

        if (!this.inputStream || !this.outputContext) {
            throw new Error('BlackHole not initialized');
        }

        this.isRouting = true;
        console.log('Started audio routing');
    }

    /**
   * Stop audio routing.
   */
    async stopRouting() {
        if (!this.isRouting) {
            return;
        }

        this.isRouting = false;

        if (this.inputStream) {
            this.inputStream.getTracks().forEach(track => track.stop());
        }

        if (this.outputContext) {
            await this.outputContext.close();
        }

        console.log('Stopped audio routing');
    }

    /**
   * Route translated audio to output.
   */
    async routeTranslatedAudio(audioBuffer) {
        if (!this.outputContext || !this.isRouting) {
            console.warn('Audio routing not active');

            return;
        }

        try {
            // Add to queue for processing
            this.audioQueue.push(audioBuffer);

            if (!this.processingQueue) {
                this._processAudioQueue();
            }
        } catch (error) {
            console.error('Error routing translated audio:', error);
        }
    }

    /**
   * Process queued audio buffers.
   */
    async _processAudioQueue() {
        if (this.processingQueue) {
            return;
        }

        this.processingQueue = true;

        while (this.audioQueue.length > 0 && this.isRouting) {
            const audioBuffer = this.audioQueue.shift();

            await this._playAudioBuffer(audioBuffer);
        }

        this.processingQueue = false;
    }

    /**
   * Play audio buffer through BlackHole.
   */
    async _playAudioBuffer(audioBuffer) {
        if (!this.outputContext) {
            return;
        }

        try {
            const source = this.outputContext.createBufferSource();

            source.buffer = audioBuffer;
            source.connect(this.outputContext.destination);
            source.start();

            // Return promise that resolves when audio finishes playing
            return new Promise(resolve => {
                source.onended = resolve;

                // Also resolve after buffer duration as fallback
                setTimeout(resolve, audioBuffer.duration * 1000 + 100);
            });
        } catch (error) {
            console.error('Error playing audio buffer:', error);
        }
    }

    /**
   * Create audio buffer from Float32Array.
   */
    createAudioBuffer(float32Array, sampleRate = 16000) {
        if (!this.outputContext) {
            throw new Error('Output context not initialized');
        }

        const audioBuffer = this.outputContext.createBuffer(
      1,
      float32Array.length,
      sampleRate
        );

        audioBuffer.copyToChannel(float32Array, 0);

        return audioBuffer;
    }

    /**
   * Get input stream for recording.
   */
    getInputStream() {
        return this.inputStream;
    }

    /**
   * Get output context for audio processing.
   */
    getOutputContext() {
        return this.outputContext;
    }

    /**
   * Check if routing is active.
   */
    isActive() {
        return this.isRouting;
    }

    /**
   * Get available BlackHole devices.
   */
    static async getBlackHoleDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            return devices.filter(device =>
                device.label.toLowerCase().includes('blackhole')
            );
        } catch (error) {
            console.error('Error getting BlackHole devices:', error);

            return [];
        }
    }

    /**
   * Check if BlackHole is available.
   */
    static async isBlackHoleAvailable() {
        const devices = await BlackHoleRouter.getBlackHoleDevices();

        return devices.length > 0;
    }

    /**
   * Create a virtual microphone stream that Jitsi Meet can use
   * This stream will contain the translated audio.
   */
    createVirtualMicrophone() {
        if (!this.outputDestination) {
            throw new Error('BlackHole not properly initialized');
        }

        // Return the MediaStream that contains translated audio
        // This can be used by Jitsi Meet as the microphone input
        return this.outputDestination.stream;
    }

    /**
   * Set up audio routing to feed translated audio into Jitsi Meet
   * Call this method after translation is complete.
   */
    async routeToJitsiMeet(audioBuffer) {
        if (!this.isInitialized) {
            console.warn('BlackHole not initialized, cannot route audio');

            return;
        }

        try {
            // Create buffer source
            const source = this.outputContext.createBufferSource();

            source.buffer = audioBuffer;

            // Connect through gain control to destination
            source.connect(this.gainNode);

            // Start playback
            source.start();

            console.log('Routed translated audio to BlackHole for Jitsi Meet');

            return new Promise(resolve => {
                source.onended = resolve;
                setTimeout(resolve, audioBuffer.duration * 1000 + 100);
            });
        } catch (error) {
            console.error('Error routing audio to Jitsi Meet:', error);
            throw error;
        }
    }

    /**
   * Get the MediaStream for Jitsi Meet to use as microphone input.
   */
    getJitsiMeetInputStream() {
        if (!this.outputDestination) {
            throw new Error('BlackHole not initialized');
        }

        return this.outputDestination.stream;
    }

    /**
   * Set gain for translated audio output.
   */
    setOutputGain(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, value));
        }
    }

    /**
   * Get current output gain.
   */
    getOutputGain() {
        return this.gainNode ? this.gainNode.gain.value : 0;
    }
}
