import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import { hideDialog } from '../../base/dialog/actions';
import Dialog from '../../base/ui/components/web/Dialog';
import {
    clearTranslationError,
    disableUniversalTranslatorEffect,
    enableUniversalTranslatorEffect,
    initUniversalTranslator,
    setApiKeys,
    setSTTProvider,
    setSourceLanguage,
    setTTSProvider,
    setTargetLanguage,
    setTranslationError,
    setTranslationProvider,
    startTranslationRecording,
    stopTranslationRecording
} from '../actions';
import { IUniversalTranslatorState } from '../reducer';

// Language options
const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' }
];

// Service options
const sttOptions = [
    { id: 'whisper', name: 'Whisper (Local)', latency: '~200ms' },
    { id: 'groq', name: 'Groq Whisper', latency: '~100ms' },
    { id: 'deepgram', name: 'Deepgram Nova-2', latency: '~100ms' },
    { id: 'assemblyai', name: 'AssemblyAI Universal-2', latency: '~150ms' }
];

const ttsOptions = [
    { id: 'cartesia', name: 'Cartesia Sonic', latency: '~40ms' },
    { id: 'elevenlabs', name: 'ElevenLabs', latency: '~300ms' },
    { id: 'deepgram', name: 'Deepgram Aura', latency: '~400ms' },
    { id: 'webspeech', name: 'Web Speech API', latency: '~50ms' }
];

const translationOptions = [
    { id: 'openai', name: 'OpenAI GPT-4', latency: '~200ms' },
    { id: 'google', name: 'Google Translate', latency: '~150ms' },
    { id: 'microsoft', name: 'Microsoft Translator', latency: '~180ms' }
];

/**
 * Universal Translator Dialog component.
 */
