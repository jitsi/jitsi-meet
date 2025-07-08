// @ts-nocheck
/**
 * Translation service for converting text between languages
 * Supports multiple translation providers for comparison.
 */

/**
 * Base Translation Provider class.
 */
export class TranslationProvider {
    constructor(name, config = {}) {
        this.name = name;
        this.config = config;
        this.isInitialized = false;
        this.supportedLanguages = [];
    }

    async initialize() {
        throw new Error('initialize() must be implemented by subclass');
    }

    async translate(text, sourceLang, targetLang) {
        throw new Error('translate() must be implemented by subclass');
    }

    async detectLanguage(text) {
        throw new Error('detectLanguage() must be implemented by subclass');
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
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
 * OpenAI GPT-4 Translation Provider.
 */
export class OpenAITranslationProvider extends TranslationProvider {
    constructor(config = {}) {
        super('OpenAI GPT-4', config);
        this.apiKey = config.apiKey;
        this.model = config.model || 'gpt-4-turbo-preview';
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
        this.supportedLanguages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ro', 'ru', 'ja', 'ko', 'zh',
            'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
        ];
        this.languageNames = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ro': 'Romanian',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'tr': 'Turkish',
            'pl': 'Polish',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'da': 'Danish',
            'no': 'Norwegian',
            'fi': 'Finnish'
        };
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this.isInitialized = true;
        console.log('OpenAI Translation Provider initialized');
    }

