/* @flow */

import { getLogger } from 'jitsi-meet-logger';

import {
    JitsiConferenceEvents
} from '../../react/features/base/lib-jitsi-meet';
import * as KeyCodes from '../keycode/keycode';
import {
    EVENTS,
    PERMISSIONS_ACTIONS,
    REMOTE_CONTROL_MESSAGE_NAME
} from '../../service/remotecontrol/Constants';
import * as RemoteControlEvents
    from '../../service/remotecontrol/RemoteControlEvents';
import UIEvents from '../../service/UI/UIEvents';

import RemoteControlParticipant from './RemoteControlParticipant';

declare var $: Function;
declare var APP: Object;

const logger = getLogger(__filename);

/**
 * Extract the keyboard key from the keyboard event.
 *
 * @param {KeyboardEvent} event - The event.
 * @returns {KEYS} The key that is pressed or undefined.
 */
function getKey(event) {
    return KeyCodes.keyboardEventToKey(event);
}

/**
 * Extract the modifiers from the keyboard event.
 *
 * @param {KeyboardEvent} event - The event.
 * @returns {Array} With possible values: "shift", "control", "alt", "command".
 */
function getModifiers(event) {
    const modifiers = [];

    if (event.shiftKey) {
        modifiers.push('shift');
    }

    if (event.ctrlKey) {
        modifiers.push('control');
    }


    if (event.altKey) {
        modifiers.push('alt');
    }

    if (event.metaKey) {
        modifiers.push('command');
    }

    return modifiers;
}

/**
 * This class represents the controller party for a remote controller session.
 * It listens for mouse and keyboard events and sends them to the receiver
 * party of the remote control session.
 */
export default class Controller extends RemoteControlParticipant {
    _area: ?Object;
    _controlledParticipant: string | null;
    _isCollectingEvents: boolean;
    _largeVideoChangedListener: Function;
    _requestedParticipant: string | null;
    _stopListener: Function;
    _userLeftListener: Function;

    /**
     * Creates new instance.
     */
    constructor() {
        super();
        this._isCollectingEvents = false;
        this._controlledParticipant = null;
        this._requestedParticipant = null;
        this._stopListener = this._handleRemoteControlStoppedEvent.bind(this);
        this._userLeftListener = this._onUserLeft.bind(this);
        this._largeVideoChangedListener
            = this._onLargeVideoIdChanged.bind(this);
    }

    /**
     * Returns the current active participant's id.
     *
     * @returns {string|null} - The id of the current active participant.
     */
    get activeParticipant(): string | null {
        return this._requestedParticipant || this._controlledParticipant;
    }

    /**
     * Requests permissions from the remote control receiver side.
     *
     * @param {string} userId - The user id of the participant that will be
     * requested.
     * @param {JQuerySelector} eventCaptureArea - The area that is going to be
     * used mouse and keyboard event capture.
     * @returns {Promise<boolean>} Resolve values - true(accept), false(deny),
     * null(the participant has left).
     */
    requestPermissions(
            userId: string,
            eventCaptureArea: Object
    ): Promise<boolean | null> {
        if (!this._enabled) {
            return Promise.reject(new Error('Remote control is disabled!'));
        }
        this.emit(RemoteControlEvents.ACTIVE_CHANGED, true);
        this._area = eventCaptureArea;// $("#largeVideoWrapper")
        logger.log(`Requsting remote control permissions from: ${userId}`);

        return new Promise((resolve, reject) => {
            // eslint-disable-next-line prefer-const
            let onUserLeft, permissionsReplyListener;

            const clearRequest = () => {
                this._requestedParticipant = null;
                APP.conference.removeConferenceListener(
                    JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                    permissionsReplyListener);
                APP.conference.removeConferenceListener(
                    JitsiConferenceEvents.USER_LEFT,
                    onUserLeft);
            };

            permissionsReplyListener = (participant, event) => {
                let result = null;

                try {
                    result = this._handleReply(participant, event);
                } catch (e) {
                    clearRequest();
                    this.emit(RemoteControlEvents.ACTIVE_CHANGED, false);
                    reject(e);
                }
                if (result !== null) {
                    clearRequest();
                    if (result === false) {
                        this.emit(RemoteControlEvents.ACTIVE_CHANGED, false);
                    }
                    resolve(result);
                }
            };
            onUserLeft = id => {
                if (id === this._requestedParticipant) {
                    clearRequest();
                    this.emit(RemoteControlEvents.ACTIVE_CHANGED, false);
                    resolve(null);
                }
            };

            APP.conference.addConferenceListener(
                JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                permissionsReplyListener);
            APP.conference.addConferenceListener(
                JitsiConferenceEvents.USER_LEFT,
                onUserLeft);
            this._requestedParticipant = userId;
            this.sendRemoteControlEndpointMessage(
                userId,
                {
                    type: EVENTS.permissions,
                    action: PERMISSIONS_ACTIONS.request
                },
                e => {
                    clearRequest();
                    reject(e);
                });
        });
    }

