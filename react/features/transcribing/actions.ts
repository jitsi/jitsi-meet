import {
    TRANSCRIBER_JOINED,
    TRANSCRIBER_LEFT
} from './actionTypes';

/**
 * Notify that the transcriber, with a unique ID, has joined.
 *
 * @param {string} participantId - The participant id of the transcriber.
 * @returns {{
 *     type: TRANSCRIBER_JOINED,
 *     participantId: string
 * }}
 */
export function transcriberJoined(participantId: string) {
    return {
        type: TRANSCRIBER_JOINED,
        transcriberJID: participantId
    };
}

/**
 * Notify that the transcriber, with a unique ID, has left.
 *
 * @param {string} participantId - The participant id of the transcriber.
 * @param {boolean} abruptly - The transcriber did not exit the conference gracefully with switching off first.
 * It maybe there was some backend problem, like network.
 * @returns {{
 *     type: TRANSCRIBER_LEFT,
 *     participantId: string,
 *     abruptly: boolean
 * }}
 */
export function transcriberLeft(participantId: string, abruptly: boolean) {
    return {
        type: TRANSCRIBER_LEFT,
        transcriberJID: participantId,
        abruptly
    };
}
