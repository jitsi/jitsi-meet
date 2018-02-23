/**
 * The type of redux action to set the PiP related event listeners.
 *
 * {
 *     type: _SET_PIP_MODE_LISTENER,
 *     listeners: Array|undefined
 * }
 *
 * @protected
 */
export const _SET_PIP_LISTENERS = Symbol('_SET_PIP_LISTENERS');

/**
 * The type of redux action which signals that the PiP mode is requested.
 *
 * {
 *      type: REQUEST_PIP_MODE
 * }
 *
 * @public
 */
export const REQUEST_PIP_MODE = Symbol('REQUEST_PIP_MODE');