export const UniversalTranslatorDialog = () => {
    const dispatch = useDispatch();
    const universalTranslator: IUniversalTranslatorState = useSelector(
        (state: IReduxState) => state['features/universal-translator']
    );

    const [ localApiKeys, setLocalApiKeys ] = useState(universalTranslator?.apiKeys || {});
    const [ saveIndicator, setSaveIndicator ] = useState<string | null>(null);

    useEffect(() => {
        if (universalTranslator?.apiKeys) {
            setLocalApiKeys(universalTranslator.apiKeys);
        }
    }, [ universalTranslator?.apiKeys ]);

    // Initialize the universal translator service when dialog opens
    useEffect(() => {
        if (!universalTranslator?.isInitialized) {
            console.log('Initializing Universal Translator service...');
            dispatch(initUniversalTranslator({
                sttProvider: universalTranslator?.sttProvider || 'deepgram',
                ttsProvider: universalTranslator?.ttsProvider || 'cartesia',
                translationProvider: universalTranslator?.translationProvider || 'openai',
                apiKeys: universalTranslator?.apiKeys || {}
            }));
        }
    }, [ dispatch, universalTranslator?.isInitialized ]);

    const handleClose = useCallback(() => {
        dispatch(hideDialog());
    }, [ dispatch ]);

    const handleSTTProviderChange = useCallback((provider: string) => {
        dispatch(setSTTProvider(provider));
    }, [ dispatch ]);

    const handleTTSProviderChange = useCallback((provider: string) => {
        dispatch(setTTSProvider(provider));
    }, [ dispatch ]);

    const handleTranslationProviderChange = useCallback((provider: string) => {
        dispatch(setTranslationProvider(provider));
    }, [ dispatch ]);

    const handleSourceLanguageChange = useCallback((language: string) => {
        dispatch(setSourceLanguage(language));
    }, [ dispatch ]);

    const handleTargetLanguageChange = useCallback((language: string) => {
        dispatch(setTargetLanguage(language));
    }, [ dispatch ]);

    const handleStartTranslation = useCallback(() => {
        // Validate API keys before starting
        const requiredKeys: Record<string, boolean> = {
            deepgram: universalTranslator?.sttProvider === 'deepgram',
            openai: universalTranslator?.translationProvider === 'openai',
            cartesia: universalTranslator?.ttsProvider === 'cartesia'
        };

        const missingKeys = Object.entries(requiredKeys)
            .filter(([ key, required ]) => required && !localApiKeys[key as keyof typeof localApiKeys])
            .map(([ key ]) => key);

        if (missingKeys.length > 0) {
            console.error('Missing API keys:', missingKeys);
            dispatch(setTranslationError(`Missing API keys: ${missingKeys.join(', ')}`));

            return;
        }

        console.log('Starting real-time translation with providers:', {
            stt: universalTranslator?.sttProvider,
            translation: universalTranslator?.translationProvider,
            tts: universalTranslator?.ttsProvider
        });

        dispatch(startTranslationRecording());
    }, [ dispatch, localApiKeys, universalTranslator ]);

    const handleStopTranslation = useCallback(() => {
        dispatch(stopTranslationRecording());
    }, [ dispatch ]);

    const handleApiKeyChange = useCallback((service: string, value: string) => {
        const newKeys = { ...localApiKeys, [service]: value };

        setLocalApiKeys(newKeys);
        dispatch(setApiKeys(newKeys));
        
        // Show save indicator
        if (value.trim()) {
            setSaveIndicator(service);
            setTimeout(() => setSaveIndicator(null), 2000);
        }
    }, [ localApiKeys, dispatch ]);

    const handleClearError = useCallback(() => {
        dispatch(clearTranslationError());
    }, [ dispatch ]);

    const handleEffectToggle = useCallback((enabled: boolean) => {
        if (enabled) {
            dispatch(enableUniversalTranslatorEffect());
        } else {
            dispatch(disableUniversalTranslatorEffect());
        }
    }, [ dispatch ]);

    const formatLatency = (latency: number) => {
        return latency ? `${Math.round(latency)}ms` : '-';
    };

    const getTotalLatency = () => {
        const { stt, translation, tts } = universalTranslator?.latencyMetrics || { stt: {}, translation: {}, tts: {} };

        return (stt.lastLatency || 0) + (translation.lastLatency || 0) + (tts.lastLatency || 0);
    };

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            onCancel = { handleClose }
            size = 'large'
            titleKey = 'universalTranslator.title'>
            <div className = 'universal-translator-dialog'>
                {/* Language Selection */}
                <div className = 'language-selection'>
                    <h3>Language Settings</h3>
                    <div className = 'language-selectors'>
                        <div className = 'language-selector'>
                            <label>From:</label>
                            <select
                                onChange = { e => handleSourceLanguageChange(e.target.value) }
                                value = { universalTranslator?.sourceLanguage || 'en' }>
                                {languages.map(lang => (
                                    <option
                                        key = { lang.code }
                                        value = { lang.code }>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className = 'language-selector'>
                            <label>To:</label>
                            <select
                                onChange = { e => handleTargetLanguageChange(e.target.value) }
                                value = { universalTranslator?.targetLanguage || 'es' }>
                                {languages.map(lang => (
                                    <option
                                        key = { lang.code }
                                        value = { lang.code }>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Service Selection */}
                <div className = 'service-selection'>
                    <h3>Service Providers</h3>

                    <div className = 'service-group'>
                        <label>Speech-to-Text:</label>
                        <select
                            onChange = { e => handleSTTProviderChange(e.target.value) }
                            value = { universalTranslator?.sttProvider || 'whisper' }>
                            {sttOptions.map(option => (
                                <option
                                    key = { option.id }
                                    value = { option.id }>
                                    {option.name} ({option.latency})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className = 'service-group'>
                        <label>Translation:</label>
                        <select
                            onChange = { e => handleTranslationProviderChange(e.target.value) }
                            value = { universalTranslator?.translationProvider || 'openai' }>
                            {translationOptions.map(option => (
                                <option
                                    key = { option.id }
                                    value = { option.id }>
                                    {option.name} ({option.latency})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className = 'service-group'>
                        <label>Text-to-Speech:</label>
                        <select
                            onChange = { e => handleTTSProviderChange(e.target.value) }
                            value = { universalTranslator?.ttsProvider || 'cartesia' }>
                            {ttsOptions.map(option => (
                                <option
                                    key = { option.id }
                                    value = { option.id }>
                                    {option.name} ({option.latency})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className = 'service-group'>
                        <label>
                            <input
                                checked = { universalTranslator?.effectEnabled || false }
                                onChange = { e => handleEffectToggle(e.target.checked) }
                                type = 'checkbox' />
                            Route translated audio to conference (replaces your microphone)
                        </label>
                    </div>
                </div>

                {/* API Keys */}
                <div className = 'api-keys-section'>
                    <h3>API Keys</h3>
                    <p className = 'persistence-note'>
                        API keys and preferences are automatically saved locally and will be remembered across sessions.
                    </p>
                    <div className = 'api-keys-grid'>
                        {Object.entries(localApiKeys).map(([ service, key ]) => (
                            <div
                                className = 'api-key-input'
                                key = { service }>
                                <label>{service.charAt(0).toUpperCase() + service.slice(1)}:</label>
                                <input
                                    onChange = { e => handleApiKeyChange(service, e.target.value) }
                                    placeholder = { `Enter ${service} API key` }
                                    type = 'password'
                                    value = { key } />
                                {saveIndicator === service && (
                                    <span className = 'save-indicator'>✓ Saved</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Translation Status */}
                <div className = 'translation-status'>
                    <h3>Translation Status</h3>
                    <div className = 'status-info'>
                        <div className = 'status-indicator'>
                            <span className = { `status-dot ${universalTranslator?.status || 'idle'}` } />
                            <span className = 'status-text'>
                                {universalTranslator?.isRecording ? 'Translating in real-time...'
                                    : universalTranslator?.status === 'processing' ? 'Processing...'
                                        : universalTranslator?.status === 'completed' ? 'Translation Complete'
                                            : universalTranslator?.status === 'error' ? 'Error' : 'Ready'}
                            </span>
                        </div>
                        {getTotalLatency() > 0 && (
                            <div className = 'latency-info'>
                                Total Latency: {formatLatency(getTotalLatency())}
                            </div>
                        )}
                    </div>

                    {universalTranslator?.error && (
                        <div className = 'error-message'>
                            <span>{universalTranslator?.error}</span>
                            <button onClick = { handleClearError }>Clear</button>
                        </div>
                    )}

                    {universalTranslator?.transcriptionResult && (
                        <div className = 'transcription-result'>
                            <h4>Transcription:</h4>
                            <p>{universalTranslator?.transcriptionResult?.text}</p>
                        </div>
                    )}

                    {universalTranslator?.translationResult && (
                        <div className = 'translation-result'>
                            <h4>Translation:</h4>
                            <p>{universalTranslator?.translationResult?.translatedText}</p>
                        </div>
                    )}
                </div>

                {/* Performance Metrics */}
                {universalTranslator?.status === 'completed' && (
                    <div className = 'performance-metrics'>
                        <h3>Performance Metrics</h3>
                        <div className = 'metrics-grid'>
                            <div className = 'metric'>
                                <label>STT Latency:</label>
                                <span>{formatLatency(universalTranslator?.latencyMetrics?.stt?.lastLatency)}</span>
                            </div>
                            <div className = 'metric'>
                                <label>Translation Latency:</label>
                                <span>{formatLatency(universalTranslator?.latencyMetrics?.translation?.lastLatency)}</span>
                            </div>
                            <div className = 'metric'>
                                <label>TTS Latency:</label>
                                <span>{formatLatency(universalTranslator?.latencyMetrics?.tts?.lastLatency)}</span>
                            </div>
                            <div className = 'metric'>
                                <label>Total Requests:</label>
                                <span>{universalTranslator?.latencyMetrics?.stt?.requestCount || 0}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Control Buttons */}
                <div className = 'control-buttons'>
                    {!universalTranslator?.isRecording ? (
                        <button
                            className = 'record-button'
                            disabled = { universalTranslator?.status === 'processing' }
                            onClick = { handleStartTranslation }>
                            🗣️ Start Real-time Translation
                        </button>
                    ) : (
                        <button
                            className = 'stop-button'
                            onClick = { handleStopTranslation }>
                            ⏹️ Stop Translation
                        </button>
                    )}
                </div>
            </div>
        </Dialog>
    );
};
