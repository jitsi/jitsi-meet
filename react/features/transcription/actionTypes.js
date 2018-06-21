/**
 * The type of (redux) action which indicates that a transcript with
 * a new message_id is received.
 *
 * {
 *      type: ADD_TRANSCRIPT_MESSAGE,
 *      transcriptMessageID: string,
 *      participantName: string
 * }
 */
export const ADD_TRANSCRIPT_MESSAGE = Symbol('ADD_TRANSCRIPT_MESSAGE');

/**
 * The type of (redux) action which indicates that an endpoint message
 * sent by another participant to the data channel is received.
 *
 * {
 *     type: ENDPOINT_MESSAGE_RECEIVED,
 *     participant: Object,
 *     json: Object
 * }
 */
export const ENDPOINT_MESSAGE_RECEIVED = Symbol('ENDPOINT_MESSAGE_RECEIVED');

/**
 * The type of (redux) action which indicates that an existing transcript
 * has to be removed from the state.
 *
 * {
 *      type: REMOVE_TRANSCRIPT_MESSAGE,
 *      transciptMessageID: string,
 * }
 */
export const REMOVE_TRANSCRIPT_MESSAGE = Symbol('REMOVE_TRANSCRIPT_MESSAGE');

/**
 * The type of (redux) action which indicates that a transcript with an
 * existing message_id to be updated is received.
 *
 * {
 *      type: UPDATE_TRANSCRIPT_MESSAGE,
 *      transcriptMessageID: string,
 *      newTranscriptMessage: Object
 * }
 */
export const UPDATE_TRANSCRIPT_MESSAGE = Symbol('UPDATE_TRANSCRIPT_MESSAGE');
