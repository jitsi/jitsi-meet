// @flow

import { openDialog } from '../base/dialog';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getParticipantDisplayName, getPinnedParticipant, pinParticipant } from '../base/participants';
import { getLocalVideoTrack } from '../base/tracks';
import { showNotification } from '../notifications';

import {
    CAPTURE_EVENTS,
    REMOTE_CONTROL_ACTIVE,
    SET_REQUESTED_PARTICIPANT,
    SET_CONTROLLER,
    SET_RECEIVER_ENABLED,
    SET_RECEIVER_TRANSPORT,
    SET_CONTROLLED_PARTICIPANT
} from './actionTypes';
import { RemoteControlAuthorizationDialog } from './components';
import {
    DISCO_REMOTE_CONTROL_FEATURE,
    EVENTS,
    REMOTE_CONTROL_MESSAGE_NAME,
    PERMISSIONS_ACTIONS,
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
let permissionsReplyListener, receiverEndpointMessageListener, stopListener;

declare var APP: Object;
declare var $: Function;

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
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const { active: oldActive } = state['features/remote-control'];
        const { conference } = state['features/base/conference'];

        if (active !== oldActive) {
            dispatch({
                type: REMOTE_CONTROL_ACTIVE,
                active
            });
            conference.setLocalParticipantProperty('remoteControlSessionStatus', active);
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
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const enabled = isRemoteControlEnabled(state);

        if (!enabled) {
            return Promise.reject(new Error('Remote control is disabled!'));
        }

        dispatch(setRemoteControlActive(true));

        logger.log(`Requsting remote control permissions from: ${userId}`);

        const { conference } = state['features/base/conference'];


        permissionsReplyListener = (participant, event) => {
            dispatch(processPermissionRequestReply(participant.getId(), event));
        };

        conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, permissionsReplyListener);

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
export function processPermissionRequestReply(participantId: string, event: Object) {
    return (dispatch: Function, getState: Function) => {
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

                stopListener = (participant, stopEvent) => {
                    dispatch(handleRemoteControlStoppedEvent(participant.getId(), stopEvent));
                };

                conference.on(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, stopListener);

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
            }));

            if (permissionGranted) {
                // the remote control permissions has been granted
                // pin the controlled participant
                const pinnedParticipant = getPinnedParticipant(state);
                const pinnedId = pinnedParticipant?.id;

                if (pinnedId !== participantId) {
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
export function handleRemoteControlStoppedEvent(participantId: Object, event: Object) {
    return (dispatch: Function, getState: Function) => {
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
export function stopController(notifyRemoteParty: boolean = false) {
    return (dispatch: Function, getState: Function) => {
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

        conference.off(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, stopListener);
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
        }));
    };
}

/**
 * Clears a pending permission request.
 *
 * @returns {Function}
 */
export function clearRequest() {
    return (dispatch: Function, getState: Function) => {
        const { conference } = getState()['features/base/conference'];

        dispatch({
            type: SET_REQUESTED_PARTICIPANT,
            requestedParticipant: undefined
        });

        conference.off(JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED, permissionsReplyListener);
        permissionsReplyListener = undefined;
    };
}


/**
 * Sets that trasnport object that is used by the receiver to communicate with the native part of the remote control
 * implementation.
 *
 * @param {Transport} transport - The transport to be set.
 * @returns {{
 *      type: SET_RECEIVER_TRANSPORT,
 *      transport: Transport
 * }}
 */
export function setReceiverTransport(transport: Object) {
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
    return (dispatch: Function, getState: Function) => {
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
        receiverEndpointMessageListener = (participant, message) => {
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
    return (dispatch: Function, getState: Function) => {
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
export function stopReceiver(dontNotifyLocalParty: boolean = false, dontNotifyRemoteParty: boolean = false) {
    return (dispatch: Function, getState: Function) => {
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

        transport.sendEvent({
            name: REMOTE_CONTROL_MESSAGE_NAME,
            type: EVENTS.stop
        });

        dispatch(setRemoteControlActive(false));

        if (!dontNotifyLocalParty) {
            dispatch(showNotification({
                descriptionKey: 'dialog.remoteControlStopMessage',
                titleKey: 'dialog.remoteControlTitle'
            }));
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
export function endpointMessageReceived(participantId: string, message: Object) {
    return (dispatch: Function, getState: Function) => {
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
                    transport.sendEvent(message);
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
    return (dispatch: Function, getState: Function) => {
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
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const tracks = state['features/base/tracks'];
        const track = getLocalVideoTrack(tracks);
        const { sourceId } = track?.jitsiTrack || {};
        const { transport } = state['features/remote-control'].receiver;

        return transport.sendRequest({
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
    return (dispatch: Function, getState: Function) => {
        dispatch({
            type: SET_CONTROLLER,
            controller: participantId
        });
        logger.log(`Remote control permissions granted to: ${participantId}`);

        let promise;
        const state = getState();
        const tracks = state['features/base/tracks'];
        const track = getLocalVideoTrack(tracks);
        const isScreenSharing = track?.videoType === 'desktop';
        const { sourceType } = track?.jitsiTrack || {};

        if (isScreenSharing && sourceType === 'screen') {
            promise = dispatch(sendStartRequest());
        } else {
            // FIXME: Use action here once toggleScreenSharing is moved to redux.
            promise = APP.conference.toggleScreenSharing(
                true,
                {
                    desktopSharingSources: [ 'screen' ]
                })
                .then(() => dispatch(sendStartRequest()));
        }

        const { conference } = state['features/base/conference'];

        promise
            .then(() => sendRemoteControlEndpointMessage(conference, participantId, {
                type: EVENTS.permissions,
                action: PERMISSIONS_ACTIONS.grant
            }))
            .catch(error => {
                logger.error(error);

                sendRemoteControlEndpointMessage(conference, participantId, {
                    type: EVENTS.permissions,
                    action: PERMISSIONS_ACTIONS.error
                });

                dispatch(showNotification({
                    descriptionKey: 'dialog.startRemoteControlErrorMessage',
                    titleKey: 'dialog.remoteControlTitle'
                }));

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
export function mouseClicked(type: string, event: Object) {
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const { conference } = state['features/base/conference'];
        const { controller } = state['features/remote-control'];

        sendRemoteControlEndpointMessage(conference, controller.controlled, {
            type,
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
export function mouseMoved(event: Object) {
    return (dispatch: Function, getState: Function) => {
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
export function mouseScrolled(event: Object) {
    return (dispatch: Function, getState: Function) => {
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
export function keyPressed(type: string, event: Object) {
    return (dispatch: Function, getState: Function) => {
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
    return (dispatch: Function, getState: Function) => {
        const area = getRemoteConrolEventCaptureArea();
        const state = getState();
        const { controller } = state['features/remote-control'];
        const { controlled, isCapturingEvents } = controller;

        if (!isRemoteControlEnabled(state) || !area || !controlled || isCapturingEvents) {
            return;
        }

        logger.log('Resuming remote control controller.');

        // FIXME: Once the keyboard shortcuts are using react/redux.
        APP.keyboardshortcut.enable(false);

        area.mousemove(event => {
            dispatch(mouseMoved(event));
        });
        area.mousedown(event => dispatch(mouseClicked(EVENTS.mousedown, event)));
        area.mouseup(event => dispatch(mouseClicked(EVENTS.mouseup, event)));
        area.dblclick(event => dispatch(mouseClicked(EVENTS.mousedblclick, event)));
        area.contextmenu(() => false);
        area[0].onmousewheel = event => {
            event.preventDefault();
            event.stopPropagation();
            dispatch(mouseScrolled(event));

            return false;
        };
        $(window).keydown(event => dispatch(keyPressed(EVENTS.keydown, event)));
        $(window).keyup(event => dispatch(keyPressed(EVENTS.keyup, event)));

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
    return (dispatch: Function, getState: Function) => {
        const state = getState();
        const { controller } = state['features/remote-control'];
        const { controlled, isCapturingEvents } = controller;

        if (!isRemoteControlEnabled(state) || !controlled || !isCapturingEvents) {
            return;
        }

        logger.log('Pausing remote control controller.');

        // FIXME: Once the keyboard shortcuts are using react/redux.
        APP.keyboardshortcut.enable(true);

        const area = getRemoteConrolEventCaptureArea();

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

        dispatch({
            type: CAPTURE_EVENTS,
            isCapturingEvents: false
        });
    };
}
