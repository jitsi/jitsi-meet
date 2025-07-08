import { IStore } from '../app/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { UniversalTranslatorEffect } from '../stream-effects/universal-translator';

import {
    INIT_UNIVERSAL_TRANSLATOR,
    START_TRANSLATION_RECORDING,
    STOP_TRANSLATION_RECORDING
} from './actionTypes';
import {
    setTranscriptionResult,
    setTranslationError,
    setTranslationResult,
    updateLatencyMetrics,
    updateProcessingStep,
    updateTranslationStatus
} from './actions';
// @ts-ignore - whisper-processor is a .js file without types
// import { WhisperProcessor } from './audio/whisper-processor';
// @ts-ignore - audio-utils is a .js file without types
import { convertWebMToFloat32, createAudioRecorder, getUserMediaForSpeech, float32ArrayToBlob } from './audio/audio-utils';
// @ts-ignore - blackhole-router is a .js file without types  
import { BlackHoleRouter } from './audio/blackhole-router';
import { getUniversalTranslatorEffect } from './middleware/streamEffectMiddleware';
import { STTProviderFactory } from './services/stt-providers';
import { TranslationProviderFactory } from './services/translation';
import { TTSProviderFactory } from './services/tts-providers';

/**
 * Universal translator service instance.
 */
let translatorService: UniversalTranslatorService | null = null;

/**
 * Universal Translator Service class that orchestrates the translation pipeline.
 */
class UniversalTranslatorService {
    // private whisperProcessor: WhisperProcessor;
    private sttProviders: Map<string, any> = new Map();
    private ttsProviders: Map<string, any> = new Map();
    private translationProviders: Map<string, any> = new Map();
    private blackHoleRouter: BlackHoleRouter;
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private processingInterval: number = 3000; // Process every 3 seconds
    private isRecordingContinuously: boolean = false;
    private isProcessingChunk: boolean = false; // Prevent overlapping processing
    private intervalId: any = null;
    private dispatch: IStore['dispatch'];
    private getState: IStore['getState'];

    constructor(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        this.dispatch = dispatch;
        this.getState = getState;
        // this.whisperProcessor = new WhisperProcessor();
        this.blackHoleRouter = new BlackHoleRouter();
    }

