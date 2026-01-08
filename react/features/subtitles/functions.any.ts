import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { TRANSLATION_LANGUAGES, TRANSLATION_LANGUAGES_HEAD } from '../base/i18n/i18next';
import { toState } from '../base/redux/functions';
import { canAddTranscriber, isTranscribing } from '../transcribing/functions';

/**
 * Checks whether the participant can start the subtitles.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if the participant can start the subtitles.
 */
export function canStartSubtitles(state: IReduxState) {
    return canAddTranscriber(state) || isTranscribing(state);
}

/**
 * Retrieves the list of available subtitles languages. The list consists of head languages (fixed items that stay on
 * top) followed by the rest of available translation languages.
 *
 * @param {IStateful} stateful - The stateful object containing the redux state.
 * @param {string} [selectedLanguage] - Optional language code of currently selected language. If provided and not in
 * regular translation languages, it will be added after head languages.
 * @returns {Array<string>} - Array of language codes. Includes both head languages and regular translation languages.
 */
export function getAvailableSubtitlesLanguages(stateful: IStateful, selectedLanguage?: string | null) {
    const state = toState(stateful);
    const { transcription } = state['features/base/config'];

    const translationLanguagesHead = transcription?.translationLanguagesHead ?? TRANSLATION_LANGUAGES_HEAD;
    const translationLanguages
        = (transcription?.translationLanguages ?? TRANSLATION_LANGUAGES)
            .filter((lang: string) => !translationLanguagesHead?.includes(lang) && lang !== selectedLanguage);
    const isSelectedLanguageNotIncluded = Boolean(
        selectedLanguage
        && !translationLanguages.includes(selectedLanguage)
        && !translationLanguagesHead.includes(selectedLanguage));

    return [
        ...translationLanguagesHead,

        // selectedLanguage is redundant but otherwise TS complains about null elements in the array.
        ...isSelectedLanguageNotIncluded && selectedLanguage ? [ selectedLanguage ] : [],
        ...translationLanguages
    ];
}


/**
 * Determines if closed captions are enabled.
 *
 * @param {IReduxState} state - The Redux state object.
 * @returns {boolean} A boolean indicating whether closed captions are enabled.
 */
export function areClosedCaptionsEnabled(state: IReduxState) {
    const { transcription } = state['features/base/config'];

    return !transcription?.disableClosedCaptions && Boolean(transcription?.enabled);
}

/**
 * Checks whether the subtitles tab should be enabled in the UI.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if the subtitles tab should be enabled.
 */
export function isCCTabEnabled(state: IReduxState) {
    const { showSubtitlesOnStage = false } = state['features/base/settings'];

    return areClosedCaptionsEnabled(state) && !showSubtitlesOnStage;
}
