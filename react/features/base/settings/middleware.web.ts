import { IStore } from '../../app/types';
import { PREJOIN_INITIALIZED } from '../../prejoin/actionTypes';
import { setPrejoinPageVisibility } from '../../prejoin/actions';
import { APP_WILL_MOUNT } from '../app/actionTypes';
import { getJwtName } from '../jwt/functions';
import { MEDIA_TYPE } from '../media/constants';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { TRACK_ADDED } from '../tracks/actionTypes';
import { ITrack } from '../tracks/types';

import { updateSettings } from './actions';
import logger from './logger';


import './middleware.any';

/**
 * The middleware of the feature base/settings. Distributes changes to the state
 * of base/settings to the states of other features computed from the state of
 * base/settings.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        _initializeShowPrejoin(store);
        break;
    case PREJOIN_INITIALIZED:
        _maybeUpdateDisplayName(store);
        break;
    case TRACK_ADDED:
        _maybeUpdateDeviceId(store, action.track);
        break;
    }

    return result;
});

/**
 * Overwrites the showPrejoin flag based on cached used selection for showing prejoin screen.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _initializeShowPrejoin({ dispatch, getState }: IStore) {
    const { userSelectedSkipPrejoin } = getState()['features/base/settings'];

    if (userSelectedSkipPrejoin) {
        dispatch(setPrejoinPageVisibility(false));
    }
}

/**
 * Updates the display name to the one in JWT if there is one.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _maybeUpdateDisplayName({ dispatch, getState }: IStore) {
    const state = getState();
    const hasJwt = Boolean(state['features/base/jwt'].jwt);

    if (hasJwt) {
        const displayName = getJwtName(state);

        if (displayName) {
            dispatch(updateSettings({
                displayName
            }));
        }
    }
}

/**
 * Maybe update the camera or mic device id when local track is added or updated.
 *
 * @param {Store} store - The redux store.
 * @param {ITrack} track - The potential local track.
 * @private
 * @returns {void}
 */
function _maybeUpdateDeviceId({ dispatch, getState }: IStore, track: ITrack) {
    if (track.local) {
        const { cameraDeviceId, micDeviceId } = getState()['features/base/settings'];
        const deviceId = track.jitsiTrack.getDeviceId();

        if (track.mediaType === MEDIA_TYPE.VIDEO && track.videoType === 'camera' && cameraDeviceId !== deviceId) {
            dispatch(updateSettings({
                cameraDeviceId: track.jitsiTrack.getDeviceId()
            }));
            logger.info(`switched local video device to: ${deviceId}`);
        } else if (track.mediaType === MEDIA_TYPE.AUDIO && micDeviceId !== deviceId) {
            dispatch(updateSettings({
                micDeviceId: track.jitsiTrack.getDeviceId()
            }));
            logger.info(`switched local audio input device to: ${deviceId}`);
        }
    }
}
