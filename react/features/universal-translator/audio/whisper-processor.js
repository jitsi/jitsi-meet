import { env, pipeline } from '@xenova/transformers';

/**
 * Whisper-based speech-to-text processor
 * Adapted from standalone-meeting-assist for universal translation.
 */
export class WhisperProcessor {
    constructor() {
        this.transcriber = null;
        this.isModelLoading = true;
        this.modelLoadingPromise = null;
    }

    /**
   * Initialize the Whisper model.
   */
    async initializeModel() {
        if (this.modelLoadingPromise) {
            return this.modelLoadingPromise;
        }

        this.modelLoadingPromise = this._loadModel();

        return this.modelLoadingPromise;
    }

    async _loadModel() {
        try {
            console.log('Loading Whisper model...');
            env.allowLocalModels = false;
            env.useBrowserCache = false;

            this.transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-base'
            );

            this.isModelLoading = false;
            console.log('Whisper model loaded successfully');

            return this.transcriber;
        } catch (error) {
            console.error('Error loading Whisper model:', error);
            this.isModelLoading = false;
            throw error;
        }
    }

    /**
   * Process audio data and return transcription with language detection.
   */
    async processAudio(audioData, options = {}) {
        if (!this.transcriber) {
            throw new Error('Whisper model not initialized');
        }

        const {
            language = 'auto',
            chunkLengthS = 30,
            strideLengthS = 5,
            returnTimestamps = false
        } = options;

        try {
            const result = await this.transcriber(audioData, {
                chunk_length_s: chunkLengthS,
                stride_length_s: strideLengthS,
                language: language === 'auto' ? undefined : language,
                return_timestamps: returnTimestamps
            });

            return {
                text: result.text,
                language: this._detectLanguage(result.text),
                confidence: result.confidence || 0.95,
                timestamps: result.chunks || []
            };
        } catch (error) {
            console.error('Transcription error:', error);
            throw error;
        }
    }

    /**
   * Simple language detection based on text patterns
   * In production, use a proper language detection service.
   */
    _detectLanguage(text) {
    // Simple heuristic-based language detection
    // This should be replaced with a proper language detection service
        const languagePatterns = {
            'en': /^[a-zA-Z\s.,!?'"()-]+$/,
            'es': /[ñáéíóúüÑÁÉÍÓÚÜ]/,
            'fr': /[àâäçéèêëîïôöùûüÿÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]/,
            'de': /[äöüßÄÖÜ]/,
            'pt': /[ãõçÃÕÇ]/,
            'it': /[àèéìíîòóù]/
        };

        for (const [ lang, pattern ] of Object.entries(languagePatterns)) {
            if (pattern.test(text)) {
                return lang;
            }
        }

        return 'en'; // Default to English
    }

    /**
   * Check if the model is ready for processing.
   */
    isReady() {
        return !this.isModelLoading && this.transcriber !== null;
    }

    /**
   * Get model loading status.
   */
    getLoadingStatus() {
        return {
            isLoading: this.isModelLoading,
            isReady: this.isReady()
        };
    }
}
