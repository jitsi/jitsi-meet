/**
 * Default AI audio-translation target languages offered when config.audioTranslation.translationLanguages is unset: the
 * set every speech-to-speech provider supports, as code + native-script picker label. A deployment whose
 * provider accepts more can replace the offered set in config (see orderAudioTranslationLanguages).
 */
export const DEFAULT_TRANSLATION_LANGUAGES: Array<{ code: string; label: string; }> = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'ru', label: 'Русский' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'vi', label: 'Tiếng Việt' }
];

/**
 * Full volume (0..1) a speaker's original audio is restored to once it is no longer ducked.
 */
export const DEFAULT_ORIGINAL_VOLUME = 1;

/**
 * Volume (0..1) a speaker's original audio is ducked to while its translation plays.
 */
export const DUCKED_ORIGINAL_VOLUME = 0.15;
