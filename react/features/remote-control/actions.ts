// @ts-expect-error
import $ from 'jquery';
import React from 'react';

import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { pinParticipant } from '../base/participants/actions';
import {
    getParticipantDisplayName,
    getPinnedParticipant,
    getVirtualScreenshareParticipantByOwnerId
} from '../base/participants/functions';
import { toggleScreensharing } from '../base/tracks/actions';
import { getLocalDesktopTrack } from '../base/tracks/functions';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { isScreenVideoShared } from '../screen-share/functions';

import {
    CAPTURE_EVENTS,
    REMOTE_CONTROL_ACTIVE,
    SET_CONTROLLED_PARTICIPANT,
    SET_CONTROLLER,
    SET_RECEIVER_ENABLED,
    SET_RECEIVER_TRANSPORT,
    SET_REQUESTED_PARTICIPANT
} from './actionTypes';
import RemoteControlAuthorizationDialog from './components/RemoteControlAuthorizationDialog';
import {
    DISCO_REMOTE_CONTROL_FEATURE,
    EVENTS,
    PERMISSIONS_ACTIONS,
    REMOTE_CONTROL_MESSAGE_NAME,
    REQUESTS
} from './constants';
import {
    getKey,
    getModifiers,
    getRemoteConrolEventCaptureArea,
    isRemoteControlEnabled,
    sendRemoteControlEndpointMessage
} from './functions';
import logger from './logger';

/**
 * Listeners.
 */
let permissionsReplyListener: Function | undefined,
    receiverEndpointMessageListener: Function, stopListener: Function | undefined;

/**
 * Signals that the remote control authorization dialog should be displayed.
 *
 * @param {string} participantId - The id of the participant who is requesting
 * the authorization.
 * @returns {{
 *     type: OPEN_DIALOG,
 *     component: {RemoteControlAuthorizationDialog},
 *     componentProps: {
 *         participantId: {string}
 *      }
 * }}
 * @public
 */
export function openRemoteControlAuthorizationDialog(participantId: string) {
    return openDialog(RemoteControlAuthorizationDialog, { participantId });
}

/**
 * Sets the remote control active property.
 *
 * @param {boolean} active - The new value for the active property.
 * @returns {Function}
 */
export function setRemoteControlActive(active: boolean) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { active: oldActive } = state['features/remote-control'];
        const { conference } = state['features/base/conference'];

        if (active !== oldActive) {
            dispatch({
                type: REMOTE_CONTROL_ACTIVE,
                active
            });
            conference?.setLocalParticipantProperty('remoteControlSessionStatus', active);
        }
    };
}

/**
 * Requests permissions from the remote control receiver side.
 *
 * @param {string} userId - The user id of the participant that will be
 * requested.
 * @returns {Function}
 */
export function requestRemoteControl(userId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const enabled = isRemoteControlEnabled(state);

        if (!enabled) {
            return Promise.reject(new Error('Remote control is disabled!'));
        }

        dispatch(setRemoteControlActive(true));

        logger.log(`Requesting remote control permissions from: ${userId}`);

        const { conference } = state['features/base/conference'];


        permissionsReplyListener = (participant: any, event: any) => {
            dispatch(processPermissionRequestReply(participant.getId(), event));
        };

        conference?.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, permissionsReplyListener);

        dispatch({
            type: SET_REQUESTED_PARTICIPANT,
            requestedParticipant: userId
        });

        if (!sendRemoteControlEndpointMessage(
            conference,
            userId,
            {
                type: EVENTS.permissions,
                action: PERMISSIONS_ACTIONS.request
            })) {
            dispatch(clearRequest());
        }
    };
}

/**
 * Handles permission request replies on the controller side.
 *
 * @param {string} participantId - The participant that sent the request.
 * @param {EndpointMessage} event - The permission request event.
 * @returns {Function}
 */