    /**
     * Handles the reply of the permissions request.
     *
     * @param {JitsiParticipant} participant - The participant that has sent the
     * reply.
     * @param {RemoteControlEvent} event - The remote control event.
     * @returns {boolean|null}
     */
    _handleReply(participant: Object, event: Object) {
        const userId = participant.getId();

        if (this._enabled
                && event.name === REMOTE_CONTROL_MESSAGE_NAME
                && event.type === EVENTS.permissions
                && userId === this._requestedParticipant) {
            if (event.action !== PERMISSIONS_ACTIONS.grant) {
                this._area = undefined;
            }
            switch (event.action) {
            case PERMISSIONS_ACTIONS.grant: {
                this._controlledParticipant = userId;
                logger.log('Remote control permissions granted to:', userId);
                this._start();

                return true;
            }
            case PERMISSIONS_ACTIONS.deny:
                return false;
            case PERMISSIONS_ACTIONS.error:
                throw new Error('Error occurred on receiver side');
            default:
                throw new Error('Unknown reply received!');
            }
        } else {
            // different message type or another user -> ignoring the message
            return null;
        }
    }

    /**
     * Handles remote control stopped.
     *
     * @param {JitsiParticipant} participant - The participant that has sent the
     * event.
     * @param {Object} event - EndpointMessage event from the data channels.
     * @property {string} type - The function process only events with
     * name REMOTE_CONTROL_MESSAGE_NAME.
     * @returns {void}
     */
    _handleRemoteControlStoppedEvent(participant: Object, event: Object) {
        if (this._enabled
                && event.name === REMOTE_CONTROL_MESSAGE_NAME
                && event.type === EVENTS.stop
                && participant.getId() === this._controlledParticipant) {
            this._stop();
        }
    }

    /**
     * Starts processing the mouse and keyboard events. Sets conference
     * listeners. Disables keyboard events.
     *
     * @returns {void}
     */
    _start() {
        logger.log('Starting remote control controller.');
        APP.UI.addListener(UIEvents.LARGE_VIDEO_ID_CHANGED,
            this._largeVideoChangedListener);
        APP.conference.addConferenceListener(
            JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            this._stopListener);
        APP.conference.addConferenceListener(JitsiConferenceEvents.USER_LEFT,
            this._userLeftListener);
        this.resume();
    }

    /**
     * Disables the keyboatd shortcuts. Starts collecting remote control
     * events. It can be used to resume an active remote control session wchich
     * was paused with this.pause().
     *
     * @returns {void}
     */
    resume() {
        let area;

        if (!this._enabled
                || this._isCollectingEvents
                || !(area = this._area)) {
            return;
        }
        logger.log('Resuming remote control controller.');
        this._isCollectingEvents = true;
        APP.keyboardshortcut.enable(false);

        area.mousemove(event => {
            const area = this._area; // eslint-disable-line no-shadow

            if (!area) {
                return;
            }

            const position = area.position();

            this.sendRemoteControlEndpointMessage(this._controlledParticipant, {
                type: EVENTS.mousemove,
                x: (event.pageX - position.left) / area.width(),
                y: (event.pageY - position.top) / area.height()
            });
        });

        area.mousedown(this._onMouseClickHandler.bind(this, EVENTS.mousedown));
        area.mouseup(this._onMouseClickHandler.bind(this, EVENTS.mouseup));

        area.dblclick(
            this._onMouseClickHandler.bind(this, EVENTS.mousedblclick));

        area.contextmenu(() => false);

        area[0].onmousewheel = event => {
            event.preventDefault();
            event.stopPropagation();
            this.sendRemoteControlEndpointMessage(this._controlledParticipant, {
                type: EVENTS.mousescroll,
                x: event.deltaX,
                y: event.deltaY
            });

            return false;
        };

        $(window).keydown(this._onKeyPessHandler.bind(this,
            EVENTS.keydown));
        $(window).keyup(this._onKeyPessHandler.bind(this, EVENTS.keyup));
    }

