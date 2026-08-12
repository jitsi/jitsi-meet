import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { IJitsiConference } from '../base/conference/reducer';
import JitsiMeetJS, { browser } from '../base/lib-jitsi-meet';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { updateLocalPtzSupport } from './actions';
import { CAMERA_PTZ_CAPABILITY_PROPERTY } from './constants';
import { getLocalCameraTrack, isLocalCameraOfferedForFarEndControl } from './functions';
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
