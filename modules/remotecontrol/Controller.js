/* global $, JitsiMeetJS, APP */
const logger = require("jitsi-meet-logger").getLogger(__filename);
import * as KeyCodes from "../keycode/keycode";
import {EVENT_TYPES, REMOTE_CONTROL_EVENT_TYPE, PERMISSIONS_ACTIONS}
    from "../../service/remotecontrol/Constants";
import RemoteControlParticipant from "./RemoteControlParticipant";
import UIEvents from "../../service/UI/UIEvents";

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
        this.isCollectingEvents = false;
        this.controlledParticipant = null;
        this.requestedParticipant = null;
        this._stopListener = this._handleRemoteControlStoppedEvent.bind(this);
        this._userLeftListener = this._onUserLeft.bind(this);
        this._largeVideoChangedListener
            = this._onLargeVideoIdChanged.bind(this);
    }

    /**
     * Requests permissions from the remote control receiver side.
     * @param {string} userId the user id of the participant that will be
     * requested.
     * @param {JQuerySelector} eventCaptureArea the area that is going to be
     * used mouse and keyboard event capture.
     * @returns {Promise<boolean>} - resolve values:
     * true - accept
     * false - deny
     * null - the participant has left.
     */
    requestPermissions(userId, eventCaptureArea) {
        if(!this.enabled) {
            return Promise.reject(new Error("Remote control is disabled!"));
        }
        this.area = eventCaptureArea;// $("#largeVideoWrapper")
        logger.log("Requsting remote control permissions from: " + userId);
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
     * @param {RemoteControlEvent} event the remote control event.
     */
    _handleReply(participant, event) {
        const remoteControlEvent = event.event;
        const userId = participant.getId();
        if(this.enabled && event.type === REMOTE_CONTROL_EVENT_TYPE
            && remoteControlEvent.type === EVENT_TYPES.permissions
            && userId === this.requestedParticipant) {
            if(remoteControlEvent.action !== PERMISSIONS_ACTIONS.grant) {
                this.area = null;
            }
            switch(remoteControlEvent.action) {
                case PERMISSIONS_ACTIONS.grant: {
                    this.controlledParticipant = userId;
                    logger.log("Remote control permissions granted to: "
                        + userId);
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
     * @param {Object} event EndpointMessage event from the data channels.
     * @property {string} type property. The function process only events of
     * type REMOTE_CONTROL_EVENT_TYPE
     * @property {RemoteControlEvent} event - the remote control event.
     */
    _handleRemoteControlStoppedEvent(participant, event) {
        if(this.enabled && event.type === REMOTE_CONTROL_EVENT_TYPE
            && event.event.type === EVENT_TYPES.stop
            && participant.getId() === this.controlledParticipant) {
            this._stop();
        }
    }

    /**
     * Starts processing the mouse and keyboard events. Sets conference
     * listeners. Disables keyboard events.
     */
    _start() {
        logger.log("Starting remote control controller.");
        APP.UI.addListener(UIEvents.LARGE_VIDEO_ID_CHANGED,
            this._largeVideoChangedListener);
        APP.conference.addConferenceListener(
            ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            this._stopListener);
        APP.conference.addConferenceListener(ConferenceEvents.USER_LEFT,
            this._userLeftListener);
        this.resume();
    }

    /**
     * Disables the keyboatd shortcuts. Starts collecting remote control
     * events.
     *
     * It can be used to resume an active remote control session wchich was
     * paused with this.pause().
     */
    resume() {
        if(!this.enabled || this.isCollectingEvents) {
            return;
        }
        logger.log("Resuming remote control controller.");
        this.isCollectingEvents = true;
        APP.keyboardshortcut.enable(false);
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
     * Enables the keyboard shortcuts. Displays dialog to notify the user that
     * remote control session has ended.
     */
    _stop() {
        if(!this.controlledParticipant) {
            return;
        }
        logger.log("Stopping remote control controller.");
        APP.UI.removeListener(UIEvents.LARGE_VIDEO_ID_CHANGED,
            this._largeVideoChangedListener);
        APP.conference.removeConferenceListener(
            ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            this._stopListener);
        APP.conference.removeConferenceListener(ConferenceEvents.USER_LEFT,
            this._userLeftListener);
        this.controlledParticipant = null;
        this.pause();
        this.area = null;
        APP.UI.messageHandler.openMessageDialog(
            "dialog.remoteControlTitle",
            "dialog.remoteControlStopMessage"
        );
    }

    /**
     * Executes this._stop() mehtod:
     * Stops processing the mouse and keyboard events. Removes added listeners.
     * Enables the keyboard shortcuts. Displays dialog to notify the user that
     * remote control session has ended.
     *
     * In addition:
     * Sends stop message to the controlled participant.
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
     * Pauses the collecting of events and enables the keyboard shortcus. But
     * it doesn't removes any other listeners. Basically the remote control
     * session will be still active after this.pause(), but no events from the
     * controller side will be captured and sent.
     *
     * You can resume the collecting of the events with this.resume().
     */
    pause() {
        if(!this.controlledParticipant) {
            return;
        }
        logger.log("Pausing remote control controller.");
        this.isCollectingEvents = false;
        APP.keyboardshortcut.enable(true);
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
     * @returns {string} this.requestedParticipant.
     * NOTE: This id should be the result of JitsiParticipant.getId() call.
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

    /**
     * Handles changes of the participant displayed on the large video.
     * @param {string} id - the user id for the participant that is displayed.
     */
    _onLargeVideoIdChanged(id) {
        if (!this.controlledParticipant) {
            return;
        }
        if(this.controlledParticipant == id) {
            this.resume();
        } else {
            this.pause();
        }
    }
}
