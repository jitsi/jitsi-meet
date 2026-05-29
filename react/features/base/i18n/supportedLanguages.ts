import LANGUAGES_RESOURCES from '../../../../lang/languages.json';

/**
 * All available languages derived from the languages resource file.
 */
export const LANGUAGES: Array<string> = Object.keys(LANGUAGES_RESOURCES);

/**
 * The languages shown in the UI language selector and used for language detection.
 * If config.supportedLanguages is set, filters and reorders LANGUAGES accordingly.
 * Falls back to the full LANGUAGES list if not configured.
 */
export const SUPPORTED_LANGUAGES: Array<string> = (() => {
    const cfg = (globalThis as Record<string, any>).config as { supportedLanguages?: Array<string> } | undefined;
    const supported = cfg?.supportedLanguages;

    if (Array.isArray(supported) && supported.length > 0) {
        return supported.filter(lang => LANGUAGES.includes(lang));
    }

    return LANGUAGES;
})();
