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
    keyup: "keyup"
};

/**
 * The type of remote control events sent trough the API module.
 */
export const API_EVENT_TYPE = "remote-control-event";