export function processPermissionRequestReply(participantId: string, event: any) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { action, name, type } = event;
        const { requestedParticipant } = state['features/remote-control'].controller;

        if (isRemoteControlEnabled(state) && name === REMOTE_CONTROL_MESSAGE_NAME && type === EVENTS.permissions
                && participantId === requestedParticipant) {
            let descriptionKey, permissionGranted = false;

            switch (action) {
            case PERMISSIONS_ACTIONS.grant: {
                dispatch({
                    type: SET_CONTROLLED_PARTICIPANT,
                    controlled: participantId
                });

                logger.log('Remote control permissions granted!', participantId);
                logger.log('Starting remote control controller.');

                const { conference } = state['features/base/conference'];

                stopListener = (participant: any, stopEvent: { name: string; type: string; }) => {
                    dispatch(handleRemoteControlStoppedEvent(participant.getId(), stopEvent));
                };

                conference?.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, stopListener);

                dispatch(resume());

                permissionGranted = true;
                descriptionKey = 'dialog.remoteControlAllowedMessage';
                break;
            }
            case PERMISSIONS_ACTIONS.deny:
                logger.log('Remote control permissions denied!', participantId);
                descriptionKey = 'dialog.remoteControlDeniedMessage';
                break;
            case PERMISSIONS_ACTIONS.error:
                logger.error('Error occurred on receiver side');
                descriptionKey = 'dialog.remoteControlErrorMessage';
                break;
            default:
                logger.error('Unknown reply received!');
                descriptionKey = 'dialog.remoteControlErrorMessage';
            }

            dispatch(clearRequest());

            if (!permissionGranted) {
                dispatch(setRemoteControlActive(false));
            }

            dispatch(showNotification({
                descriptionArguments: { user: getParticipantDisplayName(state, participantId) },
                descriptionKey,
                titleKey: 'dialog.remoteControlTitle'
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

            if (permissionGranted) {
                // the remote control permissions has been granted
                // pin the controlled participant
                const pinnedParticipant = getPinnedParticipant(state);
                const virtualScreenshareParticipant = getVirtualScreenshareParticipantByOwnerId(state, participantId);
                const pinnedId = pinnedParticipant?.id;

                if (virtualScreenshareParticipant?.id && pinnedId !== virtualScreenshareParticipant?.id) {
                    dispatch(pinParticipant(virtualScreenshareParticipant?.id));
                } else if (!virtualScreenshareParticipant?.id && pinnedId !== participantId) {
                    dispatch(pinParticipant(participantId));
                }
            }
        } else {
            // different message type or another user -> ignoring the message
        }
    };
}

/**
 * Handles remote control stopped.
 *
 * @param {string} participantId - The ID of the participant that has sent the event.
 * @param {EndpointMessage} event - EndpointMessage event from the data channels.
 * @property {string} type - The function process only events with name REMOTE_CONTROL_MESSAGE_NAME.
 * @returns {void}
 */
export function handleRemoteControlStoppedEvent(participantId: Object, event: { name: string; type: string; }) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { name, type } = event;
        const { controlled } = state['features/remote-control'].controller;

        if (isRemoteControlEnabled(state) && name === REMOTE_CONTROL_MESSAGE_NAME && type === EVENTS.stop
                && participantId === controlled) {
            dispatch(stopController());
        }
    };
}

/**
 * Stops processing the mouse and keyboard events. Removes added listeners.
 * Enables the keyboard shortcuts. Displays dialog to notify the user that remote control session has ended.
 *
 * @param {boolean} notifyRemoteParty - If true a endpoint message to the controlled participant will be sent.
 * @returns {void}
 */
export function stopController(notifyRemoteParty = false) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { controlled } = state['features/remote-control'].controller;

        if (!controlled) {
            return;
        }

        const { conference } = state['features/base/conference'];

        if (notifyRemoteParty) {
            sendRemoteControlEndpointMessage(conference, controlled, {
                type: EVENTS.stop
            });
        }

        logger.log('Stopping remote control controller.');

        conference?.off(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, stopListener);
        stopListener = undefined;

        dispatch(pause());

        dispatch({
            type: SET_CONTROLLED_PARTICIPANT,
            controlled: undefined
        });

        dispatch(setRemoteControlActive(false));
        dispatch(showNotification({
            descriptionKey: 'dialog.remoteControlStopMessage',
            titleKey: 'dialog.remoteControlTitle'
        }, NOTIFICATION_TIMEOUT_TYPE.LONG));
    };
}

