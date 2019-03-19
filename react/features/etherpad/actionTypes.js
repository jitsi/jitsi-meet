/**
 * The type of the action which signals document editing has been enabled.
 *
 * {
 *     type: ETHERPAD_INITIALIZED
 * }
 */
export const ETHERPAD_INITIALIZED = 'ETHERPAD_INITIALIZED';


/**
 * The type of the action which signals document editing has stopped or started.
 *
 * {
 *     type: SET_DOCUMENT_EDITING_STATUS
 * }
 */
export const SET_DOCUMENT_EDITING_STATUS
    = 'SET_DOCUMENT_EDITING_STATUS';

/**
 * The type of the action which signals to start or stop editing a shared
 * document.
 *
 * {
 *     type: TOGGLE_DOCUMENT_EDITING
 * }
 */
export const TOGGLE_DOCUMENT_EDITING = 'TOGGLE_DOCUMENT_EDITING';
