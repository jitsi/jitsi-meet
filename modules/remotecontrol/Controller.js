/* global $, APP */
import * as KeyCodes from "../keycode/keycode";
import {EVENT_TYPES, API_EVENT_TYPE}
    from "../../service/remotecontrol/Constants";

/**
 * Extract the keyboard key from the keyboard event.
 * @param event {KeyboardEvent} the event.
 * @returns {KEYS} the key that is pressed or undefined.
 */
function getKey(event) {
    return KeyCodes.keyboardEventToKey(event);
}

/**
 * Extract the modifiers from the keyboard event.
 * @param event {KeyboardEvent} the event.
 * @returns {Array} with possible values: "shift", "control", "alt", "command".
 */
function getModifiers(event) {
    let modifiers = [];
    if(event.shiftKey) {
        modifiers.push("shift");
    }

    if(event.ctrlKey) {
        modifiers.push("control");
    }


    if(event.altKey) {
        modifiers.push("alt");
    }

    if(event.metaKey) {
        modifiers.push("command");
    }

    return modifiers;
}

/**
 * This class represents the controller party for a remote controller session.
 * It listens for mouse and keyboard events and sends them to the receiver
 * party of the remote control session.
 */
export default class Controller {
    /**
     * Creates new instance.
     */
    constructor() {
        this.enabled = false;
    }

    /**
     * Enables / Disables the remote control
     * @param {boolean} enabled the new state.
     */
    enable(enabled) {
        this.enabled = enabled;
    }

    /**
     * Starts processing the mouse and keyboard events.
     * @param {JQuery.selector} area the selector which will be used for
     * attaching the listeners on.
     */
    start(area) {
        if(!this.enabled)
            return;
        this.area = area;
        this.area.mousemove(event => {
            const position = this.area.position();
            this._sendRemoteControlEvent({
                type: EVENT_TYPES.mousemove,
                x: (event.pageX - position.left)/this.area.width(),
                y: (event.pageY - position.top)/this.area.height()
            });
        });
        this.area.mousedown(this._onMouseClickHandler.bind(this,
            EVENT_TYPES.mousedown));
        this.area.mouseup(this._onMouseClickHandler.bind(this,
            EVENT_TYPES.mouseup));
        this.area.dblclick(
            this._onMouseClickHandler.bind(this, EVENT_TYPES.mousedblclick));
        this.area.contextmenu(() => false);
        this.area[0].onmousewheel = event => {
            this._sendRemoteControlEvent({
                type: EVENT_TYPES.mousescroll,
                x: event.deltaX,
                y: event.deltaY
            });
        };
        $(window).keydown(this._onKeyPessHandler.bind(this,
            EVENT_TYPES.keydown));
        $(window).keyup(this._onKeyPessHandler.bind(this, EVENT_TYPES.keyup));
    }

    /**
     * Stops processing the mouse and keyboard events.
     */
    stop() {
        this.area.off( "mousemove" );
        this.area.off( "mousedown" );
        this.area.off( "mouseup" );
        this.area.off( "contextmenu" );
        this.area.off( "dblclick" );
        $(window).off( "keydown");
        $(window).off( "keyup");
        this.area[0].onmousewheel = undefined;
    }

    /**
     * Handler for mouse click events.
     * @param {String} type the type of event ("mousedown"/"mouseup")
     * @param {Event} event the mouse event.
     */
    _onMouseClickHandler(type, event) {
        this._sendRemoteControlEvent({
            type: type,
            button: event.which
        });
    }

    /**
     * Handler for key press events.
     * @param {String} type the type of event ("keydown"/"keyup")
     * @param {Event} event the key event.
     */
    _onKeyPessHandler(type, event) {
        this._sendRemoteControlEvent({
            type: type,
            key: getKey(event),
            modifiers: getModifiers(event),
        });
    }

    /**
     * Sends remote control event to the controlled participant.
     * @param {Object} event the remote control event.
     */
    _sendRemoteControlEvent(event) {
        if(!this.enabled)
            return;
        try{
            APP.conference.sendEndpointMessage("",
                {type: API_EVENT_TYPE, event});
        } catch (e) {
            // failed to send the event.
        }
    }
}