/**
 * Clears a pending permission request.
 *
 * @returns {Function}
 */
export function clearRequest() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { conference } = getState()['features/base/conference'];

        dispatch({
            type: SET_REQUESTED_PARTICIPANT,
            requestedParticipant: undefined
        });

        conference?.off(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, permissionsReplyListener);
        permissionsReplyListener = undefined;
    };
}


/**
 * Sets that transport object that is used by the receiver to communicate with the native part of the remote control
 * implementation.
 *
 * @param {Transport} transport - The transport to be set.
 * @returns {{
 *      type: SET_RECEIVER_TRANSPORT,
 *      transport: Transport
 * }}
 */
export function setReceiverTransport(transport?: Object) {
    return {
        type: SET_RECEIVER_TRANSPORT,
        transport
    };
}

/**
 * Enables the receiver functionality.
 *
 * @returns {Function}
 */
export function enableReceiver() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { enabled } = state['features/remote-control'].receiver;

        if (enabled) {
            return;
        }

        const { connection } = state['features/base/connection'];
        const { conference } = state['features/base/conference'];

        if (!connection || !conference) {
            logger.error('Couldn\'t enable the remote receiver! The connection or conference instance is undefined!');

            return;
        }

        dispatch({
            type: SET_RECEIVER_ENABLED,
            enabled: true
        });

        connection.addFeature(DISCO_REMOTE_CONTROL_FEATURE, true);
        receiverEndpointMessageListener = (participant: any, message: {
            action: string; name: string; type: string; }) => {
            dispatch(endpointMessageReceived(participant.getId(), message));
        };
        conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, receiverEndpointMessageListener);
    };
}

/**
 * Disables the receiver functionality.
 *
 * @returns {Function}
 */
export function disableReceiver() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { enabled } = state['features/remote-control'].receiver;

        if (!enabled) {
            return;
        }

        const { connection } = state['features/base/connection'];
        const { conference } = state['features/base/conference'];

        if (!connection || !conference) {
            logger.error('Couldn\'t enable the remote receiver! The connection or conference instance is undefined!');

            return;
        }

        logger.log('Remote control receiver disabled.');

        dispatch({
            type: SET_RECEIVER_ENABLED,
            enabled: false
        });

        dispatch(stopReceiver(true));

        connection.removeFeature(DISCO_REMOTE_CONTROL_FEATURE);
        conference.off(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, receiverEndpointMessageListener);
    };
}

/**
 * Stops a remote control session on the receiver side.
 *
 * @param {boolean} [dontNotifyLocalParty] - If true - a notification about stopping
 * the remote control won't be displayed.
 * @param {boolean} [dontNotifyRemoteParty] - If true a endpoint message to the controller participant will be sent.
 * @returns {Function}
 */
export function stopReceiver(dontNotifyLocalParty = false, dontNotifyRemoteParty = false) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { receiver } = state['features/remote-control'];
        const { controller, transport } = receiver;

        if (!controller) {
            return;
        }

        const { conference } = state['features/base/conference'];

        if (!dontNotifyRemoteParty) {
            sendRemoteControlEndpointMessage(conference, controller, {
                type: EVENTS.stop
            });
        }

        dispatch({
            type: SET_CONTROLLER,
            controller: undefined
        });

        transport?.sendEvent({
            name: REMOTE_CONTROL_MESSAGE_NAME,
            type: EVENTS.stop
        });

        dispatch(setRemoteControlActive(false));

        if (!dontNotifyLocalParty) {
            dispatch(showNotification({
                descriptionKey: 'dialog.remoteControlStopMessage',
                titleKey: 'dialog.remoteControlTitle'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        }
    };
}


/**
 * Handles only remote control endpoint messages.
 *
 * @param {string} participantId - The controller participant ID.
 * @param {Object} message - EndpointMessage from the data channels.
 * @param {string} message.name - The function processes only messages with
 * name REMOTE_CONTROL_MESSAGE_NAME.
 * @returns {Function}
 */
export function endpointMessageReceived(participantId: string, message: {
    action: string; name: string; type: string; }) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { action, name, type } = message;

        if (name !== REMOTE_CONTROL_MESSAGE_NAME) {
            return;
        }

        const state = getState();
        const { receiver } = state['features/remote-control'];
        const { enabled, transport } = receiver;

        if (enabled) {
            const { controller } = receiver;

            if (!controller && type === EVENTS.permissions && action === PERMISSIONS_ACTIONS.request) {
                dispatch(setRemoteControlActive(true));
                dispatch(openRemoteControlAuthorizationDialog(participantId));
            } else if (controller === participantId) {
                if (type === EVENTS.stop) {
                    dispatch(stopReceiver(false, true));
                } else { // forward the message
                    try {
                        transport?.sendEvent(message);
                    } catch (error) {
                        logger.error('Error while trying to execute remote control message', error);
                    }
                }
            } // else ignore
        } else {
            logger.log('Remote control message is ignored because remote control is disabled', message);
        }
    };
}

