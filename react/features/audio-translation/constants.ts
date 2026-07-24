/**
 * Supported AI audio-translation target languages: ISO code + picker label.
 */
export const SUPPORTED_TRANSLATION_LANGUAGES: Array<{ code: string; label: string; }> = [
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

/**
 * The per-participant audio-translation status the thumbnail indicator renders, combining whether translation
 * is enabled for the local user and whether translated audio is actually being received.
 */
export enum TranslationTreatment {

    /**
     * Translation is enabled for the local user AND translated audio is being received.
     */
    BOTH = 'both',

    /**
     * Translation is enabled for the local user but no translated audio is being received yet.
     */
    ENABLED = 'enabled',

    /**
     * Neither enabled nor receiving — the indicator renders nothing.
     */
    NONE = 'none',

    /**
     * Translated audio is being received without translation having been explicitly enabled.
     */
    RECEIVING = 'receiving'
}
