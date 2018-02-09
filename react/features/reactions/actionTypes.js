/**
 * The type of (redux) action which signals that a specific reaction has been
 * received by the local participant from a specific remote participant.
 *
 * {
 *     type: ADD_RECEIVED_REACTION,
 *     participant: Object,
 *     reaction: string
 * }
 */
export const ADD_RECEIVED_REACTION = Symbol('ADD_RECEIVED_REACTION');