    /**
     * Initialize the translation service.
     */
    async initialize(config: any) {
        try {
            console.log('Initializing Universal Translator Service...');

            // Initialize Whisper processor
            // await this.whisperProcessor.initializeModel();

            // Initialize BlackHole router
            await this.blackHoleRouter.initialize();

            console.log('Universal Translator Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Universal Translator Service:', error);
            this.dispatch(setTranslationError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }

    /**
     * Start translation recording.
     */
    async startRecording() {
        try {
            console.log('Starting universal translator real-time translation...');
            this.dispatch(updateProcessingStep('recording'));
            this.dispatch(updateTranslationStatus('recording'));

            // Get audio stream (prefer BlackHole if available)
            this.stream = this.blackHoleRouter.getInputStream() || await getUserMediaForSpeech();
            console.log('Audio stream acquired');

            // Create media recorder for continuous recording without time slicing
            // This will record continuously and we'll process complete recordings at intervals
            this.mediaRecorder = createAudioRecorder(this.stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            this.audioChunks = [];
            this.isRecordingContinuously = true;

            if (this.mediaRecorder) {
                this.mediaRecorder.ondataavailable = async (event) => {
                    if (event.data.size > 0 && this.isRecordingContinuously) {
                        console.log(`Complete audio recording received: ${event.data.size} bytes`);
                        
                        if (!this.isProcessingChunk) {
                            this.isProcessingChunk = true;
                            
                            try {
                                // Convert complete WebM file to WAV
                                const float32Array = await convertWebMToFloat32(event.data);
                                const wavBlob = float32ArrayToBlob(float32Array);
                                await this.processAudioChunk(wavBlob);
                            } catch (conversionError) {
                                console.warn('WebM conversion failed:', conversionError);
                            } finally {
                                this.isProcessingChunk = false;
                            }
                        }
                    }
                };

                this.mediaRecorder.onstop = () => {
                    console.log('MediaRecorder stopped');
                    if (this.isRecordingContinuously) {
                        // Restart recording if we're still supposed to be recording
                        setTimeout(() => {
                            if (this.mediaRecorder && this.isRecordingContinuously) {
                                this.mediaRecorder.start();
                                console.log('MediaRecorder restarted for next interval');
                            }
                        }, 100);
                    }
                };
                
                this.mediaRecorder.onerror = (event) => {
                    console.error('MediaRecorder error:', event);
                };
                
                this.mediaRecorder.onstart = () => {
                    console.log('MediaRecorder started successfully');
                };
            }

            // Start recording without time slicing (will record until manually stopped)
            this.mediaRecorder?.start();
            
            // Set up interval to stop and restart recording every few seconds for processing
            this.intervalId = setInterval(() => {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording' && !this.isProcessingChunk) {
                    console.log(`Stopping recording for processing (${this.processingInterval}ms interval)`);
                    this.mediaRecorder.stop();
                }
            }, this.processingInterval);
            
            console.log(`Real-time translation started - processing every ${this.processingInterval}ms`);

        } catch (error) {
            console.error('Failed to start recording:', error);
            this.dispatch(setTranslationError(`Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }


    /**
     * Stop translation recording.
     */
    async stopRecording() {
        this.isRecordingContinuously = false;
        this.isProcessingChunk = false;
        
        // Clear the interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Clear any remaining chunks
        this.audioChunks = [];
        
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();

            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
        }
    }

    /**
     * Process a single audio chunk for real-time translation.
     */
    private async processAudioChunk(audioChunk: Blob) {
        try {
            const state = this.getState();
            const universalTranslator = state['features/universal-translator'];

            if (!universalTranslator || !this.isRecordingContinuously) {
                return;
            }

            // Check if audio chunk is large enough (minimum 1KB)
            if (audioChunk.size < 1024) {
                console.log('Skipping chunk - too small:', audioChunk.size, 'bytes');
                return;
            }

            console.log('Processing audio chunk for real-time translation...', audioChunk.size, 'bytes');

            // Step 1: Speech-to-Text
            const transcriptionResult = await this.performSTT(audioChunk, universalTranslator);

            // Skip if no meaningful transcription
            if (!transcriptionResult.text || transcriptionResult.text.trim().length < 2) {
                console.log('Skipping chunk - no meaningful speech detected:', transcriptionResult.text);
                return;
            }

            this.dispatch(setTranscriptionResult(transcriptionResult));

            // Step 2: Translation
            const translationResult = await this.performTranslation(
                transcriptionResult.text,
                universalTranslator.sourceLanguage,
                universalTranslator.targetLanguage,
                universalTranslator
            );

            this.dispatch(setTranslationResult(translationResult));

            // Step 3: Text-to-Speech
            const ttsResult = await this.performTTS(
                translationResult.translatedText,
                universalTranslator.targetLanguage,
                universalTranslator
            );

            // Step 4: Audio Playback
            await this.playTranslatedAudio(ttsResult.audioBlob);

            console.log('Real-time translation chunk completed successfully');

        } catch (error) {
            console.error('Failed to process audio chunk:', error);
            // Don't dispatch error for individual chunks to avoid spam
        }
    }

    /**
     * Perform speech-to-text conversion.
     */
    private async performSTT(audioBlob: Blob, config: any) {
        const startTime = performance.now();

        try {
            let result;

            if (config.sttProvider === 'whisper') {
                // Use local Whisper processing (currently disabled - missing @xenova/transformers dependency)
                // const audioData = await convertWebMToFloat32(audioBlob);
                // result = await this.whisperProcessor.processAudio(audioData);
                throw new Error('Local Whisper processing is not available. Please use an external STT provider.');
            } else {
                // Use external STT provider
                const provider = await this.getOrCreateSTTProvider(config.sttProvider, config.apiKeys);

                result = await provider.transcribe(audioBlob);
            }

            const endTime = performance.now();
            const latency = endTime - startTime;

            this.dispatch(updateLatencyMetrics({
                stt: {
                    lastLatency: latency,
                    averageLatency: latency, // Will be properly calculated by provider
                    requestCount: 1
                }
            }));

            return result;
        } catch (error) {
            throw new Error(`STT failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Perform text translation.
     */
    private async performTranslation(text: string, sourceLang: string, targetLang: string, config: any) {
        const startTime = performance.now();

        try {
            const provider = await this.getOrCreateTranslationProvider(config.translationProvider, config.apiKeys);
            const result = await provider.translate(text, sourceLang, targetLang);

            const endTime = performance.now();
            const latency = endTime - startTime;

            this.dispatch(updateLatencyMetrics({
                translation: {
                    lastLatency: latency,
                    averageLatency: latency,
                    requestCount: 1
                }
            }));

            return result;
        } catch (error) {
            throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Perform text-to-speech synthesis.
     */
    private async performTTS(text: string, language: string, config: any) {
        const startTime = performance.now();

        try {
            const provider = await this.getOrCreateTTSProvider(config.ttsProvider, config.apiKeys);
            const result = await provider.synthesize(text, language);

            const endTime = performance.now();
            const latency = endTime - startTime;

            this.dispatch(updateLatencyMetrics({
                tts: {
                    lastLatency: latency,
                    averageLatency: latency,
                    requestCount: 1
                }
            }));

            return result;
        } catch (error) {
            throw new Error(`TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Play translated audio through Universal Translator Effect or fallback methods.
     */
    private async playTranslatedAudio(audioBlob: Blob) {
        try {
            const effect = getUniversalTranslatorEffect();

            if (effect && effect.isActive()) {
                // Convert blob to audio buffer and route through the effect
                const audioBuffer = await effect.createAudioBufferFromBlob(audioBlob);

                await effect.playTranslatedAudio(audioBuffer);

                console.log('Translated audio routed to Jitsi Meet via UniversalTranslatorEffect');
            } else if (this.blackHoleRouter.isActive()) {
                // Fallback to BlackHole if effect is not active
                const audioContext = this.blackHoleRouter.getOutputContext();
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                await this.blackHoleRouter.routeToJitsiMeet(audioBuffer);

                console.log('Translated audio routed to Jitsi Meet via BlackHole (fallback)');
            } else {
                // Final fallback to regular audio playback
                const audio = new Audio(URL.createObjectURL(audioBlob));

                await audio.play();
                console.log('Translated audio played via default output (fallback)');
            }
        } catch (error) {
            console.warn('Audio playback failed:', error);
            // Non-critical error, don't throw
        }
    }

    /**
     * Get or create STT provider instance.
     */
    private async getOrCreateSTTProvider(providerName: string, apiKeys: any) {
        if (!this.sttProviders.has(providerName)) {
            console.log(`Creating STT provider: ${providerName} with API key: ${apiKeys[providerName] ? 'present' : 'missing'}`);
            const provider = STTProviderFactory.create(providerName, {
                apiKey: apiKeys[providerName]
            });

            await provider.initialize();
            this.sttProviders.set(providerName, provider);
            console.log(`STT provider ${providerName} initialized successfully`);
        }

        return this.sttProviders.get(providerName);
    }

    /**
     * Get or create TTS provider instance.
     */
    private async getOrCreateTTSProvider(providerName: string, apiKeys: any) {
        if (!this.ttsProviders.has(providerName)) {
            console.log(`Creating TTS provider: ${providerName} with API key: ${apiKeys[providerName] ? 'present' : 'missing'}`);
            const provider = TTSProviderFactory.create(providerName, {
                apiKey: apiKeys[providerName]
            });

            await provider.initialize();
            this.ttsProviders.set(providerName, provider);
            console.log(`TTS provider ${providerName} initialized successfully`);
        }

        return this.ttsProviders.get(providerName);
    }

    /**
     * Get or create translation provider instance.
     */
    private async getOrCreateTranslationProvider(providerName: string, apiKeys: any) {
        if (!this.translationProviders.has(providerName)) {
            console.log(`Creating translation provider: ${providerName} with API key: ${apiKeys[providerName] ? 'present' : 'missing'}`);
            const provider = TranslationProviderFactory.create(providerName, {
                apiKey: apiKeys[providerName]
            });

            await provider.initialize();
            this.translationProviders.set(providerName, provider);
            console.log(`Translation provider ${providerName} initialized successfully`);
        }

        return this.translationProviders.get(providerName);
    }
}

/**
 * Middleware to handle universal translator actions.
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: any) => {
    const { dispatch, getState } = store;

    switch (action.type) {
    case INIT_UNIVERSAL_TRANSLATOR:
        if (!translatorService) {
            translatorService = new UniversalTranslatorService(dispatch, getState);
            translatorService.initialize(action.config);
        }
        break;

    case START_TRANSLATION_RECORDING:
        if (translatorService) {
            translatorService.startRecording();
        } else {
            dispatch(setTranslationError('Translator service not initialized'));
        }
        break;

    case STOP_TRANSLATION_RECORDING:
        if (translatorService) {
            translatorService.stopRecording();
        }
        break;
    }

    return next(action);
});
