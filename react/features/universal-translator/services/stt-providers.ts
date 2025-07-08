// @ts-nocheck
/**
 * Speech-to-Text service providers for latency comparison
 * Supports multiple STT services for benchmarking.
 */

// import { WhisperProcessor } from '../audio/whisper-processor.js';

/**
 * Base STT Provider class.
 */
export class STTProvider {
    constructor(name, config = {}) {
        this.name = name;
        this.config = config;
        this.isInitialized = false;
    }

    async initialize() {
        throw new Error('initialize() must be implemented by subclass');
    }

    async transcribe(audioData) {
        throw new Error('transcribe() must be implemented by subclass');
    }

    getLatencyMetrics() {
        return {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
    }
}

/**
 * Whisper (local) STT Provider.
 */
export class WhisperSTTProvider extends STTProvider {
    constructor(config = {}) {
        super('Whisper (Local)', config);

        // this.processor = new WhisperProcessor();
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
    }

    async initialize() {
        try {
            // await this.processor.initializeModel();
            // this.isInitialized = true;
            // console.log('Whisper STT Provider initialized');
            throw new Error('Local Whisper processing is not available. Missing @xenova/transformers dependency.');
        } catch (error) {
            console.error('Failed to initialize Whisper STT:', error);
            throw error;
        }
    }

    async transcribe(audioData) {
    // if (!this.isInitialized) {
    //   throw new Error('Whisper STT not initialized');
    // }

        const startTime = performance.now();

        try {
            // const result = await this.processor.processAudio(audioData);
            throw new Error('Local Whisper processing is not available. Please use an external STT provider.');
        } catch (error) {
            console.error('Whisper transcription error:', error);
            throw error;
        }
    }

    _updateLatencyMetrics(latency) {
        this.latencyMetrics.requestCount++;
        this.latencyMetrics.lastLatency = latency;
        this.latencyMetrics.averageLatency
      = (this.latencyMetrics.averageLatency * (this.latencyMetrics.requestCount - 1) + latency)
      / this.latencyMetrics.requestCount;
    }

    getLatencyMetrics() {
        return { ...this.latencyMetrics };
    }
}

/**
 * Groq STT Provider.
 */
export class GroqSTTProvider extends STTProvider {
    constructor(config = {}) {
        super('Groq Whisper', config);
        this.apiKey = config.apiKey;
        this.model = config.model || 'whisper-large-v3-turbo';
        this.baseUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('Groq API key is required');
        }
        this.isInitialized = true;
        console.log('Groq STT Provider initialized');
    }

    async transcribe(audioBlob) {
        if (!this.isInitialized) {
            throw new Error('Groq STT not initialized');
        }

        const startTime = performance.now();

        try {
            const formData = new FormData();

            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', this.model);
            formData.append('response_format', 'verbose_json');
            formData.append('language', 'auto');

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status}`);
            }

            const result = await response.json();

            const endTime = performance.now();
            const latency = endTime - startTime;

            this._updateLatencyMetrics(latency);

            return {
                text: result.text,
                language: result.language || 'en',
                confidence: result.confidence || 0.95,
                provider: this.name,
                latency
            };
        } catch (error) {
            console.error('Groq transcription error:', error);
            throw error;
        }
    }

    _updateLatencyMetrics(latency) {
        this.latencyMetrics.requestCount++;
        this.latencyMetrics.lastLatency = latency;
        this.latencyMetrics.averageLatency
      = (this.latencyMetrics.averageLatency * (this.latencyMetrics.requestCount - 1) + latency)
      / this.latencyMetrics.requestCount;
    }

    getLatencyMetrics() {
        return { ...this.latencyMetrics };
    }
}

/**
 * Deepgram STT Provider.
 */
export class DeepgramSTTProvider extends STTProvider {
    constructor(config = {}) {
        super('Deepgram Nova-2', config);
        this.apiKey = config.apiKey;
        this.model = config.model || 'nova-2';
        this.baseUrl = 'https://api.deepgram.com/v1/listen';
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('Deepgram API key is required');
        }
        this.isInitialized = true;
        console.log('Deepgram STT Provider initialized');
    }

    async transcribe(audioBlob) {
        if (!this.isInitialized) {
            throw new Error('Deepgram STT not initialized');
        }

        const startTime = performance.now();

        try {
            // Log audio blob info for debugging
            console.log('Deepgram: Processing audio blob', audioBlob.size, 'bytes, type:', audioBlob.type);
            
            const url = `${this.baseUrl}?model=${this.model}&smart_format=true&detect_language=true&punctuate=true&diarize=false`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.apiKey}`,
                    'Content-Type': audioBlob.type || 'audio/wav'
                },
                body: audioBlob
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Deepgram API error response:', response.status, errorText);
                throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();

