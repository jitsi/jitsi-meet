import { DEFAULT_LANGUAGE } from '../base/i18n/i18next';

import {
    REMOVE_CACHED_TRANSCRIPT_MESSAGE,
    REMOVE_TRANSCRIPT_MESSAGE,
    SET_REQUESTING_SUBTITLES,
    SET_SUBTITLES_ERROR,
    STORE_SUBTITLE,
    TOGGLE_REQUESTING_SUBTITLES,
    UPDATE_TRANSCRIPT_MESSAGE
} from './actionTypes';
import { ISubtitle } from './types';

/**
 * Signals that a transcript has to be removed from the state.
 *
 * @param {string} transcriptMessageID - The message_id to be removed.
 * @returns {{
 *      type: REMOVE_TRANSCRIPT_MESSAGE,
 *      transcriptMessageID: string,
 * }}
 */
export function removeTranscriptMessage(transcriptMessageID: string) {
    return {
        type: REMOVE_TRANSCRIPT_MESSAGE,
        transcriptMessageID
    };
}

/**
 * Signals that a cached transcript has to be removed from the state.
 *
 * @param {string} transcriptMessageID - The message_id to be removed.
 * @returns {{
*      type: REMOVE_CACHED_TRANSCRIPT_MESSAGE,
*      transcriptMessageID: string,
* }}
*/
export function removeCachedTranscriptMessage(transcriptMessageID: string) {
    return {
        type: REMOVE_CACHED_TRANSCRIPT_MESSAGE,
        transcriptMessageID
    };
}

/**
 * Signals that a transcript with the given message_id to be added or updated
 * is received.
 *
 * @param {string} transcriptMessageID -The transcript message_id to be updated.
 * @param {Object} newTranscriptMessage - The updated transcript message.
 * @returns {{
 *      type: UPDATE_TRANSCRIPT_MESSAGE,
 *      transcriptMessageID: string,
 *      newTranscriptMessage: Object
 * }}
 */
export function updateTranscriptMessage(transcriptMessageID: string,
        newTranscriptMessage: Object) {
    return {
        type: UPDATE_TRANSCRIPT_MESSAGE,
        transcriptMessageID,
        newTranscriptMessage
    };
}

/**
 * Signals that the local user has toggled the ClosedCaption button.
 *
 * @returns {{
 *      type: TOGGLE_REQUESTING_SUBTITLES
 * }}
 */
export function toggleRequestingSubtitles() {
    return {
        type: TOGGLE_REQUESTING_SUBTITLES
    };
}

/**
 * Signals that the local user has enabled or disabled the subtitles.
 *
 * @param {boolean} enabled - The new state of the subtitles.
 * @param {boolean} displaySubtitles - Whether to display subtitles or not.
 * @param {string} language - The language of the subtitles.
 * @param {boolean} backendRecordingOn - Whether backend recording is on.
 * @returns {{
 *    type: SET_REQUESTING_SUBTITLES,
 *    backendRecordingOn: boolean,
 *    enabled: boolean,
 *    displaySubtitles: boolean,
 *    language: string
 * }}
 */
export function setRequestingSubtitles(
        enabled: boolean,
        displaySubtitles = true,
        language: string | null = `translation-languages:${DEFAULT_LANGUAGE}`,
        backendRecordingOn = false) {
    return {
        type: SET_REQUESTING_SUBTITLES,
        backendRecordingOn,
        displaySubtitles,
        enabled,
        language
    };
}

/**
 * Stores a received subtitle in the history.
 *
 * @param {ISubtitle} subtitle - The subtitle to store.
 * @returns {{
 *     type: STORE_SUBTITLE,
 *     subtitle: ISubtitle
 * }}
 */
export function storeSubtitle(subtitle: ISubtitle) {
    return {
        type: STORE_SUBTITLE,
        subtitle
    };
}

/**
 * Signals that an error occurred while starting subtitles.
 *
 * @param {boolean} hasError - Whether an error occurred or not.
 * @returns {{
 *    type: SET_SUBTITLES_ERROR,
 *    hasError: boolean
 * }}
 */
export function setSubtitlesError(hasError: boolean) {
    return {
        type: SET_SUBTITLES_ERROR,
        hasError
    };
}
