
/**
 * Class implementing the effect interface expected by a JitsiLocalTrack.
 * The UniversalTranslatorEffect replaces the original audio stream with translated audio
 * while maintaining the same interface as other stream effects.
 */
export class UniversalTranslatorEffect {
    /**
     * Original MediaStream from the JitsiLocalTrack that uses this effect.
     */
    _originalStream: MediaStream | null = null;

    /**
     * MediaStreamTrack obtained from the original MediaStream.
     */
    _originalTrack: MediaStreamTrack | null = null;

    /**
     * Translated audio stream that will replace the original.
     */
    _translatedStream: MediaStream | null = null;

    /**
     * MediaStreamTrack obtained from the translated stream.
     */
    _translatedTrack: MediaStreamTrack | null = null;

    /**
     * Audio context for creating the translated audio stream.
     */
    _audioContext: AudioContext | null = null;

    /**
     * Media stream destination for routing translated audio.
     */
    _streamDestination: MediaStreamAudioDestinationNode | null = null;

    /**
     * Whether the effect is currently active.
     */
    _isActive: boolean = false;

    /**
     * Queue of translated audio buffers to be played.
     */
    _audioQueue: AudioBuffer[] = [];

    /**
     * Whether audio is currently being processed.
     */
    _isProcessing: boolean = false;

    /**
     * Creates UniversalTranslatorEffect.
     */
    constructor() {
        // Initialize audio context
        this._audioContext = new AudioContext({
            sampleRate: 48000,
            latencyHint: 'interactive'
        });

        // Create destination for translated audio
        this._streamDestination = this._audioContext.createMediaStreamDestination();
        this._translatedStream = this._streamDestination.stream;
    }

    /**
     * Checks if the JitsiLocalTrack supports this effect.
     *
     * @param {JitsiLocalTrack} sourceLocalTrack - Track to which the effect will be applied.
     * @returns {boolean} - Returns true if this effect can run on the specified track, false otherwise.
     */
    isEnabled(sourceLocalTrack: any): boolean {
        // Only works with audio tracks
        return sourceLocalTrack.isAudioTrack();
    }

    /**
     * Effect interface called by source JitsiLocalTrack.
     * Returns the translated audio stream instead of the original.
     *
     * @param {MediaStream} audioStream - Original audio stream from microphone.
     * @returns {MediaStream} - MediaStream containing translated audio.
     */
    startEffect(audioStream: MediaStream): MediaStream {
        this._originalStream = audioStream;
        this._originalTrack = audioStream.getTracks()[0];
        this._isActive = true;

        console.log('UniversalTranslatorEffect: Started effect with translated stream');

        // Return the translated stream instead of the original
        return this._translatedStream!;
    }

    /**
     * Stop the translator effect.
     *
     * @returns {void}
     */
    stopEffect(): void {
        this._isActive = false;
        this._audioQueue = [];
        this._isProcessing = false;

        console.log('UniversalTranslatorEffect: Stopped effect');
    }

    /**
     * Change the muted state of the effect.
     *
     * @param {boolean} muted - Should effect be muted or not.
     * @returns {void}
     */
    setMuted(muted: boolean): void {
        if (this._translatedTrack) {
            this._translatedTrack.enabled = !muted;
        }
    }

    /**
     * Check whether or not this effect is muted.
     *
     * @returns {boolean}
     */
    isMuted(): boolean {
        return this._translatedTrack ? !this._translatedTrack.enabled : false;
    }

    /**
     * Add translated audio to be played through the effect.
     *
     * @param {AudioBuffer} audioBuffer - Translated audio buffer to play.
     * @returns {Promise<void>}
     */
    async playTranslatedAudio(audioBuffer: AudioBuffer): Promise<void> {
        if (!this._isActive || !this._audioContext || !this._streamDestination) {
            console.warn('UniversalTranslatorEffect: Effect not active, cannot play audio');

            return;
        }

        // Add to queue and process
        this._audioQueue.push(audioBuffer);

        if (!this._isProcessing) {
            this._processAudioQueue();
        }
    }

    /**
     * Process queued translated audio buffers.
     *
     * @returns {Promise<void>}
     */
    private async _processAudioQueue(): Promise<void> {
        if (this._isProcessing || !this._audioContext || !this._streamDestination) {
            return;
        }

        this._isProcessing = true;

        while (this._audioQueue.length > 0 && this._isActive) {
            const audioBuffer = this._audioQueue.shift()!;

            await this._playAudioBuffer(audioBuffer);
        }

        this._isProcessing = false;
    }

    /**
     * Play a single audio buffer through the translated stream.
     *
     * @param {AudioBuffer} audioBuffer - Audio buffer to play.
     * @returns {Promise<void>}
     */
    private async _playAudioBuffer(audioBuffer: AudioBuffer): Promise<void> {
        if (!this._audioContext || !this._streamDestination) {
            return;
        }

        try {
            const source = this._audioContext.createBufferSource();

            source.buffer = audioBuffer;
            source.connect(this._streamDestination);
            source.start();

            // Wait for the audio to finish playing
            return new Promise(resolve => {
                source.onended = () => resolve();
                // Fallback timeout
                setTimeout(resolve, audioBuffer.duration * 1000 + 100);
            });
        } catch (error) {
            console.error('UniversalTranslatorEffect: Error playing audio buffer:', error);
        }
    }

    /**
     * Get the original audio stream for translation processing.
     *
     * @returns {MediaStream | null} - Original microphone stream.
     */
    getOriginalStream(): MediaStream | null {
        return this._originalStream;
    }

    /**
     * Get the translated audio stream.
     *
     * @returns {MediaStream | null} - Stream containing translated audio.
     */
    getTranslatedStream(): MediaStream | null {
        return this._translatedStream;
    }

    /**
     * Check if the effect is currently active.
     *
     * @returns {boolean} - Whether the effect is active.
     */
    isActive(): boolean {
        return this._isActive;
    }

    /**
     * Create an audio buffer from a blob.
     *
     * @param {Blob} audioBlob - Audio blob to convert.
     * @returns {Promise<AudioBuffer>} - Converted audio buffer.
     */
    async createAudioBufferFromBlob(audioBlob: Blob): Promise<AudioBuffer> {
        if (!this._audioContext) {
            throw new Error('Audio context not initialized');
        }

        const arrayBuffer = await audioBlob.arrayBuffer();

        return await this._audioContext.decodeAudioData(arrayBuffer);
    }

    /**
     * Cleanup resources when effect is destroyed.
     *
     * @returns {void}
     */
    dispose(): void {
        this.stopEffect();

        if (this._audioContext) {
            this._audioContext.close();
            this._audioContext = null;
        }

        this._streamDestination = null;
        this._translatedStream = null;
        this._originalStream = null;
        this._originalTrack = null;
        this._translatedTrack = null;
    }
}
