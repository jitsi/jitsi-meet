/**
 * The value for the "var" attribute of feature tag in disco-info packets.
 */
export const DISCO_REMOTE_CONTROL_FEATURE
    = "http://jitsi.org/meet/remotecontrol";

/**
 * Types of remote-control-event events.
  * @readonly
  * @enum {string}
 */
export const EVENT_TYPES = {
    mousemove: "mousemove",
    mousedown: "mousedown",
    mouseup: "mouseup",
    mousedblclick: "mousedblclick",
    mousescroll: "mousescroll",
    keydown: "keydown",
    keyup: "keyup",
    permissions: "permissions",
    stop: "stop",
    supported: "supported"
};

/**
 * Actions for the remote control permission events.
 * @readonly
 * @enum {string}
 */
export const PERMISSIONS_ACTIONS = {
    request: "request",
    grant: "grant",
    deny: "deny",
    error: "error"
};

/**
 * The type of remote control events sent trough the API module.
 */
export const REMOTE_CONTROL_EVENT_NAME = "remote-control-event";

/**
 * The remote control event.
 * @typedef {object} RemoteControlEvent
 * @property {EVENT_TYPES} type - the type of the event
 * @property {int} x - avaibale for type === mousemove only. The new x
 * coordinate of the mouse
 * @property {int} y - For mousemove type - the new y
 * coordinate of the mouse and for mousescroll - represents the vertical
 * scrolling diff value
 * @property {int} button - 1(left), 2(middle) or 3 (right). Supported by
 * mousedown, mouseup and mousedblclick types.
 * @property {KEYS} key - Represents the key related to the event. Supported by
 * keydown and keyup types.
 * @property {KEYS[]} modifiers - Represents the modifier related to the event.
 * Supported by keydown and keyup types.
 * @property {PERMISSIONS_ACTIONS} action - Supported by type === permissions.
 * Represents the action related to the permissions event.
 *
 * Optional properties. Supported for permissions event for action === request:
 * @property {string} userId - The user id of the participant that has sent the
 * request.
 * @property {string} userJID - The full JID in the MUC of the user that has
 * sent the request.
 * @property {string} displayName - the displayName of the participant that has
 * sent the request.
 * @property {boolean} screenSharing - true if the SS is started for the local
 * participant and false if not.
 */
