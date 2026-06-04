/**
 * The target languages supported for AI audio translation. These are the output
 * languages supported by the bridge's translation model (gpt-realtime-translate);
 * the source language of each speaker is auto-detected.
 *
 * Each entry is the 2-letter ISO code sent to the bridge and a human-readable
 * label for the language picker.
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
 * The volume (0..1) the original audio of a speaker is ducked to while its
 * translation is being played, so the translated speech is intelligible over it.
 */
export const DUCKED_ORIGINAL_VOLUME = 0.15;
