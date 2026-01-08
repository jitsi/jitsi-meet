/* eslint-disable max-params, max-len */

import { sendEvent } from '../mobile/external-api/functions';


/**
 * Event which will be emitted on the native side to indicate that the transcription chunk was received.
 */
const TRANSCRIPTION_CHUNK_RECEIVED = 'TRANSCRIPTION_CHUNK_RECEIVED';

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
    sendEvent(
        _store,
        TRANSCRIPTION_CHUNK_RECEIVED,
        {
            messageID: transcriptMessageID,
            language,
            participant,
            text
        });