            const endTime = performance.now();
            const latency = endTime - startTime;

            this._updateLatencyMetrics(latency);

            const transcript = result.results?.channels?.[0]?.alternatives?.[0];
            const transcriptText = transcript?.transcript || '';
            
            console.log('Deepgram result:', transcriptText);

            return {
                text: transcriptText,
                language: result.results?.channels?.[0]?.detected_language || 'en',
                confidence: transcript?.confidence || 0.95,
                provider: this.name,
                latency
            };
        } catch (error) {
            console.error('Deepgram transcription error:', error);
            throw error;
        }
    }

    _updateLatencyMetrics(latency) {
        this.latencyMetrics.requestCount++;
        this.latencyMetrics.lastLatency = latency;
        this.latencyMetrics.averageLatency
      = (this.latencyMetrics.averageLatency * (this.latencyMetrics.requestCount - 1) + latency)
      / this.latencyMetrics.requestCount;
    }

    getLatencyMetrics() {
        return { ...this.latencyMetrics };
    }
}

/**
 * AssemblyAI STT Provider.
 */
export class AssemblyAISTTProvider extends STTProvider {
    constructor(config = {}) {
        super('AssemblyAI Universal-2', config);
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api.assemblyai.com/v2/transcript';
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('AssemblyAI API key is required');
        }
        this.isInitialized = true;
        console.log('AssemblyAI STT Provider initialized');
    }

    async transcribe(audioBlob) {
        if (!this.isInitialized) {
            throw new Error('AssemblyAI STT not initialized');
        }

        const startTime = performance.now();

        try {
            // First, upload the audio file
            const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
                method: 'POST',
                headers: {
                    'Authorization': this.apiKey,
                    'Content-Type': 'application/octet-stream'
                },
                body: audioBlob
            });

            if (!uploadResponse.ok) {
                throw new Error(`AssemblyAI upload error: ${uploadResponse.status}`);
            }

            const uploadResult = await uploadResponse.json();

            // Then, request transcription
            const transcriptionResponse = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    audio_url: uploadResult.upload_url,
                    language_detection: true
                })
            });

            if (!transcriptionResponse.ok) {
                throw new Error(`AssemblyAI transcription error: ${transcriptionResponse.status}`);
            }

            const result = await transcriptionResponse.json();

            const endTime = performance.now();
            const latency = endTime - startTime;

            this._updateLatencyMetrics(latency);

            return {
                text: result.text || '',
                language: result.language_code || 'en',
                confidence: result.confidence || 0.95,
                provider: this.name,
                latency
            };
        } catch (error) {
            console.error('AssemblyAI transcription error:', error);
            throw error;
        }
    }

    _updateLatencyMetrics(latency) {
        this.latencyMetrics.requestCount++;
        this.latencyMetrics.lastLatency = latency;
        this.latencyMetrics.averageLatency
      = (this.latencyMetrics.averageLatency * (this.latencyMetrics.requestCount - 1) + latency)
      / this.latencyMetrics.requestCount;
    }

    getLatencyMetrics() {
        return { ...this.latencyMetrics };
    }
}

/**
 * STT Provider Factory.
 */
export class STTProviderFactory {
    static create(providerName, config = {}) {
        switch (providerName.toLowerCase()) {
        case 'whisper':
            return new WhisperSTTProvider(config);
        case 'groq':
            return new GroqSTTProvider(config);
        case 'deepgram':
            return new DeepgramSTTProvider(config);
        case 'assemblyai':
            return new AssemblyAISTTProvider(config);
        default:
            throw new Error(`Unknown STT provider: ${providerName}`);
        }
    }

    static getAvailableProviders() {
        return [
            'whisper',
            'groq',
            'deepgram',
            'assemblyai'
        ];
    }
}
