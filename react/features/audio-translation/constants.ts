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
 * Volume (0..1) a speaker's original audio is ducked to while its translation plays.
 */
export const DUCKED_ORIGINAL_VOLUME = 0.15;