/**
 * Denies remote control access for user associated with the passed user id.
 *
 * @param {string} participantId - The id associated with the user who sent the
 * request for remote control authorization.
 * @returns {Function}
 */
export function deny(participantId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { conference } = state['features/base/conference'];

        dispatch(setRemoteControlActive(false));
        sendRemoteControlEndpointMessage(conference, participantId, {
            type: EVENTS.permissions,
            action: PERMISSIONS_ACTIONS.deny
        });
    };
}

/**
 * Sends start remote control request to the native implementation.
 *
 * @returns {Function}
 */
export function sendStartRequest() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const tracks = state['features/base/tracks'];
        const track = getLocalDesktopTrack(tracks);
        const { sourceId } = track?.jitsiTrack || {};
        const { transport } = state['features/remote-control'].receiver;

        if (typeof sourceId === 'undefined') {
            return Promise.reject(new Error('Cannot identify screen for the remote control session'));
        }

        return transport?.sendRequest({
            name: REMOTE_CONTROL_MESSAGE_NAME,
            type: REQUESTS.start,
            sourceId
        });
    };
}

/**
 * Grants remote control access to user associated with the passed user id.
 *
 * @param {string} participantId - The id associated with the user who sent the
 * request for remote control authorization.
 * @returns {Function}
 */
export function grant(participantId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        dispatch({
            type: SET_CONTROLLER,
            controller: participantId
        });
        logger.log(`Remote control permissions granted to: ${participantId}`);

        let promise;
        const state = getState();
        const tracks = state['features/base/tracks'];
        const track = getLocalDesktopTrack(tracks);
        const isScreenSharing = isScreenVideoShared(state);
        const { sourceType } = track?.jitsiTrack || {};

        if (isScreenSharing && sourceType === 'screen') {
            promise = dispatch(sendStartRequest());
        } else {
            promise = dispatch(toggleScreensharing(
                true,
                false,
                { desktopSharingSources: [ 'screen' ] }
            ))
            .then(() => dispatch(sendStartRequest()));
        }

        const { conference } = state['features/base/conference'];

        promise
            .then(() => sendRemoteControlEndpointMessage(conference, participantId, {
                type: EVENTS.permissions,
                action: PERMISSIONS_ACTIONS.grant
            }))
            .catch((error: any) => {
                logger.error(error);

                sendRemoteControlEndpointMessage(conference, participantId, {
                    type: EVENTS.permissions,
                    action: PERMISSIONS_ACTIONS.error
                });

                dispatch(showNotification({
                    descriptionKey: 'dialog.startRemoteControlErrorMessage',
                    titleKey: 'dialog.remoteControlTitle'
                }, NOTIFICATION_TIMEOUT_TYPE.LONG));

                dispatch(stopReceiver(true));
            });
    };
}

/**
 * Handler for mouse click events on the controller side.
 *
 * @param {string} type - The type of event ("mousedown"/"mouseup").
 * @param {Event} event - The mouse event.
 * @returns {Function}
 */
export function mouseClicked(type: string, event: React.MouseEvent) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { conference } = state['features/base/conference'];
        const { controller } = state['features/remote-control'];

        sendRemoteControlEndpointMessage(conference, controller.controlled, {
            type,

            // @ts-ignore
            button: event.which
        });
    };
}

