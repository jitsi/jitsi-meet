// @ts-nocheck
/**
 * Text-to-Speech service providers for latency comparison
 * Supports multiple TTS services for benchmarking.
 */

/**
 * Base TTS Provider class.
 */
export class TTSProvider {
    constructor(name, config = {}) {
        this.name = name;
        this.config = config;
        this.isInitialized = false;
    }

    async initialize() {
        throw new Error('initialize() must be implemented by subclass');
    }

    async synthesize(text, language = 'en', voice = null) {
        throw new Error('synthesize() must be implemented by subclass');
    }

    getLatencyMetrics() {
        return {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
    }

    getAvailableVoices(language = 'en') {
        throw new Error('getAvailableVoices() must be implemented by subclass');
    }
}

/**
 * Cartesia TTS Provider (Sonic).
 */
export class CartesiaTTSProvider extends TTSProvider {
    constructor(config = {}) {
        super('Cartesia Sonic', config);
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api.cartesia.ai/tts/bytes';
        this.model = config.model || 'sonic-english';
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };

        // Updated with actual Cartesia voice IDs
        this.voiceMap = {
            'en': 'a0e99841-438c-4a64-b679-ae501e7d6091', // Barbershop Man
            'es': '846d6cb0-2301-48b6-9683-48f5618ea2f6', // Spanish voice
            'fr': 'f114a467-c40a-4db8-964d-aaba89cd08fa', // French voice
            'de': '2b568345-1d48-4047-b25f-7baccf842eb0', // German voice
            'ro': 'a0e99841-438c-4a64-b679-ae501e7d6091' // Romanian (using default voice - update if specific Romanian voice ID available)
        };
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('Cartesia API key is required');
        }
        this.isInitialized = true;
        console.log('Cartesia TTS Provider initialized');
    }

    async synthesize(text, language = 'en', voice = null) {
        if (!this.isInitialized) {
            throw new Error('Cartesia TTS not initialized');
        }

        const startTime = performance.now();

        try {
            const voiceId = voice || this.voiceMap[language] || this.voiceMap.en;

            const requestBody = {
                model_id: this.model,
                transcript: text,
                voice: {
                    mode: 'id',
                    id: voiceId
                },
                output_format: {
                    container: 'wav',
                    encoding: 'pcm_s16le',
                    sample_rate: 22050
                }
            };

            console.log('Cartesia TTS request:', {
                url: this.baseUrl,
                model: this.model,
                voice: voiceId,
                textLength: text.length
            });

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json',
                    'Cartesia-Version': '2024-06-10'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();

                console.error('Cartesia API error response:', errorText);
                throw new Error(`Cartesia API error: ${response.status} - ${errorText}`);
            }

            const audioBlob = await response.blob();

            const endTime = performance.now();
            const latency = endTime - startTime;

            this._updateLatencyMetrics(latency);

            return {
                audioBlob,
                provider: this.name,
                latency,
                language,
                voice: voiceId
            };
        } catch (error) {
            console.error('Cartesia TTS error:', error);
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

    getAvailableVoices(language = 'en') {
        return Object.keys(this.voiceMap);
    }
}

/**
 * ElevenLabs TTS Provider.
 */
export class ElevenLabsTTSProvider extends TTSProvider {
    constructor(config = {}) {
        super('ElevenLabs', config);
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api.elevenlabs.io/v1/text-to-speech';
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
        this.voiceMap = {
            'en': 'EXAVITQu4vr4xnSDxMaL', // Bella - English
            'es': '9BWtsMINqrJLrRacOk9x', // Spanish voice
            'fr': 'Xb7hH8MSUJpSbSDYk0k2', // French voice
            'de': 'N2lVS1w4EtoT3dr4eOWO' // German voice
        };
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('ElevenLabs API key is required');
        }
        this.isInitialized = true;
        console.log('ElevenLabs TTS Provider initialized');
    }

    async synthesize(text, language = 'en', voice = null) {
        if (!this.isInitialized) {
            throw new Error('ElevenLabs TTS not initialized');
        }

        const startTime = performance.now();

        try {
            const voiceId = voice || this.voiceMap[language] || this.voiceMap.en;

            const response = await fetch(`${this.baseUrl}/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status}`);
            }

            const audioBlob = await response.blob();

            const endTime = performance.now();
            const latency = endTime - startTime;

            this._updateLatencyMetrics(latency);

            return {
                audioBlob,
                provider: this.name,
                latency,
                language,
                voice: voiceId
            };
        } catch (error) {
            console.error('ElevenLabs TTS error:', error);
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

    getAvailableVoices(language = 'en') {
        return Object.keys(this.voiceMap);
    }
}

/**
 * Azure Speech TTS Provider.
 */
