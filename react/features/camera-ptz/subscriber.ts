import { getCurrentConference } from '../base/conference/functions';
import { IJitsiConference } from '../base/conference/reducer';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { CAMERA_PTZ_CAPABILITY_PROPERTY } from './constants';
import { isLocalCameraOfferedForFarEndControl } from './functions';
import logger from './logger';

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
