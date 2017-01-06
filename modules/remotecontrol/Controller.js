/* global $, JitsiMeetJS, APP */
import * as KeyCodes from "../keycode/keycode";
import {EVENT_TYPES, REMOTE_CONTROL_EVENT_TYPE, PERMISSIONS_ACTIONS}
    from "../../service/remotecontrol/Constants";
import RemoteControlParticipant from "./RemoteControlParticipant";

const ConferenceEvents = JitsiMeetJS.events.conference;

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
export default class Controller extends RemoteControlParticipant {
    /**
     * Creates new instance.
     */
    constructor() {
        super();
        this.controlledParticipant = null;
        this.requestedParticipant = null;
        this._stopListener = this._handleRemoteControlStoppedEvent.bind(this);
        this._userLeftListener = this._onUserLeft.bind(this);
    }

    /**
     * Requests permissions from the remote control receiver side.
     * @param {string} userId the user id of the participant that will be
     * requested.
     * @returns {Promise<boolean>} - resolve values:
     * true - accept
     * false - deny
     * null - the participant has left.
     */
    requestPermissions(userId) {
        if(!this.enabled) {
            return Promise.reject(new Error("Remote control is disabled!"));
        }
        return new Promise((resolve, reject) => {
            const clearRequest = () => {
                this.requestedParticipant = null;
                APP.conference.removeConferenceListener(
                    ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                    permissionsReplyListener);
                APP.conference.removeConferenceListener(
                    ConferenceEvents.USER_LEFT,
                    onUserLeft);
            };
            const permissionsReplyListener = (participant, event) => {
                let result = null;
                try {
                    result = this._handleReply(participant, event);
                } catch (e) {
                    reject(e);
                }
                if(result !== null) {
                    clearRequest();
                    resolve(result);
                }
            };
            const onUserLeft = (id) => {
                if(id === this.requestedParticipant) {
                    clearRequest();
                    resolve(null);
                }
            };
            APP.conference.addConferenceListener(
                ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                permissionsReplyListener);
            APP.conference.addConferenceListener(ConferenceEvents.USER_LEFT,
                onUserLeft);
            this.requestedParticipant = userId;
            this._sendRemoteControlEvent(userId, {
                type: EVENT_TYPES.permissions,
                action: PERMISSIONS_ACTIONS.request
            }, e => {
                clearRequest();
                reject(e);
            });
        });
    }

    /**
     * Handles the reply of the permissions request.
     * @param {JitsiParticipant} participant the participant that has sent the
     * reply
     * @param {object} event the remote control event.
     */
    _handleReply(participant, event) {
        const remoteControlEvent = event.event;
        const userId = participant.getId();
        if(this.enabled && event.type === REMOTE_CONTROL_EVENT_TYPE
            && remoteControlEvent.type === EVENT_TYPES.permissions
            && userId === this.requestedParticipant) {
            switch(remoteControlEvent.action) {
                case PERMISSIONS_ACTIONS.grant: {
                    this.controlledParticipant = userId;
                    this._start();
                    return true;
                }
                case PERMISSIONS_ACTIONS.deny:
                    return false;
                case PERMISSIONS_ACTIONS.error:
                    throw new Error("Error occurred on receiver side");
                default:
                    throw new Error("Unknown reply received!");
            }
        } else {
            //different message type or another user -> ignoring the message
            return null;
        }
    }

    /**
     * Handles remote control stopped.
     * @param {JitsiParticipant} participant the participant that has sent the
     * event
     * @param {object} event the the remote control event.
     */
    _handleRemoteControlStoppedEvent(participant, event) {
        if(this.enabled && event.type === REMOTE_CONTROL_EVENT_TYPE
            && event.event.type === EVENT_TYPES.stop
            && participant.getId() === this.controlledParticipant) {
            this._stop();
        }
    }

    /**
     * Starts processing the mouse and keyboard events.
     */
    _start() {
        if(!this.enabled)
            return;
        APP.keyboardshortcut.enable(false);
        APP.conference.addConferenceListener(
            ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            this._stopListener);
        APP.conference.addConferenceListener(ConferenceEvents.USER_LEFT,
            this._userLeftListener);
        this.area = $("#largeVideoWrapper");
        this.area.mousemove(event => {
            const position = this.area.position();
            this._sendRemoteControlEvent(this.controlledParticipant, {
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
            this._sendRemoteControlEvent(this.controlledParticipant, {
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
     * Stops processing the mouse and keyboard events. Removes added listeners.
     */
    _stop() {
        if(!this.controlledParticipant) {
            return;
        }
        APP.keyboardshortcut.enable(true);
        APP.conference.removeConferenceListener(
            ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            this._stopListener);
        APP.conference.removeConferenceListener(ConferenceEvents.USER_LEFT,
            this._userLeftListener);
        this.controlledParticipant = null;
        this.area.off( "mousemove" );
        this.area.off( "mousedown" );
        this.area.off( "mouseup" );
        this.area.off( "contextmenu" );
        this.area.off( "dblclick" );
        $(window).off( "keydown");
        $(window).off( "keyup");
        this.area[0].onmousewheel = undefined;
        APP.UI.messageHandler.openMessageDialog(
            "dialog.remoteControlTitle",
            "dialog.remoteControlStopMessage"
        );
    }

    /**
     * Calls this._stop() and sends stop message to the controlled participant.
     */
    stop() {
        if(!this.controlledParticipant) {
            return;
        }
        this._sendRemoteControlEvent(this.controlledParticipant, {
            type: EVENT_TYPES.stop
        });
        this._stop();
    }

    /**
     * Handler for mouse click events.
     * @param {String} type the type of event ("mousedown"/"mouseup")
     * @param {Event} event the mouse event.
     */
    _onMouseClickHandler(type, event) {
        this._sendRemoteControlEvent(this.controlledParticipant, {
            type: type,
            button: event.which
        });
    }

    /**
     * Returns true if the remote control session is started.
     * @returns {boolean}
     */
    isStarted() {
        return this.controlledParticipant !== null;
    }

    /**
     * Returns the id of the requested participant
     * @returns {string} this.requestedParticipant
     */
    getRequestedParticipant() {
        return this.requestedParticipant;
    }

    /**
     * Handler for key press events.
     * @param {String} type the type of event ("keydown"/"keyup")
     * @param {Event} event the key event.
     */
    _onKeyPessHandler(type, event) {
        this._sendRemoteControlEvent(this.controlledParticipant, {
            type: type,
            key: getKey(event),
            modifiers: getModifiers(event),
        });
    }

    /**
     * Calls the stop method if the other side have left.
     * @param {string} id - the user id for the participant that have left
     */
    _onUserLeft(id) {
        if(this.controlledParticipant === id) {
            this._stop();
        }
    }
}