export class AzureTTSProvider extends TTSProvider {
    constructor(config = {}) {
        super('Azure Speech', config);
        this.apiKey = config.apiKey;
        this.region = config.region || 'eastus';
        this.baseUrl = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
        this.voiceMap = {
            'en': 'en-US-JennyNeural',
            'es': 'es-ES-ElviraNeural',
            'fr': 'fr-FR-DeniseNeural',
            'de': 'de-DE-KatjaNeural'
        };
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('Azure Speech API key is required');
        }
        this.isInitialized = true;
        console.log('Azure TTS Provider initialized');
    }

    async synthesize(text, language = 'en', voice = null) {
        if (!this.isInitialized) {
            throw new Error('Azure TTS not initialized');
        }

        const startTime = performance.now();

        try {
            const voiceName = voice || this.voiceMap[language] || this.voiceMap.en;

            const ssml = `
        <speak version='1.0' xml:lang='${language}'>
          <voice xml:lang='${language}' name='${voiceName}'>
            ${text}
          </voice>
        </speak>
      `;

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm'
                },
                body: ssml
            });

            if (!response.ok) {
                throw new Error(`Azure TTS API error: ${response.status}`);
            }

            const audioBlob = await response.blob();

            const endTime = performance.now();
            const latency = endTime - startTime;

            this._updateLatencyMetrics(latency);

            return {
                audioBlob,
                provider: this.name,
                latency,
                language,
                voice: voiceName
            };
        } catch (error) {
            console.error('Azure TTS error:', error);
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

    getAvailableVoices(language = 'en') {
        return Object.keys(this.voiceMap);
    }
}

/**
 * Deepgram TTS Provider (Aura).
 */
export class DeepgramTTSProvider extends TTSProvider {
    constructor(config = {}) {
        super('Deepgram Aura', config);
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api.deepgram.com/v1/speak';
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
        this.voiceMap = {
            'en': 'aura-asteria-en',
            'es': 'aura-luna-es',
            'fr': 'aura-stella-fr',
            'de': 'aura-hera-de'
        };
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('Deepgram API key is required');
        }
        this.isInitialized = true;
        console.log('Deepgram TTS Provider initialized');
    }

    async synthesize(text, language = 'en', voice = null) {
        if (!this.isInitialized) {
            throw new Error('Deepgram TTS not initialized');
        }

        const startTime = performance.now();

        try {
            const voiceName = voice || this.voiceMap[language] || this.voiceMap.en;

            const response = await fetch(`${this.baseUrl}?model=${voiceName}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text
                })
            });

            if (!response.ok) {
                throw new Error(`Deepgram TTS API error: ${response.status}`);
            }

            const audioBlob = await response.blob();

            const endTime = performance.now();
            const latency = endTime - startTime;

            this._updateLatencyMetrics(latency);

            return {
                audioBlob,
                provider: this.name,
                latency,
                language,
                voice: voiceName
            };
        } catch (error) {
            console.error('Deepgram TTS error:', error);
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

    getAvailableVoices(language = 'en') {
        return Object.keys(this.voiceMap);
    }
}

/**
 * Browser Web Speech API TTS Provider (Fallback).
 */
export class WebSpeechTTSProvider extends TTSProvider {
    constructor(config = {}) {
        super('Web Speech API', config);
        this.speechSynthesis = window.speechSynthesis;
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
    }

    async initialize() {
        if (!this.speechSynthesis) {
            throw new Error('Web Speech API not supported');
        }
        this.isInitialized = true;
        console.log('Web Speech TTS Provider initialized');
    }

    async synthesize(text, language = 'en', voice = null) {
        if (!this.isInitialized) {
            throw new Error('Web Speech TTS not initialized');
        }

        const startTime = performance.now();

        return new Promise((resolve, reject) => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);

                utterance.lang = language;

                if (voice) {
                    const voices = this.speechSynthesis.getVoices();
                    const selectedVoice = voices.find(v => v.name === voice || v.lang.startsWith(language));

                    if (selectedVoice) {
                        utterance.voice = selectedVoice;
                    }
                }

                utterance.onend = () => {
                    const endTime = performance.now();
                    const latency = endTime - startTime;

                    this._updateLatencyMetrics(latency);

                    // Note: Web Speech API doesn't provide audio blob directly
                    resolve({
                        audioBlob: null,
                        provider: this.name,
                        latency,
                        language,
                        voice: utterance.voice?.name || 'default'
                    });
                };

                utterance.onerror = error => {
                    reject(new Error(`Web Speech TTS error: ${error.error}`));
                };

                this.speechSynthesis.speak(utterance);
            } catch (error) {
                reject(error);
            }
        });
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

    getAvailableVoices(language = 'en') {
        if (!this.speechSynthesis) {
            return [];
        }

        const voices = this.speechSynthesis.getVoices();

        return voices
      .filter(voice => voice.lang.startsWith(language))
      .map(voice => voice.name);
    }
}

/**
 * TTS Provider Factory.
 */
export class TTSProviderFactory {
    static create(providerName, config = {}) {
        switch (providerName.toLowerCase()) {
        case 'cartesia':
            return new CartesiaTTSProvider(config);
        case 'elevenlabs':
            return new ElevenLabsTTSProvider(config);
        case 'azure':
            return new AzureTTSProvider(config);
        case 'deepgram':
            return new DeepgramTTSProvider(config);
        case 'webspeech':
            return new WebSpeechTTSProvider(config);
        default:
            throw new Error(`Unknown TTS provider: ${providerName}`);
        }
    }

    static getAvailableProviders() {
        return [
            'cartesia',
            'elevenlabs',
            'azure',
            'deepgram',
            'webspeech'
        ];
    }
}
