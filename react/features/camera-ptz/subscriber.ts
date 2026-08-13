import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { IJitsiConference } from '../base/conference/reducer';
import JitsiMeetJS, { browser } from '../base/lib-jitsi-meet';
import { getParticipantDisplayName } from '../base/participants/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { BUTTON_TYPES } from '../base/ui/constants.any';
import { hideNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_ICON, NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import {
    approveCameraControlRequest,
    denyCameraControlRequest,
    updateLocalPtzSupport
} from './actions';
import { CAMERA_CONTROL_NOTIFICATION_ID, CAMERA_PTZ_CAPABILITY_PROPERTY, PTZControlState } from './constants';
import {
    getCameraPtzState,
    getLocalCameraTrack,
    isLocalCameraOfferedForFarEndControl
} from './functions';
import logger from './logger';
import { PTZPermissionState } from './types';

/**
 * Reads what the selected camera can be driven on. The device is probed on every camera change, since the axes are a
 * property of the hardware rather than of the endpoint.
 */
StateListenerRegistry.register(
    state => getLocalCameraTrack(state)?.getDeviceId(),
    (deviceId, store) => _probeCameraAxes(store, deviceId));

/**
 * Advertises an already offered camera on a conference that has just been joined, including one that replaced an
 * earlier conference. There is nothing to withdraw on a conference nobody has seen yet.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { getState }) => {
        conference && isLocalCameraOfferedForFarEndControl(getState()) && _advertise(conference, true);
    });

/**
 * Advertises or withdraws the local camera as the opt in changes during a conference.
 */
StateListenerRegistry.register(
    state => isLocalCameraOfferedForFarEndControl(state),
    (offered, { getState }) => {
        const conference = getCurrentConference(getState());

        conference && _advertise(conference, offered);
    });

/**
 * A request only becomes a grant once the local participant says so, so the ask is put in front of them for as long
 * as it stands. Whatever settles the request takes the notification down, including the timeout that refuses it.
 */
StateListenerRegistry.register(
    state => getCameraPtzState(state).owner.pendingRequest,
    (pendingRequest, { dispatch, getState }) => {
        if (!pendingRequest) {
            dispatch(hideNotification(CAMERA_CONTROL_NOTIFICATION_ID));

            return;
        }

        dispatch(showNotification({
            customActionHandler: [
                () => dispatch(approveCameraControlRequest()),
                () => dispatch(denyCameraControlRequest())
            ],
            customActionNameKey: [ 'dialog.allow', 'dialog.deny' ],
            customActionType: [ BUTTON_TYPES.PRIMARY, BUTTON_TYPES.DESTRUCTIVE ],
            descriptionKey: 'notify.cameraControlRequest',
            icon: NOTIFICATION_ICON.PARTICIPANT,
            title: getParticipantDisplayName(getState(), pendingRequest),
            uid: CAMERA_CONTROL_NOTIFICATION_ID
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
    });

/**
 * Says when a camera that was being driven is no longer under control, since controls going away on their own would
 * otherwise look like a fault.
 */
StateListenerRegistry.register(
    state => getCameraPtzState(state).controller.state,
    (controlState, { dispatch, getState }, previousState) => {
        if (previousState !== PTZControlState.CONTROLLING || controlState === PTZControlState.CONTROLLING) {
            return;
        }

        const { target } = getCameraPtzState(getState()).controller;

        dispatch(showNotification({
            descriptionArguments: { name: target ? getParticipantDisplayName(getState(), target) : '' },
            descriptionKey: 'notify.cameraControlTaken'
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
    });

/**
 * Records the axes the given camera exposes, along with the pan/tilt/zoom permission, which is what decides whether
 * the camera may be presented as controllable at all.
 *
 * @param {IStore} store - The redux store.
 * @param {string} deviceId - The id of the selected camera, if there is one.
 * @returns {void}
 */
function _probeCameraAxes({ dispatch }: IStore, deviceId?: string) {
    if (!deviceId || !browser.supportsCameraPtz?.()) {
        dispatch(updateLocalPtzSupport({ axes: undefined }));

        return;
    }

    dispatch(updateLocalPtzSupport({ axes: JitsiMeetJS.mediaDevices.getCameraPTZCapabilities(deviceId) }));

    JitsiMeetJS.mediaDevices.getCameraPTZPermission()
        .then((permission: PTZPermissionState) => dispatch(updateLocalPtzSupport({ permission })))
        .catch((error: Error) => logger.warn('Could not read the camera PTZ permission', error));
}

/**
 * Publishes whether the local camera is available for far end control, so that remote participants know whether to
 * offer the control affordance.
 *
 * @param {IJitsiConference} conference - The conference to advertise on.
 * @param {boolean} offered - Whether the camera is offered to remote participants.
 * @returns {void}
 */
function _advertise(conference: IJitsiConference, offered: boolean) {
    logger.info(`Local camera ${offered ? 'offered' : 'withdrawn'} for far end control`);
    conference.setLocalParticipantProperty(CAMERA_PTZ_CAPABILITY_PROPERTY, offered);
}
