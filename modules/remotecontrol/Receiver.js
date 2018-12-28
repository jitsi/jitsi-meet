/* @flow */

import { getLogger } from 'jitsi-meet-logger';

import * as JitsiMeetConferenceEvents from '../../ConferenceEvents';
import {
    JitsiConferenceEvents
} from '../../react/features/base/lib-jitsi-meet';
import {
    openRemoteControlAuthorizationDialog
} from '../../react/features/remote-control';
import {
    DISCO_REMOTE_CONTROL_FEATURE,
    EVENTS,
    PERMISSIONS_ACTIONS,
    REMOTE_CONTROL_MESSAGE_NAME,
    REQUESTS
} from '../../service/remotecontrol/Constants';
import * as RemoteControlEvents
    from '../../service/remotecontrol/RemoteControlEvents';
import { Transport, PostMessageTransportBackend } from '../transport';

import RemoteControlParticipant from './RemoteControlParticipant';

declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

const logger = getLogger(__filename);

/**
 * The transport instance used for communication with external apps.
 *
 * @type {Transport}
 */
const transport = new Transport({
    backend: new PostMessageTransportBackend({
        postisOptions: { scope: 'jitsi-remote-control' }
    })
});

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
            = this._onRemoteControlMessage.bind(this);
        this._userLeftListener = this._onUserLeft.bind(this);
        this._hangupListener = this._onHangup.bind(this);

        // We expect here that even if we receive the supported event earlier
        // it will be cached and we'll receive it.
        transport.on('event', event => {
            if (event.name === REMOTE_CONTROL_MESSAGE_NAME) {
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
                JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                this._remoteControlEventsListener);
            APP.conference.addListener(JitsiMeetConferenceEvents.BEFORE_HANGUP,
                this._hangupListener);
        } else {
            logger.log('Remote control receiver disabled.');
            this._stop(true);
            APP.connection.removeFeature(DISCO_REMOTE_CONTROL_FEATURE);
            APP.conference.removeConferenceListener(
                JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                this._remoteControlEventsListener);
            APP.conference.removeListener(
                JitsiMeetConferenceEvents.BEFORE_HANGUP,
                this._hangupListener);
        }
    }

    /**
     * Removes the listener for JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED
     * events. Sends stop message to the wrapper application. Optionally
     * displays dialog for informing the user that remote control session
     * ended.
     *
     * @param {boolean} [dontNotify] - If true - a notification about stopping
     * the remote control won't be displayed.
     * @returns {void}
     */
    _stop(dontNotify: boolean = false) {
        if (!this._controller) {
            return;
        }
        logger.log('Remote control receiver stop.');
        this._controller = null;
        APP.conference.removeConferenceListener(
            JitsiConferenceEvents.USER_LEFT,
            this._userLeftListener);
        transport.sendEvent({
            name: REMOTE_CONTROL_MESSAGE_NAME,
            type: EVENTS.stop
        });
        this.emit(RemoteControlEvents.ACTIVE_CHANGED, false);
        if (!dontNotify) {
            APP.UI.messageHandler.notify(
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
        this.sendRemoteControlEndpointMessage(this._controller, {
            type: EVENTS.stop
        });
        this._stop();
    }

    /**
     * Listens for data channel EndpointMessage. Handles only remote control
     * messages. Sends the remote control messages to the external app that
     * will execute them.
     *
     * @param {JitsiParticipant} participant - The controller participant.
     * @param {Object} message - EndpointMessage from the data channels.
     * @param {string} message.name - The function processes only messages with
     * name REMOTE_CONTROL_MESSAGE_NAME.
     * @returns {void}
     */
    _onRemoteControlMessage(participant: Object, message: Object) {
        if (message.name !== REMOTE_CONTROL_MESSAGE_NAME) {
            return;
        }

        if (this._enabled) {
            if (this._controller === null
                    && message.type === EVENTS.permissions
                    && message.action === PERMISSIONS_ACTIONS.request) {
                const userId = participant.getId();

                this.emit(RemoteControlEvents.ACTIVE_CHANGED, true);
                APP.store.dispatch(
                    openRemoteControlAuthorizationDialog(userId));
            } else if (this._controller === participant.getId()) {
                if (message.type === EVENTS.stop) {
                    this._stop();
                } else { // forward the message
                    transport.sendEvent(message);
                }
            } // else ignore
        } else {
            logger.log('Remote control message is ignored because remote '
                + 'control is disabled', message);
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
        this.emit(RemoteControlEvents.ACTIVE_CHANGED, false);
        this.sendRemoteControlEndpointMessage(userId, {
            type: EVENTS.permissions,
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
        APP.conference.addConferenceListener(JitsiConferenceEvents.USER_LEFT,
            this._userLeftListener);
        this._controller = userId;
        logger.log(`Remote control permissions granted to: ${userId}`);

        let promise;

        if (APP.conference.isSharingScreen
                && APP.conference.getDesktopSharingSourceType() === 'screen') {
            promise = this._sendStartRequest();
        } else {
            promise = APP.conference.toggleScreenSharing(
                true,
                {
                    desktopSharingSources: [ 'screen' ]
                })
                .then(() => this._sendStartRequest());
        }

        promise
            .then(() =>
                this.sendRemoteControlEndpointMessage(userId, {
                    type: EVENTS.permissions,
                    action: PERMISSIONS_ACTIONS.grant
                })
            )
            .catch(error => {
                logger.error(error);

                this.sendRemoteControlEndpointMessage(userId, {
                    type: EVENTS.permissions,
                    action: PERMISSIONS_ACTIONS.error
                });

                APP.UI.messageHandler.notify(
                    'dialog.remoteControlTitle',
                    'dialog.startRemoteControlErrorMessage'
                );

                this._stop(true);
            });
    }

    /**
     * Sends remote control start request.
     *
     * @returns {Promise}
     */
    _sendStartRequest() {
        return transport.sendRequest({
            name: REMOTE_CONTROL_MESSAGE_NAME,
            type: REQUESTS.start,
            sourceId: APP.conference.getDesktopSharingSourceId()
        });
    }

    /**
     * Handles remote control events from the external app. Currently only
     * events with type EVENTS.supported and EVENTS.stop are
     * supported.
     *
     * @param {RemoteControlEvent} event - The remote control event.
     * @returns {void}
     */
    _onRemoteControlAPIEvent(event: Object) {
        switch (event.type) {
        case EVENTS.supported:
            this._onRemoteControlSupported();
            break;
        case EVENTS.stop:
            this.stop();
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
