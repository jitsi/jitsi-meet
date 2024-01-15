import {
    _POTENTIAL_TRANSCRIBER_JOINED,
    _TRANSCRIBER_JOINED,
    _TRANSCRIBER_LEFT
} from './actionTypes';

/**
 * Notify that the transcriber, with a unique ID, has joined.
 *
 * @param {string} participantId - The participant id of the transcriber.
 * @returns {{
 *     type: _TRANSCRIBER_JOINED,
 *     participantId: string
 * }}
 */
export function transcriberJoined(participantId: string) {
    return {
        type: _TRANSCRIBER_JOINED,
        transcriberJID: participantId
    };
}

/**
 * Notify that the transcriber, with a unique ID, has left.
 *
 * @param {string} participantId - The participant id of the transcriber.
 * @returns {{
 *     type: _TRANSCRIBER_LEFT,
 *     participantId: string
 * }}
 */
export function transcriberLeft(participantId: string) {
    return {
        type: _TRANSCRIBER_LEFT,
        transcriberJID: participantId
    };
}

/**
 * Notify that a potential transcriber, with a unique ID, has joined.
 *
 * @param {string} participantId - The participant id of the transcriber.
 * @returns {{
 *     type: _POTENTIAL_TRANSCRIBER_JOINED,
 *     participantId: string
 * }}
 */
export function potentialTranscriberJoined(participantId: string) {
    return {
        type: _POTENTIAL_TRANSCRIBER_JOINED,
        transcriberJID: participantId
    };
}