    async translate(text, sourceLang, targetLang) {
        if (!this.isInitialized) {
            throw new Error('OpenAI Translation Provider not initialized');
        }

        const startTime = performance.now();

        try {
            const sourceLanguage = this.languageNames[sourceLang] || sourceLang;
            const targetLanguage = this.languageNames[targetLang] || targetLang;

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional translator. Translate the given text from ${sourceLanguage} to ${targetLanguage}. Return only the translation without any additional text or explanations. Maintain the tone and context of the original text.`
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const result = await response.json();

            const endTime = performance.now();
            const latency = endTime - startTime;

            this._updateLatencyMetrics(latency);

            return {
                translatedText: result.choices[0].message.content.trim(),
                sourceLang,
                targetLang,
                provider: this.name,
                latency,
                confidence: 0.95
            };
        } catch (error) {
            console.error('OpenAI translation error:', error);
            throw error;
        }
    }

    async detectLanguage(text) {
        if (!this.isInitialized) {
            throw new Error('OpenAI Translation Provider not initialized');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'Detect the language of the given text and return only the ISO 639-1 language code (e.g., "en", "es", "fr"). Return only the code.'
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ],
                    max_tokens: 10,
                    temperature: 0
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const result = await response.json();
            const detectedLang = result.choices[0].message.content.trim().toLowerCase();

            return {
                language: detectedLang,
                confidence: 0.95,
                provider: this.name
            };
        } catch (error) {
            console.error('OpenAI language detection error:', error);

            return {
                language: 'en',
                confidence: 0.5,
                provider: this.name
            };
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
 * Google Translate Provider.
 */
export class GoogleTranslateProvider extends TranslationProvider {
    constructor(config = {}) {
        super('Google Translate', config);
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
        this.supportedLanguages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ro', 'ru', 'ja', 'ko', 'zh',
            'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi', 'he',
            'th', 'vi', 'id', 'ms', 'tl', 'cy', 'ga', 'mt', 'is'
        ];
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('Google Translate API key is required');
        }
        this.isInitialized = true;
        console.log('Google Translate Provider initialized');
    }

    async translate(text, sourceLang, targetLang) {
        if (!this.isInitialized) {
            throw new Error('Google Translate Provider not initialized');
        }

        const startTime = performance.now();

        try {
            const params = new URLSearchParams({
                key: this.apiKey,
                q: text,
                source: sourceLang,
                target: targetLang,
                format: 'text'
            });

            const response = await fetch(`${this.baseUrl}?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) {
                throw new Error(`Google Translate API error: ${response.status}`);
            }

            const result = await response.json();

            const endTime = performance.now();
            const latency = endTime - startTime;

            this._updateLatencyMetrics(latency);

            return {
                translatedText: result.data.translations[0].translatedText,
                sourceLang,
                targetLang,
                provider: this.name,
                latency,
                confidence: 0.98
            };
        } catch (error) {
            console.error('Google Translate error:', error);
            throw error;
        }
    }

    async detectLanguage(text) {
        if (!this.isInitialized) {
            throw new Error('Google Translate Provider not initialized');
        }

        try {
            const params = new URLSearchParams({
                key: this.apiKey,
                q: text
            });

            const response = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) {
                throw new Error(`Google Translate API error: ${response.status}`);
            }

            const result = await response.json();
            const detection = result.data.detections[0][0];

            return {
                language: detection.language,
                confidence: detection.confidence,
                provider: this.name
            };
        } catch (error) {
            console.error('Google language detection error:', error);

            return {
                language: 'en',
                confidence: 0.5,
                provider: this.name
            };
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
 * Microsoft Translator Provider.
 */
export class MicrosoftTranslatorProvider extends TranslationProvider {
    constructor(config = {}) {
        super('Microsoft Translator', config);
        this.apiKey = config.apiKey;
        this.region = config.region || 'eastus';
        this.baseUrl = 'https://api.cognitive.microsofttranslator.com';
        this.latencyMetrics = {
            averageLatency: 0,
            lastLatency: 0,
            requestCount: 0
        };
        this.supportedLanguages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ro', 'ru', 'ja', 'ko', 'zh',
            'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
        ];
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('Microsoft Translator API key is required');
        }
        this.isInitialized = true;
        console.log('Microsoft Translator Provider initialized');
    }

    async translate(text, sourceLang, targetLang) {
        if (!this.isInitialized) {
            throw new Error('Microsoft Translator Provider not initialized');
        }

        const startTime = performance.now();

        try {
            const response = await fetch(`${this.baseUrl}/translate?api-version=3.0&from=${sourceLang}&to=${targetLang}`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey,
                    'Ocp-Apim-Subscription-Region': this.region,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([ { text } ])
            });

            if (!response.ok) {
                throw new Error(`Microsoft Translator API error: ${response.status}`);
            }

            const result = await response.json();

            const endTime = performance.now();
            const latency = endTime - startTime;

            this._updateLatencyMetrics(latency);

            return {
                translatedText: result[0].translations[0].text,
                sourceLang,
                targetLang,
                provider: this.name,
                latency,
                confidence: result[0].translations[0].confidence || 0.95
            };
        } catch (error) {
            console.error('Microsoft Translator error:', error);
            throw error;
        }
    }

    async detectLanguage(text) {
        if (!this.isInitialized) {
            throw new Error('Microsoft Translator Provider not initialized');
        }

        try {
            const response = await fetch(`${this.baseUrl}/detect?api-version=3.0`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey,
                    'Ocp-Apim-Subscription-Region': this.region,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([ { text } ])
            });

            if (!response.ok) {
                throw new Error(`Microsoft Translator API error: ${response.status}`);
            }

            const result = await response.json();

            return {
                language: result[0].language,
                confidence: result[0].score,
                provider: this.name
            };
        } catch (error) {
            console.error('Microsoft language detection error:', error);

            return {
                language: 'en',
                confidence: 0.5,
                provider: this.name
            };
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
 * Translation Service Factory.
 */
export class TranslationProviderFactory {
    static create(providerName, config = {}) {
        switch (providerName.toLowerCase()) {
        case 'openai':
            return new OpenAITranslationProvider(config);
        case 'google':
            return new GoogleTranslateProvider(config);
        case 'microsoft':
            return new MicrosoftTranslatorProvider(config);
        default:
            throw new Error(`Unknown translation provider: ${providerName}`);
        }
    }

    static getAvailableProviders() {
        return [
            'openai',
            'google',
            'microsoft'
        ];
    }
}

/**
 * Universal Translation Service
 * Orchestrates the complete translation pipeline.
 */
export class UniversalTranslationService {
    constructor(config = {}) {
        this.translationProvider = null;
        this.fallbackProvider = null;
        this.config = config;
    }

    async initialize(primaryProvider, fallbackProvider = null) {
        this.translationProvider = TranslationProviderFactory.create(primaryProvider, this.config[primaryProvider]);
        await this.translationProvider.initialize();

        if (fallbackProvider) {
            this.fallbackProvider = TranslationProviderFactory.create(fallbackProvider, this.config[fallbackProvider]);
            await this.fallbackProvider.initialize();
        }

        console.log('Universal Translation Service initialized');
    }

    async translateText(text, sourceLang, targetLang) {
        try {
            return await this.translationProvider.translate(text, sourceLang, targetLang);
        } catch (error) {
            console.warn('Primary translation provider failed, trying fallback:', error);

            if (this.fallbackProvider) {
                try {
                    return await this.fallbackProvider.translate(text, sourceLang, targetLang);
                } catch (fallbackError) {
                    console.error('Fallback translation provider also failed:', fallbackError);
                    throw fallbackError;
                }
            }

            throw error;
        }
    }

    async detectLanguage(text) {
        try {
            return await this.translationProvider.detectLanguage(text);
        } catch (error) {
            if (this.fallbackProvider) {
                try {
                    return await this.fallbackProvider.detectLanguage(text);
                } catch (fallbackError) {
                    console.error('Language detection failed on both providers');

                    return { language: 'en',
                        confidence: 0.5,
                        provider: 'fallback' };
                }
            }

            return { language: 'en',
                confidence: 0.5,
                provider: 'fallback' };
        }
    }

    getLatencyMetrics() {
        return {
            primary: this.translationProvider?.getLatencyMetrics(),
            fallback: this.fallbackProvider?.getLatencyMetrics()
        };
    }

    getSupportedLanguages() {
        return this.translationProvider?.getSupportedLanguages() || [];
    }
}