    /**
     * Stops processing the mouse and keyboard events. Removes added listeners.
     * Enables the keyboard shortcuts. Displays dialog to notify the user that
     * remote control session has ended.
     *
     * @returns {void}
     */
    _stop() {
        if (!this._controlledParticipant) {
            return;
        }
        logger.log('Stopping remote control controller.');
        APP.UI.removeListener(UIEvents.LARGE_VIDEO_ID_CHANGED,
            this._largeVideoChangedListener);
        APP.conference.removeConferenceListener(
            JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            this._stopListener);
        APP.conference.removeConferenceListener(JitsiConferenceEvents.USER_LEFT,
            this._userLeftListener);
        this.pause();
        this._controlledParticipant = null;
        this._area = undefined;
        this.emit(RemoteControlEvents.ACTIVE_CHANGED, false);
        APP.UI.messageHandler.notify(
            'dialog.remoteControlTitle',
            'dialog.remoteControlStopMessage'
        );
    }

    /**
     * Executes this._stop() mehtod which stops processing the mouse and
     * keyboard events, removes added listeners, enables the keyboard shortcuts,
     * displays dialog to notify the user that remote control session has ended.
     * In addition sends stop message to the controlled participant.
     *
     * @returns {void}
     */
    stop() {
        if (!this._controlledParticipant) {
            return;
        }
        this.sendRemoteControlEndpointMessage(this._controlledParticipant, {
            type: EVENTS.stop
        });
        this._stop();
    }

    /**
     * Pauses the collecting of events and enables the keyboard shortcus. But
     * it doesn't removes any other listeners. Basically the remote control
     * session will be still active after this.pause(), but no events from the
     * controller side will be captured and sent. You can resume the collecting
     * of the events with this.resume().
     *
     * @returns {void}
     */
    pause() {
        if (!this._controlledParticipant) {
            return;
        }
        logger.log('Pausing remote control controller.');
        this._isCollectingEvents = false;
        APP.keyboardshortcut.enable(true);

        const area = this._area;

        if (area) {
            area.off('contextmenu');
            area.off('dblclick');
            area.off('mousedown');
            area.off('mousemove');
            area.off('mouseup');

            area[0].onmousewheel = undefined;
        }

        $(window).off('keydown');
        $(window).off('keyup');
    }

    /**
     * Handler for mouse click events.
     *
     * @param {string} type - The type of event ("mousedown"/"mouseup").
     * @param {Event} event - The mouse event.
     * @returns {void}
     */
    _onMouseClickHandler(type: string, event: Object) {
        this.sendRemoteControlEndpointMessage(this._controlledParticipant, {
            type,
            button: event.which
        });
    }

    /**
     * Returns true if the remote control session is started.
     *
     * @returns {boolean}
     */
    isStarted() {
        return this._controlledParticipant !== null;
    }

    /**
     * Returns the id of the requested participant.
     *
     * @returns {string} The id of the requested participant.
     * NOTE: This id should be the result of JitsiParticipant.getId() call.
     */
    getRequestedParticipant() {
        return this._requestedParticipant;
    }

    /**
     * Handler for key press events.
     *
     * @param {string} type - The type of event ("keydown"/"keyup").
     * @param {Event} event - The key event.
     * @returns {void}
     */
    _onKeyPessHandler(type: string, event: Object) {
        this.sendRemoteControlEndpointMessage(this._controlledParticipant, {
            type,
            key: getKey(event),
            modifiers: getModifiers(event)
        });
    }

    /**
     * Calls the stop method if the other side have left.
     *
     * @param {string} id - The user id for the participant that have left.
     * @returns {void}
     */
    _onUserLeft(id: string) {
        if (this._controlledParticipant === id) {
            this._stop();
        }
    }

    /**
     * Handles changes of the participant displayed on the large video.
     *
     * @param {string} id - The user id for the participant that is displayed.
     * @returns {void}
     */
    _onLargeVideoIdChanged(id: string) {
        if (!this._controlledParticipant) {
            return;
        }
        if (this._controlledParticipant === id) {
            this.resume();
        } else {
            this.pause();
        }
    }
}
