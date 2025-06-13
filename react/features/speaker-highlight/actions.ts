import { SET_SPEAKER_HIGHLIGHT_ENABLED, TOGGLE_SPEAKER_HIGHLIGHT } from './actionTypes';

/**
 * Toggles speaker highlighting.
 *
 * @returns {{
 *     type: TOGGLE_SPEAKER_HIGHLIGHT
 * }}
 */
export function toggleSpeakerHighlight() {
    return {
        type: TOGGLE_SPEAKER_HIGHLIGHT
    };
}

/**
 * Sets speaker highlighting enabled state.
 *
 * @param {boolean} enabled - Whether speaker highlighting should be enabled.
 * @returns {{
 *     type: SET_SPEAKER_HIGHLIGHT_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setSpeakerHighlightEnabled(enabled: boolean) {
    return {
        type: SET_SPEAKER_HIGHLIGHT_ENABLED,
        enabled
    };
} 