/* eslint-disable max-params, max-len */

import { IStore } from '../app/types';


/**
 * Logs when about the received transcription chunk.
 *
 * @param {string} transcriptMessageID - Transcription message id.
 * @param {string} language - The language of the transcribed message.
 * @param {Object} participant - The participant who send the message.
 * @param {any} text - The message text.
 * @param {IStore} _store - The store.
 * @returns {Event}
 */
export const notifyTranscriptionChunkReceived = (transcriptMessageID: string, language: string, participant: Object, text: any, _store?: IStore) =>
    APP.API.notifyTranscriptionChunkReceived({
        messageID: transcriptMessageID,
        language,
        participant,
        text
    });
