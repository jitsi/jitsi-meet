/**
 * Action type to set Picture-in-Picture active state.
 */
export const SET_PIP_ACTIVE = 'SET_PIP_ACTIVE';

/**
 * Action type to store the Document PiP window reference.
 */
export const SET_PIP_WINDOW = 'SET_PIP_WINDOW';

/**
 * Action type to set whether the user dismissed PiP for the rest of the conference.
 */
export const SET_PIP_DISMISSED = 'SET_PIP_DISMISSED';

/**
 * Action type recording that the embedding Electron app cannot create the
 * custom PiP window (the popup was denied), so the video-element PiP is used
 * for the rest of the session.
 */
export const SET_PIP_WINDOW_MODE_UNSUPPORTED = 'SET_PIP_WINDOW_MODE_UNSUPPORTED';

/**
 * Internal action signalling that the host confirmed a Document PiP window has opened.
 */
export const HOST_DOCUMENT_PIP_OPENED = 'HOST_DOCUMENT_PIP_OPENED';

/**
 * Internal action signalling that the host confirmed a Document PiP window has closed
 * or that opening it failed.
 */
export const HOST_DOCUMENT_PIP_CLOSED = 'HOST_DOCUMENT_PIP_CLOSED';

/**
 * Internal action carrying an ordered WebRTC signal from the embedding page.
 */
export const HOST_DOCUMENT_PIP_SIGNAL_RECEIVED = 'HOST_DOCUMENT_PIP_SIGNAL_RECEIVED';
