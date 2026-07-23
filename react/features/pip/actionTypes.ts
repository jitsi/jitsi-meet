/**
 * Action type to set Picture-in-Picture active state.
 */
export const SET_PIP_ACTIVE = 'SET_PIP_ACTIVE';

/**
 * Action type to set whether the embedding page supports Document PiP.
 */
export const SET_EMBEDDED_DOCUMENT_PIP_CAPABILITY = 'SET_EMBEDDED_DOCUMENT_PIP_CAPABILITY';

/**
 * Action type to set the embedded Document PiP lifecycle.
 */
export const SET_EMBEDDED_DOCUMENT_PIP_LIFECYCLE = 'SET_EMBEDDED_DOCUMENT_PIP_LIFECYCLE';

/**
 * Action type to set whether the embedded renderer completed its handshake.
 */
export const SET_EMBEDDED_DOCUMENT_PIP_RENDERER_READY = 'SET_EMBEDDED_DOCUMENT_PIP_RENDERER_READY';

/**
 * Internal action carrying a WebRTC answer from the embedded renderer.
 */
export const EMBEDDED_DOCUMENT_PIP_ANSWER_RECEIVED = 'EMBEDDED_DOCUMENT_PIP_ANSWER_RECEIVED';

/**
 * Internal action carrying connection state from the embedded renderer.
 */
export const EMBEDDED_DOCUMENT_PIP_CONNECTION_STATE_CHANGED
    = 'EMBEDDED_DOCUMENT_PIP_CONNECTION_STATE_CHANGED';

/**
 * Internal action carrying an ICE candidate from the embedded renderer.
 */
export const EMBEDDED_DOCUMENT_PIP_ICE_RECEIVED = 'EMBEDDED_DOCUMENT_PIP_ICE_RECEIVED';

/**
 * Internal action requesting recreation of the embedded WebRTC bridge.
 */
export const EMBEDDED_DOCUMENT_PIP_RECONNECT_REQUESTED = 'EMBEDDED_DOCUMENT_PIP_RECONNECT_REQUESTED';
