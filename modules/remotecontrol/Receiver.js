/* @flow */

import { getLogger } from 'jitsi-meet-logger';

import * as JitsiMeetConferenceEvents from '../../ConferenceEvents';
import {
    openRemoteControlAuthorizationDialog
} from '../../react/features/remote-control';
import {
    DISCO_REMOTE_CONTROL_FEATURE,
    EVENT_TYPES,
    PERMISSIONS_ACTIONS,
    REMOTE_CONTROL_EVENT_NAME
} from '../../service/remotecontrol/Constants';
import { getJitsiMeetTransport } from '../transport';

import RemoteControlParticipant from './RemoteControlParticipant';

declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;
declare var JitsiMeetJS: Object;

const ConferenceEvents = JitsiMeetJS.events.conference;
const logger = getLogger(__filename);

/**
 * The transport instance used for communication with external apps.
 *
 * @type {Transport}
 */
const transport = getJitsiMeetTransport();

/**
 * This class represents the receiver party for a remote controller session.
 * It handles "remote-control-event" events and sends them to the
 * API module. From there the events can be received from wrapper application
 * and executed.
 */
export default class Receiver extends RemoteControlParticipant {
    _controller: ?string;
    _enabled: boolean;
    _hangupListener: Function;
    _remoteControlEventsListener: Function;
    _userLeftListener: Function;

    /**
     * Creates new instance.
     */
    constructor() {
        super();
        this._controller = null;
        this._remoteControlEventsListener
            = this._onRemoteControlEvent.bind(this);
        this._userLeftListener = this._onUserLeft.bind(this);
        this._hangupListener = this._onHangup.bind(this);

        // We expect here that even if we receive the supported event earlier
        // it will be cached and we'll receive it.
        transport.on('event', event => {
            if (event.name === REMOTE_CONTROL_EVENT_NAME) {
                this._onRemoteControlAPIEvent(event);

                return true;
            }

            return false;
        });
    }

