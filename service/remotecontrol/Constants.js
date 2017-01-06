/**
 * The value for the "var" attribute of feature tag in disco-info packets.
 */
export const DISCO_REMOTE_CONTROL_FEATURE
    = "http://jitsi.org/meet/remotecontrol";

/**
 * Types of remote-control-event events.
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
export const REMOTE_CONTROL_EVENT_TYPE = "remote-control-event";
