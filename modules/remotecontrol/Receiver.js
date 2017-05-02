/* global APP, JitsiMeetJS, interfaceConfig, config */
import * as JitsiMeetConferenceEvents from '../../ConferenceEvents';
import {
    DISCO_REMOTE_CONTROL_FEATURE,
    EVENT_TYPES,
    PERMISSIONS_ACTIONS,
    REMOTE_CONTROL_EVENT_TYPE
} from "../../service/remotecontrol/Constants";
import { transport } from '../transport';

import RemoteControlParticipant from "./RemoteControlParticipant";

const logger = require("jitsi-meet-logger").getLogger(__filename);
const ConferenceEvents = JitsiMeetJS.events.conference;

/**
 * This class represents the receiver party for a remote controller session.
 * It handles "remote-control-event" events and sends them to the
 * API module. From there the events can be received from wrapper application
 * and executed.
 */
export default class Receiver extends RemoteControlParticipant {
    /**
     * Creates new instance.
     * @constructor
     */
    constructor() {
        super();
        this.controller = null;
        this._remoteControlEventsListener
            = this._onRemoteControlEvent.bind(this);
        this._userLeftListener = this._onUserLeft.bind(this);
        this._hangupListener = this._onHangup.bind(this);
        // We expect here that even if we receive the supported event earlier
        // it will be cached and we'll receive it.
        transport.on(REMOTE_CONTROL_EVENT_TYPE,
            event => this._onRemoteControlAPIEvent(event));
    }

    /**
     * Enables / Disables the remote control
     * @param {boolean} enabled the new state.
     */
    _enable(enabled) {
        if(this.enabled === enabled) {
            return;
        }
        this.enabled = enabled;
        if(enabled === true) {
            logger.log("Remote control receiver enabled.");
            // Announce remote control support.
            APP.connection.addFeature(DISCO_REMOTE_CONTROL_FEATURE, true);
            APP.conference.addConferenceListener(
                ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                this._remoteControlEventsListener);
            APP.conference.addListener(JitsiMeetConferenceEvents.BEFORE_HANGUP,
                this._hangupListener);
        } else {
            logger.log("Remote control receiver disabled.");
            this._stop(true);
            APP.connection.removeFeature(DISCO_REMOTE_CONTROL_FEATURE);
            APP.conference.removeConferenceListener(
                ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                this._remoteControlEventsListener);
            APP.conference.removeListener(
                JitsiMeetConferenceEvents.BEFORE_HANGUP,
                this._hangupListener);
        }
    }

    /**
     * Removes the listener for ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED
     * events. Sends stop message to the wrapper application. Optionally
     * displays dialog for informing the user that remote control session
     * ended.
     * @param {boolean} dontShowDialog - if true the dialog won't be displayed.
     */
    _stop(dontShowDialog = false) {
        if(!this.controller) {
            return;
        }
        logger.log("Remote control receiver stop.");
        this.controller = null;
        APP.conference.removeConferenceListener(ConferenceEvents.USER_LEFT,
            this._userLeftListener);
        transport.sendEvent(REMOTE_CONTROL_EVENT_TYPE, {
            type: EVENT_TYPES.stop
        });
        if(!dontShowDialog) {
            APP.UI.messageHandler.openMessageDialog(
                "dialog.remoteControlTitle",
                "dialog.remoteControlStopMessage"
            );
        }
    }

    /**
     * Calls this._stop() and sends stop message to the controller participant
     */
    stop() {
        if(!this.controller) {
            return;
        }
        this._sendRemoteControlEvent(this.controller, {
            type: EVENT_TYPES.stop
        });
        this._stop();
    }

    /**
     * Listens for data channel EndpointMessage events. Handles only events of
     * type remote control. Sends "remote-control-event" events to the API
     * module.
     * @param {JitsiParticipant} participant the controller participant
     * @param {Object} event EndpointMessage event from the data channels.
     * @property {string} type property. The function process only events of
     * type REMOTE_CONTROL_EVENT_TYPE
     * @property {RemoteControlEvent} event - the remote control event.
     */
    _onRemoteControlEvent(participant, event) {
        if(this.enabled && event.type === REMOTE_CONTROL_EVENT_TYPE) {
            const remoteControlEvent = event.event;
            if(this.controller === null
                && remoteControlEvent.type === EVENT_TYPES.permissions
                && remoteControlEvent.action === PERMISSIONS_ACTIONS.request) {
                // FIXME: Maybe use transport.sendRequest in this case???
                remoteControlEvent.userId = participant.getId();
                remoteControlEvent.userJID = participant.getJid();
                remoteControlEvent.displayName = participant.getDisplayName()
                    || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
                remoteControlEvent.screenSharing
                    = APP.conference.isSharingScreen;
            } else if(this.controller !== participant.getId()) {
                return;
            } else if(remoteControlEvent.type === EVENT_TYPES.stop) {
                this._stop();
                return;
            }
            transport.sendEvent(REMOTE_CONTROL_EVENT_TYPE, remoteControlEvent);
        } else if(event.type === REMOTE_CONTROL_EVENT_TYPE) {
            logger.log("Remote control event is ignored because remote "
                + "control is disabled", event);
        }
    }

    /**
     * Handles remote control permission events.
     * @param {String} userId the user id of the participant related to the
     * event.
     * @param {PERMISSIONS_ACTIONS} action the action related to the event.
     */
    _onRemoteControlPermissionsEvent(userId, action) {
        if(action === PERMISSIONS_ACTIONS.grant) {
            APP.conference.addConferenceListener(ConferenceEvents.USER_LEFT,
                this._userLeftListener);
            this.controller = userId;
            logger.log("Remote control permissions granted to: " + userId);
            if(!APP.conference.isSharingScreen) {
                APP.conference.toggleScreenSharing();
                APP.conference.screenSharingPromise.then(() => {
                    if(APP.conference.isSharingScreen) {
                        this._sendRemoteControlEvent(userId, {
                            type: EVENT_TYPES.permissions,
                            action: action
                        });
                    } else {
                        this._sendRemoteControlEvent(userId, {
                            type: EVENT_TYPES.permissions,
                            action: PERMISSIONS_ACTIONS.error
                        });
                    }
                }).catch(() => {
                    this._sendRemoteControlEvent(userId, {
                        type: EVENT_TYPES.permissions,
                        action: PERMISSIONS_ACTIONS.error
                    });
                });
                return;
            }
        }
        this._sendRemoteControlEvent(userId, {
            type: EVENT_TYPES.permissions,
            action: action
        });
    }

    /**
     * Handles remote control events from the external app. Currently only
     * events with type = EVENT_TYPES.supported or EVENT_TYPES.permissions
     * @param {RemoteControlEvent} event the remote control event.
     */
    _onRemoteControlAPIEvent(event) {
        switch(event.type) {
            case EVENT_TYPES.supported:
                this._onRemoteControlSupported();
                break;
            case EVENT_TYPES.permissions:
                this._onRemoteControlPermissionsEvent(
                    event.userId, event.action);
                break;
        }
    }

    /**
     * Handles events for support for executing remote control events into
     * the wrapper application.
     */
    _onRemoteControlSupported() {
        logger.log("Remote Control supported.");
        if(!config.disableRemoteControl) {
            this._enable(true);
        } else {
            logger.log("Remote Control disabled.");
        }
    }

    /**
     * Calls the stop method if the other side have left.
     * @param {string} id - the user id for the participant that have left
     */
    _onUserLeft(id) {
        if(this.controller === id) {
            this._stop();
        }
    }

    /**
     * Handles hangup events. Disables the receiver.
     */
    _onHangup() {
        this._enable(false);
    }
}