    /**
     * Enables / Disables the remote control.
     *
     * @param {boolean} enabled - The new state.
     * @returns {void}
     */
    _enable(enabled: boolean) {
        if (this._enabled === enabled) {
            return;
        }
        this._enabled = enabled;
        if (enabled === true) {
            logger.log('Remote control receiver enabled.');

            // Announce remote control support.
            APP.connection.addFeature(DISCO_REMOTE_CONTROL_FEATURE, true);
            APP.conference.addConferenceListener(
                ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                this._remoteControlEventsListener);
            APP.conference.addListener(JitsiMeetConferenceEvents.BEFORE_HANGUP,
                this._hangupListener);
        } else {
            logger.log('Remote control receiver disabled.');
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
     *
     * @param {boolean} [dontShowDialog] - If true the dialog won't be
     * displayed.
     * @returns {void}
     */
    _stop(dontShowDialog: boolean = false) {
        if (!this._controller) {
            return;
        }
        logger.log('Remote control receiver stop.');
        this._controller = null;
        APP.conference.removeConferenceListener(ConferenceEvents.USER_LEFT,
            this._userLeftListener);
        if (this.remoteControlExternalAuth) {
            transport.sendEvent({
                name: REMOTE_CONTROL_EVENT_NAME,
                type: EVENT_TYPES.stop
            });
        }
        if (!dontShowDialog) {
            APP.UI.messageHandler.openMessageDialog(
                'dialog.remoteControlTitle',
                'dialog.remoteControlStopMessage'
            );
        }
    }

    /**
     * Calls this._stop() and sends stop message to the controller participant.
     *
     * @returns {void}
     */
    stop() {
        if (!this._controller) {
            return;
        }
        this.sendRemoteControlEvent(this._controller, {
            type: EVENT_TYPES.stop
        });
        this._stop();
    }

    /**
     * Listens for data channel EndpointMessage events. Handles only events of
     * type remote control. Sends "remote-control-event" events to the API
     * module.
     *
     * @param {JitsiParticipant} participant - The controller participant.
     * @param {Object} event - EndpointMessage event from the data channels.
     * @param {string} event.name - The function process only events with
     * name REMOTE_CONTROL_EVENT_NAME.
     * @returns {void}
     */
    _onRemoteControlEvent(participant: Object, event: Object) {
        if (event.name !== REMOTE_CONTROL_EVENT_NAME) {
            return;
        }

        const remoteControlEvent = Object.assign({}, event);

        if (this._enabled) {
            if (this._controller === null
                    && event.type === EVENT_TYPES.permissions
                    && event.action === PERMISSIONS_ACTIONS.request) {
                const userId = participant.getId();

                if (!config.remoteControlExternalAuth) {
                    APP.store.dispatch(
                        openRemoteControlAuthorizationDialog(userId));

                    return;
                }

                // FIXME: Maybe use transport.sendRequest in this case???
                remoteControlEvent.userId = userId;
                remoteControlEvent.userJID = participant.getJid();
                remoteControlEvent.displayName = participant.getDisplayName()
                    || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
                remoteControlEvent.screenSharing
                    = APP.conference.isSharingScreen;
            } else if (this._controller !== participant.getId()) {
                return;
            } else if (event.type === EVENT_TYPES.stop) {
                this._stop();

                return;
            }
            transport.sendEvent(remoteControlEvent);
        } else {
            logger.log('Remote control event is ignored because remote '
                + 'control is disabled', event);
        }
    }

    /**
     * Handles remote control permission events.
     *
     * @param {string} userId - The user id of the participant related to the
     * event.
     * @param {PERMISSIONS_ACTIONS} action - The action related to the event.
     * @returns {void}
     */
    _onRemoteControlPermissionsEvent(userId: string, action: string) {
        switch (action) {
        case PERMISSIONS_ACTIONS.grant:
            this.grant(userId);
            break;
        case PERMISSIONS_ACTIONS.deny:
            this.deny(userId);
            break;
        case PERMISSIONS_ACTIONS.error:
            this.sendRemoteControlEvent(userId, {
                type: EVENT_TYPES.permissions,
                action
            });
            break;
        default:

                // Unknown action. Ignore.
        }
    }

    /**
     * Denies remote control access for user associated with the passed user id.
     *
     * @param {string} userId - The id associated with the user who sent the
     * request for remote control authorization.
     * @returns {void}
     */
    deny(userId: string) {
        this.sendRemoteControlEvent(userId, {
            type: EVENT_TYPES.permissions,
            action: PERMISSIONS_ACTIONS.deny
        });
    }

    /**
     * Grants remote control access to user associated with the passed user id.
     *
     * @param {string} userId - The id associated with the user who sent the
     * request for remote control authorization.
     * @returns {void}
     */
    grant(userId: string) {
        APP.conference.addConferenceListener(ConferenceEvents.USER_LEFT,
            this._userLeftListener);
        this._controller = userId;
        logger.log(`Remote control permissions granted to: ${userId}`);
        if (APP.conference.isSharingScreen) {
            this.sendRemoteControlEvent(userId, {
                type: EVENT_TYPES.permissions,
                action: PERMISSIONS_ACTIONS.grant
            });
        } else {
            APP.conference.toggleScreenSharing();
            APP.conference.screenSharingPromise.then(() => {
                if (APP.conference.isSharingScreen) {
                    this.sendRemoteControlEvent(userId, {
                        type: EVENT_TYPES.permissions,
                        action: PERMISSIONS_ACTIONS.grant
                    });
                } else {
                    this.sendRemoteControlEvent(userId, {
                        type: EVENT_TYPES.permissions,
                        action: PERMISSIONS_ACTIONS.error
                    });
                }
            }).catch(() => {
                this.sendRemoteControlEvent(userId, {
                    type: EVENT_TYPES.permissions,
                    action: PERMISSIONS_ACTIONS.error
                });
            });
        }
    }

    /**
     * Handles remote control events from the external app. Currently only
     * events with type = EVENT_TYPES.supported or EVENT_TYPES.permissions.
     *
     * @param {RemoteControlEvent} event - The remote control event.
     * @returns {void}
     */
    _onRemoteControlAPIEvent(event: Object) {
        switch (event.type) {
        case EVENT_TYPES.permissions:
            this._onRemoteControlPermissionsEvent(event.userId, event.action);
            break;
        case EVENT_TYPES.supported:
            this._onRemoteControlSupported();
            break;
        }
    }

    /**
     * Handles events for support for executing remote control events into
     * the wrapper application.
     *
     * @returns {void}
     */
    _onRemoteControlSupported() {
        logger.log('Remote Control supported.');
        if (config.disableRemoteControl) {
            logger.log('Remote Control disabled.');
        } else {
            this._enable(true);
        }
    }

    /**
     * Calls the stop method if the other side have left.
     *
     * @param {string} id - The user id for the participant that have left.
     * @returns {void}
     */
    _onUserLeft(id: string) {
        if (this._controller === id) {
            this._stop();
        }
    }

    /**
     * Handles hangup events. Disables the receiver.
     *
     * @returns {void}
     */
    _onHangup() {
        this._enable(false);
    }
}