/**
 * Handles mouse moved events on the controller side.
 *
 * @param {Event} event - The mouse event.
 * @returns {Function}
 */
export function mouseMoved(event: React.MouseEvent) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const area = getRemoteConrolEventCaptureArea();

        if (!area) {
            return;
        }

        const position = area.position();
        const state = getState();
        const { conference } = state['features/base/conference'];
        const { controller } = state['features/remote-control'];

        sendRemoteControlEndpointMessage(conference, controller.controlled, {
            type: EVENTS.mousemove,
            x: (event.pageX - position.left) / area.width(),
            y: (event.pageY - position.top) / area.height()
        });
    };
}

/**
 * Handles mouse scroll events on the controller side.
 *
 * @param {Event} event - The mouse event.
 * @returns {Function}
 */
export function mouseScrolled(event: { deltaX: number; deltaY: number; }) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { conference } = state['features/base/conference'];
        const { controller } = state['features/remote-control'];

        sendRemoteControlEndpointMessage(conference, controller.controlled, {
            type: EVENTS.mousescroll,
            x: event.deltaX,
            y: event.deltaY
        });
    };
}

/**
 * Handles key press events on the controller side..
 *
 * @param {string} type - The type of event ("keydown"/"keyup").
 * @param {Event} event - The key event.
 * @returns {Function}
 */
export function keyPressed(type: string, event: React.KeyboardEvent) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { conference } = state['features/base/conference'];
        const { controller } = state['features/remote-control'];

        sendRemoteControlEndpointMessage(conference, controller.controlled, {
            type,
            key: getKey(event),
            modifiers: getModifiers(event)
        });
    };
}

/**
* Disables the keyboatd shortcuts. Starts collecting remote control
* events. It can be used to resume an active remote control session which
* was paused with the pause action.
*
* @returns {Function}
*/
export function resume() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const area = getRemoteConrolEventCaptureArea();
        const state = getState();
        const { controller } = state['features/remote-control'];
        const { controlled, isCapturingEvents } = controller;

        if (!isRemoteControlEnabled(state) || !area || !controlled || isCapturingEvents) {
            return;
        }

        logger.log('Resuming remote control controller.');

        area.mousemove((event: React.MouseEvent) => {
            dispatch(mouseMoved(event));
        });
        area.mousedown((event: React.MouseEvent) => dispatch(mouseClicked(EVENTS.mousedown, event)));
        area.mouseup((event: React.MouseEvent) => dispatch(mouseClicked(EVENTS.mouseup, event)));
        area.dblclick((event: React.MouseEvent) => dispatch(mouseClicked(EVENTS.mousedblclick, event)));
        area.contextmenu(() => false);
        area[0].onwheel = (event: any) => {
            event.preventDefault();
            event.stopPropagation();
            dispatch(mouseScrolled(event));

            return false;
        };
        $(window).keydown((event: React.KeyboardEvent) => dispatch(keyPressed(EVENTS.keydown, event)));
        $(window).keyup((event: React.KeyboardEvent) => dispatch(keyPressed(EVENTS.keyup, event)));

        dispatch({
            type: CAPTURE_EVENTS,
            isCapturingEvents: true
        });
    };
}


/**
 * Pauses the collecting of events and enables the keyboard shortcus. But
 * it doesn't removes any other listeners. Basically the remote control
 * session will be still active after the pause action, but no events from the
 * controller side will be captured and sent. You can resume the collecting
 * of the events with the resume action.
 *
 * @returns {Function}
 */
export function pause() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { controller } = state['features/remote-control'];
        const { controlled, isCapturingEvents } = controller;

        if (!isRemoteControlEnabled(state) || !controlled || !isCapturingEvents) {
            return;
        }

        logger.log('Pausing remote control controller.');

        const area = getRemoteConrolEventCaptureArea();

        if (area) {
            area.off('contextmenu');
            area.off('dblclick');
            area.off('mousedown');
            area.off('mousemove');
            area.off('mouseup');
            area[0].onwheel = undefined;
        }

        $(window).off('keydown');
        $(window).off('keyup');

        dispatch({
            type: CAPTURE_EVENTS,
            isCapturingEvents: false
        });
    };
}
