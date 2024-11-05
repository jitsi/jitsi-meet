/* eslint-disable max-params, max-len */

import { MIN_SUBTITLES_FONT_SIZE } from './constants';

/**
 * Logs when about the received transcription chunk.
 *
 * @param {string} transcriptMessageID - Transcription message id.
 * @param {string} language - The language of the transcribed message.
 * @param {Object} participant - The participant who send the message.
 * @param {any} text - The message text.
 * @param {any} _store - The store.
 * @returns {Event}
 */
export const notifyTranscriptionChunkReceived = (transcriptMessageID: string, language: string, participant: Object, text: any, _store?: any) =>
    APP.API.notifyTranscriptionChunkReceived({
        messageID: transcriptMessageID,
        language,
        participant,
        ...text
    });

/**
 * Calculates the font size for the subtitles.
 *
 * @param {number} clientHeight - The height of the visible area of the window.
 * @returns {number}
 */
export function calculateSubtitlesFontSize(clientHeight?: number) {
    if (typeof clientHeight === 'undefined') {
        return MIN_SUBTITLES_FONT_SIZE;
    }

    return Math.max(Math.floor(clientHeight * 0.04), MIN_SUBTITLES_FONT_SIZE);
}
