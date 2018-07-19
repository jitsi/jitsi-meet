// @flow

import {
    ADD_TRANSCRIPT_MESSAGE,
    ENDPOINT_MESSAGE_RECEIVED,
    REMOVE_TRANSCRIPT_MESSAGE,
    UPDATE_TRANSCRIPT_MESSAGE
} from './actionTypes';

/**
 * Signals that a transcript with a new message_id is received.
 *
 * @param {string} transcriptMessageID - The new message_id.
 * @param {string} participantName - The participant name of the sender.
 * @returns {{
 *      type: ADD_TRANSCRIPT_MESSAGE,
 *      transcriptMessageID: string,
 *      participantName: string
 * }}
 */
export function addTranscriptMessage(transcriptMessageID: string,
        participantName: string) {
    return {
        type: ADD_TRANSCRIPT_MESSAGE,
        transcriptMessageID,
        participantName
    };
}

/**
 * Signals that a participant sent an endpoint message on the data channel.
 *
 * @param {Object} participant - The participant details sending the message.
 * @param {Object} json - The json carried by the endpoint message.
 * @returns {{
 *      type: ENDPOINT_MESSAGE_RECEIVED,
 *      participant: Object,
 *      json: Object
 * }}
 */
export function endpointMessageReceived(participant: Object, json: Object) {
    return {
        type: ENDPOINT_MESSAGE_RECEIVED,
        participant,
        json
    };
}

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
 * Signals that a transcript with an existing message_id to be updated
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
