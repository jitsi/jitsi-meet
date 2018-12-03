/* @flow */

import { Alert } from 'react-native';

import { openSettings } from './functions';

import { isRoomValid } from '../../base/conference';
import { MiddlewareRegistry } from '../../base/redux';
import { TRACK_CREATE_ERROR } from '../../base/tracks';

/**
 * Middleware that captures track permission errors and alerts the user so they
 * can enable the permission themselves.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case TRACK_CREATE_ERROR:
        // XXX We do not currently have user interface outside of a conference
        // which the user may tap and cause a permission-related error. If we
        // alert whenever we (intend to) ask for a permission, the scenario of
        // entering the WelcomePage, being asked for the camera permission, me
        // denying it, and being alerted that there is an error is overwhelming
        // me.
        if (action.permissionDenied
                && isRoomValid(
                        store.getState()['features/base/conference'].room)) {
            _alertPermissionErrorWithSettings(action.trackType);
        }
        break;
    }

    return result;
});

/**
 * Shows an alert panel which tells the user they have to manually grant some
 * permissions by opening Settings. A button which opens Settings is provided.
 *
 * @param {string} trackType - Type of track that failed with a permission
 * error.
 * @private
 * @returns {void}
 */
function _alertPermissionErrorWithSettings(trackType) {
    // TODO i18n
    const deviceType = trackType === 'video' ? 'Camera' : 'Microphone';

    /* eslint-disable indent */

    const message
        = `${deviceType
            } permission is required to participate in conferences with ${
            trackType}. Please grant it in Settings.`;

    /* eslint-ensable indent */

    Alert.alert(
        'Permission required',
        message,
        [
            { text: 'Cancel' },
            {
                onPress: openSettings,
                text: 'Settings'
            }
        ],
        { cancelable: false });
}
